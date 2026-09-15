import React from 'react';
import { Check, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { ProcessingStage } from '../types';
import { DonutRing } from './DonutRing';
import { StatusBead } from './StatusBead';

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
  { id: 'reading', label: 'Reading document bytes', description: 'Buffering stream & parsing typography' },
  { id: 'extracting', label: 'Extracting sections & structure', description: 'Identifying chapters, headings, and data tables' },
  { id: 'organizing', label: 'Synthesizing reading map', description: 'Computing semantic complexity & boundary indexes' },
  { id: 'summarizing', label: 'Formulating grounded models', description: 'Preserving numerical findings and exact quotes' },
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

  const pct = getProgressPercentage();

  return (
    <div className="w-full max-w-[520px] mx-auto py-[32px] px-[16px]">
      <div className="clay-card p-[28px] sm:p-[36px] space-y-[24px] text-center relative">
        {/* Donut Progress Ring with percentage */}
        <div className="flex flex-col items-center justify-center space-y-[12px]">
          <DonutRing
            progress={pct}
            value={pct}
            max={100}
            size={90}
            strokeWidth={8}
            color="#D9924D"
            showLabel
          />

          <div className="space-y-[4px]">
            <h2 className="text-[20px] font-serif font-bold text-[#3A3A38] dark:text-[#E8E4DD]">
              Analyzing Complex Document
            </h2>
            {fileName && (
              <p className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691] truncate max-w-[340px] mx-auto">
                {fileName}
              </p>
            )}
          </div>
        </div>

        {/* Steps List with Clay Wells & Status Beads */}
        <div className="space-y-[10px] text-left">
          {STEPS.map((step) => {
            const status = getStepStatus(step.id);
            return (
              <div
                key={step.id}
                className={`p-[14px] rounded-[18px] transition-all flex items-start gap-[12px] ${
                  status === 'active'
                    ? 'clay-well border-2 border-[#D9924D] dark:border-[#E8863C]'
                    : status === 'completed'
                    ? 'clay-card opacity-90'
                    : 'opacity-40'
                }`}
              >
                {/* Status Indicator */}
                <div className="mt-[2px] shrink-0">
                  {status === 'completed' && (
                    <div className="w-[20px] h-[20px] rounded-full bg-[#7FA398] text-white flex items-center justify-center">
                      <Check className="w-[12px] h-[12px] stroke-[3]" />
                    </div>
                  )}
                  {status === 'active' && (
                    <StatusBead status="reading" size="sm" showPulse />
                  )}
                  {status === 'pending' && (
                    <div className="w-[14px] h-[14px] rounded-full border-2 border-[#8A8880]/40 m-[3px]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-serif font-bold text-[#3A3A38] dark:text-[#E8E4DD]">
                      {step.label}
                    </span>
                    {status === 'active' && (
                      <span className="text-[10px] font-mono text-[#D9924D] dark:text-[#E8863C] font-bold">
                        Running...
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8A8880] dark:text-[#9A9691] mt-[2px] leading-snug">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
