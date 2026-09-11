import React from 'react';
import { DocumentOverview, ExtractedDocument } from '../types';
import {
  BookOpen,
  Target,
  Cpu,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  MessageSquareText,
  ListTree,
  Sparkles,
} from 'lucide-react';
import { StatusBead } from './StatusBead';
import { WaveProgressMotif } from './WaveProgressMotif';

interface DocumentOverviewCardProps {
  overview: DocumentOverview;
  document: ExtractedDocument;
  onStartGuidedReading: () => void;
  onOpenChat: () => void;
  onOpenSummary: () => void;
  onSelectSection: (sectionId: string) => void;
}

export const DocumentOverviewCard: React.FC<DocumentOverviewCardProps> = ({
  overview,
  document,
  onStartGuidedReading,
  onOpenChat,
  onOpenSummary,
  onSelectSection,
}) => {
  return (
    <div className="space-y-[24px]">
      {/* Primary Overview Clay Card */}
      <div className="clay-card p-[22px] sm:p-[32px] space-y-[24px] relative">
        {/* Header with Title & Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[16px] pb-[20px] border-b border-[#C9D6C9] dark:border-[#464A52]">
          <div className="space-y-[6px]">
            <div className="flex items-center gap-[10px] flex-wrap">
              <StatusBead status="ready" size="sm" showPulse />
              <span className="text-[10px] font-mono uppercase font-bold px-[8px] py-[2px] rounded-full clay-well text-[#3A3A38] dark:text-[#E8E4DD]">
                {document.fileType}
              </span>
              <span className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
                {document.sections.length} Sections · {document.totalWords.toLocaleString()} Words
              </span>
            </div>
            <h1 className="font-serif font-bold text-[22px] sm:text-[26px] text-[#3A3A38] dark:text-[#E8E4DD] leading-tight">
              {document.title}
            </h1>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-[10px] shrink-0 flex-wrap">
            <button
              type="button"
              onClick={onStartGuidedReading}
              className="clay-btn-primary h-[42px] px-[18px] text-[13px] font-medium flex items-center gap-[8px] cursor-pointer"
            >
              <BookOpen className="w-[15px] h-[15px]" />
              <span>Guided Reading</span>
              <ArrowRight className="w-[14px] h-[14px]" />
            </button>
            <button
              type="button"
              onClick={onOpenChat}
              className="clay-btn-neutral h-[42px] px-[16px] text-[13px] font-medium flex items-center gap-[8px] cursor-pointer"
            >
              <MessageSquareText className="w-[15px] h-[15px] text-[#D9924D] dark:text-[#E8863C]" />
              <span>Ask Paper</span>
            </button>
          </div>
        </div>

        {/* Structural Complexity & Section Wave Motif */}
        <div className="space-y-[6px]">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
            <span className="flex items-center gap-[4px]">
              <Sparkles className="w-[12px] h-[12px] text-[#7FA398]" />
              <span>Document Terrain & Section Trajectory</span>
            </span>
            <span>{document.sections.length} chapters mapped</span>
          </div>
          <WaveProgressMotif
            progress={20}
            sectionCount={document.sections.length}
            activeSectionIdx={0}
            height={50}
          />
        </div>

        {/* The 6 Core Academic Research Questions in Clay Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
          {/* 1. What is this document about? */}
          <div className="clay-well p-[18px] rounded-[20px] space-y-[8px]">
            <div className="flex items-center gap-[8px]">
              <div className="w-[26px] h-[26px] rounded-full bg-[#CAD7CA] dark:bg-[#35383D] flex items-center justify-center text-[#D9924D] dark:text-[#E8863C]">
                <BookOpen className="w-[14px] h-[14px]" />
              </div>
              <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#3A3A38] dark:text-[#E8E4DD]">
                What is this document about?
              </h3>
            </div>
            <p className="text-[13px] text-[#3A3A38] dark:text-[#E8E4DD] leading-relaxed">
              {overview.about}
            </p>
          </div>

          {/* 2. What problem/question does it address? */}
          <div className="clay-well p-[18px] rounded-[20px] space-y-[8px]">
            <div className="flex items-center gap-[8px]">
              <div className="w-[26px] h-[26px] rounded-full bg-[#CAD7CA] dark:bg-[#35383D] flex items-center justify-center text-[#D9924D] dark:text-[#E8863C]">
                <Target className="w-[14px] h-[14px]" />
              </div>
              <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#3A3A38] dark:text-[#E8E4DD]">
                What problem does it address?
              </h3>
            </div>
            <p className="text-[13px] text-[#3A3A38] dark:text-[#E8E4DD] leading-relaxed">
              {overview.problemAddressed}
            </p>
          </div>

          {/* 3. What is its main approach? */}
          <div className="clay-well p-[18px] rounded-[20px] space-y-[8px]">
            <div className="flex items-center gap-[8px]">
              <div className="w-[26px] h-[26px] rounded-full bg-[#CAD7CA] dark:bg-[#35383D] flex items-center justify-center text-[#7FA398]">
                <Cpu className="w-[14px] h-[14px]" />
              </div>
              <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#3A3A38] dark:text-[#E8E4DD]">
                What is its main approach?
              </h3>
            </div>
            <p className="text-[13px] text-[#3A3A38] dark:text-[#E8E4DD] leading-relaxed">
              {overview.mainApproach}
            </p>
          </div>

          {/* 4. What should the reader pay attention to? */}
          <div className="clay-well p-[18px] rounded-[20px] space-y-[8px]">
            <div className="flex items-center gap-[8px]">
              <div className="w-[26px] h-[26px] rounded-full bg-[#CAD7CA] dark:bg-[#35383D] flex items-center justify-center text-[#D96B4D] dark:text-[#E87150]">
                <AlertTriangle className="w-[14px] h-[14px]" />
              </div>
              <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#3A3A38] dark:text-[#E8E4DD]">
                What to watch for & caveats?
              </h3>
            </div>
            <p className="text-[13px] text-[#3A3A38] dark:text-[#E8E4DD] leading-relaxed">
              {overview.whatToWatchFor}
            </p>
          </div>
        </div>

        {/* 5. Important Findings (Preserving Exact Metrics) */}
        <div className="clay-well p-[20px] rounded-[20px] space-y-[14px]">
          <div className="flex items-center gap-[8px]">
            <FileCheck className="w-[16px] h-[16px] text-[#7FA398]" />
            <h3 className="font-serif font-bold text-[15px] text-[#3A3A38] dark:text-[#E8E4DD]">
              Key Verified Findings & Metrics
            </h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
            {overview.importantFindings.map((finding, idx) => (
              <li
                key={idx}
                className="flex items-start gap-[10px] text-[13px] text-[#3A3A38] dark:text-[#E8E4DD] p-[12px] rounded-[14px] clay-card leading-relaxed"
              >
                <span className="w-[6px] h-[6px] rounded-full bg-[#D9924D] dark:bg-[#E8863C] mt-[7px] shrink-0" />
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 6. Major Sections / Reading Map Preview */}
        <div className="space-y-[12px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[8px]">
              <ListTree className="w-[16px] h-[16px] text-[#D9924D] dark:text-[#E8863C]" />
              <h3 className="font-serif font-bold text-[15px] text-[#3A3A38] dark:text-[#E8E4DD]">
                Major Document Sections
              </h3>
            </div>
            <button
              type="button"
              onClick={onOpenSummary}
              className="text-[12px] font-mono text-[#D9924D] dark:text-[#E8863C] hover:underline cursor-pointer"
            >
              View Detailed Summary →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
            {overview.majorSections.map((sec, idx) => (
              <div
                key={idx}
                onClick={() => onSelectSection(sec.sectionId)}
                className="clay-card clay-card-interactive p-[14px] cursor-pointer flex items-start gap-[10px]"
              >
                <span className="w-[22px] h-[22px] rounded-full clay-well text-[10px] font-mono font-bold flex items-center justify-center shrink-0 text-[#8A8880]">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-medium text-[#3A3A38] dark:text-[#E8E4DD] truncate">
                    {sec.title}
                  </h4>
                  <p className="text-[11px] text-[#8A8880] dark:text-[#9A9691] mt-[2px] line-clamp-2">
                    {sec.purpose}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
