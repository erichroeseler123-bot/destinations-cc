# Red Rocks War Board

## Objective

Make one Red Rocks acquisition -> decision -> booking funnel work cleanly.

Target flow:
`query -> DCC page -> /red-rocks-transportation -> PARR booking`

## Current Wins

- canonical shared booking path is enforced on PARR
- legacy `/shared` is a hard redirect
- DCC local Red Rocks booking routes redirect to PARR
- `/red-rocks-transportation` is the active decision hub
- `/red-rocks-shuttle-vs-uber` is now a real feeder
- upstream DCC Red Rocks pages now frame transport as the hidden problem
- PARR homepage messaging now leads with relief, not generic booking

## Next Moves

### 1. Finish the feeder set
- rewrite `/how-to-get-to-red-rocks-without-parking-hassle`
- build or tighten `best way to leave Red Rocks`
- keep each feeder to one constraint and one recommendation

### 2. Complete redirect coverage
- export live 404s from Search Console for both domains
- map `301` vs `410`
- prioritize legacy PARR booking and Red Rocks transport URLs first

### 3. Validate the live funnel
- crawl both deployed domains
- check for 404s
- check for redirect chains
- check for orphan pages
- confirm all hub / feeder / booking links resolve cleanly

### 4. Measure forward motion
- confirm DCC pages are pushing users into PARR
- watch click-forward and booking-start behavior
- ignore low-signal metrics until path quality is stable

## Guardrails

- no new city expansion
- no new clusters
- no broad redesign
- no page ships without a clear role
- no DCC route should execute Red Rocks booking

## What Needs Human Input

- Search Console 404 export for both domains
- final keep / redirect / kill decisions on remaining Red Rocks-adjacent review routes
- live crawl / deployment confirmation once these changes are shipped
