import React, { useState } from 'react';
import { SavedDocumentSession } from '../types';
import {
  BookOpen,
  Bookmark,
  Calendar,
  Clock,
  Trash2,
  ArrowRight,
  Search,
  Download,
  X,
  FileText,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { getAllSavedNotes } from '../utils/storage';
import { StatusBead } from './StatusBead';
import { DonutRing } from './DonutRing';

interface SavedSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedDocumentSession[];
  onOpenSession: (session: SavedDocumentSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const SavedSessionsModal: React.FC<SavedSessionsModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onOpenSession,
  onDeleteSession,
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'all_notes'>('sessions');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const allNotes = getAllSavedNotes();
  const filteredNotes = allNotes.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.documentTitle.toLowerCase().includes(q) ||
      item.note.noteContent.toLowerCase().includes(q) ||
      item.note.sectionLabel.toLowerCase().includes(q) ||
      (item.note.targetText && item.note.targetText.toLowerCase().includes(q))
    );
  });

  const exportAllNotesMarkdown = () => {
    let md = `# Research Notes Export (All Documents)\n\nExported on: ${new Date().toLocaleDateString()}\n\n`;

    const byDoc: Record<string, typeof allNotes> = {};
    allNotes.forEach((n) => {
      if (!byDoc[n.documentTitle]) byDoc[n.documentTitle] = [];
      byDoc[n.documentTitle].push(n);
    });

    Object.entries(byDoc).forEach(([title, list]) => {
      md += `## Document: ${title}\n\n`;
      list.forEach((item, i) => {
        md += `### ${i + 1}. ${item.note.sectionLabel}\n`;
        if (item.note.targetText) {
          md += `> "${item.note.targetText}"\n\n`;
        }
        md += `${item.note.noteContent}\n\n`;
        md += `*Updated: ${new Date(item.note.updatedAt).toLocaleString()}*\n\n---\n\n`;
      });
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `all_research_notes_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px] bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="clay-card max-w-[780px] w-full p-[24px] sm:p-[28px] space-y-[20px] max-h-[88vh] flex flex-col overflow-hidden relative">
        {/* Top Header with Status Bead */}
        <div className="flex items-center justify-between pb-[16px] border-b border-[#C9D6C9] dark:border-[#464A52] shrink-0">
          <div className="flex items-center gap-[12px]">
            <StatusBead status="synced" size="md" showPulse />
            <div>
              <h3 className="font-serif font-bold text-[18px] text-[#3A3A38] dark:text-[#E8E4DD]">
                Reading Library & Stored Notes
              </h3>
              <p className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
                {sessions.length} saved reading sessions · {allNotes.length} notes stored
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-[32px] h-[32px] rounded-full clay-well flex items-center justify-center text-[#8A8880] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD] cursor-pointer"
          >
            <X className="w-[14px] h-[14px]" />
          </button>
        </div>

        {/* Tab switcher & Search bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px] shrink-0">
          <div className="clay-well p-[3px] rounded-full inline-flex items-center self-start">
            <button
              type="button"
              onClick={() => setActiveTab('sessions')}
              className={`h-[32px] px-[16px] rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === 'sessions'
                  ? 'clay-btn-primary shadow-xs'
                  : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
              }`}
            >
              Document Library ({sessions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all_notes')}
              className={`h-[32px] px-[16px] rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === 'all_notes'
                  ? 'clay-btn-primary shadow-xs'
                  : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
              }`}
            >
              All Notes ({allNotes.length})
            </button>
          </div>

          <div className="flex items-center gap-[8px]">
            {activeTab === 'all_notes' && (
              <div className="relative">
                <Search className="w-[13px] h-[13px] text-[#8A8880] absolute left-[12px] top-[10px]" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="clay-well h-[34px] pl-[32px] pr-[12px] text-[12px] rounded-full text-[#3A3A38] dark:text-[#E8E4DD] placeholder-[#8A8880] focus:outline-hidden"
                />
              </div>
            )}

            {allNotes.length > 0 && (
              <button
                type="button"
                onClick={exportAllNotesMarkdown}
                className="clay-btn-neutral h-[34px] px-[12px] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer"
                title="Export all stored notes"
              >
                <Download className="w-[13px] h-[13px] text-[#7FA398]" />
                <span className="hidden sm:inline">Export Notes</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-[12px] pr-[4px]">
          {activeTab === 'sessions' && (
            <div className="space-y-[12px]">
              {sessions.length === 0 ? (
                <div className="clay-well p-[36px] text-center space-y-[8px] rounded-[20px]">
                  <BookOpen className="w-[28px] h-[28px] text-[#D9924D] dark:text-[#E8863C] mx-auto opacity-70" />
                  <p className="font-serif font-bold text-[14px] text-[#3A3A38] dark:text-[#E8E4DD]">
                    No documents saved yet.
                  </p>
                  <p className="text-[12px] text-[#8A8880] dark:text-[#9A9691]">
                    When you analyze a paper, its sections, notes, and reading progress are saved here automatically.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                  {sessions.map((session) => {
                    const totalSections = Math.max(1, session.sectionCount || session.extractedDoc?.sections?.length || 1);
                    const visitedCount = session.visitedSectionIds?.length || 1;
                    const rawPct = Math.round((visitedCount / totalSections) * 100);
                    const pctRead = Number.isNaN(rawPct) ? 0 : Math.min(100, Math.max(0, rawPct));

                    return (
                      <div
                        key={session.id}
                        className="clay-card p-[16px] flex flex-col justify-between gap-[12px] relative group"
                      >
                        <div className="space-y-[8px]">
                          <div className="flex items-center justify-between">
                            <StatusBead
                              status={pctRead >= 100 ? "ready" : pctRead > 0 ? "reading" : "grounded"}
                              label={`${pctRead}% read`}
                            />
                            <div className="flex items-center gap-[6px]">
                              <span className="text-[10px] font-mono uppercase font-bold px-[8px] py-[2px] rounded-full clay-well text-[#3A3A38] dark:text-[#E8E4DD]">
                                {session.fileType}
                              </span>
                              <button
                                type="button"
                                onClick={() => onDeleteSession(session.id)}
                                className="w-[24px] h-[24px] rounded-full clay-well flex items-center justify-center text-[#8A8880] hover:text-[#C62828] cursor-pointer"
                                title="Delete saved document"
                              >
                                <Trash2 className="w-[11px] h-[11px]" />
                              </button>
                            </div>
                          </div>

                          <h4 className="font-serif font-bold text-[14px] text-[#3A3A38] dark:text-[#E8E4DD] line-clamp-2">
                            {session.title}
                          </h4>

                          <p className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691] flex items-center gap-[6px]">
                            <Clock className="w-[11px] h-[11px]" />
                            <span>{session.totalWords?.toLocaleString() || 0} words · {session.sectionCount} sections</span>
                          </p>
                        </div>

                        <div className="pt-[8px] border-t border-[#C9D6C9] dark:border-[#464A52] flex items-center justify-between">
                          <span className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
                            {new Date(session.lastOpened).toLocaleDateString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onOpenSession(session);
                              onClose();
                            }}
                            className="clay-btn-primary h-[30px] px-[12px] text-[11px] font-medium flex items-center gap-[4px] cursor-pointer"
                          >
                            <span>Resume</span>
                            <ArrowRight className="w-[11px] h-[11px]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'all_notes' && (
            <div className="space-y-[12px]">
              {filteredNotes.length === 0 ? (
                <div className="clay-well p-[36px] text-center space-y-[8px] rounded-[20px]">
                  <Bookmark className="w-[28px] h-[28px] text-[#7FA398] mx-auto opacity-70" />
                  <p className="font-serif font-bold text-[14px] text-[#3A3A38] dark:text-[#E8E4DD]">
                    No research notes found.
                  </p>
                  <p className="text-[12px] text-[#8A8880] dark:text-[#9A9691]">
                    Highlight passages in any document and attach notes to build your research repository.
                  </p>
                </div>
              ) : (
                filteredNotes.map((item) => (
                  <div
                    key={item.note.id}
                    className="clay-sticky-note p-[16px] space-y-[8px]"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-[#D9924D] dark:text-[#E8863C] truncate max-w-[360px]">
                        {item.documentTitle} · {item.note.sectionLabel}
                      </span>
                      <span className="text-[#8A8880] dark:text-[#9A9691]">
                        {new Date(item.note.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {item.note.targetText && (
                      <div className="text-[11px] font-mono italic text-[#8A8880] dark:text-[#9A9691] border-l-2 border-[#7FA398] pl-[8px] line-clamp-2">
                        "{item.note.targetText}"
                      </div>
                    )}

                    <p className="text-[13px] text-[#3A3A38] dark:text-[#E8E4DD] leading-relaxed whitespace-pre-wrap">
                      {item.note.noteContent}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
