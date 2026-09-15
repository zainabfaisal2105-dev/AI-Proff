import React from 'react';

interface DonutRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string; // Optional custom stroke color
  trackColor?: string;
  showLabel?: boolean;
  labelSuffix?: string;
  className?: string;
  children?: React.ReactNode;
}

export const DonutRing: React.FC<DonutRingProps> = ({
  progress,
  size = 44,
  strokeWidth = 4,
  color,
  trackColor,
  showLabel = false,
  labelSuffix = '%',
  className = '',
  children,
}) => {
  const safeProgress = typeof progress === 'number' && !Number.isNaN(progress) ? progress : 0;
  const normalizedProgress = Math.min(100, Math.max(0, safeProgress));
  const radius = Math.max(0, (size - strokeWidth) / 2);
  const circumference = 2 * Math.PI * radius;
  const rawOffset = circumference - (normalizedProgress / 100) * circumference;
  const strokeDashoffset = Number.isNaN(rawOffset) ? 0 : rawOffset;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] transition-transform"
      >
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className={
            trackColor ||
            'stroke-[#D6E0D6] dark:stroke-[#2B2D31]'
          }
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-500 ease-out ${
            color || 'stroke-[#D9924D] dark:stroke-[#E8863C]'
          }`}
        />
      </svg>

      {/* Center Label or Children */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {children ? (
          children
        ) : showLabel ? (
          <span className="text-[10px] font-mono font-bold text-[#3A3A38] dark:text-[#E8E4DD]">
            {Math.round(normalizedProgress)}
            {labelSuffix}
          </span>
        ) : null}
      </div>
    </div>
  );
};
