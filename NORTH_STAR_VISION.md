# Final Product Vision: One Connected Travel Coordination and Transaction Network

> **Canonical Governance & Architecture Reference (`v1.0` — Locked `2026-11-11`)**
> Applies across the entire 11-project owned production fleet (`destinationcommandcenter.com`, `cruisepromenade.com`, `rollcallusa.com`, `lastfrontiershoreexcursions.com`, `juneauflightdeck.com`, `welcometoneworleanstours.com`, `welcometotheswamp.com`, `welcometothedells.com`, `saveonthestrip.com`, `gosno.co`, `partyatredrocks.com`) and the isolated partner boundary (`welcometoalaskatours.com`).

In the perfect world, this is not a collection of unrelated websites. It is one connected travel operating system with specialized storefronts for different travelers, destinations, and services.

Cruise Promenade organizes private groups. Destination Command Center understands the trip. RollCallUSA provides an optional sailing-wide social layer. The specialist sites capture destination demand. Operator systems provide live inventory and fulfillment. One commercial ledger tracks bookings and commissions. One control center shows Erich only the exceptions requiring attention.

---

## Permanent Operating Requirements

These requirements are non-negotiable:

1. **GoSno must remain continuously bookable for all existing transportation services.**
2. **Party at Red Rocks must remain continuously bookable for all existing event and transportation services.**
3. Neither business may depend on DCC, Cruise Promenade, or another property being available for its ordinary booking flow to work.
4. Existing products, pricing, orders, customer records, booking links, payment processing, and fulfillment workflows must be preserved.
5. **No existing public pages may be deleted.**
6. Existing URLs must remain functional. Pages may be improved in place, but they must not be removed or redirected without Erich’s explicit approval.
7. New ecosystem connections must be additive and backward-compatible.
8. Deployments must use safe releases, health checks, rollback references, and feature flags so existing booking paths remain available during upgrades.
9. If a new cross-site feature fails, GoSno and Party at Red Rocks must fall back to their existing standalone booking experiences.
10. Customer data, partner data, active orders, commissions, affiliate identifiers, and payout ownership must never be guessed, silently replaced, or lost.

---

## System Map

```text
Cruise lines · Ports · Operators · Weather · Roads · Venues · Regulations
                                ↓
              DESTINATION COMMAND CENTER
       Travel graph · Timing logic · Sources · Live status
                                ↓
       ┌────────────────────────┼─────────────────────────┐
       ↓                        ↓                         ↓
Cruise Promenade           RollCallUSA          Specialist Properties
Private group plan      Opt-in ship social     JFD · LFSE · WNO · WTA
                                               GoSno · Party at Red Rocks
       └────────────────────────┼─────────────────────────┘
                                ↓
                    Universal Commerce Router
         Rezgo · Rezdy · FareHarbor · OCTO · Marketplaces
                                ↓
             Reservation · Payment · Voucher · Commission
                                ↓
                    Single Owner Control Center
```

---

## 1. Destination Command Center Is the Intelligence Layer

Destination Command Center maintains the source-backed travel graph used by the rest of the ecosystem.

It understands:

- Cruise sailings and port calls
- Arrival and departure times
- Berths, terminals, docks, and tender operations
- Official all-aboard information when available
- Clearly labeled modeled assumptions when official information is unavailable
- Travel time between coordinates
- Operator check-in requirements
- Tour duration and meeting points
- Accessibility and physical requirements
- Weather and environmental conditions
- Official road, venue, port, and safety notices
- Passport, visa, and regulatory requirements
- Live operator availability and pricing

Every material fact records:

- Its source
- When it was retrieved
- When it applies
- Its confidence level
- Whether it is official, modeled, reported, or unverified
- What replaced or superseded it

DCC never treats a weather forecast as proof that a road, venue, vessel, aircraft, or tour is operating. Operational status comes from the responsible operator or authority.

DCC supplies intelligence to the other properties, but it does not become a fragile dependency that can disable GoSno or Party at Red Rocks.

---

## 2. Cruise Promenade Is the Private Group Headquarters

A traveler searches for an exact cruise:

> Norwegian Bliss departing June 5, 2027

They reach the exact sailing page and select:

> Start a private group plan

Cruise Promenade creates the full sailing automatically:

- Pre-cruise hotel and arrival coordination
- Embarkation meetup
- Port days
- Sea days
- Excursions
- Dinners and theme nights
- Shows and onboard meetups
- Shared group costs
- Disembarkation plans
- Airport and hotel transportation
- Calendar export
- Offline pocket itinerary

The organizer sends one private link. Participants do not need to install an application or create an account.

Travelers can identify their status for each activity:

- Interested
- Going
- Booked
- Booked somewhere else
- Undecided
- Not for me
- Organizer follow-up needed

The organizer can see:

- How many people want each activity
- Who booked the same departure
- Who booked a competing option
- Which travelers have not responded
- Whether an activity fits the ship’s schedule
- Whether enough people are interested to request private group options

Cruise Promenade does not force everyone into the same excursion. It makes every group split visible and manageable.

---

## 3. RollCallUSA Is the Optional Sailing-Wide Social Layer

Cruise Promenade remains private to the family, hosted group, reunion, wedding, or travel-advisor group.

RollCallUSA lets ordinary passengers opt into a broader sailing community.

Passengers can voluntarily find:

- People meeting for drinks
- Solo travelers attending trivia
- Dinner companions
- Passengers joining independent excursions
- Families with similar interests
- Informal onboard events
- Last-minute openings

A traveler may participate in both systems:

- Cruise Promenade contains their private group plan.
- RollCallUSA contains only the social information they intentionally share.

Cabin numbers, confirmation numbers, private payment status, and protected group details never enter the public social layer.

---

## 4. Specialist Sites Are Focused Storefronts

Each specialist site remains useful independently while receiving optional intelligence and contextual handoffs from DCC and Cruise Promenade.

### Juneau Flight Deck

Juneau Flight Deck handles aviation-oriented discovery and concierge inquiries:

- Flightseeing
- Glacier landings
- Aircraft and tour information
- Weather limitations
- Passenger requirements
- Schedule-fit evaluation
- Alternative planning when aviation is unavailable

It must not claim to possess live aircraft inventory unless an authorized operator connection confirms it.

### Last Frontier Shore Excursions

Last Frontier handles Alaska cruise excursions:

- Whale watching
- Glaciers
- Wildlife
- Rail excursions
- Private vehicles
- Port-window compatibility
- Ship-specific timing

Bookable, inquiry-only, external, and commercially held products remain clearly distinguished.

### Welcome to New Orleans Tours

WNO handles:

- Swamp tours
- French Quarter experiences
- Food, music, and history
- Hotel pickup
- Pre-cruise and post-cruise activities
- Luggage and airport timing
- Direct and marketplace checkout options

### Welcome to Alaska Tours

Welcome to Alaska Tours remains an isolated partner property controlled by Erich’s friend.

It can participate through authorized Rezgo connections without surrendering:

- Brand control
- Customer ownership
- Pricing control
- Payout ownership
- Operator credentials
- Existing booking operations

No redirect, retirement, migration, commercial change, or shared-data expansion occurs without explicit agreement.

---

## 5. GoSno Remains a Continuously Bookable Transportation Business

GoSno is not reduced to a DCC module or supporting page. It remains a complete, independent transportation business.

Customers must always be able to:

- View existing routes and services
- Review vehicle options
- Receive a quote where applicable
- Select pickup and destination
- Enter passenger, luggage, and service-animal requirements
- Book existing transportation
- Pay through the established payment flow
- Receive confirmation
- Have the reservation provisioned into Rezdy
- Receive operational support

DCC may enhance GoSno by supplying:

- Destination context
- Road and weather information
- Corridor guidance
- Trip timing
- Cross-site referrals
- Owner reporting

Those enhancements cannot interrupt checkout.

If DCC, Cruise Promenade, or an external intelligence service is unavailable, GoSno continues using its established pricing, booking, payment, and Rezdy systems.

Every GoSno automation must remain:

- Idempotent
- Protected from duplicate bookings
- Protected from duplicate charges
- Protected from repeated customer or supplier messages
- Limited by retry caps
- Recoverable through manual review
- Visible in the owner dashboard
- Reversible through an independent operational kill switch

Existing GoSno pages remain available and are improved in place rather than removed.

---

## 6. Party at Red Rocks Remains Continuously Bookable

Party at Red Rocks remains an independent event-transportation storefront.

Customers must always be able to:

- Find existing transportation services
- Review current event dates
- Select established vehicle classes
- See existing prices
- Request or book transportation
- Pay through the established checkout
- Receive confirmation
- Access existing order information

DCC may enhance Party at Red Rocks with:

- Official event information
- Venue timing
- Transportation context
- Weather information
- Owner reporting
- Cross-site discovery

These enhancements cannot disable existing booking.

If the DCC event feed, venue feed, or another ecosystem service is unavailable, Party at Red Rocks must continue showing and selling its existing services through its established booking flow.

Officially announced events can be added continuously. When a future event has not been officially announced, the site may present a truthful custom transportation or interest-request option without inventing performers or dates.

Existing Party at Red Rocks pages, service pages, event pages, and booking paths remain live.

---

## 7. No-Deletion and URL-Preservation Policy

The ecosystem grows additively.

No existing public page is deleted simply because a newer design, route, or product exists.

Instead:

- Improve the existing page
- Preserve its URL
- Preserve useful search history
- Update inaccurate information
- Add clearer navigation to newer experiences
- Keep safe legacy functionality operational
- Mark unavailable products truthfully
- Preserve customer-accessible order routes

Redirects, consolidations, or retirements require explicit owner approval and a documented migration plan.

This policy applies across:

- Destination Command Center
- Cruise Promenade
- RollCallUSA
- GoSno
- Party at Red Rocks
- Juneau Flight Deck
- Last Frontier Shore Excursions
- Welcome to New Orleans Tours
- Welcome to the Swamp
- Welcome to Alaska Tours
- All other connected properties

---

## 8. One Operator Connection Powers Multiple Authorized Surfaces

An operator completes one controlled onboarding process:

1. Identifies the business.
2. Connects Rezgo, Rezdy, FareHarbor, Bókun, OCTO, or another supported system.
3. Selects which products may be distributed.
4. Confirms retail prices and commissions.
5. Supplies meeting points, duration, capacity, and policies.
6. Defines ship-delay and cancellation rules.
7. Runs a non-customer test.
8. Approves production activation.

Authorized inventory may then appear on:

- DCC
- Cruise Promenade
- Relevant specialist sites
- Approved external travel applications
- Authorized AI assistants
- Travel-advisor systems

The operator continues managing availability and reservations through its existing system.

No product is distributed beyond the operator’s authorization.

---

## 9. Group Interest Becomes a Commercial Opportunity

Suppose 18 passengers express interest in whale watching.

The system recognizes that individual retail tickets may not be the only option and presents:

> Your group may qualify for coordinated or private whale-watching options.

DCC checks:

- Port window
- Departure times
- Transportation
- Capacity
- Return buffer
- Operator rules
- Live pricing when available

The organizer can choose to:

- Reserve seats on a scheduled departure
- Request a private vessel
- Split the group across coordinated departures
- Continue through individual marketplace checkout
- Record existing external reservations

Nothing is described as available until the responsible operator confirms it.

---

## 10. Authorized Humans and Machines Can Book Safely

A traveler or AI assistant may request:

> Book a Juneau whale watch

*(Downstream Universal Commerce Router, Commercial Ledger, and Single Owner Control Center requirements anchored by the System Map, Intro, and Permanent Operating Requirements:)*

### 10A. Safe Human & Machine Execution (`Universal Commerce Router`)
- Machine-readable contracts (`/.well-known/dcc-site`, `/agent.json`, `/llms.txt`, structured availability/fit endpoints) expose verified timing, schedule fit, operator policies, and authorized booking channels without scraping or guessing.
- Humans and authorized AI assistants never execute blind or unauthorized charges: every transaction routes through an operator-authorized connector (`Rezgo`, `Rezdy`, `FareHarbor`, `OCTO`, `Direct MoR`, or frozen `Marketplace Affiliate` handoffs) with explicit traveler consent, schedule-fit validation, idempotency keys, and voucher/confirmation verification.

### 10B. One Commercial Ledger (`Strict Accounting & Attribution Separation`)
- One durable commercial ledger tracks opaque click attribution, reservations, payment capture, vouchers, supplier provisioning, commission ownership, and settled payouts.
- Strictly separates Direct Merchant-of-Record gross sales (`GoSno`, `Party at Red Rocks` — never conflated with net profit), Direct 10% API operator commissions, Machine 5% distribution commissions, and Marketplace Affiliate referrals (`Clicks / Handoffs Only — Not Bookings or Revenue` until reconciled by provider outcome).
- Frozen affiliate identifiers, held commercial SKUs, and partner payout boundaries (`WTA`) are enforced by code and never silently altered.

### 10C. Single Owner Control Center (`Exception-Driven Operations`)
- One protected control center (`/admin` on Destination Command Center) surfaces only the exceptions requiring Erich’s attention:
  1. Revenue & settled payouts vs. Direct MoR gross sales
  2. Bookings needing manual review, confirmed-unpaid orders, awaiting-balance orders, and GoSno → Rezdy complete money-loop verification
  3. Automation failures, provisioning exceptions, stale claims, or failed notifications
  4. Genuine customer & group-charter inquiries requiring a reply
  5. Product-link conversion diagnostics
  6. Organizer, travel-advisor, and direct-operator onboarding follow-ups (including uninvited board starts and Cruise Promenade 8-stage funnel health)

---

## 11. Active Owner Governance Decisions & Schedule Coverage Mandate (`Locked 2026-11-11`)

### 11A. Schedule Coverage Engine (`P1` — Live but Materially Incomplete)
- A 629–632-port directory is not complete sailing coverage: Cruise Promenade presently has **11 complete, source-backed indexable exact-sailing itineraries** alongside approximately **14,300 date-only or summary-only sailings**.
- **Required Architecture:** Repeatable official-source ingestion, seasonal-template matching, exception detection, port-authority enrichment, schedule-change monitoring, provenance, freshness, and controlled qualification for indexing.
- **Initial Milestone Target:** **500 complete, qualified 2027 sailing pages**.
- **Non-Negotiable Publishing Guardrails:** No bulk publication of incomplete or unlicensed third-party itineraries; all incomplete sailings must remain `noindex` and excluded from sitemaps until fully qualified.

### 11B. RollCallUSA Controlled Moderated Pilot Rules
- Expanded pre-cruise and next-day pilot categories (`independent_excursion_companions`, `solo_cruisers`, `trivia_theme_nights`, `family_group_meetups`) remain beta-allowlisted (`beta_allowlist`) and require verified moderation-alert readiness before activation.
- **Adult-Only Posting & Child-Safety Rule:** Every person creating a post must be an adult (`18+`). Never create child profiles or expose children’s names, ages, cabin locations, or contact details.
- Preserve zero cabin numbers, zero direct messages, zero payments, zero public passenger manifests, and full Cruise Promenade bridge compatibility.

### 11C. Held Commercial SKUs & Direct-Operator Priority Queue
- **Held & Inquiry-Only SKUs:** LFSE `aleutian-ballad` and WNO `jeanlafitte-swamp-tour-with-hotel-pickup` remain held and inquiry-only until written payout ownership, attribution, pickup, and timing evidence is recorded.
- **Direct-Operator Priority Queue:**
  1. **Serene & Juneau Tours & Whale Watching** — inspect Rezgo inventory read-only first (zero reservations or inventory mutations), confirm product mapping and written commission authorization, build the write adapter only after read-only findings and written commission terms are reviewed, and pass a non-customer test before production activation.
  2. **Selected New Orleans operator** (queued second).
  3. **Colorado transportation operator** (queued third).
- Never guess credentials, payout ownership, or commercial authority.

### 11D. WTA Partner Containment & Organic Customer Data Boundary
- Live `welcometoalaskatours.com` (`156` public pages) remains untouched and independent with zero consolidation redirects, payout changes, or unauthorized checkout activation.
- Organic WTA customer name, email, or telephone data must never be sent to DCC unless the event carries an explicit authorized `dcc_handoff_id`.
