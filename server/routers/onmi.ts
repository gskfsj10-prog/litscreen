import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

const CHAIN_ID = 4441;
const API_BASE = "https://api.onmi.fun/api";

interface OnmiToken {
  address: string;
  name: string;
  symbol: string;
  image?: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  price: string;
  marketCap: string;
  highestMarketCap?: string;
  totalSupply: string;
  isGraduated: boolean;
  isLocked?: boolean;
  graduatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  pairAddress?: string;
  creatorAddress?: string;
  creatorProfile?: Record<string, unknown>;
  bondingCurveManager?: string;
  virtualEth?: string;
  virtualTokens?: string;
  targetTokens?: string;
  realTokenReserve?: string;
  txnHash?: string;
  blockNumber?: number;
  progress?: number;
}

interface OnmiTrade {
  id?: string;
  chainId: number;
  txnHash: string;
  blockNumber: number;
  token: string;
  trader: string;
  tradeType: number;
  amountIn: string;
  amountOut: string;
  timestamp?: string;
  blockTimestamp?: string;
  createdAt?: string;
  tokenName?: string;
  tokenSymbol?: string;
  imageUrl?: string;
  profile?: Record<string, unknown>;
}

async function fetchOnmi(endpoint: string) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`onmi.fun API error: ${response.status}`);
  }
  return response.json();
}

export const onmiRouter = router({
  /**
   * Get paginated list of graduated tokens with sorting and filtering.
   */
  tokens: publicProcedure
    .input(
      z.object({
        page: z.number().int().min(0).default(0),
        pageSize: z.number().int().min(1).max(100).default(20),
        sortBy: z.enum(["marketCap", "price", "graduatedAt"]).default("marketCap"),
        sortOrder: z.enum(["ASC", "DESC"]).default("DESC"),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const params = new URLSearchParams({
        chainId: String(CHAIN_ID),
        isGraduated: "true",
        _start: String(input.page * input.pageSize),
        _end: String((input.page + 1) * input.pageSize),
        _sort: input.sortBy,
        _order: input.sortOrder,
      });

      if (input.search) {
        params.append("search", input.search);
      }

      const data = (await fetchOnmi(`/tokens/getToken?${params.toString()}`)) as {
        token: OnmiToken[];
        totalToken: number;
      };

      const pageSize = input.pageSize;
      return {
        tokens: data.token ?? [],
        total: data.totalToken ?? 0,
        page: input.page,
        pageSize,
        totalPages: Math.ceil((data.totalToken ?? 0) / pageSize),
      };
    }),

  /**
   * Get a single token by its contract address.
   * NOTE: onmi.fun's address & search parameters don't work.
   * We fetch tokens in batches until we find the matching address.
   */
  tokenDetail: publicProcedure
    .input(z.object({ address: z.string() }))
    .query(async ({ input }) => {
      const targetAddress = input.address.toLowerCase();
      const batchSize = 100;
      let found: OnmiToken | null = null;
      let offset = 0;

      // Fetch tokens in batches until we find the one matching the address
      while (!found && offset < 10000) {
        const params = new URLSearchParams({
          chainId: String(CHAIN_ID),
          isGraduated: "true",
          _start: String(offset),
          _end: String(offset + batchSize),
          _sort: "marketCap",
          _order: "DESC",
        });
        const data = (await fetchOnmi(`/tokens/getToken?${params.toString()}`)) as {
          token: OnmiToken[];
          totalToken: number;
        };

        const tokens = data.token ?? [];
        if (tokens.length === 0) break;

        // Search for the token in this batch
        found = tokens.find((t) => t.address.toLowerCase() === targetAddress) ?? null;
        offset += batchSize;
      }

      if (!found) throw new Error("Token not found");
      return found;
    }),

  /**
   * Get latest trades across all tokens on the LITVM chain.
   */
  trades: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      const params = new URLSearchParams({
        chainId: String(CHAIN_ID),
      });
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
