import React, { useState, useRef } from 'react';
import { DocumentSection, UserHighlight } from '../types';
import {
  FileText,
  Lightbulb,
  Sparkles,
  MessageSquare,
  BookmarkPlus,
  Compass,
  ChevronDown,
} from 'lucide-react';

interface FullDocumentReaderProps {
  sections: DocumentSection[];
  activeSectionId: string;
  onSelectSection: (sectionId: string) => void;
  highlights: UserHighlight[];
  onPassageAction: (passage: string, action: 'explain' | 'simplify' | 'ask' | 'note', sectionLabel: string) => void;
}

export const FullDocumentReader: React.FC<FullDocumentReaderProps> = ({
  sections,
  activeSectionId,
  onSelectSection,
  highlights,
  onPassageAction,
}) => {
  const currentSection = sections.find((s) => s.id === activeSectionId) || sections[0];
  const [selectedText, setSelectedText] = useState<string>('');
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const readerContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setPopoverPos(null);
      setSelectedText('');
      return;
    }

    const text = selection.toString().trim();
    if (text.length >= 3) {
      setSelectedText(text);
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = readerContainerRef.current?.getBoundingClientRect();

      if (containerRect) {
        setPopoverPos({
          x: Math.max(10, rect.left - containerRect.left + rect.width / 2),
          y: Math.max(10, rect.top - containerRect.top - 48),
        });
      }
    } else {
      setPopoverPos(null);
      setSelectedText('');
    }
  };

  const handleActionClick = (action: 'explain' | 'simplify' | 'ask' | 'note') => {
    if (!selectedText) return;
    onPassageAction(selectedText, action, currentSection?.label || 'General');
    setPopoverPos(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div
      ref={readerContainerRef}
      onMouseUp={handleMouseUp}
      className="relative bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden"
    >
      {/* Reader Top Controls */}
      <div className="px-[20px] py-[16px] border-b border-[#EAEFEA] dark:border-[#373A42] flex flex-col sm:flex-row sm:items-center justify-between gap-[12px] bg-[#FAFBF9] dark:bg-[#23252A]">
        <div className="flex items-center gap-[10px]">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-[#EFF4F1] dark:bg-[#32363E] text-[#BA7A48] dark:text-[#EDEDED] flex items-center justify-center">
            <FileText className="w-[16px] h-[16px]" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-[15px] text-[#18221D] dark:text-[#F5F6F8]">
              Document Text Reader
            </h3>
            <p className="text-[11px] font-mono text-[#6A7B72] dark:text-[#8E93A0]">
              Highlight any passage to Explain, Simplify, Ask, or Add to Notes
            </p>
          </div>
        </div>

        {/* Section Selector Dropdown */}
        <div className="flex items-center gap-[8px]">
          <span className="text-[11px] font-mono text-[#6A7B72] dark:text-[#8E93A0]">
            Section:
          </span>
          <div className="relative">
            <select
              value={activeSectionId}
              onChange={(e) => onSelectSection(e.target.value)}
              className="appearance-none h-[34px] pl-[10px] pr-[28px] rounded-[8px] bg-white dark:bg-[#1E2024] border border-[#CCD7D1] dark:border-[#3C4049] text-[12px] font-medium text-[#18221D] dark:text-[#F5F6F8] focus:outline-hidden focus:border-[#BA7A48] cursor-pointer"
            >
              {sections.map((s, idx) => (
                <option key={s.id} value={s.id}>
                  {idx + 1}. {s.label} ({s.wordCount}w)
                </option>
              ))}
            </select>
            <ChevronDown className="w-[12px] h-[12px] text-[#6A7B72] absolute right-[8px] top-[11px] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Floating Action Popover */}
      {popoverPos && (
        <div
          style={{
            left: `${popoverPos.x}px`,
            top: `${popoverPos.y}px`,
            transform: 'translateX(-50%)',
          }}
          className="absolute z-30 flex items-center gap-[4px] p-[4px] rounded-[10px] bg-[#18221D] text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-[#34463C] animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            type="button"
            onClick={() => handleActionClick('explain')}
            className="px-[8px] py-[4px] rounded-[6px] hover:bg-[#34463C] text-[11px] font-medium flex items-center gap-[4px] transition-colors cursor-pointer"
            title="Explain what this passage means"
          >
            <Lightbulb className="w-[12px] h-[12px] text-[#BA7A48]" />
            <span>Explain</span>
          </button>
          <span className="w-[1px] h-[12px] bg-[#34463C]" />
          <button
            type="button"
            onClick={() => handleActionClick('simplify')}
            className="px-[8px] py-[4px] rounded-[6px] hover:bg-[#34463C] text-[11px] font-medium flex items-center gap-[4px] transition-colors cursor-pointer"
            title="Simplify the wording without changing meaning"
          >
            <Sparkles className="w-[12px] h-[12px] text-[#4ADE80]" />
            <span>Simplify</span>
          </button>
          <span className="w-[1px] h-[12px] bg-[#34463C]" />
          <button
            type="button"
            onClick={() => handleActionClick('ask')}
            className="px-[8px] py-[4px] rounded-[6px] hover:bg-[#34463C] text-[11px] font-medium flex items-center gap-[4px] transition-colors cursor-pointer"
            title="Ask a question about this excerpt"
          >
            <MessageSquare className="w-[12px] h-[12px] text-[#60A5FA]" />
            <span>Ask</span>
          </button>
          <span className="w-[1px] h-[12px] bg-[#34463C]" />
          <button
            type="button"
            onClick={() => handleActionClick('note')}
            className="px-[8px] py-[4px] rounded-[6px] hover:bg-[#34463C] text-[11px] font-medium flex items-center gap-[4px] transition-colors cursor-pointer"
            title="Save note attached to this excerpt"
          >
            <BookmarkPlus className="w-[12px] h-[12px] text-[#FBBF24]" />
            <span>Note</span>
          </button>
        </div>
      )}

      {/* Reader Body with Typography */}
      <div className="p-[24px] sm:p-[36px] max-w-[840px] mx-auto space-y-[20px]">
        <div className="space-y-[6px] pb-[16px] border-b border-[#EAEFEA] dark:border-[#373A42]">
          <span className="font-mono text-[11px] text-[#8E9E95] dark:text-[#7A808C] uppercase tracking-wider">
            Original Document Section
          </span>
          <h2 className="font-serif font-bold text-[22px] sm:text-[26px] text-[#18221D] dark:text-[#F5F6F8] leading-tight">
            {currentSection?.label}
          </h2>
        </div>

        {/* Text Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none text-[15px] sm:text-[16px] leading-[1.75] font-serif text-[#283830] dark:text-[#D5D8E0] select-text whitespace-pre-wrap">
          {currentSection?.content}
        </div>
      </div>
    </div>
  );
};
