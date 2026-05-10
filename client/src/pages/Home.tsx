import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatPrice, formatMarketCap, formatDate, shortAddress } from "@/lib/format";
import {
  Search,
  ArrowUpDown,
  ExternalLink,
  TrendingUp,
  Coins,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SortBy = "marketCap" | "price" | "graduatedAt";
type SortOrder = "ASC" | "DESC";

function StatBadge({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "cyan" | "pink" | "green";
}) {
  const colorClass = {
    cyan: "text-[var(--neon-cyan)]",
    pink: "text-[var(--neon-pink)]",
    green: "text-[var(--neon-green)]",
  }[color];

  return (
    <div className="flex items-center gap-2">
      <div className={colorClass}>{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-sm font-mono font-bold ${colorClass}`}>{value}</div>
      </div>
    </div>
  );
}

interface OnmiToken {
  address: string;
  name: string;
  symbol: string;
  image?: string;
  price: string;
  marketCap: string;
  highestMarketCap?: string;
  totalSupply: string;
  isGraduated: boolean;
  graduatedAt?: string;
  createdAt?: string;
  pairAddress?: string;
  creatorAddress?: string;
  creatorProfile?: Record<string, unknown>;
  progress?: number;
}

function TokenCard({ token }: { token: OnmiToken }) {
  const priceNum = parseFloat(token.price);
  const marketCapNum = parseFloat(token.marketCap);
  const highestMarketCapNum = token.highestMarketCap ? parseFloat(token.highestMarketCap) : marketCapNum;
  const change24h = highestMarketCapNum > 0 ? ((marketCapNum - highestMarketCapNum) / highestMarketCapNum) * 100 : 0;
  const isPositive = change24h >= 0;

  return (
    <Link href={`/token/${token.address}`}>
      <a className="block group">
        <div className="relative bg-card border border-border/60 rounded-lg p-4 hover:border-[var(--neon-cyan)]/50 hover:bg-card/80 transition-all duration-200 cursor-pointer overflow-hidden">
          {/* Gradient background on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-cyan)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10">
            {/* Header: Logo + Name + Badge */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <img
                  src={token.image || "https://via.placeholder.com/40"}
                  alt={token.name}
                  className="w-10 h-10 rounded-full border border-border/50 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate text-foreground">{token.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{token.symbol}</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-1 bg-[var(--neon-green)]/10 text-[var(--neon-green)] rounded border border-[var(--neon-green)]/30 flex-shrink-0">
                GRADUATED
              </span>
            </div>

            {/* Creator info */}
            {token.creatorProfile && (
              <div className="text-xs text-muted-foreground mb-3 truncate">
                Creator:{" "}
                <span className="text-foreground font-mono">
                  {(token.creatorProfile as any).username || shortAddress(token.creatorAddress)}
                </span>
              </div>
            )}

            {/* Price & Market Cap */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Price</div>
                <div className="text-sm font-mono font-bold text-[var(--neon-cyan)]">
                  ${formatPrice(priceNum)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
                <div className="text-sm font-mono font-bold text-[var(--neon-pink)]">
                  {formatMarketCap(marketCapNum)}
                </div>
              </div>
            </div>

            {/* 24h Change */}
            <div className="flex items-center gap-2 mb-3">
              <div className="text-xs text-muted-foreground">24h Change</div>
              <div
                className={`text-xs font-mono font-bold flex items-center gap-1 ${
                  isPositive ? "text-[var(--neon-green)]" : "text-[var(--neon-pink)]"
                }`}
              >
                {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(change24h).toFixed(2)}%
              </div>
            </div>

            {/* Bonding Curve Progress */}
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-1">Progress</div>
              <div className="w-full h-1.5 bg-border/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-pink)]"
                  style={{ width: `${(token.progress ?? 100) * 100}%` }}
                />
              </div>
            </div>

            {/* Graduated date */}
            {token.graduatedAt && (
              <div className="text-xs text-muted-foreground">
                Graduated {formatDate(new Date(token.graduatedAt))}
              </div>
            )}
          </div>
        </div>
      </a>
    </Link>
  );
}

export default function Home() {
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<SortBy>("marketCap");
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, refetch } = trpc.onmi.tokens.useQuery(
    { page, pageSize, sortBy, sortOrder, search: search || undefined },
    { refetchInterval: 30_000, staleTime: 15_000 }
  );

  const handleSort = useCallback(
    (col: SortBy) => {
      if (sortBy === col) {
        setSortOrder((o) => (o === "DESC" ? "ASC" : "DESC"));
      } else {
        setSortBy(col);
        setSortOrder("DESC");
      }
      setPage(0);
    },
    [sortBy]
  );

  const tokens = data?.tokens ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero stats bar */}
      <div className="border-b border-border/50 bg-card/30">
        <div className="container py-3 flex flex-wrap items-center gap-4 text-sm">
          <StatBadge
            icon={<Coins className="h-3.5 w-3.5" />}
            label="Graduated Tokens"
            value={total > 0 ? total.toLocaleString() : "—"}
            color="cyan"
          />
          <StatBadge
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Chain"
            value="LITVM Testnet"
            color="pink"
          />
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-green)] live-dot" />
            Auto-refresh every 30s
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Controls row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or symbol…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 bg-card border-border/60 focus:border-[var(--neon-cyan)]/50 focus:ring-[var(--neon-cyan)]/20 font-mono text-sm"
            />
          </div>

          {/* Sort buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={sortBy === "marketCap" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("marketCap")}
              className="text-xs"
            >
              Market Cap
              {sortBy === "marketCap" && (sortOrder === "DESC" ? <ArrowDown className="h-3 w-3 ml-1" /> : <ArrowUp className="h-3 w-3 ml-1" />)}
            </Button>
            <Button
              variant={sortBy === "price" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("price")}
              className="text-xs"
            >
              Price
              {sortBy === "price" && (sortOrder === "DESC" ? <ArrowDown className="h-3 w-3 ml-1" /> : <ArrowUp className="h-3 w-3 ml-1" />)}
            </Button>
            <Button
              variant={sortBy === "graduatedAt" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("graduatedAt")}
              className="text-xs"
            >
              Newest
              {sortBy === "graduatedAt" && (sortOrder === "DESC" ? <ArrowDown className="h-3 w-3 ml-1" /> : <ArrowUp className="h-3 w-3 ml-1" />)}
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Results info */}
        <div className="text-xs text-muted-foreground mb-4">
          Showing {(page * pageSize + 1).toLocaleString()}-{Math.min((page + 1) * pageSize, total).toLocaleString()} of {total.toLocaleString()} tokens
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[var(--neon-cyan)] border-t-transparent mb-3" />
              <p className="text-sm text-muted-foreground">Loading tokens…</p>
            </div>
          </div>
        )}

        {/* Token grid */}
        {!isLoading && tokens.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {tokens.map((token) => (
                <TokenCard key={token.address} token={token} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="text-xs"
                >
                  ← Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="text-xs"
                >
                  Next →
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!isLoading && tokens.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Coins className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No tokens found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
