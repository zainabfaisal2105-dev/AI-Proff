import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Wrench,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
} from 'lucide-react';
import { VerificationResult, VerificationIssue, VerificationCheck } from '../types';
import { StatusBead } from './StatusBead';
import { DonutRing } from './DonutRing';

interface CheckerCardProps {
  verification: VerificationResult | null;
  isVerifying: boolean;
  onReVerify: () => void;
  onFixIssue: (issue: VerificationIssue) => Promise<void>;
}

export const CheckerCard: React.FC<CheckerCardProps> = ({
  verification,
  isVerifying,
  onReVerify,
  onFixIssue,
}) => {
  const [fixingIssueId, setFixingIssueId] = useState<string | null>(null);
  const [showAllChecks, setShowAllChecks] = useState(false);

  if (!verification && isVerifying) {
    return (
      <div className="clay-card p-[20px] space-y-[16px] animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-[16px] w-[120px] bg-[#C9D6C9] dark:bg-[#464A52] rounded-full" />
          <div className="h-[16px] w-[48px] bg-[#C9D6C9] dark:bg-[#464A52] rounded-full" />
        </div>
        <div className="h-[40px] w-[100px] bg-[#C9D6C9] dark:bg-[#464A52] rounded-[12px]" />
      </div>
    );
  }

  if (!verification) return null;

  const handleFixClick = async (issue: VerificationIssue) => {
    try {
      setFixingIssueId(issue.id);
      await onFixIssue(issue);
    } finally {
      setFixingIssueId(null);
    }
  };

  const getStatusIcon = (status: VerificationCheck['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-[14px] h-[14px] text-[#5B9A7D] dark:text-[#68B993] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-[14px] h-[14px] text-[#D9924D] dark:text-[#E8863C] shrink-0" />;
      case 'failed':
        return <XCircle className="w-[14px] h-[14px] text-[#D96B4D] dark:text-[#E87150] shrink-0" />;
    }
  };

  const score = verification.overallScore;

  return (
    <div className="clay-card p-[20px] space-y-[18px] relative">
      {/* Title with Status Bead & Re-verify button */}
      <div className="flex items-center justify-between pb-[12px] border-b border-[#C9D6C9] dark:border-[#464A52]">
        <div className="flex items-center gap-[8px]">
          <StatusBead
            status={score >= 90 ? "grounded" : score >= 75 ? "reading" : "error"}
            size="sm"
          />
          <h3 className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#3A3A38] dark:text-[#E8E4DD]">
            Fidelity & Grounding Audit
          </h3>
        </div>
        <button
          type="button"
          onClick={onReVerify}
          disabled={isVerifying}
          className="w-[30px] h-[30px] rounded-full clay-well flex items-center justify-center text-[#8A8880] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD] cursor-pointer"
          title="Run an independent verification audit again"
        >
          <RefreshCw className={`w-[12px] h-[12px] ${isVerifying ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Verification Score & Donut Progress Ring */}
      <div className="clay-well p-[16px] rounded-[20px] flex items-center justify-between gap-[16px]">
        <div className="space-y-[4px]">
          <span className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691] uppercase tracking-wider">
            Fidelity Index
          </span>
          <div className="text-[14px] font-serif font-bold text-[#3A3A38] dark:text-[#E8E4DD]">
            {verification.scoreLabel}
          </div>
          <p className="text-[11px] text-[#8A8880] dark:text-[#9A9691] leading-tight">
            Strict check against verbatim source chunks.
          </p>
        </div>

        <DonutRing
          progress={score}
          value={score}
          max={100}
          size={64}
          strokeWidth={6}
          color={score >= 90 ? '#5B9A7D' : score >= 75 ? '#D9924D' : '#D96B4D'}
          label="/100"
        />
      </div>

      {/* Coverage Progress Bar */}
      <div className="space-y-[8px]">
        <div className="flex justify-between text-[12px] font-medium">
          <span className="text-[#3A3A38] dark:text-[#E8E4DD]">Source Coverage</span>
          <span className="text-[#D9924D] dark:text-[#E8863C] font-mono font-bold">
            {verification.coverageAssessment.score}%
          </span>
        </div>
        <div className="w-full h-[8px] clay-well rounded-full overflow-hidden p-[1px]">
          <div
            className="h-full bg-[#D9924D] dark:bg-[#E8863C] transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, verification.coverageAssessment.score))}%` }}
          />
        </div>
      </div>

      {/* Verification Checklist */}
      <div className="space-y-[10px] border-t border-[#C9D6C9] dark:border-[#464A52] pt-[14px]">
        <div className="flex items-center justify-between text-[12px] font-medium text-[#3A3A38] dark:text-[#E8E4DD]">
          <span>Audit Checklist</span>
          <button
            type="button"
            onClick={() => setShowAllChecks(!showAllChecks)}
            className="text-[11px] font-mono text-[#D9924D] dark:text-[#E8863C] hover:underline flex items-center gap-[2px] cursor-pointer"
          >
            {showAllChecks ? 'Less' : 'View all'}
            {showAllChecks ? <ChevronUp className="w-[12px] h-[12px]" /> : <ChevronDown className="w-[12px] h-[12px]" />}
          </button>
        </div>

        <div className="space-y-[8px]">
          {(showAllChecks ? verification.checks : verification.checks.slice(0, 4)).map((check) => (
            <div
              key={check.id}
              className="text-[12px] p-[10px] rounded-[14px] clay-well space-y-[4px]"
            >
              <div className="flex items-center gap-[8px] font-medium text-[#3A3A38] dark:text-[#E8E4DD]">
                {getStatusIcon(check.status)}
                <span className="truncate">{check.name}</span>
              </div>
              {showAllChecks && check.message && (
                <p className="text-[11px] text-[#8A8880] dark:text-[#9A9691] pl-[22px] leading-normal font-sans">
                  {check.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detected Potential Issues & Fix Action */}
      {verification.issues && verification.issues.length > 0 && (
        <div className="space-y-[10px] border-t border-[#C9D6C9] dark:border-[#464A52] pt-[14px]">
          <div className="flex items-center gap-[6px] text-[12px] font-mono font-bold text-[#D96B4D]">
            <AlertTriangle className="w-[14px] h-[14px]" />
            <span>Discrepancies for Review ({verification.issues.length})</span>
          </div>

          <div className="space-y-[8px]">
            {verification.issues.map((issue) => (
              <div
                key={issue.id}
                className="p-[12px] rounded-[16px] clay-well space-y-[6px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#D96B4D]">
                    {issue.type.replace('_', ' ')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleFixClick(issue)}
                    disabled={fixingIssueId === issue.id}
                    className="clay-btn-primary h-[26px] px-[8px] rounded-full text-[10px] flex items-center gap-[4px] cursor-pointer"
                  >
                    <Wrench className="w-[10px] h-[10px]" />
                    <span>{fixingIssueId === issue.id ? 'Fixing...' : 'Fix'}</span>
                  </button>
                </div>
                <p className="text-[12px] text-[#3A3A38] dark:text-[#E8E4DD]">
                  {issue.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
