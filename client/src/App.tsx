import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import TokenDetail from "./pages/TokenDetail";
import Trades from "./pages/Trades";
import Navbar from "./components/Navbar";

function Router() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/token/:address" component={TokenDetail} />
          <Route path="/trades" component={Trades} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <footer className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground font-mono">
        <span className="neon-text-cyan">Litscreen</span>
        <span className="mx-2 text-border">·</span>
        Data from{" "}
        <a
          href="https://app.onmi.fun/?chain=LITVM"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--neon-cyan)] hover:underline"
        >
          onmi.fun
        </a>
        <span className="mx-2 text-border">·</span>
        LITVM Chain (4441)
      </footer>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
