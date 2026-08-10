# WelcomeToNewOrleansTours.com — Full Site Inventory Audit

**Date:** 2026-08-10  
**Purpose:** Establish a single source of truth for everything that exists in the New Orleans flagship implementation so no route, component, feature, registry, draft product, conversion system, or unfinished experiment remains unknown.

## Status vocabulary

- **ACTIVE-PUBLIC** — reachable on welcometoneworleanstours.com and intended for visitors.
- **ACTIVE-SUPPORT** — public support/legal page.
- **ACTIVE-CONDITIONAL** — real public feature whose content depends on configuration/feed/partner availability.
- **IMPLEMENTATION-ALIAS** — source implementation reused by a canonical public route; should not be treated as a second SEO page.
- **DCC-ONLY** — collocated under `app/new-orleans` but intended for destinationcommandcenter.com, not WNO.
- **DRAFT-INVENTORY** — modeled content/product not publicly bookable/indexable.
- **PARKED** — unfinished architecture intentionally not part of the live product.
- **UNUSED** — component/code with no production consumer found.
- **DUPLICATE-SYSTEM** — overlapping implementations that need consolidation.
- **NEEDS-FIX** — mismatch that can cause broken navigation, cannibalization, stale analytics/schema, or false test confidence.

---

## 1. Host routing: what is actually public on WNO

`proxy.ts` is authoritative for the flagship host.

### Public route families

- `/` → `/new-orleans`
- `/contact` → `/new-orleans/contact`
- support: `/privacy`, `/terms`, `/cancellation-policy`, `/affiliate-disclosure`, `/accessibility`, `/booking-help`, `/faq`, `/about`
- `/compare` and `/compare/*`
- `/tours` and `/tours/*`
- marketplace category routes for the allow-list below
- `/areas/*`
- `/french-quarter-welcome-stop`
- `/help-me-choose`
- `/tours-for/*`
- `/guides/*`

Everything else on the WNO host is rewritten to `/not-found`.

### WNO category allow-list in proxy

- `city-tours`
- `swamp-tours`
- `airboat-tours`
- `covered-swamp-boat-tours`
- `plantation-tours`
- `ghost-tours`
- `cemetery-tours`
- `cooking-classes`
- `riverboat-cruises`
- `food-tours`
- `walking-tours`
- `private-tours`
- `night-tours`

These public URLs resolve through the dynamic `app/new-orleans/marketplace-category/[categorySlug]` implementation, not through same-named top-level folders.

### Critical route mismatch — NEEDS-FIX

The homepage currently links to top-level URLs such as:

- `/things-to-do-in-new-orleans-today`
- `/new-orleans-tours-tonight`

Those implementation files exist, but the WNO host router does not whitelist those top-level route families. Canonical public equivalents exist under `/guides/...`. Internal links should use canonical public URLs or the router should explicitly redirect legacy aliases. This must be tested on the deployed WNO host before the flagship foundation is merged.

---

## 2. Implementation aliases vs public pages

Several top-level `app/new-orleans/*` pages are source implementations whose public SEO route is under `/guides/*`.

Confirmed example:

- source: `app/new-orleans/new-orleans-tours-tonight/page.tsx`
- canonical: `/guides/new-orleans-tours-tonight`
- public guide: `app/new-orleans/guides/new-orleans-tours-tonight/page.tsx` simply re-exports the source implementation.

Likely/known parallel source families that must be treated as aliases rather than independent SEO pages:

- `4-hours-in-new-orleans`
- `best-swamp-tour-with-transportation`
- `first-time-new-orleans-tours`
- `new-orleans-plantation-and-swamp-tour`
- `new-orleans-tours-for-families`
- `new-orleans-tours-tonight`
- `new-orleans-tours-with-transportation`
- `things-to-do-after-a-cruise-new-orleans`
- `things-to-do-before-a-cruise-new-orleans`
- `things-to-do-in-new-orleans-today`

**Rule:** only the canonical public route should appear in internal navigation, breadcrumbs, canonical tags, sitemaps, analytics page taxonomy, and SEO reporting.

---

## 3. DCC-only New Orleans code collocated in the same folder

Not every `app/new-orleans` route belongs to WelcomeToNewOrleansTours.com.

Confirmed DCC-style example:

- `app/new-orleans/family-friendly/page.tsx` uses generic `CityGuideStubPage`, canonical `/new-orleans/family-friendly`, and DCC-style `/new-orleans/...` links.

Confirmed DCC swamp-lane family:

- `app/new-orleans/swamp-tours/page.tsx`
- `app/new-orleans/swamp-tours/BridgePageTemplate.tsx`
- `app/new-orleans/swamp-tours/best-time/page.tsx`
- `app/new-orleans/swamp-tours/transportation/page.tsx`
- `app/new-orleans/swamp-tours/types/page.tsx`
- `app/new-orleans/swamp-tours/with-kids/page.tsx`
- `app/new-orleans/swamp-tours/worth-it/page.tsx`

Public WNO `/swamp-tours` does **not** resolve to this folder; the WNO router maps it to `marketplace-category/swamp-tours`.

**Classification:** DCC-ONLY unless separately surfaced by DCC. Do not accidentally fold this code into WNO SEO work.

---

## 4. Storefront product inventory

Existing tests establish the commercial baseline:

- **21 total storefront parent products**
- **15 Gray Line parent products**
- **25 exact Gray Line booking variants**
- booking IDs, flow IDs and supplied FareHarbor URLs are fixture-tested
- all 21 products are expected to be discoverable through `/tours`

This is the authoritative current live storefront inventory baseline.

### Draft products — DRAFT-INVENTORY

`app/new-orleans/data/draftProducts.ts` contains six nonindexable/nonbookable draft products:

**NOLA Ghost Riders**
- Cemetery Bus Experience
- Haunted History Experience
- Haunted Plantation Experience

**New Orleans School of Cooking / NOSOC**
- Demonstration Cooking Class
- Hands-On Cooking Class
- Cooking Lab/Class Experience

All are `status: draft`, `isIndexable: false`, `isBookable: false`.

These are real modeled opportunities, not live inventory.

---

## 5. Category taxonomy

`app/new-orleans/data/categories.ts` defines **16 parent category concepts**, plus subcategories.

### Parent categories marked live

- City & Neighborhood Tours (`city-tours`)
- Swamp, Bayou & Wildlife (`swamp-tours`)
- Plantations & River Road (`plantation-tours`)

### Live swamp subcategories

- Airboat Tours (`airboat-tours`)
- Covered Swamp Boat Tours (`covered-swamp-boat-tours`)

### Parent categories currently marked draft

- Ghosts, Cemeteries & Haunted New Orleans
- Crime, Vice & Dark History
- Pirates, Privateers & River History
- Food, Cooking & Culinary Experiences
- Riverboats, Cruises & Waterfront
- Music, Culture & Mardi Gras
- Walking Tours
- Private & Custom Tours
- Combinations & Full-Day Plans
- Family-Friendly New Orleans
- Adults-Only & After Dark
- Cruise Passenger Experiences
- Seasonal & Event Experiences

### Data-governance mismatch — NEEDS-FIX

Some draft categories already have real bookable products and/or are explicitly allowed by the WNO host router (`ghost-tours`, `food-tours`, `riverboat-cruises`, `night-tours`, etc.). Before creating any new category URL, reconcile:

1. category registry status,
2. router allow-list,
3. product mappings,
4. homepage/category navigation,
5. sitemap/indexability,
6. canonical URL choice.

Do **not** create new `/river-cruises`, `/ghost-tours`, or similar URLs until this existing dynamic category system is resolved.

---

## 6. Guide / intent architecture

Known explicit guide families include:

- `4-hours-in-new-orleans`
- `best-new-orleans-tours-for-a-rainy-day`
- `best-new-orleans-tours-if-you-arrive-at-noon`
- `best-new-orleans-tours-under-4-or-6-hours`
- `best-new-orleans-tours-with-kids-under-6`
- `best-swamp-tour-with-transportation`
- `can-kids-ride-airboats-new-orleans`
- `first-time-new-orleans-tours`
- `french-quarter-orientation`
- `new-orleans-plantation-and-swamp-tour`
- `new-orleans-swamp-tour-without-a-car`
- `new-orleans-tours-for-families`
- `new-orleans-tours-for-grandparents-and-kids`
- `new-orleans-tours-limited-mobility`
- `new-orleans-tours-near-french-quarter`
- `new-orleans-tours-that-fit-before-dinner`
- `new-orleans-tours-tonight`
- `new-orleans-tours-under-50-dollars`
- `new-orleans-tours-with-minimal-walking`
- `new-orleans-tours-with-transportation`
- `new-orleans-tours-without-an-all-day-bus-ride`
- `plan-new-orleans-tours`
- `restaurant-partners`
- `things-to-do-after-a-cruise-new-orleans`
- `things-to-do-before-a-cruise-new-orleans`
- `things-to-do-in-new-orleans-today`
- `this-weekend`
- `tonight`
- `visitor-rewards`
- `whats-happening`
- `where-to-eat`
- `whitney-plantation-vs-oak-alley-history-focus`

There is also a dynamic `/guides/[slug]` renderer backed by data registries.

### Supporting registries

- `intentSeoPages.ts`
- `audienceIntentSeoPages.ts`
- `pages.ts` (large SEO page registry)
- `comparisonRegistry.ts`
- `dayPlans.ts`
- `tourDecisionCopy.ts`
- `tourIntelligence.ts`
- `officialTourFacts.ts`
- `verifiedClaims.ts`

These registries must be treated as inventory sources, not merely implementation details.

---

## 7. Comparison architecture

Explicit comparison pages include at least:

- `/compare/best-new-orleans-tour-if-you-only-have-3-hours`
- `/compare/covered-swamp-boat-vs-airboat`
- `/compare/natchez-vs-city-of-new-orleans-riverboat`
- `/compare/small-vs-large-airboat`
- `/compare/swamp-tour-with-vs-without-transportation`
- `/compare/whitney-vs-oak-alley`

There is also `comparisonRegistry.ts` and dynamic marketplace-category comparison routing.

**Audit rule:** comparison URLs should have exactly one canonical owner; older swamp SEO comparisons and newer `/compare/*` routes must not compete.

---

## 8. Live-event / dinner planning system — ACTIVE-CONDITIONAL

This is a real feature family, not a concept.

Components/data:

- `components/LiveNightGuide.tsx`
- `lib/liveEvents.ts`
- `/guides/whats-happening`
- `/guides/tonight`
- `/guides/this-weekend`
- `/guides/where-to-eat`
- `RestaurantOrientationAd.tsx`

The live-event adapter fetches Ticketmaster data around New Orleans (40 km radius) and supports `all`, `tonight`, and `weekend` windows. The UI has graceful states for missing configuration and zero matching events.

There is also a repository data file `data/cities/new-orleans/events.current.json`, indicating a second event-data surface that should be checked for overlap/staleness.

### Sitemap question — NEEDS-FIX / VERIFY

The WNO sitemap builder explicitly includes many high-intent and decision guides, but the live-event/dining routes need to be checked against the generated sitemap registry so none are unintentionally orphaned from sitemap discovery.

---

## 9. Dining partner program — ACTIVE FRAMEWORK, NO ACTIVE PARTNERS

`data/diningPartners.ts` defines a restaurant-referral MVP:

- default $5 per confirmed seated guest
- no upfront listing fee
- monthly manual reconciliation
- only `active` partners may appear publicly

Current state:

- `DINING_PARTNERS = []`
- therefore `ACTIVE_DINING_PARTNERS = []`

The public dining guide handles this truthfully and displays editorial New Orleans staples while saying partner recommendations are being added carefully.

**Classification:** framework implemented, commercial supply not yet activated.

---

## 10. Orientation ecosystem — ACTIVE-PUBLIC

Known pieces:

- `/guides/french-quarter-orientation`
- `/french-quarter-welcome-stop`
- `RestaurantOrientationAd.tsx`
- orientation references throughout dining/live-event flows
- call/text reservation CTAs

The orientation is a strategically important owned experience and should have one canonical product/event identity across the site.

---

## 11. Phone / conversion systems

### Existing `PhoneCta.tsx` — ACTIVE

Already tracks:

- `phone_cta_seen`
- `phone_cta_clicked`
- `group_rates_cta_clicked`
- placement
- product ID / slug
- page path
- phone number
- pushes into `dataLayer`

Known production consumers include `HelpMeChooseDrawer.tsx` and `MarketplaceNavigation.tsx`.

### Existing `StickyMobileBookingBar.tsx` — UNUSED

A full mobile fixed booking bar exists and supports FareHarbor variants plus analytics (`mobile_sticky_cta_clicked`), but code search found no production import; only tests reference it.

**Decision needed:** adapt/reuse for the flagship mobile phone/text/tours conversion layer or remove/quarantine. Do not build a parallel sticky component without resolving this one.

### Foundation branch tracker

The flagship foundation branch adds generalized phone/SMS/FareHarbor click attribution with original landing-source/session context.

**DUPLICATE-SYSTEM risk:** reconcile this with `PhoneCta.tsx`, existing `lib/analytics`, FareHarbor button analytics, and recommendation analytics so a single user action does not produce ambiguous/double conversion events.

---

## 12. Chooser / recommendation systems

At least four related systems exist:

- `NewOrleansRecommendationFlow.tsx` — current homepage flow, ACTIVE
- `HelpMeChooseDrawer.tsx` — ACTIVE component, includes phone assistance
- `NewOrleansChooser.tsx` — no production import found; tests still reference it
- `TourMatchChooser.tsx` — no production import found

**Classification:** active recommendation system plus at least two UNUSED older chooser implementations.

Tests must be updated so they protect the active flow rather than stale chooser code.

---

## 13. MyTrip architecture — PARKED / UNFINISHED / UNUSED

`components/MyTrip/` contains:

- `AddBookingReference.tsx`
- `BookingPending.tsx`
- `Canceled.tsx`
- `Confirmed.tsx`
- `MyTripSummary.tsx`
- `OpenOperatorBooking.tsx`
- `Planned.tsx`
- `SaveToMyTrip.tsx`

Confirmed unfinished UI:

- disabled “Save to My Trip (Coming Soon)” button
- disabled booking-reference input
- `My Trip Summary (Not Implemented)`
- disabled “Open Booking” button
- placeholder state components

Code search found no production consumer for `MyTripSummary`.

**Classification:** parked experiment. It must not be mistaken for an active customer planner.

---

## 14. Schema / structured-data systems — DUPLICATE-SYSTEM

Pre-existing systems:

1. `app/new-orleans/lib/schema.ts`
   - product/tour `Service` + `TouristTrip` graphs
   - category `CollectionPage` graphs

2. `app/new-orleans/components/StructuredData.tsx`
   - `WebPage` / `CollectionPage`
   - conditional `Product` schema for eligible live products

3. generic DCC JSON-LD infrastructure also exists elsewhere in the monorepo.

Foundation branch added:

4. `app/new-orleans/lib/structuredData.ts`
   - Organization/WebSite
   - breadcrumb/FAQ helpers

**Action:** consolidate into one WNO structured-data architecture instead of allowing a third/fourth permanent parallel implementation. Keep the new entity/breadcrumb/FAQ capabilities, but integrate them with existing helpers.

---

## 15. Tests — substantial, but freshness is mixed

Known WNO tests include:

- analytics tracker
- chooser image governance
- combo tours
- conversion card actions
- dining partner model
- FareHarbor attribution
- FareHarbor integrity
- homepage routing
- inventory fixture
- inventory integrity
- live consistency
- live events/dinner loop
- restaurant orientation ad
- others in `tests/new-orleans`

### Stale-test example — NEEDS-FIX

`homepage-routing.test.ts` still reads and asserts behavior inside `NewOrleansChooser.tsx`, even though the live homepage now renders `NewOrleansRecommendationFlow.tsx`. It also asserts older swamp comparison link strings.

**Rule:** a test protecting unused code is not flagship coverage. Test inventory must track the production component/route it protects.

---

## 16. Sitemap / indexability system

WNO has host-specific sitemap generation. It includes:

- root/catalog/compare/orientation/rewards
- high-intent guide list
- intent SEO registry
- audience-intent registry
- decision guides
- support pages
- live/indexable products
- live/indexable SEO pages
- READY_TO_PUBLISH comparisons
- selected legacy guide paths

Known superseded SEO routes are deliberately excluded from sitemap.

**Open audit items:** ensure every intentionally indexable live-event/dining/category route is included exactly once; ensure blocked implementation aliases never appear; add true page-level lastmod only when there is reliable modification data.

---

## 17. Immediate priority defects / decisions

### P0 — route truth

1. Test every homepage/header/footer internal URL against the WNO host router.
2. Replace blocked top-level guide aliases with `/guides/...` canonicals or add explicit permanent redirects.
3. Prevent source implementation aliases from becoming accidental SEO surfaces.

### P0 — inventory truth

4. Reconcile category registry `status` with actual inventory and router allow-list.
5. Classify every dynamic category as live/populated, live/empty, draft/blocked, or intentionally parked.
6. Keep the 21-live-product / 6-draft-product inventory documented.

### P0 — conversion truth

7. Unify `PhoneCta`, generalized funnel telemetry, FareHarbor analytics, recommendation analytics and mobile sticky CTA tracking into one event dictionary.
8. Decide whether to reuse the existing unused `StickyMobileBookingBar` for the phone-first mobile conversion layer.

### P1 — schema truth

9. Consolidate existing WNO schema implementations with the new entity/breadcrumb/FAQ work.
10. Add schema coverage by page type only after the schema owner/helper is singular.

### P1 — feature truth

11. Mark MyTrip explicitly parked or remove it from active application code.
12. Mark old chooser implementations unused/deprecated or remove them after tests move to the active recommendation flow.
13. Keep live events labeled ACTIVE-CONDITIONAL and dining partners labeled framework/no active supply until configuration/partners change.

### P1 — test truth

14. Rewrite stale routing/chooser tests around actual live components and canonical public URLs.
15. Add a route-manifest test that fails when public navigation points to a path the WNO proxy rejects.
16. Add an inventory-manifest test so every WNO route/component system has an explicit classification.

---

## 18. Operating rule going forward

Before adding any new WNO route, schema helper, analytics event, category hub, chooser, sticky CTA, product registry, event feed, or SEO template:

1. check this inventory,
2. check the router,
3. check the data registries,
4. check current production consumers,
5. check tests,
6. extend the existing owner instead of creating a parallel system.

The flagship standard is not merely “nothing broken.” It is **nothing unknown**.
