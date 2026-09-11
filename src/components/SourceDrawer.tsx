import React, { useState, useEffect, useRef } from 'react';
import { X, Search, FileText, Copy, Check, Hash, BookOpen } from 'lucide-react';
import { ExtractedDocument, DocumentSection } from '../types';
import { StatusBead } from './StatusBead';

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
      <div className="w-full max-w-2xl clay-card rounded-none sm:rounded-l-[28px] border-y-0 border-r-0 border-l border-[#E2DBD0] dark:border-[#464A52] h-full flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2DBD0] dark:border-[#464A52] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusBead status="grounded" size="sm" />
            <div>
              <h3 className="font-serif font-bold text-sm text-[#3A3A38] dark:text-[#E8E4DD]">
                Extracted Verbatim Source
              </h3>
              <p className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691] truncate max-w-md">
                {document.title} ({document.fileType.toUpperCase()} · {document.totalWords.toLocaleString()} words)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySource}
              className="clay-btn-neutral h-[32px] px-[10px] text-xs font-medium flex items-center gap-1 cursor-pointer"
              title="Copy extracted text"
            >
              {copied ? <Check className="w-3 h-3 text-[#5B9A7D]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-[32px] h-[32px] rounded-full clay-well flex items-center justify-center text-[#8A8880] hover:text-[#3A3A38] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search inside source */}
        <div className="px-6 py-3 border-b border-[#E2DBD0] dark:border-[#464A52]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-[#8A8880]" />
            <input
              type="text"
              placeholder="Search source terms, numbers, or section titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="clay-well w-full pl-9 pr-4 py-2 text-xs rounded-full text-[#3A3A38] dark:text-[#E8E4DD] placeholder-[#8A8880] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Sections Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredSections.map((sec) => {
            const isTargeted =
              targetSectionLabel &&
              (targetSectionLabel.toLowerCase().includes(sec.label.toLowerCase()) ||
                sec.label.toLowerCase().includes(targetSectionLabel.toLowerCase()));

            return (
              <div
                key={sec.id}
                ref={(el) => {
                  sectionRefs.current[sec.id] = el;
                }}
                className={`p-4 rounded-[20px] transition-all ${
                  isTargeted
                    ? 'clay-well border-2 border-[#D9924D] dark:border-[#E8863C]'
                    : 'clay-card'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#E2DBD0]/60 dark:border-[#464A52]/60 mb-2">
                  <span className="font-mono text-xs font-bold text-[#D9924D] dark:text-[#E8863C]">
                    {sec.label}
                  </span>
                  <span className="text-[10px] font-mono text-[#8A8880] dark:text-[#9A9691]">
                    {sec.wordCount.toLocaleString()} words
                  </span>
                </div>
                <div className="text-xs font-mono leading-relaxed text-[#3A3A38] dark:text-[#E8E4DD] whitespace-pre-wrap select-text">
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
