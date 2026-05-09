import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

const ONMI_API = "https://api.onmi.fun/api";
const CHAIN_ID = 4441;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnmiToken {
  address: string;
  name: string;
  symbol: string;
  image: string;
  description: string;
  website: string;
  twitter: string;
  telegram: string;
  price: string;
  marketCap: string;
  highestMarketCap: string;
  totalSupply: string;
  isGraduated: boolean;
  isLocked: boolean;
  graduatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  pairAddress: string | null;
  creatorAddress: string;
  creatorProfile: { username?: string; avatarUrl?: string };
  bondingCurveManager: string;
  virtualEth: string;
  virtualTokens: string;
  targetTokens: string;
  realTokenReserve: string;
  txnHash: string;
  blockNumber: number;
  progress: number;
}

export interface OnmiTrade {
  id: string;
  chainId: number;
  txnHash: string;
  blockNumber: number;
  token: string;
  trader: string;
  tradeType: number; // 0 = buy, 1 = sell
  amountIn: string;
  amountOut: string;
  timestamp: string;
  blockTimestamp: string;
  createdAt: string;
  tokenName: string;
  tokenSymbol: string;
  imageUrl: string;
  profile: { username?: string; avatarUrl?: string };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function fetchOnmi(path: string): Promise<unknown> {
  const url = `${ONMI_API}${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`onmi.fun API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const onmiRouter = router({
  /**
   * List graduated tokens with pagination, sorting, and search.
   */
  tokens: publicProcedure
    .input(
      z.object({
        page: z.number().int().min(0).default(0),
        pageSize: z.number().int().min(1).max(50).default(20),
        sortBy: z.enum(["marketCap", "price", "graduatedAt", "createdAt"]).default("marketCap"),
        sortOrder: z.enum(["ASC", "DESC"]).default("DESC"),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, sortBy, sortOrder, search } = input;
      const start = page * pageSize;
      const end = start + pageSize;

      const params = new URLSearchParams({
        chainId: String(CHAIN_ID),
        _start: String(start),
        _end: String(end),
        isGraduated: "true",
        _sort: sortBy,
        _order: sortOrder,
      });

      if (search && search.trim()) {
        params.set("search", search.trim());
      }

      const data = (await fetchOnmi(`/tokens/getToken?${params.toString()}`)) as {
        token: OnmiToken[];
        totalToken: number;
      };

      return {
        tokens: data.token ?? [],
        total: data.totalToken ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((data.totalToken ?? 0) / pageSize),
      };
    }),

  /**
   * Get a single token by its contract address.
   */
  tokenDetail: publicProcedure
    .input(z.object({ address: z.string() }))
    .query(async ({ input }) => {
      const params = new URLSearchParams({
        chainId: String(CHAIN_ID),
        address: input.address,
      });
      const data = (await fetchOnmi(`/tokens/getToken?${params.toString()}`)) as {
        token: OnmiToken[];
        totalToken: number;
      };
      const token = data.token?.[0] ?? null;
      if (!token) throw new Error("Token not found");
      return token;
    }),

  /**
   * Get latest trades across all tokens on the LITVM chain.
   */
  trades: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(20),
        tokenAddress: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const params = new URLSearchParams({
        chainId: String(CHAIN_ID),
      });
      if (input.tokenAddress) {
        params.set("token", input.tokenAddress);
      }
      const data = (await fetchOnmi(`/trades/latest?${params.toString()}`)) as OnmiTrade[];
      const trades = Array.isArray(data) ? data.slice(0, input.limit) : [];
      return trades;
    }),

  /**
   * Get token trades for a specific token address.
   * Uses trades/latest with token filter (confirmed working endpoint).
   */
  tokenTrades: publicProcedure
    .input(
      z.object({
        address: z.string(),
        page: z.number().int().min(0).default(0),
        pageSize: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      // trades/latest supports token filter and returns all trades for that token
      const params = new URLSearchParams({
        chainId: String(CHAIN_ID),
        token: input.address,
      });
      const data = (await fetchOnmi(`/trades/latest?${params.toString()}`)) as OnmiTrade[];
      const allTrades = Array.isArray(data) ? data : [];
      const start = input.page * input.pageSize;
      const end = start + input.pageSize;
      return {
        trades: allTrades.slice(start, end),
        total: allTrades.length,
      };
    }),
});
