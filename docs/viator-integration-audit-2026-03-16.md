# Viator Integration Audit

Date: 2026-03-16

## Summary

The repo already has a meaningful Viator surface, but it is still a hybrid system:

- live affiliate-style search via `/products/search`
- local cached/catalog fallback data in `data/tours.json`, `data/vegas.tours.json`, and `data/action/viator.products.cache.json`
- multiple legacy ingest scripts with inconsistent endpoint assumptions
- no proven runtime access-tier detection
- no stored review/traveler-photo pipeline
- no PDP-grade Viator content model yet

The current integration is best classified as `basic-access affiliate leaning toward full-access readiness`, not a fully implemented ingestion-first Viator platform.

## Access Tier Inference

Current local inference:

- `VIATOR_API_KEY`: unset
- `VIATOR_PID`: unset
- `VIATOR_MCID`: unset
- `NEXT_PUBLIC_VIATOR_ACCESS_TIER`: unset

Result:

- No runtime credentials are available in this workspace, so live tier verification could not be performed.
- The codebase includes support for live `/products/search` and references to `/products/modified-since`, which suggests the project is preparing for both basic and full-access workflows.
- There is no reliable dynamic capability check in code yet. Access tier is still effectively inferred from env/config and historical scripts.

Recommendation:

- Add a runtime Viator capability health check that records endpoint reachability by tier:
  - basic probe: `/products/search`
  - full probe: `/products/modified-since`
  - booking probe: `/bookings/status` or another booking-only endpoint
- Store the results in diagnostics and expose them in a private health surface.

## Current Implementation Surface

### Shared Viator Logic

Current active integration files:

- [lib/viator/config.ts](/home/ewrewr12/destinations-cc/lib/viator/config.ts)
- [lib/viator/links.ts](/home/ewrewr12/destinations-cc/lib/viator/links.ts)
- [lib/viator/tags.ts](/home/ewrewr12/destinations-cc/lib/viator/tags.ts)
- [lib/viator/reviews.ts](/home/ewrewr12/destinations-cc/lib/viator/reviews.ts)
- [lib/viator/destinations.ts](/home/ewrewr12/destinations-cc/lib/viator/destinations.ts)
- [utils/affiliateLinks.ts](/home/ewrewr12/destinations-cc/utils/affiliateLinks.ts)
- [lib/dcc/action/viator.ts](/home/ewrewr12/destinations-cc/lib/dcc/action/viator.ts)
- [lib/dcc/internal/viatorAction.ts](/home/ewrewr12/destinations-cc/lib/dcc/internal/viatorAction.ts)

What these now do:

- centralized attribution/campaign sanitization
- frontend-safe tag policy and hidden merchandising scoring
- destination helper mapping from DCC route slugs to Viator destination metadata
- live `/products/search` path with local cache/catalog fallback

### UI Surfaces

Primary active Viator UI surfaces:

- [app/tours/page.tsx](/home/ewrewr12/destinations-cc/app/tours/page.tsx)
- [app/components/dcc/ToursSearchPanel.tsx](/home/ewrewr12/destinations-cc/app/components/dcc/ToursSearchPanel.tsx)
- [app/components/dcc/ViatorTourGrid.tsx](/home/ewrewr12/destinations-cc/app/components/dcc/ViatorTourGrid.tsx)
- city and port pages that call `getViatorActionForPlace(...)`

Current UI level:

- decent affiliate SRP-style cards
- destination and category shortcuts
- compliant tag exposure
- no PDP-grade Viator product detail implementation
- no traveler reviews or traveler photos rendered

### Existing Scripts / Legacy Paths

Relevant scripts found:

- [scripts/viator-ingest.mjs](/home/ewrewr12/destinations-cc/scripts/viator-ingest.mjs)
- [scripts/fetch-modified-since.mjs](/home/ewrewr12/destinations-cc/scripts/fetch-modified-since.mjs)
- [scripts/ingest-viator.js](/home/ewrewr12/destinations-cc/scripts/ingest-viator.js)
- [scripts/viator-destinations.mjs](/home/ewrewr12/destinations-cc/scripts/viator-destinations.mjs)
- [scripts/viator-destinations-hierarchy.mjs](/home/ewrewr12/destinations-cc/scripts/viator-destinations-hierarchy.mjs)
- [scripts/dcc/build-viator-cache.mjs](/home/ewrewr12/destinations-cc/scripts/dcc/build-viator-cache.mjs)

Assessment:

- multiple script generations exist from different eras
- endpoint usage and payload expectations are not yet standardized
- these should be consolidated under one supported Viator ingestion/search contract

## Existing Gaps vs. Planned Phases

### Phase 1: Config / Policy

Status: partially complete

Done:

- attribution wrapper
- campaign sanitization
- tag governance module
- review/photo compliance notice constants

Missing:

- runtime endpoint capability detection
- centralized locale handling in live fetch headers using shared config
- one health endpoint for Viator integration state

### Phase 2: Basic-Access Destination Search / SRP

Status: partially complete

Done:

- tours vertical exists
- destination-led search page exists
- result cards exist
- category shortcuts now use safe Viator tags

Missing:

- true Viator destination taxonomy-backed destination search behavior
- richer result filtering mapped to actual product tags/features
- stronger sort and merchandising behavior based on real tag/rating/schedule data

### Phase 3: PDP / Review / Traveler Photos

Status: not implemented

Missing:

- unified Viator product detail page
- supplier image gallery vs traveler photo gallery separation
- review cache
- traveler photo cache
- noindex handling at the page level for review/photo surfaces

### Phase 4: Tag Taxonomy / Merchandising

Status: foundation only

Done:

- safe/back-end-only/unsupported tag policy
- hidden merchandising scoring

Missing:

- persisted `/products/tags` cache
- hierarchical tag graph / parent relationships
- tag ingestion refresh cadence
- real tag-driven result filtering from live or ingested product payloads

### Phase 5: Ingestion Architecture

Status: not implemented as a unified system

Done:

- local cache file exists
- local catalog fallback exists
- scripts for destinations and modified-since exist

Missing:

- one supported ingestion pipeline
- separate cursor jobs for products and schedules
- auxiliary-data refresh jobs
- ingestion-time exclusion policy
- persistent normalized product store

### Phase 6+: Booking / Amendments / Supplier Events

Status: not implemented

Missing:

- booking capability checks
- booking question flows
- amendment workflows
- `/bookings/modified-since` worker
- merchant-only acknowledge handling

## Risky Areas

### 1. Mixed Data Sources

Current tours results may come from:

- live `/products/search`
- `data/action/viator.products.cache.json`
- local catalog JSON fallbacks

Risk:

- inconsistent fields
- inconsistent destination coverage
- difficult debugging of stale/live mismatches

Recommendation:

- define one normalized Viator product schema and force all sources through it
- expose the active source on internal diagnostics

### 2. Legacy Script Drift

Examples:

- [scripts/viator-ingest.mjs](/home/ewrewr12/destinations-cc/scripts/viator-ingest.mjs)
- [scripts/fetch-modified-since.mjs](/home/ewrewr12/destinations-cc/scripts/fetch-modified-since.mjs)
- [scripts/ingest-viator.js](/home/ewrewr12/destinations-cc/scripts/ingest-viator.js)

Risk:

- some scripts appear to assume different response shapes or endpoint versions
- these will drift further unless replaced with one official ingest/search client

### 3. No Runtime Credentials / Tier Verification

Current local runtime has no Viator env values set.

Risk:

- production access tier may be different from dev assumptions
- unsupported features could be built against the wrong tier

Recommendation:

- add a runtime capability probe and store the result

### 4. Review / Traveler Photo Compliance Not Enforced Yet

Current state:

- notices exist
- rendering/storage pipeline does not

Risk:

- future review/photo work could accidentally expose indexable content without guardrails

Recommendation:

- add page-level `robots` metadata and route guardrails before shipping review/photo UI

### 5. Attribution Inconsistency Outside New Wrapper

There are still internal tours links and campaign conventions scattered across the app.

Risk:

- affiliate attribution drift
- campaign naming inconsistency

Recommendation:

- move all Viator outbound URL generation to `lib/viator/links.ts`

## Recommended Immediate Next Steps

### 1. Build Runtime Capability Health Checks

Add a private Viator diagnostics module that reports:

- API key present or absent
- `/products/search` probe status
- `/products/modified-since` probe status
- booking endpoint probe status
- inferred tier

### 2. Consolidate Viator Client Logic

Create a single internal client layer for:

- destination taxonomy
- product search
- modified-since
- schedules
- tags
- reviews

Then migrate old scripts onto that client.

### 3. Add PDP-Ready Product Model

Extend normalized product data to support:

- itinerary
- inclusions/exclusions
- cancellation policy
- pickup/departure/return
- languages
- ticket type
- booking questions references

### 4. Add Review / Traveler Photo Cache

Implement:

- weekly review refresh
- weekly traveler photo refresh
- product-linked storage
- hard noindex metadata for any page that renders this content

### 5. Build Mock Viator Service for Dev

Add a mock client with tiered capabilities:

- basic
- full
- booking

This will unblock local development without depending on live credentials.

## Current Tier Inference

Most likely current operational posture:

- production-facing UI is basic affiliate compatible
- codebase is beginning to prepare for full-access ingestion
- no evidence of active booking/amendment implementation yet

Practical conclusion:

The next reasonable build target is:

1. strong basic/full shared client
2. destination + taxonomy cache
3. PDP-grade product model
4. review/traveler photo cache and compliance
5. only then booking-capable workflows if access exists

## Certification Back-End Checklist

Source baseline:

- Viator Partner Resource Center: `Managing Product & Availability Data` dated October 3, 2025
- Viator Partner Resource Center: `Viator API certification: back-end checks` dated July 15, 2025

This section converts the certification rules into a repo-specific pass/fail checklist.

### Content ingestion

Status: partially compliant after the `scripts/viator-ingest.mjs` rewrite

What now aligns:

- product content ingestion is now modeled around `/products/modified-since`
- availability ingestion is now modeled around `/availability/schedules/modified-since`
- product and schedule ingestion are separated
- cursor state is persisted so delta updates can resume instead of re-ingesting full data

Still missing for certification:

- a documented or automated cadence of at least hourly, ideally every 15 to 30 minutes
- ingestion-time exclusion policy for filtered-out products and matching schedule exclusion
- proof that search endpoints are no longer being used operationally for ingestion
- a normalized local store that is clearly the source of truth for downstream pages

### Auxiliary data refresh

Status: partially compliant

What exists:

- local caches for destinations and tags
- local review cache support
- taxonomy sync scripts

Still missing for certification:

- exchange-rate ingestion and expiry-driven refresh workflow
- locations cache and `/locations/bulk` resolution flow with the 500-location cap enforced
- explicit booking-question cache refresh flow
- explicit monthly or fixed-cadence jobs for auxiliary full refreshes
- on-demand refresh logic when new destination IDs, tags, booking questions, or locations are encountered during ingestion

### Real-time search

Status: mostly aligned for discovery, but not yet certification-proof

What exists:

- `/products/search` client support
- live search usage for discovery flows

Still missing for certification:

- clear rate-limit/backoff policy for concurrent search requests
- explicit guardrails proving search is not used for ingestion anywhere in production jobs
- recommendation-specific handling for `/products/bulk` and `/availability/schedules/bulk` when multiple recommendation products must be resolved in real time

### Affiliate attribution

Status: mostly compliant

What exists:

- centralized outbound attribution wrapper in [lib/viator/links.ts](/home/ewrewr12/destinations-cc/lib/viator/links.ts)
- default `pid`, `mcid`, and `medium=api` config in [lib/viator/config.ts](/home/ewrewr12/destinations-cc/lib/viator/config.ts)
- campaign sanitization limited to lowercase alphanumeric characters and dashes
- campaign composition helper so multiple internal touchpoints can be encoded into one safe campaign string

What this means:

- the repo already follows the important attribution rule from Viator's affiliate guidance: do not hand-build inconsistent tracking params across the app
- campaign values are already normalized to the allowed character set, which reduces silent attribution loss

Still worth tightening:

- keep all Viator outbound URLs routed through `appendViatorAttribution(...)`
- avoid raw Viator URL construction outside the shared wrapper
- if multilingual Viator redirects become important, handle locale at the request/header or host-selection layer deliberately instead of scattering ad hoc URL params

### Real-time availability and pricing

Status: not implemented

Certification blockers:

- no active `/availability/check` workflow was found
- no evidence that availability is checked only after date and passenger mix are selected
- no evidence of a second final availability check immediately before booking
- no currency-handling logic tied to invoicing currency for availability checks

### Booking hold and booking

Status: not implemented

Certification blockers:

- no `/bookings/cart/hold` or `/bookings/hold` flow found
- no `/bookings/cart/book` or `/bookings/book` flow found
- no payment token flow
- no booking timeout handling at 120 seconds minimum
- no booking-status recovery flow after booking errors or timeouts

Implication:

- if this integration is staying affiliate search-only, that is fine, but it should be treated as non-booking and scoped accordingly during certification
- if full plus booking access is planned, this area is still a major implementation gap

### Booking status and manual confirmation

Status: not implemented

Certification blockers:

- no `/bookings/status` polling flow found
- no hourly recheck flow for pending manual-confirmation products
- no status-based traveler communication logic

### Traveler and supplier cancellations

Status: not implemented

Certification blockers:

- no cancel-quote flow
- no cancel-reasons refresh flow
- no `/bookings/modified-since` supplier-cancellation ingestion loop
- no `/bookings/modified-since/acknowledge` support

### Timeout and operational safeguards

Status: not implemented or not provable

Still missing:

- centralized Viator timeout policy that guarantees at least 120 seconds for booking endpoints
- explicit retry spacing for booking status polling after errors
- internal diagnostics showing live capability reachability by endpoint family

## Revised Priority

If the goal is Viator certification instead of just a working tours surface, the priority order should be:

1. finish ingestion compliance
2. add auxiliary-data refresh and on-demand reference resolution
3. implement real-time `/availability/check`
4. decide whether this integration remains search-only affiliate or becomes booking-capable
5. only if booking-capable, add hold, book, status, cancellation, and timeout workflows

## Current Best Interpretation

As of this audit, the repo looks closest to:

- search-capable affiliate integration with improving ingestion readiness
- not yet ready for booking certification
- not yet ready to claim full backend certification compliance without additional ingestion and auxiliary-data work

## Front-End Guide Check

Source baseline:

- Viator Partner Resource Center: `Front-End Guide for API Partners` dated March 17, 2021

### Landing page / tours hub

Status: partially aligned

What exists:

- a dedicated `/tours` landing surface
- destination-led search entry
- featured category shortcuts
- destination search suggestions

Still worth improving:

- stronger prioritization of high-conversion and high-revenue products on the initial landing state
- clearer top-destination and top-product modules when no city intent is selected

### Search results page

Status: mostly aligned

What exists:

- destination search
- category and text filtering
- sort controls
- rating, thumbnail, teaser, price, duration, and approved tag display on result cards
- DCC recommendation signal

Still missing or thin:

- clickable destination breadcrumb above results
- stronger free-cancellation and other high-conversion merchandising flags where available
- clearer distinction between live product cards and fallback search cards

### Product detail page

Status: improved, but still not fully PDP-complete

What exists:

- unified PDP route at `/tours/[id]`
- product title, rating, reviews, duration, price-from framing
- destination trail
- supplier and traveler photo separation
- overview, inclusions, exclusions, itinerary, pickup, departure, return, languages, ticket type, and cancellation copy
- sticky outbound booking CTA

Still missing or thin:

- date and traveler selection flow on-site
- visible product-option selection
- map/location rendering from itinerary or points of interest
- richer nearby-attraction and nearby-product modules
- more complete review presentation once cache coverage improves

### User flow

Status: directionally aligned

Current path:

- landing page to SRP
- SRP to PDP
- PDP to Viator for live availability and checkout

This is compatible with Viator's recommended simple flow, but it still leans more editorial than transactional in places.
