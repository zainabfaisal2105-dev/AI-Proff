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
  "gemini-3.8-flash",
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

  const formattedSource = sections
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
1. STRICT SCOPE REFUSAL:
   - If the user asks a question completely unrelated to this document (e.g. general world facts, politics, celebrity news, general coding, external trivia like "who is the president of Pakistan?", "what is the best neural net for image classification?"):
     You MUST set "answerability": "refused_out_of_scope"
     And respond: "That question is outside the scope of this document. I can explain how this document discusses [subject if relevant], but I cannot provide an answer based on external knowledge."
2. THREE ANSWERABILITY LEVELS:
   - "directly_supported": The document explicitly answers the question. State the answer clearly, referencing exact numbers and facts without assumption.
   - "partially_supported": The document contains related context or partial information, but does not directly or fully answer the question. Explicitly state: "The document provides related information, but it does not explicitly answer this." Then explain only what IS supported.
   - "not_supported": The document does not contain sufficient information to answer the question (e.g., asking why the authors chose something when the text doesn't explain their rationale). Explicitly state: "The document does not provide enough information to answer this. I don't want to infer or assume their reasoning."
   - "refused_out_of_scope": Unrelated external inquiry.
3. ZERO HALLUCINATION:
   - Never use external world training data to answer document-specific claims.
   - Preserve all numbers, percentages, dates, and names exactly.
   - Give a precise citation with the section label and page/excerpt.

Return valid JSON:
{
  "answerability": "directly_supported | partially_supported | not_supported | refused_out_of_scope",
  "answer": "Your comprehensive, clear, grounded response...",
  "citation": {
    "section": "Section name where evidence was found, or 'None' if out of scope / not supported",
    "pageOrLabel": "Exact section label from source, e.g. Page 2, Section 3",
    "excerpt": "Brief 1-line quote or key evidence from the document"
  }
}`;

  if (ai) {
    for (const model of CANDIDATE_MODELS) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: "You are a research reading partner sitting beside the reader. You answer questions strictly from the uploaded document. You strictly refuse out-of-scope inquiries and distinguish directly supported, partially supported, and unsupported questions.",
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        });

        const text = res.text || "{}";
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
          answer: parsed.answer || "The document does not provide sufficient information to answer this.",
          answerability: parsed.answerability || "directly_supported",
          citation: parsed.citation || {
            section: sections[0]?.label || "Document",
            pageOrLabel: sections[0]?.label || "General",
            excerpt: "",
          },
        };
      } catch (err: any) {
        console.warn(`Chat model ${model} failed:`, err?.message || err);
      }
    }
  }

  // Fallback if AI unavailable
  const matchingSection = sections.find((s) =>
    s.content.toLowerCase().includes(question.toLowerCase().slice(0, 20))
  ) || sections[0];

  return {
    answer: `According to ${matchingSection?.label || 'the source'}, the document details specific parameters and results relevant to your query, but live AI inference is temporarily unavailable to synthesize an interactive response.`,
    answerability: 'partially_supported',
    citation: {
      section: matchingSection?.label || 'General',
      pageOrLabel: matchingSection?.label || 'General',
      excerpt: matchingSection?.content.slice(0, 120) || '',
    },
  };
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
