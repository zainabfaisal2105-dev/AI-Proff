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
  Calendar,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

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
    <div className="bg-white dark:bg-[#2A2D33] border border-[#DCE3DF] dark:border-[#373A42] rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden space-y-[20px] p-[20px] sm:p-[28px]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[16px] pb-[20px] border-b border-[#EAEFEA] dark:border-[#373A42]">
        <div className="space-y-[4px]">
          <div className="flex items-center gap-[8px]">
            <span className="font-mono text-[11px] px-[8px] py-[2px] rounded-[6px] bg-[#EFF4F1] dark:bg-[#32363E] text-[#34463C] dark:text-[#D2D5DD] border border-[#D4DFD9] dark:border-[#424650] font-semibold">
              Research Notebook
            </span>
            <span className="font-mono text-[11px] text-[#6A7B72] dark:text-[#8E93A0]">
              {notes.length} Notes · {highlights.length} Highlights
            </span>
          </div>
          <h2 className="font-serif font-bold text-[20px] text-[#18221D] dark:text-[#F5F6F8]">
            Notes & Highlighted Passages
          </h2>
          <p className="text-[11px] font-mono text-[#2E7D32] dark:text-[#4ADE80] flex items-center gap-[5px]">
            <span className="w-[5px] h-[5px] rounded-full bg-[#2E7D32] dark:bg-[#4ADE80]" />
            <span>Persisted automatically — available whenever you return to this document</span>
          </p>
        </div>

        {/* Tab switcher & export */}
        <div className="flex items-center gap-[10px] flex-wrap">
          <div className="flex items-center p-[3px] rounded-[10px] bg-[#EFF4F1] dark:bg-[#222428] border border-[#DCE3DF] dark:border-[#373A42]">
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`px-[12px] py-[6px] rounded-[7px] text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-white dark:bg-[#2A2D33] text-[#18221D] dark:text-[#F5F6F8] shadow-xs font-semibold'
                  : 'text-[#5D6D65] dark:text-[#9EA2AE] hover:text-[#18221D]'
              }`}
            >
              Notes ({notes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('highlights')}
              className={`px-[12px] py-[6px] rounded-[7px] text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === 'highlights'
                  ? 'bg-white dark:bg-[#2A2D33] text-[#18221D] dark:text-[#F5F6F8] shadow-xs font-semibold'
                  : 'text-[#5D6D65] dark:text-[#9EA2AE] hover:text-[#18221D]'
              }`}
            >
              Highlights ({highlights.length})
            </button>
          </div>

          {(notes.length > 0 || highlights.length > 0) && (
            <button
              type="button"
              onClick={exportNotesAsMarkdown}
              className="h-[36px] px-[12px] rounded-[8px] border border-[#CCD7D1] dark:border-[#3C4049] bg-white dark:bg-[#25282E] text-[#283830] dark:text-[#D5D8E0] hover:bg-[#EFF4F1] dark:hover:bg-[#32363E] text-[12px] font-medium transition-colors flex items-center gap-[6px] cursor-pointer"
            >
              <Download className="w-[13px] h-[13px] text-[#BA7A48] dark:text-[#EDEDED]" />
              <span>Export to Markdown</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddingNote(!isAddingNote)}
            className="h-[36px] px-[12px] rounded-[8px] bg-[#BA7A48] hover:bg-[#A96D3C] text-white text-[12px] font-medium transition-colors flex items-center gap-[6px] shadow-xs cursor-pointer"
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
          className="p-[18px] rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#BA7A48]/30 dark:border-[#EDEDED]/20 space-y-[12px] animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-serif font-bold text-[#18221D] dark:text-[#F5F6F8]">
              Create New Personal Note
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNote(false)}
              className="text-[#8E9E95] hover:text-[#C62828] cursor-pointer"
            >
              <X className="w-[14px] h-[14px]" />
            </button>
          </div>

          <div className="flex items-center gap-[8px]">
            <span className="text-[11px] font-mono text-[#6A7B72] dark:text-[#8E93A0]">
              Attach to Section:
            </span>
            <select
              value={newNoteSection}
              onChange={(e) => setNewNoteSection(e.target.value)}
              className="h-[32px] px-[8px] rounded-[6px] bg-white dark:bg-[#1E2024] border border-[#CCD7D1] dark:border-[#3C4049] text-[12px] text-[#18221D] dark:text-[#F5F6F8] focus:outline-hidden"
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
            placeholder="Write your research observations, questions, or notes..."
            rows={3}
            className="w-full p-[12px] rounded-[8px] bg-white dark:bg-[#1E2024] border border-[#CCD7D1] dark:border-[#3C4049] text-[13px] text-[#18221D] dark:text-[#F5F6F8] placeholder-[#8E9E95] focus:outline-hidden focus:border-[#BA7A48]"
          />

          <div className="flex justify-end gap-[8px]">
            <button
              type="button"
              onClick={() => setIsAddingNote(false)}
              className="px-[12px] py-[6px] rounded-[6px] text-[12px] text-[#6A7B72] hover:bg-[#EFF4F1] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newNoteContent.trim()}
              className="px-[14px] py-[6px] rounded-[6px] bg-[#BA7A48] text-white text-[12px] font-medium hover:bg-[#A96D3C] disabled:opacity-40 cursor-pointer"
            >
              Save Note
            </button>
          </div>
        </form>
      )}

      {/* Tab Content: Personal Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-[12px]">
          {notes.length === 0 ? (
            <div className="p-[32px] text-center rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] space-y-[8px]">
              <Bookmark className="w-[24px] h-[24px] text-[#BA7A48] dark:text-[#EDEDED] mx-auto opacity-70" />
              <p className="text-[13px] font-serif text-[#18221D] dark:text-[#F5F6F8]">
                No notes created yet.
              </p>
              <p className="text-[12px] text-[#6A7B72] dark:text-[#8E93A0]">
                Take notes while reading or highlight text in the Reader to attach personal thoughts.
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-[16px] rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] space-y-[10px]"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => onJumpToSection(note.sectionLabel)}
                    className="text-[#BA7A48] dark:text-[#EDEDED] hover:underline flex items-center gap-[4px] font-semibold cursor-pointer"
                  >
                    <span>{note.sectionLabel}</span>
                    <ExternalLink className="w-[10px] h-[10px]" />
                  </button>

                  <div className="flex items-center gap-[10px] text-[#8E9E95]">
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(note)}
                      className="hover:text-[#18221D] dark:hover:text-white cursor-pointer"
                      title="Edit note"
                    >
                      <Edit3 className="w-[13px] h-[13px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.id)}
                      className="hover:text-[#C62828] cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 className="w-[13px] h-[13px]" />
                    </button>
                  </div>
                </div>

                {/* Attached passage citation quote */}
                {note.targetText && (
                  <div className="px-[12px] py-[6px] rounded-[6px] bg-white dark:bg-[#1E2024] border-l-2 border-[#BA7A48] dark:border-[#EDEDED] text-[12px] italic text-[#5D6D65] dark:text-[#9EA2AE]">
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
                      className="w-full p-[10px] rounded-[6px] bg-white dark:bg-[#1E2024] border border-[#BA7A48] text-[13px] text-[#18221D] dark:text-white focus:outline-hidden"
                    />
                    <div className="flex justify-end gap-[6px]">
                      <button
                        type="button"
                        onClick={() => setEditingNoteId(null)}
                        className="px-[10px] py-[4px] rounded-[4px] text-[11px] text-[#6A7B72] hover:bg-[#EFF4F1] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(note.id)}
                        className="px-[12px] py-[4px] rounded-[4px] bg-[#BA7A48] text-white text-[11px] font-medium hover:bg-[#A96D3C] cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-[#283830] dark:text-[#D5D8E0] leading-relaxed whitespace-pre-wrap">
                    {note.noteContent}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content: Saved Highlights */}
      {activeTab === 'highlights' && (
        <div className="space-y-[12px]">
          {highlights.length === 0 ? (
            <div className="p-[32px] text-center rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] space-y-[8px]">
              <Quote className="w-[24px] h-[24px] text-[#BA7A48] dark:text-[#EDEDED] mx-auto opacity-70" />
              <p className="text-[13px] font-serif text-[#18221D] dark:text-[#F5F6F8]">
                No highlighted passages yet.
              </p>
              <p className="text-[12px] text-[#6A7B72] dark:text-[#8E93A0]">
                Select text in the Reader tab and choose 'Note' or 'Explain' to save passages.
              </p>
            </div>
          ) : (
            highlights.map((h) => (
              <div
                key={h.id}
                className="p-[16px] rounded-[12px] bg-[#FAFBF9] dark:bg-[#23252A] border border-[#DCE3DF] dark:border-[#373A42] space-y-[8px]"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => onJumpToSection(h.sectionLabel)}
                    className="text-[#BA7A48] dark:text-[#EDEDED] hover:underline flex items-center gap-[4px] font-semibold cursor-pointer"
                  >
                    <span>{h.sectionLabel}</span>
                    <ExternalLink className="w-[10px] h-[10px]" />
                  </button>

                  <div className="flex items-center gap-[8px] text-[#8E9E95]">
                    <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                    <button
                      type="button"
                      onClick={() => onDeleteHighlight(h.id)}
                      className="hover:text-[#C62828] cursor-pointer"
                    >
                      <Trash2 className="w-[13px] h-[13px]" />
                    </button>
                  </div>
                </div>

                <div className="p-[12px] rounded-[8px] bg-white dark:bg-[#1E2024] border-l-3 border-[#BA7A48] text-[13px] font-serif italic text-[#18221D] dark:text-[#E2E5EC] leading-relaxed">
                  "{h.text}"
                </div>

                {h.note && (
                  <p className="text-[12px] text-[#5D6D65] dark:text-[#9EA2AE] pl-[12px]">
                    Note: {h.note}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
