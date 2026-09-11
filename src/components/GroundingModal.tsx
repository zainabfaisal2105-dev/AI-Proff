import React from 'react';
import { X, CheckCircle2, ShieldAlert, Sparkles, Database, FileCheck } from 'lucide-react';

interface GroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroundingModal: React.FC<GroundingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#3C4049] rounded-[16px] shadow-[0_16px_36px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAEFEA] dark:border-[#373A42] bg-white dark:bg-[#25282E]">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#BA7A48] dark:text-[#EDEDED]" />
            <h3 className="font-serif font-bold text-sm text-[#18221D] dark:text-[#F5F6F8]">
              Source-Grounded System Architecture
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6A7B72] hover:text-[#18221D] dark:text-[#8E93A0] dark:hover:text-[#FFFFFF] p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs text-[#283830] dark:text-[#D5D8E0] leading-relaxed">
          <p>
            Unlike traditional conversational LLMs that summarize documents using generalized internet pretraining, this engine functions as a <strong>strict source-bound RAG processor</strong>.
          </p>

          <div className="space-y-3">
            <div className="p-3.5 rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42]">
              <div className="flex items-center gap-2 font-semibold text-[#18221D] dark:text-[#F5F6F8] mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#4ADE80]" />
                1. Zero External Hallucinations
              </div>
              <p className="text-[11px] text-[#52635B] dark:text-[#9EA2AE]">
                The model is constrained strictly to the extracted source chunks. If a fact is unmentioned or cannot be deduced directly from the text, it is omitted or flagged as unstated.
              </p>
            </div>

            <div className="p-3.5 rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42]">
              <div className="flex items-center gap-2 font-semibold text-[#18221D] dark:text-[#F5F6F8] mb-1">
                <Database className="w-3.5 h-3.5 text-[#BA7A48] dark:text-[#D2D5DD]" />
                2. Comprehensive Information Preservation
              </div>
              <p className="text-[11px] text-[#52635B] dark:text-[#9EA2AE]">
                Prevents premature over-compression. All essential numbers, statistical percentages, dates, proper names, technical definitions, conditions, and exceptions are systematically preserved.
              </p>
            </div>

            <div className="p-3.5 rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42]">
              <div className="flex items-center gap-2 font-semibold text-[#18221D] dark:text-[#F5F6F8] mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#BA7A48] dark:text-[#FFB74D]" />
                3. Exact Numerical Fidelity
              </div>
              <p className="text-[11px] text-[#52635B] dark:text-[#9EA2AE]">
                Figures are never rounded or approximated. If a medical trial reports 78.4% efficacy, the summary preserves 78.4% without rounding to 80%.
              </p>
            </div>

            <div className="p-3.5 rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42]">
              <div className="flex items-center gap-2 font-semibold text-[#18221D] dark:text-[#F5F6F8] mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#C62828] dark:text-[#EF5350]" />
                4. Automated Independent Verification Pass
              </div>
              <p className="text-[11px] text-[#52635B] dark:text-[#9EA2AE]">
                Every generated summary is independently audited against the raw source by a separate verification evaluator checking for consistency, numerical matches, and coverage.
              </p>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-[#6A7B72] dark:text-[#8E93A0] border-t border-[#EAEFEA] dark:border-[#373A42]">
            All claims feature direct source references matching document pages, slides, sheets, or sections.
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#EAEFEA] dark:border-[#373A42] bg-[#FAFBF9] dark:bg-[#222428] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-[8px] bg-[#BA7A48] hover:bg-[#A96D3C] text-white dark:bg-[#EDEDED] dark:text-[#16181C] dark:hover:bg-white transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
