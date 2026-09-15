import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  Link as LinkIcon,
  FileText,
  ArrowRight,
  AlertCircle,
  Sparkles,
  BookOpen,
  FileCheck2,
  Bookmark,
  Clock,
  CornerDownRight,
  Layers,
  CheckCircle2,
  X,
} from 'lucide-react';
import { SAMPLE_DOCUMENTS, SampleDocument } from '../data/sampleDocuments';
import { SavedDocumentSession } from '../types';
import { StatusBead } from './StatusBead';
import { DonutRing } from './DonutRing';

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
    <div className="w-full max-w-[1020px] mx-auto space-y-[32px] pb-[40px]">
      {/* Page Title & Tactile Subtitle */}
      <div className="text-center pt-[28px] sm:pt-[36px] space-y-[12px]">
        <div className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-full bg-[#467E66] dark:bg-[#27292C] text-[12px] font-mono font-medium text-[#F4F9F6] dark:text-[#E8E4DD] border border-[#64A385] dark:border-[#3E4249] mb-[4px]">
          <StatusBead status="ready" size="sm" showPulse />
          <span>AI Research Reading Partner</span>
        </div>
        <h1 className="text-[32px] sm:text-[40px] lg:text-[44px] font-serif font-bold tracking-tight text-[#F5FAF6] dark:text-[#E8E4DD] leading-[1.15]">
          Understand complex papers without losing truth.
        </h1>
        <p className="text-[15px] sm:text-[16px] text-[#D4E8DC] dark:text-[#9A9691] max-w-[68ch] mx-auto leading-relaxed">
          Upload research papers, technical specs, or dense documents. Read with section-by-section guidance, on-demand simplification, and strict source grounding.
        </p>
      </div>

      {/* Main Upload / Ingestion Clay Card */}
      <div className="clay-card p-[24px] sm:p-[32px] relative">
        {/* Status bead in top-left corner */}
        <div className="absolute top-[18px] left-[20px] flex items-center gap-[6px]">
          <StatusBead status="ready" label="Intake Ready" />
        </div>

        {/* Tactile Pill-style Tab Switcher */}
        <div className="flex justify-center pt-[10px] pb-[20px]">
          <div className="clay-well p-[4px] inline-flex items-center gap-[4px] rounded-full">
            <button
              type="button"
              onClick={() => { setActiveTab('upload'); clearError(); }}
              className={`h-[38px] px-[20px] rounded-full text-[13px] font-medium transition-all flex items-center gap-[8px] cursor-pointer ${
                activeTab === 'upload'
                  ? 'clay-btn-primary shadow-xs'
                  : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
              }`}
            >
              <UploadCloud className="w-[15px] h-[15px]" />
              <span>Upload Document</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('url'); clearError(); }}
              className={`h-[38px] px-[20px] rounded-full text-[13px] font-medium transition-all flex items-center gap-[8px] cursor-pointer ${
                activeTab === 'url'
                  ? 'clay-btn-primary shadow-xs'
                  : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
              }`}
            >
              <LinkIcon className="w-[14px] h-[14px]" />
              <span>Web URL</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('paste'); clearError(); }}
              className={`h-[38px] px-[20px] rounded-full text-[13px] font-medium transition-all flex items-center gap-[8px] cursor-pointer ${
                activeTab === 'paste'
                  ? 'clay-btn-primary shadow-xs'
                  : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
              }`}
            >
              <FileText className="w-[14px] h-[14px]" />
              <span>Paste Text</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Drag-and-Drop Clay Dropzone */}
        {activeTab === 'upload' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-[220px] sm:h-[260px] rounded-[20px] border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center p-[20px] ${
              isDragging
                ? 'border-[#D9924D] dark:border-[#E8863C] bg-[#D6E0D6]/80 dark:bg-[#3D4148]'
                : 'border-[#B8C8B8] dark:border-[#4B505B] hover:border-[#D9924D] dark:hover:border-[#E8863C] clay-well'
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

            {/* Circular embossed icon plate */}
            <div className="w-[56px] h-[56px] rounded-full bg-[#E3ECE3] dark:bg-[#35383D] flex items-center justify-center text-[#D9924D] dark:text-[#E8863C] shadow-[0_4px_12px_rgba(70,95,80,0.12),inset_0_1.5px_0_rgba(255,255,255,0.7)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <UploadCloud className="w-[28px] h-[28px]" />
            </div>

            <div className="mt-[14px] text-[16px] sm:text-[17px] font-serif font-bold text-[#3A3A38] dark:text-[#E8E4DD]">
              Drop your PDF, Word doc, or paper here
            </div>

            <p className="mt-[6px] text-[12px] font-mono text-[#8A8880] dark:text-[#9A9691]">
              PDF · DOCX · PPTX · XLSX · CSV · TXT (up to 30MB)
            </p>

            <div className="mt-[18px]">
              <div className="clay-btn-primary h-[44px] px-[24px] text-[13px] font-medium flex items-center gap-[8px]">
                <FileCheck2 className="w-[15px] h-[15px]" />
                <span>Select file from computer</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Web URL Intake */}
        {activeTab === 'url' && (
          <form onSubmit={handleUrlSubmit} className="space-y-[16px] max-w-[720px] mx-auto py-[10px]">
            <div>
              <label className="block text-[13px] font-serif font-semibold text-[#3A3A38] dark:text-[#E8E4DD] mb-[8px]">
                Enter article or paper URL
              </label>
              <div className="flex flex-col sm:flex-row gap-[12px]">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-[16px] flex items-center pointer-events-none text-[#8A8880] dark:text-[#9A9691]">
                    <LinkIcon className="w-[16px] h-[16px]" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://arxiv.org/html/... or any article link"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={isLoading}
                    className="clay-well w-full h-[48px] pl-[44px] pr-[16px] text-[13px] text-[#3A3A38] dark:text-[#E8E4DD] placeholder-[#8A8880] dark:placeholder-[#787D88] focus:outline-hidden focus:ring-2 focus:ring-[#D9924D] dark:focus:ring-[#E8863C]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !urlInput.trim()}
                  className="clay-btn-primary h-[48px] px-[24px] text-[13px] font-medium flex items-center justify-center gap-[8px] shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <span>Fetch & Read</span>
                  <ArrowRight className="w-[15px] h-[15px]" />
                </button>
              </div>
            </div>
            <p className="text-[12px] text-[#8A8880] dark:text-[#9A9691] leading-relaxed">
              Extracts the main body, headers, and tables while discarding promotional clutter to ensure pure citation fidelity.
            </p>
          </form>
        )}

        {/* Tab 3: Paste Text */}
        {activeTab === 'paste' && (
          <form onSubmit={handleTextSubmit} className="space-y-[14px] max-w-[720px] mx-auto py-[6px]">
            <div>
              <label className="block text-[13px] font-serif font-semibold text-[#3A3A38] dark:text-[#E8E4DD] mb-[6px]">
                Document Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. NeurIPS Transformer Benchmark Draft"
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                disabled={isLoading}
                className="clay-well w-full h-[44px] px-[16px] text-[13px] text-[#3A3A38] dark:text-[#E8E4DD] placeholder-[#8A8880] focus:outline-hidden focus:ring-2 focus:ring-[#D9924D] dark:focus:ring-[#E8863C]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-serif font-semibold text-[#3A3A38] dark:text-[#E8E4DD] mb-[6px]">
                Document Body
              </label>
              <textarea
                rows={5}
                placeholder="Paste the dense document text or section excerpt here..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                disabled={isLoading}
                className="clay-well w-full p-[16px] text-[13px] text-[#3A3A38] dark:text-[#E8E4DD] placeholder-[#8A8880] focus:outline-hidden focus:ring-2 focus:ring-[#D9924D] dark:focus:ring-[#E8863C] leading-relaxed resize-y font-mono"
                required
              />
              <div className="flex justify-between items-center text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691] mt-[6px]">
                <span>{pasteText.trim().split(/\s+/).filter(Boolean).length} words</span>
                <span>Minimum 20 characters</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || pasteText.trim().length < 20}
                className="clay-btn-primary h-[46px] px-[24px] text-[13px] font-medium flex items-center justify-center gap-[8px] cursor-pointer disabled:opacity-50"
              >
                <span>Process Passage</span>
                <ArrowRight className="w-[15px] h-[15px]" />
              </button>
            </div>
          </form>
        )}

        {/* Error message alert */}
        {errorMessage && (
          <div className="mt-[20px] p-[14px] rounded-[18px] bg-[#F9E8E4] dark:bg-[#382020] border border-[#E8AEA2] dark:border-[#602E2E] flex items-center justify-between gap-[10px] text-[13px] text-[#B83E28] dark:text-[#FCA5A5]">
            <div className="flex items-start gap-[10px]">
              <AlertCircle className="w-[16px] h-[16px] shrink-0 mt-[2px]" />
              <div className="flex-1 font-medium leading-normal">{errorMessage}</div>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="p-[4px] rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer text-[#B83E28] dark:text-[#FCA5A5] shrink-0"
              aria-label="Dismiss error"
            >
              <X className="w-[14px] h-[14px]" />
            </button>
          </div>
        )}
      </div>

      {/* Previously Uploaded Document Library Grid */}
      {savedSessions.length > 0 && (
        <div className="space-y-[16px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[10px]">
              <StatusBead status="synced" size="sm" />
              <h2 className="font-serif font-bold text-[18px] text-[#F5FAF6] dark:text-[#E8E4DD]">
                Document Library
              </h2>
              <span className="text-[11px] font-mono px-[8px] py-[2px] rounded-full bg-[#467E66] dark:bg-[#27292C] text-[#E2EFE5] dark:text-[#9A9691] border border-[#5E9B7E] dark:border-[#3E4249]">
                {savedSessions.length} stored
              </span>
            </div>
            {onOpenLibrary && (
              <button
                type="button"
                onClick={onOpenLibrary}
                className="text-[12px] font-mono text-[#F7CF9D] dark:text-[#E8863C] hover:underline cursor-pointer flex items-center gap-[4px]"
              >
                <span>View library & notes</span>
                <ArrowRight className="w-[12px] h-[12px]" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
            {savedSessions.slice(0, 6).map((session) => {
              const totalSections = Math.max(1, session.sectionCount || session.extractedDoc?.sections?.length || 1);
              const visitedCount = session.visitedSectionIds?.length || 1;
              const rawPct = Math.round((visitedCount / totalSections) * 100);
              const pctRead = Number.isNaN(rawPct) ? 0 : Math.min(100, Math.max(0, rawPct));

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    clearError();
                    if (onOpenSession) onOpenSession(session);
                  }}
                  className="clay-card clay-card-interactive p-[18px] flex flex-col justify-between gap-[16px] relative group cursor-pointer"
                >
                  {/* Top-left status bead */}
                  <div className="flex items-center justify-between">
                    <StatusBead
                      status={pctRead >= 100 ? "ready" : pctRead > 0 ? "reading" : "grounded"}
                      label={pctRead >= 100 ? "Completed" : `${pctRead}% read`}
                    />
                    <span className="text-[10px] font-mono font-bold uppercase px-[8px] py-[2px] rounded-full clay-well text-[#3A3A38] dark:text-[#E8E4DD]">
                      {session.fileType}
                    </span>
                  </div>

                  {/* Document Cover Thumbnail with warm amber-to-rust treatment */}
                  <div className="h-[90px] w-full rounded-[16px] cover-gradient-warm border border-[#C9D6C9] dark:border-white/5 p-[12px] flex items-center justify-between">
                    <div className="space-y-[4px]">
                      <div className="w-[28px] h-[28px] rounded-full bg-[#E3ECE3] dark:bg-[#35383D]/90 flex items-center justify-center text-[#D9924D] dark:text-[#E8863C] shadow-xs">
                        <BookOpen className="w-[14px] h-[14px]" />
                      </div>
                      <p className="text-[10px] font-mono text-[#8A8880] dark:text-[#9A9691]">
                        {session.totalWords?.toLocaleString() || 0} words · {session.sectionCount} sections
                      </p>
                    </div>

                    {/* Donut progress ring */}
                    <DonutRing progress={pctRead} size={48} strokeWidth={4} showLabel />
                  </div>

                  {/* Document Title & Metadata */}
                  <div className="space-y-[6px]">
                    <h3 className="font-serif font-bold text-[15px] text-[#3A3A38] dark:text-[#E8E4DD] line-clamp-2 leading-snug">
                      {session.title}
                    </h3>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
                      <span className="flex items-center gap-[4px]">
                        <Bookmark className="w-[12px] h-[12px] text-[#7FA398]" />
                        {session.notes?.length || 0} notes
                      </span>
                      <span>{new Date(session.lastOpened).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Open / Resume Button */}
                  {onOpenSession && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearError();
                        onOpenSession(session);
                      }}
                      className="clay-btn-neutral h-[38px] px-[14px] text-[12px] font-medium flex items-center justify-between w-full cursor-pointer group-hover:border-[#D9924D] dark:group-hover:border-[#E8863C] transition-colors"
                    >
                      <span className="font-medium text-[#3A3A38] dark:text-[#E8E4DD]">
                        Resume reading
                      </span>
                      <CornerDownRight className="w-[13px] h-[13px] text-[#D9924D] dark:text-[#E8863C] group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preset Academic & Technical Sample Documents */}
      <div className="space-y-[16px] pt-[8px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <StatusBead status="grounded" size="sm" />
            <h2 className="font-serif font-bold text-[18px] text-[#F5FAF6] dark:text-[#E8E4DD]">
              Instant Research Samples
            </h2>
            <span className="text-[11px] font-mono px-[8px] py-[2px] rounded-full bg-[#467E66] dark:bg-[#27292C] text-[#E2EFE5] dark:text-[#9A9691] border border-[#5E9B7E] dark:border-[#3E4249]">
              Pre-loaded with exact metrics
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#D4E8DC] dark:text-[#9A9691]">
            1-click exploration
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px]">
          {SAMPLE_DOCUMENTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              disabled={isLoading}
              onClick={() => {
                clearError();
                onProcessSample(sample);
              }}
              className="clay-card clay-card-interactive text-left p-[20px] flex flex-col justify-between gap-[16px] cursor-pointer disabled:opacity-50 relative group"
            >
              <div className="space-y-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase px-[8px] py-[2px] rounded-full clay-well text-[#3A3A38] dark:text-[#E8E4DD]">
                    {sample.fileType}
                  </span>
                  <span className="text-[11px] font-mono text-[#7FA398] font-medium">
                    {sample.category.split('&')[0]}
                  </span>
                </div>

                <h3 className="text-[14px] font-serif font-bold text-[#3A3A38] dark:text-[#E8E4DD] line-clamp-2 leading-snug">
                  {sample.title}
                </h3>

                <p className="text-[12px] text-[#8A8880] dark:text-[#9A9691] line-clamp-3 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="pt-[10px] border-t border-[#C9D6C9] dark:border-[#464A52] flex items-center justify-between text-[12px] font-medium text-[#D9924D] dark:text-[#E8863C]">
                <span>Read this paper</span>
                <CornerDownRight className="w-[13px] h-[13px] group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
