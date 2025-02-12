import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { type Card as CardType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { type StudySession } from "@shared/schema";

export default function StudyPage() {
  const { id } = useParams();
  const deckId = Number(id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filter, setFilter] = useState<"all" | "easy" | "hard">("all");
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);

  const { data: cards, isLoading } = useQuery<CardType[]>({
    queryKey: [`/api/decks/${deckId}/cards`]
  });

  const updateCard = useMutation({
    mutationFn: async ({ id, isHard }: { id: number; isHard: boolean }) => {
      const res = await apiRequest("PATCH", `/api/cards/${id}`, { isHard });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/cards`] });
    }
  });

  const createSession = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/study-sessions", { deckId });
      return res.json();
    },
    onSuccess: (session) => {
      setCurrentSession(session);
    }
  });

  const endSession = useMutation({
    mutationFn: async () => {
      if (!currentSession) return;
      const res = await apiRequest("PATCH", `/api/study-sessions/${currentSession.id}/end`);
      return res.json();
    }
  });

  const recordAttempt = useMutation({
    mutationFn: async ({ cardId, isCorrect }: { cardId: number, isCorrect: boolean }) => {
      if (!currentSession) return;
      const res = await apiRequest("POST", "/api/card-attempts", {
        sessionId: currentSession.id,
        cardId,
        isCorrect
      });
      return res.json();
    }
  });

  useEffect(() => {
    createSession.mutate();
    return () => {
      if (currentSession) {
        endSession.mutate();
      }
    };
  }, []);

  if (isLoading || !cards?.length) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  const filteredCards = cards.filter(card => {
    if (filter === "easy") return !card.isHard;
    if (filter === "hard") return card.isHard;
    return true;
  });

  const currentCard = filteredCards[currentIndex];

  const handleNext = (isHard: boolean) => {
    updateCard.mutate({ id: currentCard.id, isHard });
    recordAttempt.mutate({ cardId: currentCard.id, isCorrect: !isHard });
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <Link href={`/deck/${deckId}`}>
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deck
          </Button>
        </Link>
        <Tabs value={filter} onValueChange={(v) => {
          setFilter(v as typeof filter);
          setCurrentIndex(0);
          setIsFlipped(false);
        }}>
          <TabsList>
            <TabsTrigger value="all">All Cards</TabsTrigger>
            <TabsTrigger value="easy">Easy</TabsTrigger>
            <TabsTrigger value="hard">Hard</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" onClick={handleRestart}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Restart
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="perspective-1000 w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className="cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <CardContent className="p-8">
                  <motion.div
                    animate={{ rotateX: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="text-center">
                      {!isFlipped ? (
                        <div>
                          <p className="text-6xl mb-4 font-jp">{currentCard.kanji}</p>
                        </div>
                      ) : (
                        <div style={{ transform: "rotateX(180deg)" }}>
                          <p className="text-xl mb-4 font-jp">{currentCard.furigana}</p>
                          <p className="text-3xl">{currentCard.english}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-4 mt-8">
          <Button
            onClick={() => handleNext(false)}
            className="bg-[#34C759] hover:bg-[#2EAE4F]"
          >
            Easy
          </Button>
          <Button
            onClick={() => handleNext(true)}
            className="bg-[#FF9500] hover:bg-[#E68600]"
          >
            Hard
          </Button>
        </div>

        <p className="mt-4 text-muted-foreground">
          Card {currentIndex + 1} of {filteredCards.length}
        </p>
      </div>
    </div>
  );
}