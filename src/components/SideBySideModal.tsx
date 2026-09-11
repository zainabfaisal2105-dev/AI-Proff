import React, { useState } from 'react';
import { X, Layers, ExternalLink, Check, Copy, Hash } from 'lucide-react';
import { ExtractedDocument, SummaryResult } from '../types';

interface SideBySideModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ExtractedDocument;
  summary: SummaryResult;
}

export const SideBySideModal: React.FC<SideBySideModalProps> = ({
  isOpen,
  onClose,
  document,
  summary,
}) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    document.sections[0]?.id || ''
  );
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const currentSection =
    document.sections.find((s) => s.id === selectedSectionId) || document.sections[0];

  const filteredSections = document.sections.filter((s) =>
    s.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.content.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-[#FAFBF9] dark:bg-[#1E2024] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] w-full max-w-6xl h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#DCE3DF] dark:border-[#373A42] flex items-center justify-between bg-white dark:bg-[#25282E]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#BA7A48] dark:bg-[#EDEDED] text-white dark:text-[#16181C] flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-serif font-bold text-[#18221D] dark:text-[#F5F6F8]">
                  Side-by-Side Source Audit
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#EFF4F1] dark:bg-[#32363E] text-[#34463C] dark:text-[#D2D5DD] border border-[#D4DFD9] dark:border-[#424650]">
                  {document.fileType.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-[#5D6D65] dark:text-[#9EA2AE]">
                Compare original source text directly alongside the grounded summary statements.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-[#6A7B72] dark:text-[#8E93A0] hover:bg-[#EFF4F1] dark:hover:bg-[#32363E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual-pane Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DCE3DF] dark:divide-[#373A42] overflow-hidden">
          {/* Left Pane: Original Source Chunks */}
          <div className="flex flex-col h-full bg-[#FAFBF9] dark:bg-[#1E2024] overflow-hidden">
            <div className="p-3.5 border-b border-[#DCE3DF] dark:border-[#373A42] bg-white dark:bg-[#25282E] flex items-center justify-between">
              <span className="text-xs font-serif font-bold text-[#18221D] dark:text-[#F5F6F8] uppercase tracking-wider">
                Original Source ({document.sections.length} segments)
              </span>
              <span className="text-[11px] font-mono text-[#6A7B72] dark:text-[#8E93A0]">
                {document.totalWords.toLocaleString()} words
              </span>
            </div>

            {/* Segment Selector Tabs */}
            <div className="px-3 py-2 border-b border-[#DCE3DF] dark:border-[#373A42] flex items-center gap-1.5 overflow-x-auto bg-[#F2F6F3] dark:bg-[#222428] text-xs">
              {document.sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`px-3 py-1.5 rounded-[6px] font-mono text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                    sec.id === selectedSectionId
                      ? 'bg-[#BA7A48] text-white dark:bg-[#EDEDED] dark:text-[#16181C] font-semibold shadow-xs'
                      : 'bg-white dark:bg-[#2C2F36] text-[#485951] dark:text-[#A0A5B2] hover:bg-[#E3ECE7] border border-[#CCD7D1] dark:border-[#3C4049]'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Source Content Viewer */}
            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-[#283830] dark:text-[#D5D8E0] leading-relaxed whitespace-pre-wrap select-text">
              {currentSection?.content || 'No section selected'}
            </div>
          </div>

          {/* Right Pane: Generated Summary & Claims */}
          <div className="flex flex-col h-full bg-white dark:bg-[#25282E] overflow-hidden">
            <div className="p-3.5 border-b border-[#DCE3DF] dark:border-[#373A42] flex items-center justify-between">
              <span className="text-xs font-serif font-bold text-[#18221D] dark:text-[#F5F6F8] uppercase tracking-wider">
                Grounded Summary & Claims
              </span>
              <span className="text-[11px] font-mono text-[#2E7D32] dark:text-[#4ADE80]">
                Strictly Faithful
              </span>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
              {/* Overview */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5D6D65] dark:text-[#8E93A0]">
                  Executive Overview
                </h4>
                <p className="text-[#18221D] dark:text-[#F5F6F8] leading-relaxed">
                  {summary.overview}
                </p>
              </div>

              {/* Key Points */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5D6D65] dark:text-[#8E93A0]">
                  Key Points
                </h4>
                <ul className="space-y-2">
                  {summary.keyPoints.map((k, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#283830] dark:text-[#D8DBE2]">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#BA7A48] dark:bg-[#EDEDED] shrink-0" />
                      <div>
                        <span>{k.point}</span>{' '}
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#EFF4F1] dark:bg-[#32363E] text-[#34463C] dark:text-[#A8ACB8] border border-[#D4DFD9] dark:border-[#40444F]">
                          {k.sourceRef}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preserved Figures */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5D6D65] dark:text-[#8E93A0]">
                  Preserved Figures & Metrics
                </h4>
                <div className="space-y-1.5">
                  {summary.importantDetails.map((d, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-[8px] border border-[#DCE3DF] dark:border-[#373A42] bg-[#FAFBF9] dark:bg-[#1E2024] flex items-center justify-between text-xs"
                    >
                      <span className="text-[#34463C] dark:text-[#C5C8D0] font-medium">{d.item}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#18221D] dark:text-[#F5F6F8]">{d.valueOrDetail}</span>
                        <span className="font-mono text-[10px] text-[#6A7B72] dark:text-[#8E93A0]">({d.sourceRef})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
