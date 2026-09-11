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
import { StatusBead } from './StatusBead';

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
    <div className="w-full max-w-[900px] mx-auto space-y-[24px]">
      {/* Top action toolbar & metadata in Clay Card */}
      <div className="clay-card p-[18px] sm:p-[24px] space-y-[16px] relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px]">
          {/* Metadata beads & pills */}
          <div className="flex flex-wrap items-center gap-[8px]">
            <StatusBead status="grounded" size="sm" showPulse />
            <span className="text-[10px] font-mono uppercase font-bold px-[8px] py-[2px] rounded-full clay-well text-[#3A3A38] dark:text-[#E8E4DD]">
              {document.fileType}
            </span>
            <span className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
              {document.totalWords.toLocaleString()} words · {document.sections.length} sections · ~{estimatedReadingMins} min read
            </span>
          </div>

          {/* Action buttons (round & pill clay buttons) */}
          <div className="flex flex-wrap items-center gap-[8px]">
            {onOpenSideBySide && (
              <button
                type="button"
                onClick={onOpenSideBySide}
                className="clay-btn-neutral h-[36px] px-[12px] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer"
                title="View summary and source side-by-side"
              >
                <Layers className="w-[14px] h-[14px] text-[#7FA398]" />
                <span className="hidden sm:inline">Side-by-Side</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenSource()}
              className="clay-btn-neutral h-[36px] px-[12px] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer"
              title="Inspect raw extracted source chunks"
            >
              <BookOpen className="w-[14px] h-[14px] text-[#D9924D] dark:text-[#E8863C]" />
              <span>Source</span>
            </button>

            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="clay-btn-neutral h-[36px] px-[12px] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer"
              title="Copy markdown to clipboard"
            >
              {copied ? <Check className="w-[14px] h-[14px] text-[#5B9A7D]" /> : <Copy className="w-[14px] h-[14px]" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('txt')}
              className="clay-btn-neutral h-[36px] px-[12px] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer"
              title="Download formatted summary"
            >
              <Download className="w-[14px] h-[14px]" />
              <span className="hidden md:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={onRegenerate}
              className="w-[36px] h-[36px] rounded-full clay-btn-neutral flex items-center justify-center cursor-pointer"
              title="Regenerate summary from source"
            >
              <RotateCcw className="w-[14px] h-[14px]" />
            </button>

            <button
              type="button"
              onClick={onReset}
              className="clay-btn-primary h-[36px] px-[14px] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer"
              title="Upload another document"
            >
              <PlusCircle className="w-[14px] h-[14px]" />
              <span>New Source</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="pt-[10px] border-t border-[#E2DBD0] dark:border-[#464A52]">
          <h1 className="text-[20px] sm:text-[24px] font-serif font-bold text-[#3A3A38] dark:text-[#E8E4DD] leading-snug">
            {summary.title}
          </h1>
        </div>

        {/* View Mode Switcher pill buttons */}
        <div className="clay-well p-[3px] rounded-full inline-flex items-center gap-[2px]">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`h-[30px] px-[14px] rounded-full text-[12px] font-medium transition-all cursor-pointer ${
              viewMode === 'all'
                ? 'clay-btn-primary shadow-xs'
                : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
            }`}
          >
            Complete Breakdown
          </button>
          <button
            type="button"
            onClick={() => setViewMode('brief')}
            className={`h-[30px] px-[14px] rounded-full text-[12px] font-medium transition-all cursor-pointer ${
              viewMode === 'brief'
                ? 'clay-btn-primary shadow-xs'
                : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
            }`}
          >
            Executive Briefing
          </button>
          <button
            type="button"
            onClick={() => setViewMode('data')}
            className={`h-[30px] px-[14px] rounded-full text-[12px] font-medium transition-all cursor-pointer ${
              viewMode === 'data'
                ? 'clay-btn-primary shadow-xs'
                : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
            }`}
          >
            Preserved Metrics ({summary.importantDetails.length})
          </button>
        </div>
      </div>

      {/* 1. Overview Section */}
      {(viewMode === 'all' || viewMode === 'brief') && (
        <section className="clay-card p-[20px] sm:p-[26px] space-y-[12px]">
          <div className="flex items-center gap-[8px] text-[12px] font-mono font-bold uppercase tracking-wider text-[#D9924D] dark:text-[#E8863C]">
            <FileCheck className="w-[15px] h-[15px]" />
            <span>Overview</span>
          </div>
          <p className="text-[15px] sm:text-[16px] text-[#3A3A38] dark:text-[#E8E4DD] leading-relaxed max-w-[75ch]">
            {summary.overview}
          </p>
        </section>
      )}

      {/* 2. Key Points Section */}
      {(viewMode === 'all' || viewMode === 'brief') && (
        <section className="clay-card p-[20px] sm:p-[26px] space-y-[16px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[8px] text-[12px] font-mono font-bold uppercase tracking-wider text-[#7FA398]">
              <Award className="w-[15px] h-[15px]" />
              <span>Key Points & Core Findings</span>
            </div>
            <span className="text-[12px] font-mono text-[#8A8880] dark:text-[#9A9691]">
              {summary.keyPoints.length} verified statements
            </span>
          </div>

          <ul className="space-y-[14px]">
            {summary.keyPoints.map((item, idx) => (
              <li
                key={idx}
                className="text-[15px] sm:text-[16px] text-[#3A3A38] dark:text-[#E8E4DD] flex items-start gap-[12px] leading-relaxed max-w-[75ch]"
              >
                <span className="mt-[8px] w-[6px] h-[6px] rounded-full bg-[#D9924D] dark:bg-[#E8863C] shrink-0" />
                <div className="flex-1">
                  <span>{item.point}</span>{' '}
                  <button
                    type="button"
                    onClick={() => onOpenSource(item.sourceRef)}
                    className="clay-btn-secondary inline-flex items-center gap-[4px] text-[11px] font-mono px-[8px] py-[2px] rounded-full ml-[6px] cursor-pointer"
                  >
                    <span>{item.sourceRef}</span>
                    <ExternalLink className="w-[10px] h-[10px]" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 3. Detailed Summary */}
      {viewMode === 'all' && (
        <section className="clay-card p-[20px] sm:p-[26px] space-y-[16px]">
          <div className="flex items-center justify-between pb-[12px] border-b border-[#E2DBD0] dark:border-[#464A52]">
            <div className="flex items-center gap-[8px] text-[12px] font-mono font-bold uppercase tracking-wider text-[#D9924D] dark:text-[#E8863C]">
              <Hash className="w-[15px] h-[15px]" />
              <span>Section-by-Section Structural Breakdown</span>
            </div>
          </div>

          <div className="space-y-[12px]">
            {summary.detailedSections.map((sec, idx) => {
              const isCollapsed = !!collapsedSections[idx];
              return (
                <div
                  key={idx}
                  className="clay-well rounded-[18px] overflow-hidden transition-all"
                >
                  <div
                    onClick={() => toggleSection(idx)}
                    className="p-[14px] sm:p-[16px] flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-[10px]">
                      <span className="text-[15px] font-serif font-bold text-[#3A3A38] dark:text-[#E8E4DD]">
                        {sec.sectionTitle}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSource(sec.sourceRef);
                        }}
                        className="clay-btn-secondary inline-flex items-center gap-[4px] text-[10px] font-mono px-[8px] py-[2px] rounded-full cursor-pointer"
                      >
                        <span>{sec.sourceRef}</span>
                      </button>
                    </div>
                    <div className="text-[#8A8880] dark:text-[#9A9691]">
                      {isCollapsed ? <ChevronDown className="w-[14px] h-[14px]" /> : <ChevronUp className="w-[14px] h-[14px]" />}
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="px-[16px] pb-[16px] pt-[2px] space-y-[12px] text-[14px] sm:text-[15px] text-[#3A3A38] dark:text-[#E8E4DD] leading-relaxed max-w-[75ch]">
                      <p>{sec.content}</p>
                      {sec.subpoints && sec.subpoints.length > 0 && (
                        <ul className="space-y-[8px] pl-[16px] border-l-2 border-[#7FA398]">
                          {sec.subpoints.map((sub, sIdx) => (
                            <li key={sIdx} className="text-[13px] text-[#8A8880] dark:text-[#9A9691]">
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
        <section className="clay-card p-[20px] sm:p-[26px] space-y-[16px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px] pb-[12px] border-b border-[#E2DBD0] dark:border-[#464A52]">
            <div className="flex items-center gap-[8px] text-[12px] font-mono font-bold uppercase tracking-wider text-[#7FA398]">
              <Table className="w-[15px] h-[15px]" />
              <span>Exact Numerical Metrics & Parameters ({summary.importantDetails.length})</span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-[6px] text-[12px]">
              {detailCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveDetailCategory(cat)}
                  className={`px-[10px] py-[3px] rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                    activeDetailCategory === cat
                      ? 'clay-btn-primary shadow-xs'
                      : 'clay-well text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38]'
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
                className="clay-well p-[16px] rounded-[18px] space-y-[6px]"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="uppercase font-bold tracking-wider text-[#8A8880] dark:text-[#9A9691]">
                    {detail.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenSource(detail.sourceRef)}
                    className="font-mono text-[#D9924D] dark:text-[#E8863C] hover:underline cursor-pointer"
                  >
                    {detail.sourceRef}
                  </button>
                </div>
                <div className="font-semibold text-[13px] text-[#3A3A38] dark:text-[#E8E4DD]">
                  {detail.item}
                </div>
                <div className="text-[12px] font-mono font-bold text-[#7FA398] clay-card px-[10px] py-[6px] rounded-[10px]">
                  {detail.valueOrDetail}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Stated Conclusions */}
      {(viewMode === 'all' || viewMode === 'brief') && (
        <section className="clay-card p-[20px] sm:p-[26px] space-y-[14px]">
          <div className="flex items-center gap-[8px] text-[12px] font-mono font-bold uppercase tracking-wider text-[#5B9A7D] dark:text-[#68B993]">
            <CheckCircle2 className="w-[15px] h-[15px]" />
            <span>Stated Conclusions & Final Outcomes</span>
          </div>

          <ul className="space-y-[10px]">
            {summary.conclusions.map((item, idx) => (
              <li
                key={idx}
                className="text-[14px] sm:text-[15px] text-[#3A3A38] dark:text-[#E8E4DD] flex items-start gap-[10px] leading-relaxed max-w-[75ch]"
              >
                <span className="mt-[2px] text-[#5B9A7D] dark:text-[#68B993] font-bold">✓</span>
                <div className="flex-1">
                  <span>{item.statement}</span>{' '}
                  <button
                    type="button"
                    onClick={() => onOpenSource(item.sourceRef)}
                    className="clay-btn-secondary inline-flex items-center gap-[2px] text-[10px] font-mono px-[8px] py-[2px] rounded-full ml-[4px] cursor-pointer"
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
        <section className="clay-card p-[20px] sm:p-[26px] space-y-[10px] border-2 border-[#D96B4D]">
          <div className="flex items-center gap-[8px] text-[12px] font-mono font-bold uppercase tracking-wider text-[#D96B4D]">
            <AlertOctagon className="w-[15px] h-[15px]" />
            <span>Preserved Ambiguities & Document Qualifications</span>
          </div>
          <p className="text-[13px] text-[#8A8880] dark:text-[#9A9691] max-w-[75ch]">
            Per strict zero-hallucination rules, conflicting or qualified statements in the source are preserved rather than resolved:
          </p>
          <ul className="space-y-[8px] pt-[4px]">
            {summary.contradictionsOrUncertainties.map((item, idx) => (
              <li key={idx} className="text-[13px] sm:text-[14px] text-[#3A3A38] dark:text-[#E8E4DD] flex items-start gap-[10px] max-w-[75ch]">
                <span className="text-[#D96B4D] font-bold">•</span>
                <div>
                  <span>{item.issue}</span>{' '}
                  <span className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">({item.sourceRef})</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
