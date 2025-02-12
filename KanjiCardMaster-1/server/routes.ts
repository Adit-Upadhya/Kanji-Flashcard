import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { read, utils } from "xlsx";
import { getDocument } from "pdfjs-dist";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertDeckSchema, insertCardSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export function registerRoutes(app: Express): Server {
  // Set up authentication routes and middleware
  setupAuth(app);

  // Deck routes
  app.get("/api/decks", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const includeDeleted = req.query.includeDeleted === 'true';
    const decks = await storage.getDecks(includeDeleted);
    res.json(decks);
  });

  app.post("/api/decks", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const parsed = insertDeckSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid deck data" });
    }
    const deck = await storage.createDeck({ ...parsed.data, userId: req.user.id });
    res.json(deck);
  });

  app.delete("/api/decks/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    try {
      const deck = await storage.deleteDeck(Number(req.params.id));
      res.json(deck);
    } catch (error) {
      res.status(404).json({ message: "Deck not found" });
    }
  });

  app.get("/api/decks/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const deck = await storage.getDeck(Number(req.params.id));
    if (!deck) return res.status(404).json({ message: "Deck not found" });
    res.json(deck);
  });

  // Card routes
  app.get("/api/decks/:deckId/cards", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const cards = await storage.getCards(Number(req.params.deckId));
    res.json(cards);
  });

  app.post("/api/decks/:deckId/cards", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const parsed = insertCardSchema.safeParse({
      ...req.body,
      deckId: Number(req.params.deckId),
    });
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid card data" });
    }
    const card = await storage.createCard(parsed.data);
    res.json(card);
  });

  app.patch("/api/cards/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const id = Number(req.params.id);
    const card = await storage.updateCard(id, req.body);
    res.json(card);
  });

  // Study session routes
  app.post("/api/study-sessions", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { deckId } = req.body;
    if (!deckId) return res.status(400).json({ message: "Deck ID is required" });

    const session = await storage.createStudySession(req.user.id, deckId);
    res.json(session);
  });

  app.patch("/api/study-sessions/:id/end", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    try {
      const session = await storage.endStudySession(Number(req.params.id));
      res.json(session);
    } catch (error) {
      res.status(404).json({ message: "Study session not found" });
    }
  });

  app.get("/api/study-sessions/user", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const sessions = await storage.getStudySessionsByUser(req.user.id);
    res.json(sessions);
  });

  app.get("/api/study-sessions/deck/:deckId", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const sessions = await storage.getStudySessionsByDeck(Number(req.params.deckId));
    res.json(sessions);
  });

  // Card attempt routes
  app.post("/api/card-attempts", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { sessionId, cardId, isCorrect } = req.body;
    if (!sessionId || !cardId || isCorrect === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const attempt = await storage.createCardAttempt(sessionId, cardId, isCorrect);
    res.json(attempt);
  });

  app.get("/api/cards/:cardId/stats", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const stats = await storage.getCardStats(Number(req.params.cardId));
    res.json(stats);
  });

  // Import route
  app.post("/api/import", upload.single("file"), async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileType = req.file.originalname.split(".").pop()?.toLowerCase();
      let cards = [];

      if (fileType === "xlsx") {
        const workbook = read(req.file.buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = utils.sheet_to_json(worksheet);

        cards = data.map((row: any) => ({
          kanji: row.kanji,
          furigana: row.furigana,
          english: row.english,
        }));
      } else if (fileType === "pdf") {
        const pdf = await getDocument({ data: req.file.buffer }).promise;
        const numPages = pdf.numPages;
        let text = "";

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ");
        }

        const lines = text.split("\n").filter(Boolean);
        cards = lines.map(line => {
          const [kanji, furigana, english] = line.split(",").map(s => s.trim());
          return { kanji, furigana, english };
        });
      }

      const deck = await storage.createDeck({
        name: `Imported Deck ${new Date().toLocaleString()}`,
        userId: req.user.id
      });

      for (const card of cards) {
        if (card.kanji && card.furigana && card.english) {
          await storage.createCard({
            deckId: deck.id,
            ...card,
          });
        }
      }

      res.json({ message: "Import successful", deckId: deck.id });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Import failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}