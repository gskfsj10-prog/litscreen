import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const caller = appRouter.createCaller(createCtx());

describe("onmi.tokens", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns paginated graduated tokens", async () => {
    const mockToken = {
      address: "0xabc",
      name: "TestCoin",
      symbol: "TC",
      image: "",
      description: "",
      website: "",
      twitter: "",
      telegram: "",
      price: "0.001",
      marketCap: "100000",
      highestMarketCap: "200000",
      totalSupply: "1000000000000000000000000",
      isGraduated: true,
      isLocked: false,
      graduatedAt: "2024-01-01T00:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      pairAddress: "0xpair",
      creatorAddress: "0xcreator",
      creatorProfile: {},
      bondingCurveManager: "0xbcm",
      virtualEth: "1000000000000000000",
      virtualTokens: "1000000000000000000000000",
      targetTokens: "800000000000000000000000",
      realTokenReserve: "500000000000000000000000",
      txnHash: "0xtx",
      blockNumber: 1,
      progress: 100,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: [mockToken], totalToken: 1 }),
    });

    const result = await caller.onmi.tokens({ page: 0, pageSize: 20, sortBy: "marketCap", sortOrder: "DESC" });

    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].name).toBe("TestCoin");
    expect(result.total).toBe(1);
    expect(result.page).toBe(0);
    expect(result.totalPages).toBe(1);
  });

  it("passes search param when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: [], totalToken: 0 }),
    });

    await caller.onmi.tokens({ page: 0, pageSize: 20, sortBy: "marketCap", sortOrder: "DESC", search: "pepe" });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("search=pepe");
    expect(calledUrl).toContain("isGraduated=true");
    expect(calledUrl).toContain("chainId=4441");
  });

  it("handles API errors gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(
      caller.onmi.tokens({ page: 0, pageSize: 20, sortBy: "marketCap", sortOrder: "DESC" })
    ).rejects.toThrow("onmi.fun API error: 500");
  });
});

describe("onmi.trades", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns latest trades", async () => {
    const mockTrade = {
      id: "t1",
      chainId: 4441,
      txnHash: "0xtx1",
      blockNumber: 100,
      token: "0xtoken",
      trader: "0xtrader",
      tradeType: 0,
      amountIn: "1000000000000000000",
      amountOut: "500000000000000000000",
      timestamp: "1700000000",
      blockTimestamp: "1700000000",
      createdAt: "2024-01-01T00:00:00Z",
      tokenName: "TestCoin",
      tokenSymbol: "TC",
      imageUrl: "",
      profile: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockTrade],
    });

    const result = await caller.onmi.trades({ limit: 20 });

    expect(result).toHaveLength(1);
    expect(result[0].tokenName).toBe("TestCoin");
    expect(result[0].tradeType).toBe(0);
  });

  it("uses chainId=4441 in the request URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await caller.onmi.trades({ limit: 10 });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("chainId=4441");
    expect(calledUrl).toContain("trades/latest");
  });
});

describe("onmi.tokenTrades", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns trades for a specific token using trades/latest with token filter", async () => {
    const mockTrade = {
      id: "t1",
      chainId: 4441,
      txnHash: "0xtx1",
      blockNumber: 100,
      token: "0xtoken",
      trader: "0xtrader",
      tradeType: 1,
      amountIn: "2000000000000000000",
      amountOut: "100000000000000000000",
      timestamp: "1700000000",
      blockTimestamp: "1700000000",
      createdAt: "2024-01-01T00:00:00Z",
      tokenName: "TestCoin",
      tokenSymbol: "TC",
      imageUrl: "",
      profile: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockTrade, mockTrade],
    });

    const result = await caller.onmi.tokenTrades({ address: "0xtoken", page: 0, pageSize: 20 });

    expect(result.trades).toHaveLength(2);
    expect(result.total).toBe(2);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("trades/latest");
    expect(calledUrl).toContain("token=0xtoken");
    expect(calledUrl).toContain("chainId=4441");
  });
});

describe("onmi.tokenDetail", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns a single token by address", async () => {
    const mockToken = {
      address: "0xabc123",
      name: "MoonCoin",
      symbol: "MOON",
      image: "",
      description: "To the moon",
      website: "https://moon.com",
      twitter: "@moon",
      telegram: "t.me/moon",
      price: "0.005",
      marketCap: "500000",
      highestMarketCap: "1000000",
      totalSupply: "1000000000000000000000000",
      isGraduated: true,
      isLocked: false,
      graduatedAt: "2024-03-01T00:00:00Z",
      createdAt: "2024-02-01T00:00:00Z",
      updatedAt: "2024-03-01T00:00:00Z",
      pairAddress: "0xpair123",
      creatorAddress: "0xcreator123",
      creatorProfile: { username: "alice" },
      bondingCurveManager: "0xbcm123",
      virtualEth: "2000000000000000000",
      virtualTokens: "2000000000000000000000000",
      targetTokens: "800000000000000000000000",
      realTokenReserve: "400000000000000000000000",
      txnHash: "0xtx123",
      blockNumber: 200,
      progress: 100,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: [mockToken], totalToken: 1 }),
    });

    const result = await caller.onmi.tokenDetail({ address: "0xabc123" });

    expect(result.name).toBe("MoonCoin");
    expect(result.symbol).toBe("MOON");
    expect(result.isGraduated).toBe(true);
  });

  it("throws when token not found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: [], totalToken: 0 }),
    });

    await expect(caller.onmi.tokenDetail({ address: "0xnotfound" })).rejects.toThrow("Token not found");
  });
});
