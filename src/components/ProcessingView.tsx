import React from 'react';
import { Check, Loader2, ShieldCheck } from 'lucide-react';
import { ProcessingStage } from '../types';

interface ProcessingViewProps {
  stage: ProcessingStage;
  fileName?: string;
}

interface StepItem {
  id: ProcessingStage;
  label: string;
  description: string;
}

const STEPS: StepItem[] = [
  { id: 'reading', label: 'Reading source bytes', description: 'Buffering document stream and resolving character encoding' },
  { id: 'extracting', label: 'Extracting content & structure', description: 'Extracting text, paragraphs, headings, tables, and page markers' },
  { id: 'organizing', label: 'Chunking & boundary tracking', description: 'Organizing into traceable source segments with coordinate IDs' },
  { id: 'summarizing', label: 'Synthesizing source-grounded summary', description: 'Enforcing zero hallucination, numerical precision, and condition retention' },
];

export const ProcessingView: React.FC<ProcessingViewProps> = ({ stage, fileName }) => {
  const getStepStatus = (stepId: ProcessingStage) => {
    const stageOrder: ProcessingStage[] = [
      'reading',
      'extracting',
      'organizing',
      'summarizing',
      'verifying',
      'complete',
    ];
    const currentIndex = stageOrder.indexOf(stage);
    const stepIndex = stageOrder.indexOf(stepId);

    if (currentIndex > stepIndex || stage === 'complete' || stage === 'verifying') return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  const getProgressPercentage = () => {
    switch (stage) {
      case 'reading': return 25;
      case 'extracting': return 50;
      case 'organizing': return 75;
      case 'summarizing': return 90;
      case 'verifying': case 'complete': return 100;
      default: return 15;
    }
  };

  return (
    <div className="w-full max-w-[500px] mx-auto py-[32px] px-[16px]">
      <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#3C4049] rounded-[16px] p-[24px] shadow-[0_8px_24px_-4px_rgba(40,60,50,0.08),0_2px_6px_rgba(40,60,50,0.03)] dark:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] space-y-[20px]">
        {/* Top title */}
        <div className="text-center space-y-[8px]">
          <div className="w-[44px] h-[44px] mx-auto rounded-full bg-[#EAEFEA] dark:bg-[#202227] text-[#BA7A48] dark:text-[#EDEDED] flex items-center justify-center">
            <Loader2 className="w-[22px] h-[22px] animate-spin text-[#BA7A48] dark:text-[#EDEDED]" />
          </div>
          <h2 className="text-[18px] font-serif font-bold text-[#18221D] dark:text-[#F5F6F8]">
            Processing Document
          </h2>
          {fileName && (
            <p className="text-[12px] font-mono text-[#586860] dark:text-[#9EA2AE] truncate max-w-[360px] mx-auto">
              {fileName}
            </p>
          )}
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full h-[5px] bg-[#E2EBE5] dark:bg-[#1E2024] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#BA7A48] dark:bg-[#EDEDED] transition-all duration-300 rounded-full"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        {/* Steps List */}
        <div className="space-y-[8px]">
          {STEPS.map((step) => {
            const status = getStepStatus(step.id);
            return (
              <div
                key={step.id}
                className={`flex items-start gap-[12px] p-[10px] rounded-[10px] transition-colors ${
                  status === 'active'
                    ? 'bg-[#FAF5F0] dark:bg-[#34373F] border border-[#EADBCE] dark:border-[#4B4F5B]'
                    : ''
                }`}
              >
                {/* Status Indicator */}
                <div className="mt-[2px] shrink-0">
                  {status === 'completed' && (
                    <div className="w-[18px] h-[18px] rounded-full bg-[#BA7A48] dark:bg-[#EDEDED] text-white dark:text-[#16181C] flex items-center justify-center shadow-2xs">
                      <Check className="w-[11px] h-[11px] stroke-[2.5]" />
                    </div>
                  )}
                  {status === 'active' && (
                    <div className="w-[18px] h-[18px] flex items-center justify-center text-[#BA7A48] dark:text-[#EDEDED]">
                      <Loader2 className="w-[15px] h-[15px] animate-spin" />
                    </div>
                  )}
                  {status === 'pending' && (
                    <div className="w-[18px] h-[18px] rounded-full border border-[#CAD5CE] dark:border-[#424650]" />
                  )}
                </div>

                {/* Text */}
                <div className="space-y-[2px] flex-1">
                  <div
                    className={`text-[13px] font-medium ${
                      status === 'active'
                        ? 'text-[#18221D] dark:text-[#F5F6F8] font-semibold'
                        : status === 'completed'
                        ? 'text-[#48564F] dark:text-[#A0A5B2]'
                        : 'text-[#8A9890] dark:text-[#686D7A]'
                    }`}
                  >
                    {step.label}
                  </div>
                  {status === 'active' && (
                    <div className="text-[11px] text-[#6A7870] dark:text-[#8D92A0] leading-tight">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quiet note */}
        <div className="pt-[12px] flex items-center justify-center gap-[6px] text-center text-[11px] text-[#6A7870] dark:text-[#8A8F9B] border-t border-[#E5EDE7] dark:border-[#353942]">
          <ShieldCheck className="w-[14px] h-[14px] text-[#2E7D32] dark:text-[#4ADE80]" />
          <span>Strict zero-hallucination constraint active</span>
        </div>
      </div>
    </div>
  );
};
