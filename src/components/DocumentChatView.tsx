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
  MessageSquare,
} from 'lucide-react';
import { StatusBead } from './StatusBead';

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
          <div className="inline-flex items-center gap-[6px] px-[10px] py-[3px] rounded-full bg-[#7FA398]/20 dark:bg-[#7FA398]/30 text-[#436E62] dark:text-[#A7C8BE] border border-[#7FA398]/40 text-[11px] font-mono font-medium">
            <ShieldCheck className="w-[13px] h-[13px] text-[#7FA398]" />
            <span>Strictly Grounded in Text</span>
          </div>
        );
      case 'partially_supported':
        return (
          <div className="inline-flex items-center gap-[6px] px-[10px] py-[3px] rounded-full bg-[#D9924D]/15 dark:bg-[#E8863C]/20 text-[#B06B29] dark:text-[#F3A76C] border border-[#D9924D]/35 text-[11px] font-mono font-medium">
            <AlertCircle className="w-[13px] h-[13px] text-[#D9924D] dark:text-[#E8863C]" />
            <span>Partially Supported</span>
          </div>
        );
      case 'not_supported':
        return (
          <div className="inline-flex items-center gap-[6px] px-[10px] py-[3px] rounded-full clay-well text-[#8A8880] dark:text-[#9A9691] text-[11px] font-mono font-medium">
            <HelpCircle className="w-[13px] h-[13px]" />
            <span>Not Supported in Document</span>
          </div>
        );
      case 'refused_out_of_scope':
        return (
          <div className="inline-flex items-center gap-[6px] px-[10px] py-[3px] rounded-full bg-[#E57373]/15 dark:bg-[#E57373]/25 text-[#C62828] dark:text-[#EF9A9A] border border-[#E57373]/35 text-[11px] font-mono font-medium">
            <Ban className="w-[13px] h-[13px]" />
            <span>Refused: Beyond Source Scope</span>
          </div>
        );
    }
  };

  return (
    <div className="clay-card p-[18px] sm:p-[22px] flex flex-col h-[680px] relative overflow-hidden">
      {/* Top Header with Status Bead */}
      <div className="flex items-center justify-between pb-[14px] border-b border-[#C9D6C9] dark:border-[#464A52] shrink-0">
        <div className="flex items-center gap-[10px]">
          <StatusBead status="grounded" size="sm" showPulse />
          <div>
            <h3 className="font-serif font-bold text-[15px] text-[#3A3A38] dark:text-[#E8E4DD]">
              Grounded Document Q&A
            </h3>
            <p className="text-[10px] font-mono text-[#8A8880] dark:text-[#9A9691] truncate max-w-[240px] sm:max-w-[320px]">
              Grounded exclusively in: {documentTitle}
            </p>
          </div>
        </div>

        {chatHistory.length > 0 && (
          <button
            type="button"
            onClick={onClearChat}
            className="w-[32px] h-[32px] rounded-full clay-well flex items-center justify-center text-[#8A8880] hover:text-[#C62828] dark:hover:text-[#EF5350] transition-colors cursor-pointer"
            title="Clear chat"
          >
            <Trash2 className="w-[13px] h-[13px]" />
          </button>
        )}
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto py-[16px] px-[4px] space-y-[16px]">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-[380px] mx-auto space-y-[16px] text-[#8A8880] dark:text-[#9A9691]">
            <div className="w-[50px] h-[50px] rounded-full bg-[#D6E0D6] dark:bg-[#3C4046] flex items-center justify-center text-[#D9924D] dark:text-[#E8863C] shadow-inner">
              <Sparkles className="w-[22px] h-[22px]" />
            </div>

            <div className="space-y-[4px]">
              <h4 className="font-serif font-bold text-[16px] text-[#3A3A38] dark:text-[#E8E4DD]">
                Ask questions about this paper
              </h4>
              <p className="text-[12px] leading-relaxed">
                The reading companion answers using <strong>only</strong> information in this document, refuses outside speculation, and links directly to source citations.
              </p>
            </div>

            {/* Suggested Starter Questions */}
            <div className="w-full pt-[6px] space-y-[6px]">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#8A8880] dark:text-[#9A9691]">
                Suggested prompts
              </p>
              {[
                'What is the core methodology or architecture proposed?',
                'What quantitative findings or metrics are reported?',
                'What limitations or caveats do the authors acknowledge?',
              ].map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestedClick(sug)}
                  className="clay-well hover:border-[#D9924D] dark:hover:border-[#E8863C] w-full text-left p-[10px] rounded-[16px] text-[12px] text-[#3A3A38] dark:text-[#E8E4DD] transition-all cursor-pointer truncate"
                >
                  "{sug}"
                </button>
              ))}
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
                {/* Attached excerpt snippet if user asked about specific highlighted text */}
                {isUser && msg.attachedPassage && (
                  <div className="max-w-[85%] px-[12px] py-[6px] rounded-[14px] clay-well text-[11px] text-[#8A8880] dark:text-[#9A9691] flex items-start gap-[6px]">
                    <Quote className="w-[12px] h-[12px] text-[#D9924D] dark:text-[#E8863C] shrink-0 mt-[1px]" />
                    <span className="line-clamp-2">
                      Referencing: "{msg.attachedPassage.text}"
                    </span>
                  </div>
                )}

                {/* Clay Chat Bubble */}
                <div
                  className={`max-w-[90%] p-[14px] sm:p-[16px] text-[13px] leading-relaxed rounded-[20px] ${
                    isUser
                      ? 'clay-btn-primary text-white rounded-br-[6px]'
                      : 'clay-card text-[#3A3A38] dark:text-[#E8E4DD] rounded-bl-[6px] space-y-[10px]'
                  }`}
                >
                  {/* Status Badge for Assistant Responses */}
                  {!isUser && renderAnswerabilityBadge(msg.answerability)}

                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Citation Pill: Rounded pill, secondary accent color (#7FA398), linking back to exact source passage */}
                  {!isUser && msg.citation && msg.citation.section !== 'None' && (
                    <div className="pt-[8px] border-t border-[#C9D6C9] dark:border-[#464A52] flex items-center justify-between gap-[8px]">
                      <span className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691] truncate">
                        Passage: {msg.citation.pageOrLabel}
                      </span>
                      {onJumpToSource && (
                        <button
                          type="button"
                          onClick={() => onJumpToSource(msg.citation?.section || '')}
                          className="clay-btn-secondary h-[26px] px-[10px] text-[11px] font-medium flex items-center gap-[4px] rounded-full cursor-pointer shrink-0"
                          title="Scroll to and highlight this exact passage in the reader"
                        >
                          <span>Jump to source</span>
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
          <div className="clay-card p-[14px] flex items-center gap-[10px] text-[12px] font-mono text-[#D9924D] dark:text-[#E8863C] max-w-[85%] rounded-[18px]">
            <Loader2 className="w-[15px] h-[15px] animate-spin shrink-0" />
            <span>Checking document citations and formulating grounded response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pt-[12px] border-t border-[#C9D6C9] dark:border-[#464A52] shrink-0 space-y-[8px]">
        {/* Attached Passage Chip if selected from reader */}
        {attachedPassage && (
          <div className="clay-well px-[12px] py-[6px] rounded-full flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-[6px] text-[#3A3A38] dark:text-[#E8E4DD] truncate">
              <Quote className="w-[12px] h-[12px] text-[#D9924D] dark:text-[#E8863C] shrink-0" />
              <span className="truncate">
                Asking about: "<strong>{attachedPassage.text.slice(0, 60)}...</strong>"
              </span>
            </div>
            {onClearAttachedPassage && (
              <button
                type="button"
                onClick={onClearAttachedPassage}
                className="w-[18px] h-[18px] rounded-full hover:bg-black/10 flex items-center justify-center text-[#8A8880] cursor-pointer"
              >
                <X className="w-[11px] h-[11px]" />
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-[8px]">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask question about document content..."
            disabled={isLoading}
            className="clay-well flex-1 h-[44px] px-[16px] text-[13px] text-[#3A3A38] dark:text-[#E8E4DD] placeholder-[#8A8880] focus:outline-hidden focus:ring-2 focus:ring-[#D9924D] dark:focus:ring-[#E8863C] rounded-full"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="clay-btn-primary w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40"
            title="Send question"
          >
            <Send className="w-[15px] h-[15px]" />
          </button>
        </form>
      </div>
    </div>
  );
};
