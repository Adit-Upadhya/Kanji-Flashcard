import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDeckSchema, type Deck } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Book, Trash2 } from "lucide-react";
import { FileImport } from "@/components/file-import";

export default function Home() {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertDeckSchema),
    defaultValues: { name: "" }
  });

  const { data: activeDecks } = useQuery<Deck[]>({ 
    queryKey: ["/api/decks", false]
  });

  const { data: deletedDecks } = useQuery<Deck[]>({ 
    queryKey: ["/api/decks", true],
    queryFn: async () => {
      const res = await fetch("/api/decks?includeDeleted=true");
      if (!res.ok) throw new Error("Failed to fetch decks");
      const decks = await res.json();
      return decks.filter((deck: Deck) => deck.isDeleted);
    }
  });

  const createDeck = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("POST", "/api/decks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({ title: "Deck created successfully" });
      form.reset();
    }
  });

  const deleteDeck = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/decks/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({ title: "Deck deleted successfully" });
    }
  });

  const DeckCard = ({ deck }: { deck: Deck }) => (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Book className="mr-2 h-5 w-5" />
            {deck.name}
          </div>
          {!deck.isDeleted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                deleteDeck.mutate(deck.id);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      {deck.isDeleted && (
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Deleted on {new Date(deck.deletedAt!).toLocaleDateString()}
          </p>
        </CardFooter>
      )}
    </Card>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Kanji Flashcards</h1>
        <div className="flex gap-2">
          <FileImport />
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Deck
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Deck</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => createDeck.mutate(data))}>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deck Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="mt-4" disabled={createDeck.isPending}>
                    Create Deck
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="active" className="mb-6">
        <TabsList>
          <TabsTrigger value="active">Active Decks</TabsTrigger>
          <TabsTrigger value="deleted">Deleted Decks</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDecks?.map(deck => (
              <Link key={deck.id} href={`/deck/${deck.id}`}>
                <DeckCard deck={deck} />
              </Link>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="deleted">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deletedDecks?.map(deck => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}