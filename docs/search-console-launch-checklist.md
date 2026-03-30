# Search Console Launch Checklist

## DCC

- Add and verify `https://www.destinationcommandcenter.com`
- Submit `https://www.destinationcommandcenter.com/sitemap.xml`
- Request indexing for:
  - `/how-to-get-to-red-rocks-without-parking-hassle`
  - `/private-vs-shared-shuttles-to-red-rocks-denver-guide`
  - `/red-rocks-shuttle`
  - `/red-rocks-parking`
  - `/red-rocks-transportation`

## Party At Red Rocks

- Add and verify `https://www.partyatredrocks.com`
- Submit `https://www.partyatredrocks.com/sitemap.xml`
- Request indexing for:
  - `/`
  - `/book?venue=red-rocks-amphitheatre`
  - `/book/red-rocks-amphitheatre/private`
  - `/book/red-rocks-amphitheatre/custom/shared`
  - `/scenes`

## Queries to monitor monthly

- private red rocks shuttle denver
- private shuttle from denver to red rocks
- private transportation golden to red rocks
- red rocks shuttle denver
- red rocks private car service
- group transportation red rocks

## What to watch

- impressions
- average position
- CTR
- pages with rising impressions but weak CTR

## Fast follow if impressions appear but clicks lag

- tighten titles
- tighten meta descriptions
- add clearer price language
- add stronger FAQ schema on ranking pages

## 404 triage workflow

- Export `Not found (404)` URLs from Search Console for both domains
- Triage them in [`docs/404-redirect-sheet.csv`](/home/ewrewr12/destinations-cc/docs/404-redirect-sheet.csv)
- Apply redirects from [`data/redirect-map.ts`](/home/ewrewr12/destinations-cc/data/redirect-map.ts)
- Remove stale URLs from sitemap and internal links
- Resubmit affected URLs after redirects are live
