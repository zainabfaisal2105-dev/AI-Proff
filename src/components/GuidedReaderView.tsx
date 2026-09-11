import React, { useState, useEffect } from 'react';
import { DocumentSection, GuidedSection } from '../types';
import {
  Compass,
  Lightbulb,
  Hash,
  BookMarked,
  ArrowLeft,
  ArrowRight,
  FileText,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface GuidedReaderViewProps {
  sections: DocumentSection[];
  activeSectionId: string;
  onSelectSection: (sectionId: string) => void;
  documentTitle: string;
  onOpenSourceModal: (sectionLabel: string) => void;
  onOpenPassageAction: (passage: string, action: 'explain' | 'simplify' | 'ask' | 'note') => void;
}

export const GuidedReaderView: React.FC<GuidedReaderViewProps> = ({
  sections,
  activeSectionId,
  onSelectSection,
  documentTitle,
  onOpenSourceModal,
  onOpenPassageAction,
}) => {
  const currentIndex = sections.findIndex((s) => s.id === activeSectionId);
  const currentSection = sections[currentIndex] || sections[0];

  const [guidedData, setGuidedData] = useState<Record<string, GuidedSection>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewTab, setViewTab] = useState<'ai_breakdown' | 'source_text'>('ai_breakdown');

  // Fetch or retrieve cached guided walkthrough for current section
  useEffect(() => {
    if (!currentSection) return;

    if (guidedData[currentSection.id]) {
      return;
    }

    let isMounted = true;
    const fetchGuidedSection = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/guided-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: currentSection,
            allSections: sections,
            documentTitle,
          }),
        });

        if (res.ok && isMounted) {
          const data: GuidedSection = await res.json();
          setGuidedData((prev) => ({ ...prev, [currentSection.id]: data }));
        }
      } catch (err) {
        console.error('Failed to load guided section:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchGuidedSection();
    return () => {
      isMounted = false;
    };
  }, [currentSection?.id, documentTitle]);

  const activeGuided = currentSection ? guidedData[currentSection.id] : null;

  // Handle text selection in source text or explanation
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const selectedText = selection.toString().trim();
    if (selectedText.length > 5) {
      // User selected text; let's allow quick action
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectSection(sections[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < sections.length - 1) {
      onSelectSection(sections[currentIndex + 1].id);
    }
  };

  return (
    <div className="space-y-[20px]" onMouseUp={handleMouseUp}>
      {/* Section Top Header & Navigation Stepper */}
      <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] p-[16px] sm:p-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-[16px]">
        <div className="space-y-[4px]">
          <div className="flex items-center gap-[8px]">
            <span className="font-mono text-[11px] px-[8px] py-[2px] rounded-[6px] bg-[#EFF4F1] dark:bg-[#32363E] text-[#34463C] dark:text-[#D2D5DD] border border-[#D4DFD9] dark:border-[#424650] font-semibold">
              Section {currentIndex + 1} of {sections.length}
            </span>
            <span className="font-mono text-[11px] text-[#6A7B72] dark:text-[#8E93A0]">
              {currentSection?.wordCount.toLocaleString()} words
            </span>
          </div>
          <h2 className="font-serif font-bold text-[18px] sm:text-[20px] text-[#18221D] dark:text-[#F5F6F8]">
            {currentSection?.label}
          </h2>
        </div>

        {/* View Toggle & Stepper */}
        <div className="flex items-center gap-[10px] shrink-0">
          {/* Dual Toggle: AI Breakdown vs Original Source */}
          <div className="flex items-center p-[3px] rounded-[10px] bg-[#EFF4F1] dark:bg-[#222428] border border-[#DCE3DF] dark:border-[#373A42]">
            <button
              type="button"
              onClick={() => setViewTab('ai_breakdown')}
              className={`px-[12px] py-[6px] rounded-[7px] text-[12px] font-medium transition-all cursor-pointer ${
                viewTab === 'ai_breakdown'
                  ? 'bg-white dark:bg-[#2A2D33] text-[#18221D] dark:text-[#F5F6F8] shadow-xs font-semibold'
                  : 'text-[#5D6D65] dark:text-[#9EA2AE] hover:text-[#18221D] dark:hover:text-[#FFFFFF]'
              }`}
            >
              AI Breakdown
            </button>
            <button
              type="button"
              onClick={() => setViewTab('source_text')}
              className={`px-[12px] py-[6px] rounded-[7px] text-[12px] font-medium transition-all cursor-pointer ${
                viewTab === 'source_text'
                  ? 'bg-white dark:bg-[#2A2D33] text-[#18221D] dark:text-[#F5F6F8] shadow-xs font-semibold'
                  : 'text-[#5D6D65] dark:text-[#9EA2AE] hover:text-[#18221D] dark:hover:text-[#FFFFFF]'
              }`}
            >
              Original Source
            </button>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-[6px]">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="h-[36px] px-[10px] rounded-[8px] border border-[#CCD7D1] dark:border-[#3C4049] bg-white dark:bg-[#25282E] text-[#283830] dark:text-[#D5D8E0] hover:bg-[#EFF4F1] dark:hover:bg-[#32363E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-[4px] text-[12px] font-medium cursor-pointer"
            >
              <ArrowLeft className="w-[14px] h-[14px]" />
              <span className="hidden sm:inline">Prev</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === sections.length - 1}
              className="h-[36px] px-[12px] rounded-[8px] bg-[#BA7A48] hover:bg-[#A96D3C] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-[4px] text-[12px] font-medium shadow-xs cursor-pointer"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="w-[14px] h-[14px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Guided Content */}
      {viewTab === 'ai_breakdown' ? (
        <div className="space-y-[20px]">
          {isLoading && !activeGuided ? (
            <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] p-[40px] text-center space-y-[12px]">
              <Loader2 className="w-[28px] h-[28px] animate-spin text-[#BA7A48] dark:text-[#EDEDED] mx-auto" />
              <p className="text-[13px] font-serif text-[#18221D] dark:text-[#F5F6F8]">
                Reading and synthesizing guided breakdown for {currentSection?.label}...
              </p>
              <p className="text-[11px] text-[#5D6D65] dark:text-[#9EA2AE] font-mono">
                Preserving exact numbers, technical definitions, and findings without extrapolation.
              </p>
            </div>
          ) : (
            <>
              {/* Distinct Banner Clarifying Boundary */}
              <div className="px-[16px] py-[10px] rounded-[10px] bg-[#F2F6F3] dark:bg-[#1E2024] border border-[#CCD7D1] dark:border-[#373A42] flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-[8px] text-[#283830] dark:text-[#D5D8E0]">
                  <span className="w-[8px] h-[8px] rounded-full bg-[#BA7A48] dark:bg-[#EDEDED]" />
                  <span>
                    <strong>Guided Explanation:</strong> Grounded interpretation of author claims. Click any text to highlight or inspect.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenSourceModal(currentSection?.label || '')}
                  className="text-[11px] font-mono text-[#BA7A48] dark:text-[#EDEDED] hover:underline flex items-center gap-[4px] cursor-pointer"
                >
                  <ExternalLink className="w-[12px] h-[12px]" />
                  <span>Inspect Raw Source</span>
                </button>
              </div>

              {/* 1. Purpose & Simple Explanation */}
              <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] p-[20px] sm:p-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-[16px]">
                <div className="space-y-[8px]">
                  <div className="flex items-center gap-[8px] text-[#BA7A48] dark:text-[#EDEDED]">
                    <Compass className="w-[16px] h-[16px]" />
                    <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#18221D] dark:text-[#F5F6F8]">
                      Section Purpose
                    </h3>
                  </div>
                  <p className="text-[14px] font-medium text-[#18221D] dark:text-[#F5F6F8] leading-relaxed bg-[#FAFBF9] dark:bg-[#23252A] p-[14px] rounded-[10px] border border-[#EAEFEA] dark:border-[#373A42]">
                    {activeGuided?.purpose || `Covers primary findings and arguments in ${currentSection?.label}.`}
                  </p>
                </div>

                <div className="space-y-[8px] pt-[8px]">
                  <div className="flex items-center gap-[8px] text-[#BA7A48] dark:text-[#EDEDED]">
                    <Lightbulb className="w-[16px] h-[16px]" />
                    <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#18221D] dark:text-[#F5F6F8]">
                      Simple Explanation
                    </h3>
                  </div>
                  <p className="text-[13px] text-[#283830] dark:text-[#D5D8E0] leading-relaxed">
                    {activeGuided?.simpleExplanation || currentSection?.content.slice(0, 300)}
                  </p>
                </div>
              </div>

              {/* 2. Key Ideas & Evidence / Findings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
                {/* Key Ideas */}
                <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] p-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-[12px]">
                  <div className="flex items-center gap-[8px]">
                    <Sparkles className="w-[15px] h-[15px] text-[#BA7A48] dark:text-[#EDEDED]" />
                    <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#18221D] dark:text-[#F5F6F8]">
                      Key Ideas
                    </h3>
                  </div>
                  <ul className="space-y-[8px]">
                    {activeGuided?.keyIdeas.map((idea, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-[8px] text-[13px] text-[#283830] dark:text-[#D5D8E0]"
                      >
                        <span className="w-[6px] h-[6px] rounded-full bg-[#BA7A48] dark:bg-[#EDEDED] mt-[6px] shrink-0" />
                        <span className="leading-relaxed">{idea}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Evidence & What the Document Actually Establishes */}
                <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] p-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-[12px]">
                  <div className="flex items-center gap-[8px]">
                    <CheckCircle2 className="w-[15px] h-[15px] text-[#2E7D32] dark:text-[#4ADE80]" />
                    <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#18221D] dark:text-[#F5F6F8]">
                      Evidence Established
                    </h3>
                  </div>
                  <ul className="space-y-[8px]">
                    {activeGuided?.evidenceFindings.map((evidence, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-[8px] text-[13px] text-[#283830] dark:text-[#D5D8E0]"
                      >
                        <span className="w-[6px] h-[6px] rounded-full bg-[#2E7D32] dark:text-[#4ADE80] mt-[6px] shrink-0" />
                        <span className="leading-relaxed">{evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 3. Important Numbers (Exact Fidelity) */}
              {activeGuided?.importantNumbers && activeGuided.importantNumbers.length > 0 && (
                <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] p-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-[14px]">
                  <div className="flex items-center gap-[8px]">
                    <Hash className="w-[16px] h-[16px] text-[#BA7A48] dark:text-[#EDEDED]" />
                    <h3 className="font-serif font-bold text-[14px] text-[#18221D] dark:text-[#F5F6F8]">
                      Preserved Numbers & Quantitative Parameters
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[10px]">
                    {activeGuided.importantNumbers.map((num, idx) => (
                      <div
                        key={idx}
                        className="p-[12px] rounded-[10px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] flex flex-col justify-between gap-[6px]"
                      >
                        <span className="text-[11px] font-mono text-[#5D6D65] dark:text-[#9EA2AE]">
                          {num.metric}
                        </span>
                        <span className="font-mono font-bold text-[16px] text-[#18221D] dark:text-[#F5F6F8]">
                          {num.value}
                        </span>
                        <span className="text-[11px] text-[#6A7B72] dark:text-[#8E93A0]">
                          {num.context}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Technical Terms Explained in Context */}
              {activeGuided?.technicalTerms && activeGuided.technicalTerms.length > 0 && (
                <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] p-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-[14px]">
                  <div className="flex items-center gap-[8px]">
                    <BookMarked className="w-[16px] h-[16px] text-[#BA7A48] dark:text-[#EDEDED]" />
                    <h3 className="font-serif font-bold text-[14px] text-[#18221D] dark:text-[#F5F6F8]">
                      Technical Terminology (Grounded Context)
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                    {activeGuided.technicalTerms.map((term, idx) => (
                      <div
                        key={idx}
                        className="p-[12px] rounded-[10px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] space-y-[4px]"
                      >
                        <span className="font-mono font-semibold text-[12px] text-[#BA7A48] dark:text-[#EDEDED]">
                          {term.term}
                        </span>
                        <p className="text-[12px] text-[#283830] dark:text-[#D5D8E0] leading-relaxed">
                          {term.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Natural Questions Reader Might Have */}
              {activeGuided?.readerQuestions && activeGuided.readerQuestions.length > 0 && (
                <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] p-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-[14px]">
                  <div className="flex items-center gap-[8px]">
                    <HelpCircle className="w-[16px] h-[16px] text-[#BA7A48] dark:text-[#EDEDED]" />
                    <h3 className="font-serif font-bold text-[14px] text-[#18221D] dark:text-[#F5F6F8]">
                      Questions a Researcher Might Ask About This Section
                    </h3>
                  </div>
                  <div className="space-y-[10px]">
                    {activeGuided.readerQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-[14px] rounded-[10px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] space-y-[6px]"
                      >
                        <h4 className="text-[13px] font-semibold text-[#18221D] dark:text-[#F5F6F8] flex items-center gap-[6px]">
                          <span className="text-[#BA7A48] dark:text-[#EDEDED]">Q:</span> {q.question}
                        </h4>
                        <p className="text-[12px] text-[#283830] dark:text-[#D5D8E0] leading-relaxed pl-[18px]">
                          {q.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Source Text Tab: The raw author words with text selection */
        <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] p-[20px] sm:p-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-[16px]">
          <div className="flex items-center justify-between pb-[12px] border-b border-[#EAEFEA] dark:border-[#373A42]">
            <div className="flex items-center gap-[8px]">
              <FileText className="w-[16px] h-[16px] text-[#BA7A48] dark:text-[#EDEDED]" />
              <h3 className="font-serif font-bold text-[14px] text-[#18221D] dark:text-[#F5F6F8]">
                Original Author Text ({currentSection?.label})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#5D6D65] dark:text-[#9EA2AE]">
              Select any text to Explain, Simplify, Ask, or Take Note
            </span>
          </div>

          <div className="font-mono text-[13px] text-[#18221D] dark:text-[#E2E5EC] leading-relaxed whitespace-pre-wrap select-text p-[16px] rounded-[10px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#EAEFEA] dark:border-[#373A42]">
            {currentSection?.content}
          </div>
        </div>
      )}
    </div>
  );
};
