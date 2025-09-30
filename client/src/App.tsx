import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConversationProvider } from "@/contexts/ConversationContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import SelfImprovementPage from "@/pages/self-improvement";
import AIAgentPage from "@/pages/ai-agent";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/self-improvement" component={SelfImprovementPage} />
      <Route path="/ai-agent" component={AIAgentPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConversationProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ConversationProvider>
    </QueryClientProvider>
  );
}

export default App;
