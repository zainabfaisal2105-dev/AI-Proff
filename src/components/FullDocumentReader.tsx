import React, { useState, useRef } from 'react';
import { DocumentSection, UserHighlight, UserNote } from '../types';
import {
  FileText,
  Sparkles,
  Lightbulb,
  MessageSquare,
  BookmarkPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  Loader2,
  Bookmark,
  ExternalLink,
} from 'lucide-react';
import { StatusBead } from './StatusBead';

interface FullDocumentReaderProps {
  sections: DocumentSection[];
  activeSectionId: string;
  onSelectSection: (sectionId: string) => void;
  highlights: UserHighlight[];
  onPassageAction: (passage: string, action: 'explain' | 'simplify' | 'ask' | 'note', sectionLabel: string) => void;
  notes?: UserNote[];
  documentTitle?: string;
}

export const FullDocumentReader: React.FC<FullDocumentReaderProps> = ({
  sections,
  activeSectionId,
  onSelectSection,
  highlights,
  onPassageAction,
  notes = [],
  documentTitle = 'Document',
}) => {
  const currentSectionIndex = Math.max(0, sections.findIndex((s) => s.id === activeSectionId));
  const currentSection = sections[currentSectionIndex] || sections[0];
  const [selectedText, setSelectedText] = useState<string>('');
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const readerContainerRef = useRef<HTMLDivElement>(null);

  // Quick inline simplification state
  const [inlineExplanation, setInlineExplanation] = useState<{
    passage: string;
    action: 'simplify' | 'explain';
    resultText: string;
    loading: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleMouseUp = () => {
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
          x: Math.max(20, rect.left - containerRect.left + rect.width / 2),
          y: Math.max(10, rect.top - containerRect.top - 54),
        });
      }
    } else {
      setPopoverPos(null);
      setSelectedText('');
    }
  };

  const handleInlineSimplify = async (action: 'simplify' | 'explain') => {
    if (!selectedText) return;
    const passage = selectedText;
    setPopoverPos(null);
    window.getSelection()?.removeAllRanges();

    setInlineExplanation({
      passage,
      action,
      resultText: '',
      loading: true,
    });

    try {
      const res = await fetch('/api/explain-passage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage,
          action,
          sectionContext: currentSection?.label || 'General',
          documentTitle,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setInlineExplanation({
          passage,
          action,
          resultText: data.result || 'No simplification produced.',
          loading: false,
        });
      } else {
        setInlineExplanation({
          passage,
          action,
          resultText: 'Failed to simplify passage.',
          loading: false,
        });
      }
    } catch {
      setInlineExplanation({
        passage,
        action,
        resultText: 'Error connecting to comprehension assistant.',
        loading: false,
      });
    }
  };

  const handleActionClick = (action: 'explain' | 'simplify' | 'ask' | 'note') => {
    if (!selectedText) return;
    onPassageAction(selectedText, action, currentSection?.label || 'General');
    setPopoverPos(null);
    window.getSelection()?.removeAllRanges();
  };

  const sectionNotes = notes.filter((n) => n.sectionLabel === currentSection?.label);

  const prevSection = currentSectionIndex > 0 ? sections[currentSectionIndex - 1] : null;
  const nextSection = currentSectionIndex < sections.length - 1 ? sections[currentSectionIndex + 1] : null;

  return (
    <div className="flex flex-col lg:flex-row gap-[20px] items-start w-full">
      {/* Left-Hand Rail: Sections / Chapters navigation */}
      <aside className="w-full lg:w-[280px] shrink-0 space-y-[12px]">
        <div className="clay-card p-[16px] space-y-[12px]">
          <div className="flex items-center justify-between pb-[10px] border-b border-[#C9D6C9] dark:border-[#464A52]">
            <div className="flex items-center gap-[8px]">
              <StatusBead status="reading" size="sm" showPulse />
              <h3 className="font-serif font-bold text-[14px] text-[#3A3A38] dark:text-[#E8E4DD]">
                Sections & Chapters
              </h3>
            </div>
            <span className="text-[10px] font-mono px-[8px] py-[2px] rounded-full clay-well text-[#8A8880] dark:text-[#9A9691]">
              {sections.length}
            </span>
          </div>

          {/* Section Pill Buttons: Stacked on desktop, horizontal scroll on mobile */}
          <nav aria-label="Document sections" className="flex lg:flex-col gap-[8px] overflow-x-auto lg:overflow-x-visible pb-[4px] lg:pb-0">
            {sections.map((sec, idx) => {
              const isActive = sec.id === activeSectionId;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onSelectSection(sec.id)}
                  className={`min-w-[190px] lg:min-w-0 w-full text-left px-[14px] py-[10px] rounded-full text-[12px] font-medium transition-all flex items-center justify-between gap-[8px] cursor-pointer shrink-0 ${
                    isActive
                      ? 'clay-btn-primary shadow-xs font-semibold'
                      : 'clay-well text-[#3A3A38] dark:text-[#E8E4DD] hover:border-[#7FA398] dark:hover:border-[#7FA398]'
                  }`}
                >
                  <div className="flex items-center gap-[8px] truncate">
                    <span
                      className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-[#C9D6C9] dark:bg-[#464A52] text-[#3A3A38] dark:text-[#E8E4DD]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="truncate">{sec.label}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono shrink-0 ${
                      isActive ? 'text-white/85' : 'text-[#8A8880] dark:text-[#9A9691]'
                    }`}
                  >
                    {sec.wordCount}w
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Reading Pane */}
      <div
        ref={readerContainerRef}
        onMouseUp={handleMouseUp}
        className="clay-card flex-1 w-full p-[22px] sm:p-[36px] lg:p-[42px] space-y-[28px] relative"
      >
        {/* Reader Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[16px] pb-[20px] border-b border-[#C9D6C9] dark:border-[#464A52]">
          <div className="flex items-center gap-[12px]">
            <StatusBead status="reading" size="md" showPulse />
            <div>
              <div className="flex items-center gap-[8px]">
                <h2 className="font-serif font-bold text-[20px] sm:text-[22px] text-[#3A3A38] dark:text-[#E8E4DD]">
                  {currentSection?.label || 'Document Section'}
                </h2>
                <span className="text-[11px] font-mono px-[8px] py-[2px] rounded-full clay-well text-[#8A8880] dark:text-[#9A9691]">
                  Section {currentSectionIndex + 1} of {sections.length} · {currentSection?.wordCount?.toLocaleString() || 0} words
                </span>
              </div>
              <p className="text-[12px] font-mono text-[#8A8880] dark:text-[#9A9691] mt-[3px]">
                Highlight any passage to simplify into plain language, request explanation, or attach notes.
              </p>
            </div>
          </div>

          {/* Quick Prev / Next chapter controls */}
          <div className="flex items-center gap-[8px] shrink-0">
            <button
              type="button"
              disabled={!prevSection}
              onClick={() => prevSection && onSelectSection(prevSection.id)}
              className="w-[34px] h-[34px] rounded-full clay-well flex items-center justify-center text-[#3A3A38] dark:text-[#E8E4DD] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:border-[#D9924D] dark:hover:border-[#E8863C]"
              title={prevSection ? `Previous: ${prevSection.label}` : 'First section'}
            >
              <ChevronLeft className="w-[15px] h-[15px]" />
            </button>
            <button
              type="button"
              disabled={!nextSection}
              onClick={() => nextSection && onSelectSection(nextSection.id)}
              className="w-[34px] h-[34px] rounded-full clay-well flex items-center justify-center text-[#3A3A38] dark:text-[#E8E4DD] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:border-[#D9924D] dark:hover:border-[#E8863C]"
              title={nextSection ? `Next: ${nextSection.label}` : 'Last section'}
            >
              <ChevronRight className="w-[15px] h-[15px]" />
            </button>
          </div>
        </div>

      {/* Floating Action Popover on Text Selection */}
      {popoverPos && (
        <div
          style={{
            left: `${popoverPos.x}px`,
            top: `${popoverPos.y}px`,
            transform: 'translateX(-50%)',
          }}
          className="absolute z-30 flex items-center gap-[4px] p-[5px] rounded-full bg-[#E3ECE3] dark:bg-[#202226] text-[#3A3A38] dark:text-[#E8E4DD] shadow-[0_12px_30px_rgba(70,95,80,0.2)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.35)] border border-[#C9D6C9] dark:border-white/20 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Primary Accent CTA: Simplify */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleInlineSimplify('simplify'); }}
            className="h-[32px] px-[12px] rounded-full bg-[#D9924D] dark:bg-[#E8863C] hover:bg-[#C8833F] text-white text-[11px] font-semibold flex items-center gap-[5px] shadow-xs cursor-pointer"
            title="Explain in plainer language right here"
          >
            <Sparkles className="w-[12px] h-[12px]" />
            <span>Simplify</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleActionClick('explain'); }}
            className="h-[32px] px-[10px] rounded-full hover:bg-[#D6E0D6] dark:hover:bg-white/10 text-[11px] font-medium flex items-center gap-[4px] transition-colors cursor-pointer text-[#3A3A38] dark:text-[#E8E4DD]"
            title="Break down technical terminology"
          >
            <Lightbulb className="w-[12px] h-[12px] text-[#7FA398]" />
            <span>Explain</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleActionClick('ask'); }}
            className="h-[32px] px-[10px] rounded-full hover:bg-[#D6E0D6] dark:hover:bg-white/10 text-[11px] font-medium flex items-center gap-[4px] transition-colors cursor-pointer text-[#3A3A38] dark:text-[#E8E4DD]"
            title="Ask question about this sentence in grounded chat"
          >
            <MessageSquare className="w-[12px] h-[12px] text-[#7FA398]" />
            <span>Ask</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleActionClick('note'); }}
            className="h-[32px] px-[10px] rounded-full hover:bg-[#D6E0D6] dark:hover:bg-white/10 text-[11px] font-medium flex items-center gap-[4px] transition-colors cursor-pointer text-[#3A3A38] dark:text-[#E8E4DD]"
            title="Attach a personal research note"
          >
            <BookmarkPlus className="w-[12px] h-[12px] text-[#D9924D] dark:text-[#E8863C]" />
            <span>Note</span>
          </button>
        </div>
      )}

      {/* Inline Simplify-on-Demand Card (rendered right in the reader view) */}
      {inlineExplanation && (
        <div className="clay-card p-[18px] sm:p-[22px] border-2 border-[#D9924D] dark:border-[#E8863C] relative animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-[10px] border-b border-[#C9D6C9] dark:border-[#464A52]">
            <div className="flex items-center gap-[8px]">
              <StatusBead status="processing" size="sm" showPulse={inlineExplanation.loading} />
              <span className="font-serif font-bold text-[14px] text-[#D9924D] dark:text-[#E8863C] flex items-center gap-[6px]">
                <Sparkles className="w-[14px] h-[14px]" />
                <span>
                  {inlineExplanation.action === 'simplify'
                    ? 'Plain Language Simplification'
                    : 'Technical Concept Breakdown'}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-[8px]">
              {!inlineExplanation.loading && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(inlineExplanation.resultText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-[6px] rounded-full clay-well text-[#8A8880] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD] cursor-pointer"
                  title="Copy explanation"
                >
                  {copied ? <Check className="w-[12px] h-[12px] text-[#5B9A7D]" /> : <Copy className="w-[12px] h-[12px]" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setInlineExplanation(null)}
                className="p-[6px] rounded-full clay-well text-[#8A8880] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD] cursor-pointer"
                title="Dismiss"
              >
                <X className="w-[12px] h-[12px]" />
              </button>
            </div>
          </div>

          {/* Original excerpt snippet */}
          <div className="mt-[10px] text-[12px] font-mono text-[#8A8880] dark:text-[#9A9691] italic border-l-2 border-[#7FA398] pl-[10px]">
            "{inlineExplanation.passage}"
          </div>

          {/* Explanation Output */}
          <div className="mt-[12px]">
            {inlineExplanation.loading ? (
              <div className="flex items-center gap-[8px] text-[13px] font-mono text-[#D9924D] dark:text-[#E8863C] py-[10px]">
                <Loader2 className="w-[16px] h-[16px] animate-spin" />
                <span>Translating dense technical terminology into accessible concepts...</span>
              </div>
            ) : (
              <div className="text-[14px] leading-relaxed text-[#3A3A38] dark:text-[#E8E4DD] font-sans">
                {inlineExplanation.resultText}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Document Body Typography: generous margins, high contrast, generous line-height */}
      <div className="max-w-[72ch] mx-auto py-[16px] space-y-[24px]">
        <div className="text-[17px] sm:text-[18px] leading-[1.95] sm:leading-[2.05] font-serif text-[#3A3A38] dark:text-[#E8E4DD] select-text whitespace-pre-wrap selection:bg-[#7FA398]/30 dark:selection:bg-[#E8863C]/35 tracking-[0.01em]">
          {currentSection?.content}
        </div>
      </div>

      {/* Bottom Section Navigator */}
      <div className="pt-[24px] border-t border-[#C9D6C9] dark:border-[#464A52] flex flex-col sm:flex-row items-center justify-between gap-[12px]">
        {prevSection ? (
          <button
            type="button"
            onClick={() => onSelectSection(prevSection.id)}
            className="clay-btn-neutral h-[40px] px-[16px] text-[12px] font-medium flex items-center gap-[8px] rounded-full cursor-pointer w-full sm:w-auto justify-center"
          >
            <ChevronLeft className="w-[14px] h-[14px] text-[#D9924D] dark:text-[#E8863C]" />
            <span className="truncate max-w-[200px]">Prev: {prevSection.label}</span>
          </button>
        ) : <div />}

        <span className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
          Section {currentSectionIndex + 1} of {sections.length}
        </span>

        {nextSection ? (
          <button
            type="button"
            onClick={() => onSelectSection(nextSection.id)}
            className="clay-btn-primary h-[40px] px-[18px] text-[12px] font-medium flex items-center gap-[8px] rounded-full cursor-pointer w-full sm:w-auto justify-center"
          >
            <span className="truncate max-w-[200px]">Next: {nextSection.label}</span>
            <ChevronRight className="w-[14px] h-[14px]" />
          </button>
        ) : <div />}
      </div>

      {/* Attached Notes for this Section (Clay Sticky-Note Cards) */}
      {sectionNotes.length > 0 && (
        <div className="pt-[20px] border-t border-[#C9D6C9] dark:border-[#464A52] space-y-[12px]">
          <div className="flex items-center gap-[8px]">
            <StatusBead status="synced" size="sm" />
            <h4 className="font-serif font-bold text-[14px] text-[#3A3A38] dark:text-[#E8E4DD]">
              Attached Notes for this Section ({sectionNotes.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
            {sectionNotes.map((n) => (
              <div key={n.id} className="clay-sticky-note p-[16px] space-y-[8px]">
                {n.targetText && (
                  <p className="text-[11px] font-mono italic text-[#8A8880] dark:text-[#9A9691] border-l-2 border-[#D9924D] dark:border-[#E8863C] pl-[8px] line-clamp-2">
                    "{n.targetText}"
                  </p>
                )}
                <p className="text-[13px] text-[#3A3A38] dark:text-[#E8E4DD] leading-relaxed">
                  {n.noteContent}
                </p>
                <div className="flex justify-between items-center text-[10px] font-mono text-[#8A8880] dark:text-[#9A9691] pt-[4px]">
                  <span>{new Date(n.updatedAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-[4px] text-[#7FA398]">
                    <Bookmark className="w-[10px] h-[10px]" />
                    <span>Saved note</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
