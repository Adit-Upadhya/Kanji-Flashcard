import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type StudySession, type CardAttempt } from "@shared/schema";

export default function StatsPage() {
  const { id: deckId } = useParams();

  const { data: sessions } = useQuery<StudySession[]>({
    queryKey: [`/api/study-sessions/deck/${deckId}`],
  });

  const totalCards = sessions?.reduce((sum, session) => sum + session.cardsStudied, 0) || 0;
  const totalTime = sessions?.reduce((sum, session) => {
    if (!session.endedAt) return sum;
    return sum + (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime());
  }, 0) || 0;

  const averageTimePerCard = totalCards ? Math.round(totalTime / totalCards / 1000) : 0;

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/deck/${deckId}`}>
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deck
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Study Statistics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Study Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{sessions?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cards Studied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalCards}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Time per Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{averageTimePerCard}s</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Study History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions?.map(session => (
              <div key={session.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <p className="font-medium">
                    {new Date(session.startedAt).toLocaleDateString()} at{' '}
                    {new Date(session.startedAt).toLocaleTimeString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session.cardsStudied} cards studied
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Duration:{' '}
                  {session.endedAt
                    ? Math.round(
                        (new Date(session.endedAt).getTime() -
                          new Date(session.startedAt).getTime()) /
                          1000 /
                          60
                      )
                    : '—'}{' '}
                  minutes
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
