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

