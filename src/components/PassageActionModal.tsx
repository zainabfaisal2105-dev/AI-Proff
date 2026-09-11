import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, X, BookmarkPlus, MessageSquare, Copy, Check, Loader2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px] bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] max-w-[620px] w-full p-[24px] shadow-[0_16px_48px_rgba(0,0,0,0.15)] space-y-[18px] max-h-[90vh] overflow-y-auto">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-[14px] border-b border-[#EAEFEA] dark:border-[#373A42]">
          <div className="flex items-center gap-[8px]">
            <div className="w-[30px] h-[30px] rounded-[8px] bg-[#EFF4F1] dark:bg-[#32363E] text-[#BA7A48] dark:text-[#EDEDED] flex items-center justify-center">
              {action === 'explain' && <Lightbulb className="w-[16px] h-[16px]" />}
              {action === 'simplify' && <Sparkles className="w-[16px] h-[16px]" />}
              {action === 'note' && <BookmarkPlus className="w-[16px] h-[16px]" />}
            </div>
            <div>
              <h3 className="font-serif font-bold text-[15px] text-[#18221D] dark:text-[#F5F6F8] capitalize">
                {action === 'explain' ? 'Grounded Passage Explanation' : action === 'simplify' ? 'Simplified Passage Phrasing' : 'Save Note on Passage'}
              </h3>
              <p className="text-[11px] font-mono text-[#6A7B72] dark:text-[#8E93A0]">
                {sectionContext}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-[6px] rounded-[6px] text-[#8E9E95] hover:text-[#18221D] dark:hover:text-white cursor-pointer"
          >
            <X className="w-[16px] h-[16px]" />
          </button>
        </div>

        {/* Original Selected Excerpt */}
        <div className="space-y-[6px]">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E9E95] dark:text-[#7A808C]">
            Selected Passage:
          </span>
          <div className="p-[12px] rounded-[8px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] font-serif text-[13px] italic text-[#283830] dark:text-[#D5D8E0] leading-relaxed">
            "{passage}"
          </div>
        </div>

        {/* AI Output or Loading */}
        {action !== 'note' && (
          <div className="space-y-[12px]">
            {isLoading ? (
              <div className="py-[30px] text-center space-y-[10px]">
                <Loader2 className="w-[24px] h-[24px] animate-spin text-[#BA7A48] dark:text-[#EDEDED] mx-auto" />
                <p className="text-[12px] font-mono text-[#6A7B72] dark:text-[#8E93A0]">
                  Analyzing passage within document context...
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-[6px]">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E9E95] dark:text-[#7A808C]">
                    {action === 'explain' ? 'Accessible Explanation:' : 'Plain-Language Phrasing:'}
                  </span>
                  <div className="p-[14px] rounded-[10px] bg-white dark:bg-[#202227] border border-[#DCE3DF] dark:border-[#373A42] text-[13px] text-[#18221D] dark:text-[#F5F6F8] leading-relaxed whitespace-pre-wrap">
                    {resultText}
                  </div>
                </div>

                {groundedNote && (
                  <div className="text-[11px] font-mono text-[#6A7B72] dark:text-[#8E93A0] flex items-center gap-[6px]">
                    <span className="w-[5px] h-[5px] rounded-full bg-[#BA7A48]" />
                    <span>{groundedNote}</span>
                  </div>
                )}

                {/* Terminology definitions */}
                {terminology.length > 0 && (
                  <div className="space-y-[6px]">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E9E95]">
                      Technical Terms:
                    </span>
                    <div className="space-y-[4px]">
                      {terminology.map((t, idx) => (
                        <div key={idx} className="p-[8px] rounded-[6px] bg-[#FAFBF9] dark:bg-[#23252A] text-[12px]">
                          <strong className="text-[#BA7A48] dark:text-[#EDEDED]">{t.term}:</strong>{' '}
                          <span className="text-[#283830] dark:text-[#D5D8E0]">{t.explanation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Note Editor Area */}
        {showNoteEditor && (
          <div className="space-y-[8px] pt-[8px] border-t border-[#EAEFEA] dark:border-[#373A42]">
            <label className="block text-[12px] font-medium text-[#18221D] dark:text-[#F5F6F8]">
              Your Personal Note:
            </label>
            <textarea
              value={personalNoteInput}
              onChange={(e) => setPersonalNoteInput(e.target.value)}
              placeholder="Record your thoughts or questions on this passage..."
              rows={3}
              className="w-full p-[10px] rounded-[8px] bg-white dark:bg-[#1E2024] border border-[#CCD7D1] dark:border-[#3C4049] text-[13px] text-[#18221D] dark:text-[#F5F6F8] focus:outline-hidden focus:border-[#BA7A48]"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-[10px] border-t border-[#EAEFEA] dark:border-[#373A42] flex-wrap gap-[8px]">
          <div className="flex items-center gap-[6px]">
            {action !== 'note' && (
              <button
                type="button"
                onClick={handleCopy}
                className="h-[34px] px-[10px] rounded-[6px] border border-[#CCD7D1] dark:border-[#3C4049] text-[12px] text-[#283830] dark:text-[#D5D8E0] hover:bg-[#EFF4F1] flex items-center gap-[4px] cursor-pointer"
              >
                {copied ? <Check className="w-[13px] h-[13px] text-[#2E7D32]" /> : <Copy className="w-[13px] h-[13px]" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onOpenInChat(passage, sectionContext);
                onClose();
              }}
              className="h-[34px] px-[10px] rounded-[6px] border border-[#CCD7D1] dark:border-[#3C4049] text-[12px] text-[#283830] dark:text-[#D5D8E0] hover:bg-[#EFF4F1] flex items-center gap-[4px] cursor-pointer"
            >
              <MessageSquare className="w-[13px] h-[13px] text-[#60A5FA]" />
              <span>Ask in Chat</span>
            </button>
          </div>

          <div className="flex items-center gap-[8px]">
            {!showNoteEditor ? (
              <button
                type="button"
                onClick={() => setShowNoteEditor(true)}
                className="h-[34px] px-[12px] rounded-[6px] bg-[#EFF4F1] dark:bg-[#32363E] text-[#283830] dark:text-[#D5D8E0] text-[12px] font-medium hover:bg-[#E2ECE5] flex items-center gap-[6px] cursor-pointer"
              >
                <BookmarkPlus className="w-[13px] h-[13px]" />
                <span>Save to Notes</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveNoteSubmit}
                className="h-[34px] px-[14px] rounded-[6px] bg-[#BA7A48] hover:bg-[#A96D3C] text-white text-[12px] font-medium shadow-xs cursor-pointer"
              >
                Save Note
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
