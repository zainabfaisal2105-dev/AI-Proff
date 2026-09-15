import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SourceInput } from './components/SourceInput';
import { ProcessingView } from './components/ProcessingView';
import { SummaryView } from './components/SummaryView';
import { CheckerCard } from './components/CheckerCard';
import { SourceDrawer } from './components/SourceDrawer';
import { GroundingModal } from './components/GroundingModal';
import { SideBySideModal } from './components/SideBySideModal';
import { ReadingMap } from './components/ReadingMap';
import { DocumentOverviewCard } from './components/DocumentOverviewCard';
import { GuidedReaderView } from './components/GuidedReaderView';
import { FullDocumentReader } from './components/FullDocumentReader';
import { DocumentChatView } from './components/DocumentChatView';
import { NotesAndHighlightsView } from './components/NotesAndHighlightsView';
import { PassageActionModal } from './components/PassageActionModal';
import { SavedSessionsModal } from './components/SavedSessionsModal';
import { StatusBead } from './components/StatusBead';
import {
  ExtractedDocument,
  SummaryResult,
  VerificationResult,
  ProcessingStage,
  VerificationIssue,
  DocumentOverview,
  ChatMessage,
  UserNote,
  UserHighlight,
  ReadingMode,
  SavedDocumentSession,
} from './types';
import {
  getSavedSessions,
  saveDocumentSession,
  deleteSession,
} from './utils/storage';
import { SampleDocument, SAMPLE_DOCUMENTS } from './data/sampleDocuments';
import { extractTextClientSide, generateClientSummaryFallback, generateDefaultOverview } from './utils/textExtractor';
import {
  Compass,
  BookOpen,
  FileText,
  MessageSquareText,
  ListFilter,
  Bookmark,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Theme state persisted in localStorage and initialized on documentElement
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('doc_summarizer_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('doc_summarizer_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('doc_summarizer_theme', 'light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [darkMode]);

  // Main application states
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [currentFileTitle, setCurrentFileTitle] = useState<string>('');
  const [extractedDoc, setExtractedDoc] = useState<ExtractedDocument | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [overview, setOverview] = useState<DocumentOverview | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reading Companion Modes & Section Tracking
  const [readingMode, setReadingMode] = useState<ReadingMode>('overview');
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [visitedSectionIds, setVisitedSectionIds] = useState<Set<string>>(new Set());

  // Saved Reading Sessions Library & Storage
  const [savedSessions, setSavedSessions] = useState<SavedDocumentSession[]>(() => getSavedSessions());
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState<boolean>(false);

  // Grounded Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [attachedChatPassage, setAttachedChatPassage] = useState<{ text: string; sectionRef: string } | null>(null);

  // Notes & Highlights State (Persisted per document)
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [userHighlights, setUserHighlights] = useState<UserHighlight[]>([]);

  // Passage Action Modal State (Explain / Simplify / Note)
  const [passageModal, setPassageModal] = useState<{
    isOpen: boolean;
    passage: string;
    action: 'explain' | 'simplify' | 'note';
    sectionContext: string;
  }>({
    isOpen: false,
    passage: '',
    action: 'explain',
    sectionContext: '',
  });

  // Drawer and Modal states
  const [isSourceDrawerOpen, setIsSourceDrawerOpen] = useState<boolean>(false);
  const [targetSourceSection, setTargetSourceSection] = useState<string | null>(null);
  const [isGroundingModalOpen, setIsGroundingModalOpen] = useState<boolean>(false);
  const [isSideBySideOpen, setIsSideBySideOpen] = useState<boolean>(false);

  // Load persisted notes and highlights when document changes
  useEffect(() => {
    if (!extractedDoc) {
      setUserNotes([]);
      setUserHighlights([]);
      setChatHistory([]);
      return;
    }

    try {
      const savedNotes = localStorage.getItem(`doc_notes_${extractedDoc.title}`);
      if (savedNotes) {
        setUserNotes(JSON.parse(savedNotes));
      }
      const savedHighlights = localStorage.getItem(`doc_highlights_${extractedDoc.title}`);
      if (savedHighlights) {
        setUserHighlights(JSON.parse(savedHighlights));
      }
    } catch (e) {
      console.error('Error loading notes from localStorage:', e);
    }
  }, [extractedDoc?.title]);

  // Sync document session to persistent storage
  const syncCurrentSession = (
    notesToSave?: UserNote[],
    highlightsToSave?: UserHighlight[],
    chatToSave?: ChatMessage[],
    activeSec?: string,
    mode?: ReadingMode,
    verData?: VerificationResult
  ) => {
    if (!extractedDoc) return;
    const session: SavedDocumentSession = {
      id: extractedDoc.title,
      title: extractedDoc.title,
      fileType: extractedDoc.fileType,
      lastOpened: Date.now(),
      totalWords: extractedDoc.totalWords,
      sectionCount: extractedDoc.sections.length,
      activeSectionId: activeSec || activeSectionId,
      visitedSectionIds: Array.from(visitedSectionIds),
      readingMode: mode || readingMode,
      extractedDoc,
      overview,
      summary,
      verification: verData !== undefined ? verData : verification,
      chatHistory: chatToSave || chatHistory,
      notes: notesToSave || userNotes,
      highlights: highlightsToSave || userHighlights,
    };
    saveDocumentSession(session);
    setSavedSessions(getSavedSessions());
  };

  // Save notes to state and localStorage
  const saveNotes = (updatedNotes: UserNote[]) => {
    setUserNotes(updatedNotes);
    syncCurrentSession(updatedNotes, undefined, undefined, undefined, undefined);
  };

  // Save highlights to state and localStorage
  const saveHighlights = (updatedHighlights: UserHighlight[]) => {
    setUserHighlights(updatedHighlights);
    syncCurrentSession(undefined, updatedHighlights, undefined, undefined, undefined);
  };

  const handleOpenSource = (sectionLabel?: string) => {
    setTargetSourceSection(sectionLabel || null);
    setIsSourceDrawerOpen(true);
  };

  const handleSelectSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setVisitedSectionIds((prev) => new Set([...prev, sectionId]));
    if (readingMode === 'overview') {
      setReadingMode('guided');
      syncCurrentSession(undefined, undefined, undefined, sectionId, 'guided');
    } else {
      syncCurrentSession(undefined, undefined, undefined, sectionId, undefined);
    }
  };

  // Open a previously saved reading session with all its notes and progress
  const handleOpenSession = async (session: SavedDocumentSession) => {
    setErrorMessage(null);

    // Validate and safely restore document structure
    let doc = session.extractedDoc;
    if (!doc || !Array.isArray(doc.sections) || doc.sections.length === 0) {
      const sampleMatch = SAMPLE_DOCUMENTS.find(
        (s) => s.title.toLowerCase().trim() === (session.title || '').toLowerCase().trim()
      );
      if (sampleMatch) {
        doc = extractTextClientSide(sampleMatch.content, sampleMatch.title);
      } else {
        doc = {
          title: session.title || 'Document',
          fileType: session.fileType || 'txt',
          sections: [
            {
              id: 'sec-1',
              label: 'Section 1',
              content: 'Document content preserved from saved session.',
              wordCount: session.totalWords || 100,
            },
          ],
          fullText: 'Document content preserved from saved session.',
          totalWords: session.totalWords || 100,
          totalCharacters: 500,
        };
      }
    }

    setExtractedDoc(doc);
    setSummary(session.summary || null);
    setOverview(session.overview || null);
    setVerification(session.verification || null);
    setCurrentFileTitle(session.title || doc.title);
    setUserNotes(session.notes || []);
    setUserHighlights(session.highlights || []);
    setChatHistory(session.chatHistory || []);
    const firstSectionId = doc.sections[0]?.id || 'sec-1';
    setActiveSectionId(session.activeSectionId || firstSectionId);
    setVisitedSectionIds(new Set(session.visitedSectionIds || [firstSectionId]));
    setReadingMode(session.readingMode || 'overview');

    // If summary or overview is missing from this session, automatically regenerate it!
    if (!session.summary || !session.overview) {
      await runSummarizeAndVerify(doc);
      return;
    }

    setStage('complete');

    // Update last opened in storage
    saveDocumentSession({ ...session, extractedDoc: doc, lastOpened: Date.now() });
    setSavedSessions(getSavedSessions());
  };

  // Delete a saved session
  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    setSavedSessions(getSavedSessions());
  };

  // Execute pipeline from extracted document
  const runSummarizeAndVerify = async (doc: ExtractedDocument) => {
    try {
      setStage('summarizing');
      setActiveSectionId(doc.sections[0]?.id || '');
      setVisitedSectionIds(new Set([doc.sections[0]?.id || '']));

      // 1. Fetch summary from server or fallback seamlessly to client-side generator
      let summaryData: SummaryResult;
      try {
        const sumRes = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: doc.title,
            fileType: doc.fileType,
            sections: doc.sections,
          }),
        });

        if (sumRes.ok) {
          summaryData = await sumRes.json();
        } else {
          console.warn('Summarize API returned non-OK status. Using high-fidelity client generator.');
          summaryData = generateClientSummaryFallback(doc);
        }
      } catch (sumErr) {
        console.warn('Network error reaching summarize API. Using high-fidelity client generator:', sumErr);
        summaryData = generateClientSummaryFallback(doc);
      }

      setSummary(summaryData);

      // 2. Fetch overview from server or generate default from summary
      let resolvedOverview: DocumentOverview;
      try {
        const overviewRes = await fetch('/api/overview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: doc.title,
            fileType: doc.fileType,
            sections: doc.sections,
          }),
        });

        if (overviewRes.ok) {
          resolvedOverview = await overviewRes.json();
        } else {
          resolvedOverview = generateDefaultOverview(doc, summaryData);
        }
      } catch {
        resolvedOverview = generateDefaultOverview(doc, summaryData);
      }

      setOverview(resolvedOverview);

      // Save initial session to persistent storage immediately
      const initialSession: SavedDocumentSession = {
        id: doc.title,
        title: doc.title,
        fileType: doc.fileType,
        lastOpened: Date.now(),
        totalWords: doc.totalWords,
        sectionCount: doc.sections.length,
        activeSectionId: doc.sections[0]?.id || '',
        visitedSectionIds: [doc.sections[0]?.id || ''],
        readingMode: 'overview',
        extractedDoc: doc,
        overview: resolvedOverview,
        summary: summaryData,
        verification: null,
        chatHistory: [],
        notes: [],
        highlights: [],
      };
      saveDocumentSession(initialSession);
      setSavedSessions(getSavedSessions());

      // Transition directly to reading companion complete state
      setReadingMode('overview');
      setStage('complete');

      // 3. Run independent Summary Checker in background
      setIsVerifying(true);
      fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: doc.sections,
          summary: summaryData,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((verData) => {
          if (verData) {
            setVerification(verData);
            saveDocumentSession({
              ...initialSession,
              verification: verData,
            });
            setSavedSessions(getSavedSessions());
          }
        })
        .catch((err) => console.warn('Background verify skipped:', err))
        .finally(() => setIsVerifying(false));

    } catch (err: any) {
      console.error('Pipeline error:', err);
      // Fallback gracefully so user can continue reading without obstruction
      const fallbackSummary = generateClientSummaryFallback(doc);
      const fallbackOverview = generateDefaultOverview(doc, fallbackSummary);
      setSummary(fallbackSummary);
      setOverview(fallbackOverview);
      setReadingMode('overview');
      setStage('complete');
    } finally {
      setIsVerifying(false);
    }
  };

  // Process uploaded file
  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);
    setCurrentFileTitle(file.name);
    setStage('reading');

    try {
      const formData = new FormData();
      formData.append('file', file);

      setStage('extracting');
      const extractRes = await fetch('/api/extract-file', {
        method: 'POST',
        body: formData,
      });

      if (!extractRes.ok) {
        const errData = await extractRes.json().catch(() => ({}));
        // If server failed, attempt client-side reading for text/markdown/csv/html
        try {
          const clientText = await file.text();
          if (clientText && clientText.trim().length > 10) {
            const clientDoc = extractTextClientSide(clientText, file.name.replace(/\.[^/.]+$/, ''));
            setExtractedDoc(clientDoc);
            setStage('organizing');
            await runSummarizeAndVerify(clientDoc);
            return;
          }
        } catch {}
        throw new Error(errData.error || "I couldn't extract reliable text from this document.");
      }

      const doc: ExtractedDocument = await extractRes.json();
      setExtractedDoc(doc);
      setStage('organizing');

      await runSummarizeAndVerify(doc);
    } catch (err: any) {
      console.error('File process error:', err);
      // Secondary fallback: check if client can read text directly
      try {
        const clientText = await file.text();
        if (clientText && clientText.trim().length > 10) {
          const clientDoc = extractTextClientSide(clientText, file.name.replace(/\.[^/.]+$/, ''));
          setExtractedDoc(clientDoc);
          setStage('organizing');
          await runSummarizeAndVerify(clientDoc);
          return;
        }
      } catch {}

      setErrorMessage(err.message || 'Failed to process file.');
      setStage('idle');
    }
  };

  // Process Web URL
  const handleProcessUrl = async (url: string) => {
    setErrorMessage(null);
    setCurrentFileTitle(url);
    setStage('reading');

    try {
      setStage('extracting');
      const extractRes = await fetch('/api/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!extractRes.ok) {
        const errData = await extractRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Unable to access this source. Please upload the document or paste its contents instead.');
      }

      const doc: ExtractedDocument = await extractRes.json();
      setExtractedDoc(doc);
      setStage('organizing');

      await runSummarizeAndVerify(doc);
    } catch (err: any) {
      console.error('URL process error:', err);
      setErrorMessage(err.message || 'Unable to access this source. Please upload the document or paste its contents instead.');
      setStage('idle');
    }
  };

  // Process Raw Pasted Text
  const handleProcessText = async (text: string, title?: string) => {
    setErrorMessage(null);
    const docTitle = title || 'Pasted Document';
    setCurrentFileTitle(docTitle);
    setStage('reading');

    try {
      setStage('organizing');
      let doc: ExtractedDocument;
      try {
        const extractRes = await fetch('/api/extract-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, title: docTitle }),
        });

        if (extractRes.ok) {
          doc = await extractRes.json();
        } else {
          doc = extractTextClientSide(text, docTitle);
        }
      } catch {
        doc = extractTextClientSide(text, docTitle);
      }

      setExtractedDoc(doc);
      await runSummarizeAndVerify(doc);
    } catch (err: any) {
      console.error('Text process error:', err);
      setErrorMessage(err.message || 'Failed to process text.');
      setStage('idle');
    }
  };

  // Process Sample Document
  const handleProcessSample = async (sample: SampleDocument) => {
    setErrorMessage(null);

    // 1. If this sample was already stored/opened previously, resume it directly!
    const existing = savedSessions.find(
      (s) =>
        (s.title && sample.title && s.title.toLowerCase().trim() === sample.title.toLowerCase().trim()) ||
        s.id === sample.id
    );

    if (existing && existing.summary && existing.extractedDoc?.sections?.length) {
      await handleOpenSession(existing);
      return;
    }

    // 2. Otherwise process instantly via client-side text extractor
    setCurrentFileTitle(sample.title);
    setStage('reading');

    try {
      setStage('organizing');
      const doc = extractTextClientSide(sample.content, sample.title);
      setExtractedDoc(doc);
      await runSummarizeAndVerify(doc);
    } catch (err: any) {
      console.error('Sample process error:', err);
      setErrorMessage(err.message || 'Failed to process sample document.');
      setStage('idle');
    }
  };

  // Chat message sending handler
  const handleSendMessage = async (
    question: string,
    attachedPassage?: { text: string; sectionRef: string }
  ) => {
    if (!extractedDoc) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      timestamp: Date.now(),
      content: question,
      attachedPassage,
    };

    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          attachedPassage,
          sections: extractedDoc.sections,
          documentTitle: extractedDoc.title,
          history: updatedHistory.map((m) => ({ sender: m.sender, content: m.content })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          timestamp: Date.now(),
          content: data.answer,
          answerability: data.answerability,
          citation: data.citation,
        };
        setChatHistory([...updatedHistory, assistantMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          timestamp: Date.now(),
          content: 'I encountered an error retrieving grounded information for this question.',
          answerability: 'not_supported',
        };
        setChatHistory([...updatedHistory, errorMsg]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Text selection handler (Explain / Simplify / Ask / Note)
  const handlePassageAction = (
    passage: string,
    action: 'explain' | 'simplify' | 'ask' | 'note',
    sectionLabel: string
  ) => {
    if (action === 'ask') {
      setAttachedChatPassage({ text: passage, sectionRef: sectionLabel });
      setReadingMode('chat');
      return;
    }

    setPassageModal({
      isOpen: true,
      passage,
      action,
      sectionContext: sectionLabel,
    });
  };

  // Save note on passage from modal
  const handleSavePassageNote = (passage: string, noteContent: string, sectionContext: string) => {
    const newNote: UserNote = {
      id: `note_${Date.now()}`,
      documentId: extractedDoc?.title || 'Doc',
      sectionLabel: sectionContext,
      targetText: passage,
      noteContent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveNotes([newNote, ...userNotes]);

    // Also add to highlights
    const newHighlight: UserHighlight = {
      id: `hl_${Date.now()}`,
      documentId: extractedDoc?.title || 'Doc',
      sectionLabel: sectionContext,
      text: passage,
      note: noteContent,
      createdAt: Date.now(),
    };
    saveHighlights([newHighlight, ...userHighlights]);
  };

  // Direct note management
  const handleAddNote = (note: Omit<UserNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: UserNote = {
      ...note,
      id: `note_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveNotes([newNote, ...userNotes]);
  };

  const handleUpdateNote = (id: string, newContent: string) => {
    const updated = userNotes.map((n) =>
      n.id === id ? { ...n, noteContent: newContent, updatedAt: Date.now() } : n
    );
    saveNotes(updated);
  };

  const handleDeleteNote = (id: string) => {
    saveNotes(userNotes.filter((n) => n.id !== id));
  };

  const handleDeleteHighlight = (id: string) => {
    saveHighlights(userHighlights.filter((h) => h.id !== id));
  };

  // Re-run Verification manually
  const handleReVerify = async () => {
    if (!extractedDoc || !summary) return;
    try {
      setIsVerifying(true);
      const verRes = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: extractedDoc.sections,
          summary,
        }),
      });
      if (verRes.ok) {
        const verData: VerificationResult = await verRes.json();
        setVerification(verData);
      }
    } catch (err) {
      console.error('Re-verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Fix Flagged Discrepancy / Issue
  const handleFixIssue = async (issue: VerificationIssue) => {
    if (!extractedDoc || !summary) return;

    const targetSection = summary.detailedSections.find(
      (s) => s.sectionTitle.toLowerCase() === issue.affectedSectionTitle?.toLowerCase()
    ) || summary.detailedSections[0];

    try {
      const res = await fetch('/api/fix-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSections: extractedDoc.sections,
          sectionTitle: targetSection?.sectionTitle || issue.affectedSectionTitle,
          currentContent: targetSection?.content || summary.overview,
          issue,
        }),
      });

      if (res.ok) {
        const { fixedContent } = await res.json();
        const updatedSections = summary.detailedSections.map((s) =>
          s.sectionTitle === targetSection?.sectionTitle ? { ...s, content: fixedContent } : s
        );

        const updatedSummary: SummaryResult = {
          ...summary,
          detailedSections: updatedSections,
        };

        setSummary(updatedSummary);

        if (verification) {
          const remainingIssues = verification.issues.filter((i) => i.id !== issue.id);
          const newScore = Math.min(100, verification.overallScore + 4);
          setVerification({
            ...verification,
            overallScore: newScore,
            scoreLabel: newScore >= 90 ? 'Highly faithful' : 'Substantially faithful',
            issues: remainingIssues,
          });
        }
      }
    } catch (err) {
      console.error('Fix issue error:', err);
    }
  };

  // Regenerate Summary
  const handleRegenerate = async () => {
    if (extractedDoc) {
      await runSummarizeAndVerify(extractedDoc);
    }
  };

  // Reset to input state
  const handleReset = () => {
    setStage('idle');
    setExtractedDoc(null);
    setSummary(null);
    setOverview(null);
    setVerification(null);
    setErrorMessage(null);
    setCurrentFileTitle('');
    setIsSideBySideOpen(false);
    setChatHistory([]);
    setAttachedChatPassage(null);
    setReadingMode('overview');
  };

  return (
    <div className="w-screen min-h-screen overflow-x-hidden bg-[#5B9A7D] dark:bg-[#2A2C2F] text-[#F4F8F5] dark:text-[#E8E4DD] flex flex-col font-sans transition-colors duration-200 selection:bg-[#D9924D] selection:text-white dark:selection:bg-[#E8863C] dark:selection:text-white">
      {/* Top Navigation */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenGroundingInfo={() => setIsGroundingModalOpen(true)}
        hasDocument={!!(summary && extractedDoc)}
        onOpenSideBySide={() => setIsSideBySideOpen(true)}
        onOpenSource={() => handleOpenSource()}
        onOpenLibrary={() => setIsLibraryModalOpen(true)}
        savedSessionsCount={savedSessions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-[16px] md:px-[28px] lg:px-[40px] py-[20px] sm:py-[28px] lg:py-[32px]">
        {/* State 1: Input / Idle */}
        {stage === 'idle' && (
          <SourceInput
            onProcessFile={handleProcessFile}
            onProcessUrl={handleProcessUrl}
            onProcessText={handleProcessText}
            onProcessSample={handleProcessSample}
            isLoading={false}
            errorMessage={errorMessage}
            clearError={() => setErrorMessage(null)}
            savedSessions={savedSessions}
            onOpenSession={handleOpenSession}
            onOpenLibrary={() => setIsLibraryModalOpen(true)}
          />
        )}

        {/* State 2: Processing Pipeline */}
        {stage !== 'idle' && stage !== 'complete' && (
          <ProcessingView stage={stage} fileName={currentFileTitle} />
        )}

        {/* State 3: AI Research Reading Companion Active Environment */}
        {stage === 'complete' && extractedDoc && summary && (
          <div className="space-y-[20px]">
            {/* Reading Companion Navigation Mode Bar */}
            <div className="clay-card p-[6px] sm:p-[8px] flex items-center justify-between gap-[8px] flex-wrap relative">
              <div className="clay-well p-[3px] rounded-full flex items-center gap-[3px] flex-wrap">
                <button
                  type="button"
                  onClick={() => setReadingMode('overview')}
                  className={`h-[34px] px-[14px] rounded-full text-[12px] font-medium transition-all flex items-center gap-[6px] cursor-pointer ${
                    readingMode === 'overview'
                      ? 'clay-btn-primary shadow-xs'
                      : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
                  }`}
                >
                  <Compass className="w-[14px] h-[14px]" />
                  <span>Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReadingMode('guided')}
                  className={`h-[34px] px-[14px] rounded-full text-[12px] font-medium transition-all flex items-center gap-[6px] cursor-pointer ${
                    readingMode === 'guided'
                      ? 'clay-btn-primary shadow-xs'
                      : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
                  }`}
                >
                  <BookOpen className="w-[14px] h-[14px]" />
                  <span>Guided</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReadingMode('reader')}
                  className={`h-[34px] px-[14px] rounded-full text-[12px] font-medium transition-all flex items-center gap-[6px] cursor-pointer ${
                    readingMode === 'reader'
                      ? 'clay-btn-primary shadow-xs'
                      : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
                  }`}
                >
                  <FileText className="w-[14px] h-[14px]" />
                  <span>Reader</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReadingMode('chat')}
                  className={`h-[34px] px-[14px] rounded-full text-[12px] font-medium transition-all flex items-center gap-[6px] cursor-pointer ${
                    readingMode === 'chat'
                      ? 'clay-btn-primary shadow-xs'
                      : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
                  }`}
                >
                  <MessageSquareText className="w-[14px] h-[14px]" />
                  <span>Ask Paper</span>
                  {chatHistory.length > 0 && (
                    <span className="w-[18px] h-[18px] rounded-full bg-[#18221D]/20 text-[10px] flex items-center justify-center font-mono font-bold">
                      {chatHistory.filter((m) => m.sender === 'user').length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setReadingMode('summary')}
                  className={`h-[34px] px-[14px] rounded-full text-[12px] font-medium transition-all flex items-center gap-[6px] cursor-pointer ${
                    readingMode === 'summary'
                      ? 'clay-btn-primary shadow-xs'
                      : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
                  }`}
                >
                  <ListFilter className="w-[14px] h-[14px]" />
                  <span>Summary</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReadingMode('notes')}
                  className={`h-[34px] px-[14px] rounded-full text-[12px] font-medium transition-all flex items-center gap-[6px] cursor-pointer ${
                    readingMode === 'notes'
                      ? 'clay-btn-primary shadow-xs'
                      : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
                  }`}
                >
                  <Bookmark className="w-[14px] h-[14px]" />
                  <span>Notes ({userNotes.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReadingMode('verification')}
                  className={`h-[34px] px-[14px] rounded-full text-[12px] font-medium transition-all flex items-center gap-[6px] cursor-pointer ${
                    readingMode === 'verification'
                      ? 'clay-btn-primary shadow-xs'
                      : 'text-[#8A8880] dark:text-[#9A9691] hover:text-[#3A3A38] dark:hover:text-[#E8E4DD]'
                  }`}
                >
                  <ShieldCheck className="w-[14px] h-[14px]" />
                  <span>Audit</span>
                  {verification && (
                    <span className="font-mono text-[11px] opacity-80">
                      {verification.overallScore}%
                    </span>
                  )}
                </button>
              </div>

              {/* Reset to upload new paper */}
              <button
                type="button"
                onClick={handleReset}
                className="clay-btn-neutral h-[34px] px-[12px] text-[12px] flex items-center gap-[6px] cursor-pointer"
                title="Open a different document"
              >
                <RotateCcw className="w-[13px] h-[13px]" />
                <span className="hidden sm:inline">New Document</span>
              </button>
            </div>

            {/* Layout Grid: Sidebar Reading Map + Dynamic Active Mode */}
            <div className="grid grid-cols-1 min-[960px]:grid-cols-12 gap-[24px] items-start">
              {/* Left Sidebar: Reading Map (always visible on desktop) */}
              <div className="min-[960px]:col-span-4 w-full space-y-[16px] min-[960px]:sticky min-[960px]:top-[84px]">
                <ReadingMap
                  sections={extractedDoc.sections}
                  activeSectionId={activeSectionId}
                  onSelectSection={handleSelectSection}
                  visitedSectionIds={visitedSectionIds}
                />

                {/* Quick Side-by-Side Launcher */}
                <div className="clay-card p-[16px] flex items-center justify-between text-[12px]">
                  <span className="text-[#8A8880] dark:text-[#9A9691] font-medium">
                    Dual Verification:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSideBySideOpen(true)}
                    className="font-mono text-[#D9924D] dark:text-[#E8863C] hover:underline font-bold cursor-pointer"
                  >
                    Open Side-by-Side →
                  </button>
                </div>
              </div>

              {/* Right Area: Dynamic View according to Reading Mode */}
              <div className="min-[960px]:col-span-8 w-full min-w-0">
                {/* 1. Overview Mode */}
                {readingMode === 'overview' && overview && (
                  <DocumentOverviewCard
                    overview={overview}
                    document={extractedDoc}
                    onStartGuidedReading={() => setReadingMode('guided')}
                    onOpenChat={() => setReadingMode('chat')}
                    onOpenSummary={() => setReadingMode('summary')}
                    onSelectSection={handleSelectSection}
                  />
                )}

                {/* 2. Guided Reading Mode */}
                {readingMode === 'guided' && (
                  <GuidedReaderView
                    sections={extractedDoc.sections}
                    activeSectionId={activeSectionId}
                    onSelectSection={handleSelectSection}
                    documentTitle={extractedDoc.title}
                    onOpenSourceModal={handleOpenSource}
                    onOpenPassageAction={handlePassageAction}
                  />
                )}

                {/* 3. Document Text Reader Mode */}
                {readingMode === 'reader' && (
                  <FullDocumentReader
                    sections={extractedDoc.sections}
                    activeSectionId={activeSectionId}
                    onSelectSection={handleSelectSection}
                    highlights={userHighlights}
                    onPassageAction={handlePassageAction}
                  />
                )}

                {/* 4. Grounded Chat ("Ask this Document") */}
                {readingMode === 'chat' && (
                  <DocumentChatView
                    sections={extractedDoc.sections}
                    documentTitle={extractedDoc.title}
                    chatHistory={chatHistory}
                    onSendMessage={handleSendMessage}
                    onClearChat={() => setChatHistory([])}
                    attachedPassage={attachedChatPassage}
                    onClearAttachedPassage={() => setAttachedChatPassage(null)}
                    onJumpToSource={(label) => handleOpenSource(label)}
                    isLoading={isChatLoading}
                  />
                )}

                {/* 5. Summary View */}
                {readingMode === 'summary' && (
                  <SummaryView
                    summary={summary}
                    document={extractedDoc}
                    onOpenSource={handleOpenSource}
                    onRegenerate={handleRegenerate}
                    onReset={handleReset}
                    onOpenSideBySide={() => setIsSideBySideOpen(true)}
                  />
                )}

                {/* 6. Notes & Highlights */}
                {readingMode === 'notes' && (
                  <NotesAndHighlightsView
                    documentTitle={extractedDoc.title}
                    sections={extractedDoc.sections}
                    notes={userNotes}
                    highlights={userHighlights}
                    onAddNote={handleAddNote}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                    onDeleteHighlight={handleDeleteHighlight}
                    onJumpToSection={(label) => {
                      const targetSec = extractedDoc.sections.find((s) => s.label === label);
                      if (targetSec) {
                        handleSelectSection(targetSec.id);
                        setReadingMode('reader');
                      }
                    }}
                  />
                )}

                {/* 7. Verification Audit Card */}
                {readingMode === 'verification' && (
                  <div className="space-y-[20px]">
                    <div className="clay-card p-[20px] sm:p-[24px] space-y-[8px]">
                      <div className="flex items-center gap-[8px]">
                        <StatusBead status="grounded" size="sm" showPulse />
                        <h2 className="font-serif font-bold text-[18px] text-[#3A3A38] dark:text-[#E8E4DD]">
                          Independent Verification & Source Audit
                        </h2>
                      </div>
                      <p className="text-[13px] text-[#8A8880] dark:text-[#9A9691] leading-relaxed">
                        Every sentence, claim, and metric is audited against original source text to prevent extrapolation, hallucination, or numerical distortion.
                      </p>
                    </div>

                    <CheckerCard
                      verification={verification}
                      isVerifying={isVerifying}
                      onReVerify={handleReVerify}
                      onFixIssue={handleFixIssue}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Passage Action Modal (Explain / Simplify / Note) */}
      <PassageActionModal
        isOpen={passageModal.isOpen}
        onClose={() => setPassageModal((prev) => ({ ...prev, isOpen: false }))}
        passage={passageModal.passage}
        action={passageModal.action}
        sectionContext={passageModal.sectionContext}
        documentTitle={extractedDoc?.title || 'Document'}
        onSaveAsNote={handleSavePassageNote}
        onOpenInChat={(passage, sectionContext) => {
          setAttachedChatPassage({ text: passage, sectionRef: sectionContext });
          setReadingMode('chat');
        }}
      />

      {/* Side-by-Side Comparison Modal */}
      {summary && extractedDoc && (
        <SideBySideModal
          isOpen={isSideBySideOpen}
          onClose={() => setIsSideBySideOpen(false)}
          document={extractedDoc}
          summary={summary}
        />
      )}

      {/* Source Inspector Drawer */}
      <SourceDrawer
        isOpen={isSourceDrawerOpen}
        onClose={() => setIsSourceDrawerOpen(false)}
        document={extractedDoc}
        targetSectionLabel={targetSourceSection}
      />

      {/* Grounding System Modal */}
      <GroundingModal
        isOpen={isGroundingModalOpen}
        onClose={() => setIsGroundingModalOpen(false)}
      />

      {/* Saved Sessions & Library Modal */}
      <SavedSessionsModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        sessions={savedSessions}
        onOpenSession={handleOpenSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Minimal Academic Footer */}
      <footer className="border-t border-[#488269] dark:border-[#3E4249] py-[18px] text-center text-[12px] text-[#DCEAE0] dark:text-[#9A9691] bg-[#4E886D] dark:bg-[#232528] transition-colors">
        <div className="w-full max-w-[1200px] mx-auto px-[16px] md:px-[28px] lg:px-[40px] flex flex-col sm:flex-row items-center justify-between gap-[12px]">
          <span className="font-mono text-[11px]">
            AI Research Reading Companion · Strictly Grounded in Source Documents
          </span>
          <button
            type="button"
            onClick={() => setIsGroundingModalOpen(true)}
            className="hover:underline hover:text-white dark:hover:text-[#E8E4DD] text-[11px] font-mono transition-colors cursor-pointer"
          >
            Verification Standards & Rules
          </button>
        </div>
      </footer>
    </div>
  );
}
