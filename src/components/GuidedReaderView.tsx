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
import { StatusBead } from './StatusBead';

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

  useEffect(() => {
    if (!currentSection) return;
    if (guidedData[currentSection.id]) return;

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
    <div className="space-y-[20px]">
      {/* Section Top Header & Navigation Stepper */}
      <div className="clay-card p-[18px] sm:p-[22px] flex flex-col sm:flex-row sm:items-center justify-between gap-[16px] relative">
        <div className="space-y-[4px]">
          <div className="flex items-center gap-[8px]">
            <StatusBead status="reading" size="sm" showPulse={isLoading} />
            <span className="text-[10px] font-mono uppercase font-bold px-[8px] py-[2px] rounded-full clay-well text-[#3A3A38] dark:text-[#E8E4DD]">
              Chapter {currentIndex + 1} of {sections.length}
            </span>
            <span className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
              {currentSection?.wordCount.toLocaleString()} words
            </span>
          </div>
          <h2 className="font-serif font-bold text-[18px] sm:text-[22px] text-[#3A3A38] dark:text-[#E8E4DD]">
            {currentSection?.label}
          </h2>
        </div>

        {/* View Toggle & Circular Stepper */}
        <div className="flex items-center gap-[10px] shrink-0">
          {/* Dual Toggle Pill */}
          <div className="clay-well p-[3px] rounded-full inline-flex items-center">
            <button
              type="button"
              onClick={() => setViewTab('ai_breakdown')}
              className={`h-[32px] px-[14px] rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                viewTab === 'ai_breakdown'
                  ? 'clay-btn-primary shadow-xs'
                  : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
              }`}
            >
              AI Breakdown
            </button>
            <button
              type="button"
              onClick={() => setViewTab('source_text')}
              className={`h-[32px] px-[14px] rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                viewTab === 'source_text'
                  ? 'clay-btn-primary shadow-xs'
                  : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
              }`}
            >
              Original Source
            </button>
          </div>

          {/* Stepper Buttons (Round Controls) */}
          <div className="flex items-center gap-[6px]">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="w-[36px] h-[36px] rounded-full clay-btn-neutral flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Chapter"
            >
              <ArrowLeft className="w-[14px] h-[14px]" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === sections.length - 1}
              className="w-[36px] h-[36px] rounded-full clay-btn-primary flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Next Chapter"
            >
              <ArrowRight className="w-[14px] h-[14px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Guided Content */}
      {viewTab === 'ai_breakdown' ? (
        <div className="space-y-[20px]">
          {isLoading && !activeGuided ? (
            <div className="clay-card p-[40px] text-center space-y-[12px]">
              <Loader2 className="w-[28px] h-[28px] animate-spin text-[#D9924D] dark:text-[#E8863C] mx-auto" />
              <p className="text-[14px] font-serif font-bold text-[#3A3A38] dark:text-[#E8E4DD]">
                Synthesizing guided breakdown for {currentSection?.label}...
              </p>
              <p className="text-[11px] text-[#8A8880] dark:text-[#9A9691] font-mono">
                Preserving exact findings, methodology, and metrics without ungrounded hallucinations.
              </p>
            </div>
          ) : (
            <>
              {/* Grounding Banner */}
              <div className="clay-well px-[16px] py-[10px] rounded-[18px] flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-[8px] text-[#3A3A38] dark:text-[#E8E4DD]">
                  <StatusBead status="grounded" size="sm" />
                  <span>
                    <strong>Grounded Synthesis:</strong> Direct interpretation of author claims.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenSourceModal(currentSection?.label || '')}
                  className="text-[11px] font-mono text-[#D9924D] dark:text-[#E8863C] hover:underline flex items-center gap-[4px] cursor-pointer"
                >
                  <ExternalLink className="w-[12px] h-[12px]" />
                  <span>View Raw Text</span>
                </button>
              </div>

              {/* 1. Purpose & Simple Explanation */}
              <div className="clay-card p-[20px] sm:p-[26px] space-y-[18px]">
                <div className="space-y-[8px]">
                  <div className="flex items-center gap-[8px] text-[#D9924D] dark:text-[#E8863C]">
                    <Compass className="w-[16px] h-[16px]" />
                    <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#3A3A38] dark:text-[#E8E4DD]">
                      Section Purpose
                    </h3>
                  </div>
                  <p className="text-[14px] font-medium text-[#3A3A38] dark:text-[#E8E4DD] leading-relaxed clay-well p-[16px] rounded-[16px]">
                    {activeGuided?.purpose || `Covers primary findings and arguments in ${currentSection?.label}.`}
                  </p>
                </div>

                <div className="space-y-[8px] pt-[6px]">
                  <div className="flex items-center gap-[8px] text-[#7FA398]">
                    <Lightbulb className="w-[16px] h-[16px]" />
                    <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#3A3A38] dark:text-[#E8E4DD]">
                      Simple Explanation
                    </h3>
                  </div>
                  <p className="text-[14px] text-[#3A3A38] dark:text-[#E8E4DD] leading-relaxed">
                    {activeGuided?.simpleExplanation || currentSection?.content.slice(0, 300)}
                  </p>
                </div>
              </div>

              {/* 2. Key Ideas & Evidence / Findings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                <div className="clay-card p-[20px] space-y-[12px]">
                  <div className="flex items-center gap-[8px]">
                    <Sparkles className="w-[15px] h-[15px] text-[#D9924D] dark:text-[#E8863C]" />
                    <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#3A3A38] dark:text-[#E8E4DD]">
                      Key Ideas
                    </h3>
                  </div>
                  <ul className="space-y-[8px]">
                    {activeGuided?.keyIdeas.map((idea, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-[8px] text-[13px] text-[#3A3A38] dark:text-[#E8E4DD]"
                      >
                        <span className="w-[6px] h-[6px] rounded-full bg-[#D9924D] dark:bg-[#E8863C] mt-[6px] shrink-0" />
                        <span className="leading-relaxed">{idea}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="clay-card p-[20px] space-y-[12px]">
                  <div className="flex items-center gap-[8px]">
                    <CheckCircle2 className="w-[15px] h-[15px] text-[#5B9A7D] dark:text-[#68B993]" />
                    <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#3A3A38] dark:text-[#E8E4DD]">
                      Evidence Established
                    </h3>
                  </div>
                  <ul className="space-y-[8px]">
                    {activeGuided?.evidenceFindings.map((evidence, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-[8px] text-[13px] text-[#3A3A38] dark:text-[#E8E4DD]"
                      >
                        <span className="w-[6px] h-[6px] rounded-full bg-[#5B9A7D] dark:bg-[#68B993] mt-[6px] shrink-0" />
                        <span className="leading-relaxed">{evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 3. Important Quantitative Parameters */}
              {activeGuided?.importantNumbers && activeGuided.importantNumbers.length > 0 && (
                <div className="clay-card p-[20px] space-y-[14px]">
                  <div className="flex items-center gap-[8px]">
                    <Hash className="w-[16px] h-[16px] text-[#7FA398]" />
                    <h3 className="font-serif font-bold text-[14px] text-[#3A3A38] dark:text-[#E8E4DD]">
                      Quantitative Findings & Metrics
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[10px]">
                    {activeGuided.importantNumbers.map((num, idx) => (
                      <div
                        key={idx}
                        className="clay-well p-[14px] rounded-[16px] flex flex-col justify-between gap-[6px]"
                      >
                        <span className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
                          {num.metric}
                        </span>
                        <span className="font-mono font-bold text-[17px] text-[#D9924D] dark:text-[#E8863C]">
                          {num.value}
                        </span>
                        <span className="text-[11px] text-[#3A3A38] dark:text-[#E8E4DD]">
                          {num.context}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Technical Terms Explained */}
              {activeGuided?.technicalTerms && activeGuided.technicalTerms.length > 0 && (
                <div className="clay-card p-[20px] space-y-[14px]">
                  <div className="flex items-center gap-[8px]">
                    <BookMarked className="w-[16px] h-[16px] text-[#D9924D] dark:text-[#E8863C]" />
                    <h3 className="font-serif font-bold text-[14px] text-[#3A3A38] dark:text-[#E8E4DD]">
                      Technical Terms in Context
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                    {activeGuided.technicalTerms.map((term, idx) => (
                      <div
                        key={idx}
                        className="clay-well p-[14px] rounded-[16px] space-y-[4px]"
                      >
                        <span className="font-mono font-bold text-[12px] text-[#7FA398]">
                          {term.term}
                        </span>
                        <p className="text-[12px] text-[#3A3A38] dark:text-[#E8E4DD] leading-relaxed">
                          {term.definition}
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
        /* Source Text View */
        <div className="clay-card p-[20px] sm:p-[28px] space-y-[16px]">
          <div className="flex items-center justify-between pb-[12px] border-b border-[#C9D6C9] dark:border-[#464A52]">
            <div className="flex items-center gap-[8px]">
              <FileText className="w-[16px] h-[16px] text-[#D9924D] dark:text-[#E8863C]" />
              <h3 className="font-serif font-bold text-[15px] text-[#3A3A38] dark:text-[#E8E4DD]">
                Original Section Body ({currentSection?.label})
              </h3>
            </div>
          </div>

          <div className="text-[15px] sm:text-[16px] leading-[1.8] font-serif text-[#3A3A38] dark:text-[#E8E4DD] select-text whitespace-pre-wrap clay-well p-[20px] rounded-[18px]">
            {currentSection?.content}
          </div>
        </div>
      )}
    </div>
  );
};
