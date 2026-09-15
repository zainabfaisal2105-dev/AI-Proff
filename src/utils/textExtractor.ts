import { ExtractedDocument, DocumentSection } from '../types';

/**
 * Extract structured sections and metadata from raw text directly on the client side.
 * Guarantees zero-failure, instant processing without network dependencies.
 */
export function extractTextClientSide(rawText: string, title = 'Document'): ExtractedDocument {
  const cleanText = (rawText || '').trim();
  if (!cleanText) {
    throw new Error('The provided text is empty. Please enter or paste valid document content.');
  }

  const sections: DocumentSection[] = [];

  // Check if text has explicit section markers like "[Page X: ...]" or "=== Section ==="
  const markerRegex = /(?:^|\n)(?:\[(?:Page|Section)\s*(\d+)[^\]]*\]|---\s*(?:Page|Section)\s*(\d+)\s*---)/gi;
  const hasMarkers = markerRegex.test(cleanText);

  if (hasMarkers) {
    // Split by markers while preserving section titles
    const rawParts = cleanText.split(/(?=(?:^|\n)\[(?:Page|Section)\s*\d+[^\]]*\]|(?=(?:^|\n)---\s*(?:Page|Section)\s*\d+\s*---))/gi);
    let sectionIdx = 1;

    for (const part of rawParts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // Extract label from the marker if present
      const labelMatch = trimmed.match(/^\[([^\]]+)\]/);
      const dashMatch = trimmed.match(/^---\s*([^\n-]+)\s*---/);
      const label = labelMatch ? labelMatch[1].trim() : dashMatch ? dashMatch[1].trim() : `Section ${sectionIdx}`;
      const content = trimmed.replace(/^\[[^\]]+\]\s*/, '').replace(/^---\s*[^\n-]+\s*---\s*/, '').trim();

      if (content || trimmed) {
        sections.push({
          id: `sec-${sectionIdx}`,
          label,
          content: content || trimmed,
          wordCount: (content || trimmed).split(/\s+/).filter(Boolean).length,
        });
        sectionIdx++;
      }
    }
  }

  // Fallback to paragraph chunking if no explicit markers or if parsing produced nothing
  if (sections.length === 0) {
    const paragraphs = cleanText.split(/\n\s*\n/).filter((p) => p.trim());
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

  // Ensure at least one section exists
  if (sections.length === 0) {
    sections.push({
      id: 'sec-1',
      label: 'Document Content',
      content: cleanText,
      wordCount: cleanText.split(/\s+/).filter(Boolean).length,
    });
  }

  const fullText = sections.map((s) => `[${s.label}]\n${s.content}`).join('\n\n');

  return {
    title: title.trim() || 'Document',
    fileType: 'txt',
    sections,
    fullText,
    totalWords: fullText.split(/\s+/).filter(Boolean).length,
    totalCharacters: fullText.length,
  };
}
