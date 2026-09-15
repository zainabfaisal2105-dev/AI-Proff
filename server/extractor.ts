import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as cheerio from 'cheerio';
import JSZip from 'jszip';
import zlib from 'node:zlib';
import WordExtractor from 'word-extractor';
import { getGemini } from './summarizer';

export interface DocumentSection {
  id: string;
  label: string;
  content: string;
  wordCount: number;
}

export interface ExtractedDocument {
  title: string;
  fileType: string;
  sections: DocumentSection[];
  fullText: string;
  totalWords: number;
  totalCharacters: number;
  metadata?: Record<string, string | number>;
}

/**
 * Thoroughly sanitizes extracted text:
 * 1. Strips binary null bytes (\0).
 * 2. Normalizes page breaks (\f) to clean newlines.
 * 3. Removes non-printable ASCII control characters (0-8, 11, 14-31).
 * 4. Cleans isolated Unicode replacement characters (0xFFFD) into spaces.
 * 5. Normalizes carriage returns and spacing while preserving paragraphs.
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\0/g, '')
    .replace(/\f/g, '\n\n')
    .replace(/[\x01-\x08\x0B\x0E-\x1F]/g, ' ')
    .replace(/\uFFFD+/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

/**
 * Validates whether a text string contains actual un-extracted binary data (e.g. raw ZIP or ELF headers).
 * Guarantees that legitimate documents containing mathematical formulas, foreign characters,
 * quotes, symbols, or exam questions are NEVER falsely flagged.
 */
export function isBinaryOrGarbageText(text: string): boolean {
  if (!text || typeof text !== 'string') return true;
  const sanitized = sanitizeText(text);
  if (sanitized.length === 0) return true;

  // Check for raw un-extracted binary archive/executable signatures
  if (sanitized.startsWith('PK\x03\x04') || sanitized.startsWith('PK\x05\x06') || sanitized.startsWith('PK\x07\x08')) return true;
  if (sanitized.startsWith('\xD0\xCF\x11\xE0') || sanitized.startsWith('7z\xBC\xAF\x27\x1C') || sanitized.startsWith('\x7FELF')) return true;
  if (sanitized.startsWith('%PDF-') && sanitized.length < 500 && sanitized.includes('stream')) return true;

  // Count recognizable linguistic and numeric characters (supports all scripts: Latin, Arabic, CJK, Cyrillic, Greek, etc.)
  const lettersAndDigits = sanitized.match(/[\p{L}\p{N}]/gu) || [];

  // If the document contains at least 6 alphanumeric or linguistic characters, it is valid readable text!
  if (lettersAndDigits.length >= 6) {
    return false;
  }

  return true;
}

/**
 * Cleans and formats raw Word XML, preserving paragraph structure, line breaks, and entity unescaping.
 */
export function cleanWordXml(xml: string): string {
  const withFormatting = xml
    .replace(/<\/w:p>/gi, '\n\n')
    .replace(/<w:br[^>]*>/gi, '\n')
    .replace(/<w:tab[^>]*>/gi, '\t')
    .replace(/<\/w:tr>/gi, '\n')
    .replace(/<\/w:tc>/gi, ' | ');

  const stripped = withFormatting.replace(/<[^>]+>/g, '');
  return stripped
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts text from PDF with multi-layer resilience:
 * Layer 1: pdf-parse v2 PDFParse class & v1 compatibility
 * Layer 2: Gemini multimodal OCR for scanned/image PDFs
 * Layer 3: FlateDecode / zlib stream decompression
 * Layer 4: Raw string extraction
 */
export async function extractFromPdf(buffer: Buffer, originalName: string): Promise<ExtractedDocument> {
  let text = '';
  let numPages = 1;
  const sections: DocumentSection[] = [];

  // 1. Primary: Native PDF parser (pdf-parse v2 & v1 compatible)
  try {
    const pdfModule: any = await import('pdf-parse');
    const PDFParseClass = pdfModule.PDFParse || pdfModule.default?.PDFParse;

    if (typeof PDFParseClass === 'function') {
      const parser = new PDFParseClass({ data: buffer });
      const textRes = await parser.getText();
      if (textRes) {
        text = textRes.text || '';
        numPages = textRes.total || (Array.isArray(textRes.pages) ? textRes.pages.length : 1);
        if (Array.isArray(textRes.pages) && textRes.pages.length > 0) {
          for (const p of textRes.pages) {
            const clean = (p.text || '').replace(/--\s*\d+\s*of\s*\d+\s*--/g, '').trim();
            if (clean && !isBinaryOrGarbageText(clean)) {
              sections.push({
                id: `page-${p.num || sections.length + 1}`,
                label: `Page ${p.num || sections.length + 1}`,
                content: clean,
                wordCount: clean.split(/\s+/).filter(Boolean).length,
              });
            }
          }
        }
      }
      try {
        await parser.destroy();
      } catch {}
    } else {
      const fn = typeof pdfModule === 'function' ? pdfModule : pdfModule.default;
      if (typeof fn === 'function') {
        const data = await fn(buffer);
        text = data.text || '';
        numPages = data.numpages || 1;
      }
    }
  } catch (parseErr: any) {
    console.warn('Native PDF parser encountered error, proceeding to fallback tiers:', parseErr?.message || parseErr);
  }

  // 2. Secondary: If native parser produced little or no text (e.g., scanned PDF, images, or protected fonts),
  // use Gemini multimodal AI OCR
  const currentWords = text.split(/\s+/).filter(Boolean).length;
  if ((currentWords < 15 || isBinaryOrGarbageText(text)) && buffer.length > 0) {
    try {
      const ai = getGemini();
      if (ai) {
        const base64Data = buffer.toString('base64');
        const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];

        for (const modelName of candidateModels) {
          try {
            const res = await ai.models.generateContent({
              model: modelName,
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'application/pdf',
                        data: base64Data,
                      },
                    },
                    {
                      text: 'Extract and transcribe all text from this PDF document verbatim. Format the output with clear section headers like "[Page 1]", "[Page 2]", etc. Preserve all facts, figures, tables, and details accurately.',
                    },
                  ],
                },
              ],
            });

            if (res.text && res.text.trim().length > 10) {
              const sanitizedOcr = sanitizeText(res.text);
              if (!isBinaryOrGarbageText(sanitizedOcr)) {
                text = sanitizedOcr;
                break;
              }
            }
          } catch (mErr: any) {
            console.warn(`Gemini OCR model ${modelName} attempt:`, mErr?.message || mErr);
          }
        }
      }
    } catch (geminiErr: any) {
      console.warn('Gemini multimodal OCR fallback unavailable:', geminiErr?.message || geminiErr);
    }
  }

  // 3. Tertiary: Decompress PDF streams using zlib if text is still missing
  if ((!text.trim() || isBinaryOrGarbageText(text)) && buffer.length > 0) {
    try {
      const str = buffer.toString('latin1');
      const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      let match;
      const pieces: string[] = [];
      while ((match = streamRegex.exec(str)) !== null) {
        const streamBytes = Buffer.from(match[1], 'latin1');
        try {
          const decompressed = zlib.inflateSync(streamBytes).toString('utf-8');
          const tjMatches = decompressed.match(/\(([^)]+)\)/g);
          if (tjMatches) {
            pieces.push(tjMatches.map((t) => t.slice(1, -1)).join(' '));
          }
        } catch {}
      }
      if (pieces.length > 0) {
        const candidate = sanitizeText(pieces.join(' '));
        if (!isBinaryOrGarbageText(candidate)) {
          text = candidate;
        }
      }
    } catch (zlibErr) {
      console.warn('zlib stream decompression error:', zlibErr);
    }
  }

  // 4. Quaternary: Extract printable Latin/UTF-8 strings from binary
  if ((!text.trim() || isBinaryOrGarbageText(text)) && buffer.length > 0) {
    const rawString = buffer.toString('latin1');
    const printableWords = rawString.match(/[\x20-\x7E\t\n\r]{4,}/g) || [];
    const filtered = printableWords.filter(
      (w) => !w.startsWith('/') && !w.startsWith('<<') && !w.startsWith('xref') && !w.startsWith('obj')
    );
    if (filtered.length > 0) {
      const candidate = sanitizeText(filtered.join(' '));
      if (!isBinaryOrGarbageText(candidate)) {
        text = candidate;
      }
    }
  }

  text = sanitizeText(text);

  if (!text.trim() || isBinaryOrGarbageText(text)) {
    throw new Error(`Could not extract readable text from PDF "${originalName}". The PDF may be empty, image-only without OCR access, or password-protected.`);
  }

  // If pages were not captured per-page earlier, chunk into logical sections
  if (sections.length === 0) {
    const rawPages = text.split(/\f|\n(?=\[?Page\s+\d+\]?|---\s*Page\s+\d+\s*---)/i);
    if (rawPages.length > 1) {
      rawPages.forEach((pageText, idx) => {
        const clean = pageText.trim();
        if (clean) {
          sections.push({
            id: `page-${idx + 1}`,
            label: `Page ${idx + 1}`,
            content: clean,
            wordCount: clean.split(/\s+/).filter(Boolean).length,
          });
        }
      });
    } else {
      const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
      let currentChunk = '';
      let sectionIdx = 1;

      for (const para of paragraphs) {
        if (currentChunk.length + para.length > 2500 && currentChunk.length > 0) {
          sections.push({
            id: `sec-${sectionIdx}`,
            label: `Section ${sectionIdx}`,
            content: currentChunk.trim(),
            wordCount: currentChunk.split(/\s+/).filter(Boolean).length,
          });
          sectionIdx++;
          currentChunk = '';
        }
        currentChunk += para + '\n\n';
      }
      if (currentChunk.trim()) {
        sections.push({
          id: `sec-${sectionIdx}`,
          label: `Section ${sectionIdx}`,
          content: currentChunk.trim(),
          wordCount: currentChunk.split(/\s+/).filter(Boolean).length,
        });
      }
    }
  }

  if (sections.length === 0) {
    sections.push({
      id: 'page-1',
      label: 'Page 1',
      content: text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    });
  }

  const cleanFull = sections.map((s) => `[${s.label}]\n${s.content}`).join('\n\n');
  const totalWords = cleanFull.split(/\s+/).filter(Boolean).length;

  return {
    title: originalName.replace(/\.[^/.]+$/, ''),
    fileType: 'pdf',
    sections,
    fullText: cleanFull,
    totalWords: Math.max(totalWords, 1),
    totalCharacters: cleanFull.length,
    metadata: { pages: Math.max(numPages, sections.length) },
  };
}

/**
 * Extracts text from Word documents (.docx, .doc), handling both modern Office OpenXML
 * and legacy Word 97-2004 binary OLE2 formats.
 */
export async function extractFromDocx(buffer: Buffer, originalName: string): Promise<ExtractedDocument> {
  let rawText = '';

  const isOle2 = buffer.length >= 8 &&
    buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;

  // 1. If legacy .doc or OLE2 binary file, use WordExtractor
  if (isOle2 || originalName.toLowerCase().endsWith('.doc')) {
    try {
      const extractor = new WordExtractor();
      const extracted = await extractor.extract(buffer);
      const body = extracted.getBody() || '';
      const headers = extracted.getHeaders() || '';
      const footers = extracted.getFooters() || '';
      const combined = [headers, body, footers].filter(Boolean).join('\n\n').trim();
      if (combined && !isBinaryOrGarbageText(combined)) {
        rawText = combined;
      }
    } catch (oleErr) {
      console.warn('WordExtractor extraction failed, proceeding to fallback tiers:', oleErr);
    }
  }

  // 2. Primary for modern DOCX: Mammoth
  if (!rawText.trim() && !isOle2) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 0 && !isBinaryOrGarbageText(result.value)) {
        rawText = result.value.trim();
      }
    } catch (mammothErr) {
      console.warn('Mammoth extraction failed, trying zip XML fallback:', mammothErr);
    }
  }

  // 3. Secondary for DOCX: Parse XML parts directly via JSZip
  if (!rawText.trim() && !isOle2) {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const xmlParts = ['word/document.xml'];

      // Also gather headers, footers, footnotes, endnotes
      Object.keys(zip.files).forEach((filename) => {
        if (
          (filename.startsWith('word/header') ||
            filename.startsWith('word/footer') ||
            filename.startsWith('word/footnotes') ||
            filename.startsWith('word/endnotes')) &&
          filename.endsWith('.xml')
        ) {
          xmlParts.push(filename);
        }
      });

      const extractedPieces: string[] = [];
      for (const partName of xmlParts) {
        const file = zip.file(partName);
        if (file) {
          const xml = await file.async('text');
          const cleanPiece = cleanWordXml(xml);
          if (cleanPiece && !isBinaryOrGarbageText(cleanPiece)) {
            extractedPieces.push(cleanPiece);
          }
        }
      }

      if (extractedPieces.length > 0) {
        rawText = extractedPieces.join('\n\n');
      }

      // If document still has very few words, check for embedded image scans inside word/media/
      if ((!rawText.trim() || rawText.split(/\s+/).filter(Boolean).length < 15)) {
        const mediaFiles = Object.keys(zip.files).filter(
          (f) => f.startsWith('word/media/') && (f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.webp'))
        );
        if (mediaFiles.length > 0) {
          const ai = getGemini();
          if (ai) {
            const ocrPieces: string[] = [];
            for (const mf of mediaFiles.slice(0, 10)) {
              const imgFile = zip.file(mf);
              if (imgFile) {
                const imgBuf = await imgFile.async('nodebuffer');
                const mime = mf.endsWith('.png') ? 'image/png' : 'image/jpeg';
                try {
                  const imgRes = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [
                      {
                        role: 'user',
                        parts: [
                          { inlineData: { mimeType: mime, data: imgBuf.toString('base64') } },
                          { text: 'Transcribe all visible text, questions, and content from this image verbatim.' },
                        ],
                      },
                    ],
                  });
                  if (imgRes.text && imgRes.text.trim().length > 5) {
                    ocrPieces.push(sanitizeText(imgRes.text));
                  }
                } catch (imgErr) {
                  console.warn(`Docx image OCR failed for ${mf}:`, imgErr);
                }
              }
            }
            if (ocrPieces.length > 0) {
              rawText = (rawText ? rawText + '\n\n' : '') + ocrPieces.join('\n\n');
            }
          }
        }
      }
    } catch (zipErr) {
      console.warn('DOCX zip XML fallback failed:', zipErr);
    }
  }

  // 4. Tertiary: Scan for UTF-16LE text sequences (common in Word binary documents)
  if (!rawText.trim()) {
    const utf16Runs: string[] = [];
    for (let i = 0; i < buffer.length - 12; i += 2) {
      let run = '';
      while (i < buffer.length - 1 && buffer[i + 1] === 0x00 && buffer[i] >= 0x20 && buffer[i] <= 0x7E) {
        run += String.fromCharCode(buffer[i]);
        i += 2;
      }
      if (run.length >= 10) {
        utf16Runs.push(run);
      }
    }
    if (utf16Runs.length > 0) {
      const candidate = sanitizeText(utf16Runs.join(' '));
      if (!isBinaryOrGarbageText(candidate)) {
        rawText = candidate;
      }
    }
  }

  // 5. Quaternary: Extract clean Latin text
  if (!rawText.trim()) {
    const raw = buffer.toString('latin1');
    const words = raw.match(/[\x20-\x7E\t\n\r]{4,}/g) || [];
    const filtered = words.filter((w) => !w.startsWith('/') && !w.startsWith('<<') && !w.startsWith('PK'));
    const candidate = sanitizeText(filtered.join(' '));
    if (candidate && !isBinaryOrGarbageText(candidate)) {
      rawText = candidate;
    }
  }

  rawText = sanitizeText(rawText);

  // Guard: NEVER return binary garbage or empty text
  if (!rawText.trim() || isBinaryOrGarbageText(rawText)) {
    throw new Error(`Could not extract readable text from "${originalName}". The Word document may be empty, encrypted, or corrupted.`);
  }

  const sections: DocumentSection[] = [];
  const paragraphs = rawText.split(/\n\s*\n/).filter((p) => p.trim());
  let currentChunk = '';
  let sectionIdx = 1;

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > 2500 && currentChunk.length > 0) {
      sections.push({
        id: `sec-${sectionIdx}`,
        label: `Section ${sectionIdx}`,
        content: currentChunk.trim(),
        wordCount: currentChunk.split(/\s+/).filter(Boolean).length,
      });
      sectionIdx++;
      currentChunk = '';
    }
    currentChunk += para + '\n\n';
  }
  if (currentChunk.trim()) {
    sections.push({
      id: `sec-${sectionIdx}`,
      label: `Section ${sectionIdx}`,
      content: currentChunk.trim(),
      wordCount: currentChunk.split(/\s+/).filter(Boolean).length,
    });
  }

  if (sections.length === 0) {
    sections.push({
      id: 'sec-1',
      label: 'Document Content',
      content: rawText,
      wordCount: rawText.split(/\s+/).filter(Boolean).length,
    });
  }

  const fullText = sections.map((s) => `[${s.label}]\n${s.content}`).join('\n\n');
  return {
    title: originalName.replace(/\.[^/.]+$/, ''),
    fileType: 'docx',
    sections,
    fullText,
    totalWords: Math.max(fullText.split(/\s+/).filter(Boolean).length, 1),
    totalCharacters: fullText.length,
  };
}

/**
 * Extracts text from PowerPoint presentations (.pptx, .ppt).
 */
export async function extractFromPptx(buffer: Buffer, originalName: string): Promise<ExtractedDocument> {
  const sections: DocumentSection[] = [];
  let slideCount = 0;

  try {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files).filter((filename) =>
      filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')
    );

    // Sort slides numerically: slide1.xml, slide2.xml, ...
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      return numA - numB;
    });

    slideCount = slideFiles.length;

    for (let i = 0; i < slideFiles.length; i++) {
      const filename = slideFiles[i];
      const xml = await zip.files[filename].async('text');
      const matches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
      const texts = matches.map((m) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);

      // Also check for speaker notes
      let notes = '';
      const notesFile = zip.files[`ppt/notesSlides/notesSlide${i + 1}.xml`];
      if (notesFile) {
        const notesXml = await notesFile.async('text');
        const noteMatches = notesXml.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
        notes = noteMatches.map((m) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean).join(' ');
      }

      const slideContent = [texts.join(' '), notes ? `Speaker Notes: ${notes}` : ''].filter(Boolean).join('\n\n');

      if (slideContent.trim() && !isBinaryOrGarbageText(slideContent)) {
        sections.push({
          id: `slide-${i + 1}`,
          label: `Slide ${i + 1}`,
          content: slideContent,
          wordCount: slideContent.split(/\s+/).filter(Boolean).length,
        });
      }
    }

    // If no slide files were found, scan all XML files in the zip for text
    if (sections.length === 0) {
      const xmlFiles = Object.keys(zip.files).filter((f) => f.endsWith('.xml'));
      let combinedXmlText = '';
      for (const xf of xmlFiles) {
        const content = await zip.files[xf].async('text');
        const matches = content.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
        const texts = matches.map((m) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
        if (texts.length > 0) {
          combinedXmlText += texts.join(' ') + '\n\n';
        }
      }
      if (combinedXmlText.trim() && !isBinaryOrGarbageText(combinedXmlText)) {
        sections.push({
          id: 'slide-1',
          label: 'Presentation Content',
          content: combinedXmlText.trim(),
          wordCount: combinedXmlText.split(/\s+/).filter(Boolean).length,
        });
      }
    }
  } catch (zipErr) {
    console.warn('PPTX zip parsing error:', zipErr);
  }

  // Binary text fallback for legacy .ppt
  if (sections.length === 0) {
    const raw = buffer.toString('latin1');
    const words = raw.match(/[\x20-\x7E\t\n\r]{4,}/g) || [];
    const text = words.join(' ').replace(/\s+/g, ' ').trim();
    if (text && !isBinaryOrGarbageText(text)) {
      sections.push({
        id: 'slide-1',
        label: 'Slide 1',
        content: text,
        wordCount: text.split(/\s+/).filter(Boolean).length,
      });
    }
  }

  if (sections.length === 0) {
    throw new Error(`Could not extract readable text from presentation "${originalName}".`);
  }

  const fullText = sections.map((s) => `[${s.label}]\n${s.content}`).join('\n\n');
  return {
    title: originalName.replace(/\.[^/.]+$/, ''),
    fileType: 'pptx',
    sections,
    fullText,
    totalWords: Math.max(fullText.split(/\s+/).filter(Boolean).length, 1),
    totalCharacters: fullText.length,
    metadata: { totalSlides: Math.max(slideCount, sections.length) },
  };
}

/**
 * Extracts text from OpenDocument files (.odt, .ods, .odp).
 */
export async function extractFromOdf(buffer: Buffer, originalName: string): Promise<ExtractedDocument> {
  const zip = await JSZip.loadAsync(buffer);
  const contentFile = zip.file('content.xml');
  if (!contentFile) {
    throw new Error(`Invalid OpenDocument archive: content.xml not found in ${originalName}`);
  }

  const xml = await contentFile.async('text');
  const formatted = xml
    .replace(/<\/text:p>/gi, '\n\n')
    .replace(/<\/text:h[^>]*>/gi, '\n\n')
    .replace(/<text:line-break[^>]*>/gi, '\n')
    .replace(/<text:tab[^>]*>/gi, '\t')
    .replace(/<text:s text:c="(\d+)"\/>/gi, (_, count) => ' '.repeat(parseInt(count, 10)))
    .replace(/<[^>]+>/g, '');

  const clean = formatted
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!clean || isBinaryOrGarbageText(clean)) {
    throw new Error(`Could not extract readable text from OpenDocument file: ${originalName}`);
  }

  return extractFromText(clean, originalName);
}

/**
 * Extracts text from EPUB electronic book files.
 */
export async function extractFromEpub(buffer: Buffer, originalName: string): Promise<ExtractedDocument> {
  const zip = await JSZip.loadAsync(buffer);
  const xhtmlFiles = Object.keys(zip.files).filter(
    (name) => (name.endsWith('.xhtml') || name.endsWith('.html') || name.endsWith('.htm')) && !name.includes('toc')
  );
  xhtmlFiles.sort();

  const sections: DocumentSection[] = [];
  let sectionIdx = 1;

  for (const filename of xhtmlFiles) {
    const file = zip.file(filename);
    if (!file) continue;
    const content = await file.async('text');
    const $ = cheerio.load(content);
    $('script, style, noscript').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    if (text && text.length > 50 && !isBinaryOrGarbageText(text)) {
      sections.push({
        id: `chap-${sectionIdx}`,
        label: `Chapter ${sectionIdx}`,
        content: text,
        wordCount: text.split(/\s+/).filter(Boolean).length,
      });
      sectionIdx++;
    }
  }

  if (sections.length === 0) {
    throw new Error(`Could not extract readable chapters from EPUB: ${originalName}`);
  }

  const fullText = sections.map((s) => `[${s.label}]\n${s.content}`).join('\n\n');
  return {
    title: originalName.replace(/\.[^/.]+$/, ''),
    fileType: 'epub',
    sections,
    fullText,
    totalWords: fullText.split(/\s+/).filter(Boolean).length,
    totalCharacters: fullText.length,
    metadata: { totalChapters: sections.length },
  };
}

/**
 * Extracts text from Rich Text Format (.rtf) files.
 */
export function extractFromRtf(buffer: Buffer, originalName: string): ExtractedDocument {
  const rawRtf = buffer.toString('latin1');
  const text = rawRtf
    .replace(/\\par[d]?/gi, '\n')
    .replace(/\\tab/gi, '\t')
    .replace(/\\line/gi, '\n')
    .replace(/\\[a-zA-Z]+-?\d* ?/g, '')
    .replace(/[{}]/g, '')
    .replace(/\\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!text || isBinaryOrGarbageText(text)) {
    throw new Error(`Could not extract readable text from RTF file: ${originalName}`);
  }
  return extractFromText(text, originalName);
}

/**
 * Extracts text from ZIP archives containing documents.
 */
export async function extractFromZipArchive(buffer: Buffer, originalName: string): Promise<ExtractedDocument> {
  const zip = await JSZip.loadAsync(buffer);
  const sections: DocumentSection[] = [];
  let sectionIdx = 1;

  for (const filename of Object.keys(zip.files)) {
    const file = zip.file(filename);
    if (!file || file.dir) continue;
    const lower = filename.toLowerCase();
    if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.csv') || lower.endsWith('.json')) {
      const text = await file.async('text');
      if (text.trim() && !isBinaryOrGarbageText(text)) {
        sections.push({
          id: `file-${sectionIdx}`,
          label: filename,
          content: text.trim(),
          wordCount: text.split(/\s+/).filter(Boolean).length,
        });
        sectionIdx++;
      }
    }
  }

  if (sections.length === 0) {
    throw new Error(`The uploaded ZIP archive "${originalName}" does not contain any recognizable text documents.`);
  }

  const fullText = sections.map((s) => `[${s.label}]\n${s.content}`).join('\n\n');
  return {
    title: originalName.replace(/\.[^/.]+$/, ''),
    fileType: 'zip',
    sections,
    fullText,
    totalWords: fullText.split(/\s+/).filter(Boolean).length,
    totalCharacters: fullText.length,
    metadata: { fileCount: sections.length },
  };
}

/**
 * Extracts text from spreadsheets (.xlsx, .xls, .csv, .tsv).
 */
export async function extractFromSpreadsheet(buffer: Buffer, originalName: string, isCsv: boolean): Promise<ExtractedDocument> {
  const sections: DocumentSection[] = [];

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csvContent = XLSX.utils.sheet_to_csv(sheet);
      if (!csvContent.trim()) continue;

      const lines = csvContent.split('\n').filter((l) => l.trim());
      if (lines.length === 0) continue;

      const headers = lines[0];
      const chunkSize = 50;
      for (let r = 1; r < lines.length; r += chunkSize) {
        const chunkRows = lines.slice(r, r + chunkSize);
        const startRow = r + 1;
        const endRow = Math.min(r + chunkSize, lines.length);
        const label =
          workbook.SheetNames.length > 1
            ? `Sheet "${sheetName}", rows ${startRow}-${endRow}`
            : `Rows ${startRow}-${endRow}`;

        const content = `Headers: ${headers}\nData:\n` + chunkRows.join('\n');
        if (!isBinaryOrGarbageText(content)) {
          sections.push({
            id: `sheet-${sheetName}-r${startRow}`,
            label,
            content,
            wordCount: content.split(/\s+/).filter(Boolean).length,
          });
        }
      }
    }
  } catch (xlsxErr) {
    console.warn('XLSX parsing error:', xlsxErr);
  }

  if (sections.length === 0) {
    // If it was CSV, attempt raw UTF-8 parsing
    if (isCsv) {
      const raw = buffer.toString('utf-8');
      if (raw.trim() && !isBinaryOrGarbageText(raw)) {
        return extractFromText(raw, originalName);
      }
    }
    throw new Error(`Could not extract readable tabular data from spreadsheet: ${originalName}`);
  }

  const fullText = sections.map((s) => `[${s.label}]\n${s.content}`).join('\n\n');
  return {
    title: originalName.replace(/\.[^/.]+$/, ''),
    fileType: isCsv ? 'csv' : 'xlsx',
    sections,
    fullText,
    totalWords: Math.max(fullText.split(/\s+/).filter(Boolean).length, 1),
    totalCharacters: fullText.length,
  };
}

export function extractFromText(rawText: string, title = 'Document'): ExtractedDocument {
  const clean = sanitizeText(rawText);
  if (!clean || isBinaryOrGarbageText(clean)) {
    throw new Error(`Document "${title}" contains unreadable data or is empty.`);
  }

  const sections: DocumentSection[] = [];
  const paragraphs = clean.split(/\n\s*\n/).filter((p) => p.trim());
  let currentChunk = '';
  let sectionIdx = 1;

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > 2500 && currentChunk.length > 0) {
      sections.push({
        id: `sec-${sectionIdx}`,
        label: `Section ${sectionIdx}`,
        content: currentChunk.trim(),
        wordCount: currentChunk.split(/\s+/).filter(Boolean).length,
      });
      sectionIdx++;
      currentChunk = '';
    }
    currentChunk += para + '\n\n';
  }
  if (currentChunk.trim()) {
    sections.push({
      id: `sec-${sectionIdx}`,
      label: `Section ${sectionIdx}`,
      content: currentChunk.trim(),
      wordCount: currentChunk.split(/\s+/).filter(Boolean).length,
    });
  }

  if (sections.length === 0) {
    sections.push({
      id: 'sec-1',
      label: 'Document Content',
      content: clean,
      wordCount: clean.split(/\s+/).filter(Boolean).length,
    });
  }

  const fullText = sections.map((s) => `[${s.label}]\n${s.content}`).join('\n\n');
  return {
    title: title.trim() || 'Document',
    fileType: 'txt',
    sections,
    fullText,
    totalWords: Math.max(fullText.split(/\s+/).filter(Boolean).length, 1),
    totalCharacters: fullText.length,
  };
}

/**
 * Extracts text and data from image files (PNG, JPG, JPEG, WEBP, BMP, TIFF) using Gemini Multimodal OCR.
 * Accurately transcribes tests, quizzes, exam papers, scanned questions, and tables verbatim.
 */
export async function extractFromImage(
  buffer: Buffer,
  originalName: string,
  mimeType?: string
): Promise<ExtractedDocument> {
  const ai = getGemini();
  if (!ai) {
    throw new Error('AI extraction service is not configured. Please ensure GEMINI_API_KEY is available.');
  }

  const ext = (originalName ? originalName.slice(originalName.lastIndexOf('.')) : '').toLowerCase();
  let detectedMime = mimeType;
  if (!detectedMime || !detectedMime.startsWith('image/')) {
    if (ext === '.png') detectedMime = 'image/png';
    else if (ext === '.webp') detectedMime = 'image/webp';
    else if (ext === '.gif') detectedMime = 'image/gif';
    else detectedMime = 'image/jpeg';
  }

  const base64Data = buffer.toString('base64');
  let transcribed = '';
  const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];

  for (const modelName of candidateModels) {
    try {
      const res = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: detectedMime,
                  data: base64Data,
                },
              },
              {
                text: 'Carefully transcribe all visible text, questions, options, headings, numbers, tables, and content from this document/image verbatim. Do not summarize or skip anything. Format with clear headings for any sections or questions.',
              },
            ],
          },
        ],
      });

      if (res.text && res.text.trim().length > 0) {
        const cleaned = sanitizeText(res.text);
        if (!cleaned.startsWith('NO_TEXT') && !isBinaryOrGarbageText(cleaned)) {
          transcribed = cleaned;
          break;
        }
      }
    } catch (err: any) {
      console.warn(`Gemini image OCR model ${modelName} attempt:`, err?.message || err);
    }
  }

  if (!transcribed || isBinaryOrGarbageText(transcribed)) {
    throw new Error(`Could not detect readable text in "${originalName}". Please ensure the image or test is clear and legible.`);
  }

  const extracted = extractFromText(transcribed, originalName);
  extracted.fileType = 'image';
  return extracted;
}

/**
 * Universal document buffer extractor with magic byte detection, format routing,
 * and strict binary/garbage verification.
 */
export async function extractDocumentBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType?: string
): Promise<ExtractedDocument> {
  if (!buffer || buffer.length === 0) {
    throw new Error('The uploaded file is empty (0 bytes). Please upload a valid document.');
  }

  const ext = (originalName ? originalName.slice(originalName.lastIndexOf('.')) : '').toLowerCase();

  // 1. Magic byte & image signature detection
  const pdfMagicIndex = buffer.indexOf(Buffer.from('%PDF-'));
  const isPdf = (pdfMagicIndex !== -1 && pdfMagicIndex < 2048) || ext === '.pdf' || mimeType === 'application/pdf';

  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isWebp = buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && buffer.slice(8, 12).toString() === 'WEBP';
  const isBmp = buffer.length >= 2 && buffer[0] === 0x42 && buffer[1] === 0x4d;
  const isGif = buffer.length >= 3 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
  const isImage = isJpeg || isPng || isWebp || isBmp || isGif ||
    ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.tif', '.tiff'].includes(ext) ||
    (mimeType ? mimeType.startsWith('image/') : false);

  // ZIP / OpenXML: PK\x03\x04 or PK\x05\x06 or PK\x07\x08
  const isZip = buffer.length >= 4 &&
    buffer[0] === 0x50 && buffer[1] === 0x4b &&
    ((buffer[2] === 0x03 && buffer[3] === 0x04) ||
      (buffer[2] === 0x05 && buffer[3] === 0x06) ||
      (buffer[2] === 0x07 && buffer[3] === 0x08));

  // OLE2 (Compound Document): 0xD0 0xCF 0x11 0xE0
  const isOle2 = buffer.length >= 4 &&
    buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;

  // RTF: {\rtf
  const isRtf = buffer.length >= 5 &&
    buffer[0] === 0x7b && buffer[1] === 0x5c && buffer[2] === 0x72 && buffer[3] === 0x74 && buffer[4] === 0x66;

  let extracted: ExtractedDocument;

  if (isImage) {
    extracted = await extractFromImage(buffer, originalName, mimeType);
  } else if (isPdf) {
    try {
      extracted = await extractFromPdf(buffer, originalName);
    } catch (pdfErr: any) {
      console.warn('extractFromPdf failed, trying direct Gemini OCR:', pdfErr?.message || pdfErr);
      const ai = getGemini();
      if (ai) {
        const ocrRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType: 'application/pdf', data: buffer.toString('base64') } },
                { text: 'Extract and transcribe all text, questions, and content from this document verbatim.' },
              ],
            },
          ],
        });
        if (ocrRes.text && ocrRes.text.trim().length > 10) {
          extracted = extractFromText(ocrRes.text, originalName);
        } else {
          throw pdfErr;
        }
      } else {
        throw pdfErr;
      }
    }
  } else if (isZip) {
    // Inspect zip to determine exact Office / OpenDoc format
    try {
      const zip = await JSZip.loadAsync(buffer);
      const fileNames = Object.keys(zip.files);
      const hasWord = fileNames.some((f) => f.startsWith('word/document.xml'));
      const hasPpt = fileNames.some((f) => f.startsWith('ppt/presentation.xml') || f.startsWith('ppt/slides/'));
      const hasXls = fileNames.some((f) => f.startsWith('xl/workbook.xml') || f.startsWith('xl/worksheets/'));
      const hasOdf = fileNames.some((f) => f === 'content.xml');
      const hasEpub = fileNames.some((f) => f === 'META-INF/container.xml');

      if (hasWord || ext === '.docx') {
        extracted = await extractFromDocx(buffer, originalName);
      } else if (hasPpt || ext === '.pptx') {
        extracted = await extractFromPptx(buffer, originalName);
      } else if (hasXls || ext === '.xlsx') {
        extracted = await extractFromSpreadsheet(buffer, originalName, false);
      } else if (hasOdf || ['.odt', '.ods', '.odp'].includes(ext)) {
        extracted = await extractFromOdf(buffer, originalName);
      } else if (hasEpub || ext === '.epub') {
        extracted = await extractFromEpub(buffer, originalName);
      } else if (ext === '.docx' || ext === '.doc') {
        extracted = await extractFromDocx(buffer, originalName);
      } else if (ext === '.pptx' || ext === '.ppt') {
        extracted = await extractFromPptx(buffer, originalName);
      } else if (ext === '.xlsx' || ext === '.xls') {
        extracted = await extractFromSpreadsheet(buffer, originalName, false);
      } else {
        extracted = await extractFromZipArchive(buffer, originalName);
      }
    } catch (zipErr: any) {
      console.warn('Zip inspection failed, attempting DOCX fallback:', zipErr?.message || zipErr);
      extracted = await extractFromDocx(buffer, originalName);
    }
  } else if (isOle2) {
    if (ext === '.xls' || ext === '.xlsx') {
      extracted = await extractFromSpreadsheet(buffer, originalName, false);
    } else {
      extracted = await extractFromDocx(buffer, originalName);
    }
  } else if (isRtf || ext === '.rtf') {
    extracted = extractFromRtf(buffer, originalName);
  } else if (['.docx', '.doc'].includes(ext)) {
    extracted = await extractFromDocx(buffer, originalName);
  } else if (['.pptx', '.ppt'].includes(ext)) {
    extracted = await extractFromPptx(buffer, originalName);
  } else if (['.xlsx', '.xls'].includes(ext)) {
    extracted = await extractFromSpreadsheet(buffer, originalName, false);
  } else if (['.csv', '.tsv'].includes(ext)) {
    extracted = await extractFromSpreadsheet(buffer, originalName, true);
  } else if (['.txt', '.md', '.markdown', '.json', '.html', '.xml', '.log', '.tex'].includes(ext) || mimeType?.startsWith('text/')) {
    let text = sanitizeText(buffer.toString('utf-8'));
    if (isBinaryOrGarbageText(text)) {
      const latinText = sanitizeText(buffer.toString('latin1'));
      if (!isBinaryOrGarbageText(latinText)) {
        text = latinText;
      }
    }
    extracted = extractFromText(text, originalName);
  } else {
    // Attempt decoding as UTF-8 or Latin-1 text
    const rawUtf8 = sanitizeText(buffer.toString('utf-8'));
    if (!isBinaryOrGarbageText(rawUtf8) && rawUtf8.trim().length > 0) {
      extracted = extractFromText(rawUtf8, originalName);
    } else {
      const rawLatin = sanitizeText(buffer.toString('latin1'));
      if (!isBinaryOrGarbageText(rawLatin) && rawLatin.trim().length > 0) {
        extracted = extractFromText(rawLatin, originalName);
      } else {
        // Attempt image OCR fallback in case it's an unrecognized image format
        try {
          extracted = await extractFromImage(buffer, originalName, mimeType);
        } catch {
          throw new Error(
            `Unsupported or unreadable file format for "${originalName}". Please upload a PDF, Word document (DOCX/DOC), Image (PNG/JPG), PowerPoint (PPTX), Excel sheet (XLSX/CSV), or plain text file.`
          );
        }
      }
    }
  }

  // Sanitize all extracted sections and fullText
  extracted.fullText = sanitizeText(extracted.fullText);
  if (extracted.sections) {
    extracted.sections = extracted.sections.map((s) => ({
      ...s,
      content: sanitizeText(s.content),
      wordCount: sanitizeText(s.content).split(/\s+/).filter(Boolean).length,
    }));
  }

  if (!extracted || !extracted.fullText || extracted.fullText.trim().length === 0) {
    throw new Error(`Could not extract readable text from "${originalName}". The document appears to be empty.`);
  }

  if (isBinaryOrGarbageText(extracted.fullText)) {
    throw new Error(`Could not extract readable text from "${originalName}". The file content is in an unreadable binary format.`);
  }

  return extracted;
}

export async function extractFromUrl(url: string): Promise<ExtractedDocument> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid URL protocol');
    }
  } catch {
    throw new Error('Invalid URL format. Please provide a valid http or https web link.');
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, iframes, nav, footer, ads
    $('script, style, iframe, nav, footer, header, noscript, svg, [role="banner"], [role="navigation"], .ads, .ad').remove();

    const pageTitle = $('title').text().trim() || $('h1').first().text().trim() || parsedUrl.hostname;

    // Collect structured sections
    const sections: DocumentSection[] = [];
    let sectionIdx = 1;

    const mainContainer = $('article').length ? $('article') : $('main').length ? $('main') : $('body');
    let currentHeading = 'Introduction';
    let currentParagraphs: string[] = [];

    mainContainer.find('h1, h2, h3, h4, p, li, blockquote').each((_, el) => {
      const tag = el.tagName.toLowerCase();
      const text = $(el).text().trim();
      if (!text) return;

      if (['h1', 'h2', 'h3'].includes(tag)) {
        if (currentParagraphs.length > 0) {
          const content = currentParagraphs.join('\n\n');
          sections.push({
            id: `sec-${sectionIdx}`,
            label: `Web Section: ${currentHeading}`,
            content,
            wordCount: content.split(/\s+/).filter(Boolean).length,
          });
          sectionIdx++;
          currentParagraphs = [];
        }
        currentHeading = text.slice(0, 50);
      } else {
        currentParagraphs.push(text);
      }
    });

    if (currentParagraphs.length > 0) {
      const content = currentParagraphs.join('\n\n');
      sections.push({
        id: `sec-${sectionIdx}`,
        label: `Web Section: ${currentHeading}`,
        content,
        wordCount: content.split(/\s+/).filter(Boolean).length,
      });
    }

    if (sections.length === 0) {
      const bodyText = mainContainer.text().replace(/\s+/g, ' ').trim();
      if (!bodyText || bodyText.length < 50 || isBinaryOrGarbageText(bodyText)) {
        throw new Error('The webpage content is too short or protected by client-side JavaScript.');
      }
      return extractFromText(bodyText, pageTitle);
    }

    const fullText = sections.map((s) => `[${s.label}]\n${s.content}`).join('\n\n');
    return {
      title: pageTitle,
      fileType: 'url',
      sections,
      fullText,
      totalWords: fullText.split(/\s+/).filter(Boolean).length,
      totalCharacters: fullText.length,
      metadata: { sourceUrl: url },
    };
  } catch (err: any) {
    console.error('URL extraction error:', err);
    throw new Error('Unable to access this source. Please upload the document or paste its contents instead.');
  }
}

