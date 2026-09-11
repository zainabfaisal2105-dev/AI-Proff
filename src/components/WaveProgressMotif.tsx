import React from 'react';

interface WaveProgressMotifProps {
  progress?: number; // 0 to 100
  sectionCount?: number;
  activeSectionIdx?: number;
  height?: number;
  className?: string;
  showLabels?: boolean;
}

export const WaveProgressMotif: React.FC<WaveProgressMotifProps> = ({
  progress = 35,
  sectionCount = 6,
  activeSectionIdx = 0,
  height = 54,
  className = '',
  showLabels = false,
}) => {
  const normProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`relative overflow-hidden rounded-[16px] clay-well p-[4px] ${className}`}>
      <svg
        viewBox="0 0 320 60"
        preserveAspectRatio="none"
        style={{ width: '100%', height: `${height}px` }}
        className="block"
      >
        <defs>
          <linearGradient id="waveGradientLight1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7FA398" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#D9924D" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#7FA398" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="waveGradientLight2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D9924D" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#BA7A48" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="waveGradientDark1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5C857B" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#E8863C" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8A4A28" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="waveGradientDark2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E8863C" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#D97530" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Layer 1: Background mountain silhouette / complexity wave */}
        <path
          d="M 0,46 C 40,28 80,48 130,22 C 180,-2 230,36 280,18 C 300,10 315,16 320,20 L 320,60 L 0,60 Z"
          className="fill-[url(#waveGradientLight1)] dark:fill-[url(#waveGradientDark1)] transition-all duration-700"
        />

        {/* Layer 2: Intermediate organic wave */}
        <path
          d="M 0,52 C 50,38 90,44 150,32 C 210,20 250,42 320,28 L 320,60 L 0,60 Z"
          fill="currentColor"
          className="text-[#7FA398]/30 dark:text-[#7FA398]/20 transition-all duration-700"
        />

        {/* Layer 3: Foreground reading progress crest (masked by progress percentage) */}
        <path
          d="M 0,55 C 60,45 120,38 180,44 C 240,50 280,38 320,40 L 320,60 L 0,60 Z"
          className="fill-[url(#waveGradientLight2)] dark:fill-[url(#waveGradientDark2)] transition-all duration-500"
        />

        {/* Section waypoint beads along the terrain */}
        {Array.from({ length: Math.max(1, sectionCount) }).map((_, i) => {
          const cx = 20 + (i / Math.max(1, sectionCount - 1)) * 280;
          // Approximate curve height
          const cy = 34 - Math.sin((i / (sectionCount || 1)) * Math.PI) * 12;
          const isVisited = (i / sectionCount) * 100 <= normProgress || i <= activeSectionIdx;
          const isCurrent = i === activeSectionIdx;

          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r={isCurrent ? 5 : 3.5}
                className={`transition-all duration-300 ${
                  isCurrent
                    ? 'fill-[#D9924D] dark:fill-[#E8863C] stroke-[#E3ECE3] dark:stroke-[#35383D] stroke-[1.5]'
                    : isVisited
                    ? 'fill-[#7FA398] dark:fill-[#7FA398]'
                    : 'fill-[#C0D4C5] dark:fill-[#464A52]'
                }`}
              />
              {isCurrent && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={8}
                  className="fill-none stroke-[#D9924D] dark:stroke-[#E8863C] stroke-1 opacity-70 animate-ping"
                />
              )}
            </g>
          );
        })}
      </svg>

      {showLabels && (
        <div className="px-[8px] py-[3px] flex items-center justify-between text-[10px] font-mono text-[#8A8880] dark:text-[#9A9691]">
          <span>Start (Section 1)</span>
          <span className="font-semibold text-[#D9924D] dark:text-[#E8863C]">
            {Math.round(normProgress)}% read
          </span>
          <span>End (Section {sectionCount})</span>
        </div>
      )}
    </div>
  );
};
