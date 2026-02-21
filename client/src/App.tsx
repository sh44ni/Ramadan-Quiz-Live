import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/useLanguage";
import { MosqueHeader } from "@/components/mosque-header";
import Welcome from "@/pages/welcome";
import Game from "@/pages/game";
import Admin from "@/pages/admin";
import Results from "@/pages/results";
import Login from "@/pages/login";
import Rules from "@/pages/rules";
import Display from "@/pages/display";
import NotFound from "@/pages/not-found";
import "./lib/i18n";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/login" component={Login} />
      <Route path="/game" component={Game} />
      <Route path="/display" component={Display} />
      <Route path="/admin" component={Admin} />
      <Route path="/results" component={Results} />
      <Route path="/rules" component={Rules} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isDisplayPage = location === "/display";

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <div className="min-h-screen bg-background">
            {!isDisplayPage && <MosqueHeader />}
            <Router />
          </div>
        </LanguageProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
