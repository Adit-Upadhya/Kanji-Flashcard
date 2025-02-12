/// <reference types="react" />
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import Home from "@/pages/home";
import Deck from "@/pages/deck";
import Study from "@/pages/study";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/components/protected-route";
import Stats from "@/pages/stats";

function Nav() {
  return (
    <div className="border-b">
      <div className="container mx-auto flex justify-end p-2">
        <ThemeToggle />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/deck/:id" component={Deck} />
      <ProtectedRoute path="/deck/:id/study" component={Study} />
      <ProtectedRoute path="/deck/:id/stats" component={Stats} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="kanji-app-theme">
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background">
          <Nav />
          <Router />
          <Toaster />
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;