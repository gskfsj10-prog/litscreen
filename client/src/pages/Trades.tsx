import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatPrice, formatEth, formatTimestamp, shortAddress } from "@/lib/format";
import { Activity, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Trades() {
  const [limit] = useState(30);

  const { data: trades, isLoading, isFetching, refetch, dataUpdatedAt } = trpc.onmi.trades.useQuery(
    { limit },
    { refetchInterval: 10_000, staleTime: 5_000 }
  );

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30">
              <Activity className="h-5 w-5 text-[var(--neon-green)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Live Trades</h1>
              <p className="text-xs text-muted-foreground font-mono">
                api/trades/latest?chainId=4441 · auto-refresh 10s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground font-mono hidden sm:block">
                Updated {lastUpdated}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-border/60 hover:border-[var(--neon-green)]/40 text-muted-foreground hover:text-foreground text-xs"
            >
              {isFetching ? (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-[var(--neon-green)] live-dot" />
          <span>LIVE — LITVM Chain (4441)</span>
        </div>

        {/* Trades table */}
        <div className="rounded-lg border border-border/60 overflow-hidden bg-card/20">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-card/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">TYPE</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground min-w-[160px]">TOKEN</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">AMOUNT IN</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden md:table-cell">TRADER</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">TIME</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden lg:table-cell">TX</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/30">
                        <td className="px-4 py-3"><div className="skeleton h-5 w-12" /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="skeleton h-7 w-7 rounded-full" />
                            <div className="skeleton h-4 w-20" />
                          </div>
                        </td>
                        <td className="px-4 py-3"><div className="skeleton h-4 w-24 ml-auto" /></td>
                        <td className="px-4 py-3 hidden md:table-cell"><div className="skeleton h-4 w-24 ml-auto" /></td>
                        <td className="px-4 py-3"><div className="skeleton h-4 w-16 ml-auto" /></td>
                        <td className="px-4 py-3 hidden lg:table-cell"><div className="skeleton h-4 w-24 ml-auto" /></td>
                      </tr>
                    ))
                  : (trades ?? []).map((trade) => (
                      <TradeRow key={trade.id} trade={trade} />
                    ))}
                {!isLoading && (!trades || trades.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                      No trades found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function TradeRow({ trade }: { trade: any }) {
  const isBuy = trade.tradeType === 0;
  return (
    <tr className="border-b border-border/30 table-row-hover transition-colors">
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold font-mono ${
            isBuy
              ? "bg-[var(--neon-green)]/10 text-[var(--neon-green)] border border-[var(--neon-green)]/20"
              : "bg-[var(--neon-red)]/10 text-[var(--neon-red)] border border-[var(--neon-red)]/20"
          }`}
        >
          {isBuy ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {isBuy ? "BUY" : "SELL"}
        </span>
      </td>
      <td className="px-4 py-3">
        <Link href={`/token/${trade.token}`} className="flex items-center gap-2 group">
          <div className="h-7 w-7 shrink-0 rounded-full overflow-hidden bg-muted border border-border/60">
            {trade.imageUrl && !trade.imageUrl.includes('.json') ? (
              <img
                src={trade.imageUrl}
                alt={trade.tokenSymbol}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                {trade.tokenSymbol?.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <span className="font-semibold text-foreground group-hover:text-[var(--neon-cyan)] transition-colors text-sm">
              {trade.tokenName}
            </span>
            <span className="ml-1.5 text-xs text-muted-foreground font-mono">{trade.tokenSymbol}</span>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-sm text-foreground">
          {formatEth(trade.amountIn)}
        </span>
      </td>
      <td className="px-4 py-3 text-right hidden md:table-cell">
        <span className="font-mono text-xs text-muted-foreground">
          {shortAddress(trade.trader)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-xs text-muted-foreground">
          {formatTimestamp(trade.blockTimestamp)}
        </span>
      </td>
      <td className="px-4 py-3 text-right hidden lg:table-cell">
        <a
          href={`https://liteforge.explorer.caldera.xyz/tx/${trade.txnHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-[var(--neon-cyan)] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {shortAddress(trade.txnHash, 4)}
        </a>
      </td>
    </tr>
  );
}
