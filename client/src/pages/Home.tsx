import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatPrice, formatMarketCap, formatDate, shortAddress } from "@/lib/format";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  Coins,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SortBy = "marketCap" | "price" | "graduatedAt" | "createdAt";
type SortOrder = "ASC" | "DESC";

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or symbol…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 bg-card border-border/60 focus:border-[var(--neon-cyan)]/50 focus:ring-[var(--neon-cyan)]/20 font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isFetching && !isLoading && (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[var(--neon-cyan)]" />
            )}
            <span>
              {total > 0 && (
                <>
                  Showing{" "}
                  <span className="text-foreground font-mono">
                    {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)}
                  </span>{" "}
                  of{" "}
                  <span className="text-[var(--neon-cyan)] font-mono">{total.toLocaleString()}</span>
                </>
              )}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-border/60 hover:border-[var(--neon-cyan)]/40 text-muted-foreground hover:text-foreground text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border/60 overflow-hidden bg-card/20">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-card/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-10">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground min-w-[200px]">
                    TOKEN
                  </th>
                  <SortHeader
                    label="PRICE"
                    col="price"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label="MARKET CAP"
                    col="marketCap"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    CONTRACT
                  </th>
                  <SortHeader
                    label="GRADUATED"
                    col="graduatedAt"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    align="right"
                  />
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground w-20">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="px-4 py-3">
                        <div className="skeleton h-4 w-6" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="skeleton h-9 w-9 rounded-full" />
                          <div className="space-y-1.5">
                            <div className="skeleton h-4 w-24" />
                            <div className="skeleton h-3 w-16" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="skeleton h-4 w-20 ml-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="skeleton h-4 w-24 ml-auto" />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="skeleton h-4 w-28 ml-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="skeleton h-4 w-16 ml-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="skeleton h-7 w-16 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : tokens.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                      {search ? `No tokens found for "${search}"` : "No graduated tokens found"}
                    </td>
                  </tr>
                ) : (
                  tokens.map((token, idx) => (
                    <TokenRow
                      key={token.address}
                      token={token}
                      rank={page * pageSize + idx + 1}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground font-mono">
              Page {page + 1} of {totalPages.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="border-border/60 text-xs px-2"
              >
                «
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="border-border/60 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>

              {/* Page number buttons */}
              {getPageNumbers(page, totalPages).map((p, i) =>
                p === -1 ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-xs">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                    className={`border-border/60 text-xs px-3 ${
                      p === page
                        ? "bg-[var(--neon-cyan)]/10 border-[var(--neon-cyan)]/40 text-[var(--neon-cyan)]"
                        : ""
                    }`}
                  >
                    {p + 1}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="border-border/60 text-xs"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className="border-border/60 text-xs px-2"
              >
                »
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  const colorMap = {
    cyan: "text-[var(--neon-cyan)]",
    pink: "text-[var(--neon-pink)]",
    green: "text-[var(--neon-green)]",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`${colorMap[color]}`}>{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-mono font-semibold ${colorMap[color]}`}>{value}</span>
    </div>
  );
}

function SortHeader({
  label,
  col,
  sortBy,
  sortOrder,
  onSort,
  align = "right",
}: {
  label: string;
  col: SortBy;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSort: (col: SortBy) => void;
  align?: "left" | "right";
}) {
  const active = sortBy === col;
  return (
    <th
      className={`px-4 py-3 text-xs font-medium text-${align} cursor-pointer select-none group`}
      onClick={() => onSort(col)}
    >
      <span
        className={`inline-flex items-center gap-1 ${
          active ? "text-[var(--neon-cyan)]" : "text-muted-foreground group-hover:text-foreground"
        } transition-colors`}
      >
        {align === "right" && (active ? (
          sortOrder === "DESC" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        ))}
        {label}
        {align === "left" && (active ? (
          sortOrder === "DESC" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        ))}
      </span>
    </th>
  );
}

function TokenRow({ token, rank }: { token: any; rank: number }) {
  return (
    <tr className="border-b border-border/30 table-row-hover transition-colors cursor-pointer group">
      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{rank}</td>
      <td className="px-4 py-3">
        <Link href={`/token/${token.address}`} className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 rounded-full overflow-hidden bg-muted border border-border/60">
            {token.image ? (
              <img
                src={token.image}
                alt={token.symbol}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                {token.symbol?.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate max-w-[160px] group-hover:text-[var(--neon-cyan)] transition-colors">
              {token.name}
            </div>
            <div className="text-xs text-muted-foreground font-mono">{token.symbol}</div>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-sm text-foreground">
          {formatPrice(token.price)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-sm font-semibold text-[var(--neon-cyan)]">
          {formatMarketCap(token.marketCap)}
        </span>
      </td>
      <td className="px-4 py-3 text-right hidden lg:table-cell">
        <span className="font-mono text-xs text-muted-foreground">
          {shortAddress(token.address)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-xs text-muted-foreground font-mono">
          {formatDate(token.graduatedAt)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/token/${token.address}`}
          className="inline-flex items-center gap-1 rounded border border-[var(--neon-cyan)]/20 bg-[var(--neon-cyan)]/5 px-2.5 py-1 text-xs text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10 hover:border-[var(--neon-cyan)]/40 transition-colors font-mono"
        >
          View
          <ExternalLink className="h-3 w-3" />
        </Link>
      </td>
    </tr>
  );
}

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages: number[] = [];
  pages.push(0);
  if (current > 2) pages.push(-1);
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 3) pages.push(-1);
  pages.push(total - 1);
  return pages;
}
