# Litscreen TODO

## Backend API
- [x] Backend proxy: GET /api/tokens — fetch graduated tokens from onmi.fun with pagination, sort, filter
- [x] Backend proxy: GET /api/tokens/:address — fetch single token detail
- [x] Backend proxy: GET /api/trades — fetch latest trades from onmi.fun

## Frontend Foundation
- [x] Dark cyberpunk theme (neon accents, monospace fonts for numbers)
- [x] Sticky top navigation bar branded "Litscreen"
- [x] Responsive layout (mobile-friendly)
- [x] Global CSS variables and font setup

## Token Listing Page
- [x] DexScreener-style data table with: name, symbol, logo, price, market cap, graduation date
- [x] Sorting controls: by market cap, price, graduation date
- [x] Search/filter by name or symbol
- [x] Pagination / infinite scroll for 109,000+ tokens
- [x] Auto-refresh polling for live price/market cap updates

## Token Detail Page
- [x] Full token info: name, symbol, description, image
- [x] Social links: Twitter, Telegram, website
- [x] Pair address and contract address display
- [x] Bonding curve data display
- [x] Trade history table for the token

## Real-time Trades Feed
- [x] Latest trades feed panel (uses api/trades/latest?chainId=4441)
- [x] Auto-polling trades feed

## Tests
- [x] Vitest: backend tokens proxy route
- [x] Vitest: backend trades proxy route
