import React from 'react';
import { DocumentOverview, ExtractedDocument } from '../types';
import {
  HelpCircle,
  Cpu,
  Target,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  MessageSquareText,
  ListTree,
} from 'lucide-react';

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
      {/* Primary Overview Container */}
      <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] p-[20px] sm:p-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-[24px]">
        {/* Header with Title & Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[16px] pb-[20px] border-b border-[#EAEFEA] dark:border-[#373A42]">
          <div className="space-y-[4px]">
            <div className="flex items-center gap-[8px] flex-wrap">
              <span className="font-mono text-[11px] px-[8px] py-[3px] rounded-[6px] bg-[#EFF4F1] dark:bg-[#32363E] text-[#34463C] dark:text-[#D2D5DD] border border-[#D4DFD9] dark:border-[#424650] uppercase font-semibold">
                {document.fileType}
              </span>
              <span className="font-mono text-[11px] text-[#6A7B72] dark:text-[#8E93A0]">
                {document.sections.length} Sections · {document.totalWords.toLocaleString()} Words
              </span>
            </div>
            <h1 className="font-serif font-bold text-[20px] sm:text-[24px] text-[#18221D] dark:text-[#F5F6F8] leading-tight">
              {document.title}
            </h1>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-[10px] shrink-0 flex-wrap">
            <button
              type="button"
              onClick={onStartGuidedReading}
              className="h-[40px] px-[16px] rounded-[10px] bg-[#BA7A48] hover:bg-[#A96D3C] text-white text-[13px] font-medium transition-colors flex items-center gap-[8px] shadow-xs cursor-pointer"
            >
              <BookOpen className="w-[15px] h-[15px]" />
              <span>Guided Reading</span>
              <ArrowRight className="w-[14px] h-[14px]" />
            </button>
            <button
              type="button"
              onClick={onOpenChat}
              className="h-[40px] px-[14px] rounded-[10px] border border-[#CCD7D1] dark:border-[#3C4049] bg-[#FAFBF9] dark:bg-[#23252A] hover:bg-[#EFF4F1] dark:hover:bg-[#2E3138] text-[#283830] dark:text-[#D5D8E0] text-[13px] font-medium transition-colors flex items-center gap-[6px] cursor-pointer"
            >
              <MessageSquareText className="w-[14px] h-[14px] text-[#BA7A48] dark:text-[#EDEDED]" />
              <span>Ask Paper</span>
            </button>
          </div>
        </div>

        {/* The 6 Core Academic Research Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
          {/* 1. What is this document about? */}
          <div className="p-[16px] rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] space-y-[8px]">
            <div className="flex items-center gap-[8px] text-[#BA7A48] dark:text-[#EDEDED]">
              <BookOpen className="w-[15px] h-[15px]" />
              <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#18221D] dark:text-[#F5F6F8]">
                What is this document about?
              </h3>
            </div>
            <p className="text-[13px] text-[#283830] dark:text-[#D5D8E0] leading-relaxed">
              {overview.about}
            </p>
          </div>

          {/* 2. What problem/question does it address? */}
          <div className="p-[16px] rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] space-y-[8px]">
            <div className="flex items-center gap-[8px] text-[#BA7A48] dark:text-[#EDEDED]">
              <Target className="w-[15px] h-[15px]" />
              <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#18221D] dark:text-[#F5F6F8]">
                What problem does it address?
              </h3>
            </div>
            <p className="text-[13px] text-[#283830] dark:text-[#D5D8E0] leading-relaxed">
              {overview.problemAddressed}
            </p>
          </div>

          {/* 3. What is its main approach? */}
          <div className="p-[16px] rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] space-y-[8px]">
            <div className="flex items-center gap-[8px] text-[#BA7A48] dark:text-[#EDEDED]">
              <Cpu className="w-[15px] h-[15px]" />
              <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#18221D] dark:text-[#F5F6F8]">
                What is its main approach?
              </h3>
            </div>
            <p className="text-[13px] text-[#283830] dark:text-[#D5D8E0] leading-relaxed">
              {overview.mainApproach}
            </p>
          </div>

          {/* 4. What should the reader pay attention to? */}
          <div className="p-[16px] rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] space-y-[8px]">
            <div className="flex items-center gap-[8px] text-[#C62828] dark:text-[#EF5350]">
              <AlertTriangle className="w-[15px] h-[15px]" />
              <h3 className="font-serif font-bold text-[13px] uppercase tracking-wider text-[#18221D] dark:text-[#F5F6F8]">
                What to pay attention to?
              </h3>
            </div>
            <p className="text-[13px] text-[#283830] dark:text-[#D5D8E0] leading-relaxed">
              {overview.whatToWatchFor}
            </p>
          </div>
        </div>

        {/* 5. Important Findings (Preserving Exact Metrics) */}
        <div className="p-[18px] rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] space-y-[12px]">
          <div className="flex items-center gap-[8px]">
            <FileCheck className="w-[16px] h-[16px] text-[#2E7D32] dark:text-[#4ADE80]" />
            <h3 className="font-serif font-bold text-[14px] text-[#18221D] dark:text-[#F5F6F8]">
              Important Document Findings
            </h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
            {overview.importantFindings.map((finding, idx) => (
              <li
                key={idx}
                className="flex items-start gap-[10px] text-[13px] text-[#283830] dark:text-[#D5D8E0] p-[10px] rounded-[8px] bg-white dark:bg-[#2A2D33] border border-[#EAEFEA] dark:border-[#373A42]"
              >
                <span className="w-[6px] h-[6px] rounded-full bg-[#BA7A48] dark:bg-[#EDEDED] mt-[6px] shrink-0" />
                <span className="leading-relaxed">{finding}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 6. Major Sections / Reading Map Preview */}
        <div className="space-y-[12px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[8px]">
              <ListTree className="w-[16px] h-[16px] text-[#BA7A48] dark:text-[#EDEDED]" />
              <h3 className="font-serif font-bold text-[14px] text-[#18221D] dark:text-[#F5F6F8]">
                Major Document Sections
              </h3>
            </div>
            <button
              type="button"
              onClick={onOpenSummary}
              className="text-[12px] font-mono text-[#BA7A48] dark:text-[#EDEDED] hover:underline cursor-pointer"
            >
              View Detailed Summary →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
            {overview.majorSections.map((sec, idx) => (
              <div
                key={idx}
                onClick={() => onSelectSection(sec.sectionId)}
                className="p-[12px] rounded-[10px] bg-white dark:bg-[#25282E] border border-[#DCE3DF] dark:border-[#373A42] hover:border-[#BA7A48] dark:hover:border-[#EDEDED] transition-all cursor-pointer group flex items-start gap-[10px]"
              >
                <span className="font-mono text-[11px] text-[#8E9E95] dark:text-[#7A808C] font-semibold mt-[2px]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-medium text-[#18221D] dark:text-[#F5F6F8] group-hover:text-[#BA7A48] dark:group-hover:text-[#FFFFFF] transition-colors truncate">
                    {sec.title}
                  </h4>
                  <p className="text-[11px] text-[#5D6D65] dark:text-[#9EA2AE] mt-[2px] line-clamp-2">
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
