import React from 'react';
import { X, CheckCircle2, ShieldAlert, Sparkles, Database, FileCheck } from 'lucide-react';
import { StatusBead } from './StatusBead';

interface GroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroundingModal: React.FC<GroundingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="clay-card max-w-lg w-full p-[24px] sm:p-[28px] space-y-[18px] max-h-[85vh] overflow-y-auto relative animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-[14px] border-b border-[#C9D6C9] dark:border-[#464A52]">
          <div className="flex items-center gap-[10px]">
            <StatusBead status="grounded" size="sm" showPulse />
            <h3 className="font-serif font-bold text-[16px] text-[#3A3A38] dark:text-[#E8E4DD]">
              Grounded Architecture & Safeguards
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-full clay-well flex items-center justify-center text-[#8A8880] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD] cursor-pointer"
          >
            <X className="w-[14px] h-[14px]" />
          </button>
        </div>

        <div className="space-y-[14px] text-[13px] text-[#3A3A38] dark:text-[#E8E4DD] leading-relaxed">
          <p>
            Unlike generic LLMs that synthesize documents using unrestrained general knowledge, this partner functions as a <strong>strict, citation-grounded RAG processor</strong>.
          </p>

          <div className="space-y-[10px]">
            <div className="clay-well p-[14px] rounded-[18px] space-y-[4px]">
              <div className="flex items-center gap-[8px] font-bold text-[#5B9A7D] dark:text-[#68B993]">
                <CheckCircle2 className="w-[14px] h-[14px]" />
                <span>1. Zero Speculation or External Hallucination</span>
              </div>
              <p className="text-[12px] text-[#8A8880] dark:text-[#9A9691] pl-[22px]">
                Constrained strictly to verbatim document content. Questions seeking facts beyond the text are explicitly refused.
              </p>
            </div>

            <div className="clay-well p-[14px] rounded-[18px] space-y-[4px]">
              <div className="flex items-center gap-[8px] font-bold text-[#D9924D] dark:text-[#E8863C]">
                <Database className="w-[14px] h-[14px]" />
                <span>2. Comprehensive Retention of Detail</span>
              </div>
              <p className="text-[12px] text-[#8A8880] dark:text-[#9A9691] pl-[22px]">
                Essential parameters, technical caveats, sample sizes, and equations are protected from lossy over-compression.
              </p>
            </div>

            <div className="clay-well p-[14px] rounded-[18px] space-y-[4px]">
              <div className="flex items-center gap-[8px] font-bold text-[#7FA398]">
                <Sparkles className="w-[14px] h-[14px]" />
                <span>3. Verbatim Numerical Fidelity</span>
              </div>
              <p className="text-[12px] text-[#8A8880] dark:text-[#9A9691] pl-[22px]">
                Metrics are preserved verbatim without approximation or rounding errors.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-[14px] border-t border-[#C9D6C9] dark:border-[#464A52] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="clay-btn-primary h-[38px] px-[20px] text-[12px] font-medium cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
