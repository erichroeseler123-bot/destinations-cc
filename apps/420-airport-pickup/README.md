# 420 Friendly Airport Pickup

This app is an act-layer airport pickup booking surface, not a chooser or content site.

## Public Route Baseline

- `/`
- `/sitemap.xml`
- `/robots.txt`

## Route Governance

This app now uses an explicit route-governance contract:

- exact-path publish policy lives in `lib/route-governance.ts`
- `publishState` controls whether a route is `draft`, `live_unpromoted`, `indexable`, or `promoted`
- `networkRole` controls whether a route is a satellite, operator, or utility surface
- `handoffPolicy` controls continuity behavior and does not decide sitemap inclusion
- `app/sitemap.ts` derives from `AIRPORT420_INDEXABLE_ROUTE_PATHS`, not from file inspection

Current practical rule:

- the homepage is the only intentional public route in this app
- it is promoted because it is the live act-layer entry surface
- checkout, success, and tokenized execution paths remain outside the crawl contract

## Runtime shape

The app follows the same corridor runtime used by:

- `apps/juneauflightdeck`
- `apps/sedonajeep`
- `apps/laketahoe`

Core pieces:

- `lib/handoff/types.ts`
- `lib/handoff/readContext.ts`
- `lib/handoff/resolveInitialState.ts`
- `lib/handoff/safety.ts`
- `lib/handoff/airport420Resolver.ts`

## Corridor job

This spoke resolves one Denver airport-arrival fork before checkout starts.

Stable package slugs:

- `airport-pickup`
- `airport-dispensary`

## Current status

- homepage is now one booking entry surface: standard pickup vs 420-friendly pickup
- generic private arrivals now default to `airport-pickup`
- canonical `decision_*` params are preserved into checkout and telemetry
- legacy `resolved_lane` / `product_slug` are only backfilled for compatibility
- shared decision engine now powers `standard-vs-420` as an act-layer binary fork before checkout
- DCC checkout now emits a `checkout_started` backstop on page load when a valid snapshot resolves, so navigation timing does not drop the start event
- browser telemetry now mirrors into the durable corridor event warehouse when `NEXT_PUBLIC_DCC_EVENT_ENDPOINT` is configured
- local QA matrix exists in `qa/corridors/420-airport-pickup.md`
- low-confidence fallback and conflicting-signal QA cases are documented
- production app alias: `https://420-airport-pickup-v2.vercel.app/`
- live Red Rocks handoff URL:
  `https://420-airport-pickup-v2.vercel.app/?dcc_handoff_id=live_420_001&source_page=%2Fred-rocks%2Fairport-arrival&decision_corridor=red-rocks-airport-arrival&decision_action=book_transfer&decision_option=event-transfer&decision_product=airport-red-rocks&decision_entry=act&decision_state=committed&requested_lane=private-transfer&resolved_lane=event-transfer&product_slug=airport-red-rocks&date=2026-08-14&port=denver`

This app now matches Tahoe on runtime continuity. It still needs production operator hardening if the goal is full commercial rollout.

## Route policy

Canonical routes:

- `/`
- `/sitemap.xml`
- `/robots.txt`

Execution target:

- DCC checkout URL with preserved handoff params

Utility routes that must remain outside this app surface:

- `/checkout`
- `/success`
- `/t/[token]`

Do not add DCC-style guide or comparison content here. Broad explanation belongs upstream in DCC, not on this operator spoke.

## Shared Decision Engine

Current live shared-engine placement:

- `standard-vs-420`
  - layer: `act`
  - CTA mode: `booking`
  - current placement: `app/components/AirportPickupHomeClient.tsx`

This is the current act-layer proof that the shared decision engine can drive direct booking behavior without weakening operator telemetry or checkout continuity.

## Deployment Notes

1. Link `apps/420-airport-pickup` as its own Vercel project root.
2. Confirm the production domain before changing `SITE_URL` in sitemap or robots.
3. Verify the homepage, sitemap, and robots outputs together after deploy.
