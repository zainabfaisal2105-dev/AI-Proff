import React, { useState } from 'react';
import { X, Layers, ExternalLink, Check, Copy, Hash } from 'lucide-react';
import { ExtractedDocument, SummaryResult } from '../types';
import { StatusBead } from './StatusBead';

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

  if (!isOpen) return null;

  const currentSection =
    document.sections.find((s) => s.id === selectedSectionId) || document.sections[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="clay-card w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden relative animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#C9D6C9] dark:border-[#464A52] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusBead status="grounded" size="md" showPulse />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-[#3A3A38] dark:text-[#E8E4DD]">
                  Side-by-Side Source Audit
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full clay-well text-[#3A3A38] dark:text-[#E8E4DD]">
                  {document.fileType.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
                Compare original source text directly alongside the grounded summary statements.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-[32px] h-[32px] rounded-full clay-well flex items-center justify-center text-[#8A8880] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dual-pane Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#C9D6C9] dark:divide-[#464A52] overflow-hidden">
          {/* Left Pane: Original Source Chunks */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-3.5 border-b border-[#C9D6C9] dark:border-[#464A52] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#3A3A38] dark:text-[#E8E4DD] uppercase tracking-wider">
                Original Source ({document.sections.length} segments)
              </span>
              <span className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
                {document.totalWords.toLocaleString()} words
              </span>
            </div>

            {/* Segment Selector Tabs */}
            <div className="px-3 py-2 border-b border-[#C9D6C9] dark:border-[#464A52] flex items-center gap-1.5 overflow-x-auto text-xs">
              {document.sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`px-3 py-1.5 rounded-full font-mono text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                    sec.id === selectedSectionId
                      ? 'clay-btn-primary shadow-xs'
                      : 'clay-well text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38]'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Source Content Viewer */}
            <div className="flex-1 p-6 overflow-y-auto font-serif text-sm text-[#3A3A38] dark:text-[#E8E4DD] leading-relaxed whitespace-pre-wrap select-text">
              {currentSection?.content || 'No section selected'}
            </div>
          </div>

          {/* Right Pane: Synthesized Summary Points */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-3.5 border-b border-[#C9D6C9] dark:border-[#464A52] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#7FA398] uppercase tracking-wider">
                Grounded Summary Statements
              </span>
              <span className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
                {summary.keyPoints.length} key points
              </span>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase font-bold text-[#D9924D] dark:text-[#E8863C]">
                  Overview
                </span>
                <p className="text-sm font-sans leading-relaxed text-[#3A3A38] dark:text-[#E8E4DD] clay-well p-3 rounded-[16px]">
                  {summary.overview}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-mono uppercase font-bold text-[#D9924D] dark:text-[#E8863C]">
                  Verified Claims
                </span>
                {summary.keyPoints.map((kp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-[16px] clay-card space-y-1 text-sm text-[#3A3A38] dark:text-[#E8E4DD]"
                  >
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D9924D] dark:bg-[#E8863C] mt-2 shrink-0" />
                      <span className="flex-1 leading-snug">{kp.point}</span>
                    </div>
                    <div className="text-[10px] font-mono text-[#7FA398] pl-3.5">
                      Citation: {kp.sourceRef}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
