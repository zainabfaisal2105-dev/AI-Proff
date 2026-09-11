import { SavedDocumentSession, UserNote, UserHighlight } from '../types';

const STORAGE_KEY_SESSIONS = 'doc_reader_sessions_v1';
const STORAGE_KEY_LAST_ACTIVE_ID = 'doc_reader_last_active_id';

/**
 * Get all saved document reading sessions from localStorage.
 */
export function getSavedSessions(): SavedDocumentSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    const list: SavedDocumentSession[] = JSON.parse(raw);
    if (Array.isArray(list)) {
      return list.sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0));
    }
    return [];
  } catch (err) {
    console.error('Failed to load saved sessions from storage:', err);
    return [];
  }
}

/**
 * Save or update a document reading session (including its notes, highlights, and reading progress).
 */
export function saveDocumentSession(session: SavedDocumentSession): void {
  try {
    const existing = getSavedSessions();
    const filtered = existing.filter((s) => s.id !== session.id && s.title !== session.title);

    const updatedSession: SavedDocumentSession = {
      ...session,
      lastOpened: Date.now(),
    };

    // Keep up to 15 most recent sessions to avoid localStorage quota issues
    const newSessions = [updatedSession, ...filtered].slice(0, 15);

    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(newSessions));
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVE_ID, updatedSession.id);
    } catch (quotaError) {
      // If quota exceeded, trim older sessions and retry
      console.warn('LocalStorage quota exceeded, trimming older sessions...');
      const trimmed = [updatedSession, ...filtered.slice(0, 5)];
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(trimmed));
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVE_ID, updatedSession.id);
    }

    // Also persist individual notes specifically keyed for fast retrieval
    localStorage.setItem(`doc_notes_${session.title}`, JSON.stringify(session.notes));
    localStorage.setItem(`doc_highlights_${session.title}`, JSON.stringify(session.highlights));
  } catch (err) {
    console.error('Failed to save document session:', err);
  }
}

/**
 * Get a specific saved session by ID or Title.
 */
export function getSessionById(idOrTitle: string): SavedDocumentSession | null {
  const sessions = getSavedSessions();
  return sessions.find((s) => s.id === idOrTitle || s.title === idOrTitle) || null;
}

/**
 * Delete a saved session and its associated notes from storage.
 */
export function deleteSession(idOrTitle: string): void {
  try {
    const existing = getSavedSessions();
    const toDelete = existing.find((s) => s.id === idOrTitle || s.title === idOrTitle);
    const updated = existing.filter((s) => s.id !== idOrTitle && s.title !== idOrTitle);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));

    if (toDelete) {
      localStorage.removeItem(`doc_notes_${toDelete.title}`);
      localStorage.removeItem(`doc_highlights_${toDelete.title}`);
    }

    const lastActive = localStorage.getItem(STORAGE_KEY_LAST_ACTIVE_ID);
    if (lastActive === idOrTitle) {
      localStorage.removeItem(STORAGE_KEY_LAST_ACTIVE_ID);
    }
  } catch (err) {
    console.error('Failed to delete session:', err);
  }
}

/**
 * Retrieve all notes across all stored documents for aggregated review and search.
 */
export function getAllSavedNotes(): {
  sessionId: string;
  documentTitle: string;
  note: UserNote;
}[] {
  const sessions = getSavedSessions();
  const allNotes: { sessionId: string; documentTitle: string; note: UserNote }[] = [];

  for (const session of sessions) {
    if (Array.isArray(session.notes)) {
      for (const note of session.notes) {
        allNotes.push({
          sessionId: session.id,
          documentTitle: session.title,
          note,
        });
      }
    }
  }

  return allNotes.sort((a, b) => b.note.updatedAt - a.note.updatedAt);
}

/**
 * Get the last active session ID if available.
 */
export function getLastActiveSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_LAST_ACTIVE_ID);
  } catch {
    return null;
  }
}
