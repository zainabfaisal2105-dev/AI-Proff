import React, { useState, useEffect, useRef } from 'react';
import { X, Search, FileText, Copy, Check, Hash, BookOpen } from 'lucide-react';
import { ExtractedDocument, DocumentSection } from '../types';

interface SourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document: ExtractedDocument | null;
  targetSectionLabel?: string | null;
}

export const SourceDrawer: React.FC<SourceDrawerProps> = ({
  isOpen,
  onClose,
  document,
  targetSectionLabel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (isOpen && targetSectionLabel && document) {
      // Find matching section by label substring (e.g. "Page 2" or "Section 1")
      const matched = document.sections.find((s) =>
        targetSectionLabel.toLowerCase().includes(s.label.toLowerCase()) ||
        s.label.toLowerCase().includes(targetSectionLabel.toLowerCase())
      );
      if (matched && sectionRefs.current[matched.id]) {
        setTimeout(() => {
          sectionRefs.current[matched.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [isOpen, targetSectionLabel, document]);

  if (!isOpen || !document) return null;

  const handleCopySource = () => {
    navigator.clipboard.writeText(document.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSections = document.sections.filter((sec) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return sec.label.toLowerCase().includes(q) || sec.content.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-[#FAFBF9] dark:bg-[#1E2024] border-l border-[#DCE3DF] dark:border-[#373A42] shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#DCE3DF] dark:border-[#373A42] flex items-center justify-between bg-white dark:bg-[#25282E]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#BA7A48] dark:text-[#EDEDED]" />
            <div>
              <h3 className="font-serif font-bold text-sm text-[#18221D] dark:text-[#F5F6F8]">
                Extracted Source
              </h3>
              <p className="text-[11px] text-[#5D6D65] dark:text-[#9EA2AE] truncate max-w-md">
                {document.title} ({document.fileType.toUpperCase()} · {document.totalWords.toLocaleString()} words · {document.sections.length} sections)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySource}
              className="text-xs text-[#485951] dark:text-[#C5CAD6] hover:text-[#18221D] dark:hover:text-white px-2 py-1 rounded-[8px] border border-[#CCD7D1] dark:border-[#40444F] bg-white dark:bg-[#31343B] flex items-center gap-1 cursor-pointer"
              title="Copy extracted text"
            >
              {copied ? <Check className="w-3 h-3 text-[#2E7D32] dark:text-[#4ADE80]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-[8px] text-[#6A7B72] hover:text-[#18221D] dark:text-[#8E93A0] dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search inside source */}
        <div className="px-5 py-2.5 border-b border-[#DCE3DF] dark:border-[#373A42] bg-[#F3F7F4] dark:bg-[#222428]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#75857D] dark:text-[#7A808C]" />
            <input
              type="text"
              placeholder="Search extracted source terms, numbers, or sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[8px] border border-[#CCD7D1] dark:border-[#40444F] bg-white dark:bg-[#1E2024] text-[#18221D] dark:text-[#F5F6F8] placeholder-[#8A9992] dark:placeholder-[#727784] focus:outline-hidden focus:border-[#BA7A48]"
            />
          </div>
        </div>

        {/* Section navigator pills */}
        <div className="px-5 py-2 border-b border-[#DCE3DF] dark:border-[#373A42] bg-[#EFF4F1] dark:bg-[#1D1F23] flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          {document.sections.map((sec) => {
            const isTarget = targetSectionLabel && (
              targetSectionLabel.toLowerCase().includes(sec.label.toLowerCase()) ||
              sec.label.toLowerCase().includes(targetSectionLabel.toLowerCase())
            );
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  sectionRefs.current[sec.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`whitespace-nowrap px-2.5 py-1 rounded-[6px] border transition-colors cursor-pointer ${
                  isTarget
                    ? 'bg-[#BA7A48] text-white border-[#BA7A48] dark:bg-[#EDEDED] dark:text-[#16181C]'
                    : 'bg-white dark:bg-[#2A2D33] border-[#DCE3DF] dark:border-[#3C4049] text-[#485951] dark:text-[#A0A5B2] hover:bg-[#EAEFEA] dark:hover:bg-[#32363E]'
                }`}
              >
                {sec.label}
              </button>
            );
          })}
        </div>

        {/* Source Content */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6 text-xs text-[#283830] dark:text-[#D5D8E0] leading-relaxed font-sans">
          {filteredSections.map((sec) => {
            const isTarget = targetSectionLabel && (
              targetSectionLabel.toLowerCase().includes(sec.label.toLowerCase()) ||
              sec.label.toLowerCase().includes(targetSectionLabel.toLowerCase())
            );

            return (
              <div
                key={sec.id}
                ref={(el) => { sectionRefs.current[sec.id] = el; }}
                className={`p-4 rounded-[12px] border transition-all ${
                  isTarget
                    ? 'border-[#BA7A48] dark:border-[#EDEDED] bg-[#FAF5F0] dark:bg-[#2D3037] ring-1 ring-[#BA7A48] dark:ring-[#EDEDED]'
                    : 'border-[#DCE3DF] dark:border-[#373A43] bg-white dark:bg-[#25282E]'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EAEFEA] dark:border-[#353942]">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-[#18221D] dark:text-[#F5F6F8]">
                    <Hash className="w-3 h-3 text-[#6A7B72] dark:text-[#8E93A0]" />
                    <span>{sec.label}</span>
                  </div>
                  <span className="text-[10px] text-[#6A7B72] dark:text-[#8E93A0]">
                    {sec.wordCount} words
                  </span>
                </div>
                <div className="whitespace-pre-wrap font-sans text-xs text-[#283830] dark:text-[#C5C8D0] leading-relaxed">
                  {sec.content}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
