# Welcome to New Orleans Tours Parity-Plus Plan

Status: planning only  
Date: 2026-05-27  
Scope: Welcome to New Orleans Tours, Welcome to the Swamp, and DCC New Orleans tour surfaces  
Benchmark standard: Alaska/WTA parity-plus completeness adapted to New Orleans

## 1. Current WTS / New Orleans Inventory

### Existing Welcome to the Swamp app

The standalone `apps/welcometotheswamp` app is already a swamp-tour decision surface. It is not a general New Orleans tour authority yet.

Existing WTS routes include:

- `/`
- `/start-here`
- `/choose-the-right-tour`
- `/plan`
- `/plan-your-day`
- `/live-options`
- `/from-new-orleans`
- `/what-its-like`
- `/which-swamp-tour-should-i-choose`
- `/airboat-vs-boat`
- `/airboat-swamp-tour-new-orleans`
- `/best-swamp-tour-new-orleans`
- `/swamp-tours-new-orleans`
- `/best-time`
- `/with-kids`
- `/worth-it`
- `/transportation`
- `/types`
- `/about`
- `/contact`
- `/faq`
- `/how-it-works`
- `/how-we-rank-tours`
- `/editorial-policy`
- `/privacy`
- `/privacy-policy`
- `/terms`
- `/agent.json`
- `/llms.txt`
- `/sitemap.xml`
- `/robots.txt`

Existing WTS decision components and data:

- `HomeBookingBar`
- `HomeDecisionPanel`
- `ActivitiesWidget`
- `AvailabilityWidget`
- `ProductList`
- `SlotList`
- `SwampGuidedFlowShell`
- `SwampCertaintyBlock`
- `WarmTransferTelemetry`
- `Next48AirboatTelemetry`
- `entryPageData.ts`
- `swampProducts.ts`
- `warmTransfer.ts`
- `warmTransferAnalytics.ts`
- `handoff/swampResolver.ts`
- `getyourguide.ts`
- `jsonld.ts`
- `route-governance.ts`

WTS strengths:

- Strong swamp-tour decision narrowing.
- Airboat vs covered boat logic.
- Pickup/transportation awareness.
- Kids/family-fit lanes.
- Next-48-hours airboat availability focus.
- GetYourGuide widgets and availability/search surfaces.
- Warm-transfer context preservation from DCC to WTS.
- Machine-readable `agent.json` and `llms.txt`.

WTS limitation:

- It is scoped to swamp/bayou decisions. Welcome to New Orleans Tours needs a broader city-tour authority layer.

### Existing DCC New Orleans routes

Current DCC New Orleans surfaces include:

- `/new-orleans`
- `/new-orleans/tours`
- `/new-orleans/things-to-do`
- `/new-orleans/swamp-tours`
- `/new-orleans/swamp-tours/airboat-vs-boat`
- `/new-orleans/swamp-tours/best-swamp-tours`
- `/new-orleans/swamp-tours/best-time`
- `/new-orleans/swamp-tours/best`
- `/new-orleans/swamp-tours/cheap-vs-premium`
- `/new-orleans/swamp-tours/first-time`
- `/new-orleans/swamp-tours/hotel-pickup-vs-self-drive`
- `/new-orleans/swamp-tours/transportation`
- `/new-orleans/swamp-tours/types`
- `/new-orleans/swamp-tours/which-tour-should-i-book`
- `/new-orleans/swamp-tours/with-kids`
- `/new-orleans/swamp-tours/worth-it`
- `/new-orleans/airboat-vs-swamp-tour`
- `/new-orleans/best-swamp-tour`
- `/new-orleans/swamp-tour-with-kids`
- `/new-orleans/plantation-tours`
- `/new-orleans/family-friendly`
- `/new-orleans/food`
- `/new-orleans/music`
- `/new-orleans/neighborhoods`
- `/new-orleans/now`
- `/new-orleans/weekend-guide`
- `/tours`
- `/tours/[id]`

Existing DCC swamp corridor support:

- `lib/dcc/corridors/swampTours.ts`
- `lib/dcc/mapping/swampTours.ts`
- `lib/dcc/telemetry/swampFeederEvents.ts`
- `lib/dcc/warmTransfer`
- `app/return/viator/page.tsx` return context for WTS/swamp

Current DCC swamp behavior:

- Canonical DCC swamp hub: `/new-orleans/swamp-tours`.
- Canonical WTS handoff target: `https://welcometotheswamp.com/plan`.
- Approved handoff params: `intent`, `topic`, `source`, `subtype`, `context`, `sourcePage`.
- Viator/GYG mapping exists for airboat, covered boat, pickup-friendly, family, and broad fallback lanes.
- Current WTS role is `satellite_decision_surface`, not owned execution.

### Existing provider/fallback integrations

Provider/fallback code present:

- WTS GetYourGuide helpers and widgets.
- DCC GetYourGuide helpers under `lib/getyourguide/*`.
- DCC Viator API/search/resolver/schema/links under `lib/viator/*`.
- DCC swamp decision mapper uses both GetYourGuide and Viator affiliate search URLs.
- FareHarbor support exists elsewhere in DCC, but no verified New Orleans direct/FareHarbor partner execution was observed in this inspection.

### Missing commercial surfaces

Welcome to New Orleans Tours lacks:

- A coherent public brand surface for all New Orleans tours.
- A city-wide commercial tour homepage separate from WTS swamp-only focus.
- Date/group-size/location planner shell.
- Tours / Packages toggle.
- Supportable trust badge system.
- New Orleans-wide featured tour cards with provider labels.
- Category route templates for ghost, cemetery, food, cocktail, jazz/nightlife, French Quarter, private/group, family, and rainy-day tours.
- A provider/fallback disclosure pattern that is consistent across swamp and non-swamp categories.
- Machine-readable WNO identity in `agent.json`, `llms.txt`, sitemap, and schema.

## 2. Competitor-Style Feature Matrix

| Feature | Parity standard | Current WTS/DCC state | Gap |
| --- | --- | --- | --- |
| Strong hero | Destination-specific, visual, high trust | WTS has strong swamp-specific hero; DCC has route-level heroes | Need WNO city-wide tour hero |
| Date/group-size finder | Search by date, group size, location/pickup | WTS next-48 and warm transfer exist for swamp | Need general planner shell |
| Tours / Packages toggle | Commerce mode switch | Not present | Add Tours / Packages / Private Groups |
| Trust badges | Clear supportable trust claims | WTS has editorial/support framing | Need explicit WNO trust strip |
| Featured tours | Curated top tours/cards | DCC has Viator grids; WTS has product shortlists | Need WNO featured card model |
| Tour cards | Photo, rating, review, price, duration | Existing Viator/GYG surfaces provide some data | Need normalized public card layer |
| Category sections | Destination category grid | DCC New Orleans categories exist in pieces | Need coherent WNO category IA |
| Plan/guides | Planning articles and FAQs | Many guide pages exist | Need WNO guide cluster |
| Contact/support | FAQ, support, policies | WTS has contact/FAQ/policies | Need WNO support pattern |
| Search affordance | Search/date/location/group filters | Generic `/tours` exists | Need New Orleans-specific search shell |
| SEO metadata | Strong category metadata | Present in pieces | Need WNO-wide keyword map |
| Schema | WebSite, Organization, ItemList, FAQ | DCC/WTS helpers exist | Need WNO-specific schema contract |
| Mobile layout | Planner and cards usable on phone | WTS mobile-first in places | Need WNO mobile-first catalog shell |

## 3. New Orleans Category Architecture

Primary commercial categories:

- Swamp tours.
- Airboat tours.
- Small boat swamp tours.
- Plantation tours.
- Ghost tours.
- Cemetery tours.
- Food tours.
- Cocktail tours.
- Jazz/nightlife tours.
- French Quarter walking tours.
- Private/group tours.
- Family-friendly tours.
- Rainy-day tours.

Category intent rules:

- Swamp tours: route through WTS when decision narrowing is needed.
- Airboat tours: thrill-first swamp lane, with weather and pickup disclosure.
- Small boat swamp tours: lower-intensity nature/scenery lane.
- Plantation tours: full-day or half-day history/day-trip lane; avoid unsupported claims and keep historical framing careful.
- Ghost tours: nighttime walk, weather, group, and French Quarter proximity logic.
- Cemetery tours: daylight/operating-hours, walking tolerance, heat/rain logic.
- Food tours: neighborhood, dietary, walking, budget, and time-window logic.
- Cocktail tours: nightlife, group type, walkability, and age/ID expectation logic.
- Jazz/nightlife tours: location, timing, safety, and late-night transport logic.
- French Quarter walking tours: low-transfer, short-stay, history/culture lane.
- Private/group tours: group size, pickup, customization, and budget logic.
- Family-friendly tours: lower-risk, lower-noise, daytime, stroller/walking tolerance.
- Rainy-day tours: indoor/covered, shorter walking, reschedule/cancellation clarity.

## 4. DCC Better Than Catalog Decision Layer

Welcome to New Orleans Tours should recommend one move first, not show a generic list first.

Decision modules:

- One recommended move per visitor situation.
- Hotel pickup vs drive-yourself logic.
- Small boat vs airboat decision.
- Family vs party group logic.
- Rain/weather fallback logic.
- Short-stay vs full-day decision.
- French Quarter proximity logic.
- Owned/partner handoff first where verified.
- Marketplace fallback only when needed.

Example decision outcomes:

- "First trip, no car, wants outdoors": WTS pickup-friendly swamp lane.
- "Bachelor party wants high energy": airboat or cocktail/nightlife lane depending time of day.
- "Family with kids, heat-sensitive": covered swamp boat, food tour, or short French Quarter daytime walk.
- "Rain in forecast": covered/indoor-friendly food/cocktail/history options; avoid high-exposure swamp or walking-heavy lanes unless provider supports reschedule.
- "Only one afternoon": French Quarter walking/food/cocktail tour before transfer-heavy plantation or swamp outings.
- "Full day available": plantation or swamp plus city dinner/nightlife.
- "Staying near French Quarter": favor meeting-point tours and avoid unnecessary transfer-heavy options unless the visitor explicitly wants swamp/plantation.

Doctrine:

- DCC decides.
- Welcome to New Orleans Tours narrows city-tour options.
- Welcome to the Swamp narrows swamp-tour options.
- Operators execute.
- Viator/GetYourGuide are fallback inventory unless there is a verified partner/direct relationship.

## 5. Proposed Route Structure

Recommended WNO/DCC routes:

- `/new-orleans`
- `/new-orleans/tours`
- `/new-orleans/swamp-tours`
- `/new-orleans/airboat-tours`
- `/new-orleans/swamp-tour-hotel-pickup`
- `/new-orleans/plantation-tours`
- `/new-orleans/ghost-tours`
- `/new-orleans/cemetery-tours`
- `/new-orleans/food-tours`
- `/new-orleans/cocktail-tours`
- `/new-orleans/french-quarter-tours`
- `/new-orleans/private-group-tours`

Optional supporting routes:

- `/new-orleans/rainy-day-tours`
- `/new-orleans/family-friendly-tours`
- `/new-orleans/jazz-tours`
- `/new-orleans/nightlife-tours`
- `/new-orleans/tours-with-hotel-pickup`
- `/new-orleans/half-day-tours`
- `/new-orleans/full-day-tours`

Satellite split:

- WNO city-wide authority should own tour-category navigation and general New Orleans tour decisions.
- WTS should stay specialized on swamp-tour narrowing and live options.
- DCC can keep `/new-orleans/tours` as the canonical network decision page until WNO has a public app/domain surface.

## 6. Homepage Module Plan

For Welcome to New Orleans Tours:

1. Cinematic New Orleans hero
   - French Quarter / river / live music / swamp contrast.
   - Public-safe headline focused on choosing the right New Orleans experience.
   - Primary CTA: "Find my best tour."
   - Secondary CTA: "Browse tour categories."

2. Date/group-size/location input shell
   - Date.
   - Time window.
   - Group size.
   - Hotel/French Quarter location.
   - Pickup needed.
   - Weather sensitivity.
   - Family/party/private group type.

3. Trust strip
   - Hotel pickup available where provider supports it.
   - Weather-aware planning.
   - Family-friendly options.
   - Small-group options.
   - Local decision support.
   - Marketplace fallback clearly labeled.

4. "What should I book?" decision block
   - Recommended move.
   - Why this fits.
   - What to avoid.
   - Backup if weather/timing breaks.
   - Provider/fallback label.

5. Featured tour cards
   - Swamp tour with pickup.
   - Airboat tour.
   - French Quarter ghost tour.
   - Cemetery/history tour.
   - Food tour.
   - Cocktail tour.
   - Plantation tour.
   - Private/group experience.

6. Category grid
   - Swamp.
   - Airboat.
   - Plantation.
   - Ghost.
   - Cemetery.
   - Food.
   - Cocktail.
   - Jazz/nightlife.
   - French Quarter.
   - Private/group.
   - Family.
   - Rainy day.

7. Hotel pickup explainer
   - Pickup changes the best answer.
   - Some tours require meeting points.
   - Confirm pickup details on provider checkout.
   - Do not claim guaranteed pickup unless provider guarantees it.

8. Weather/rain fallback block
   - Airboats and outdoor walks carry exposure risk.
   - Food/cocktail/history indoor-leaning routes can work better in rain.
   - Provider cancellation/reschedule terms control the actual policy.

9. Local guides/FAQ
   - Swamp tour worth it.
   - Airboat vs boat.
   - Swamp tour hotel pickup vs drive yourself.
   - Ghost vs cemetery.
   - Food vs cocktail.
   - French Quarter walking tours.
   - What to do in rain.

10. Provider/fallback disclosure
   - Partner/direct provider first where verified.
   - Viator/GetYourGuide fallback when needed.
   - Fallback inventory is not owned execution.

## 7. Tour Card Data Model

```ts
type WnoTourCard = {
  id: string;
  title: string;
  category: string;
  pickup_type: "hotel_pickup" | "meeting_point" | "drive_self" | "unknown";
  location: string;
  duration: string;
  price_from: string | null;
  rating: number | null;
  review_count: number | null;
  image: string;
  weather_risk: "low" | "medium" | "high" | "unknown";
  family_fit: "low" | "medium" | "high" | "unknown";
  group_fit: "low" | "medium" | "high" | "private_available" | "unknown";
  provider_type: "partner" | "affiliate_fallback" | "internal";
  cta_href: string;
  decision_reason: string;
  fallback_reason?: string;
  tags: string[];
};
```

Rules:

- Use `price_from`, `rating`, and `review_count` only when sourced from provider data or approved internal records.
- Do not invent ratings or prices.
- `hotel_pickup` requires provider/source evidence.
- `family_fit` is a planning label, not a safety guarantee.
- `provider_type: affiliate_fallback` must be visibly labeled.
- `provider_type: partner` requires verified partner/direct relationship.

## 8. Trust Badge Rules

Allowed only if supportable:

- Hotel pickup available.
- Weather-aware planning.
- Family-friendly options.
- Small-group options.
- Local decision support.
- Book now/pay later only if provider supports it.
- Free cancellation only if provider supports it.

Do not use unsupported claims:

- Guaranteed best price.
- Guaranteed pickup.
- Locally owned.
- Exclusive access.
- No-risk cancellation.
- Guaranteed weather backup.
- Guaranteed alligator/wildlife sightings.
- Guaranteed private group availability.

Trust badge copy should be conservative:

- "Pickup-aware planning" is safer than "guaranteed hotel pickup."
- "Weather-aware recommendations" is safer than "rain-proof tours."
- "Family-fit filters" is safer than "perfect for all kids."
- "Provider cancellation terms apply" should appear where cancellation is discussed.

## 9. SEO Strategy

Primary targets:

- New Orleans swamp tours.
- New Orleans airboat tours.
- Swamp tour New Orleans hotel pickup.
- Best swamp tour New Orleans.
- Small boat swamp tour New Orleans.
- New Orleans plantation tours.
- New Orleans ghost tours.
- New Orleans cemetery tours.
- New Orleans food tours.
- French Quarter tours.
- Things to do in New Orleans with family.
- Rainy day tours New Orleans.

Secondary clusters:

- New Orleans cocktail tours.
- New Orleans jazz tours.
- New Orleans nightlife tours.
- New Orleans private tours.
- New Orleans group tours.
- New Orleans walking tours.
- New Orleans tours with hotel pickup.
- Airboat vs swamp boat New Orleans.
- Ghost tour vs cemetery tour New Orleans.
- Best New Orleans tours for first-time visitors.

Internal-link priorities:

- `/new-orleans/tours` to WTS swamp planner.
- `/new-orleans/swamp-tours/*` to WTS `/plan`.
- `/new-orleans/food` to `/new-orleans/food-tours`.
- `/new-orleans/music` to jazz/nightlife routes.
- `/new-orleans/neighborhoods` to French Quarter route.
- `/new-orleans/weekend-guide` to short-stay recommendations.

## 10. Schema/Machine-Readable Plan

Use:

- `WebSite` when WNO search exists.
- `Organization` for WNO and DCC network relationship.
- `BreadcrumbList` on all hub/category pages.
- `ItemList` for featured tours and categories.
- `FAQPage` where the page answers tour-choice questions.
- `Product`/`Offer` only when provider/seller relationship supports current price/availability.
- `CollectionPage` for category and catalog pages.
- `WebPage` for decision pages.

Machine-readable updates:

- Add WNO identity to `agent.json` when public route/app exists.
- Add WNO route hierarchy to `llms.txt`.
- Include sitemap entries when routes launch.
- Preserve canonical URLs.
- Preserve `decision_*` and WTS warm-transfer params:
  - `decision_corridor`
  - `decision_action`
  - `decision_option`
  - `decision_product`
  - `decision_state`
  - `intent`
  - `topic`
  - `subtype`
  - `context`
  - `sourcePage`

Schema boundary:

- Do not mark marketplace fallback cards as WNO-owned products.
- Do not use `Offer` when pricing/availability is not sourced.
- Do not imply WNO operates a tour unless that is verified.

## 11. Monetization Model

Priority order:

1. Partner/direct handoff first where verified.
2. FareHarbor/direct partner where available and scoped.
3. WTS decision handoff for swamp-tour narrowing.
4. GetYourGuide/Viator fallback inventory where needed.
5. General DCC planning pages when the visitor is not ready to book.

Doctrine:

- Partner handoff is preferred when it is real.
- FareHarbor/direct partner is controlled execution only when the relationship and flow are verified.
- GetYourGuide/Viator fallback is coverage inventory.
- Fallback rows must not count as owned execution proof.
- Marketplace clickouts can count as demand/gap telemetry, not WNO conversion proof.

## 12. Implementation Phases

Phase 1: Plan + route inventory

- This document.
- Confirm WNO brand/domain ownership.
- Confirm which New Orleans provider relationships are real.
- Confirm which trust claims are supportable.

Phase 2: New Orleans homepage scaffold

- Build or upgrade `/new-orleans/tours` as the first public WNO-style commercial hub.
- Add hero, planner shell, trust strip, category grid, and conservative disclosures.
- Link WTS for swamp decisions.
- Do not touch payment/order logic.

Phase 3: Swamp/airboat featured card data

- Add static typed cards for swamp and airboat lanes.
- Use WTS and provider labels.
- Keep GYG/Viator cards labeled as fallback unless direct relationship exists.

Phase 4: Date/group/location planner shell

- Build read-only recommendation logic.
- Inputs: date, time window, group size, pickup need, location, weather sensitivity, family/party/private mode.
- Output: recommended lane, backup lane, fallback lane.

Phase 5: Category route templates

- Add templates for airboat, plantation, ghost, cemetery, food, cocktail, French Quarter, private/group, family, and rainy-day routes.
- Use source-backed cards only.

Phase 6: Provider handoff/fallback tracking

- Track WNO category choice, WTS warm transfer, partner handoff, and marketplace fallback.
- Do not change WTS parked route-context repair unless separately scoped.

Phase 7: SEO/schema/machine-readable audit

- Add sitemap entries.
- Add WNO `agent.json` and `llms.txt` updates.
- Validate schema.
- Confirm no fake guarantee claims.

## 13. No-Touch Boundaries

- No PARR.
- No checkout/payment/order code.
- No WTS parked route-context repair unless separately scoped.
- No Feastly lifecycle work.
- No fake guarantee claims.
- No copied competitor assets/content.
- No unsupported best-price, guaranteed pickup, local ownership, exclusive access, or no-risk cancellation claims.
- No treating Viator/GetYourGuide fallback as owned execution.
- No changing WTS live booking widgets as part of this plan.

## 14. Recommended First Code Patch

Recommended first patch: upgrade `/new-orleans/tours` into the public Welcome to New Orleans Tours commercial decision hub while preserving existing WTS swamp handoffs.

Smallest safe scope:

- Edit only public New Orleans tour presentation files and new static support data.
- Add a premium New Orleans tour hero.
- Add date/group/location planner shell with no provider calls.
- Add supportable trust strip.
- Add category grid for swamp, airboat, plantation, ghost, cemetery, food, cocktail, French Quarter, private/group, family, and rainy-day.
- Add 6 to 8 static featured cards with provider labels.
- Route swamp/airboat decisions into WTS/DCC swamp pages.
- Label Viator/GetYourGuide as fallback inventory.
- Add conservative schema only for `WebPage`, `CollectionPage`, `BreadcrumbList`, `ItemList`, and FAQ where appropriate.

Avoid in first patch:

- No payment/order changes.
- No direct provider booking changes.
- No broad live provider calls.
- No claims about pickup/cancellation/ownership unless verified.
- No WTS parked route-context repair.

Why this first:

- `/new-orleans/tours` already exists and is the natural broad city-tour narrowing layer.
- WTS already handles swamp specialization.
- The first patch can improve commercial clarity without touching checkout/payment/order logic.
- It creates the city-wide WNO shell needed before adding category templates.
