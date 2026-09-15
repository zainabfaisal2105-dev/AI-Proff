import express from "express";
import path from "path";
import multer from "multer";
import {
  extractFromPdf,
  extractFromDocx,
  extractFromPptx,
  extractFromSpreadsheet,
  extractFromText,
  extractFromUrl,
} from "./server/extractor.js";
import { generateSourceSummary } from "./server/summarizer.js";
import { verifySummaryAgainstSource, fixSummarySection } from "./server/checker.js";
import {
  generateDocumentOverview,
  generateGuidedSection,
  answerDocumentChat,
  explainOrSimplifyPassage,
} from "./server/companion.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Handle malformed JSON gracefully to always return json error
  app.use((err: any, _req: any, res: any, next: any) => {
    if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
      return res.status(400).json({ error: 'Failed to parse text content. Please check text formatting.' });
    }
    next(err);
  });

  // API Health Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "document-summarizer" });
  });

  // Extract from uploaded file
  app.post("/api/extract-file", upload.single("file") as any, async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file was uploaded." });
      }

      const file = req.file;
      const originalName = file.originalname;
      const ext = path.extname(originalName).toLowerCase();
      const buffer = file.buffer;

      let extracted;
      if (ext === ".pdf") {
        extracted = await extractFromPdf(buffer, originalName);
      } else if (ext === ".docx" || ext === ".doc") {
        extracted = await extractFromDocx(buffer, originalName);
      } else if (ext === ".pptx" || ext === ".ppt") {
        extracted = await extractFromPptx(buffer, originalName);
      } else if (ext === ".xlsx" || ext === ".xls") {
        extracted = await extractFromSpreadsheet(buffer, originalName, false);
      } else if (ext === ".csv") {
        extracted = await extractFromSpreadsheet(buffer, originalName, true);
      } else if (ext === ".txt") {
        extracted = extractFromText(buffer.toString("utf-8"), originalName);
      } else {
        return res.status(400).json({
          error: "This file type isn't currently supported. Accepted formats: PDF, DOCX, PPTX, XLSX, CSV, TXT.",
        });
      }

      if (!extracted.sections || extracted.sections.length === 0 || extracted.totalWords < 5) {
        return res.status(400).json({
          error: "The provided source does not contain enough readable content to generate a reliable summary.",
        });
      }

      res.json(extracted);
    } catch (err: any) {
      console.error("Extract file error:", err);
      res.status(500).json({
        error: err.message || "Failed to extract content from file.",
      });
    }
  });

  // Extract from URL
  app.post("/api/extract-url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "Please provide a valid web URL." });
      }

      const extracted = await extractFromUrl(url.trim());
      if (!extracted.sections || extracted.sections.length === 0 || extracted.totalWords < 5) {
        return res.status(400).json({
          error: "The provided webpage does not contain enough readable content to generate a reliable summary.",
        });
      }

      res.json(extracted);
    } catch (err: any) {
      console.error("Extract URL error:", err);
      res.status(400).json({
        error: err.message || "Unable to access this source. Please upload the document or paste its contents instead.",
      });
    }
  });

  // Extract from raw pasted text
  app.post("/api/extract-text", (req, res) => {
    try {
      const { text, title } = req.body || {};
      if (!text || typeof text !== "string" || text.trim().length < 5) {
        return res.status(400).json({
          error: "The provided text is too short. Please enter or paste sufficient document content.",
        });
      }

      const extracted = extractFromText(text.trim(), title || "Pasted Document");
      res.json(extracted);
    } catch (err: any) {
      console.error("Extract text error:", err);
      res.status(400).json({ error: err.message || "Failed to process text." });
    }
  });

  // Summarize extracted source
  app.post("/api/summarize", async (req, res) => {
    try {
      const { title, fileType, sections } = req.body;
      if (!sections || !Array.isArray(sections) || sections.length === 0) {
        return res.status(400).json({ error: "Source sections are required for summarization." });
      }

      const summary = await generateSourceSummary(title || "Document", fileType || "txt", sections);
      res.json(summary);
    } catch (err: any) {
      console.error("Summarize endpoint error:", err);
      res.status(500).json({
        error: err.message || "Summarization encountered an unexpected error.",
      });
    }
  });

  // Independent Summary Checker Verification
  app.post("/api/verify", async (req, res) => {
    try {
      const { sections, summary } = req.body;
      if (!sections || !summary) {
        return res.status(400).json({ error: "Both source sections and summary are required for verification." });
      }

      const verification = await verifySummaryAgainstSource(sections, summary);
      res.json(verification);
    } catch (err: any) {
      console.error("Verify endpoint error:", err);
      res.status(500).json({
        error: err.message || "Verification pass encountered an unexpected error.",
      });
    }
  });

  // Fix flagged section
  app.post("/api/fix-section", async (req, res) => {
    try {
      const { sourceSections, sectionTitle, currentContent, issue } = req.body;
      if (!sourceSections || !currentContent || !issue) {
        return res.status(400).json({ error: "Missing required parameters to fix section." });
      }

      const fixResult = await fixSummarySection(sourceSections, sectionTitle, currentContent, issue);
      res.json(fixResult);
    } catch (err: any) {
      console.error("Fix section endpoint error:", err);
      res.status(500).json({
        error: err.message || "Failed to fix summary section.",
      });
    }
  });

  // Reading Companion: Generate Concise 6-Question Overview
  app.post("/api/overview", async (req, res) => {
    try {
      const { title, fileType, sections } = req.body;
      if (!sections || !Array.isArray(sections) || sections.length === 0) {
        return res.status(400).json({ error: "Document sections are required to generate an overview." });
      }

      const overview = await generateDocumentOverview(title || "Document", fileType || "txt", sections);
      res.json(overview);
    } catch (err: any) {
      console.error("Overview endpoint error:", err);
      res.status(500).json({
        error: err.message || "Failed to generate reading overview.",
      });
    }
  });

  // Reading Companion: Generate Guided Section Walkthrough
  app.post("/api/guided-section", async (req, res) => {
    try {
      const { section, allSections, documentTitle } = req.body;
      if (!section || !section.content) {
        return res.status(400).json({ error: "Section data is required for guided reading." });
      }

      const guided = await generateGuidedSection(section, allSections || [section], documentTitle || "Document");
      res.json(guided);
    } catch (err: any) {
      console.error("Guided section endpoint error:", err);
      res.status(500).json({
        error: err.message || "Failed to generate guided section breakdown.",
      });
    }
  });

  // Reading Companion: Document-Grounded Chat (with strict scope refusal and 3 answerability levels)
  app.post("/api/chat", async (req, res) => {
    try {
      const { question, attachedPassage, sections, documentTitle, history } = req.body;
      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "A valid question is required." });
      }
      if (!sections || !Array.isArray(sections) || sections.length === 0) {
        return res.status(400).json({ error: "Active document sections are required for chat grounding." });
      }

      const response = await answerDocumentChat(
        question.trim(),
        attachedPassage,
        sections,
        documentTitle || "Document",
        history || []
      );
      res.json(response);
    } catch (err: any) {
      console.error("Chat endpoint error:", err);
      res.status(500).json({
        error: err.message || "Failed to process question.",
      });
    }
  });

  // Reading Companion: Explain or Simplify Highlighted Passage
  app.post("/api/explain-passage", async (req, res) => {
    try {
      const { passage, action, sectionContext, documentTitle } = req.body;
      if (!passage || typeof passage !== "string") {
        return res.status(400).json({ error: "Passage text is required." });
      }

      const result = await explainOrSimplifyPassage(
        passage.trim(),
        action === "simplify" ? "simplify" : "explain",
        sectionContext || "Document",
        documentTitle || "Document"
      );
      res.json(result);
    } catch (err: any) {
      console.error("Explain passage endpoint error:", err);
      res.status(500).json({
        error: err.message || "Failed to explain passage.",
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Document Summarizer server running on port ${PORT}`);
  });
}

startServer();
