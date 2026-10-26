# Permitted Third-Party Review Cache (`data/viator-reviews/`)

This directory stores synced, permitted third-party review snapshots (`data/viator-reviews/{productCode}.json`) consumed at runtime by the DCC review summarizer (`lib/dcc/guestFeedback.ts`).

## 1. Zero-Fixture Production Policy

- **No sample or fabricated reviews:** Production execution paths never read test fixtures and never synthesize review summaries from product titles, categories, star ratings, or canned templates.
- **Honest unavailable state when cache is absent:** Until valid Viator Partner API `/reviews/product` access is provisioned and synced into `data/viator-reviews/{productCode}.json`, `loadPermittedThirdPartyReviewCacheForProduct()` returns `checkStatus: "unavailable"` (`state: "unavailable"`, `"Recent reviews unavailable"`). It never turns a missing or failed request into `"No recent reviews found"` and never retries live API calls with a known-invalid key.

## 2. Serverless Bundle & File Tracing Configuration (`next.config.mjs`)

- **Narrow exclusion (`./data/memory/snapshots/**/*` only):** `next.config.mjs` does **not** exclude `data/**` broadly. Only `./data/memory/snapshots/**/*` (and non-runtime directories such as `./scratch/**/*`, `./apps/**/*`, `./assets/raw/**/*`, `./public/images/**/*`, `./docs/**/*`, `./tests/**/*`, `./legacy_vault/**/*`) are listed in `outputFileTracingExcludes`. All runtime `data/` subdirectories required by DCC routes (`data/nodes`, `data/cities`, `data/destinations`, `data/network`, `data/graph`, `data/handoffs`, `data/viator-verified-cache`, `data/viator-reviews`, etc.) remain intact.
- **Explicit trace inclusion (`outputFileTracingIncludes`):** Because `loadPermittedThirdPartyReviewCacheForProduct()` in `lib/dcc/guestFeedback.ts` uses dynamic `process.getBuiltinModule("fs")` (so dual server/client modules do not pull `node:fs` into browser bundles), `next.config.mjs` explicitly includes `./data/viator-reviews/**/*` in `outputFileTracingIncludes` for `/juneau`, `/ports/juneau`, `/alaska`, and `/api/location/[lat]/[lng]`.

## 3. How Real Review Records Reach Production Once Access Is Restored

1. **Provision Viator Partner API Credentials:** Set a valid `VIATOR_API_KEY` with Partner API v2 `/reviews/product` access in the environment.
2. **Sync Product Reviews via `ViatorClient.getProductReviews(productCode)`:**
   - `ViatorClient.getProductReviews(productCode)` in `lib/viator/client.ts` POSTs to `/reviews/product`, normalizes each review via `normalizeReview()` (`reviewId`, `provider`, `publishedDate`, `rating`, `title`, `text`, `userName`), and calls `writeViatorReviewCache(productCode, reviews)` in `lib/viator/cache.ts`.
   - `writeViatorReviewCache(productCode, reviews)` writes `data/viator-reviews/{productCode}.json`.
   - For the Juneau Port-Day Planner (`lib/dcc/juneauPortDayEngine.ts`), the mapped product codes in `JUNEAU_VIATOR_PRODUCT_CODE_BY_OPTION_ID` are:
     - `jun-opt-heli-icefield-walkabout` → `data/viator-reviews/5824JUNEAUHELI.json`
     - `jun-opt-auke-bay-whale-direct` → `data/viator-reviews/5024JUNWHALE.json`
     - `jun-opt-combo-whale-and-mendenhall` → `data/viator-reviews/5024JUNCOMBO.json`
     - `jun-opt-combo-heli-and-mendenhall` → `data/viator-reviews/41143P1.json`
     - `jun-opt-goldbelt-tram` → `data/viator-reviews/8917P9.json`
     - Public/self-guided options (`jun-opt-mendenhall-shuttle-walk`, `jun-opt-downtown-waterfront-walk`) have no third-party tour product code (`null`).
3. **Runtime Loading & Summarization (`lib/dcc/guestFeedback.ts`):**
   - `loadPermittedThirdPartyReviewCacheForProduct({ targetOptionId, viatorProductCode })` reads `data/viator-reviews/{productCode}.json`, extracts the file `mtime` as `lastRetrievedAt`, tags each record with `productCode: targetOptionId`, and returns `checkStatus: "checked_ok"`.
   - `summarizeRecentReviews()` validates product matching, deduplicates by `reviewId` and `publishedDate + text`, filters strictly to the rolling 180-day publication window, and evaluates negation-aware topic polarity:
     - `>= 3` eligible reviews in 180 days with `>= 2` supporting reviews on a topic → `state: "thematic_summary"`
     - `1–2` eligible reviews in 180 days (or `>= 3` with no recurring 2-review topic) → `state: "limited_recent_data"`
     - `0` eligible reviews in 180 days after a successful check → `state: "no_recent_reviews"`
4. **Commit & Deploy:** Commit the updated `data/viator-reviews/*.json` cache files (or run the sync step during CI/build before `next build`) and deploy to Vercel production.
