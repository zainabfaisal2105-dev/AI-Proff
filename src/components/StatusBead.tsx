import React from 'react';

export type BeadStatus = 'ready' | 'reading' | 'processing' | 'synced' | 'grounded' | 'warning';

interface StatusBeadProps {
  status?: BeadStatus;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const StatusBead: React.FC<StatusBeadProps> = ({
  status = 'ready',
  label,
  className = '',
  size = 'md',
  showPulse = false,
}) => {
  const sizeClasses = {
    sm: 'w-[8px] h-[8px]',
    md: 'w-[10px] h-[10px]',
    lg: 'w-[12px] h-[12px]',
  }[size];

  // Color mapping based on theme palette:
  // ready: soft sage/emerald
  // reading: warm terracotta/burnt-orange
  // processing: warm amber
  // synced / grounded: muted sage teal (#7FA398)
  // warning: warm coral
  const colorClasses = {
    ready: 'bg-[#5B9A7D] dark:bg-[#68B993] shadow-[0_0_8px_rgba(91,154,125,0.45)]',
    reading: 'bg-[#D9924D] dark:bg-[#E8863C] shadow-[0_0_8px_rgba(217,146,77,0.5)]',
    processing: 'bg-[#D9924D] dark:bg-[#E8863C] animate-pulse shadow-[0_0_8px_rgba(217,146,77,0.5)]',
    synced: 'bg-[#7FA398] dark:bg-[#8FB5AA] shadow-[0_0_8px_rgba(127,163,152,0.45)]',
    grounded: 'bg-[#7FA398] dark:bg-[#8FB5AA] shadow-[0_0_8px_rgba(127,163,152,0.45)]',
    warning: 'bg-[#D96B4D] dark:bg-[#E87150] shadow-[0_0_8px_rgba(217,107,77,0.45)]',
  }[status];

  return (
    <div className={`inline-flex items-center gap-[6px] ${className}`}>
      <span className="relative flex items-center justify-center shrink-0">
        {(showPulse || status === 'reading' || status === 'processing') && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
              status === 'ready'
                ? 'bg-[#5B9A7D]'
                : status === 'reading' || status === 'processing'
                ? 'bg-[#D9924D] dark:bg-[#E8863C]'
                : 'bg-[#7FA398]'
            }`}
          />
        )}
        <span
          className={`status-bead ${sizeClasses} ${colorClasses} ring-2 ring-[#E3ECE3] dark:ring-[#35383D] transition-colors`}
        />
      </span>
      {label && (
        <span className="text-[11px] font-mono tracking-tight text-[#8A8880] dark:text-[#9A9691] font-medium">
          {label}
        </span>
      )}
    </div>
  );
};
