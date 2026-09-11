import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as cheerio from 'cheerio';
import JSZip from 'jszip';

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

export async function extractFromPdf(buffer: Buffer, originalName: string): Promise<ExtractedDocument> {
  let text = '';
  let numPages = 1;
  const sections: DocumentSection[] = [];

  try {
    // Dynamic import to support both ESM and CJS bundle safely
    const pdfModule = await import('pdf-parse');
    const pdfParse = (pdfModule as any).default || pdfModule;
    const data = await pdfParse(buffer);
    text = data.text || '';
    numPages = data.numpages || 1;
  } catch (err: any) {
    console.error('pdf-parse error:', err);
    // Fallback: extract visible text streams from PDF buffer if pdf-parse encounters issue
    const rawString = buffer.toString('binary');
    const textMatches = rawString.match(/\(([^)]+)\)\s*Tj/g) || [];
    text = textMatches.map(m => m.replace(/^\(|\)\s*Tj$/g, '')).join(' ');
    if (!text.trim()) {
      throw new Error("I couldn't extract reliable text from this PDF document. The file may be scanned images or password protected.");
    }
  }

  // Split into page sections if markers exist, or chunk by paragraphs
  const rawPages = text.split(/\f|\n(?=Page \d+|\n\s*---\s*Page \d+\s*---\s*\n)/i);
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
    // Break into logical sections of roughly 500-800 words
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
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

  const cleanFull = sections.map(s => `[${s.label}]\n${s.content}`).join('\n\n');
  const totalWords = cleanFull.split(/\s+/).filter(Boolean).length;

  return {
    title: originalName.replace(/\.[^/.]+$/, ''),
    fileType: 'pdf',
    sections,
    fullText: cleanFull,
    totalWords,
    totalCharacters: cleanFull.length,
    metadata: { pages: numPages },
  };
}

export async function extractFromDocx(buffer: Buffer, originalName: string): Promise<ExtractedDocument> {
  const result = await mammoth.extractRawText({ buffer });
  const rawText = result.value || '';
  if (!rawText.trim()) {
    throw new Error("The DOCX document appears to be empty or unreadable.");
  }

  const sections: DocumentSection[] = [];
  const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim());
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

  const fullText = sections.map(s => `[${s.label}]\n${s.content}`).join('\n\n');
  return {
    title: originalName.replace(/\.[^/.]+$/, ''),
    fileType: 'docx',
    sections,
    fullText,
    totalWords: fullText.split(/\s+/).filter(Boolean).length,
    totalCharacters: fullText.length,
  };
}

export async function extractFromPptx(buffer: Buffer, originalName: string): Promise<ExtractedDocument> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files).filter(filename => 
    filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')
  );

  // Sort slides numerically: slide1.xml, slide2.xml, ...
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
    const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
    return numA - numB;
  });

  if (slideFiles.length === 0) {
    throw new Error("No readable slides found in this presentation.");
  }

  const sections: DocumentSection[] = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const filename = slideFiles[i];
    const xml = await zip.files[filename].async('text');
    // Extract text from <a:t>...</a:t> elements in the XML
    const matches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
    const texts = matches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
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

  const fullText = sections.map(s => `[${s.label}]\n${s.content}`).join('\n\n');
  return {
    title: originalName.replace(/\.[^/.]+$/, ''),
    fileType: 'pptx',
    sections,
    fullText,
    totalWords: fullText.split(/\s+/).filter(Boolean).length,
    totalCharacters: fullText.length,
    metadata: { totalSlides: slideFiles.length },
  };
}

export async function extractFromSpreadsheet(buffer: Buffer, originalName: string, isCsv: boolean): Promise<ExtractedDocument> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sections: DocumentSection[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // Convert to CSV or structured rows
    const csvContent = XLSX.utils.sheet_to_csv(sheet);
    if (!csvContent.trim()) continue;

    const lines = csvContent.split('\n').filter(l => l.trim());
    if (lines.length === 0) continue;

    const headers = lines[0];
    const rowCount = lines.length - 1;

    // Chunk sheet if it's very large
    const chunkSize = 50; // 50 rows per chunk
    for (let r = 1; r < lines.length; r += chunkSize) {
      const chunkRows = lines.slice(r, r + chunkSize);
      const startRow = r + 1;
      const endRow = Math.min(r + chunkSize, lines.length);
      const label = workbook.SheetNames.length > 1
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

  if (sections.length === 0) {
    throw new Error("No readable data found in this spreadsheet.");
  }

  const fullText = sections.map(s => `[${s.label}]\n${s.content}`).join('\n\n');
  return {
    title: originalName.replace(/\.[^/.]+$/, ''),
    fileType: isCsv ? 'csv' : 'xlsx',
    sections,
    fullText,
    totalWords: fullText.split(/\s+/).filter(Boolean).length,
    totalCharacters: fullText.length,
  };
}

export function extractFromText(rawText: string, title = 'Document'): ExtractedDocument {
  if (!rawText || !rawText.trim()) {
    throw new Error("The provided text is empty. Please enter or paste valid document content.");
  }

  const sections: DocumentSection[] = [];
  const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim());
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

  const fullText = sections.map(s => `[${s.label}]\n${s.content}`).join('\n\n');
  return {
    title,
    fileType: 'txt',
    sections,
    fullText,
    totalWords: fullText.split(/\s+/).filter(Boolean).length,
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
