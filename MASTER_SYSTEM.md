---
STATUS: SUPERSEDED
DATE: April 23, 2026
REASON: Unified Decision Surface Architecture (Summer 2026 Doctrine)
AUTHORITY: See /docs/summer-2026-operating-doctrine.md
---

> [!WARNING]
> This file is still useful as historical system context, but it is no longer the top authority for code generation or routing doctrine.
> Use [docs/summer-2026-operating-doctrine.md](/home/ewrewr12/destinations-cc/docs/summer-2026-operating-doctrine.md) first.
> For machine-readable network governance, use [docs/spider-path-system.md](/home/ewrewr12/destinations-cc/docs/spider-path-system.md) as the active Spider Path protocol.

# MASTER_SYSTEM

## 1. What The System Is

Destination Command Center is the decision layer.

The network is made of three roles:

- `DCC`
- `EarthOS`
- `satellites`
- `operators`

DCC exists to answer the travel question first.
It should reduce ambiguity before the booking step starts.

## 2. Core Model

Primary model:

`Question -> Decision -> Execution`

Expanded network model:

`Traffic -> DCC entry -> decision surface -> satellite if needed -> operator / booking`

Durable operations model:

`DCC signal -> EarthOS mission -> operator approval if needed -> satellite dispatch -> telemetry / publication`

## 3. Non-Negotiable Rules

- no marketplace behavior on decision pages
- no giant option grids when a verdict is possible
- no chaining satellites
- no broker framing
- preserve direct booking truth where execution already exists

## 4. Role Boundaries

### DCC

- owns macro decision
- owns root route governance
- owns publish-state policy
- owns continuity contracts
- speaks the canonical `decision_*` continuity vocabulary at outbound seams

### EarthOS

- reads DCC context and live network pressure
- runs durable workflows for long-running synthesis, approvals, dispatch, and publication
- should not replace DCC route governance or scoring
- should not create a second continuity vocabulary

### Satellites

- narrow once
- compress uncertainty
- should not reopen broad exploration
- should normalize inbound traffic into `decision_*` internally even when transport contracts differ

### Operators

- execute
- own booking / checkout / fulfillment
- should not be turned into chooser layers
- should prefer canonical `decision_*` inputs and only read legacy lane/product params as fallback

## 5. EarthOS Surfaces

EarthOS now has live repo surfaces:

- `/dashboard`
  - internal Mission Control
- `/dashboard/missions/[id]`
  - detail, approval, contextual alerts, and publication
- `/live-ops`
  - public newsroom
- `/live-ops/[slug]`
  - public operational briefing pages

## 6. Current Live Lanes

### Red Rocks

- `DCC -> partyatredrocks`
- DCC frames the transport decision
- PARR owns execution
- PARR now posts `lead_captured`, `booking_started`, and `booking_completed` back to DCC across the Red Rocks checkout timeline
- continuity is now bilingual in practice:
  - canonical `decision_*`
  - legacy lane/product params preserved temporarily for compatibility

### Argo

- `DCC -> shuttleya`
- Shuttleya is the active Argo execution surface
- Shuttleya is now Argo-only in practice and no longer carries airport, Red Rocks, or mountain corridor residue
- current measurable outcome is `lead_captured`, not paid booking completion

### Swamp tours

- `DCC -> welcometotheswamp`
- WTS narrows swamp-tour uncertainty and routes into downstream booking

### New Orleans tours

- `DCC -> welcometoneworleanstours`
- mobile-first decision utility
- current pattern is Zero-Gate:
  - land
  - see verdict
  - click
  - book

### Juneau

- `DCC -> juneauflightdeck`
- Juneau now uses the shared decision-engine contract
- local Juneau scoring feeds the shared recommendation output shape
- outbound booking links now preserve canonical decision continuity, not just handoff IDs

### Alaska receiver

- `DCC -> wta-ui`
- Alaska / Juneau receiver surface with DCC handoff support
- signed payload remains the edge transport contract
- decoded payload is normalized into `decision_*` before downstream continuation
- item-specific handoffs can now resolve directly to concrete `/tours/[company]/[item]` routes
- otherwise WTA narrows through `/plan`, not broad `/tours` browsing

## 7. Shared Decision-Engine State

Current shared contract lives in DCC and is already used by:

- New Orleans
- Juneau

The engine returns:

- recommended option
- ordered alternatives
- penalties by option
- confidence level
- result IDs

This is a controlled rollout, not a mandate to force every corridor into the same UX.

## 8. Telemetry Reality

Decision validation currently matters more than new feature growth.

Current practical rule:

- instrument the decision
- measure whether users accept it
- only then expand or retune
- `/command` now surfaces the live satellite trinity:
  - PARR revenue-complete events
  - Shuttleya request captures
  - WTA lead and booking callbacks
- `/dashboard` now surfaces EarthOS workflow state:
  - running
  - waiting
  - failed
  - completed
  - publication-ready missions

Telemetry must stay atomic and analyzable.
Do not invent derived client events when reporting can compute the state.

## 9. What Not To Do

- do not add pages just to look bigger
- do not widen option surfaces into directories
- do not move operator logic into DCC
- do not treat all corridors as the same product
- do not optimize from opinion when measured behavior is available
- do not let EarthOS become a second decision layer
- do not let workflow output bypass the normalized mission intelligence contract

## 10. Current Priority

The current priority is not more architecture.

It is:

- keep the decision system coherent
- keep routing clean
- validate real user behavior
- tighten only after traffic and telemetry show the need

Current continuity reality:

- one canonical continuation vocabulary: `decision_*`
- one justified edge exception: signed DCC -> WTA payload transport
- temporary compatibility fields remain at some seams until old links age out

## 10A. Daily Spider Path + Machine Understanding Review

Machine-readable understanding is an active operational surface, not a one-time SEO task.

Spider Path means the intended crawl and understanding flow for AI crawlers, search engines, LLM agents, entity systems, recommendation systems, and other machine readers.

Required principle:

- the network should intentionally shape machine understanding
- DCC is the decision hub
- satellites narrow uncertainty
- operators execute
- marketplaces are fallback inventory
- continuity matters more than breadth

Daily checks:

- [ ] `llms.txt` validity
- [ ] `agent.json` validity
- [ ] Organization/WebSite schema integrity
- [ ] network relationship consistency
- [ ] execution hierarchy consistency
- [ ] canonical URL alignment
- [ ] sitemap freshness
- [ ] crawler-discoverable path continuity
- [ ] internal-link reinforcement
- [ ] SERP title clarity
- [ ] meta description decisiveness
- [ ] decision compression language
- [ ] marketplace fallback framing
- [ ] continuity preservation
- [ ] no stale marketplace wording
- [ ] no accidental "browse" language
- [ ] no contradictory execution claims
- [ ] no broken execution hierarchy references

Daily review questions:

- What are machines learning first?
- What relationships are they inferring?
- What execution layer appears primary?
- Are we reinforcing certainty or reopening optionality?
- Are we accidentally teaching "marketplace" instead of "decision continuity"?
- Which pages reinforce operational authority?
- Which pages weaken confidence?

Machine Understanding Drift means stale doctrine, contradictory metadata, stale descriptions, old marketplace assumptions, weak execution framing, entity ambiguity, or inconsistent crawler paths. If drift is found, log it as a governance finding and fix the machine-readable layer before pushing more traffic.

## 11. Current Persistence Reality

EarthOS persistence is now split:

- live workflow state from Vercel when available
- Postgres / Neon mission snapshots
- Postgres / Neon publication records
- seeded in-memory fallback for degraded local operation

This path is only truly live after migration + deploy.

## 12. Discovery Stack And Publication Layer

The network now treats public discovery files as governed assets, not ad hoc side effects.

Managed files:

- `sitemap.xml`
- `llms.txt`
- `agent.json`

Current implementation reality:

- DCC root `sitemap.xml` is now a governed sitemap index route
- EarthOS publishes discovery snapshots and KV-shaped payloads from shared contracts
- EarthOS records append-only discovery publication history in Neon via `earthos_discovery_publications`
- Viator-backed discovery intents may now publish winner metadata when the current resolver path can produce a governed result

Current verified publication state:

- the first live history write created 13 governed surface rows
- the Alaska receiver lane (`welcometoalaskatours`) now records a winner-backed publish for `helicopter-tours`
- winner drift is now measurable as a first-class publication change, not inferred after the fact

Role split for discovery publication:

- `DCC`
  - owns the root network index
  - owns the canonical machine-readable contract
  - owns the schema and publication doctrine
- `EarthOS`
  - is the only layer allowed to publish or update discovery-stack assets from shared system state
  - should derive discovery output from governed data, not hand-authored drift
- `satellites`
  - host their own discovery files at their own roots
  - must reflect their actual site role, governed intents, and downstream execution targets
- `operators`
  - host execution-truth discovery files for their own execution surfaces
  - must not impersonate DCC authority or satellite narrowing logic

Practical publication model:

- DCC is the authority and index
- each domain is still responsible for hosting its own first-party root files
- EarthOS governs the generation and distribution of those files from shared contracts

Hard rules:

- do not make each repo invent its own `agent.json` schema
- do not hand-edit production discovery files if EarthOS is the intended writer
- do not let satellites publish discovery contracts that contradict DCC routing doctrine
- do not let operator surfaces publish broad decision authority they do not own

## 13. Agent Contract

`agent.json` is the machine manual for agents, not a marketing summary.

It should declare:

- site role
- governing authority
- canonical node identity
- supported intents
- resolver identity when relevant
- execution targets
- handoff protocol and required params
- machine-readable endpoints

Current governing rule:

- one shared schema family for DCC, satellites, and operators
- role-specific fields may vary
- field names should remain stable across the network unless the schema doc changes first

See:

- [docs/discovery-stack-publication-layer.md](/home/ewrewr12/destinations-cc/docs/discovery-stack-publication-layer.md)
- [docs/agent-json-schema.md](/home/ewrewr12/destinations-cc/docs/agent-json-schema.md)

## 14. Codex Rule

When working in this repo:

- use the current repo state as source of truth
- preserve role boundaries
- keep DCC decision-first
- keep EarthOS orchestration-first, not decision-first
- keep execution layers direct
- update docs when live behavior changes
