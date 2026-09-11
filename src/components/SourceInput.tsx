import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  Link as LinkIcon,
  FileText,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  FileCheck2,
  Table2,
  Cpu,
  CornerDownRight,
  ShieldCheck,
  Bookmark,
  Clock,
  Layers,
} from 'lucide-react';
import { SAMPLE_DOCUMENTS, SampleDocument } from '../data/sampleDocuments';
import { SavedDocumentSession } from '../types';

interface SourceInputProps {
  onProcessFile: (file: File) => void;
  onProcessUrl: (url: string) => void;
  onProcessText: (text: string, title?: string) => void;
  onProcessSample: (sample: SampleDocument) => void;
  isLoading: boolean;
  errorMessage: string | null;
  clearError: () => void;
  savedSessions?: SavedDocumentSession[];
  onOpenSession?: (session: SavedDocumentSession) => void;
  onOpenLibrary?: () => void;
}

export const SourceInput: React.FC<SourceInputProps> = ({
  onProcessFile,
  onProcessUrl,
  onProcessText,
  onProcessSample,
  isLoading,
  errorMessage,
  clearError,
  savedSessions = [],
  onOpenSession,
  onOpenLibrary,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'paste'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    clearError();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onProcessFile(file);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    clearError();
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onProcessFile(file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!urlInput.trim()) return;
    onProcessUrl(urlInput.trim());
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!pasteText.trim()) return;
    onProcessText(pasteText.trim(), pasteTitle.trim() || 'Pasted Content');
  };

  return (
    <div className="w-full max-w-[960px] mx-auto">
      {/* 4. LANDING / INPUT SCREEN VERTICAL RHYTHM */}
      {/* PAGE TITLE: 48px top margin, 32-40px font size desktop, 26-32px mobile */}
      <div className="text-center pt-[48px]">
        <h1 className="text-[28px] sm:text-[34px] lg:text-[38px] font-serif font-bold tracking-tight text-[#18221D] dark:text-[#F5F6F8] leading-tight">
          Understand your documents. Completely.
        </h1>
        {/* SHORT DESCRIPTION: 10-14px below title, 15-16px body font, max 65-75ch width */}
        <p className="mt-[12px] text-[15px] sm:text-[16px] text-[#4D5E56] dark:text-[#9EA2AE] max-w-[70ch] mx-auto leading-relaxed">
          A high-fidelity document summarizer engineered to preserve all statistics, conditions, and original structure without inventing or extrapolating.
        </p>
      </div>

      {/* INPUT / UPLOAD AREA: 28-36px below description */}
      <div className="mt-[32px] bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#3C4049] rounded-[16px] shadow-[0_8px_24px_-4px_rgba(40,60,50,0.08),0_2px_6px_rgba(40,60,50,0.03)] dark:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] overflow-hidden">
        {/* Compact Tab Bar */}
        <div className="flex border-b border-[#DCE3DF] dark:border-[#373A42] bg-[#F3F7F4] dark:bg-[#222428] text-[13px]">
          <button
            type="button"
            onClick={() => { setActiveTab('upload'); clearError(); }}
            className={`flex-1 h-[44px] font-medium transition-colors flex items-center justify-center gap-[8px] cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-[#2A2D33] text-[#18221D] dark:text-[#F5F6F8] border-b-2 border-[#BA7A48] dark:border-[#EDEDED]'
                : 'text-[#5D6D65] dark:text-[#8A8F9B] hover:text-[#18221D] dark:hover:text-[#F5F6F8]'
            }`}
          >
            <UploadCloud className="w-[15px] h-[15px] text-[#BA7A48] dark:text-[#D2D5DD]" />
            <span>Upload Document</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('url'); clearError(); }}
            className={`flex-1 h-[44px] font-medium transition-colors flex items-center justify-center gap-[8px] cursor-pointer ${
              activeTab === 'url'
                ? 'bg-white dark:bg-[#2A2D33] text-[#18221D] dark:text-[#F5F6F8] border-b-2 border-[#BA7A48] dark:border-[#EDEDED]'
                : 'text-[#5D6D65] dark:text-[#8A8F9B] hover:text-[#18221D] dark:hover:text-[#F5F6F8]'
            }`}
          >
            <LinkIcon className="w-[15px] h-[15px] text-[#BA7A48] dark:text-[#D2D5DD]" />
            <span>Web URL</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('paste'); clearError(); }}
            className={`flex-1 h-[44px] font-medium transition-colors flex items-center justify-center gap-[8px] cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-white dark:bg-[#2A2D33] text-[#18221D] dark:text-[#F5F6F8] border-b-2 border-[#BA7A48] dark:border-[#EDEDED]'
                : 'text-[#5D6D65] dark:text-[#8A8F9B] hover:text-[#18221D] dark:hover:text-[#F5F6F8]'
            }`}
          >
            <FileText className="w-[15px] h-[15px] text-[#BA7A48] dark:text-[#D2D5DD]" />
            <span>Paste Text</span>
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'upload' && (
          <div className="p-[20px] sm:p-[24px]">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-[200px] sm:h-[220px] lg:h-[260px] rounded-[14px] border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center p-[16px] sm:p-[20px] ${
                isDragging
                  ? 'border-[#BA7A48] dark:border-[#EDEDED] bg-[#FAF5F0] dark:bg-[#34373F]'
                  : 'border-[#CCD7D1] dark:border-[#424650] hover:border-[#BA7A48] dark:hover:border-[#727784] bg-[#FAFBF9] dark:bg-[#23252A]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.txt"
                onChange={handleFileSelect}
                disabled={isLoading}
              />

              {/* Small icon */}
              <div className="w-[44px] h-[44px] rounded-full bg-[#EAEFEA] dark:bg-[#2D3037] flex items-center justify-center text-[#BA7A48] dark:text-[#EDEDED]">
                <UploadCloud className="w-[22px] h-[22px]" />
              </div>

              {/* 12-16px gap -> Primary text */}
              <div className="mt-[14px] text-[15px] sm:text-[16px] font-semibold text-[#18221D] dark:text-[#F5F6F8]">
                Upload or drop your document
              </div>

              {/* 8px gap -> Supported formats */}
              <div className="mt-[8px] text-[12px] sm:text-[13px] font-mono text-[#6C7A73] dark:text-[#8E93A0]">
                PDF · DOCX · PPTX · XLSX · CSV · TXT
              </div>

              {/* 20-24px gap -> Primary Button */}
              <div className="mt-[22px]">
                <div className="h-[46px] min-w-[130px] px-[22px] rounded-[10px] bg-[#BA7A48] hover:bg-[#A96D3C] text-white dark:bg-[#EDEDED] dark:text-[#16181C] dark:hover:bg-white text-[13px] sm:text-[14px] font-medium transition-all flex items-center justify-center gap-[8px] shadow-[0_4px_14px_rgba(186,122,72,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.9)]">
                  <FileCheck2 className="w-[15px] h-[15px]" />
                  <span>Browse files</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Web URL */}
        {activeTab === 'url' && (
          <form onSubmit={handleUrlSubmit} className="p-[20px] sm:p-[24px] space-y-[16px]">
            <div>
              <label className="block text-[13px] font-semibold text-[#283830] dark:text-[#D0D4DE] mb-[8px]">
                Document or Article Web Address
              </label>
              {/* URL row: 70-80% input, 20-30% button, 8-12px gap, 44-48px heights */}
              <div className="flex flex-col sm:flex-row gap-[10px]">
                <div className="relative w-full sm:w-[75%]">
                  <div className="absolute inset-y-0 left-0 pl-[12px] flex items-center pointer-events-none text-[#75857D] dark:text-[#7A808C]">
                    <LinkIcon className="w-[15px] h-[15px]" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://example.com/research-paper-or-filing"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-[46px] pl-[36px] pr-[12px] text-[13px] rounded-[10px] border border-[#CCD7D1] dark:border-[#424650] bg-white dark:bg-[#1E2024] text-[#18221D] dark:text-[#F5F6F8] placeholder-[#8A9992] dark:placeholder-[#727784] focus:outline-hidden focus:border-[#BA7A48] dark:focus:border-[#8E94A2]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !urlInput.trim()}
                  className="w-full sm:w-[25%] h-[46px] min-w-[120px] px-[20px] text-[13px] font-medium rounded-[10px] bg-[#BA7A48] hover:bg-[#A96D3C] text-white dark:bg-[#EDEDED] dark:text-[#16181C] dark:hover:bg-white disabled:opacity-50 transition-all flex items-center justify-center gap-[8px] shadow-[0_4px_14px_rgba(186,122,72,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.9)] cursor-pointer shrink-0"
                >
                  <span>Analyze URL</span>
                  <ArrowRight className="w-[14px] h-[14px]" />
                </button>
              </div>
            </div>
            <div className="p-[12px] rounded-[10px] bg-[#F1F6F3] dark:bg-[#23252A] border border-[#DCE5E0] dark:border-[#373B43] text-[12px] text-[#42524A] dark:text-[#A2A6B2] leading-relaxed">
              Extracts clean textual and tabular content from the URL. External ads, sidebars, and navigation elements are stripped to maintain pure source grounding.
            </div>
          </form>
        )}

        {/* Tab 3: Paste Text */}
        {activeTab === 'paste' && (
          <form onSubmit={handleTextSubmit} className="p-[20px] sm:p-[24px] space-y-[16px]">
            <div>
              <label className="block text-[13px] font-semibold text-[#283830] dark:text-[#D0D4DE] mb-[6px]">
                Document Label (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Clinical Trial Abstract, Technical RFC, Financial Statement..."
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                disabled={isLoading}
                className="w-full h-[42px] px-[12px] text-[13px] rounded-[10px] border border-[#CCD7D1] dark:border-[#424650] bg-white dark:bg-[#1E2024] text-[#18221D] dark:text-[#F5F6F8] placeholder-[#8A9992] dark:placeholder-[#727784] focus:outline-hidden focus:border-[#BA7A48]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#283830] dark:text-[#D0D4DE] mb-[6px]">
                Source Text
              </label>
              <textarea
                rows={6}
                placeholder="Paste raw text here..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                disabled={isLoading}
                className="w-full p-[12px] text-[13px] rounded-[10px] border border-[#CCD7D1] dark:border-[#424650] bg-white dark:bg-[#1E2024] text-[#18221D] dark:text-[#F5F6F8] placeholder-[#8A9992] dark:placeholder-[#727784] focus:outline-hidden focus:border-[#BA7A48] leading-relaxed resize-y font-mono"
                required
              />
              <div className="flex justify-between items-center text-[12px] font-mono text-[#6C7A73] dark:text-[#8E93A0] mt-[6px]">
                <span>
                  {pasteText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <span>Minimum 20 characters</span>
              </div>
            </div>
            <div className="flex justify-end pt-[4px]">
              <button
                type="submit"
                disabled={isLoading || pasteText.trim().length < 20}
                className="w-full sm:w-auto h-[46px] min-w-[120px] px-[20px] text-[13px] font-medium rounded-[10px] bg-[#BA7A48] hover:bg-[#A96D3C] text-white dark:bg-[#EDEDEB] dark:text-[#16181C] dark:hover:bg-white disabled:opacity-50 transition-all flex items-center justify-center gap-[8px] shadow-[0_4px_14px_rgba(186,122,72,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.9)] cursor-pointer"
              >
                <span>Analyze Text</span>
                <ArrowRight className="w-[14px] h-[14px]" />
              </button>
            </div>
          </form>
        )}

        {/* Error message display if any */}
        {errorMessage && (
          <div className="mx-[20px] sm:mx-[24px] mb-[20px] p-[12px] rounded-[10px] bg-[#FDF2F2] dark:bg-[#2B1515] border border-[#F5C6C6] dark:border-[#481E1E] flex items-start gap-[10px] text-[13px] text-[#A82828] dark:text-[#FCA5A5]">
            <AlertCircle className="w-[16px] h-[16px] shrink-0 mt-[2px]" />
            <div className="flex-1 leading-normal font-medium">
              {errorMessage}
            </div>
          </div>
        )}
      </div>

      {/* Saved Reading Sessions & Stored Notes (if any exist) */}
      {savedSessions.length > 0 && (
        <div className="mt-[28px] space-y-[12px]">
          <div className="flex items-center justify-between text-[13px] text-[#45544C] dark:text-[#9EA2AE]">
            <span className="font-semibold flex items-center gap-[6px]">
              <Bookmark className="w-[14px] h-[14px] text-[#BA7A48] dark:text-[#EDEDED]" />
              <span>Continue Reading (Saved Documents & Stored Notes)</span>
            </span>
            {onOpenLibrary && (
              <button
                type="button"
                onClick={onOpenLibrary}
                className="text-[12px] font-mono text-[#BA7A48] dark:text-[#EDEDED] hover:underline cursor-pointer"
              >
                View all ({savedSessions.length}) →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
            {savedSessions.slice(0, 4).map((session) => (
              <div
                key={session.id}
                className="p-[16px] rounded-[14px] border border-[#DCE3DF] dark:border-[#3C4049] bg-white dark:bg-[#2A2D33] hover:border-[#BA7A48] dark:hover:border-[#EDEDED] transition-all shadow-[0_4px_16px_rgba(40,60,50,0.05)] flex flex-col justify-between gap-[12px] group"
              >
                <div className="space-y-[6px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-semibold px-[6px] py-[2px] rounded-[4px] bg-[#EFF4F1] dark:bg-[#1E2024] text-[#34463C] dark:text-[#D2D5DD] border border-[#CCD7D1] dark:border-[#3C4049]">
                      {session.fileType}
                    </span>
                    <span className="text-[11px] font-mono text-[#BA7A48] dark:text-[#EDEDED] flex items-center gap-[3px]">
                      <Bookmark className="w-[11px] h-[11px]" />
                      {session.notes?.length || 0} notes stored
                    </span>
                  </div>

                  <h4 className="font-serif font-semibold text-[14px] text-[#18221D] dark:text-[#F5F6F8] line-clamp-1">
                    {session.title}
                  </h4>

                  <p className="text-[11px] font-mono text-[#8E9E95] dark:text-[#7A808C] flex items-center gap-[4px]">
                    <Clock className="w-[11px] h-[11px]" />
                    {session.totalWords?.toLocaleString() || 0} words · {session.sectionCount} sections
                  </p>
                </div>

                <div className="pt-[10px] border-t border-[#EAEFEA] dark:border-[#373A42] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#8E9E95] dark:text-[#7A808C]">
                    {new Date(session.lastOpened).toLocaleDateString()}
                  </span>
                  {onOpenSession && (
                    <button
                      type="button"
                      onClick={() => onOpenSession(session)}
                      className="text-[12px] font-medium text-[#BA7A48] dark:text-[#EDEDED] hover:underline flex items-center gap-[4px] cursor-pointer"
                    >
                      <span>Resume reading</span>
                      <CornerDownRight className="w-[12px] h-[12px] group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset Sample Documents: section gap of 28-32px */}
      <div className="mt-[32px] space-y-[12px]">
        <div className="flex items-center justify-between text-[13px] text-[#45544C] dark:text-[#9EA2AE]">
          <span className="font-semibold flex items-center gap-[6px]">
            <Sparkles className="w-[14px] h-[14px] text-[#BA7A48] dark:text-[#EDEDED]" />
            <span>Instant Test Sources (Pre-loaded with exact metrics)</span>
          </span>
          <span className="text-[12px] font-mono text-[#6C7A73] dark:text-[#8E93A0]">1-click analyze</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[12px]">
          {SAMPLE_DOCUMENTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              disabled={isLoading}
              onClick={() => onProcessSample(sample)}
              className="text-left p-[16px] rounded-[14px] border border-[#DCE3DF] dark:border-[#3C4049] bg-white dark:bg-[#2A2D33] hover:border-[#BA7A48]/60 dark:hover:border-[#585D6A] hover:bg-[#FAFBF9] dark:hover:bg-[#31343B] transition-colors shadow-[0_4px_16px_rgba(40,60,50,0.05)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] group cursor-pointer disabled:opacity-50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-[8px]">
                  <span className="text-[11px] font-mono font-medium px-[7px] py-[2px] rounded-[6px] bg-[#E5ECE7] dark:bg-[#363A42] text-[#2C4236] dark:text-[#D0D4DF]">
                    {sample.fileType.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-[#6A7B72] dark:text-[#8E93A0] font-medium">
                    {sample.category.split('&')[0]}
                  </span>
                </div>
                <h3 className="text-[13px] font-serif font-semibold text-[#18221D] dark:text-[#F5F6F8] line-clamp-2 mb-[6px] leading-snug">
                  {sample.title}
                </h3>
                <p className="text-[12px] text-[#52635B] dark:text-[#A0A5B2] line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="mt-[12px] pt-[8px] border-t border-[#EAEFEA] dark:border-[#363A42] flex items-center justify-between text-[12px] font-medium text-[#BA7A48] dark:text-[#D4D8E2]">
                <span>Load source</span>
                <CornerDownRight className="w-[12px] h-[12px] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
