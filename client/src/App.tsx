import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import EasterEggs from "@/components/EasterEggs";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Posts from "@/pages/posts";
import Login from "@/pages/login";
import Profile from "@/pages/profile";
import Messages from "@/pages/messages";
import Disciplinary from "@/pages/disciplinary";
import DevPage from "@/pages/dev";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-secondary-bg flex items-center justify-center">
        <div className="text-center glass-effect p-8 rounded-xl teen-shadow sparkle-border">
          <div className="text-6xl mb-4 pulse-glow">✨</div>
          <div className="loading-spinner rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="rainbow-text font-bold text-lg">Loading the magic...</p>
          <p className="text-purple-600 text-sm mt-2">Getting your vibes ready!</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {isAuthenticated ? (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/posts" component={Posts} />
          <Route path="/profile/:userId" component={Profile} />
          <Route path="/messages" component={Messages} />
          <Route path="/disciplinary" component={Disciplinary} />
        </>
      ) : (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/dev" component={DevPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="wrickit-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <EasterEggs />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
