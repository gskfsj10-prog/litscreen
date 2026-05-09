/**
 * Format a price value with appropriate decimal places.
 */
export function formatPrice(price: string | number): string {
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(n)) return "—";
  if (n === 0) return "$0.00";

  if (n >= 1) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  if (n >= 0.000001) return `$${n.toFixed(8)}`;

  // Very small numbers: use scientific-like notation
  const str = n.toFixed(12).replace(/0+$/, "");
  return `$${str}`;
}

/**
 * Format a market cap value with K/M/B suffix.
 */
export function formatMarketCap(mc: string | number): string {
  const n = typeof mc === "string" ? parseFloat(mc) : mc;
  if (isNaN(n)) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

/**
 * Shorten a hex address: 0x1234...abcd
 */
export function shortAddress(address: string, chars = 4): string {
  if (!address || address.length < 10) return address ?? "—";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a date string to a relative time or absolute date.
 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = Date.now();
  const diff = now - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

/**
 * Format a timestamp (unix seconds) to relative time.
 */
export function formatTimestamp(ts: string | number): string {
  const n = typeof ts === "string" ? parseInt(ts) : ts;
  if (isNaN(n)) return "—";
  return formatDate(new Date(n * 1000).toISOString());
}

/**
 * Format a large token amount (wei-like with 18 decimals) to a readable number.
 */
export function formatTokenAmount(amount: string, decimals = 18): string {
  try {
    const n = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const whole = n / divisor;
    const frac = n % divisor;
    const fracStr = frac.toString().padStart(decimals, "0").slice(0, 2);
    const wholeNum = Number(whole);
    if (wholeNum >= 1_000_000_000) return `${(wholeNum / 1_000_000_000).toFixed(1)}B`;
    if (wholeNum >= 1_000_000) return `${(wholeNum / 1_000_000).toFixed(1)}M`;
    if (wholeNum >= 1_000) return `${(wholeNum / 1_000).toFixed(1)}K`;
    return `${wholeNum}.${fracStr}`;
  } catch {
    return "—";
  }
}

/**
 * Format ETH amount (18 decimals) to readable zkLTC value.
 */
export function formatEth(amount: string): string {
  return formatTokenAmount(amount, 18) + " zkLTC";
}

/**
 * Get trade type label.
 */
export function tradeTypeLabel(type: number): "BUY" | "SELL" {
  return type === 0 ? "BUY" : "SELL";
}
