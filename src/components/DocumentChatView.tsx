import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  DocumentSection,
  AnswerabilityLevel,
  CitationReference,
} from '../types';
import {
  Send,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Ban,
  Quote,
  Trash2,
  ExternalLink,
  BookOpen,
  Loader2,
  X,
} from 'lucide-react';

interface DocumentChatViewProps {
  sections: DocumentSection[];
  documentTitle: string;
  chatHistory: ChatMessage[];
  onSendMessage: (question: string, attachedPassage?: { text: string; sectionRef: string }) => Promise<void>;
  onClearChat: () => void;
  attachedPassage?: { text: string; sectionRef: string } | null;
  onClearAttachedPassage?: () => void;
  onJumpToSource?: (sectionRef: string) => void;
  isLoading: boolean;
}

export const DocumentChatView: React.FC<DocumentChatViewProps> = ({
  sections,
  documentTitle,
  chatHistory,
  onSendMessage,
  onClearChat,
  attachedPassage,
  onClearAttachedPassage,
  onJumpToSource,
  isLoading,
}) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;
    const q = inputQuestion.trim();
    setInputQuestion('');
    onSendMessage(q, attachedPassage || undefined);
    if (onClearAttachedPassage) onClearAttachedPassage();
  };

  const handleSuggestedClick = (suggested: string) => {
    if (isLoading) return;
    onSendMessage(suggested);
  };

  const renderAnswerabilityBadge = (level?: AnswerabilityLevel) => {
    if (!level) return null;

    switch (level) {
      case 'directly_supported':
        return (
          <div className="inline-flex items-center gap-[5px] px-[8px] py-[3px] rounded-[6px] bg-[#E8F5E9] dark:bg-[#1C3322] text-[#2E7D32] dark:text-[#4ADE80] border border-[#C8E6C9] dark:border-[#2E5E3A] text-[11px] font-mono font-medium">
            <ShieldCheck className="w-[13px] h-[13px]" />
            <span>Directly Supported</span>
          </div>
        );
      case 'partially_supported':
        return (
          <div className="inline-flex items-center gap-[5px] px-[8px] py-[3px] rounded-[6px] bg-[#FFF8E1] dark:bg-[#332A15] text-[#B78103] dark:text-[#FBBF24] border border-[#FFE082] dark:border-[#574418] text-[11px] font-mono font-medium">
            <AlertCircle className="w-[13px] h-[13px]" />
            <span>Partially Supported</span>
          </div>
        );
      case 'not_supported':
        return (
          <div className="inline-flex items-center gap-[5px] px-[8px] py-[3px] rounded-[6px] bg-[#F1F5F9] dark:bg-[#20232A] text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#334155] text-[11px] font-mono font-medium">
            <HelpCircle className="w-[13px] h-[13px]" />
            <span>Not Supported in Document</span>
          </div>
        );
      case 'refused_out_of_scope':
        return (
          <div className="inline-flex items-center gap-[5px] px-[8px] py-[3px] rounded-[6px] bg-[#FFEBEE] dark:bg-[#33181C] text-[#C62828] dark:text-[#EF5350] border border-[#FFCDD2] dark:border-[#5E242B] text-[11px] font-mono font-medium">
            <Ban className="w-[13px] h-[13px]" />
            <span>Outside Document Scope</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col h-[650px] overflow-hidden">
      {/* Top Header */}
      <div className="px-[20px] py-[16px] border-b border-[#EAEFEA] dark:border-[#373A42] flex items-center justify-between bg-[#FAFBF9] dark:bg-[#23252A]">
        <div className="flex items-center gap-[10px]">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-[#EFF4F1] dark:bg-[#32363E] text-[#BA7A48] dark:text-[#EDEDED] flex items-center justify-center">
            <BookOpen className="w-[16px] h-[16px]" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-[15px] text-[#18221D] dark:text-[#F5F6F8]">
              Ask this Document
            </h3>
            <p className="text-[11px] font-mono text-[#6A7B72] dark:text-[#8E93A0] truncate max-w-[280px] sm:max-w-[420px]">
              Strictly grounded in: {documentTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-[8px]">
          {chatHistory.length > 0 && (
            <button
              type="button"
              onClick={onClearChat}
              className="p-[8px] rounded-[8px] text-[#6A7B72] dark:text-[#8E93A0] hover:text-[#C62828] hover:bg-[#FFEBEE] dark:hover:bg-[#33181C] transition-colors cursor-pointer"
              title="Clear conversation"
            >
              <Trash2 className="w-[15px] h-[15px]" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-[20px] space-y-[16px]">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-[440px] mx-auto space-y-[16px] text-[#6A7B72] dark:text-[#8E93A0]">
            <div className="w-[44px] h-[44px] rounded-[12px] bg-[#EFF4F1] dark:bg-[#32363E] text-[#BA7A48] dark:text-[#EDEDED] flex items-center justify-center">
              <Sparkles className="w-[20px] h-[20px]" />
            </div>
            <div className="space-y-[6px]">
              <h4 className="font-serif font-bold text-[16px] text-[#18221D] dark:text-[#F5F6F8]">
                Ask questions about this paper
              </h4>
              <p className="text-[13px] leading-relaxed">
                The companion answers using <strong>only</strong> information in this document, refuses unrelated queries, and categorizes support levels.
              </p>
            </div>

            {/* Starter Suggestion Chips */}
            <div className="space-y-[8px] w-full pt-[8px]">
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#8E9E95] dark:text-[#7A808C]">
                Suggested Questions
              </p>
              <div className="flex flex-col gap-[6px]">
                {[
                  'What is the core methodology or architecture proposed?',
                  'What quantitative findings or metrics are reported?',
                  'What limitations or caveats do the authors acknowledge?',
                  'Why did the authors choose their specific baseline?',
                ].map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestedClick(sug)}
                    className="text-left px-[12px] py-[8px] rounded-[8px] bg-[#FAFBF9] dark:bg-[#25282E] border border-[#DCE3DF] dark:border-[#373A42] text-[12px] text-[#283830] dark:text-[#D5D8E0] hover:border-[#BA7A48] dark:hover:border-[#EDEDED] hover:text-[#BA7A48] dark:hover:text-[#FFFFFF] transition-all cursor-pointer truncate"
                  >
                    "{sug}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-[6px]`}
              >
                {/* Attached Passage Snippet (if user asked about a highlight) */}
                {isUser && msg.attachedPassage && (
                  <div className="max-w-[85%] px-[12px] py-[6px] rounded-[8px] bg-[#FAFBF9] dark:bg-[#202227] border border-[#DCE3DF] dark:border-[#373A42] text-[11px] text-[#5D6D65] dark:text-[#9EA2AE] flex items-start gap-[6px]">
                    <Quote className="w-[12px] h-[12px] text-[#BA7A48] dark:text-[#EDEDED] shrink-0 mt-[2px]" />
                    <span className="line-clamp-2">
                      Referencing: "{msg.attachedPassage.text}" ({msg.attachedPassage.sectionRef})
                    </span>
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-[14px] p-[14px] text-[13px] leading-relaxed ${
                    isUser
                      ? 'bg-[#BA7A48] text-white rounded-br-[4px]'
                      : 'bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] text-[#18221D] dark:text-[#E2E5EC] rounded-bl-[4px] space-y-[10px]'
                  }`}
                >
                  {/* Status Badge for Assistant Responses */}
                  {!isUser && renderAnswerabilityBadge(msg.answerability)}

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Citation Reference Chip */}
                  {!isUser && msg.citation && msg.citation.section !== 'None' && (
                    <div className="pt-[8px] border-t border-[#EAEFEA] dark:border-[#373A42] flex items-center justify-between gap-[8px] text-[11px] font-mono">
                      <span className="text-[#6A7B72] dark:text-[#8E93A0] truncate">
                        Source: {msg.citation.pageOrLabel}
                      </span>
                      {onJumpToSource && (
                        <button
                          type="button"
                          onClick={() => onJumpToSource(msg.citation?.section || '')}
                          className="text-[#BA7A48] dark:text-[#EDEDED] hover:underline flex items-center gap-[3px] shrink-0 cursor-pointer"
                        >
                          <span>View Passage</span>
                          <ExternalLink className="w-[10px] h-[10px]" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-start gap-[8px] text-[#6A7B72] dark:text-[#8E93A0]">
            <div className="p-[12px] rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] flex items-center gap-[8px] text-[12px] font-mono">
              <Loader2 className="w-[14px] h-[14px] animate-spin text-[#BA7A48] dark:text-[#EDEDED]" />
              <span>Checking document citations & formulating grounded response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form & Attached Passage Indicator */}
      <div className="p-[16px] border-t border-[#EAEFEA] dark:border-[#373A42] bg-[#FAFBF9] dark:bg-[#23252A] space-y-[8px]">
        {/* Attached Passage preview banner */}
        {attachedPassage && (
          <div className="px-[12px] py-[6px] rounded-[8px] bg-white dark:bg-[#2A2D33] border border-[#BA7A48] dark:border-[#EDEDED] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-[6px] text-[#283830] dark:text-[#D5D8E0] truncate">
              <Quote className="w-[12px] h-[12px] text-[#BA7A48] dark:text-[#EDEDED] shrink-0" />
              <span className="truncate">
                Asking about: "<strong>{attachedPassage.text.slice(0, 70)}...</strong>"
              </span>
            </div>
            {onClearAttachedPassage && (
              <button
                type="button"
                onClick={onClearAttachedPassage}
                className="text-[#8E9E95] hover:text-[#C62828] cursor-pointer"
              >
                <X className="w-[13px] h-[13px]" />
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-[8px]">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask anything about this document..."
            disabled={isLoading}
            className="flex-1 h-[42px] px-[14px] rounded-[10px] bg-white dark:bg-[#1E2024] border border-[#CCD7D1] dark:border-[#3C4049] text-[13px] text-[#18221D] dark:text-[#F5F6F8] placeholder-[#8E9E95] focus:outline-hidden focus:border-[#BA7A48] dark:focus:border-[#EDEDED] transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="h-[42px] px-[16px] rounded-[10px] bg-[#BA7A48] hover:bg-[#A96D3C] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-xs cursor-pointer"
          >
            <Send className="w-[15px] h-[15px]" />
          </button>
        </form>
      </div>
    </div>
  );
};
