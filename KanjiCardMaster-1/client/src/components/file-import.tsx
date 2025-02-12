import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export function FileImport() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);

  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Import failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({ title: "Cards imported successfully" });
      setFile(null);
    },
    onError: () => {
      toast({
        title: "Import failed",
        description: "Please check your file format and try again",
        variant: "destructive",
      });
    },
  });

  const handleImport = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    importMutation.mutate(formData);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import Cards
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Flashcards</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Upload Excel (.xlsx) or PDF files containing kanji flashcards.
              The file should have columns for kanji, furigana, and English meanings.
            </p>
            <Input
              type="file"
              accept=".xlsx,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button 
            onClick={handleImport} 
            disabled={!file || importMutation.isPending}
            className="w-full"
          >
            {importMutation.isPending ? "Importing..." : "Import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
