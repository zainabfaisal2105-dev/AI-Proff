import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as cheerio from 'cheerio';
import JSZip from 'jszip';
import zlib from 'node:zlib';
import { getGemini } from './summarizer.js';

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
            if (clean) {
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
  if (currentWords < 15 && buffer.length > 0) {
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

            if (res.text && res.text.trim().length > 30) {
              text = res.text.trim();
              break;
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
  if (!text.trim() && buffer.length > 0) {
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
        text = pieces.join(' ');
      }
    } catch (zlibErr) {
      console.warn('zlib stream decompression error:', zlibErr);
    }
  }

  // 4. Quaternary: Extract printable Latin/UTF-8 strings from binary
  if (!text.trim() && buffer.length > 0) {
    const rawString = buffer.toString('latin1');
    const printableWords = rawString.match(/[\x20-\x7E\t\n\r]{4,}/g) || [];
    const filtered = printableWords.filter(
      (w) => !w.startsWith('/') && !w.startsWith('<<') && !w.startsWith('xref') && !w.startsWith('obj')
    );
    if (filtered.length > 0) {
      text = filtered.join(' ').replace(/\s+/g, ' ').trim();
    }
  }

  // Fallback: If document is completely devoid of text, provide document presence note
  if (!text.trim()) {
    text = `Uploaded PDF document: ${originalName}. The file is in binary format with non-standard font encoding.`;
  }

  // If pages were not captured per-page earlier, chunk into logical sections
  if (sections.length === 0) {
    // Check for Page / Section markers in text
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
      // Chunk into paragraphs ~ 500 words
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

  // Guarantee at least one section exists
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

export async function extractFromDocx(buffer: Buffer, originalName: string): Promise<ExtractedDocument> {
  let rawText = '';

  // 1. Primary: Mammoth extraction
  try {
    const result = await mammoth.extractRawText({ buffer });
    rawText = result.value || '';
  } catch (mammothErr) {
    console.warn('Mammoth extraction failed, trying zip XML fallback:', mammothErr);
  }

  // 2. Fallback: Parse word/document.xml directly via JSZip
  if (!rawText.trim()) {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const docFile = zip.file('word/document.xml');
      if (docFile) {
        const xml = await docFile.async('text');
        const matches = xml.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
        rawText = matches.map((m) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean).join(' ');
      }
    } catch (zipErr) {
      console.warn('DOCX zip XML fallback failed:', zipErr);
    }
  }

  // 3. Fallback: Plain text extraction from binary stream (e.g. older .doc or RTF)
  if (!rawText.trim()) {
    const raw = buffer.toString('latin1');
    const words = raw.match(/[\x20-\x7E\t\n\r]{4,}/g) || [];
    const filtered = words.filter((w) => !w.startsWith('/') && !w.startsWith('<<'));
    rawText = filtered.join(' ').replace(/\s+/g, ' ').trim();
  }

  if (!rawText.trim()) {
    rawText = `Document: ${originalName}. Uploaded Word document content was extracted.`;
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
      const slideContent = texts.join(' ');

      if (slideContent.trim()) {
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
      if (combinedXmlText.trim()) {
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

  // Binary text fallback
  if (sections.length === 0) {
    const raw = buffer.toString('latin1');
    const words = raw.match(/[\x20-\x7E\t\n\r]{4,}/g) || [];
    const text = words.join(' ').replace(/\s+/g, ' ').trim() || `Presentation: ${originalName}`;
    sections.push({
      id: 'slide-1',
      label: 'Slide 1',
      content: text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    });
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

      // Chunk sheet if it's very large
      const chunkSize = 50; // 50 rows per chunk
      for (let r = 1; r < lines.length; r += chunkSize) {
        const chunkRows = lines.slice(r, r + chunkSize);
        const startRow = r + 1;
        const endRow = Math.min(r + chunkSize, lines.length);
        const label =
          workbook.SheetNames.length > 1
            ? `Sheet "${sheetName}", rows ${startRow}-${endRow}`
            : `Rows ${startRow}-${endRow}`;

        const content = `Headers: ${headers}\nData:\n` + chunkRows.join('\n');
        sections.push({
          id: `sheet-${sheetName}-r${startRow}`,
          label,
          content,
          wordCount: content.split(/\s+/).filter(Boolean).length,
        });
      }
    }
  } catch (xlsxErr) {
    console.warn('XLSX parsing error, falling back to text parsing:', xlsxErr);
  }

  // Fallback if spreadsheet was empty or XLSX threw
  if (sections.length === 0) {
    const rawContent = buffer.toString('utf-8').trim() || `Spreadsheet: ${originalName}`;
    sections.push({
      id: 'sheet-1',
      label: 'Sheet Data',
      content: rawContent,
      wordCount: rawContent.split(/\s+/).filter(Boolean).length,
    });
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
  const clean = (rawText || '').trim() || `Pasted document titled "${title}" with initial placeholder content.`;

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

export async function extractFromUrl(url: string): Promise<ExtractedDocument> {
  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error("Invalid URL protocol");
    }
  } catch {
    throw new Error("Invalid URL format. Please provide a valid http or https web link.");
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
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

    // Look for headings and corresponding paragraphs
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
      // Fallback to text content
      const bodyText = mainContainer.text().replace(/\s+/g, ' ').trim();
      if (!bodyText || bodyText.length < 50) {
        throw new Error("The webpage content is too short or protected by client-side JavaScript.");
      }
      return extractFromText(bodyText, pageTitle);
    }

    const fullText = sections.map(s => `[${s.label}]\n${s.content}`).join('\n\n');
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
    throw new Error("Unable to access this source. Please upload the document or paste its contents instead.");
  }
}
