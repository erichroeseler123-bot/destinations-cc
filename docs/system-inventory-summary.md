# System Inventory Summary

Purpose: give a human-readable view of the governed network without requiring a fresh session to parse `src/data/system-inventory.ts` first.

Canonical source:

- [src/data/system-inventory.ts](/home/ewrewr12/destinations-cc/src/data/system-inventory.ts)

This document is a readable summary of that Rolodex.
If this summary and the Rolodex ever disagree, trust the Rolodex.

## What Exists

The current live system is smaller than the full repo history.
Read it in three buckets:

- `ACTIVE`: what the team is tightening now
- `PROMOTED`: what DCC should still surface and route traffic to
- `TRASH`: legacy and prototype residue that should not influence decisions

That model is more useful than raw route counts.

There is a second distinction that matters just as much:

- `ACTIVE` does not mean "the only real lanes"
- it means "the lanes being optimized hardest right now"

The broader live network is a set of parallel lanes connected by DCC.

## Root DCC Surfaces

Primary governed root surfaces include:

- promoted:
  - `/`
  - `/command`
  - `/red-rocks-transportation`
  - major decision corridors like Sedona, New Orleans swamp tours, Juneau helicopter, Juneau whale, and Western Wisconsin

- indexable:
  - `/mighty-argo-shuttle`
  - Argo feeder pages like:
    - `/argo-parking-vs-shuttle`
    - `/denver-to-argo-transportation`
  - other corridor pages that are live but not currently promoted

- live unpromoted:
  - `/how-to-get-to-argo-cable-car-from-denver`

- live unpromoted utilities:
  - `/book`
  - `/track`
  - `/red-rocks/status`

Role:

- DCC owns macro decision
- DCC owns publish state at the root layer
- DCC owns continuity and promoted intake logic

## Active Workbench

These are the three repos and surfaces that matter most right now:

- `destinations-cc`
- `shuttleya`
- `partyatredrocks`

The two live proof loops are:

- `DCC -> PARR`
- `DCC -> Shuttleya -> booking`

These are the loops currently being tightened most aggressively.
They are not the only live lanes in the network.

Recent continuity hardening also normalized:

- `DCC -> WTA`
- `DCC -> Juneau Flight Deck`
- `DCC -> 420 Friendly Airport Pickup`
- `DCC -> GoSno`
- `DCC -> Lake Tahoe`
- `DCC -> Sedona Jeep`

## Promoted Network Assets

These are real network assets that still deserve promotion when they are the correct next step:

- `welcometotheswamp`
- `welcometoalaska` / `wta-ui`
- `gosno`
- `redrocksfastpass`

Important role notes:

- `shuttleya` is active but only for Argo right now
- `welcometotheswamp` is a real narrowing satellite
- `welcometoalaska` / `wta-ui` is a real Alaska receiver and narrowing surface
- `gosno` is a real execution endpoint for mountain transport
- `redrocksfastpass` is a scoped execution system, not canonical PARR truth

## Network Of Lanes

The live system should be understood as parallel lanes with one shared router.

- `DCC` routes intent
- `PARR` executes Red Rocks bookings
- `GoSno` executes mountain transport
- `Shuttleya` currently handles Argo as the action and booking lane
- `WTS` narrows swamp-tour traffic and monetizes through downstream affiliate or partner paths
- `WTA` narrows Alaska and Juneau excursion traffic and routes into the right downstream local-tour path
- `redrocksfastpass` is a selective execution lane, not the default Red Rocks truth

Mental model:

- intent -> DCC -> correct endpoint -> money

Current continuity rule:

- DCC emits canonical `decision_*` context
- receivers should prefer `decision_*`
- legacy lane/product fields remain only as fallback compatibility where old links still exist

This is a multi-lane travel routing network, not a single funnel.

## Operators

Current execution operators in inventory:

- `parr`
- `argo`
- `gosno`

Meaning:

- operators are the fulfillment or execution counterparties
- the current live execution priority is simpler than older docs implied

Current execution rule:

- booking-ready Red Rocks traffic -> `parr`
- booking-ready mountain transport -> `gosno`
- Argo traffic -> `shuttleya` because Shuttleya is the live action and booking surface there

## Corridor Execution Split

The network currently runs two clean patterns.

Direct execution:

- `DCC -> PARR` for Red Rocks booking-ready intent
- `DCC -> GoSno` for booking-ready mountain transport intent

Narrow once, then execute:

- `DCC -> Shuttleya -> booking` for Argo
- `DCC -> WTS` for swamp-tour ambiguity
- `DCC -> WTA` for Alaska cruise and port ambiguity

Hard rule:

- never chain satellites
- never send a booking-ready user into an unnecessary continuation layer
- never downgrade a committed or continuing `decision_*` handoff into a generic chooser unless route recovery actually fails

## Proof-Corridor Surfaces

The current proof loops are:

- Red Rocks:
  - DCC entry surfaces like `/red-rocks-transportation`
  - canonical execution on `partyatredrocks.com`

- Argo:
  - DCC entry surfaces like `/mighty-argo-shuttle` and the Argo feeder pages
  - canonical action and booking on `shuttleya`

## Providers

Provider inventory is sourced from the provider registry.
Read the Rolodex for the exact active list and capabilities.

Use provider inventory to answer:

- which providers exist
- which are primary or fallback
- which surfaces are allowed to expose provider-backed content

## Practical Startup Rule

For a fresh session:

1. Read this summary
2. Open [src/data/system-inventory.ts](/home/ewrewr12/destinations-cc/src/data/system-inventory.ts)
3. Open [docs/codex-start-here.md](/home/ewrewr12/destinations-cc/docs/codex-start-here.md)
4. Open [docs/live-loop-routing-rule.md](/home/ewrewr12/destinations-cc/docs/live-loop-routing-rule.md)
5. Open [docs/promotion-rule.md](/home/ewrewr12/destinations-cc/docs/promotion-rule.md)
6. Run `make coherence-audit` before changing architecture or doctrine

That should eliminate most rediscovery.
