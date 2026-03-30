# Travel System Master Plan (Live - Production Aligned)

## Core Doctrine

`DCC = understand`  
`Satellite = choose`  
`PARR = act`

The system moves users through:

`understand -> decide -> book`

The goal is to do that without:
- losing context
- duplicating intent
- splitting execution

## Current State

The Red Rocks system is now built, deployed, and production-aligned.

The key transition is complete:
- previously, the system was correct in code but inconsistent in production
- now, the DCC -> PARR seam is enforced live

The current job is no longer core architecture work. It is:
- validate the live funnel
- clean remaining edge cases
- finish redirect and crawl cleanup
- confirm that DCC is actually moving users into PARR

## Operating Rule

For every route:
- if it helps the user understand, it belongs in `DCC`
- if it helps the user choose, it belongs in a `Satellite`
- if it helps the user act or pay, it belongs in `PARR`

If a route tries to do more than one of those jobs, it should be split, redirected, or removed.

## Core Insight

The Red Rocks opportunity is not generic transport demand.

It is a repeated planning failure:
- parking friction
- rideshare unreliability after shows
- long exits
- congestion
- weak fallback options

That means the real product is not just transportation.

It is solving the most fragile part of the Red Rocks night.

## Live System

### DCC

Role:
- authority
- explanation
- comparison
- routing

Owns:
- intent capture
- hidden-problem framing
- decision framing
- constraint -> rule -> action
- routing into the next surface

Does not own:
- booking
- checkout
- transaction execution

Current live pages:
- hub: [`/red-rocks-transportation`](/home/ewrewr12/destinations-cc/app/red-rocks-transportation/page.tsx)
- feeders:
  - [`/red-rocks-shuttle-vs-uber`](/home/ewrewr12/destinations-cc/app/red-rocks-shuttle-vs-uber/page.tsx)
  - [`/how-to-get-to-red-rocks-without-parking-hassle`](/home/ewrewr12/destinations-cc/app/how-to-get-to-red-rocks-without-parking-hassle/page.tsx)
  - [`/best-way-to-leave-red-rocks`](/home/ewrewr12/destinations-cc/app/best-way-to-leave-red-rocks/page.tsx)
- upstream framing:
  - [`/red-rocks`](/home/ewrewr12/destinations-cc/app/red-rocks/page.tsx)
  - [`/red-rocks-events`](/home/ewrewr12/destinations-cc/app/red-rocks-events/page.tsx)

Live behavior:
- feeder pages push to the hub and to PARR
- the hub unifies the decision and pushes to PARR
- legacy Red Rocks transport and booking paths now redirect to canonical targets
- DCC -> PARR links carry source and return context

### Satellite Layer

Role:
- narrowing
- shortlist
- decision support

Current state:
- `WTS` is frozen
- `WTA` is stable and instrumented
- telemetry is being used for diagnosis, not expansion-by-default

### PARR

Role:
- execution
- booking
- payment
- confirmation

Owns:
- all Red Rocks transport transactions
- shared and private booking flows

Hard rule:
`PARR` is the only Red Rocks act layer.

Current state:
- canonical shared booking path is enforced
- legacy `/shared` redirects to the canonical shared path
- homepage messaging is aligned around relief and certainty
- shared and private booking are clearly separated inside the operator surface

Canonical shared booking path:
`/book/red-rocks-amphitheatre/custom/shared`

Private booking remains a valid second execution path for group/private intent.

## Red Rocks Funnel

Current live flow:

`query -> DCC feeder/hub -> PARR booking`

### Decision Hub

Canonical DCC hub:

`/red-rocks-transportation`

Purpose:
- state the problem clearly
- compare the main options
- make a recommendation
- push to booking

### Feeders

Current feeder set:
- `shuttle vs Uber`
- `without parking hassle`
- `best way to leave`

Feeder rule:
- one page = one constraint
- feed the hub or hand off cleanly
- do not compete with the hub

### Execution

Canonical operator domain:
`partyatredrocks.com`

Primary shared booking path:
`/book/red-rocks-amphitheatre/custom/shared`

## What Has Been Enforced

### DCC -> PARR Seam
- DCC local booking routes redirect to PARR
- DCC CTAs point to PARR
- local Red Rocks execution has been removed from the main flow

### Canonical Control
- legacy booking variants redirect
- canonical booking path is enforced
- DCC runtime redirect layer is live

### Governance
- route registry exists
- `clusterRole` and `canonicalTarget` are part of the schema
- Red Rocks hub / feeder / redirect relationships are encoded

### Internal Link Cleanup
- stale booking links were removed
- redirected targets were removed from active linking
- checkout leakage was removed from active Red Rocks handoff paths

## Live Redirect Verification

Verified on production:
- `/book/red-rocks` -> `308` -> canonical PARR shared booking
- `/book/red-rocks-amphitheatre` -> `308` -> canonical PARR shared booking
- `/best-transportation-options-denver-to-red-rocks` -> `308` -> `/red-rocks-transportation`
- `/denver-concert-shuttle` -> `308` -> `/red-rocks-transportation`
- `/red-rocks-transportation` -> `200`

Meaning:
- duplicate booking paths were removed
- duplicate Red Rocks transport pages were consolidated
- the canonical Red Rocks funnel is enforced live

## What Was Fixed

Completed:
- live-city schema validation issue
- invalid city mode handling in live-city registry parsing
- missing `LIVE_CITY_REGISTRY` export
- DCC production build pipeline
- `destinations-cc` production deployment
- live DCC redirect layer

## What Still Needs Work

### Search Console Cleanup
- export 404s and indexed wrong URLs
- map each to `301` or `410`

### Crawl Validation
- check redirect chains
- check orphan pages
- check for missed legacy paths

### Broader Route Compression
- apply the same canonical control and deletion discipline outside the Red Rocks slice

### Funnel Validation
- confirm users actually move from DCC into PARR
- confirm the hub and feeders are producing outbound booking intent, not just pageviews

## Current Phase

### Post-Deploy Validation and Tightening

Current sequence:
1. validate live redirects and canonical behavior
2. complete Search Console cleanup
3. run crawl-level checks
4. confirm DCC -> PARR movement
5. compress adjacent route clusters where duplication still exists

## Messaging Standard

The system should speak in terms of real planning friction.

Weak framing:
- “Here are your options”

Correct framing:
- “Most people underestimate getting home”
- “The night usually breaks on the way out”
- “Skip the parking mess and post-show scramble”

Guiding line:
`The night should not fall apart after the encore.`

## Telemetry

Telemetry remains active, especially on WTA.

Purpose:
- diagnose breakpoints
- identify mismatch
- support narrow decisions with data

Not:
- justify broad expansion without proof

## What Not To Do

Do not:
- expand to more cities yet
- start new clusters
- add broad new features
- redesign the whole system
- create pages without a clear role

## Current Priorities

1. validate the live Red Rocks funnel
2. complete redirect and Search Console cleanup
3. keep DCC and PARR boundaries hard
4. confirm the DCC -> PARR conversion path is working
5. apply the same compression discipline to nearby route clusters

## Final Truth

This is not primarily a content site.  
This is not primarily a shuttle site.

It is a problem-solving funnel for a repeated, high-friction moment.
