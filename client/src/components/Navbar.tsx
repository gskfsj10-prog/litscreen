import { Link, useLocation } from "wouter";
import { Activity, Zap } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-md">
      {/* Top accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--neon-cyan)] to-transparent opacity-60" />

      <div className="container flex h-14 items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 group-hover:border-[var(--neon-cyan)]/60 transition-colors">
            <Zap className="h-4 w-4 text-[var(--neon-cyan)]" />
          </div>
          <span
            className="text-xl font-bold tracking-tight neon-text-cyan"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Litscreen
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/" active={location === "/"}>
            <Activity className="h-3.5 w-3.5" />
            Tokens
          </NavLink>
          <NavLink href="/trades" active={location === "/trades"}>
            <span className="h-2 w-2 rounded-full bg-[var(--neon-green)] live-dot inline-block" />
            Live Trades
          </NavLink>
        </nav>

        {/* Chain badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded border border-[var(--neon-cyan)]/20 bg-[var(--neon-cyan)]/5 px-2.5 py-1 text-xs font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-green)] live-dot" />
            <span className="text-[var(--neon-cyan)] font-medium">LITVM</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">4441</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      }`}
    >
      {children}
    </Link>
  );
}
