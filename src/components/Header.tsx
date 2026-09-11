import React from 'react';
import { BookOpen, Layers, Bookmark, ShieldCheck, Sparkles } from 'lucide-react';
import { RotaryThemeDial } from './RotaryThemeDial';
import { StatusBead } from './StatusBead';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenGroundingInfo: () => void;
  hasDocument?: boolean;
  onOpenSideBySide?: () => void;
  onOpenSource?: () => void;
  onOpenLibrary?: () => void;
  savedSessionsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  setDarkMode,
  onOpenGroundingInfo,
  hasDocument = false,
  onOpenSideBySide,
  onOpenSource,
  onOpenLibrary,
  savedSessionsCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full pt-[12px] pb-[8px] px-[16px] sm:px-[28px] lg:px-[40px] pointer-events-none">
      <div className="max-w-[1200px] w-full mx-auto clay-card bg-[#E3ECE3] dark:bg-[#35383D] p-[10px] sm:p-[12px] flex items-center justify-between gap-[16px] pointer-events-auto transition-all">
        {/* Left: Brand Identity with Status Bead */}
        <div className="flex items-center gap-[12px] shrink-0">
          <div className="relative">
            <div className="w-[38px] h-[38px] rounded-[14px] bg-[#D9924D] dark:bg-[#E8863C] text-white flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(217,146,77,0.35)] dark:shadow-[0_4px_14px_rgba(232,134,60,0.4)]">
              <BookOpen className="w-[18px] h-[18px]" />
            </div>
            {/* Live status bead on brand tile */}
            <span className="absolute -top-[2px] -right-[2px]">
              <StatusBead status={hasDocument ? "reading" : "ready"} size="sm" showPulse={hasDocument} />
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-[8px]">
              <span id="brand-title" className="font-serif font-bold text-[18px] sm:text-[20px] tracking-tight text-[#3A3A38] dark:text-[#E8E4DD]">
                AI-Proff
              </span>
              <span className="hidden sm:inline-flex items-center gap-[5px] text-[10px] font-mono px-[8px] py-[2px] rounded-full bg-[#D6E0D6] dark:bg-[#27292C] text-[#3A3A38] dark:text-[#E8E4DD] border border-[#C9D6C9] dark:border-[#464A52]">
                <span className="w-[5px] h-[5px] rounded-full bg-[#7FA398]" />
                Reading Partner
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#8A8880] dark:text-[#9A9691] -mt-[1px] hidden xs:block">
              {hasDocument ? "Active Grounded Session" : "Strict Source Grounding"}
            </span>
          </div>
        </div>

        {/* Center: Reading Quick Actions (when document active) */}
        {hasDocument && (
          <div className="hidden md:flex items-center gap-[8px]">
            {onOpenSideBySide && (
              <button
                type="button"
                onClick={onOpenSideBySide}
                className="clay-btn-neutral h-[36px] px-[14px] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer"
              >
                <Layers className="w-[13px] h-[13px] text-[#7FA398]" />
                <span>Side-by-Side</span>
              </button>
            )}
            {onOpenSource && (
              <button
                type="button"
                onClick={onOpenSource}
                className="clay-btn-neutral h-[36px] px-[14px] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer"
              >
                <BookOpen className="w-[13px] h-[13px] text-[#D9924D] dark:text-[#E8863C]" />
                <span>Source Text</span>
              </button>
            )}
          </div>
        )}

        {/* Right: Library, Audit Rules, and Tactile Rotary Theme Dial */}
        <div className="flex items-center gap-[10px] sm:gap-[14px] shrink-0">
          {onOpenLibrary && (
            <button
              type="button"
              onClick={onOpenLibrary}
              className="clay-btn-neutral h-[40px] px-[14px] text-[12px] font-medium flex items-center gap-[7px] cursor-pointer"
              title="Open Reading Library & Saved Notes"
            >
              <Bookmark className="w-[14px] h-[14px] text-[#D9924D] dark:text-[#E8863C]" />
              <span className="hidden sm:inline">Library</span>
              {savedSessionsCount > 0 && (
                <span className="w-[18px] h-[18px] rounded-full bg-[#D9924D]/20 dark:bg-[#E8863C]/25 text-[#D9924D] dark:text-[#E8863C] text-[10px] font-mono font-bold flex items-center justify-center">
                  {savedSessionsCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenGroundingInfo}
            className="clay-btn-neutral hidden sm:flex h-[40px] px-[12px] text-[12px] font-medium items-center gap-[6px] cursor-pointer"
            title="Grounding & Verification Standards"
          >
            <ShieldCheck className="w-[14px] h-[14px] text-[#7FA398]" />
            <span>Rules</span>
          </button>

          {/* Tactile Rotary Dial Control */}
          <div className="pl-[2px] border-l border-[#C9D6C9] dark:border-[#464A52]">
            <RotaryThemeDial darkMode={darkMode} setDarkMode={setDarkMode} />
          </div>
        </div>
      </div>
    </header>
  );
};
