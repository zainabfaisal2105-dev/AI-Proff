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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px] bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] max-w-[760px] w-full p-[24px] shadow-[0_16px_48px_rgba(0,0,0,0.15)] space-y-[20px] max-h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-[16px] border-b border-[#EAEFEA] dark:border-[#373A42] shrink-0">
          <div className="flex items-center gap-[10px]">
            <div className="w-[32px] h-[32px] rounded-[10px] bg-[#EFF4F1] dark:bg-[#32363E] text-[#BA7A48] dark:text-[#EDEDED] flex items-center justify-center font-medium">
              <Layers className="w-[16px] h-[16px]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-[17px] text-[#18221D] dark:text-[#F5F6F8]">
                Reading Library & Stored Notes
              </h3>
              <p className="text-[11px] font-mono text-[#6A7B72] dark:text-[#8E93A0]">
                {sessions.length} saved reading sessions · {allNotes.length} notes stored
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-[6px] rounded-[6px] text-[#8E9E95] hover:text-[#18221D] dark:hover:text-white cursor-pointer"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Tab Selection & Global Note Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px] shrink-0">
          <div className="flex items-center p-[3px] rounded-[10px] bg-[#EFF4F1] dark:bg-[#222428] border border-[#DCE3DF] dark:border-[#373A42] self-start">
            <button
              type="button"
              onClick={() => setActiveTab('sessions')}
              className={`px-[12px] py-[6px] rounded-[7px] text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === 'sessions'
                  ? 'bg-white dark:bg-[#2A2D33] text-[#18221D] dark:text-[#F5F6F8] shadow-xs font-semibold'
                  : 'text-[#5D6D65] dark:text-[#9EA2AE] hover:text-[#18221D]'
              }`}
            >
              Saved Documents ({sessions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all_notes')}
              className={`px-[12px] py-[6px] rounded-[7px] text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === 'all_notes'
                  ? 'bg-white dark:bg-[#2A2D33] text-[#18221D] dark:text-[#F5F6F8] shadow-xs font-semibold'
                  : 'text-[#5D6D65] dark:text-[#9EA2AE] hover:text-[#18221D]'
              }`}
            >
              All Notes ({allNotes.length})
            </button>
          </div>

          {allNotes.length > 0 && (
            <button
              type="button"
              onClick={exportAllNotesMarkdown}
              className="h-[34px] px-[12px] rounded-[8px] border border-[#CCD7D1] dark:border-[#3C4049] bg-[#FAFBF9] dark:bg-[#23252A] hover:bg-[#EFF4F1] text-[12px] font-medium text-[#283830] dark:text-[#D5D8E0] transition-colors flex items-center gap-[6px] cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-[13px] h-[13px] text-[#BA7A48] dark:text-[#EDEDED]" />
              <span>Export All Notes (.md)</span>
            </button>
          )}
        </div>

        {/* Tab 1: Saved Documents / Sessions */}
        {activeTab === 'sessions' && (
          <div className="flex-1 overflow-y-auto space-y-[12px] pr-[4px]">
            {sessions.length === 0 ? (
              <div className="py-[48px] text-center space-y-[10px] rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42]">
                <BookOpen className="w-[28px] h-[28px] text-[#BA7A48] dark:text-[#EDEDED] mx-auto opacity-70" />
                <p className="text-[14px] font-serif text-[#18221D] dark:text-[#F5F6F8]">
                  No saved reading sessions yet.
                </p>
                <p className="text-[12px] text-[#6A7B72] dark:text-[#8E93A0] max-w-[360px] mx-auto">
                  When you upload or read documents and take notes, they are automatically saved here so you can return anytime.
                </p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="p-[16px] rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] hover:border-[#BA7A48] dark:hover:border-[#EDEDED] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-[16px] group"
                >
                  <div className="space-y-[4px] min-w-0">
                    <div className="flex items-center gap-[8px] flex-wrap">
                      <span className="font-mono text-[10px] px-[6px] py-[2px] rounded-[4px] bg-white dark:bg-[#1E2024] border border-[#CCD7D1] dark:border-[#3C4049] text-[#34463C] dark:text-[#D2D5DD] uppercase font-semibold">
                        {session.fileType}
                      </span>
                      <span className="text-[11px] font-mono text-[#6A7B72] dark:text-[#8E93A0]">
                        {session.totalWords?.toLocaleString() || 0} words · {session.sectionCount} sections
                      </span>
                      <span className="text-[11px] font-mono text-[#BA7A48] dark:text-[#EDEDED] flex items-center gap-[3px]">
                        <Bookmark className="w-[11px] h-[11px]" />
                        {session.notes?.length || 0} notes
                      </span>
                    </div>

                    <h4 className="font-serif font-semibold text-[15px] text-[#18221D] dark:text-[#F5F6F8] truncate">
                      {session.title}
                    </h4>

                    <p className="text-[11px] font-mono text-[#8E9E95] dark:text-[#7A808C] flex items-center gap-[4px]">
                      <Clock className="w-[11px] h-[11px]" />
                      Last read: {new Date(session.lastOpened).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-[8px] shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onDeleteSession(session.id)}
                      className="p-[8px] rounded-[8px] text-[#8E9E95] hover:text-[#C62828] hover:bg-[#FFEBEE] dark:hover:bg-[#33181C] transition-colors cursor-pointer"
                      title="Delete this saved session"
                    >
                      <Trash2 className="w-[15px] h-[15px]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenSession(session);
                        onClose();
                      }}
                      className="h-[36px] px-[14px] rounded-[8px] bg-[#BA7A48] hover:bg-[#A96D3C] text-white text-[12px] font-medium transition-colors flex items-center gap-[6px] shadow-xs cursor-pointer"
                    >
                      <span>Continue Reading</span>
                      <ArrowRight className="w-[13px] h-[13px]" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: All Notes Across Documents */}
        {activeTab === 'all_notes' && (
          <div className="flex-1 overflow-y-auto space-y-[14px] pr-[4px]">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-[14px] h-[14px] text-[#8E9E95] absolute left-[12px] top-[11px]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all notes, citations, or documents..."
                className="w-full h-[36px] pl-[34px] pr-[12px] rounded-[8px] bg-white dark:bg-[#1E2024] border border-[#CCD7D1] dark:border-[#3C4049] text-[12px] text-[#18221D] dark:text-[#F5F6F8] placeholder-[#8E9E95] focus:outline-hidden focus:border-[#BA7A48]"
              />
            </div>

            {filteredNotes.length === 0 ? (
              <div className="py-[36px] text-center space-y-[8px] rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42]">
                <Bookmark className="w-[24px] h-[24px] text-[#BA7A48] dark:text-[#EDEDED] mx-auto opacity-70" />
                <p className="text-[13px] font-serif text-[#18221D] dark:text-[#F5F6F8]">
                  {searchQuery ? 'No notes matched your query.' : 'No notes recorded across any documents yet.'}
                </p>
              </div>
            ) : (
              filteredNotes.map((item) => {
                const parentSession = sessions.find((s) => s.id === item.sessionId || s.title === item.documentTitle);
                return (
                  <div
                    key={item.note.id}
                    className="p-[14px] rounded-[10px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] space-y-[8px]"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-[6px] truncate">
                        <span className="font-semibold text-[#18221D] dark:text-[#F5F6F8] truncate max-w-[200px]">
                          {item.documentTitle}
                        </span>
                        <span className="text-[#8E9E95]">·</span>
                        <span className="text-[#BA7A48] dark:text-[#EDEDED] font-medium">
                          {item.note.sectionLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-[8px]">
                        <span className="text-[#8E9E95]">
                          {new Date(item.note.updatedAt).toLocaleDateString()}
                        </span>
                        {parentSession && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenSession(parentSession);
                              onClose();
                            }}
                            className="text-[#BA7A48] dark:text-[#EDEDED] hover:underline flex items-center gap-[2px] cursor-pointer"
                          >
                            <span>Open Paper</span>
                            <ExternalLink className="w-[10px] h-[10px]" />
                          </button>
                        )}
                      </div>
                    </div>

                    {item.note.targetText && (
                      <div className="px-[10px] py-[4px] rounded-[6px] bg-white dark:bg-[#1E2024] border-l-2 border-[#BA7A48] text-[12px] italic text-[#5D6D65] dark:text-[#9EA2AE]">
                        "{item.note.targetText}"
                      </div>
                    )}

                    <p className="text-[13px] text-[#283830] dark:text-[#D5D8E0] leading-relaxed whitespace-pre-wrap">
                      {item.note.noteContent}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
