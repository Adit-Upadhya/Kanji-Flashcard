import { useEffect } from "react";
import { Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { type User } from "@shared/schema";

export function ProtectedRoute({ 
  path, 
  component: Component 
}: { 
  path: string; 
  component: () => JSX.Element;
}) {
  const [_, setLocation] = useLocation();
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(queryKey[0] as string);
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    }
  });

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return null;
  }

  return <Route path={path} component={Component} />;
}
