# 1. System Overview

Destination Command Center (DCC) is the decision layer.

Satellite sites and apps, including Last Frontier Shore Excursions and similar corridor surfaces, are decision surfaces.

Operators and execution platforms, including Viator, Party at Red Rocks, and other direct booking or operator-owned flows, are execution layers.

The system exists to help users decide first, then route them into the correct booking or execution path.

We do not operate as a traditional broker or marketplace.

# 2. Core Model

Primary model:

Question -> Decision -> Booking

Expanded model:

Traffic -> Feeder page -> Decision page -> Operator booking

The system should remove uncertainty before the transaction starts.

# 3. Key Rules (Non-negotiable)

- No traditional blog structure.
- No large option lists.
- No marketplace UI.
- No “we are a broker” positioning.
- Always preserve:
  - same tour
  - same price
  - direct with operator
  - decision support

# 4. Current Funnel (Alaska example)

Current Alaska shape:

Homepage -> Cruise page -> Port page -> Feeder -> Decision -> Booking

Key live routes in that path:

- `/best-alaska-cruise-for-excursions`
- `/juneau/whale-watch-and-dogsled-same-day`
- `/juneau/helicopter-tour-weather-risk`
- `/juneau/is-whale-watching-worth-it`
- `/skagway/white-pass-train-worth-it`

Supporting flow examples:

- homepage -> `/best-alaska-cruise-for-excursions`
- `/juneau` -> `/best-alaska-cruise-for-excursions`
- `/skagway` -> `/best-alaska-cruise-for-excursions`
- feeder page -> strongest port/category decision lane
- decision lane -> operator booking or direct execution surface

# 5. Telemetry Model

Tracked event names currently in use include:

- `cta_clicked_primary`
- `cta_clicked_alternative`
- `product_opened`
- `cruise_port_selected`
- `booking_opened`

Not tracked directly:

- static copy blocks such as the Last Frontier homepage trust block

Current telemetry file used for quick audit/debug reads:

- `destinations-cc/data/telemetry/cruise-debug-events.jsonl`

# 6. Current State (IMPORTANT)

Current reality:

- the system is live
- tracking is wired
- feeder pages exist

But:

- there is not enough real traffic yet
- there is not enough decision signal yet

Instrumentation exists, but stored event signal for the new Alaska feeder paths is still effectively absent.

# 7. Current Priority

We are not building new features.

Current priority is:

- driving traffic
- validating decisions
- observing behavior

# 8. What NOT to do

- do not add more pages blindly
- do not redesign UI
- do not introduce broker/fee messaging
- do not optimize without data

# 9. Next Actions

- drive traffic into feeder pages
- monitor decision events
- adjust only after real behavior appears

# 10. Instructions for Codex

When working in this repo or related repos:

- read this file first
- do not contradict these rules
- do not introduce new models
- always preserve decision-first architecture
