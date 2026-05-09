import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  formatPrice,
  formatMarketCap,
  formatDate,
  shortAddress,
  formatEth,
  formatTimestamp,
  formatTokenAmount,
} from "@/lib/format";
import {
  ArrowLeft,
  ExternalLink,
  Twitter,
  Globe,
  MessageCircle,
  Copy,
  Check,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Coins,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TokenDetail() {
  const params = useParams<{ address: string }>();
  const address = params.address ?? "";

  const { data: token, isLoading, error, refetch, isFetching } = trpc.onmi.tokenDetail.useQuery(
    { address },
    { enabled: !!address, refetchInterval: 30_000, staleTime: 15_000 }
  );

  const [tradePage, setTradePage] = useState(0);
  const tradePageSize = 20;

  const { data: tradeData, isLoading: tradesLoading } = trpc.onmi.tokenTrades.useQuery(
    { address, page: tradePage, pageSize: tradePageSize },
    { enabled: !!address, refetchInterval: 15_000, staleTime: 10_000 }
  );

  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (isLoading) return <TokenDetailSkeleton />;

  if (error || !token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Token not found or failed to load.</p>
          <Link href="/">
            <Button variant="outline" className="border-border/60">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tokens
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const trades = tradeData?.trades ?? [];
  const tradeTotal = tradeData?.total ?? trades.length;
  const tradeTotalPages = Math.max(1, Math.ceil(tradeTotal / tradePageSize));

  // Bonding curve progress
  const progress = token.progress ?? 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 space-y-6">
        {/* Back nav */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              All Tokens
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-border/60 text-xs text-muted-foreground hover:text-foreground"
          >
            {isFetching ? (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            )}
            Refresh
          </Button>
        </div>

        {/* Token header */}
        <div className="rounded-lg border border-border/60 bg-card/30 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Logo */}
            <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/60">
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
                <div className="h-full w-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                  {token.symbol?.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name & badges */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{token.name}</h1>
                <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {token.symbol}
                </span>
                {token.isGraduated && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded border border-[var(--neon-green)]/30 bg-[var(--neon-green)]/10 text-[var(--neon-green)] font-mono">
                    GRADUATED
                  </span>
                )}
              </div>
              {token.description && (
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl line-clamp-3">
                  {token.description}
                </p>
              )}

              {/* Social links */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {token.twitter && (
                  <SocialLink
                    href={token.twitter.startsWith("http") ? token.twitter : `https://twitter.com/${token.twitter}`}
                    icon={<Twitter className="h-3.5 w-3.5" />}
                    label="Twitter"
                  />
                )}
                {token.telegram && (
                  <SocialLink
                    href={token.telegram.startsWith("http") ? token.telegram : `https://t.me/${token.telegram}`}
                    icon={<MessageCircle className="h-3.5 w-3.5" />}
                    label="Telegram"
                  />
                )}
                {token.website && (
                  <SocialLink
                    href={token.website.startsWith("http") ? token.website : `https://${token.website}`}
                    icon={<Globe className="h-3.5 w-3.5" />}
                    label="Website"
                  />
                )}
                <a
                  href={`https://liteforge.explorer.caldera.xyz/address/${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded border border-border/60 bg-card/60 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-[var(--neon-cyan)]/40 transition-colors font-mono"
                >
                  <ExternalLink className="h-3 w-3" />
                  Explorer
                </a>
                <a
                  href={`https://app.onmi.fun/?chain=LITVM&token=${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded border border-[var(--neon-cyan)]/20 bg-[var(--neon-cyan)]/5 px-2.5 py-1 text-xs text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10 transition-colors font-mono"
                >
                  <ExternalLink className="h-3 w-3" />
                  Trade on onmi.fun
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Price"
            value={formatPrice(token.price)}
            color="cyan"
            mono
          />
          <StatCard
            icon={<Coins className="h-4 w-4" />}
            label="Market Cap"
            value={formatMarketCap(token.marketCap)}
            color="pink"
            mono
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="ATH Market Cap"
            value={formatMarketCap(token.highestMarketCap)}
            color="yellow"
            mono
          />
          <StatCard
            icon={<Activity className="h-4 w-4" />}
            label="Graduated"
            value={formatDate(token.graduatedAt)}
            color="green"
          />
        </div>

        {/* Two-column: addresses + bonding curve */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Addresses */}
          <div className="rounded-lg border border-border/60 bg-card/30 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Addresses
            </h2>
            <AddressRow
              label="Contract"
              address={token.address}
              onCopy={() => copyToClipboard(token.address, "Contract address")}
              copied={copied === "Contract address"}
              explorerBase="https://liteforge.explorer.caldera.xyz/address"
            />
            {token.pairAddress && (
              <AddressRow
                label="Pair"
                address={token.pairAddress}
                onCopy={() => copyToClipboard(token.pairAddress!, "Pair address")}
                copied={copied === "Pair address"}
                explorerBase="https://liteforge.explorer.caldera.xyz/address"
              />
            )}
            <AddressRow
              label="Creator"
              address={token.creatorAddress}
              onCopy={() => copyToClipboard(token.creatorAddress, "Creator address")}
              copied={copied === "Creator address"}
              explorerBase="https://liteforge.explorer.caldera.xyz/address"
            />
            <AddressRow
              label="Bonding Curve"
              address={token.bondingCurveManager}
              onCopy={() => copyToClipboard(token.bondingCurveManager, "Bonding curve")}
              copied={copied === "Bonding curve"}
              explorerBase="https://liteforge.explorer.caldera.xyz/address"
            />
          </div>

          {/* Bonding curve data */}
          <div className="rounded-lg border border-border/60 bg-card/30 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Bonding Curve
            </h2>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-mono text-[var(--neon-cyan)]">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-green)] transition-all"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <DataRow label="Virtual ETH" value={formatEth(token.virtualEth)} />
              <DataRow label="Real Token Reserve" value={formatTokenAmount(token.realTokenReserve) + " " + token.symbol} />
              <DataRow label="Target Tokens" value={formatTokenAmount(token.targetTokens) + " " + token.symbol} />
              <DataRow label="Total Supply" value={formatTokenAmount(token.totalSupply) + " " + token.symbol} />
              <DataRow
                label="Created"
                value={formatDate(token.createdAt)}
              />
              {token.creatorProfile?.username && (
                <DataRow label="Creator" value={token.creatorProfile.username} />
              )}
            </div>
          </div>
        </div>

        {/* Trade history */}
        <div className="rounded-lg border border-border/60 bg-card/20 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-card/40">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--neon-green)]" />
              <h2 className="text-sm font-semibold text-foreground">Trade History</h2>
              {tradeTotal > 0 && (
                <span className="text-xs text-muted-foreground font-mono">
                  ({tradeTotal.toLocaleString()} trades)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-green)] live-dot" />
              Live
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-card/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">TYPE</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">AMOUNT IN</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden md:table-cell">TRADER</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">TIME</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden lg:table-cell">TX HASH</th>
                </tr>
              </thead>
              <tbody>
                {tradesLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/30">
                        <td className="px-4 py-3"><div className="skeleton h-5 w-12" /></td>
                        <td className="px-4 py-3"><div className="skeleton h-4 w-24 ml-auto" /></td>
                        <td className="px-4 py-3 hidden md:table-cell"><div className="skeleton h-4 w-24 ml-auto" /></td>
                        <td className="px-4 py-3"><div className="skeleton h-4 w-16 ml-auto" /></td>
                        <td className="px-4 py-3 hidden lg:table-cell"><div className="skeleton h-4 w-24 ml-auto" /></td>
                      </tr>
                    ))
                  : trades.length === 0
                  ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">
                          No trade history available
                        </td>
                      </tr>
                    )
                  : trades.map((trade: any) => (
                      <tr key={trade.id ?? trade.txnHash} className="border-b border-border/30 table-row-hover">
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold font-mono ${
                              trade.tradeType === 0
                                ? "bg-[var(--neon-green)]/10 text-[var(--neon-green)] border border-[var(--neon-green)]/20"
                                : "bg-[var(--neon-red)]/10 text-[var(--neon-red)] border border-[var(--neon-red)]/20"
                            }`}
                          >
                            {trade.tradeType === 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {trade.tradeType === 0 ? "BUY" : "SELL"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-foreground">
                          {formatEth(trade.amountIn)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
                          {shortAddress(trade.trader)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                          {formatTimestamp(trade.blockTimestamp)}
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <a
                            href={`https://liteforge.explorer.caldera.xyz/tx/${trade.txnHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-[var(--neon-cyan)] hover:underline"
                          >
                            {shortAddress(trade.txnHash, 4)}
                          </a>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Trade pagination */}
          {tradeTotalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/60">
              <span className="text-xs text-muted-foreground font-mono">
                Page {tradePage + 1} of {tradeTotalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTradePage((p) => Math.max(0, p - 1))}
                  disabled={tradePage === 0}
                  className="border-border/60 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTradePage((p) => Math.min(tradeTotalPages - 1, p + 1))}
                  disabled={tradePage >= tradeTotalPages - 1}
                  className="border-border/60 text-xs"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "cyan" | "pink" | "green" | "yellow";
  mono?: boolean;
}) {
  const colorMap = {
    cyan: "text-[var(--neon-cyan)]",
    pink: "text-[var(--neon-pink)]",
    green: "text-[var(--neon-green)]",
    yellow: "text-[var(--neon-yellow)]",
  };
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-4">
      <div className={`flex items-center gap-1.5 text-xs text-muted-foreground mb-2`}>
        <span className={colorMap[color]}>{icon}</span>
        {label}
      </div>
      <div className={`text-lg font-bold ${colorMap[color]} ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function AddressRow({
  label,
  address,
  onCopy,
  copied,
  explorerBase,
}: {
  label: string;
  address: string;
  onCopy: () => void;
  copied: boolean;
  explorerBase: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-mono text-xs text-foreground truncate">{shortAddress(address, 6)}</span>
        <button
          onClick={onCopy}
          className="shrink-0 text-muted-foreground hover:text-[var(--neon-cyan)] transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[var(--neon-green)]" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <a
          href={`${explorerBase}/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-muted-foreground hover:text-[var(--neon-cyan)] transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-sm text-foreground truncate">{value}</div>
    </div>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded border border-border/60 bg-card/60 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-[var(--neon-cyan)]/40 transition-colors"
    >
      {icon}
      {label}
    </a>
  );
}

function TokenDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 space-y-6">
        <div className="skeleton h-8 w-24" />
        <div className="rounded-lg border border-border/60 bg-card/30 p-5">
          <div className="flex gap-4">
            <div className="skeleton h-16 w-16 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-7 w-48" />
              <div className="skeleton h-4 w-full max-w-md" />
              <div className="skeleton h-4 w-64" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-2">
              <div className="skeleton h-3 w-16" />
              <div className="skeleton h-6 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
