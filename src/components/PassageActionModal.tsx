import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, X, BookmarkPlus, MessageSquare, Copy, Check, Loader2 } from 'lucide-react';
import { StatusBead } from './StatusBead';

interface PassageActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  passage: string;
  action: 'explain' | 'simplify' | 'note';
  sectionContext: string;
  documentTitle: string;
  onSaveAsNote: (passage: string, noteContent: string, sectionContext: string) => void;
  onOpenInChat: (passage: string, sectionContext: string) => void;
}

export const PassageActionModal: React.FC<PassageActionModalProps> = ({
  isOpen,
  onClose,
  passage,
  action,
  sectionContext,
  documentTitle,
  onSaveAsNote,
  onOpenInChat,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [groundedNote, setGroundedNote] = useState('');
  const [terminology, setTerminology] = useState<{ term: string; explanation: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const [personalNoteInput, setPersonalNoteInput] = useState('');
  const [showNoteEditor, setShowNoteEditor] = useState(action === 'note');

  useEffect(() => {
    if (!isOpen || !passage) return;

    if (action === 'note') {
      setShowNoteEditor(true);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const fetchExplanation = async () => {
      try {
        const res = await fetch('/api/explain-passage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            passage,
            action,
            sectionContext,
            documentTitle,
          }),
        });

        if (res.ok && isMounted) {
          const data = await res.json();
          setResultText(data.result || '');
          setGroundedNote(data.groundedNote || '');
          setTerminology(data.simplifiedTerminology || []);
        }
      } catch (err) {
        console.error('Failed to explain passage:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchExplanation();

    return () => {
      isMounted = false;
    };
  }, [isOpen, passage, action, sectionContext, documentTitle]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText || passage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNoteSubmit = () => {
    onSaveAsNote(passage, personalNoteInput || resultText, sectionContext);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px] bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="clay-card max-w-[620px] w-full p-[24px] sm:p-[28px] space-y-[20px] max-h-[90vh] overflow-y-auto relative">
        {/* Modal Top Header with Status Bead */}
        <div className="flex items-center justify-between pb-[14px] border-b border-[#C9D6C9] dark:border-[#464A52]">
          <div className="flex items-center gap-[10px]">
            <StatusBead status="grounded" size="sm" showPulse={isLoading} />
            <div className="flex items-center gap-[8px]">
              <div className="w-[32px] h-[32px] rounded-full bg-[#D6E0D6] dark:bg-[#3C4046] text-[#D9924D] dark:text-[#E8863C] flex items-center justify-center">
                {action === 'explain' && <Lightbulb className="w-[16px] h-[16px]" />}
                {action === 'simplify' && <Sparkles className="w-[16px] h-[16px]" />}
                {action === 'note' && <BookmarkPlus className="w-[16px] h-[16px]" />}
              </div>
              <h3 className="font-serif font-bold text-[16px] text-[#3A3A38] dark:text-[#E8E4DD]">
                {action === 'explain' && 'Technical Passage Explanation'}
                {action === 'simplify' && 'Plain-Language Simplification'}
                {action === 'note' && 'Attach Research Note'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-full clay-well flex items-center justify-center text-[#8A8880] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD] cursor-pointer"
          >
            <X className="w-[14px] h-[14px]" />
          </button>
        </div>

        {/* Selected Excerpt Snippet with soft translucent wash */}
        <div className="clay-well p-[16px] rounded-[18px] space-y-[6px]">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
            <span>From: {sectionContext}</span>
            <span>{passage.trim().split(/\s+/).length} words selected</span>
          </div>
          <p className="text-[13px] font-serif italic text-[#3A3A38] dark:text-[#E8E4DD] leading-relaxed border-l-2 border-[#7FA398] pl-[10px]">
            "{passage}"
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-[32px] flex flex-col items-center justify-center text-center space-y-[12px] text-[#D9924D] dark:text-[#E8863C]">
            <Loader2 className="w-[28px] h-[28px] animate-spin" />
            <p className="text-[13px] font-mono">
              Grounding analysis in source citations...
            </p>
          </div>
        )}

        {/* Result Content */}
        {!isLoading && action !== 'note' && (
          <div className="space-y-[16px]">
            <div className="clay-card p-[18px] space-y-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#D9924D] dark:text-[#E8863C] uppercase tracking-wider">
                  {action === 'simplify' ? 'Plain Language Output' : 'Conceptual Breakdown'}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="clay-well h-[28px] px-[10px] rounded-full text-[11px] flex items-center gap-[4px] text-[#8A8880] hover:text-[#3A3A38] cursor-pointer"
                >
                  {copied ? <Check className="w-[12px] h-[12px] text-[#5B9A7D]" /> : <Copy className="w-[12px] h-[12px]" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-[14px] leading-relaxed text-[#3A3A38] dark:text-[#E8E4DD] font-sans">
                {resultText}
              </p>
            </div>

            {/* Simplified Terminology Cards if any */}
            {terminology.length > 0 && (
              <div className="space-y-[8px]">
                <span className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691] uppercase tracking-wider">
                  Decoded Terminology
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[8px]">
                  {terminology.map((t, idx) => (
                    <div key={idx} className="clay-well p-[12px] rounded-[14px] space-y-[4px]">
                      <span className="text-[12px] font-mono font-bold text-[#7FA398]">
                        {t.term}
                      </span>
                      <p className="text-[12px] text-[#3A3A38] dark:text-[#E8E4DD] leading-snug">
                        {t.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Personal Note Editor */}
        {showNoteEditor && (
          <div className="space-y-[10px]">
            <label className="block text-[12px] font-mono text-[#8A8880] dark:text-[#9A9691]">
              Personal Note Attached to this Passage:
            </label>
            <textarea
              rows={3}
              value={personalNoteInput}
              onChange={(e) => setPersonalNoteInput(e.target.value)}
              placeholder="Record your hypothesis, question, or annotation..."
              className="clay-well w-full p-[14px] text-[13px] text-[#3A3A38] dark:text-[#E8E4DD] placeholder-[#8A8880] focus:outline-hidden focus:ring-2 focus:ring-[#D9924D] dark:focus:ring-[#E8863C] rounded-[16px]"
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-[10px] pt-[14px] border-t border-[#C9D6C9] dark:border-[#464A52]">
          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              onClick={() => {
                onOpenInChat(passage, sectionContext);
                onClose();
              }}
              className="clay-btn-neutral h-[38px] px-[14px] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer"
            >
              <MessageSquare className="w-[13px] h-[13px] text-[#7FA398]" />
              <span>Ask in Q&A Chat</span>
            </button>
          </div>

          <div className="flex items-center gap-[8px]">
            {!showNoteEditor && action !== 'note' ? (
              <button
                type="button"
                onClick={() => setShowNoteEditor(true)}
                className="clay-btn-neutral h-[38px] px-[14px] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer"
              >
                <BookmarkPlus className="w-[13px] h-[13px] text-[#D9924D] dark:text-[#E8863C]" />
                <span>Save to Notes</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveNoteSubmit}
                disabled={!personalNoteInput.trim() && !resultText}
                className="clay-btn-primary h-[38px] px-[18px] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer disabled:opacity-50"
              >
                <span>Save Note</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="clay-btn-neutral h-[38px] px-[14px] text-[12px] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
