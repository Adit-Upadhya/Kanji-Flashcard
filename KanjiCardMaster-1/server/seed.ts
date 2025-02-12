import { storage } from "./storage";
import { type InsertDeck, type InsertCard } from "@shared/schema";

const n5Kanji = [
  { kanji: "日", furigana: "ひ", english: "day, sun" },
  { kanji: "一", furigana: "いち", english: "one" },
  { kanji: "国", furigana: "くに", english: "country" },
  { kanji: "人", furigana: "ひと", english: "person" },
  { kanji: "年", furigana: "とし", english: "year" },
  { kanji: "大", furigana: "だい", english: "big" },
  { kanji: "十", furigana: "じゅう", english: "ten" },
  { kanji: "二", furigana: "に", english: "two" },
  { kanji: "本", furigana: "ほん", english: "book, origin" },
  { kanji: "中", furigana: "なか", english: "middle, inside" },
];

const n4Kanji = [
  { kanji: "同", furigana: "おな", english: "same" },
  { kanji: "事", furigana: "こと", english: "thing, matter" },
  { kanji: "社", furigana: "しゃ", english: "company, society" },
  { kanji: "者", furigana: "もの", english: "person" },
  { kanji: "地", furigana: "ち", english: "ground, earth" },
  { kanji: "業", furigana: "ぎょう", english: "business, industry" },
  { kanji: "員", furigana: "いん", english: "member" },
  { kanji: "問", furigana: "と", english: "question" },
  { kanji: "県", furigana: "けん", english: "prefecture" },
  { kanji: "作", furigana: "つく", english: "make, create" },
];

const n3Kanji = [
  { kanji: "政", furigana: "せい", english: "government, politics" },
  { kanji: "議", furigana: "ぎ", english: "deliberation" },
  { kanji: "常", furigana: "じょう", english: "usual, ordinary" },
  { kanji: "総", furigana: "そう", english: "total, whole" },
  { kanji: "面", furigana: "めん", english: "face, surface" },
  { kanji: "報", furigana: "ほう", english: "report, news" },
  { kanji: "協", furigana: "きょう", english: "cooperation" },
  { kanji: "部", furigana: "ぶ", english: "section, part" },
  { kanji: "集", furigana: "しゅう", english: "collect, gather" },
  { kanji: "組", furigana: "くみ", english: "group, team" },
];

async function seedDeck(name: string, cards: Array<{ kanji: string; furigana: string; english: string }>) {
  const deck = await storage.createDeck({ name });
  
  for (const card of cards) {
    await storage.createCard({
      deckId: deck.id,
      ...card
    });
  }
  
  return deck;
}

async function main() {
  console.log("Starting to seed kanji decks...");
  
  const n5Deck = await seedDeck("JLPT N5 Kanji", n5Kanji);
  console.log(`Created N5 deck with ID ${n5Deck.id}`);
  
  const n4Deck = await seedDeck("JLPT N4 Kanji", n4Kanji);
  console.log(`Created N4 deck with ID ${n4Deck.id}`);
  
  const n3Deck = await seedDeck("JLPT N3 Kanji", n3Kanji);
  console.log(`Created N3 deck with ID ${n3Deck.id}`);
  
  console.log("Seeding completed successfully!");
}

main().catch(console.error);
