import React from 'react';
import { DocumentSection } from '../types';
import { Compass, CheckCircle2, Bookmark, BarChart2 } from 'lucide-react';
import { StatusBead } from './StatusBead';
import { DonutRing } from './DonutRing';
import { WaveProgressMotif } from './WaveProgressMotif';

interface ReadingMapProps {
  sections: DocumentSection[];
  activeSectionId: string;
  onSelectSection: (sectionId: string) => void;
  visitedSectionIds?: Set<string>;
  totalDocumentWords?: number;
}

export const ReadingMap: React.FC<ReadingMapProps> = ({
  sections,
  activeSectionId,
  onSelectSection,
  visitedSectionIds = new Set(),
  totalDocumentWords,
}) => {
  const activeIdx = sections.findIndex((s) => s.id === activeSectionId);
  const currentIdx = activeIdx >= 0 ? activeIdx : 0;
  const visitedCount = visitedSectionIds.size;
  const progressPct = sections.length > 0 ? Math.round((visitedCount / sections.length) * 100) : 0;

  return (
    <div className="clay-card p-[18px] sm:p-[22px] space-y-[18px] relative">
      {/* Top Header with Status Bead */}
      <div className="flex items-center justify-between pb-[14px] border-b border-[#C9D6C9] dark:border-[#464A52]">
        <div className="flex items-center gap-[10px]">
          <StatusBead status="reading" size="sm" showPulse />
          <div>
            <h3 className="font-serif font-bold text-[15px] text-[#3A3A38] dark:text-[#E8E4DD]">
              Document Chapters
            </h3>
            <p className="text-[10px] font-mono text-[#8A8880] dark:text-[#9A9691]">
              Section Navigation & Progress
            </p>
          </div>
        </div>

        {/* Circular Donut Progress Ring */}
        <div className="flex items-center gap-[6px]">
          <DonutRing progress={progressPct} size={38} strokeWidth={3.5} showLabel />
        </div>
      </div>

      {/* Layered Mountain/Wave Silhouette Progress Motif */}
      <div className="space-y-[6px]">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
          <span className="flex items-center gap-[4px]">
            <BarChart2 className="w-[12px] h-[12px] text-[#7FA398]" />
            <span>Progress & Complexity Wave</span>
          </span>
          <span className="font-semibold text-[#D9924D] dark:text-[#E8863C]">
            {visitedCount} of {sections.length} read
          </span>
        </div>
        <WaveProgressMotif
          progress={progressPct}
          sectionCount={sections.length}
          activeSectionIdx={currentIdx}
          height={48}
        />
      </div>

      {/* Left-hand rail listing sections/chapters as pill-shaped nav buttons that fill with accent color when active */}
      <div className="space-y-[6px] max-h-[420px] overflow-y-auto pr-[2px]">
        {sections.map((sec, idx) => {
          const isActive = sec.id === activeSectionId;
          const isVisited = visitedSectionIds.has(sec.id);

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSection(sec.id)}
              className={`w-full text-left px-[14px] py-[10px] rounded-full transition-all flex items-center justify-between gap-[10px] cursor-pointer ${
                isActive
                  ? 'clay-btn-primary shadow-sm text-white'
                  : 'clay-well hover:bg-[#D2DFD2] dark:hover:bg-[#34373D] text-[#3A3A38] dark:text-[#E8E4DD]'
              }`}
            >
              <div className="flex items-center gap-[10px] min-w-0">
                <span
                  className={`w-[22px] h-[22px] rounded-full text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-[#CAD7CA] dark:bg-[#3A3D44] text-[#8A8880] dark:text-[#9A9691]'
                  }`}
                >
                  {idx + 1}
                </span>

                <span
                  className={`text-[13px] font-medium truncate ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-[#3A3A38] dark:text-[#E8E4DD]'
                  }`}
                >
                  {sec.label}
                </span>
              </div>

              <div className="flex items-center gap-[6px] shrink-0">
                <span
                  className={`text-[10px] font-mono ${
                    isActive ? 'text-white/80' : 'text-[#8A8880] dark:text-[#9A9691]'
                  }`}
                >
                  {sec.wordCount}w
                </span>
                {isVisited && !isActive && (
                  <CheckCircle2 className="w-[13px] h-[13px] text-[#5B9A7D] dark:text-[#68B993]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
