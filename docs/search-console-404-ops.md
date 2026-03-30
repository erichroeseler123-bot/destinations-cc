# Search Console 404 Ops

## Goal

Use Google Search Console export data as the source of truth for 404s that matter, then convert that list into redirect or removal decisions without guessing.

## Workflow

1. Export every `Not found (404)` URL from Google Search Console for:
   - `https://www.destinationcommandcenter.com`
   - `https://www.partyatredrocks.com`
2. Paste the URLs into [`docs/404-redirect-sheet.csv`](/home/ewrewr12/destinations-cc/docs/404-redirect-sheet.csv).
3. Bucket each URL into one of three decisions:
   - `301`: exact replacement exists
   - `301`: close topic equivalent exists
   - `410`: no equivalent and low-value / spam / junk
4. Prioritize this order:
   - old PARR booking variants
   - old PARR event-detail booking URLs
   - old Red Rocks shuttle / transport URLs
   - indexed DCC-local booking / checkout URLs
   - everything else after that
5. Apply the redirect map in app config or route handlers.
6. Update sitemap and internal links so old URLs stop being invited.
7. Resubmit affected URLs in Search Console after the redirect map is live.

## Decision Rules

### `301`

Use when:
- an exact replacement exists
- a clearly stronger canonical equivalent exists
- the old URL still has link equity or query value

### `410`

Use when:
- no meaningful equivalent exists
- the URL is spam, junk, or obsolete noise
- keeping it alive would create more ambiguity than value

## Important Notes

- Prioritize `PARR` legacy booking and Red Rocks transport URLs first because they are closest to money.
- Keep `DCC` understanding pages live if they still serve acquisition and route cleanly.
- Parameterized booking URLs appearing in Google are a canonicalization problem, not a reason to create more pages.
- `DCC` should route toward `PARR`, not try to replace it.

## Working Files

- Starter machine-readable map: [`data/redirect-map.ts`](/home/ewrewr12/destinations-cc/data/redirect-map.ts)
- Editable sheet: [`docs/404-redirect-sheet.csv`](/home/ewrewr12/destinations-cc/docs/404-redirect-sheet.csv)
