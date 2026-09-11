import React from 'react';
import { FileText, Sun, Moon, ShieldCheck, Sparkles, BookOpen, Layers, Bookmark } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full h-[64px] min-h-[64px] max-h-[64px] border-b border-[#DCE3DF] dark:border-[#33363E] bg-[#F7FAF8]/95 dark:bg-[#202226]/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-[1200px] w-full mx-auto px-[16px] sm:px-[28px] lg:px-[40px] h-[64px] flex items-center justify-between gap-[20px]">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-[12px] shrink-0">
          <div className="w-[32px] h-[32px] rounded-[10px] bg-[#1E2723] dark:bg-[#EDEDED] text-[#FAFBF9] dark:text-[#16181C] flex items-center justify-center font-medium shadow-xs">
            <FileText className="w-[16px] h-[16px]" />
          </div>
          <div className="flex items-center gap-[8px]">
            <span id="brand-title" className="font-serif font-semibold text-[18px] sm:text-[19px] tracking-tight text-[#18221D] dark:text-[#F5F6F8]">
              AI-Proff
            </span>
            <span className="hidden sm:inline-flex items-center gap-[6px] text-[11px] font-mono px-[8px] py-[2px] rounded-[6px] bg-[#EFF4F1] dark:bg-[#282B32] text-[#34463C] dark:text-[#D2D5DD] border border-[#D4DFD9] dark:border-[#3E424C]">
              <span className="w-[6px] h-[6px] rounded-full bg-[#2E7D32] dark:bg-[#4ADE80] inline-block shadow-[0_0_6px_rgba(46,125,50,0.4)]" />
              Reading Companion
            </span>
          </div>
        </div>

        {/* Center / Navigation Actions (if document loaded, max 1-2 controls) */}
        {hasDocument && (
          <div className="hidden md:flex items-center gap-[8px]">
            {onOpenSideBySide && (
              <button
                type="button"
                onClick={onOpenSideBySide}
                className="h-[36px] px-[12px] text-[13px] font-medium rounded-[8px] text-[#404F48] dark:text-[#A8ACB8] hover:text-[#18221D] dark:hover:text-[#F5F6F8] hover:bg-[#E3ECE7] dark:hover:bg-[#2B2E35] transition-colors flex items-center gap-[6px] border border-transparent hover:border-[#CFDBD4] dark:hover:border-[#3B3F48]"
              >
                <Layers className="w-[14px] h-[14px]" />
                <span>Side-by-Side</span>
              </button>
            )}
            {onOpenSource && (
              <button
                type="button"
                onClick={onOpenSource}
                className="h-[36px] px-[12px] text-[13px] font-medium rounded-[8px] text-[#404F48] dark:text-[#A8ACB8] hover:text-[#18221D] dark:hover:text-[#F5F6F8] hover:bg-[#E3ECE7] dark:hover:bg-[#2B2E35] transition-colors flex items-center gap-[6px] border border-transparent hover:border-[#CFDBD4] dark:hover:border-[#3B3F48]"
              >
                <BookOpen className="w-[14px] h-[14px]" />
                <span>Source Chunks</span>
              </button>
            )}
          </div>
        )}

        {/* Right: Controls (Theme Toggle & Info) */}
        <div className="flex items-center gap-[10px] shrink-0">
          {onOpenLibrary && (
            <button
              type="button"
              onClick={onOpenLibrary}
              className="flex items-center gap-[6px] text-[13px] font-medium text-[#4D5C55] dark:text-[#9A9EA9] hover:text-[#18221D] dark:hover:text-[#FFFFFF] h-[40px] px-[12px] rounded-[8px] hover:bg-[#E3ECE7] dark:hover:bg-[#2B2E35] transition-colors cursor-pointer"
              title="View saved documents & stored notes"
            >
              <Bookmark className="w-[15px] h-[15px] text-[#BA7A48] dark:text-[#EDEDED]" />
              <span className="hidden sm:inline">Library & Notes</span>
              {savedSessionsCount > 0 && (
                <span className="w-[18px] h-[18px] rounded-full bg-[#BA7A48]/15 dark:bg-[#EDEDED]/20 text-[#BA7A48] dark:text-[#EDEDED] text-[11px] font-mono font-semibold flex items-center justify-center">
                  {savedSessionsCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenGroundingInfo}
            className="hidden sm:flex items-center gap-[6px] text-[13px] font-medium text-[#4D5C55] dark:text-[#9A9EA9] hover:text-[#18221D] dark:hover:text-[#FFFFFF] h-[40px] px-[12px] rounded-[8px] hover:bg-[#E3ECE7] dark:hover:bg-[#2B2E35] transition-colors"
            title="Verification Standards & Rules"
          >
            <ShieldCheck className="w-[15px] h-[15px] text-[#3D5248] dark:text-[#A2A9B8]" />
            <span>Rules</span>
          </button>

          {/* Theme Toggle - Tactile design token */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="h-[40px] px-[14px] rounded-[10px] border border-[#D0DCD5] dark:border-[#3D414A] bg-[#FFFFFF] dark:bg-[#2A2D33] hover:bg-[#F0F5F2] dark:hover:bg-[#32363D] transition-colors flex items-center gap-[8px] text-[13px] font-medium text-[#24302A] dark:text-[#E2E4EB] shadow-[0_2px_8px_rgba(40,60,50,0.05)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] cursor-pointer"
            aria-label="Toggle color theme"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <>
                <Moon className="w-[15px] h-[15px] text-[#93C5FD]" />
                <span className="font-mono text-[12px]">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-[15px] h-[15px] text-[#D97706]" />
                <span className="font-mono text-[12px]">Light</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
