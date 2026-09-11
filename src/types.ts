export interface DocumentSection {
  id: string;
  label: string;
  content: string;
  wordCount: number;
}

export interface ExtractedDocument {
  title: string;
  fileType: string;
  sections: DocumentSection[];
  fullText: string;
  totalWords: number;
  totalCharacters: number;
  metadata?: Record<string, string | number>;
}

export interface KeyPointItem {
  point: string;
  sourceRef: string;
}

export interface DetailedSectionItem {
  sectionTitle: string;
  sourceRef: string;
  content: string;
  subpoints?: string[];
}

export interface ImportantDetailItem {
  category: 'Numbers & Metrics' | 'Definitions' | 'Conditions & Exceptions' | 'Dates & Timeline' | 'Technical Specifications' | 'Named Entities';
  item: string;
  valueOrDetail: string;
  sourceRef: string;
}

export interface ConclusionItem {
  statement: string;
  sourceRef: string;
}

export interface ContradictionItem {
  issue: string;
  sourceRef: string;
}

export interface SummaryResult {
  title: string;
  overview: string;
  keyPoints: KeyPointItem[];
  detailedSections: DetailedSectionItem[];
  importantDetails: ImportantDetailItem[];
  conclusions: ConclusionItem[];
  contradictionsOrUncertainties: ContradictionItem[];
  sourceCoverageScore: number;
  sourceCoverageExplanation: string;
}

export interface VerificationCheck {
  id: string;
  name: string;
  status: 'passed' | 'warning' | 'failed';
  message: string;
}

export interface VerificationIssue {
  id: string;
  type: 'hallucination' | 'number_mismatch' | 'missing_detail' | 'context_shift' | 'contradiction';
  severity: 'high' | 'medium' | 'low';
  summaryClaim: string;
  sourceEvidence: string;
  explanation: string;
  suggestedFix: string;
  affectedSectionTitle: string;
}

export interface VerificationResult {
  overallScore: number;
  scoreLabel: string;
  checks: VerificationCheck[];
  issues: VerificationIssue[];
  coverageAssessment: {
    score: number;
    coveredKeyConcepts: string[];
    uncoveredConcepts: string[];
  };
}

export type ProcessingStage =
  | 'idle'
  | 'reading'
  | 'extracting'
  | 'organizing'
  | 'coverage'
  | 'summarizing'
  | 'verifying'
  | 'complete'
  | 'error';

export interface DocumentOverview {
  about: string;
  problemAddressed: string;
  mainApproach: string;
  majorSections: {
    sectionId: string;
    title: string;
    purpose: string;
  }[];
  importantFindings: string[];
  whatToWatchFor: string;
}

export interface GuidedSection {
  sectionId: string;
  sectionTitle: string;
  sourceRef: string;
  purpose: string;
  simpleExplanation: string;
  keyIdeas: string[];
  evidenceFindings: string[];
  importantNumbers: {
    metric: string;
    value: string;
    context: string;
  }[];
  technicalTerms: {
    term: string;
    definition: string;
  }[];
  readerQuestions: {
    question: string;
    answer: string;
  }[];
}

export type AnswerabilityLevel =
  | 'directly_supported'
  | 'partially_supported'
  | 'not_supported'
  | 'refused_out_of_scope';

export interface CitationReference {
  section: string;
  pageOrLabel: string;
  excerpt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: number;
  content: string;
  attachedPassage?: {
    text: string;
    sectionRef: string;
  };
  answerability?: AnswerabilityLevel;
  citation?: CitationReference;
  isStreaming?: boolean;
}

export interface UserNote {
  id: string;
  documentId: string;
  sectionLabel: string;
  targetText?: string;
  noteContent: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserHighlight {
  id: string;
  documentId: string;
  sectionLabel: string;
  text: string;
  color?: string;
  note?: string;
  createdAt: number;
}

export type ReadingMode =
  | 'overview'
  | 'guided'
  | 'reader'
  | 'chat'
  | 'summary'
  | 'notes'
  | 'verification';

export interface SavedDocumentSession {
  id: string;
  title: string;
  fileType: string;
  lastOpened: number;
  totalWords: number;
  sectionCount: number;
  activeSectionId?: string;
  visitedSectionIds?: string[];
  readingMode?: ReadingMode;
  extractedDoc: ExtractedDocument;
  overview?: DocumentOverview | null;
  summary?: SummaryResult | null;
  verification?: VerificationResult | null;
  chatHistory?: ChatMessage[];
  notes: UserNote[];
  highlights: UserHighlight[];
}


