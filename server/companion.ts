import { GoogleGenAI } from "@google/genai";
import {
  DocumentSection,
  DocumentOverview,
  GuidedSection,
  ChatMessage,
  AnswerabilityLevel,
  CitationReference,
} from "../src/types.js";

let geminiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI | null {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not set.");
      return null;
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
];

/**
 * Generates the concise 6-question structured reading overview.
 */
export async function generateDocumentOverview(
  title: string,
  fileType: string,
  sections: DocumentSection[]
): Promise<DocumentOverview> {
  const ai = getGemini();

  const formattedSource = sections
    .map((s) => `[SEGMENT: ${s.label}]\n${s.content}`)
    .join('\n\n');

  const prompt = `You are a research companion reading an academic/technical document titled "${title}".
Analyze the provided source text and synthesize a concise, faithful structural overview.

STRICT PRINCIPLES:
- Only use statements directly substantiated in the source.
- Preserve exact figures, numbers, percentages, and metrics.
- Keep the overview concise and academically focused.

SOURCE TEXT:
${formattedSource}

Return a valid JSON object matching this schema:
{
  "about": "1-2 sentences stating exactly what this document covers.",
  "problemAddressed": "The core technical, clinical, or business problem/question the authors address.",
  "mainApproach": "The primary methodology, architecture, or approach employed in the work.",
  "majorSections": [
    {
      "sectionId": "s1",
      "title": "Section title or label from source",
      "purpose": "What this section establishes or describes"
    }
  ],
  "importantFindings": [
    "Key finding or metric 1 with exact numbers",
    "Key finding or metric 2 with exact numbers"
  ],
  "whatToWatchFor": "Critical caveats, boundary conditions, unproven claims, or nuances the reader should keep in mind while reading."
}`;

  if (ai) {
    for (const model of CANDIDATE_MODELS) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: "You synthesize concise, strictly grounded academic overviews. Return JSON only.",
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        });

        const text = res.text || "{}";
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
          about: parsed.about || `This ${fileType.toUpperCase()} document presents technical and empirical findings across ${sections.length} sections.`,
          problemAddressed: parsed.problemAddressed || "Directly addresses experimental and operational challenges defined in the text.",
          mainApproach: parsed.mainApproach || "Structured empirical analysis and systematic validation.",
          majorSections: Array.isArray(parsed.majorSections) && parsed.majorSections.length > 0
            ? parsed.majorSections
            : sections.map((s) => ({
                sectionId: s.id,
                title: s.label,
                purpose: `Establishes core observations and parameters recorded in ${s.label}.`,
              })),
          importantFindings: Array.isArray(parsed.importantFindings) && parsed.importantFindings.length > 0
            ? parsed.importantFindings
            : sections.slice(0, 3).map((s) => `Documented findings in ${s.label}.`),
          whatToWatchFor: parsed.whatToWatchFor || "Pay attention to stated baseline constraints and experimental boundaries.",
        };
      } catch (err: any) {
        console.warn(`Overview generation failed on model ${model}:`, err?.message || err);
      }
    }
  }

  // Deterministic fallback
  return {
    about: `This ${fileType.toUpperCase()} document consists of ${sections.length} sections spanning ${sections.reduce((acc, s) => acc + s.wordCount, 0)} words.`,
    problemAddressed: "Examines system specifications, outcomes, and primary evaluation criteria.",
    mainApproach: "Systematic investigation, quantitative metrics, and experimental documentation.",
    majorSections: sections.map((s) => ({
      sectionId: s.id,
      title: s.label,
      purpose: `Presents primary findings and parameters for ${s.label}.`,
    })),
    importantFindings: sections.slice(0, 4).map((s) => {
      const firstLine = s.content.split('\n').find((l) => l.trim().length > 25);
      return firstLine ? firstLine.trim() : `Key findings established in ${s.label}.`;
    }),
    whatToWatchFor: "Verify specific constraints and exact figures against original source segments.",
  };
}

/**
 * Generates the Guided Reading breakdown for an individual section.
 */
export async function generateGuidedSection(
  section: DocumentSection,
  allSections: DocumentSection[],
  documentTitle: string
): Promise<GuidedSection> {
  const ai = getGemini();

  const prompt = `DOCUMENT: "${documentTitle}"
CURRENT SECTION TO EXPLAIN: "${section.label}"

SECTION SOURCE TEXT:
${section.content}

TASK:
Produce an in-depth, accessible, but strictly source-bound Guided Reading guide for this specific section.

CRITICAL INSTRUCTIONS:
1. "purpose": In 1-2 clear sentences, what is this section trying to tell the reader?
2. "simpleExplanation": Explain what this section means in plain, accessible language without simplifying away caveats or changing numbers.
3. "keyIdeas": Bullet points of the primary arguments or concepts.
4. "evidenceFindings": What does the document actually establish or prove here?
5. "importantNumbers": Exact percentages, metrics, parameters, dates, sample sizes, and quantities. NEVER round or alter.
6. "technicalTerms": Identify technical jargon, acronyms, or formulas introduced here, and explain them strictly using the document's context.
7. "readerQuestions": 2-3 natural questions a researcher or student might have about this section, along with strictly grounded answers.

Return valid JSON adhering to this schema:
{
  "sectionId": "${section.id}",
  "sectionTitle": "${section.label}",
  "sourceRef": "${section.label}",
  "purpose": "What this section is trying to convey...",
  "simpleExplanation": "Clear, accessible explanation of the section's core content...",
  "keyIdeas": ["Idea 1", "Idea 2"],
  "evidenceFindings": ["Finding 1 with exact numbers", "Finding 2"],
  "importantNumbers": [
    { "metric": "Parameter name", "value": "Exact value (e.g. 78.4%)", "context": "Condition or significance" }
  ],
  "technicalTerms": [
    { "term": "Term or Acronym", "definition": "Contextual definition directly based on text" }
  ],
  "readerQuestions": [
    { "question": "Relevant question?", "answer": "Factual grounded answer based on text." }
  ]
}`;

  if (ai) {
    for (const model of CANDIDATE_MODELS) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: "You are a research companion breaking down complex document sections into structured, grounded explanations. Return JSON only.",
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        });

        const text = res.text || "{}";
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
          sectionId: section.id,
          sectionTitle: parsed.sectionTitle || section.label,
          sourceRef: section.label,
          purpose: parsed.purpose || `Details the key observations and data for ${section.label}.`,
          simpleExplanation: parsed.simpleExplanation || section.content.slice(0, 300),
          keyIdeas: Array.isArray(parsed.keyIdeas) && parsed.keyIdeas.length > 0 ? parsed.keyIdeas : [`Primary argument in ${section.label}`],
          evidenceFindings: Array.isArray(parsed.evidenceFindings) && parsed.evidenceFindings.length > 0 ? parsed.evidenceFindings : [`Verified records in ${section.label}`],
          importantNumbers: Array.isArray(parsed.importantNumbers) ? parsed.importantNumbers : extractNumbersFromText(section.content),
          technicalTerms: Array.isArray(parsed.technicalTerms) ? parsed.technicalTerms : [],
          readerQuestions: Array.isArray(parsed.readerQuestions) ? parsed.readerQuestions : [],
        };
      } catch (err: any) {
        console.warn(`Guided section generation failed on ${model}:`, err?.message || err);
      }
    }
  }

  // Deterministic fallback
  return {
    sectionId: section.id,
    sectionTitle: section.label,
    sourceRef: section.label,
    purpose: `Outlines the foundational data, methodology, or observations in ${section.label}.`,
    simpleExplanation: section.content.slice(0, 400).replace(/\n+/g, ' ') + '...',
    keyIdeas: [
      `Section records ${section.wordCount} words of technical detail.`,
      `Presents direct measurements and core documentation.`,
    ],
    evidenceFindings: [
      `Data points and arguments recorded in ${section.label}.`,
    ],
    importantNumbers: extractNumbersFromText(section.content),
    technicalTerms: [],
    readerQuestions: [
      {
        question: `What is the primary takeaway of ${section.label}?`,
        answer: `The section documents the specific parameters, conditions, and findings reported in the text.`,
      },
    ],
  };
}

/**
 * Selects the most relevant document sections for answering a user question,
 * preventing context overflow on long PDFs or multi-slide presentations.
 */
function selectRelevantSections(
  sections: DocumentSection[],
  question: string,
  attachedPassage?: { text: string; sectionRef: string }
): DocumentSection[] {
  if (!sections || sections.length === 0) return [];
  const totalChars = sections.reduce((sum, s) => sum + s.content.length, 0);
  if (totalChars <= 18000) {
    return sections;
  }

  // Tokenize question and extract meaningful keywords
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of',
    'can', 'you', 'simply', 'tell', 'me', 'what', 'are', 'how', 'why', 'who', 'where', 'when', 'does',
    'explain', 'describe', 'give', 'about', 'this', 'that', 'these', 'those', 'from'
  ]);
  const queryTerms = (question.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [])
    .filter((w) => !stopWords.has(w));

  // Score each section
  const scored = sections.map((sec, idx) => {
    const text = (sec.label + ' ' + sec.content).toLowerCase();
    let score = 0;

    // Heavily weight section 0 (title/intro/overview)
    if (idx === 0) score += 3;

    // Heavily weight attached passage section
    if (attachedPassage && attachedPassage.sectionRef && sec.label.includes(attachedPassage.sectionRef)) {
      score += 15;
    }

    for (const term of queryTerms) {
      if (text.includes(term)) {
        const count = (text.match(new RegExp(term, 'g')) || []).length;
        score += Math.min(count, 5);
      }
    }

    return { sec, score, idx };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Take top sections up to character budget (~16,000 characters)
  const selected: typeof scored = [];
  let charCount = 0;
  const maxChars = 16000;

  for (const item of scored) {
    if (selected.length < 3 || charCount + item.sec.content.length <= maxChars) {
      selected.push(item);
      charCount += item.sec.content.length;
      if (charCount >= maxChars) break;
    }
  }

  // Re-sort selected back to original document order
  selected.sort((a, b) => a.idx - b.idx);
  return selected.map((item) => item.sec);
}

/**
 * Document-grounded chat engine with strict scope refusal and 3 answerability levels.
 */
export async function answerDocumentChat(
  question: string,
  attachedPassage: { text: string; sectionRef: string } | undefined,
  sections: DocumentSection[],
  documentTitle: string,
  history: { sender: 'user' | 'assistant'; content: string }[] = []
): Promise<{
  answer: string;
  answerability: AnswerabilityLevel;
  citation: CitationReference;
}> {
  const ai = getGemini();
  if (!ai) {
    throw new Error("Gemini AI API key is not configured on the server.");
  }

  // Filter or chunk long document sections
  const relevantSections = selectRelevantSections(sections, question, attachedPassage);
  const formattedSource = relevantSections
    .map((s) => `=== SECTION: ${s.label} ===\n${s.content}`)
    .join('\n\n');

  const historyContext = history.slice(-4).map((h) => `${h.sender.toUpperCase()}: ${h.content}`).join('\n');

  const passageNote = attachedPassage
    ? `USER HIGHLIGHTED PASSAGE FOR DIRECT REFERENCE:\n"${attachedPassage.text}" (From ${attachedPassage.sectionRef})\n`
    : '';

  const prompt = `DOCUMENT TITLE: "${documentTitle}"

ORIGINAL DOCUMENT CONTENT:
${formattedSource}

${passageNote}
RECENT CHAT HISTORY:
${historyContext}

USER'S QUESTION:
"${question}"

STRICT OPERATING PRINCIPLES:
1. THREE ANSWERABILITY LEVELS:
   - "directly_supported": The document explicitly provides the information to answer this question. State the answer clearly and concisely, referencing exact facts and numbers without extrapolation.
   - "partially_supported": The document contains related context or partial information, but does not directly or fully answer the question. Explicitly state: "The document provides related information, but it does not explicitly answer this." Then explain only what IS supported.
   - "refused_out_of_scope": The concept, term, or question is not discussed, defined, or covered in this document (e.g. asking about "deadlocks" when the document is about quantum computing, machine learning, or medical trials).
2. OUT-OF-SCOPE REFUSAL GUIDANCE (CRITICAL):
   - If the user asks a question about a concept or term that is NOT defined, mentioned, or addressed in this document (e.g. "can you simply tell me what are deadlocks?"):
     You MUST set "answerability": "refused_out_of_scope".
     In your answer, state clearly: "This document doesn't define or discuss [concept/term]. It focuses on [mention 1-2 core themes covered in this document]. Try asking about [relevant topic A] or [relevant topic B]."
3. ZERO HALLUCINATION:
   - Never use outside world training memory to invent answers for document queries.
   - Preserve all figures, dates, and metrics verbatim.
   - Cite the exact section and excerpt where evidence was found (or section: "None" if out of scope).

Return a valid JSON object matching this schema:
{
  "answerability": "directly_supported | partially_supported | refused_out_of_scope",
  "answer": "Clear, grounded response...",
  "citation": {
    "section": "Section name or None",
    "pageOrLabel": "Exact section label or None",
    "excerpt": "Brief 1-line evidence quote or empty string"
  }
}`;

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: "You are a research reading partner sitting beside the reader. You answer questions strictly from the uploaded document. You strictly refuse out-of-scope inquiries and distinguish directly supported, partially supported, and unsupported questions. Always respond in valid JSON.",
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              answerability: {
                type: "STRING",
                enum: ["directly_supported", "partially_supported", "refused_out_of_scope"]
              },
              answer: { type: "STRING" },
              citation: {
                type: "OBJECT",
                properties: {
                  section: { type: "STRING" },
                  pageOrLabel: { type: "STRING" },
                  excerpt: { type: "STRING" }
                },
                required: ["section", "pageOrLabel"]
              }
            },
            required: ["answerability", "answer", "citation"]
          }
        },
      });

      const text = res.text || "{}";
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch (jsonErr) {
        console.warn(`[Grounded Q&A] JSON parse failed on model ${model}, attempting regex extraction:`, jsonErr);
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw jsonErr;
        }
      }

      const answerability: AnswerabilityLevel =
        parsed.answerability === "partially_supported" || parsed.answerability === "refused_out_of_scope"
          ? parsed.answerability
          : "directly_supported";

      return {
        answer: parsed.answer || "The document does not provide sufficient information to answer this.",
        answerability,
        citation: parsed.citation || {
          section: relevantSections[0]?.label || "Document",
          pageOrLabel: relevantSections[0]?.label || "General",
          excerpt: "",
        },
      };
    } catch (err: any) {
      lastError = err;
      console.error(`[Grounded Q&A] Gemini API error on model ${model}:`, err?.message || err, err?.stack);
    }
  }

  // If live AI models failed, throw error to trigger frontend retry state
  throw new Error(lastError?.message || "Technical failure retrieving grounded Q&A response from AI engine.");
}

/**
 * Explains or simplifies a highlighted passage in the context of the document.
 */
export async function explainOrSimplifyPassage(
  passage: string,
  action: 'explain' | 'simplify',
  sectionContext: string,
  documentTitle: string
): Promise<{
  result: string;
  groundedNote: string;
  simplifiedTerminology?: { term: string; explanation: string }[];
}> {
  const ai = getGemini();

  const prompt = `DOCUMENT: "${documentTitle}"
SECTION CONTEXT: "${sectionContext}"

USER HIGHLIGHTED PASSAGE:
"${passage}"

TASK:
${action === 'explain'
  ? 'Explain what this highlighted passage means in the context of this paper. Make difficult technical concepts accessible, while strictly remaining grounded in what the paper actually describes. If the paper does not define something adequately, say so.'
  : 'Simplify this passage into plain, understandable language. DO NOT remove qualifications, conditions, or exceptions. DO NOT round or alter any numbers. DO NOT invent unsupported claims.'}

Return valid JSON:
{
  "result": "The grounded explanation or simplified version...",
  "groundedNote": "A 1-sentence note indicating the exact scope of what the paper establishes here.",
  "simplifiedTerminology": [
    { "term": "Technical term", "explanation": "Contextual definition" }
  ]
}`;

  if (ai) {
    for (const model of CANDIDATE_MODELS) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: "You explain and simplify technical passages strictly based on document context. Return JSON.",
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        });

        const text = res.text || "{}";
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
          result: parsed.result || (action === 'explain' ? `Explanation of: "${passage}"` : passage),
          groundedNote: parsed.groundedNote || `Based on context from ${sectionContext}.`,
          simplifiedTerminology: Array.isArray(parsed.simplifiedTerminology) ? parsed.simplifiedTerminology : [],
        };
      } catch (err: any) {
        console.warn(`Explain passage failed on ${model}:`, err?.message || err);
      }
    }
  }

  return {
    result: action === 'explain'
      ? `This passage states: "${passage}". In the context of ${sectionContext}, it defines a key operational finding or parameter recorded by the authors.`
      : `In simpler terms: ${passage}`,
    groundedNote: `Faithfully extracted from ${sectionContext}.`,
  };
}

function extractNumbersFromText(text: string): GuidedSection['importantNumbers'] {
  const items: GuidedSection['importantNumbers'] = [];
  const regex = /\b(\$?\d+(?:\.\d+)?%?|\b\d{4}\b)\b/g;
  const matches = text.match(regex);
  if (matches) {
    matches.slice(0, 5).forEach((val) => {
      items.push({
        metric: `Recorded Metric`,
        value: val,
        context: `Observed in source section text`,
      });
    });
  }
  return items;
}
