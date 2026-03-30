# Network Page Build Checklist

Date: 2026-03-29

## System Rule

Use one network flow:

`Google -> DCC -> Satellite -> Action`

Intent split:
- DCC builds confidence with `explore` and `understand`
- Satellites narrow with `compare` or close with `act`
- Booking captures action

Quality rule for every page:
1. What intent does this page own?
2. What happens next?

If either answer is fuzzy, the page is wrong.

## DCC

Role:
- authority layer
- bridge layer
- traffic qualification
- warm-transfer trigger pages

Must not become:
- a chooser grid for every vertical
- a booking product catalog
- a duplicate of satellite compare pages

### Must-Have Now

#### New Orleans / swamp tours
- `EXISTS` `/new-orleans`
- `EXISTS` `/new-orleans/tours`
- `EXISTS` `/new-orleans/swamp-tours`
- `BUILD` `/new-orleans/swamp-tours/airboat-vs-boat`
- `BUILD` `/new-orleans/swamp-tours/best-time`
- `BUILD` `/new-orleans/swamp-tours/with-kids`
- `BUILD` `/new-orleans/swamp-tours/worth-it`
- `BUILD` `/new-orleans/swamp-tours/transportation`
- `BUILD` `/new-orleans/swamp-tours/types`

Required job:
- explain what swamp tours are
- frame main option types and tradeoffs
- push decision-intent users into WTS `/plan`

#### Red Rocks transport
- `EXISTS` `/red-rocks`
- `EXISTS` `/red-rocks-transportation`
- `EXISTS` `/red-rocks-parking`
- `EXISTS` `/red-rocks-shuttle-vs-uber`
- `EXISTS` `/how-to-get-to-red-rocks-without-parking-hassle`
- `EXISTS` `/best-transportation-options-denver-to-red-rocks`
- `EXISTS` `/private-vs-shared-shuttles-to-red-rocks-denver-guide`
- `BUILD` `/red-rocks/transportation`
- `BUILD` `/red-rocks/shuttle-vs-uber`
- `BUILD` `/red-rocks/parking`

Required job:
- explain all main transport options
- frame logistics pain honestly
- trigger PARR action handoff for show-night intent

#### Vegas
- `EXISTS` `/las-vegas`
- `EXISTS` `/las-vegas/hotels`
- `BUILD` `/las-vegas/shows`
- `BUILD` `/las-vegas/best-shows-for-first-timers`
- `BUILD` `/las-vegas/shows/worth-it`

Required job:
- explain show categories, hotel zones, price expectations
- route decision-intent users to SOTS rather than duplicating its chooser layer

#### Alaska
- `EXISTS` `/juneau/helicopter-tours`
- `EXISTS` `/juneau-whale-watching-from-port`
- `BUILD` `/juneau`
- `BUILD` `/ports/juneau`
- `BUILD` `/juneau/tours`

Required job:
- explain excursion types, cruise timing, weather, and fit
- hand compare-intent users into WTA decision pages

### Next Wave
- `BUILD` `/new-orleans/swamp-tours/wildlife`
- `BUILD` `/red-rocks/is-shuttle-worth-it`
- `BUILD` `/las-vegas/cirque-vs-magic`
- `BUILD` `/las-vegas/cheap-vs-premium-shows`
- `BUILD` `/ports/skagway`
- `BUILD` `/ports/ketchikan`

### Later / Support Only
- light context pages for wildlife, geology, local history, or venue background
- only build when they reinforce authority and feed a bridge page

## WTS

Role:
- swamp-tour decision satellite
- own `compare`
- keep `/plan` as canonical intake

Must not become:
- a broad swamp encyclopedia
- a giant list of interchangeable tours
- a duplicate of DCC authority pages

### Must-Have Now
- `EXISTS` `/plan`
- `EXISTS` `/choose-the-right-tour`
- `EXISTS` `/what-its-like`
- `EXISTS` `/from-new-orleans`
- `EXISTS` `/live-options`
- `BUILD` `/with-kids`
- `BUILD` `/best-time`
- `BUILD` `/worth-it`
- `BUILD` `/transportation`
- `BUILD` `/types`
- `BUILD` shortlist and “best for” states inside `/plan`

Required job:
- answer fast
- use tradeoff framing
- route every entry surface into `/plan`
- keep act-stage forward motion clean once the user has enough confidence

### Next Wave
- `BUILD` `/best-for-families`
- `BUILD` `/best-for-comfort`
- `BUILD` `/best-for-speed`

### Later / Support Only
- keep supporting explainers only when they clearly help choice clarity
- cut or merge anything that drifts into generic swamp education

## PARR

Role:
- Red Rocks action satellite
- own transport action intent
- close booking fast

Must not become:
- a broad Red Rocks guide site
- a slow editorial funnel

### Must-Have Now
- `EXISTS` `/book/red-rocks-amphitheatre`
- `BUILD` `/book/red-rocks-amphitheatre/shared`
- `EXISTS` `/book/red-rocks-amphitheatre/private`
- `EXISTS` `/guide/local/denver-pickups`
- `BUILD` hotel or pickup-specific launch pages where demand exists
- `BUILD` post-booking state such as `/booking/[token]`

Required job:
- confirm intent immediately
- present shared and private choices fast
- remove friction around pickup, return, and timing

### Next Wave
- `BUILD` compare pages for shuttle vs driving, private vs shared, and shuttle worth it
- these should convert directly, not broaden the funnel

### Later / Support Only
- operator trust pages only when they support action and booking confidence

## WTA

Current repo surface:
- satellite app exists as `apps/juneauflightdeck`
- `EXISTS` `/` in the app as current Juneau home surface

Role:
- Alaska decision to action satellite
- narrow excursion choices after DCC authority pages

Must not become:
- a generic Alaska blog
- a duplicate of DCC port education

### Must-Have Now
- `EXISTS` app home for Juneau intake
- `BUILD` `/juneau`
- `BUILD` `/whale-watching-vs-glacier`
- `BUILD` `/best-for-short-cruise-stop`
- `BUILD` shortlist state that narrows to 2 to 4 options
- `BUILD` booking handoff or embedded booking path after shortlist confidence is high enough

Required job:
- compare excursion types
- frame cruise-window tradeoffs
- narrow to the best-fit shortlist fast

### Next Wave
- `BUILD` `/helicopter-vs-boat`
- `BUILD` `/best-for-wildlife`
- `BUILD` `/best-for-scenic`
- `BUILD` `/skagway`
- `BUILD` `/ketchikan`

### Later / Support Only
- add more ports only after Juneau routing proves out

## SOTS

Current repo surface:
- satellite app exists as `apps/saveonthestrip`
- `EXISTS` `/shows`
- `EXISTS` `/shows/[slug]`
- `EXISTS` `/shows/sphere`
- `EXISTS` `/hotels`
- `EXISTS` `/hotels/[slug]`

Role:
- Vegas decision satellite
- narrow users into the right show, stay, or deal

Must not become:
- a Vegas encyclopedia
- a duplicate of DCC overview pages

### Must-Have Now
- `EXISTS` `/shows`
- `EXISTS` `/hotels`
- `BUILD` `/best-shows-for-first-timers`
- `BUILD` `/cirque-vs-magic`
- `BUILD` `/cheap-vs-premium`
- `BUILD` `/best-for-couples`
- `BUILD` `/best-budget`
- `BUILD` `/best-luxury`

Required job:
- build shortlist logic
- compare vibe, price, and fit
- move users into tickets or deals without reopening the whole Vegas overview

### Next Wave
- `BUILD` hotel compare pages by budget, couple, luxury, and first-time fit
- `BUILD` action pages for ticket or deal conversion where the category hubs already prove demand

### Later / Support Only
- add more deal templates only when they support the compare to action flow

## Minimum Viable Build Order

### Phase 1
- DCC `/new-orleans/swamp-tours` bridge cluster
- WTS `/plan` plus compare-entry coverage
- DCC Red Rocks transport cluster
- PARR shared and private booking flows

### Phase 2
- DCC Juneau authority pages
- WTA Juneau compare cluster
- DCC Vegas shows hub and first bridge pages
- SOTS compare cluster for shows

### Phase 3
- SOTS hotels compare cluster
- WTA new ports
- DCC support pages only where gaps remain in authority or routing

## Immediate Execution Queue

1. Build DCC swamp bridge pages under `/new-orleans/swamp-tours/*`.
2. Build missing WTS compare-entry pages that all route into `/plan`.
3. Build PARR shared booking page and direct Red Rocks compare pages.
4. Normalize Red Rocks DCC pages under nested routes while keeping legacy pages redirectable.
5. Build DCC Juneau authority cluster and WTA Juneau decision cluster.
6. Build DCC Vegas shows hub and SOTS compare pages.

## Final Rule

You do not need thousands of pages.

You need the right pages at the right intent layer with a clear next step.
