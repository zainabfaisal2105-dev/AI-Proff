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
      <div className="p-[20px] rounded-[16px] border border-[#DCE3DF] dark:border-[#3C4049] bg-white dark:bg-[#2A2D33] shadow-[0_8px_24px_-4px_rgba(40,60,50,0.08),0_2px_6px_rgba(40,60,50,0.03)] dark:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] space-y-[16px] animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-[16px] w-[120px] bg-[#EAEFEA] dark:bg-[#373A42] rounded-[6px]" />
          <div className="h-[16px] w-[48px] bg-[#EAEFEA] dark:bg-[#373A42] rounded-[6px]" />
        </div>
        <div className="h-[40px] w-[100px] bg-[#EAEFEA] dark:bg-[#373A42] rounded-[8px]" />
        <div className="space-y-[8px] pt-[8px]">
          <div className="h-[12px] w-full bg-[#EAEFEA] dark:bg-[#373A42] rounded-[6px]" />
          <div className="h-[12px] w-4/5 bg-[#EAEFEA] dark:bg-[#373A42] rounded-[6px]" />
          <div className="h-[12px] w-3/5 bg-[#EAEFEA] dark:bg-[#373A42] rounded-[6px]" />
        </div>
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
        return <CheckCircle2 className="w-[14px] h-[14px] text-[#2E7D32] dark:text-[#4ADE80] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-[14px] h-[14px] text-[#BA7A48] dark:text-[#FBBF24] shrink-0" />;
      case 'failed':
        return <XCircle className="w-[14px] h-[14px] text-[#C62828] dark:text-[#EF5350] shrink-0" />;
    }
  };

  const score = verification.overallScore;
  const scoreColor =
    score >= 90
      ? 'text-[#2E7D32] dark:text-[#4ADE80]'
      : score >= 75
      ? 'text-[#BA7A48] dark:text-[#FBBF24]'
      : 'text-[#C62828] dark:text-[#EF5350]';

  const scoreBadgeBg =
    score >= 90
      ? 'bg-[#EBF7EE] text-[#1B5E20] dark:bg-[#152B1B] dark:text-[#86EFAC] border-[#C8E6C9] dark:border-[#1E3E26]'
      : score >= 75
      ? 'bg-[#FAF5EE] text-[#9A5A28] dark:bg-[#2B2313] dark:text-[#FDE047] border-[#EEDBCA] dark:border-[#3D3017]'
      : 'bg-[#FDF2F2] text-[#B91C1C] dark:bg-[#2B1515] dark:text-[#FCA5A5] border-[#FECACA] dark:border-[#451D1D]';

  return (
    <div className="p-[20px] rounded-[16px] border border-[#DCE3DF] dark:border-[#3C4049] bg-white dark:bg-[#2A2D33] shadow-[0_8px_24px_-4px_rgba(40,60,50,0.08),0_2px_6px_rgba(40,60,50,0.03)] dark:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] space-y-[16px] transition-all">
      {/* Title & Re-verify button */}
      <div className="flex items-center justify-between pb-[12px] border-b border-[#EAEFEA] dark:border-[#353942]">
        <div className="flex items-center gap-[8px]">
          <ShieldCheck className="w-[16px] h-[16px] text-[#BA7A48] dark:text-[#EDEDED]" />
          <h3 className="text-[12px] font-serif font-bold uppercase tracking-wider text-[#18221D] dark:text-[#F5F6F8]">
            Summary Checker
          </h3>
        </div>
        <button
          type="button"
          onClick={onReVerify}
          disabled={isVerifying}
          className="text-[12px] font-medium text-[#4D5E56] dark:text-[#9EA2AE] hover:text-[#18221D] dark:hover:text-[#FFFFFF] flex items-center gap-[6px] px-[8px] py-[4px] rounded-[8px] border border-[#D0DCD5] dark:border-[#424650] bg-white dark:bg-[#31343B] hover:bg-[#F2F6F3] dark:hover:bg-[#383C45] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          title="Run an independent verification audit again"
        >
          <RefreshCw className={`w-[12px] h-[12px] ${isVerifying ? 'animate-spin' : ''}`} />
          <span className="text-[11px]">Re-audit</span>
        </button>
      </div>

      {/* Verification Score & Label */}
      <div className="border border-[#DCE3DF] dark:border-[#3A3E48] bg-[#FAFBF9] dark:bg-[#23252A] p-[16px] rounded-[12px] space-y-[10px]">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-[6px]">
            <span className={`text-[28px] font-serif font-bold leading-none ${scoreColor}`}>
              {score}
            </span>
            <span className="text-[12px] font-mono text-[#6A7B72] dark:text-[#8E93A0]">/ 100</span>
          </div>
          <span className={`text-[11px] font-medium px-[8px] py-[3px] rounded-full border ${scoreBadgeBg}`}>
            {verification.scoreLabel}
          </span>
        </div>
        <div className="flex items-center gap-[6px] text-[12px] text-[#52635B] dark:text-[#A0A5B2] leading-tight">
          <Info className="w-[14px] h-[14px] shrink-0 text-[#8A9890]" />
          <span>Independent audit comparing source chunks against claims.</span>
        </div>
      </div>

      {/* Coverage Meter */}
      <div className="space-y-[8px]">
        <div className="flex justify-between text-[12px] font-medium">
          <span className="text-[#283830] dark:text-[#D0D4DE]">Source Coverage</span>
          <span className="text-[#18221D] dark:text-[#F5F6F8] font-mono font-semibold">
            {verification.coverageAssessment.score}%
          </span>
        </div>
        <div className="w-full h-[6px] bg-[#E2EBE5] dark:bg-[#1E2024] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#BA7A48] dark:bg-[#EDEDED] transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, verification.coverageAssessment.score))}%` }}
          />
        </div>
        {verification.coverageAssessment.coveredKeyConcepts && verification.coverageAssessment.coveredKeyConcepts.length > 0 && (
          <div className="pt-[4px] flex flex-wrap gap-[6px]">
            {verification.coverageAssessment.coveredKeyConcepts.slice(0, 4).map((concept, idx) => (
              <span
                key={idx}
                className="text-[11px] px-[8px] py-[2px] rounded-[6px] bg-[#EFF4F1] dark:bg-[#34373F] text-[#34463C] dark:text-[#C5CAD6] font-medium border border-[#D4DFD9] dark:border-[#424650]"
              >
                {concept}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Verification Checklist */}
      <div className="space-y-[10px] border-t border-[#EAEFEA] dark:border-[#353942] pt-[14px]">
        <div className="flex items-center justify-between text-[12px] font-medium text-[#283830] dark:text-[#D0D4DE]">
          <span>Audit Checklist</span>
          <button
            type="button"
            onClick={() => setShowAllChecks(!showAllChecks)}
            className="text-[11px] text-[#BA7A48] dark:text-[#D2D5DD] hover:underline flex items-center gap-[2px] cursor-pointer"
          >
            {showAllChecks ? 'Less' : 'View all'}
            {showAllChecks ? <ChevronUp className="w-[12px] h-[12px]" /> : <ChevronDown className="w-[12px] h-[12px]" />}
          </button>
        </div>

        <div className="space-y-[8px]">
          {(showAllChecks ? verification.checks : verification.checks.slice(0, 4)).map((check) => (
            <div
              key={check.id}
              className="text-[12px] p-[10px] rounded-[10px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373B45] space-y-[4px]"
            >
              <div className="flex items-center gap-[8px] font-medium text-[#18221D] dark:text-[#F5F6F8]">
                {getStatusIcon(check.status)}
                <span className="truncate">{check.name}</span>
              </div>
              {showAllChecks && check.message && (
                <p className="text-[11px] text-[#52635B] dark:text-[#A0A5B2] pl-[22px] leading-normal font-sans">
                  {check.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detected Potential Issues & Fix Action */}
      {verification.issues && verification.issues.length > 0 ? (
        <div className="space-y-[12px] border-t border-[#EAEFEA] dark:border-[#353942] pt-[14px]">
          <div className="flex items-center gap-[6px] text-[12px] font-semibold text-[#BA7A48] dark:text-[#F59E0B]">
            <AlertTriangle className="w-[14px] h-[14px]" />
            <span>Discrepancies for Review ({verification.issues.length})</span>
          </div>

          <div className="space-y-[10px]">
            {verification.issues.map((issue) => (
              <div
                key={issue.id}
                className="p-[12px] rounded-[12px] border border-[#EADBCE] dark:border-[#4D3A25] bg-[#FAF6EE] dark:bg-[#25201A] space-y-[8px] text-[12px]"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A5A28] dark:text-[#FBBF24]">
                    Summary claim:
                  </span>
                  <p className="text-[#18221D] dark:text-[#F5F6F8] font-serif italic text-[12px] mt-[2px]">
                    "{issue.summaryClaim}"
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D5E56] dark:text-[#9EA2AE]">
                    Source evidence:
                  </span>
                  <p className="text-[#324238] dark:text-[#C5CAD6] text-[12px] mt-[2px] font-medium">
                    {issue.sourceEvidence}
                  </p>
                </div>

                <div className="text-[11px] text-[#5D6D65] dark:text-[#8A8F9B] border-t border-[#E8DCCF] dark:border-[#3A2D1F] pt-[6px] leading-relaxed">
                  {issue.explanation}
                </div>

                {issue.suggestedFix && (
                  <div className="pt-[4px] flex items-center justify-between gap-[8px]">
                    <span className="text-[11px] text-[#6A7B72] dark:text-[#9EA2AE] truncate">
                      Fix: {issue.suggestedFix}
                    </span>
                    <button
                      type="button"
                      disabled={fixingIssueId === issue.id}
                      onClick={() => handleFixClick(issue)}
                      className="inline-flex items-center gap-[4px] text-[11px] font-medium px-[10px] py-[5px] rounded-[8px] bg-[#BA7A48] hover:bg-[#A96D3C] text-white dark:bg-[#EDEDEB] dark:text-[#16181C] dark:hover:bg-white shadow-[0_4px_14px_rgba(186,122,72,0.3)] disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      <Wrench className="w-[12px] h-[12px]" />
                      <span>{fixingIssueId === issue.id ? 'Fixing...' : 'Fix summary'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-t border-[#EAEFEA] dark:border-[#353942] pt-[12px] flex items-center gap-[8px] text-[12px] text-[#2E7D32] dark:text-[#4ADE80]">
          <Check className="w-[14px] h-[14px] shrink-0 stroke-[2.5]" />
          <span className="text-[12px]">All claims corroborated by extracted source chunks.</span>
        </div>
      )}
    </div>
  );
};

