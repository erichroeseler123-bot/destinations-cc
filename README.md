# Destination Command Center

Destination Command Center (`destinations-cc`) is the main DCC web application and runtime repo.

It is not a generic travel site and not a booking marketplace.

It is the governed decision layer in the system:

- `DCC` understands the situation
- `DCC` reduces the mess to a decision
- `DCC` routes the user to the right execution surface
- downstream brands and operators fulfill the action

The operating model is:

`confusion -> decision -> guided action -> execution -> measurement`

## Current Product Shape

The public app exists to answer one hard question well:

`What should the user actually do next?`

That means the repo combines:

- a public Next.js 16 site at `destinationcommandcenter.com`
- decision pages that compress messy real-world questions into a clear next move
- internal APIs for live city, cruise, transport, telemetry, and handoff shaping
- DCC graph, registry, and network export tooling
- satellite bundle export and reconciliation jobs
- telemetry that measures whether the recommendation actually worked

The current implementation loop is:

`understand -> narrow -> route -> execute -> measure`

## Current Intake Reality

The intake layer is now unified through a compiled entry-surface manifest.

Current repo behavior:

- header search reads the generated entry-surface manifest
- homepage promoted intake links read the same manifest
- `/command` intake lanes read the same manifest

That means intake truth is now shared across the top acquisition surfaces instead of being rediscovered separately at runtime.

Current practical status:

- the current promoted intake set is:
  - `Red Rocks Transport`
  - `Sedona Jeep Tours`
  - `Lake Tahoe Activities`
  - `New Orleans Swamp Tours`
  - `Juneau Helicopter Tours`
  - `Juneau Whale Watching Tours`
  - `Denver Weed Airport Pickup`
- homepage and `/command` both render that same promoted set in the same order
- promoted intake routes are checked on production for `200` HTML reachability

Non-negotiable rule:

- if a page is not in `src/data/visible-surface.ts`, it does not exist publicly in the DCC visible-surface contract

Root governance rule:

- exact-path publish policy now lives in `src/data/route-governance.ts`
- `publishState` controls whether a route is `draft`, `live_unpromoted`, `indexable`, or `promoted`
- `networkRole` controls whether the route is DCC, satellite, operator, or utility
- `handoffPolicy` controls continuity behavior and must not be used as a crawl or promotion flag
- `src/data/visible-surface.ts` and `src/data/indexable-surface.ts` are derived views, not primary doctrine
- rollout sequencing for this model lives in `docs/root-governance-rollout-plan.md`

The current operating rule is product curation, not more intake infrastructure:

- add one new promoted corridor per cycle at most
- keep the mix balanced by destination, intent, and cluster
- do not let one city, one intent, or one cluster dominate the promoted layer
- treat promotion as a governed choice, not as an automatic consequence of a page existing

Canonical policy document:

- `docs/entry-surface-promotion-policy.md`
- `docs/current-intake-state.md`
- `docs/intake-promotion-log.md`

In code, that mostly maps to:

- `app/`: public decision pages, internal dashboards, and API routes
- `src/data/`: site identity, city registry, and product-facing content registries
- `data/`: canonical registry, network contracts, generated bundles, and content inputs
- `lib/dcc/`: decision-quality adapters, health logic, routing, telemetry, and supporting domain logic
- `scripts/dcc/`: validation, export, refresh, reporting, and reconciliation jobs
- `apps/`: standalone satellite or special-page Next.js apps deployed separately from the main site

The newer spoke apps inside `apps/` share a common starter pattern:

- app-local `HandoffContext` and `InitialUiState`
- field-level `resolveInitialState()`
- confidence gate plus coherence pass
- state-driven hero, cards, and CTA
- local QA matrix with golden-flow URLs

## Doctrine

The hard split across the system is:

- `DCC` = governed decision engine
- `satellites like Shuttleya` = guided action layer
- `operators and checkout` = execution layer

DCC pages should behave like decision interfaces, not articles.

Default rule:

- one page = one intent
- 2 to 4 options max
- one short paragraph explaining the deciding constraint
- one recommendation
- one CTA

The governing sentence is:

`DCC pages do not explain everything. They reduce everything to a decision.`

See [docs/dcc-decision-page-doctrine.md](/home/ewrewr12/destinations-cc/docs/dcc-decision-page-doctrine.md).

## Public Surfaces

The main app codebase contains:

- route families such as `/cities`, `/[city]`, `/tours`, `/ports`, and `/venues`
- Red Rocks, Alaska, Vegas, cruise, and transportation decision surfaces
- command and health views such as `/command`, `/network-health`, and `/internal/telemetry`
- machine-readable endpoints including `/agent.json` and `/llms.txt`

Visibility note:

- code presence is broader than public DCC visibility
- the public visible-surface contract is only what appears in `src/data/visible-surface.ts`

The site identity source of truth lives in [src/data/site-identity.ts](/home/ewrewr12/destinations-cc/src/data/site-identity.ts).

## Internal APIs

Notable internal route groups:

- `app/api/internal/cron/network-refresh/route.ts`
- `app/api/internal/reconciliation/satellite-handoffs/route.ts`
- `app/api/internal/live-city/[city]/route.ts`
- `app/api/internal/next48/route.ts`
- `app/api/internal/live-pulse/route.ts`
- `app/api/internal/spt-token/route.ts`
- `app/api/internal/viator/*`
- `app/api/internal/shipments/*`

The current Vercel cron schedule is defined in [vercel.json](/home/ewrewr12/destinations-cc/vercel.json) and explained in [docs/dcc-cron-matrix.md](/home/ewrewr12/destinations-cc/docs/dcc-cron-matrix.md).

## Local Development

Requirements:

- Node `20.x`
- npm

Core commands:

```bash
npm install
npm run dev
npm run build
npm run start
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm run check
npm run test:dcc
```

## DCC Operations

High-signal commands in this repo:

```bash
npm run dcc:env:check
npm run dcc:network:validate
npm run dcc:network:contracts:validate
npm run dcc:network:export:satellites
npm run dcc:network:ci:satellites
npm run dcc:network:health
npm run dcc:decision:validate
npm run dcc:decision:audit
npm run dcc:live-city:validate
npm run dcc:city:freshness:report
npm run dcc:cruise:freshness:report
```

Memory, graph, and cache maintenance are also driven from `package.json`; use that script list as the current command inventory.

## Environment

The canonical checked-in contract starts in [.env.example](/home/ewrewr12/destinations-cc/.env.example).

For the grouped operating model and active-stack guidance, see [docs/env-contract.md](/home/ewrewr12/destinations-cc/docs/env-contract.md).

Important notes:

- some integrations are optional and only needed for the surfaces you are running
- the decision-quality cron can read from a GA4-exported BigQuery dataset using `DCC_BQ_PROJECT_ID` and `DCC_BQ_DATASET`
- GA4 page instrumentation is currently initialized in [app/layout.tsx](/home/ewrewr12/destinations-cc/app/layout.tsx)

For cron, analytics, and BigQuery specifics, see [docs/dcc-cron-matrix.md](/home/ewrewr12/destinations-cc/docs/dcc-cron-matrix.md).

## Documentation Map

Start here:

- [docs/dcc-positioning-memo.md](/home/ewrewr12/destinations-cc/docs/dcc-positioning-memo.md): public positioning and internal category framing
- [docs/dcc-decision-page-doctrine.md](/home/ewrewr12/destinations-cc/docs/dcc-decision-page-doctrine.md): page-level doctrine for DCC decision interfaces
- [docs/dcc-flow-entry-model.md](/home/ewrewr12/destinations-cc/docs/dcc-flow-entry-model.md): when to start with a DCC page versus a guided step flow
- [docs/route-policy.md](/home/ewrewr12/destinations-cc/docs/route-policy.md): route classification rules for canonical, redirect, utility, and strategy surfaces
- [lib/decision/README.md](/home/ewrewr12/destinations-cc/lib/decision/README.md): shared binary decision engine rules, lane contract, and implementation guidance
- [docs/decision-rollout-system.md](/home/ewrewr12/destinations-cc/docs/decision-rollout-system.md): rollout rules and audit model for selective decision-engine deployment
- [docs/dcc-decision-continuity-contract.md](/home/ewrewr12/destinations-cc/docs/dcc-decision-continuity-contract.md): the URL-level contract that carries a made decision into the next surface
- [docs/dcc-handoff-audit-2026-04-09.md](/home/ewrewr12/destinations-cc/docs/dcc-handoff-audit-2026-04-09.md): first pass audit of high-value DCC handoffs against the continuity contract
- [docs/dcc-network-constitution.md](/home/ewrewr12/destinations-cc/docs/dcc-network-constitution.md): network-wide role map and continuity rules across DCC, satellites, flows, and operators
- [docs/dcc-destination-mapping-layer.md](/home/ewrewr12/destinations-cc/docs/dcc-destination-mapping-layer.md): shared translation layer from resolved decision state into the tightest viable affiliate or booking destination
- [docs/first-routing-experiment-policy.md](/home/ewrewr12/destinations-cc/docs/first-routing-experiment-policy.md): first controlled experiment rules for changing mapper defaults from real downstream telemetry
- [docs/red-rocks-shared-first-experiment.md](/home/ewrewr12/destinations-cc/docs/red-rocks-shared-first-experiment.md): first concrete routeKey-vs-routeKey experiment definition for the Red Rocks shared lane
- [docs/site-sitemap-and-documentation-baseline.md](/home/ewrewr12/destinations-cc/docs/site-sitemap-and-documentation-baseline.md): sitemap, robots, and README baseline for each reachable public site in this workspace
- [docs/root-governance-rollout-plan.md](/home/ewrewr12/destinations-cc/docs/root-governance-rollout-plan.md): phased implementation plan for separating publish state, network role, and handoff policy
- [docs/dcc-messaging-doctrine.md](/home/ewrewr12/destinations-cc/docs/dcc-messaging-doctrine.md): copy rules, CTA framing, and recommendation language
- [docs/travel-system-master-plan-current.md](/home/ewrewr12/destinations-cc/docs/travel-system-master-plan-current.md): current system architecture and operating model
- [docs/dcc-node-constitution-v1.md](/home/ewrewr12/destinations-cc/docs/dcc-node-constitution-v1.md): graph and node governance baseline
- [docs/dcc-cron-matrix.md](/home/ewrewr12/destinations-cc/docs/dcc-cron-matrix.md): cron ownership, schedules, and GA4/BigQuery path
- [data/network/README.md](/home/ewrewr12/destinations-cc/data/network/README.md): network layer contracts and export flow
- [data/registry/README.md](/home/ewrewr12/destinations-cc/data/registry/README.md): canonical identity and shard model

## Satellite Apps

This repo also contains app roots in `apps/`:

- `apps/juneauflightdeck`
- `apps/sedonajeep`
- `apps/laketahoe`
- `apps/420-airport-pickup`
- `apps/welcometotheswamp`
- `apps/saveonthestrip`
- `apps/redrocksfastpass`
- `apps/shuttleya`
- `apps/special-pages`
- `apps/text-daily`

Most of these are public satellites or sidecar apps rather than the decision layer itself. They narrow action or carry execution context after DCC has already done the decision work. `apps/text-daily` also exists as a separate app root, but it is currently blocked from crawling via its own `robots.ts`.

Current corridor-runtime status:

- `apps/juneauflightdeck`: established Juneau spoke with curated helicopter routes and handoff runtime, but no live shared binary decision
- `apps/sedonajeep`: first new lab corridor clone
- `apps/laketahoe`: first new money corridor clone with checkout continuity
- `apps/420-airport-pickup`: transport-family rebuild onto the shared runtime with checkout continuity, a broader private-arrival default, and an act-layer binary decision for `standard-vs-420`
- `apps/welcometotheswamp`: existing decision-engine upgraded with homepage handoff resolution and a choose-layer binary decision for `airboat-vs-boat`

Current shared decision-engine rollout:

- DCC: `private-vs-shared` -> `understand` layer -> `handoff`
- WTS: `airboat-vs-boat` -> `choose` layer -> `handoff`
- 420 Airport Pickup: `standard-vs-420` -> `act` layer -> `booking`

Governance is global, rollout is selective.
The engine is not deployed everywhere. New sites or pages only get a binary decision when they pass the rollout rules and the CI audit in [docs/decision-rollout-system.md](/home/ewrewr12/destinations-cc/docs/decision-rollout-system.md).

Important status distinction:

- a corridor can be built as a route family or standalone app without being fully exposed through DCC intake
- production discoverability depends on whether header search, homepage, and `/command` all surface that corridor cleanly
- as of the current repo state, that exposure is still uneven outside Red Rocks

Current live aliases:

- Tahoe: `https://laketahoe.vercel.app/`
- 420 Airport Pickup: `https://420-airport-pickup-v2.vercel.app/`

The internal telemetry hub now has two corridor-specific layers:

- a durable `dcc_corridor_catalog` roster for live corridor identity and continuity level
- a durable `dcc_corridor_events` stream for lifecycle events such as `handoff_viewed`, `product_opened`, `booking_opened`, and `checkout_started`

Checkout continuity for Tahoe and 420 now includes a checkout-page-load `checkout_started` backstop so the metric survives navigation timing instead of relying only on the spoke CTA click.

Dashboard reads treat `smoke_*` handoff/session identifiers and `metadata.test === true` as non-production traffic and exclude them from corridor performance and diagnostic comparisons by default.

The internal telemetry page now foregrounds four operator metrics:

- default acceptance
- default betrayal
- downgrade rate
- booking to checkout

It also includes a dedicated 420 broad-arrival experiment panel so the old Red Rocks-heavy default and the new airport-pickup default can be compared from the same durable event stream.

Checkout confirmations now include a post-booking distribution layer:

- `Text your group`
- `Copy invite link`
- `Share your plan`

Those invite links preserve date and product context and append `source=booking_share` plus referral metadata so post-booking coordination can be measured instead of treated like generic social traffic.

Last Frontier homepage and Alaska cruise feeder status:

- the Last Frontier homepage now includes a static `How this actually works` trust block
- that trust block is live content only and is not instrumented directly
- homepage hero CTAs are instrumented through the shared `HeroSection` telemetry props
- the homepage cruise link to `/best-alaska-cruise-for-excursions` is tracked
- `/best-alaska-cruise-for-excursions` itself is instrumented with page-level feeder telemetry plus tracked decision CTAs
- `/juneau` and `/skagway` support links into the cruise page are tracked
- as of the current repo audit, instrumentation is deployed but these feeder paths still have no stored rows in `data/telemetry/cruise-debug-events.jsonl`
- use `data/telemetry/cruise-debug-events.jsonl` to verify whether real signal has started to arrive for:
  - homepage hero CTAs
  - homepage cruise link
  - `/best-alaska-cruise-for-excursions`
  - `/juneau` support link
  - `/skagway` support link

Each app has its own README and package metadata. They are deployed separately from the root DCC app.
