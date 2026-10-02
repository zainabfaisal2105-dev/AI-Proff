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

export interface ExtractionQuality {
  isValid: boolean;
  garbageRatio: number;
  meaningfulChars: number;
  hasZipOrXmlMarkers: boolean;
  reason?: string;
}

/**
 * Computes extraction quality metrics and validates readable plain text:
 * 1. Rejects raw zip / OpenXML binary archive markers ([Content_Types].xml, PK, ppt/slides/, word/document.xml, etc.).
 * 2. Checks garbage ratio: proportion of characters that are \uFFFD, control characters, or non-linguistic/symbol bytes.
 * 3. Enforces minimum meaningful character threshold (>= 50 alphanumeric characters).
 */
export function evaluateExtractionQuality(text: string): ExtractionQuality {
  if (!text || typeof text !== 'string') {
    return { isValid: false, garbageRatio: 1, meaningfulChars: 0, hasZipOrXmlMarkers: false, reason: 'Empty text' };
  }
  const sanitized = sanitizeText(text);
  if (sanitized.length === 0) {
    return { isValid: false, garbageRatio: 1, meaningfulChars: 0, hasZipOrXmlMarkers: false, reason: 'Empty text after sanitization' };
  }

  // Reject text containing zip/OpenXML markers or raw archive headers
  const zipMarkers = [
    '[Content_Types].xml',
    'ppt/slides/',
    'ppt/presentation.xml',
    'word/document.xml',
    'xl/worksheets/',
    'xl/sharedStrings.xml',
    '_rels/.rels',
    'PK\x03\x04',
    'PK\x05\x06',
    'PK\x07\x08',
    '\xD0\xCF\x11\xE0',
    '7z\xBC\xAF\x27\x1C',
    '\x7FELF',
  ];
  const hasZipOrXmlMarkers = zipMarkers.some((m) => sanitized.includes(m)) || sanitized.startsWith('PK');

  if (hasZipOrXmlMarkers) {
    return {
      isValid: false,
      garbageRatio: 1,
      meaningfulChars: 0,
      hasZipOrXmlMarkers: true,
      reason: 'Contains raw archive/OpenXML file structures or unparsed zip markers',
    };
  }

  // Count meaningful linguistic/numeric characters across all Unicode scripts
  const lettersAndDigits = sanitized.match(/[\p{L}\p{N}]/gu) || [];
  const meaningfulChars = lettersAndDigits.length;

  // Compute garbage character count
  let garbageCount = 0;
  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized[i];
    const code = sanitized.charCodeAt(i);
    if (
      char === '\uFFFD' ||
      (code < 32 && code !== 9 && code !== 10 && code !== 13) ||
      (code >= 127 && code <= 159) ||
      !/[\p{L}\p{N}\p{P}\p{Z}\p{S}\s]/u.test(char)
    ) {
      garbageCount++;
    }
  }

  const garbageRatio = sanitized.length > 0 ? garbageCount / sanitized.length : 1;

  if (meaningfulChars < 50) {
    return {
      isValid: false,
      garbageRatio,
      meaningfulChars,
      hasZipOrXmlMarkers: false,
      reason: `Insufficient meaningful characters (${meaningfulChars} < 50)`,
    };
  }

  if (garbageRatio > 0.10) {
    return {
      isValid: false,
      garbageRatio,
      meaningfulChars,
      hasZipOrXmlMarkers: false,
      reason: `Garbage character ratio too high (${(garbageRatio * 100).toFixed(1)}% > 10%)`,
    };
  }

  return {
    isValid: true,
    garbageRatio,
    meaningfulChars,
    hasZipOrXmlMarkers: false,
  };
}

/**
 * Validates whether a text string contains actual un-extracted binary data or fails the quality gate.
 */
export function isBinaryOrGarbageText(text: string): boolean {
  return !evaluateExtractionQuality(text).isValid;
}

/**
 * Unescapes standard XML entities into plain characters.
 */
export function decodeXmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
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
 * and legacy Word 97-2004 binary OLE2 formats, as well as RTF/HTML saved with .doc extension.
 */
export async function extractFromDocx(buffer: Buffer, originalName: string): Promise<ExtractedDocument> {
  let rawText = '';

  const isRtf = (buffer.length >= 5 && buffer.slice(0, 5).toString('ascii') === '{\\rtf') ||
    buffer.slice(0, 40).toString('ascii').includes('{\\rtf');
  if (isRtf) {
    try {
      return extractFromRtf(buffer, originalName);
    } catch (rtfErr) {
      console.warn('RTF extraction from .doc failed, continuing fallback:', rtfErr);
    }
  }

  const headSlice = buffer.slice(0, 1024).toString('utf-8').toLowerCase();
  const isHtml = headSlice.includes('<html') || headSlice.includes('<!doctype') || headSlice.includes('<table');
  if (isHtml) {
    try {
      const $ = cheerio.load(buffer.toString('utf-8'));
      $('script, style, svg, noscript').remove();
      const htmlText = $('body').text() || $.text();
      const clean = sanitizeText(htmlText);
      if (clean && !isBinaryOrGarbageText(clean)) {
        return extractFromText(clean, originalName);
      }
    } catch (htmlErr) {
      console.warn('HTML extraction from .doc failed, continuing fallback:', htmlErr);
    }
  }

  const isZip = buffer.length >= 4 &&
    buffer[0] === 0x50 && buffer[1] === 0x4B &&
    ((buffer[2] === 0x03 && buffer[3] === 0x04) ||
      (buffer[2] === 0x05 && buffer[3] === 0x06) ||
      (buffer[2] === 0x07 && buffer[3] === 0x08));

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
  if (!rawText.trim()) {
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
  if (!rawText.trim() && isZip) {
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

  // 4. Tertiary: Robust scan for UTF-16LE text runs across both even and odd byte offsets (Legacy binary .doc only, never for ZIP-based formats)
  if ((!rawText.trim() || isBinaryOrGarbageText(rawText)) && !isZip && !originalName.toLowerCase().endsWith('.docx')) {
    const utf16Runs: string[] = [];
    const ignoredTokens = new Set([
      'WordDocument', 'Root Entry', 'SummaryInformation', 'DocumentSummaryInformation',
      'CompObj', 'ObjectPool', 'Data', '1Table', '0Table', 'Normal.dotm', 'Microsoft Word',
      'Content_Types', 'App', 'Core'
    ]);

    for (const offset of [0, 1]) {
      let run = '';
      for (let i = offset; i < buffer.length - 1; i += 2) {
        const b0 = buffer[i];
        const b1 = buffer[i + 1];
        if (b1 === 0x00 && ((b0 >= 0x20 && b0 <= 0x7e) || b0 === 0x09 || b0 === 0x0a || b0 === 0x0d)) {
          run += String.fromCharCode(b0);
        } else if (b1 > 0x00 && b1 < 0x20) {
          run += String.fromCharCode((b1 << 8) | b0);
        } else {
          const trimmed = run.trim();
          if (trimmed.length >= 3 && !ignoredTokens.has(trimmed) && /[\p{L}\p{N}]/u.test(trimmed)) {
            utf16Runs.push(trimmed);
          }
          run = '';
        }
      }
      const trimmed = run.trim();
      if (trimmed.length >= 3 && !ignoredTokens.has(trimmed) && /[\p{L}\p{N}]/u.test(trimmed)) {
        utf16Runs.push(trimmed);
      }
    }

    if (utf16Runs.length > 0) {
      const candidate = sanitizeText(utf16Runs.join('\n\n'));
      if (!isBinaryOrGarbageText(candidate)) {
        rawText = candidate;
      }
    }
  }

  // 5. Quaternary: Extract clean Latin / ANSI text runs (Legacy binary .doc only, never for ZIP-based formats)
  if ((!rawText.trim() || isBinaryOrGarbageText(rawText)) && !isZip && !originalName.toLowerCase().endsWith('.docx')) {
    const raw = buffer.toString('latin1');
    const words = raw.match(/[\x20-\x7E\xA0-\xFF\t\n\r]{3,}/g) || [];
    const ignoredPrefixes = ['/', '<<', 'PK', '\xD0\xCF', '7z', '\x7FELF', '<Types'];
    const ignoredNames = new Set([
      'WordDocument', 'Root Entry', 'SummaryInformation', 'DocumentSummaryInformation',
      'CompObj', 'ObjectPool', 'Microsoft Word', 'Normal.dotm'
    ]);
    const filtered = words
      .map((w) => w.trim())
      .filter((w) => {
        if (!w || ignoredNames.has(w)) return false;
        if (ignoredPrefixes.some((p) => w.startsWith(p))) return false;
        return /[\p{L}\p{N}]/u.test(w);
      });

    const candidate = sanitizeText(filtered.join('\n\n'));
    if (candidate && !isBinaryOrGarbageText(candidate)) {
      rawText = candidate;
    }
  }

  // 6. Quinary: If it is an OLE2 file, check if it might be an Excel workbook
  if ((!rawText.trim() || isBinaryOrGarbageText(rawText)) && isOle2) {
    try {
      const spreadsheetDoc = await extractFromSpreadsheet(buffer, originalName, false);
      if (spreadsheetDoc && spreadsheetDoc.sections.length > 0) {
        return spreadsheetDoc;
      }
    } catch {
      // Continue to AI fallback
    }
  }

  // 7. Senary: Gemini AI document transcription fallback for difficult/protected/scanned Word documents
  if (!rawText.trim() || isBinaryOrGarbageText(rawText) || rawText.split(/\s+/).filter(Boolean).length < 20) {
    try {
      const ai = getGemini();
      if (ai) {
        const mime = isZip || originalName.toLowerCase().endsWith('.docx')
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/octet-stream';
        const aiRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: mime,
                    data: buffer.toString('base64'),
                  },
                },
                {
                  text: 'Carefully extract and transcribe all visible text, test questions, options, headings, numbers, tables, and content from this document verbatim. Preserve the complete text structure.',
                },
              ],
            },
          ],
        });
        if (aiRes.text && aiRes.text.trim().length > 10) {
          const aiClean = sanitizeText(aiRes.text);
          if (!isBinaryOrGarbageText(aiClean)) {
            rawText = (rawText ? rawText + '\n\n' : '') + aiClean;
          }
        }
      }
    } catch (aiDocErr) {
      console.warn('Gemini Word doc transcription fallback notice:', aiDocErr);
    }
  }

  rawText = sanitizeText(rawText);

  // Guard: If still empty, extract all raw words as absolute failsafe (Legacy binary .doc only, never for ZIP-based formats)
  if ((!rawText.trim() || isBinaryOrGarbageText(rawText)) && !isZip && !originalName.toLowerCase().endsWith('.docx')) {
    const fallbackWords = buffer.toString('latin1').match(/[\p{L}\p{N}\s.,!?:;'"()-]{3,}/gu) || [];
    const joined = fallbackWords.map((w) => w.trim()).filter(Boolean).join(' ');
    if (joined && !isBinaryOrGarbageText(joined)) {
      rawText = sanitizeText(joined);
    }
  }

  if (!rawText.trim() || isBinaryOrGarbageText(rawText)) {
    throw new Error(`Could not read this file properly. Please ensure the Word document "${originalName}" is not corrupted or password-protected.`);
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
 * Extracts text from PowerPoint presentations (.pptx).
 * Guarantees proper OpenXML slide parsing:
 * 1. Numerically sorts slide XMLs (slide2 before slide10).
 * 2. Extracts text from <a:t> nodes grouped per paragraph <a:p>.
 * 3. Uses the first text of each slide as its title.
 * 4. Extracts speaker notes from ppt/notesSlides/notesSlide*.xml.
 * 5. Outputs one section per slide: "Slide N: <title>" followed by bullet text.
 * 6. Never falls through to printable-byte scanners.
 */
export async function extractFromPptx(buffer: Buffer, originalName: string): Promise<ExtractedDocument> {
  const sections: DocumentSection[] = [];
  let slideCount = 0;

  try {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files).filter((filename) =>
      filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')
    );

    // Sort slides numerically: slide1.xml, slide2.xml, ..., slide10.xml
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      return numA - numB;
    });

    slideCount = slideFiles.length;

    for (let i = 0; i < slideFiles.length; i++) {
      const filename = slideFiles[i];
      const slideNum = parseInt(filename.match(/slide(\d+)\.xml/)?.[1] || String(i + 1), 10);
      const xml = await zip.files[filename].async('text');

      // Group <a:t> text nodes inside each paragraph <a:p>
      const paragraphMatches = xml.match(/<a:p[^>]*>([\s\S]*?)<\/a:p>/gi) || [];
      const paragraphs: string[] = [];

      for (const pXml of paragraphMatches) {
        const textMatches = pXml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi) || [];
        const pText = textMatches
          .map((t) => decodeXmlEntities(t.replace(/<[^>]+>/g, '')))
          .join('')
          .replace(/[ \t]+/g, ' ')
          .trim();
        if (pText) {
          paragraphs.push(pText);
        }
      }

      // Check speaker notes for this slide
      let speakerNotes = '';
      const notesFile =
        zip.files[`ppt/notesSlides/notesSlide${slideNum}.xml`] ||
        zip.files[`ppt/notesSlides/notesSlide${i + 1}.xml`];
      if (notesFile) {
        const notesXml = await notesFile.async('text');
        const notesParas = notesXml.match(/<a:p[^>]*>([\s\S]*?)<\/a:p>/gi) || [];
        const noteLines: string[] = [];
        for (const np of notesParas) {
          const ntMatches = np.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi) || [];
          const ntText = ntMatches
            .map((t) => decodeXmlEntities(t.replace(/<[^>]+>/g, '')))
            .join('')
            .replace(/[ \t]+/g, ' ')
            .trim();
          if (ntText && !/^slide\s+\d+$/i.test(ntText)) {
            noteLines.push(ntText);
          }
        }
        if (noteLines.length > 0) {
          speakerNotes = noteLines.join('\n');
        }
      }

      if (paragraphs.length === 0 && !speakerNotes) {
        continue;
      }

      // Use the first non-empty text of each slide as its title
      const title = paragraphs[0] || `Slide ${slideNum}`;
      const bodyParagraphs = paragraphs.slice(1);
      const bulletText = bodyParagraphs.map((p) => `• ${p}`).join('\n');

      const slideParts: string[] = [title];
      if (bulletText) slideParts.push(bulletText);
      if (speakerNotes) slideParts.push(`Speaker Notes:\n${speakerNotes}`);

      const slideContent = sanitizeText(slideParts.join('\n\n'));

      if (slideContent.trim()) {
        sections.push({
          id: `slide-${slideNum}`,
          label: `Slide ${slideNum}: ${title.slice(0, 50)}`,
          content: slideContent,
          wordCount: slideContent.split(/\s+/).filter(Boolean).length,
        });
      }
    }
  } catch (zipErr: any) {
    console.warn('[PPTX] Zip parsing error:', zipErr?.message || zipErr);
  }

  // If no sections were produced, try Gemini multimodal fallback
  // NEVER fall through to the printable-byte scanner for any ZIP-based format (.pptx)
  if (sections.length === 0) {
    console.warn('[PPTX] No slide text found, attempting Gemini multimodal fallback...');
    const ai = getGemini();
    if (ai) {
      try {
        const aiRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    data: buffer.toString('base64'),
                  },
                },
                {
                  text: 'Extract and transcribe all slides, slide titles, bullet points, and speaker notes verbatim from this presentation. Format each slide clearly as [Slide N: Title] followed by its content.',
                },
              ],
            },
          ],
        });
        if (aiRes.text && aiRes.text.trim().length > 50) {
          const cleanAi = sanitizeText(aiRes.text);
          const quality = evaluateExtractionQuality(cleanAi);
          if (quality.isValid) {
            return extractFromText(cleanAi, originalName);
          }
        }
      } catch (aiErr: any) {
        console.warn('[PPTX] Gemini multimodal fallback failed:', aiErr?.message || aiErr);
      }
    }
    throw new Error(`Could not read this file properly. Please ensure the PowerPoint presentation "${originalName}" is not corrupted or password-protected.`);
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
 * Extracts text from spreadsheets (.xlsx, .xls, .csv, .tsv), handling modern OpenXML,
 * legacy BIFF8 binary Excel, HTML tables saved as spreadsheets, and raw CSV.
 */
export async function extractFromSpreadsheet(buffer: Buffer, originalName: string, isCsv: boolean): Promise<ExtractedDocument> {
  const sections: DocumentSection[] = [];

  // Check if this spreadsheet is actually an HTML table saved as .xls or .xlsx
  const headSlice = buffer.slice(0, 1024).toString('utf-8').toLowerCase();
  if (headSlice.includes('<table') || headSlice.includes('<html') || headSlice.includes('xmlns:x="urn:schemas-microsoft-com:office:excel"')) {
    try {
      const $ = cheerio.load(buffer.toString('utf-8'));
      const rows: string[] = [];
      $('tr').each((_, tr) => {
        const cells: string[] = [];
        $(tr).find('th, td').each((__, cell) => {
          cells.push($(cell).text().trim().replace(/\s+/g, ' '));
        });
        if (cells.some(Boolean)) {
          rows.push(cells.join(', '));
        }
      });

      if (rows.length > 0) {
        const chunkSize = 50;
        for (let r = 0; r < rows.length; r += chunkSize) {
          const chunk = rows.slice(r, r + chunkSize);
          const start = r + 1;
          const end = r + chunk.length;
          const label = rows.length <= chunkSize ? 'Table Content' : `Rows ${start}-${end}`;
          const content = chunk.join('\n');
          sections.push({
            id: `html-table-r${start}`,
            label,
            content,
            wordCount: content.split(/\s+/).filter(Boolean).length,
          });
        }
      }
    } catch (htmlErr) {
      console.warn('HTML table extraction from spreadsheet failed:', htmlErr);
    }
  }

  // Primary: SheetJS XLSX workbook parser (handles both Buffer and Uint8Array)
  if (sections.length === 0) {
    try {
      let workbook: XLSX.WorkBook | null = null;
      try {
        workbook = XLSX.read(buffer, {
          type: 'buffer',
          cellDates: true,
          raw: false,
          dateNF: 'yyyy-mm-dd',
        });
      } catch {
        workbook = XLSX.read(new Uint8Array(buffer), {
          type: 'array',
          cellDates: true,
          raw: false,
          dateNF: 'yyyy-mm-dd',
        });
      }

      if (workbook) {
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) continue;

          // Method A: sheet_to_json (preserves all rows, formulas, questions, and cells)
          const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
          const cleanedRows: string[] = [];

          for (const r of rows) {
            if (!Array.isArray(r)) continue;
            const cells = r.map((c) => (c === null || c === undefined ? '' : String(c).trim())).filter(Boolean);
            if (cells.length > 0) {
              cleanedRows.push(cells.join(' | '));
            }
          }

          // Method B: Fallback to sheet_to_csv if sheet_to_json was empty
          if (cleanedRows.length === 0) {
            const csvContent = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
            if (csvContent && csvContent.trim()) {
              const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && /[^\s,;\t"]/.test(l));
              cleanedRows.push(...lines);
            }
          }

          if (cleanedRows.length === 0) continue;

          if (cleanedRows.length <= 3) {
            const label = workbook.SheetNames.length > 1 ? `Sheet "${sheetName}"` : 'Spreadsheet Content';
            const content = `[${sheetName}]\n` + cleanedRows.join('\n');
            sections.push({
              id: `sheet-${sheetName}-r1`,
              label,
              content,
              wordCount: content.split(/\s+/).filter(Boolean).length,
            });
            continue;
          }

          // Chunk rows into readable blocks of 40
          const chunkSize = 40;
          for (let r = 0; r < cleanedRows.length; r += chunkSize) {
            const chunkRows = cleanedRows.slice(r, r + chunkSize);
            const startRow = r + 1;
            const endRow = r + chunkRows.length;
            const label =
              workbook.SheetNames.length > 1
                ? `Sheet "${sheetName}", rows ${startRow}-${endRow}`
                : `Rows ${startRow}-${endRow}`;

            const content = chunkRows.join('\n');
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
      console.warn('XLSX parsing primary tier error:', xlsxErr);
    }
  }

  // Secondary fallback: Direct OpenXML extraction via JSZip for .xlsx (shared strings & worksheet cells)
  if (sections.length === 0) {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const extractedTokens: string[] = [];

      // 1. Shared strings
      const stringsFile = zip.file('xl/sharedStrings.xml');
      if (stringsFile) {
        const xml = await stringsFile.async('text');
        const textTokens = xml.match(/<t[^>]*>([^<]+)<\/t>/gi) || [];
        for (const t of textTokens) {
          const clean = t.replace(/<[^>]+>/g, '').trim();
          if (clean) extractedTokens.push(clean);
        }
      }

      // 2. Worksheet cell values (inline strings and values)
      const sheetFiles = Object.keys(zip.files).filter((f) => f.startsWith('xl/worksheets/sheet') && f.endsWith('.xml'));
      for (const sf of sheetFiles) {
        const sheetFile = zip.file(sf);
        if (sheetFile) {
          const xml = await sheetFile.async('text');
          const cellMatches = xml.match(/<t[^>]*>([^<]+)<\/t>|<v>([^<]+)<\/v>/gi) || [];
          for (const m of cellMatches) {
            const clean = m.replace(/<[^>]+>/g, '').trim();
            if (clean && !clean.match(/^[\d.]+$/)) {
              extractedTokens.push(clean);
            }
          }
        }
      }

      if (extractedTokens.length > 0) {
        const content = extractedTokens.join('\n');
        sections.push({
          id: 'sheet-openxml-tokens',
          label: 'Spreadsheet Content',
          content,
          wordCount: content.split(/\s+/).filter(Boolean).length,
        });
      }
    } catch (zipErr) {
      console.warn('XLSX zip string fallback failed:', zipErr);
    }
  }

  // Tertiary fallback: Gemini AI document transcription for difficult/scanned/corrupted spreadsheets
  if (sections.length === 0) {
    try {
      const ai = getGemini();
      if (ai) {
        const mime = originalName.toLowerCase().endsWith('.xlsx')
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/octet-stream';
        const aiRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: mime,
                    data: buffer.toString('base64'),
                  },
                },
                {
                  text: 'Extract and transcribe all tabular rows, cells, test questions, columns, numbers, and data from this spreadsheet verbatim. Format as clear readable tables or questions.',
                },
              ],
            },
          ],
        });
        if (aiRes.text && aiRes.text.trim().length > 5) {
          const aiClean = sanitizeText(aiRes.text);
          if (!isBinaryOrGarbageText(aiClean)) {
            return extractFromText(aiClean, originalName);
          }
        }
      }
    } catch (aiSpreadsheetErr) {
      console.warn('Gemini spreadsheet extraction fallback notice:', aiSpreadsheetErr);
    }
  }

  // Quaternary fallback: UTF-16LE and 8-bit text scan for binary BIFF spreadsheets (.xls)
  if (sections.length === 0) {
    const rawTokens: string[] = [];
    for (const offset of [0, 1]) {
      let run = '';
      for (let i = offset; i < buffer.length - 1; i += 2) {
        const b0 = buffer[i];
        const b1 = buffer[i + 1];
        if (b1 === 0x00 && ((b0 >= 0x20 && b0 <= 0x7e) || b0 === 0x09 || b0 === 0x0a || b0 === 0x0d)) {
          run += String.fromCharCode(b0);
        } else {
          if (run.trim().length >= 3 && /[\p{L}\p{N}]/u.test(run)) {
            rawTokens.push(run.trim());
          }
          run = '';
        }
      }
      if (run.trim().length >= 3 && /[\p{L}\p{N}]/u.test(run)) {
        rawTokens.push(run.trim());
      }
    }

    const raw8 = buffer.toString('latin1').match(/[\x20-\x7E\xA0-\xFF\t\n\r]{3,}/g) || [];
    for (const r of raw8) {
      if (r.trim().length >= 3 && !r.startsWith('PK') && !r.startsWith('\xD0\xCF') && /[\p{L}\p{N}]/u.test(r)) {
        rawTokens.push(r.trim());
      }
    }

    const uniqueTokens = Array.from(new Set(rawTokens)).filter((t) => t.length > 2);
    if (uniqueTokens.length > 0) {
      const candidate = sanitizeText(uniqueTokens.join('\n'));
      if (candidate && !isBinaryOrGarbageText(candidate)) {
        return extractFromText(candidate, originalName);
      }
    }
  }

  // Quinary fallback: Plain text or CSV decoding
  if (sections.length === 0) {
    const rawUtf8 = sanitizeText(buffer.toString('utf-8'));
    if (!isBinaryOrGarbageText(rawUtf8) && rawUtf8.length > 3) {
      return extractFromText(rawUtf8, originalName);
    }

    const rawLatin = sanitizeText(buffer.toString('latin1'));
    if (!isBinaryOrGarbageText(rawLatin) && rawLatin.length > 3) {
      return extractFromText(rawLatin, originalName);
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
  } else if (ext === '.pptx' || (isZip && ext === '.ppt')) {
    // Direct route for PowerPoint OpenXML presentations
    extracted = await extractFromPptx(buffer, originalName);
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

      if (hasPpt || ext === '.pptx') {
        extracted = await extractFromPptx(buffer, originalName);
      } else if (hasWord || ext === '.docx') {
        extracted = await extractFromDocx(buffer, originalName);
      } else if (hasXls || ext === '.xlsx') {
        extracted = await extractFromSpreadsheet(buffer, originalName, false);
      } else if (hasOdf || ['.odt', '.ods', '.odp'].includes(ext)) {
        extracted = await extractFromOdf(buffer, originalName);
      } else if (hasEpub || ext === '.epub') {
        extracted = await extractFromEpub(buffer, originalName);
      } else {
        extracted = await extractFromZipArchive(buffer, originalName);
      }
    } catch (zipErr: any) {
      console.warn('Zip inspection error:', zipErr?.message || zipErr);
      if (ext === '.pptx') {
        extracted = await extractFromPptx(buffer, originalName);
      } else if (ext === '.xlsx') {
        extracted = await extractFromSpreadsheet(buffer, originalName, false);
      } else {
        extracted = await extractFromDocx(buffer, originalName);
      }
    }
  } else if (isOle2) {
    if (ext === '.xls' || ext === '.xlsx') {
      try {
        extracted = await extractFromSpreadsheet(buffer, originalName, false);
      } catch {
        extracted = await extractFromDocx(buffer, originalName);
      }
    } else {
      try {
        extracted = await extractFromDocx(buffer, originalName);
      } catch {
        extracted = await extractFromSpreadsheet(buffer, originalName, false);
      }
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

  // Quality gate check on extracted content
  let quality = evaluateExtractionQuality(extracted?.fullText || '');

  // If extraction failed the quality gate, attempt Gemini multimodal document fallback
  if (!quality.isValid) {
    console.warn(`[QualityGate] Primary extraction failed: ${quality.reason}. Triggering Gemini multimodal fallback...`);
    const ai = getGemini();
    if (ai) {
      try {
        let mime = mimeType || 'application/octet-stream';
        if (ext === '.pptx') mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        else if (ext === '.docx') mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext === '.xlsx') mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        else if (ext === '.pdf') mime = 'application/pdf';
        else if (isZip) mime = 'application/zip';

        const aiRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType: mime, data: buffer.toString('base64') } },
                { text: 'Extract and transcribe all readable text, titles, headings, numbers, tables, and content from this document verbatim. Preserve the complete text structure.' },
              ],
            },
          ],
        });
        if (aiRes.text && aiRes.text.trim().length > 30) {
          const aiClean = sanitizeText(aiRes.text);
          const fallbackQuality = evaluateExtractionQuality(aiClean);
          if (fallbackQuality.isValid) {
            extracted = extractFromText(aiClean, originalName);
            quality = fallbackQuality;
          }
        }
      } catch (finalAiErr) {
        console.warn('[QualityGate] Gemini multimodal fallback failed:', finalAiErr);
      }
    }
  }

  // Sanitize all extracted sections and fullText
  if (extracted?.fullText) {
    extracted.fullText = sanitizeText(extracted.fullText);
  }
  if (extracted?.sections) {
    extracted.sections = extracted.sections.map((s) => ({
      ...s,
      content: sanitizeText(s.content),
      wordCount: sanitizeText(s.content).split(/\s+/).filter(Boolean).length,
    }));
  }

  // Re-verify quality gate
  quality = evaluateExtractionQuality(extracted?.fullText || '');
  if (!quality.isValid) {
    throw new Error(`Could not read this file properly. Please ensure the document is not corrupted, encrypted, or empty. (${quality.reason || 'Unreadable format'})`);
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

