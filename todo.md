# Litscreen TODO

## Backend API
- [x] Backend proxy: tRPC onmi.tokens — fetch graduated tokens from onmi.fun with pagination, sort, filter
- [x] Backend proxy: tRPC onmi.tokenDetail — fetch single token detail (fixed: batch fetch to work around broken onmi.fun API)
- [x] Backend proxy: tRPC onmi.trades — fetch latest trades from onmi.fun

## Frontend Foundation
- [x] Dark cyberpunk theme (neon accents, monospace fonts for numbers)
- [x] Sticky top navigation bar branded "Litscreen"
- [x] Responsive layout (mobile-friendly)
- [x] Global CSS variables and font setup

## Token Listing Page
- [x] DexScreener-style data table with: name, symbol, logo, price, market cap, graduation date
- [x] Redesigned to card grid layout (4 columns, 20 tokens per page) matching reference design
- [x] Sorting controls: by market cap, price, graduation date
- [x] Search/filter by name or symbol
- [x] Pagination for 114,770+ graduated tokens
- [x] Auto-refresh polling for live price/market cap updates
- [x] Each card shows: logo, name, symbol, creator, price, market cap, 24h change, progress bar

## Token Detail Page
- [x] Full token info: name, symbol, description, image
- [x] Social links: Twitter, Telegram, website
- [x] Pair address and contract address display
- [x] Bonding curve data display
- [x] Trade history table for the token

## Real-time Trades Feed
- [x] Latest trades feed panel (uses api/trades/latest?chainId=4441)
- [x] Auto-polling trades feed

## Bug Fixes
- [x] Fixed token detail page showing wrong token — onmi.fun's address filter was broken, implemented batch fetching workaround

## Tests
- [x] Vitest: backend tokens proxy route
- [x] Vitest: backend trades proxy route
- [x] Vitest: backend tokenTrades proxy route
