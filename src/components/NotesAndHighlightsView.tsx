import React, { useState } from 'react';
import { UserNote, UserHighlight, DocumentSection } from '../types';
import {
  Bookmark,
  Plus,
  Trash2,
  Edit3,
  Download,
  Quote,
  FileText,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';
import { StatusBead } from './StatusBead';

interface NotesAndHighlightsViewProps {
  documentTitle: string;
  sections: DocumentSection[];
  notes: UserNote[];
  highlights: UserHighlight[];
  onAddNote: (note: Omit<UserNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNote: (id: string, newContent: string) => void;
  onDeleteNote: (id: string) => void;
  onDeleteHighlight: (id: string) => void;
  onJumpToSection: (sectionLabel: string) => void;
}

export const NotesAndHighlightsView: React.FC<NotesAndHighlightsViewProps> = ({
  documentTitle,
  sections,
  notes,
  highlights,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onDeleteHighlight,
  onJumpToSection,
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'highlights'>('notes');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteSection, setNewNoteSection] = useState(sections[0]?.label || 'General');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    onAddNote({
      documentId: documentTitle,
      sectionLabel: newNoteSection,
      noteContent: newNoteContent.trim(),
    });
    setNewNoteContent('');
    setIsAddingNote(false);
  };

  const handleStartEdit = (note: UserNote) => {
    setEditingNoteId(note.id);
    setEditingContent(note.noteContent);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingContent.trim()) return;
    onUpdateNote(id, editingContent.trim());
    setEditingNoteId(null);
  };

  const exportNotesAsMarkdown = () => {
    let md = `# Research Notes & Annotations: ${documentTitle}\n\n`;
    md += `Exported on: ${new Date().toLocaleDateString()}\n\n`;

    md += `## Personal Notes (${notes.length})\n\n`;
    notes.forEach((n, i) => {
      md += `### ${i + 1}. Location: ${n.sectionLabel}\n`;
      if (n.targetText) {
        md += `> "${n.targetText}"\n\n`;
      }
      md += `${n.noteContent}\n\n`;
      md += `*Updated: ${new Date(n.updatedAt).toLocaleString()}*\n\n---\n\n`;
    });

    md += `## Saved Highlights (${highlights.length})\n\n`;
    highlights.forEach((h, i) => {
      md += `### ${i + 1}. ${h.sectionLabel}\n`;
      md += `> "${h.text}"\n\n`;
      if (h.note) {
        md += `**Annotation:** ${h.note}\n\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${documentTitle.replace(/[^a-zA-Z0-9]/g, '_')}_notes.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="clay-card p-[20px] sm:p-[28px] space-y-[20px] relative">
      {/* Top Header with Status Bead */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[16px] pb-[18px] border-b border-[#C9D6C9] dark:border-[#464A52]">
        <div className="space-y-[4px]">
          <div className="flex items-center gap-[8px]">
            <StatusBead status="synced" size="sm" showPulse />
            <span className="font-serif font-bold text-[18px] text-[#3A3A38] dark:text-[#E8E4DD]">
              Research Notebook & Annotations
            </span>
          </div>
          <p className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
            {notes.length} stored notes · {highlights.length} passages highlighted
          </p>
        </div>

        {/* Tab switcher & action buttons */}
        <div className="flex items-center gap-[10px] flex-wrap">
          <div className="clay-well p-[3px] rounded-full inline-flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`h-[32px] px-[14px] rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'clay-btn-primary shadow-xs'
                  : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
              }`}
            >
              Notes ({notes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('highlights')}
              className={`h-[32px] px-[14px] rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === 'highlights'
                  ? 'clay-btn-primary shadow-xs'
                  : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
              }`}
            >
              Highlights ({highlights.length})
            </button>
          </div>

          {(notes.length > 0 || highlights.length > 0) && (
            <button
              type="button"
              onClick={exportNotesAsMarkdown}
              className="clay-btn-neutral h-[36px] px-[12px] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer"
            >
              <Download className="w-[13px] h-[13px] text-[#7FA398]" />
              <span>Export</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddingNote(!isAddingNote)}
            className="clay-btn-primary h-[36px] px-[14px] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer"
          >
            <Plus className="w-[14px] h-[14px]" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* New Note Form */}
      {isAddingNote && (
        <form
          onSubmit={handleCreateNote}
          className="clay-card p-[18px] border-2 border-[#D9924D] dark:border-[#E8863C] space-y-[12px] animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-serif font-bold text-[#3A3A38] dark:text-[#E8E4DD]">
              Attach Personal Note
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNote(false)}
              className="w-[24px] h-[24px] rounded-full clay-well flex items-center justify-center text-[#8A8880] hover:text-[#C62828] cursor-pointer"
            >
              <X className="w-[12px] h-[12px]" />
            </button>
          </div>

          <div className="flex items-center gap-[8px]">
            <span className="text-[11px] font-mono text-[#8A8880] dark:text-[#9A9691]">
              Attach to Section:
            </span>
            <select
              value={newNoteSection}
              onChange={(e) => setNewNoteSection(e.target.value)}
              className="clay-well h-[32px] px-[10px] text-[12px] rounded-full text-[#3A3A38] dark:text-[#E8E4DD] focus:outline-hidden"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Record technical insights, hypotheses, or questions..."
            rows={3}
            className="clay-well w-full p-[12px] text-[13px] text-[#3A3A38] dark:text-[#E8E4DD] placeholder-[#8A8880] focus:outline-hidden focus:ring-2 focus:ring-[#D9924D] dark:focus:ring-[#E8863C] rounded-[16px]"
          />

          <div className="flex justify-end gap-[8px]">
            <button
              type="button"
              onClick={() => setIsAddingNote(false)}
              className="clay-btn-neutral h-[34px] px-[14px] text-[12px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newNoteContent.trim()}
              className="clay-btn-primary h-[34px] px-[16px] text-[12px] font-medium cursor-pointer disabled:opacity-40"
            >
              Save Note
            </button>
          </div>
        </form>
      )}

      {/* Tab 1: Sticky Notes Grid */}
      {activeTab === 'notes' && (
        <div className="space-y-[14px]">
          {notes.length === 0 ? (
            <div className="clay-well p-[32px] text-center space-y-[8px] rounded-[20px]">
              <Bookmark className="w-[28px] h-[28px] text-[#D9924D] dark:text-[#E8863C] mx-auto opacity-70" />
              <p className="text-[14px] font-serif font-bold text-[#3A3A38] dark:text-[#E8E4DD]">
                No stored notes yet.
              </p>
              <p className="text-[12px] text-[#8A8880] dark:text-[#9A9691] max-w-[40ch] mx-auto">
                Highlight any passage in the Reader and click "Note" to record thoughts attached to specific citations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="clay-sticky-note p-[18px] flex flex-col justify-between gap-[12px] relative"
                >
                  <div className="space-y-[8px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-[6px]">
                        <StatusBead status="synced" size="sm" />
                        <button
                          type="button"
                          onClick={() => onJumpToSection(note.sectionLabel)}
                          className="text-[11px] font-mono text-[#D9924D] dark:text-[#E8863C] hover:underline flex items-center gap-[4px] font-bold cursor-pointer"
                        >
                          <span>{note.sectionLabel}</span>
                          <ExternalLink className="w-[10px] h-[10px]" />
                        </button>
                      </div>

                      <div className="flex items-center gap-[6px]">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(note)}
                          className="w-[26px] h-[26px] rounded-full clay-well flex items-center justify-center text-[#8A8880] hover:text-[#3A3A38] cursor-pointer"
                          title="Edit note"
                        >
                          <Edit3 className="w-[11px] h-[11px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          className="w-[26px] h-[26px] rounded-full clay-well flex items-center justify-center text-[#8A8880] hover:text-[#C62828] cursor-pointer"
                          title="Delete note"
                        >
                          <Trash2 className="w-[11px] h-[11px]" />
                        </button>
                      </div>
                    </div>

                    {/* Attached passage quote if present */}
                    {note.targetText && (
                      <div className="text-[11px] font-mono italic text-[#8A8880] dark:text-[#9A9691] border-l-2 border-[#7FA398] pl-[8px] line-clamp-2">
                        "{note.targetText}"
                      </div>
                    )}

                    {/* Note Content */}
                    {editingNoteId === note.id ? (
                      <div className="space-y-[8px]">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={3}
                          className="clay-well w-full p-[8px] text-[12px] text-[#3A3A38] dark:text-[#E8E4DD] rounded-[10px]"
                        />
                        <div className="flex justify-end gap-[6px]">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="clay-btn-neutral h-[26px] px-[8px] text-[10px] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(note.id)}
                            className="clay-btn-primary h-[26px] px-[10px] text-[10px] cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[13px] text-[#3A3A38] dark:text-[#E8E4DD] leading-relaxed whitespace-pre-wrap">
                        {note.noteContent}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8A8880] dark:text-[#9A9691] pt-[6px] border-t border-[#C9D6C9]/60 dark:border-[#464A52]/60">
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-[4px] text-[#7FA398]">
                      <Bookmark className="w-[10px] h-[10px]" />
                      <span>Note attached</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Saved Highlights */}
      {activeTab === 'highlights' && (
        <div className="space-y-[12px]">
          {highlights.length === 0 ? (
            <div className="clay-well p-[32px] text-center space-y-[8px] rounded-[20px]">
              <Quote className="w-[28px] h-[28px] text-[#7FA398] mx-auto opacity-70" />
              <p className="text-[14px] font-serif font-bold text-[#3A3A38] dark:text-[#E8E4DD]">
                No highlighted passages yet.
              </p>
              <p className="text-[12px] text-[#8A8880] dark:text-[#9A9691]">
                Select text in the Reader tab to create highlights with translucent washes.
              </p>
            </div>
          ) : (
            highlights.map((h) => (
              <div
                key={h.id}
                className="clay-card p-[16px] space-y-[10px] relative"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-[6px]">
                    <StatusBead status="grounded" size="sm" />
                    <button
                      type="button"
                      onClick={() => onJumpToSection(h.sectionLabel)}
                      className="text-[#D9924D] dark:text-[#E8863C] hover:underline flex items-center gap-[4px] font-bold cursor-pointer"
                    >
                      <span>{h.sectionLabel}</span>
                      <ExternalLink className="w-[10px] h-[10px]" />
                    </button>
                  </div>

                  <div className="flex items-center gap-[8px]">
                    <span className="text-[#8A8880] dark:text-[#9A9691]">
                      {new Date(h.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteHighlight(h.id)}
                      className="w-[24px] h-[24px] rounded-full clay-well flex items-center justify-center text-[#8A8880] hover:text-[#C62828] cursor-pointer"
                      title="Delete highlight"
                    >
                      <Trash2 className="w-[11px] h-[11px]" />
                    </button>
                  </div>
                </div>

                {/* Translucent wash text highlight */}
                <div className="text-[14px] font-serif leading-relaxed text-[#3A3A38] dark:text-[#E8E4DD]">
                  <span className="passage-highlight-light">
                    "{h.text}"
                  </span>
                </div>

                {h.note && (
                  <div className="text-[12px] text-[#8A8880] dark:text-[#9A9691] pt-[4px]">
                    <strong>Note:</strong> {h.note}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
