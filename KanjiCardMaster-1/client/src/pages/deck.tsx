import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCardSchema, type Deck, type Card as CardType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, Play, Eye, BarChart } from "lucide-react";

export default function DeckPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const deckId = Number(id);
  const [showFurigana, setShowFurigana] = useState(false);
  const [filter, setFilter] = useState<"all" | "easy" | "hard">("all");

  const form = useForm({
    resolver: zodResolver(insertCardSchema.omit({ deckId: true })),
    defaultValues: { kanji: "", furigana: "", english: "" }
  });

  const { data: deck } = useQuery<Deck>({ 
    queryKey: [`/api/decks/${deckId}`]
  });

  const { data: cards, isLoading } = useQuery<CardType[]>({ 
    queryKey: [`/api/decks/${deckId}/cards`]
  });

  const createCard = useMutation({
    mutationFn: async (data: { kanji: string; furigana: string; english: string }) => {
      const res = await apiRequest("POST", `/api/decks/${deckId}/cards`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/cards`] });
      toast({ title: "Card created successfully" });
      form.reset();
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  const filteredCards = cards?.filter(card => {
    if (filter === "easy") return !card.isHard;
    if (filter === "hard") return card.isHard;
    return true;
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{deck?.name}</h1>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Card</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => createCard.mutate(data))}>
                  <FormField
                    control={form.control}
                    name="kanji"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kanji</FormLabel>
                        <FormControl>
                          <Input {...field} className="font-jp" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="furigana"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Furigana</FormLabel>
                        <FormControl>
                          <Input {...field} className="font-jp" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="english"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>English</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="mt-4" disabled={createCard.isPending}>
                    Add Card
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setShowFurigana(!showFurigana)} variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            {showFurigana ? "Hide" : "Show"} Furigana
          </Button>
          <Link href={`/deck/${deckId}/stats`}>
            <Button variant="outline">
              <BarChart className="mr-2 h-4 w-4" />
              Statistics
            </Button>
          </Link>
          <Link href={`/deck/${deckId}/study`}>
            <Button>
              <Play className="mr-2 h-4 w-4" />
              Study
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Cards</TabsTrigger>
          <TabsTrigger value="easy">Easy</TabsTrigger>
          <TabsTrigger value="hard">Hard</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards?.map(card => (
          <Card key={card.id} className="p-4">
            <CardContent>
              <div className="text-center">
                <p className="text-4xl mb-2 font-jp">{card.kanji}</p>
                {showFurigana && (
                  <p className="text-sm text-muted-foreground font-jp">{card.furigana}</p>
                )}
                <p className="mt-2">{card.english}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}