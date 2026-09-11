import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface RotaryThemeDialProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  className?: string;
}

export const RotaryThemeDial: React.FC<RotaryThemeDialProps> = ({
  darkMode,
  setDarkMode,
  className = '',
}) => {
  const handleToggle = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`inline-flex items-center gap-[10px] ${className}`}>
      {/* Physical Dial Container */}
      <button
        type="button"
        onClick={handleToggle}
        title={darkMode ? "Turn dial to Day mode (Warm study light)" : "Turn dial to Night mode (Focused reading lamp)"}
        aria-label="Theme dial: toggle light and dark mode"
        className="rotary-dial flex items-center justify-center group focus:outline-hidden"
      >
        {/* Subtle radial groove tick marks */}
        <div
          className={`absolute inset-0 rounded-full transition-transform duration-500 ease-out flex items-center justify-center ${
            darkMode ? 'rotate-[180deg]' : 'rotate-0'
          }`}
        >
          {/* Dial pointer bead indicator */}
          <span className="absolute top-[4px] w-[5px] h-[5px] rounded-full bg-[#D9924D] dark:bg-[#E8863C] shadow-[0_0_4px_rgba(217,146,77,0.8)]" />
          
          {/* Opposing notch */}
          <span className="absolute bottom-[4px] w-[3px] h-[3px] rounded-full bg-[#8A8880]/40 dark:bg-[#9A9691]/40" />
        </div>

        {/* Center icon inside dial core */}
        <div className="relative z-10 w-[24px] h-[24px] rounded-full bg-[#D6E0D6] dark:bg-[#35383D] flex items-center justify-center shadow-inner text-[#3A3A38] dark:text-[#E8E4DD] transition-colors">
          {darkMode ? (
            <Moon className="w-[12px] h-[12px] text-[#E8863C]" />
          ) : (
            <Sun className="w-[12px] h-[12px] text-[#D9924D]" />
          )}
        </div>
      </button>

      {/* Tactile state label */}
      <div className="hidden sm:flex flex-col">
        <span className="text-[11px] font-mono uppercase font-bold text-[#3A3A38] dark:text-[#E8E4DD] leading-none">
          {darkMode ? 'Night' : 'Day'}
        </span>
        <span className="text-[9px] font-mono text-[#8A8880] dark:text-[#9A9691] mt-[2px] leading-none">
          {darkMode ? 'Reading Lamp' : 'Soft Sage'}
        </span>
      </div>
    </div>
  );
};
