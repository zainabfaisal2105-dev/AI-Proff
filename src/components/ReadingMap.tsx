import React from 'react';
import { DocumentSection } from '../types';
import { Compass, BookOpen, CheckCircle2 } from 'lucide-react';

interface ReadingMapProps {
  sections: DocumentSection[];
  activeSectionId: string;
  onSelectSection: (sectionId: string) => void;
  visitedSectionIds?: Set<string>;
}

export const ReadingMap: React.FC<ReadingMapProps> = ({
  sections,
  activeSectionId,
  onSelectSection,
  visitedSectionIds = new Set(),
}) => {
  return (
    <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] p-[16px] sm:p-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between pb-[14px] border-b border-[#EAEFEA] dark:border-[#373A42]">
        <div className="flex items-center gap-[8px]">
          <div className="w-[28px] h-[28px] rounded-[8px] bg-[#EFF4F1] dark:bg-[#32363E] text-[#BA7A48] dark:text-[#EDEDED] flex items-center justify-center">
            <Compass className="w-[15px] h-[15px]" />
          </div>
          <h3 className="font-serif font-bold text-[14px] text-[#18221D] dark:text-[#F5F6F8]">
            Reading Map
          </h3>
        </div>
        <span className="font-mono text-[11px] text-[#6A7B72] dark:text-[#8E93A0]">
          {sections.length} sections
        </span>
      </div>

      <div className="mt-[12px] space-y-[4px] max-h-[380px] overflow-y-auto pr-[4px]">
        {sections.map((sec, idx) => {
          const isActive = sec.id === activeSectionId;
          const isVisited = visitedSectionIds.has(sec.id);

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSection(sec.id)}
              className={`w-full text-left px-[12px] py-[10px] rounded-[10px] transition-all flex items-start gap-[10px] cursor-pointer ${
                isActive
                  ? 'bg-[#BA7A48] text-white shadow-xs'
                  : 'hover:bg-[#EFF4F1] dark:hover:bg-[#32363E] text-[#283830] dark:text-[#D5D8E0]'
              }`}
            >
              <span
                className={`font-mono text-[11px] font-semibold mt-[2px] shrink-0 ${
                  isActive
                    ? 'text-white/90'
                    : 'text-[#8E9E95] dark:text-[#7A808C]'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-[6px]">
                  <p
                    className={`text-[13px] font-medium truncate ${
                      isActive
                        ? 'text-white font-semibold'
                        : 'text-[#18221D] dark:text-[#F5F6F8]'
                    }`}
                  >
                    {sec.label}
                  </p>
                  {isVisited && !isActive && (
                    <CheckCircle2 className="w-[13px] h-[13px] text-[#2E7D32] dark:text-[#4ADE80] shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-[8px] mt-[2px]">
                  <span
                    className={`font-mono text-[10px] ${
                      isActive ? 'text-white/80' : 'text-[#6A7B72] dark:text-[#8E93A0]'
                    }`}
                  >
                    {sec.wordCount.toLocaleString()} words
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
