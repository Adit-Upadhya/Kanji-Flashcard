import { type User, type Deck, type InsertDeck, type Card, type InsertCard, type StudySession, type CardAttempt } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Deck operations
  getDecks(includeDeleted?: boolean): Promise<Deck[]>;
  getDeck(id: number): Promise<Deck | undefined>;
  createDeck(deck: InsertDeck & { userId: number }): Promise<Deck>;
  deleteDeck(id: number): Promise<Deck>;

  // Card operations
  getCards(deckId: number): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: number, updates: Partial<Card>): Promise<Card>;

  // Study Session operations
  createStudySession(userId: number, deckId: number): Promise<StudySession>;
  endStudySession(sessionId: number): Promise<StudySession>;
  getStudySessionsByUser(userId: number): Promise<StudySession[]>;
  getStudySessionsByDeck(deckId: number): Promise<StudySession[]>;

  // Card Attempt operations
  createCardAttempt(sessionId: number, cardId: number, isCorrect: boolean): Promise<CardAttempt>;
  getCardAttemptsBySession(sessionId: number): Promise<CardAttempt[]>;
  getCardStats(cardId: number): Promise<{ totalAttempts: number; correctAttempts: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private decks: Map<number, Deck>;
  private cards: Map<number, Card>;
  private studySessions: Map<number, StudySession>;
  private cardAttempts: Map<number, CardAttempt>;
  private userId: number;
  private deckId: number;
  private cardId: number;
  private sessionId: number;
  private attemptId: number;

  constructor() {
    this.users = new Map();
    this.decks = new Map();
    this.cards = new Map();
    this.studySessions = new Map();
    this.cardAttempts = new Map();
    this.userId = 1;
    this.deckId = 1;
    this.cardId = 1;
    this.sessionId = 1;
    this.attemptId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Deck operations
  async getDecks(includeDeleted = false): Promise<Deck[]> {
    return Array.from(this.decks.values()).filter(deck => includeDeleted || !deck.isDeleted);
  }

  async getDeck(id: number): Promise<Deck | undefined> {
    return this.decks.get(id);
  }

  async createDeck(insertDeck: InsertDeck & { userId: number }): Promise<Deck> {
    const id = this.deckId++;
    const deck: Deck = {
      ...insertDeck,
      id,
      isDeleted: false,
      deletedAt: null,
    };
    this.decks.set(id, deck);
    return deck;
  }

  async deleteDeck(id: number): Promise<Deck> {
    const deck = await this.getDeck(id);
    if (!deck) throw new Error("Deck not found");

    const updatedDeck: Deck = {
      ...deck,
      isDeleted: true,
      deletedAt: new Date(),
    };
    this.decks.set(id, updatedDeck);
    return updatedDeck;
  }

  // Card operations
  async getCards(deckId: number): Promise<Card[]> {
    return Array.from(this.cards.values()).filter(card => card.deckId === deckId);
  }

  async getCard(id: number): Promise<Card | undefined> {
    return this.cards.get(id);
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const id = this.cardId++;
    const card: Card = { ...insertCard, id, isHard: false };
    this.cards.set(id, card);
    return card;
  }

  async updateCard(id: number, updates: Partial<Card>): Promise<Card> {
    const existing = await this.getCard(id);
    if (!existing) throw new Error("Card not found");

    const updated = { ...existing, ...updates };
    this.cards.set(id, updated);
    return updated;
  }

  // Study Session operations
  async createStudySession(userId: number, deckId: number): Promise<StudySession> {
    const id = this.sessionId++;
    const session: StudySession = {
      id,
      userId,
      deckId,
      startedAt: new Date(),
      endedAt: null,
      cardsStudied: 0
    };
    this.studySessions.set(id, session);
    return session;
  }

  async endStudySession(sessionId: number): Promise<StudySession> {
    const session = Array.from(this.studySessions.values()).find(s => s.id === sessionId);
    if (!session) throw new Error("Study session not found");

    const updatedSession: StudySession = {
      ...session,
      endedAt: new Date(),
      cardsStudied: (await this.getCardAttemptsBySession(sessionId)).length
    };
    this.studySessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async getStudySessionsByUser(userId: number): Promise<StudySession[]> {
    return Array.from(this.studySessions.values()).filter(session => session.userId === userId);
  }

  async getStudySessionsByDeck(deckId: number): Promise<StudySession[]> {
    return Array.from(this.studySessions.values()).filter(session => session.deckId === deckId);
  }

  // Card Attempt operations
  async createCardAttempt(sessionId: number, cardId: number, isCorrect: boolean): Promise<CardAttempt> {
    const id = this.attemptId++;
    const attempt: CardAttempt = {
      id,
      sessionId,
      cardId,
      isCorrect,
      attemptedAt: new Date()
    };
    this.cardAttempts.set(id, attempt);
    return attempt;
  }

  async getCardAttemptsBySession(sessionId: number): Promise<CardAttempt[]> {
    return Array.from(this.cardAttempts.values())
      .filter(attempt => attempt.sessionId === sessionId);
  }

  async getCardStats(cardId: number): Promise<{ totalAttempts: number; correctAttempts: number }> {
    const attempts = Array.from(this.cardAttempts.values())
      .filter(attempt => attempt.cardId === cardId);

    return {
      totalAttempts: attempts.length,
      correctAttempts: attempts.filter(a => a.isCorrect).length
    };
  }
}

export const storage = new MemStorage();