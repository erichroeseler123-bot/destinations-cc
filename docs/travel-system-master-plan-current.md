# Travel System Master Plan

Status: current repo-aligned architecture note for `destinations-cc`.

This document explains how the live codebase is organized today. It is intentionally narrower than older vision docs and should be used as the baseline for implementation, documentation, and operational decisions.

## System Summary

Destination Command Center is the governed decision layer in the system.

The current system combines:

- public decision pages for destinations, transportation, venues, cruises, and high-friction travel questions
- internal live-data and recommendation APIs
- network, registry, and satellite export tooling
- shaped handoff into guided-action and execution surfaces
- telemetry and reconciliation jobs that measure whether the recommendation actually worked

The core loop is:

`understand -> narrow -> route -> execute -> measure`

The corridor-production loop layered on top of that is:

`score -> define golden flow -> resolve first-render state -> validate -> harden`

The live network should not be read as "a few sites."
It is a set of parallel lanes connected by one decision layer.

## Intake Layer Status

The intake layer is now manifest-backed.

Current repo behavior:

- header search reads the shared entry-surface manifest
- homepage promoted links read the same shared manifest
- `/command` reads the same corridor roster

Operational consequence:

- promotion is now the growth event
- building a corridor is not the same thing as promoting it
- promoted intake should stay selective and deliberate

## Repo Layers

### Public app layer

The main Next.js app lives in `app/`.

Responsibilities:

- render public DCC decision routes
- expose machine-readable feeds such as `/agent.json` and `/llms.txt`
- host internal dashboards such as `/command` and `/network-health`
- serve internal and public API routes from `app/api/`

### Data and identity layer

The durable content and graph inputs live across:

- `data/registry/`
- `data/network/`
- `data/destinations/`
- `src/data/`

Responsibilities:

- canonical node identity
- network edges and policy contracts
- city and destination metadata
- site identity and product framing

### Runtime logic layer

The shared runtime code lives primarily in `lib/` and `lib/dcc/`.

Responsibilities:

- recommendation and validation logic
- telemetry adapters
- decision-quality aggregation
- routing and reconciliation support
- provider integration helpers

### Operations layer

The automation and reporting entry points live in `scripts/dcc/`.

Responsibilities:

- build indexes and caches
- validate schemas and route coverage
- export surface and satellite bundles
- report freshness, sitemap coverage, and routing issues
- reconcile satellite handoffs

## Current Product Areas

The repo currently supports several overlapping decision areas:

- city and destination guidance
- shows, tours, attractions, and venue routing
- cruise and shore-excursion surfaces
- transportation and corridor-driven guidance
- Red Rocks and related concert-transport flows
- Alaska and Juneau excursion surfaces
- Vegas vertical and satellite support

Not every route follows the same execution model. Some are decision pages only; others feed guided-action or operator flows more directly.

Current intake reality by corridor family:

- the top intake layer is manifest-backed and shared across header search, homepage promoted links, and `/command`
- the current promoted corridor set is:
  - `Red Rocks Transport`
  - `Sedona Jeep Tours`
  - `Lake Tahoe Activities`
  - `New Orleans Swamp Tours`
  - `Juneau Helicopter Tours`
  - `Juneau Whale Watching Tours`
  - `Denver Weed Airport Pickup`
- other corridor routes still exist deeper in the route graph and should only be promoted deliberately, one corridor per cycle, with mix quality reviewed each time

Canonical growth event:

- building a corridor is not the same thing as promoting it
- promotion into the manifest-backed intake layer is the actual growth event
- after promotion, the corridor enters the keep, demote, or replace loop based on real intake performance

## System Split

The hard split across the network is:

- `DCC` = governed decision engine
- `satellites` = narrowing or guided-action layer
- `operators` = execution layer

Operational rule:

- DCC decides
- satellites narrow once or guide once
- operators fulfill

That split must stay visible in copy, routing, and product behavior.

## Locked Live Model

Current active workbench:

- `destinations-cc`
- `shuttleya`
- `partyatredrocks`

Current promoted network assets:

- `welcometotheswamp`
- `welcometoalaska` / `wta-ui`
- `gosno`
- selective `redrocksfastpass`

Current live proof loops:

- Red Rocks: `DCC -> PARR`
- Argo: `DCC -> Shuttleya -> booking`

Other live promoted lanes still matter even when they are not the current cleanup workbench:

- mountains: `DCC -> GoSno`
- swamp tours: `DCC -> WTS`
- Alaska and Juneau excursion ambiguity: `DCC -> WTA`

Current routing doctrine:

- clear -> execute
- unclear -> narrow once -> execute
- never chain satellites

Important distinction:

- `ACTIVE` means optimization priority
- it does not mean the only real lane in the network

The real map is:

- DCC = router
- PARR = Red Rocks execution
- GoSno = mountain execution
- Shuttleya = Argo action and booking lane
- WTS = swamp narrowing and monetization lane
- WTA = Alaska and Juneau narrowing and handoff lane
- Fast Pass = selective execution lane

## DCC Page Model

DCC pages are not meant to behave like long travel articles.

The default page model is:

- one question
- 2 to 4 options max
- one short paragraph explaining the deciding constraint
- one recommendation
- one CTA

This keeps the product aligned with its real role: ending the search by reducing the mess to a decision.

## Satellites And Sidecar Apps

The `apps/` directory contains standalone Next.js projects deployed separately from the root DCC app.

Current repo-managed satellites and sidecars:

- `apps/juneauflightdeck`
- `apps/sedonajeep`
- `apps/laketahoe`
- `apps/420-airport-pickup`
- `apps/welcometotheswamp`
- `apps/saveonthestrip`
- `apps/special-pages`

These apps should stay aligned with DCC identity, exports, and handoff conventions, but they are not the canonical source of decision logic.

The newer spoke apps now share a common corridor runtime pattern:

- `HandoffContext` as the spoke input contract
- `resolveInitialState()` as the field-level resolver
- confidence gates and corridor-specific coherence passes
- state-driven hero, shortlist/card ordering, and CTA rendering
- local QA matrices with deterministic golden-flow URLs

Do not treat every sidecar app as current operating focus.
The live workbench is smaller than the full app list.

## Recommendation Model

The repo follows a recommendation-first model where possible.

Current rules:

- when confidence is strong, DCC should narrow to a practical next move
- when confidence is weaker, DCC should still reduce ambiguity without inventing certainty
- satellites should compress a narrower action path, not fork core identity
- execution surfaces should preserve context passed from DCC instead of restarting from blank state

This is why the repo contains:

- tokenized handoff support
- telemetry around recommendation and override behavior
- validation jobs for live pages, routing, freshness, and decision quality

Operational rule:

- do not render generic defaults first and personalize later
- resolve the first decision frame before the user sees the page

## Cron And Refresh Model

Cron ownership lives in the main DCC app.

The current Vercel cron schedule in [vercel.json](/home/ewrewr12/destinations-cc/vercel.json) drives:

- provider canary checks
- network refresh jobs
- cruise refresh jobs
- monetization refresh jobs
- decision-quality evaluation
- satellite handoff reconciliation

See [docs/dcc-cron-matrix.md](/home/ewrewr12/destinations-cc/docs/dcc-cron-matrix.md) for the maintained schedule and ownership model.

## Analytics And Decision Quality

Decision-quality evaluation currently has two supported modes:

- fixture-backed validation using `DCC_DECISION_QUALITY_FIXTURE_JSON`
- live aggregation from GA4-exported BigQuery tables via `DCC_BQ_PROJECT_ID` and `DCC_BQ_DATASET`

The adapter implementation lives in [lib/dcc/decision-quality/adapter.ts](/home/ewrewr12/destinations-cc/lib/dcc/decision-quality/adapter.ts).

## Operational Truth

When there is a conflict between an old plan doc and the code:

1. trust the current routes, scripts, and contracts in the repo
2. update the docs to match the code
3. do not preserve outdated conceptual language just because it sounds strategic

The goal of this repo is not to publish abstract architecture prose. The goal is to operate and ship a coherent decision-and-routing system that remains stable as the network grows.

Important rule:
- the map is a renderer of scored truth
- it is not a second intelligence layer

Similar rule for intake:

- the intake layer should render precomputed corridor truth
- it should not force each UI surface to rediscover cities, corridors, and feeders independently at runtime

## Registry And Identity Rule

Canonical place and corridor identity are now more important than ever.

Why:

- signal scoring depends on stable place IDs
- gold corridors depend on canonical endpoints
- SPT handoffs depend on a stable corridor identity
- telemetry only becomes meaningful when the same corridor means the same thing everywhere

Operational rule:

- slugs are presentation
- DCC IDs are identity
- corridor IDs are the stable operational handle above route copy

## Network Loop

The live network should be understood as this loop:

1. `DCC` understands the situation
2. `SPT` transports a known flow with that intelligence embedded
3. `checkout` executes the move
4. `booking pages` preserve context after conversion
5. `telemetry` measures whether the recommendation actually held
6. `DCC` learns which corridors and defaults deserve more weight

This is the core product behavior now.

Compressed model:

`DCC = governed brain`
`SPT = routing and transfer layer`
`token = signal packet`
`checkout = execution layer`
`telemetry = learning loop`

## What Has Been Proven

The system has crossed several thresholds:

- DCC is no longer just a discovery layer
- SPT is no longer just a concept demo
- checkout no longer boots only from legacy “full param” assumptions
- tokenized handoffs are live
- multiple corridor types are live
- the recommendation can shape the act layer directly
- new corridor clones can now be built from a scored registry entry, base state, resolver rules, and a QA-backed golden flow

Concrete repo state today:

- `apps/juneauflightdeck` is the most advanced decision-engine runtime
- `apps/sedonajeep` is the first new lab corridor clone
- `apps/laketahoe` is the first new money corridor clone and now carries resolved state into checkout
- `apps/420-airport-pickup` has been rebuilt from a static launcher into the shared transport-corridor runtime with Tahoe-level checkout continuity
- `apps/welcometotheswamp` now uses the shared corridor runtime on the homepage to resolve hero state and booking defaults before the chooser runs
- the shared binary decision engine is now proven across all three layers:
  - DCC `private-vs-shared` -> understand
  - WTS `airboat-vs-boat` -> choose
  - 420 `standard-vs-420` -> act
- rollout is selective, not global; WTA, WTNOT, SOTS, and other operator surfaces are governed by the rollout rules but not yet using the shared engine live

Live aliases now in service:

- `apps/laketahoe` -> `https://laketahoe.vercel.app/`
- `apps/420-airport-pickup` -> `https://420-airport-pickup-v2.vercel.app/`

That means the network is now:

- interpretable
- executable
- measurable

The measurement layer is now split into:

- `dcc_handoff_*` tables for satellite durability and reconciliation
- `dcc_corridor_catalog` for live corridor identity
- `dcc_corridor_events` for append-only corridor lifecycle events

The internal telemetry page can now compare corridor roster status and, where durable events exist, compute default-card acceptance and step-level funnel movement without inventing unpersisted metrics.

Operational note:
- smoke traffic is excluded from default corridor comparisons when `handoff_id` or `session_id` starts with `smoke_`, or when `metadata.test === true`

## Current Priorities

1. protect the integrity of the live corridors already in production
2. harden new corridor clones with real booking targets and end-to-end handoff continuity
3. use telemetry to confirm whether recommendations improve conversion and adherence
4. add the next corridor only when it proves a genuinely different behavior model or clean pattern reuse
5. keep the registry and corridor identity layer stable
6. deepen return-surface context only where it strengthens the execution loop

## What Not To Do

Do not:

- create pages that duplicate an existing corridor job
- let checkout invent its own corridor logic
- let satellites drift into canonical identity ownership
- expand SPT abstractions faster than live corridor behavior justifies
- add more corridors without a distinct behavioral model
- treat the map or the lab as the product by themselves

## Final Truth

This is not primarily a content site.

This is not primarily a booking site.

It is a governed decision-and-routing system that:

- understands what is happening
- selects the best move
- carries that move into guided action and execution
- preserves context after conversion
- measures whether the guidance was actually right
