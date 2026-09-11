import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  PlusCircle,
  FileCheck,
  Table,
  Calendar,
  AlertOctagon,
  Award,
  Hash,
  Eye,
  Layers,
  Clock,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { SummaryResult, ExtractedDocument } from '../types';

interface SummaryViewProps {
  summary: SummaryResult;
  document: ExtractedDocument;
  onOpenSource: (label?: string) => void;
  onRegenerate: () => void;
  onReset: () => void;
  onOpenSideBySide?: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  document,
  onOpenSource,
  onRegenerate,
  onReset,
  onOpenSideBySide,
}) => {
  const [copied, setCopied] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<{ [key: number]: boolean }>({});
  const [activeDetailCategory, setActiveDetailCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'all' | 'brief' | 'data'>('all');

  const toggleSection = (idx: number) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleCopyMarkdown = () => {
    const md = `
# ${summary.title}
*Source-Grounded Summary (${document.fileType.toUpperCase()} · ${document.totalWords} words)*

## Overview
${summary.overview}

## Key Points
${summary.keyPoints.map((k) => `- ${k.point} [${k.sourceRef}]`).join('\n')}

## Detailed Summary
${summary.detailedSections
  .map(
    (s) => `### ${s.sectionTitle} [${s.sourceRef}]\n${s.content}\n${s.subpoints?.map((sp) => `  - ${sp}`).join('\n') || ''}`
  )
  .join('\n\n')}

## Important Details & Metrics
${summary.importantDetails.map((d) => `- **[${d.category}]** ${d.item}: ${d.valueOrDetail} [${d.sourceRef}]`).join('\n')}

## Stated Conclusions
${summary.conclusions.map((c) => `- ${c.statement} [${c.sourceRef}]`).join('\n')}
${
  summary.contradictionsOrUncertainties && summary.contradictionsOrUncertainties.length > 0
    ? `\n## Ambiguities & Contradictions Noted in Source\n${summary.contradictionsOrUncertainties
        .map((u) => `- ${u.issue} [${u.sourceRef}]`)
        .join('\n')}`
    : ''
}
    `.trim();

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'txt' | 'md' | 'json') => {
    let content = '';
    let mime = 'text/plain';
    let ext = format;

    if (format === 'json') {
      content = JSON.stringify({ document, summary }, null, 2);
      mime = 'application/json';
    } else if (format === 'md') {
      content = `# ${summary.title}\n\n## Overview\n${summary.overview}\n\n## Key Points\n${summary.keyPoints.map(k => `- ${k.point} (${k.sourceRef})`).join('\n')}\n\n## Detailed Summary\n${summary.detailedSections.map(s => `### ${s.sectionTitle} (${s.sourceRef})\n${s.content}`).join('\n\n')}\n\n## Important Metrics\n${summary.importantDetails.map(d => `- [${d.category}] ${d.item}: ${d.valueOrDetail} (${d.sourceRef})`).join('\n')}\n\n## Conclusions\n${summary.conclusions.map(c => `- ${c.statement} (${c.sourceRef})`).join('\n')}`;
      mime = 'text/markdown';
    } else {
      content = `SOURCE-GROUNDED SUMMARY\nTitle: ${summary.title}\nSource Type: ${document.fileType.toUpperCase()}\nTotal Source Words: ${document.totalWords}\n============================================================\n\n1. OVERVIEW\n${summary.overview}\n\n2. KEY POINTS\n${summary.keyPoints.map((k) => `• ${k.point} (${k.sourceRef})`).join('\n')}\n\n3. DETAILED SUMMARY\n${summary.detailedSections.map((s, i) => `Section ${i + 1}: ${s.sectionTitle} (${s.sourceRef})\n${s.content}\n${s.subpoints ? s.subpoints.map((sp) => `  - ${sp}`).join('\n') : ''}`).join('\n\n')}\n\n4. IMPORTANT DETAILS & PRESERVED FIGURES\n${summary.importantDetails.map((d) => `• [${d.category}] ${d.item}: ${d.valueOrDetail} (${d.sourceRef})`).join('\n')}\n\n5. STATED CONCLUSIONS\n${summary.conclusions.map((c) => `• ${c.statement} (${c.sourceRef})`).join('\n')}\n`;
    }

    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${summary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const detailCategories = [
    'All',
    ...Array.from(new Set(summary.importantDetails.map((d) => d.category))),
  ];

  const filteredDetails =
    activeDetailCategory === 'All'
      ? summary.importantDetails
      : summary.importantDetails.filter((d) => d.category === activeDetailCategory);

  const estimatedReadingMins = Math.max(1, Math.round(document.totalWords / 220));

  return (
    <div className="w-full max-w-[900px] mx-auto space-y-[28px]">
      {/* Top action toolbar & metadata */}
      <div className="p-[16px] sm:p-[20px] bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#3C4049] rounded-[16px] shadow-[0_8px_24px_-4px_rgba(40,60,50,0.08),0_2px_6px_rgba(40,60,50,0.03)] dark:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] space-y-[16px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px]">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-[8px]">
            <span className="text-[11px] font-mono font-bold tracking-wider px-[8px] py-[3px] rounded-[6px] bg-[#E5ECE7] dark:bg-[#363A42] text-[#284033] dark:text-[#D0D4DF] border border-[#CAD8D0] dark:border-[#444852]">
              {document.fileType.toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-[4px] text-[12px] font-mono text-[#5A6C63] dark:text-[#9EA2AE]">
              <Hash className="w-[12px] h-[12px]" />
              {document.totalWords.toLocaleString()} words
            </span>
            <span className="text-[#C4D0CA] dark:text-[#454A56]">•</span>
            <span className="inline-flex items-center gap-[4px] text-[12px] font-mono text-[#5A6C63] dark:text-[#9EA2AE]">
              <Layers className="w-[12px] h-[12px]" />
              {document.sections.length} sections
            </span>
            <span className="text-[#C4D0CA] dark:text-[#454A56]">•</span>
            <span className="inline-flex items-center gap-[4px] text-[12px] font-mono text-[#5A6C63] dark:text-[#9EA2AE]">
              <Clock className="w-[12px] h-[12px]" />
              ~{estimatedReadingMins} min read
            </span>
          </div>

          {/* Action buttons with consistent heights & spacing */}
          <div className="flex flex-wrap items-center gap-[8px]">
            {onOpenSideBySide && (
              <button
                type="button"
                onClick={onOpenSideBySide}
                className="h-[40px] px-[12px] text-[13px] font-medium rounded-[10px] border border-[#D0DCD5] dark:border-[#424650] bg-white dark:bg-[#31343B] text-[#24302A] dark:text-[#E0E3EB] hover:bg-[#F2F6F3] dark:hover:bg-[#383C45] transition-colors flex items-center gap-[6px] cursor-pointer shadow-2xs"
                title="View summary and source side-by-side"
              >
                <Layers className="w-[14px] h-[14px] text-[#BA7A48] dark:text-[#D2D5DD]" />
                <span className="hidden sm:inline">Side-by-Side</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenSource()}
              className="h-[40px] px-[12px] text-[13px] font-medium rounded-[10px] border border-[#D0DCD5] dark:border-[#424650] bg-white dark:bg-[#31343B] text-[#24302A] dark:text-[#E0E3EB] hover:bg-[#F2F6F3] dark:hover:bg-[#383C45] transition-colors flex items-center gap-[6px] cursor-pointer shadow-2xs"
              title="Inspect raw extracted source chunks"
            >
              <BookOpen className="w-[14px] h-[14px] text-[#BA7A48] dark:text-[#D2D5DD]" />
              <span>Source</span>
            </button>

            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="h-[40px] px-[12px] text-[13px] font-medium rounded-[10px] border border-[#D0DCD5] dark:border-[#424650] bg-white dark:bg-[#31343B] text-[#24302A] dark:text-[#E0E3EB] hover:bg-[#F2F6F3] dark:hover:bg-[#383C45] transition-colors flex items-center gap-[6px] cursor-pointer shadow-2xs"
              title="Copy markdown to clipboard"
            >
              {copied ? <Check className="w-[14px] h-[14px] text-[#2E7D32] dark:text-[#4ADE80]" /> : <Copy className="w-[14px] h-[14px]" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('txt')}
              className="h-[40px] px-[12px] text-[13px] font-medium rounded-[10px] border border-[#D0DCD5] dark:border-[#424650] bg-white dark:bg-[#31343B] text-[#24302A] dark:text-[#E0E3EB] hover:bg-[#F2F6F3] dark:hover:bg-[#383C45] transition-colors flex items-center gap-[6px] cursor-pointer shadow-2xs"
              title="Download formatted summary"
            >
              <Download className="w-[14px] h-[14px]" />
              <span className="hidden md:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={onRegenerate}
              className="h-[40px] w-[40px] rounded-[10px] border border-[#D0DCD5] dark:border-[#424650] bg-white dark:bg-[#31343B] text-[#24302A] dark:text-[#E0E3EB] hover:bg-[#F2F6F3] dark:hover:bg-[#383C45] transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
              title="Regenerate summary from source"
            >
              <RotateCcw className="w-[14px] h-[14px]" />
            </button>

            {/* Primary Action Button: 44-48px height, 18-24px padding, 120px min-width */}
            <button
              type="button"
              onClick={onReset}
              className="h-[44px] min-w-[120px] px-[18px] text-[13px] font-medium rounded-[10px] bg-[#BA7A48] hover:bg-[#A96D3C] text-white dark:bg-[#EDEDED] dark:text-[#16181C] dark:hover:bg-white transition-opacity flex items-center justify-center gap-[6px] shadow-[0_4px_14px_rgba(186,122,72,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.9)] cursor-pointer"
              title="Upload another document"
            >
              <PlusCircle className="w-[14px] h-[14px]" />
              <span>New Source</span>
            </button>
          </div>
        </div>

        {/* Title: 20-24px scale */}
        <div className="pt-[8px] border-t border-[#EAEFEA] dark:border-[#353942]">
          <h1 className="text-[20px] sm:text-[24px] font-serif font-bold text-[#18221D] dark:text-[#F5F6F8] tracking-tight leading-snug">
            {summary.title}
          </h1>
        </div>

        {/* View Mode Switcher tabs */}
        <div className="flex border-b border-[#EAEFEA] dark:border-[#353942] pt-[4px] text-[13px]">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`pb-[8px] px-[12px] font-medium transition-colors cursor-pointer ${
              viewMode === 'all'
                ? 'border-b-2 border-[#BA7A48] dark:border-[#EDEDED] text-[#18221D] dark:text-[#F5F6F8] font-semibold'
                : 'text-[#5D6D65] dark:text-[#8A8F9B] hover:text-[#18221D] dark:hover:text-[#F5F6F8]'
            }`}
          >
            Complete Breakdown
          </button>
          <button
            type="button"
            onClick={() => setViewMode('brief')}
            className={`pb-[8px] px-[12px] font-medium transition-colors cursor-pointer ${
              viewMode === 'brief'
                ? 'border-b-2 border-[#BA7A48] dark:border-[#EDEDED] text-[#18221D] dark:text-[#F5F6F8] font-semibold'
                : 'text-[#5D6D65] dark:text-[#8A8F9B] hover:text-[#18221D] dark:hover:text-[#F5F6F8]'
            }`}
          >
            Executive Briefing
          </button>
          <button
            type="button"
            onClick={() => setViewMode('data')}
            className={`pb-[8px] px-[12px] font-medium transition-colors cursor-pointer ${
              viewMode === 'data'
                ? 'border-b-2 border-[#BA7A48] dark:border-[#EDEDED] text-[#18221D] dark:text-[#F5F6F8] font-semibold'
                : 'text-[#5D6D65] dark:text-[#8A8F9B] hover:text-[#18221D] dark:hover:text-[#F5F6F8]'
            }`}
          >
            Preserved Metrics & Data ({summary.importantDetails.length})
          </button>
        </div>
      </div>

      {/* 1. Overview Section */}
      {(viewMode === 'all' || viewMode === 'brief') && (
        <section className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#3C4049] rounded-[16px] p-[20px] sm:p-[24px] shadow-[0_8px_24px_-4px_rgba(40,60,50,0.08),0_2px_6px_rgba(40,60,50,0.03)] dark:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] space-y-[14px]">
          <div className="flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-wider text-[#4D5E56] dark:text-[#9EA2AE]">
            <FileCheck className="w-[15px] h-[15px] text-[#BA7A48] dark:text-[#D2D5DD]" />
            <span>Overview</span>
          </div>
          <p className="text-[15px] sm:text-[16px] text-[#283830] dark:text-[#D8DBE2] leading-relaxed max-w-[75ch]">
            {summary.overview}
          </p>
        </section>
      )}

      {/* 2. Key Points Section */}
      {(viewMode === 'all' || viewMode === 'brief') && (
        <section className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#3C4049] rounded-[16px] p-[20px] sm:p-[24px] shadow-[0_8px_24px_-4px_rgba(40,60,50,0.08),0_2px_6px_rgba(40,60,50,0.03)] dark:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] space-y-[16px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-wider text-[#4D5E56] dark:text-[#9EA2AE]">
              <Award className="w-[15px] h-[15px] text-[#BA7A48] dark:text-[#D2D5DD]" />
              <span>Key Points & Core Findings</span>
            </div>
            <span className="text-[12px] font-mono text-[#6A7B72] dark:text-[#8E93A0]">
              {summary.keyPoints.length} verified statements
            </span>
          </div>

          <ul className="space-y-[14px]">
            {summary.keyPoints.map((item, idx) => (
              <li
                key={idx}
                className="text-[15px] sm:text-[16px] text-[#283830] dark:text-[#D8DBE2] flex items-start gap-[12px] leading-relaxed max-w-[75ch]"
              >
                <span className="mt-[8px] w-[6px] h-[6px] rounded-full bg-[#BA7A48] dark:bg-[#EDEDED] shrink-0" />
                <div className="flex-1">
                  <span>{item.point}</span>{' '}
                  <button
                    type="button"
                    onClick={() => onOpenSource(item.sourceRef)}
                    className="inline-flex items-center gap-[4px] text-[11px] font-mono px-[6px] py-[1.5px] rounded-[4px] bg-[#EFF4F1] dark:bg-[#222428] text-[#34463C] dark:text-[#A8ACB8] hover:bg-[#E3ECE7] dark:hover:bg-[#2D3037] border border-[#D4DFD9] dark:border-[#3C4049] ml-[6px] transition-colors cursor-pointer"
                  >
                    <span>{item.sourceRef}</span>
                    <ExternalLink className="w-[10px] h-[10px] opacity-60" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 3. Detailed Summary (Preserving Source Structure) */}
      {viewMode === 'all' && (
        <section className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#3C4049] rounded-[16px] p-[20px] sm:p-[24px] shadow-[0_8px_24px_-4px_rgba(40,60,50,0.08),0_2px_6px_rgba(40,60,50,0.03)] dark:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] space-y-[16px]">
          <div className="flex items-center justify-between pb-[12px] border-b border-[#EAEFEA] dark:border-[#373A43]">
            <div className="flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-wider text-[#4D5E56] dark:text-[#9EA2AE]">
              <Hash className="w-[15px] h-[15px] text-[#BA7A48] dark:text-[#D2D5DD]" />
              <span>Section-by-Section Structural Breakdown</span>
            </div>
            <span className="text-[12px] text-[#6A7B72] dark:text-[#8E93A0]">
              Preserves chronological flow & nuance
            </span>
          </div>

          <div className="space-y-[14px]">
            {summary.detailedSections.map((sec, idx) => {
              const isCollapsed = !!collapsedSections[idx];
              return (
                <div
                  key={idx}
                  className="border border-[#DCE3DF] dark:border-[#3A3E48] rounded-[12px] overflow-hidden bg-[#FAFBF9] dark:bg-[#23252A] transition-colors"
                >
                  <div
                    onClick={() => toggleSection(idx)}
                    className="px-[16px] py-[12px] flex items-center justify-between cursor-pointer hover:bg-[#F2F6F3] dark:hover:bg-[#2A2D33] transition-colors"
                  >
                    <div className="flex items-center gap-[10px]">
                      <span className="text-[15px] font-serif font-semibold text-[#18221D] dark:text-[#F5F6F8]">
                        {sec.sectionTitle}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSource(sec.sourceRef);
                        }}
                        className="inline-flex items-center gap-[4px] text-[11px] font-mono px-[6px] py-[1.5px] rounded-[4px] bg-[#EFF4F1] dark:bg-[#222428] text-[#34463C] dark:text-[#A8ACB8] border border-[#D4DFD9] dark:border-[#3C4049] hover:bg-[#E3ECE7] transition-colors cursor-pointer"
                      >
                        <span>{sec.sourceRef}</span>
                      </button>
                    </div>
                    <div className="text-[#6A7B72] dark:text-[#8E93A0]">
                      {isCollapsed ? <ChevronDown className="w-[14px] h-[14px]" /> : <ChevronUp className="w-[14px] h-[14px]" />}
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="px-[16px] pb-[16px] pt-[4px] space-y-[12px] text-[14px] sm:text-[15px] text-[#283830] dark:text-[#D5D8E0] leading-relaxed max-w-[75ch]">
                      <p>{sec.content}</p>
                      {sec.subpoints && sec.subpoints.length > 0 && (
                        <ul className="space-y-[8px] pl-[16px] border-l-2 border-[#DCE3DF] dark:border-[#3E424C]">
                          {sec.subpoints.map((sub, sIdx) => (
                            <li key={sIdx} className="text-[13px] sm:text-[14px] text-[#485951] dark:text-[#B6B9C2]">
                              • {sub}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Important Details & Metrics */}
      {(viewMode === 'all' || viewMode === 'data') && (
        <section className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#3C4049] rounded-[16px] p-[20px] sm:p-[24px] shadow-[0_8px_24px_-4px_rgba(40,60,50,0.08),0_2px_6px_rgba(40,60,50,0.03)] dark:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] space-y-[16px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px] pb-[12px] border-b border-[#EAEFEA] dark:border-[#373A43]">
            <div className="flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-wider text-[#4D5E56] dark:text-[#9EA2AE]">
              <Table className="w-[15px] h-[15px] text-[#BA7A48] dark:text-[#D2D5DD]" />
              <span>Exact Numerical Metrics & Parameters ({summary.importantDetails.length})</span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-[6px] text-[12px]">
              {detailCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveDetailCategory(cat)}
                  className={`px-[10px] py-[4px] rounded-[6px] border text-[12px] font-medium transition-colors cursor-pointer ${
                    activeDetailCategory === cat
                      ? 'bg-[#BA7A48] text-white border-[#BA7A48] dark:bg-[#EDEDED] dark:text-[#16181C] dark:border-[#EDEDED]'
                      : 'bg-[#FAFBF9] dark:bg-[#23252A] border-[#D4DFD9] dark:border-[#3A3E46] text-[#4A5952] dark:text-[#989DA8] hover:bg-[#EFF4F1]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
            {filteredDetails.map((detail, idx) => (
              <div
                key={idx}
                className="p-[14px] rounded-[12px] border border-[#DCE3DF] dark:border-[#3A3E48] bg-[#FAFBF9] dark:bg-[#23252A] space-y-[6px] transition-colors"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="uppercase font-semibold tracking-wider text-[#6A7B72] dark:text-[#8E93A0]">
                    {detail.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenSource(detail.sourceRef)}
                    className="font-mono text-[#BA7A48] dark:text-[#D2D5DD] hover:underline cursor-pointer"
                  >
                    {detail.sourceRef}
                  </button>
                </div>
                <div className="font-semibold text-[13px] text-[#18221D] dark:text-[#F5F6F8]">
                  {detail.item}
                </div>
                <div className="text-[12px] font-mono font-medium text-[#1E2723] dark:text-[#EDEDED] bg-white dark:bg-[#2D3037] px-[10px] py-[6px] rounded-[6px] border border-[#D8E2DC] dark:border-[#40444F]">
                  {detail.valueOrDetail}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Stated Conclusions */}
      {(viewMode === 'all' || viewMode === 'brief') && (
        <section className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#3C4049] rounded-[16px] p-[20px] sm:p-[24px] shadow-[0_8px_24px_-4px_rgba(40,60,50,0.08),0_2px_6px_rgba(40,60,50,0.03)] dark:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] space-y-[14px]">
          <div className="flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-wider text-[#4D5E56] dark:text-[#9EA2AE]">
            <CheckCircle2 className="w-[15px] h-[15px] text-[#2E7D32] dark:text-[#4ADE80]" />
            <span>Stated Conclusions & Final Outcomes</span>
          </div>

          <ul className="space-y-[10px]">
            {summary.conclusions.map((item, idx) => (
              <li
                key={idx}
                className="text-[14px] sm:text-[15px] text-[#283830] dark:text-[#D8DBE2] flex items-start gap-[10px] leading-relaxed max-w-[75ch]"
              >
                <span className="mt-[2px] text-[#2E7D32] dark:text-[#4ADE80] font-bold">✓</span>
                <div className="flex-1">
                  <span>{item.statement}</span>{' '}
                  <button
                    type="button"
                    onClick={() => onOpenSource(item.sourceRef)}
                    className="inline-flex items-center gap-[2px] text-[11px] font-mono px-[6px] py-[1.5px] rounded-[4px] bg-[#EFF4F1] dark:bg-[#222428] text-[#34463C] dark:text-[#A8ACB8] border border-[#D4DFD9] dark:border-[#3C4049] ml-[4px] cursor-pointer"
                  >
                    {item.sourceRef}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 6. Ambiguities & Contradictions (if any in source) */}
      {summary.contradictionsOrUncertainties && summary.contradictionsOrUncertainties.length > 0 && (
        <section className="bg-[#FAF6EE] dark:bg-[#25201A] border border-[#EADBCE] dark:border-[#4D3A25] rounded-[16px] p-[20px] sm:p-[24px] shadow-xs space-y-[10px]">
          <div className="flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-wider text-[#BA7A48] dark:text-[#F59E0B]">
            <AlertOctagon className="w-[15px] h-[15px]" />
            <span>Preserved Ambiguities & Document Qualifications</span>
          </div>
          <p className="text-[13px] text-[#6E4F1B] dark:text-[#D97706] max-w-[75ch]">
            Per strict zero-hallucination rules, conflicting or qualified statements in the source are preserved rather than resolved:
          </p>
          <ul className="space-y-[8px] pt-[4px]">
            {summary.contradictionsOrUncertainties.map((item, idx) => (
              <li key={idx} className="text-[13px] sm:text-[14px] text-[#283830] dark:text-[#EDEDEB] flex items-start gap-[10px] max-w-[75ch]">
                <span className="text-[#BA7A48] dark:text-[#F59E0B] font-bold">•</span>
                <div>
                  <span>{item.issue}</span>{' '}
                  <span className="text-[11px] font-mono text-[#6A7B72] dark:text-[#8E93A0]">({item.sourceRef})</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
