# WTS + DCC Swamp Integration Plan

Date: 2026-03-29
Status: implementation brief
Scope: `welcometotheswamp.com` + DCC New Orleans swamp-tour surfaces

## Goal

Build a clean two-layer system where:

- `Welcome to the Swamp` owns decision narrowing, shortlist logic, and booking-intent routing.
- `Destination Command Center` owns broader authority, entity context, and structured discovery.
- post-booking review operations feed trust signals back into both layers without turning either site into spamware.

This plan is intentionally file-aware and based on the current repo.

## What Already Exists

### WTS

Live in `apps/welcometotheswamp`:

- decision engine homepage: `apps/welcometotheswamp/app/page.tsx`
- decision page: `apps/welcometotheswamp/app/choose-the-right-tour/page.tsx`
- logistics page: `apps/welcometotheswamp/app/from-new-orleans/page.tsx`
- action page: `apps/welcometotheswamp/app/live-options/page.tsx`
- lane/router primitives: `apps/welcometotheswamp/lib/swampProducts.ts`, `apps/welcometotheswamp/lib/routing.ts`

### DCC

Relevant live surfaces:

- New Orleans swamp lane: `app/new-orleans/swamp-tours/page.tsx`
- generic category guide template: `app/components/dcc/TourCategoryGuidePage.tsx`
- JSON-LD helpers: `lib/dcc/jsonld.ts`
- JSON-LD renderer: `app/components/dcc/JsonLd.tsx`

### Review / event plumbing

Relevant backend primitives:

- Viator review cache: `lib/viator/review-cache.ts`
- cached review storage: `lib/viator/cache.ts`
- DCC booking event emission example: `apps/redrocksfastpass/lib/finalizeBooking.ts`
- DCC handoff tests: `tests/dcc/10-satellite-handoff-events.test.ts`

## Architectural Split

### WTS responsibilities

- decide
- compare
- shortlist 2 to 4 strong options
- convert uncertainty into a lane
- hand off to live options or booking

### DCC responsibilities

- explain the swamp and New Orleans context
- connect city, attraction, and activity graph
- own the broader semantic layer
- host reusable structured-data helpers and public action feeds

### Review operations responsibilities

- completion event capture
- delayed review request orchestration
- suppression and attribution rules
- review analytics feeding both authority and conversion layers

## Schema Strategy

The immediate goal is not “more schema everywhere.” The goal is to put the right schema on the pages where Google can actually infer clear intent.

## Page-Type Schema Map

### 1. WTS homepage

File: `apps/welcometotheswamp/app/page.tsx`

Add:

- `WebPage`
- `BreadcrumbList`
- `ItemList` for the decision lanes or featured shortlist lanes

Do not add `Product` here. This page is a decision router, not a single purchasable offer page.

Implementation note:
- create a small WTS-local JSON-LD helper or reuse `app/components/dcc/JsonLd.tsx` pattern.
- the `ItemList` should describe lanes, not fake inventory.

### 2. WTS decision pages

Files:

- `apps/welcometotheswamp/app/choose-the-right-tour/page.tsx`
- `apps/welcometotheswamp/app/start-here/page.tsx`
- `apps/welcometotheswamp/app/from-new-orleans/page.tsx`
- `apps/welcometotheswamp/app/plan-your-day/page.tsx`
- `apps/welcometotheswamp/app/what-its-like/page.tsx`

Add:

- `WebPage`
- `BreadcrumbList`
- optional `FAQPage` only where the page is explicitly question-and-answer shaped
- optional `ItemList` for lane shortlist blocks on `choose-the-right-tour`

Do not add `Product` here unless the page is directly presenting actual sellable tour options with price/rating.

### 3. WTS live options page

File: `apps/welcometotheswamp/app/live-options/page.tsx`

Add:

- `CollectionPage`
- `ItemList`
- nested `TouristTrip` or `Product`-like entries for each surfaced live option

Recommendation:
- prefer `TouristTrip` semantics first because `lib/dcc/jsonld.ts` already supports `buildTourJsonLd(...)`.
- if Google rich results later respond better to `Product` for this vertical, add a second helper instead of mutating the semantic meaning of every tour page.

### 4. DCC New Orleans swamp lane page

File: `app/new-orleans/swamp-tours/page.tsx`

Current state:

- already has `WebPage`, `BreadcrumbList`, `FAQPage`

Add next:

- a proper `ItemList` representing the core buying lanes or featured live paths
- a DCC-to-WTS relationship signal using `isPartOf` / `mainEntity` structure where cleanly possible

Do not force `Product` schema here. This page is still a routing lane, not a primary offer page.

### 5. Generic DCC category pages

Primary file:

- `app/components/dcc/TourCategoryGuidePage.tsx`

Next enhancement:

- extend template so category pages can emit:
  - `WebPage`
  - `BreadcrumbList`
  - `CollectionPage`
  - `ItemList` for matched live tours

This is the scalable move because it upgrades every city category page, not just New Orleans.

## Schema Helper Worklist

### Phase A

Add new helpers in `lib/dcc/jsonld.ts`:

- `buildWebPageJsonLd(...)`
- `buildItemListJsonLd(...)`
- `buildCollectionPageJsonLd(...)`

Reason:
- the repo already has `buildTourJsonLd(...)`, `buildEventJsonLd(...)`, and breadcrumb helpers.
- these missing page/container helpers are the cleanest gap to close.

### Phase B

Add WTS-side JSON-LD component support:

Possible files:

- `apps/welcometotheswamp/app/components/JsonLd.tsx`
- or a shared import if pathing is clean enough

### Phase C

Wire JSON-LD into:

- `apps/welcometotheswamp/app/page.tsx`
- `apps/welcometotheswamp/app/choose-the-right-tour/page.tsx`
- `apps/welcometotheswamp/app/live-options/page.tsx`
- `app/new-orleans/swamp-tours/page.tsx`
- then `app/components/dcc/TourCategoryGuidePage.tsx`

## Review Collection Strategy

The goal is not “send more review texts.” The goal is a controlled post-experience trust loop.

## Review Trigger Model

### Trigger source

Use booking completion events, not page views or slot holds.

Existing model to extend:

- `apps/redrocksfastpass/lib/finalizeBooking.ts` emits `booking_completed` via `emitDccEvent(...)`

Swamp equivalent should emit a normalized completion event with:

- `satelliteId`
- `handoffId`
- `sourcePath`
- `traveler.phone`
- `traveler.name`
- `booking.citySlug`
- `booking.productSlug`
- `booking.eventDate` or activity date
- `booking.amount`

### Timing

Initial recommendation:

- event recorded at completion
- review request delayed until the experience is plausibly complete
- not “immediately after payment”

Practical default windows:

- same-day experiences: 3 to 6 hours after scheduled end
- transport/dropoff flows: 30 to 90 minutes after completion
- next-day fallback if schedule confidence is weak

### Channel order

Preferred order:

1. SMS if explicit traveler consent exists and mobile context is primary
2. email if SMS is unavailable or suppressed
3. no message if traveler has already been asked recently

### Suppression rules

Required before launch:

- do not send if same user received a review ask in the last 30 days
- do not send if booking status is refunded / failed / needs review
- do not send if traveler already left a review for the same product within the cooldown window
- do not send more than one review ask per booking

### Attribution fields

Every review request should preserve:

- `satelliteId`
- `dccSurface`
- `sourcePath`
- `lane` if known
- `productCode`
- `operator`
- `citySlug`

This is what lets DCC later answer:

- which lane converts best
- which lane generates strongest reviews
- which pages create good bookings but weak post-trip sentiment

## Review Data Model

Add a DCC-native record for outbound review requests.

Suggested entity:

`ReviewRequest`

Fields:

- `id`
- `createdAt`
- `scheduledFor`
- `sentAt`
- `channel` (`sms` | `email`)
- `status` (`scheduled` | `sent` | `clicked` | `completed` | `suppressed` | `failed`)
- `travelerHash`
- `bookingRef`
- `satelliteId`
- `dccSurface`
- `citySlug`
- `productSlug`
- `operatorSlug`
- `lane`
- `reviewTarget`
- `suppressionReason`

This can start as blob/json-backed storage if needed. It does not need a full database migration to prove the system.

## Review Flow by Layer

### WTS

Use WTS to capture the decision context:

- chosen lane
- decision path
- page path

This context should be appended to the eventual booking/handoff metadata.

### DCC

Use DCC to own the outbound review system because it already acts as the network layer and event aggregator.

DCC should:

- receive booking completion event
- schedule review request
- track send/click/complete state
- expose analytics back to admin views later

### Operator / provider destination

Short-term review target can be a Google Business Profile or provider review surface.

Important rule:
- keep the review destination explicit and honest
- do not imply the review is for DCC if the rider is reviewing the operator experience

## First Implementation Phases

### Phase 1: schema foundation

1. add page/container schema helpers in `lib/dcc/jsonld.ts`
2. add WTS JSON-LD renderer helper
3. wire schema into WTS homepage, decision page, and live-options page
4. upgrade `app/new-orleans/swamp-tours/page.tsx` to include `ItemList` lane schema

Success condition:
- core WTS and DCC swamp pages emit valid, intentional schema that matches their actual job

### Phase 2: review event contract

1. define a shared booking-completion payload for swamp surfaces
2. capture lane/source metadata from WTS handoff links or booking payloads
3. add a lightweight review-request scheduler in DCC

Success condition:
- DCC can persist a scheduled post-trip review request without sending it yet

### Phase 3: outbound review automation

1. add SMS/email sender abstraction for review asks
2. implement suppression and cooldown checks
3. add clickthrough tracking
4. add minimal admin/reporting view

Success condition:
- one booking completion can schedule and send one compliant review request with attribution

### Phase 4: trust feedback loop

1. aggregate review volume by lane / page / product
2. surface trust insights into DCC and WTS merchandising logic
3. use review volume and rating deltas to tune shortlist ranking

Success condition:
- review ops improve both ranking signals and decision quality

## Recommended File Ownership

### JSON-LD work

- `lib/dcc/jsonld.ts`
- `app/components/dcc/JsonLd.tsx`
- `app/new-orleans/swamp-tours/page.tsx`
- `app/components/dcc/TourCategoryGuidePage.tsx`
- `apps/welcometotheswamp/app/page.tsx`
- `apps/welcometotheswamp/app/choose-the-right-tour/page.tsx`
- `apps/welcometotheswamp/app/live-options/page.tsx`

### Review workflow work

- new shared DCC module, likely under `lib/dcc/` or `lib/reviews/`
- event emitter integration on booking completion surfaces
- optional admin/reporting page under `app/admin/`

## Guardrails

- do not add `FAQPage` unless the content is actually FAQ-shaped
- do not mark generic guide pages as `Product`
- do not send review requests off payment events alone
- do not send review requests to bookings in refund/manual-review states
- do not lose attribution between WTS decision lane and DCC booking event

## Immediate Next Coding Pass

If implementing now, do this order:

1. `lib/dcc/jsonld.ts`: add `buildWebPageJsonLd`, `buildItemListJsonLd`, `buildCollectionPageJsonLd`
2. `apps/welcometotheswamp/app/components/JsonLd.tsx`: add local JSON-LD component
3. wire JSON-LD into WTS homepage, decision page, live-options page
4. upgrade `app/new-orleans/swamp-tours/page.tsx` to use helper-backed graph instead of hand-built inline JSON only
5. define `ReviewRequest` shape and scheduler stub under DCC
6. extend a booking completion path to schedule, not send, a review request

## Blunt Recommendation

Do the schema work first.

It is low-risk, already supported by the current helper style, and improves the semantic structure of both WTS and DCC without waiting on operator review-policy decisions.

Do the review system second.

It is strategically powerful, but the wrong version becomes spam fast. The scheduler, suppression rules, and attribution model need to exist before any automated send goes live.
