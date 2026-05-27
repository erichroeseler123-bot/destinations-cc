# WTA Alaska Shore Excursions Parity-Plus Plan

Status: planning only  
Date: 2026-05-27  
Scope: Welcome to Alaska Tours / Juneau Flight Deck / DCC Alaska cruise excursion surfaces  
Benchmarks: Juneau Shore Tours and Alaska Shore Excursions as feature and information-architecture references only

## 1. Current WTA/JFD Inventory

### Existing Juneau Flight Deck app

The standalone `apps/juneauflightdeck` app is already a decision-first Juneau execution surface, not a generic tour catalog.

Existing source routes include:

- `/`
- `/helicopter`
- `/juneau/helicopter`
- `/juneau-whale-watching-tours`
- `/helicopter-vs-whale-watching-juneau`
- `/best-excursions-in-juneau`
- `/what-to-do-in-juneau-cruise-port`
- `/juneau-dogsled-helicopter-tours`
- `/juneau-glacier-landing-tours`
- `/juneau-helicopter-tours`
- `/juneau/best-independent-excursions`
- `/juneau/cruise-excursions-vs-independent`
- `/juneau/what-happens-if-you-miss-the-ship`
- `/juneau/what-to-do-if-helicopter-tour-canceled`
- `/skagway/helicopter`
- `/tours/[slug]`
- `/about`
- `/contact`
- `/faq`
- `/how-it-works`
- `/privacy-policy`
- `/terms`
- `/sitemap.xml`
- `/robots.txt`

Existing JFD components and support files include:

- `HelicopterDispatchBoard`
- `JuneauHomeClient`
- `BookingWidget`
- `GetYourGuideActivitiesWidget`
- `GetYourGuideAvailabilityWidget`
- `HelicopterAvailabilityTelemetry`
- `DecisionWidgetCard`
- `SeoEntryPage`
- `GuidedFlowController`
- `GuidedResults`
- `lib/fareharbor.ts`
- `lib/getyourguide.ts`
- `lib/handoff/*`
- `lib/juneauDecision.ts`
- `lib/decisionEngine.ts`
- `lib/decisionTelemetry.ts`

### Existing DCC Alaska routes

The DCC app already has Alaska and cruise decision pages:

- `/alaska`
- `/alaska/whale-watching`
- `/alaska/best-time-for-whale-watching`
- `/alaska/helicopter-glacier-tour-worth-it`
- `/alaska/helicopter-vs-glacier-boat`
- `/alaska/small-boat-vs-large-whale-tours`
- `/juneau/best-excursion-in-juneau-alaska`
- `/juneau/best-whale-watching-juneau`
- `/juneau/cruise-excursions-what-to-do`
- `/juneau/helicopter-tour-weather-risk`
- `/juneau/helicopter-tours`
- `/juneau/helicopter-tours-from-cruise-port`
- `/juneau/helicopter-tours-worth-it`
- `/juneau/helicopter-vs-whale-watching`
- `/juneau/is-whale-watching-worth-it`
- `/juneau/mendenhall`
- `/juneau/small-boat-vs-large-boat`
- `/juneau/whale-watch-and-dogsled-same-day`
- `/juneau/whale-watching`
- `/juneau/whale-watching-tours`
- `/juneau/whale-watching-worth-it`
- `/juneau/what-to-do-if-helicopter-tour-canceled`
- `/juneau-whale-watching-from-port`
- `/ketchikan/best-independent-excursions`
- `/ketchikan/cruise-excursions-vs-independent`
- `/ketchikan/floatplane-worth-it`
- `/ketchikan/misty-fjords-worth-it`
- `/ketchikan/what-happens-if-you-miss-the-ship`
- `/skagway/best-independent-excursions`
- `/skagway/cruise-excursions-vs-independent`
- `/skagway/history`
- `/skagway/history-worth-it`
- `/skagway/train`
- `/skagway/what-happens-if-you-miss-the-ship`
- `/skagway/white-pass-train-worth-it`
- `/skagway/white-pass-worth-it`
- `/sitka/best-independent-excursions`
- `/sitka/cruise-excursions-vs-independent`
- `/sitka/sea-otter-worth-it`
- `/sitka/what-happens-if-you-miss-the-ship`
- `/sitka/wildlife-worth-it`
- `/cruises`
- `/cruises/shore-excursions`
- `/cruises/best-alaska-cruise-for-excursions`
- `/cruises/ports`
- `/cruises/ports/[slug]`
- `/cruises/port/[slug]`
- `/cruises/ship/[slug]`
- `/cruises/line/[slug]`
- `/cruises/from/[port]`

Missing or incomplete public commercial routes:

- `/alaska/shore-excursions`
- `/alaska/cruise-excursions`
- `/juneau/tours`
- `/juneau/shore-excursions`
- `/juneau/cruise-port-excursions`
- `/skagway`
- `/skagway/white-pass-railroad`
- `/ketchikan`
- `/ketchikan/misty-fjords`
- `/icy-strait`
- `/sitka`
- `/seward`
- Alaska-wide tour/category browse surfaces
- Alaska-wide cruise line / ship / sailing date planner
- Alaska-wide top destinations surface with commercial CTAs
- Alaska-wide trust and support structure

### Existing decision and handoff logic

Current governed Alaska logic exists in:

- `lib/dcc/corridors/alaska.ts`
- `lib/dcc/mapping/alaska.ts`
- `app/juneau/helicopter-tours/page.tsx`
- `apps/juneauflightdeck/lib/handoff/*`

Important current behavior:

- The `alaska-juneau` corridor frames helicopter versus whale watching as the canonical decision.
- `mapAlaskaDecisionToDestination` sends helicopter/glacier/premium intent to the Juneau helicopter go route.
- The Juneau helicopter page uses WTA/FareHarbor widget URLs for direct operator execution.
- Whale watching is currently treated as an internal lane and backup/secondary recommendation.
- Mendenhall is currently represented as fallback/search inventory in the corridor manifest.
- Machine-readable DCC surfaces already describe Alaska-Juneau as controlled/owned-or-controlled execution, with marketplace fallback only when direct execution is weaker.

### Existing provider integrations

Provider code already present:

- FareHarbor live slot support: `lib/dcc/liveSlots/fareharbor.ts`
- WTA embed helper: `lib/wta/embed`
- GetYourGuide widgets/client/links/schema under `lib/getyourguide/*`
- Viator API, booking, prebook, payment, product, review, schema, resolver, and links under `lib/viator/*`
- Public APIs for Juneau heli products and live Juneau heli slots

Planning implication:

- Phase 1 should not add checkout/payment logic.
- Phase 1 should use existing provider boundaries as read-only/source-of-truth constraints.
- Commercial cards should carry `provider_type` and explicit fallback labels before any broad catalog is shown.

## 2. Competitor Feature Matrix

| Feature | Juneau Shore Tours benchmark | Alaska Shore Excursions benchmark | Current WTA/DCC state | Gap |
| --- | --- | --- | --- | --- |
| Cinematic hero | Juneau-specific hero and direct prompt | Alaska-wide hero and search planner | Present in pieces, but not unified commercially | Need premium WTA Alaska hero |
| Cruise/date input | Cruise or travel date finder | Cruise line, ship, sailing date planner | Date-first Juneau helicopter lane exists | Need Alaska-wide shell |
| Tours/packages toggle | Present | Broader itinerary/catalog filtering | Not present as a WTA commerce switch | Add `Tours / Packages / Port Plans` |
| Trust badges | Give back, pay later, return-to-ship, agents | Cancellation, secure payments, price, return, support | Some support/decision claims exist | Need supportable WTA trust strip |
| Featured tours | Best Juneau excursions | Top tours by port/category | DCC has articles and live helicopter lane | Need card data model and featured sections |
| Tour cards | Image/rating/review/price/duration cards | Top tours with ratings/prices | Some bookable sections, not Alaska-specific catalog | Need Alaska card system |
| Destination navigation | Juneau categories | Alaska-wide ports and activities | DCC has port articles and cruise pages | Need Alaska commercial nav |
| Port pages | Juneau only | Juneau, Skagway, Ketchikan, Icy Strait, Sitka, Seward, etc. | DCC has some port decision pages | Need WTA port templates |
| Category pages | Wildlife/glacier/recreation/private/etc. | Whale, glacier, helicopter, dog sled, train, fishing, wildlife, kayak, etc. | Many article pages, weak catalog/category bridge | Need category route architecture |
| Guides/blog | Suggested articles | Local guides/blog clusters | DCC has many SEO guides | Need WTA-aligned guide cluster |
| Search/cart/account | Search, cart, login/wishlist | Itinerary/cart/order status | Not appropriate until execution model is clear | Defer account/cart unless provider supports |
| Support/footer | Contact and policies | Order status, FAQ, terms, support | Existing JFD support pages | Need WTA commercial support nav |
| Metadata/schema | WebSite search and tour metadata | Deep IA and destination metadata | DCC has JSON-LD helpers | Need WTA schema strategy |
| Mobile layout | Commerce-first | Planner/filter-first | Existing pages vary | Need mobile-first planner/cards |

## 3. WTA Parity Checklist

WTA should match the important commercial functions without copying competitor content:

- Premium Alaska/Juneau hero with real destination imagery or approved generated/owned media.
- Cruise-safe date/planner module.
- Tours / Packages / Port Plans switch.
- Trust strip using only supportable claims.
- Featured tours by port and by decision lane.
- Tour cards with image, duration, category, price-from, rating/review data only where sourced.
- Destination sections for Juneau, Skagway, Ketchikan, Icy Strait, Sitka, Seward, Anchorage, Whittier, Denali.
- Activity sections for whale watching, glacier, helicopter, dog sledding, train, fishing, bear/wildlife, kayaking, rafting, rainforest, private, accessible, kid-friendly.
- Plan/guides section for weather, port timing, ship risk, tendering, and excursion-vs-independent decisions.
- Contact/support footer with FAQ, terms, policies, and order/status links only where actual provider/order state exists.
- WebSite, Organization, BreadcrumbList, ItemList, FAQPage, and product schema only where supportable.
- Mobile-first filter and card layout.

## 4. WTA Better Than Competitor Decision Layer

WTA should not start with "browse everything." It should start with one recommended move based on port-day constraints.

Decision-first features:

- One strongest recommendation per port/day.
- Alternative recommendation only when risk, weather, budget, timing, or group-fit requires it.
- Fallback inventory only when partner/internal execution is unavailable or irrelevant.
- Cruise line, ship, docking date/time, port call length, and return-margin awareness.
- Helicopter/weather risk framing.
- Whale watching backup path.
- Mendenhall land fallback path.
- "Short port call vs full day" decision branch.
- Partner handoff health labels.
- Clear provider label: partner, internal, or affiliate fallback.

Port-day decision modules:

- Juneau: helicopter vs whale watching vs Mendenhall.
- Skagway: White Pass railroad vs Yukon vs dog sledding.
- Ketchikan: Misty Fjords vs wildlife/bear vs cultural/town tour.
- Icy Strait: whale watching vs bear search.
- Sitka: wildlife cruise vs cultural/rainforest.
- Seward: Kenai Fjords vs transfer-day excursions.

Doctrine:

- WTA recommends first.
- WTA discloses execution second.
- Marketplaces fill gaps only.
- Fallback clicks are coverage telemetry, not proof of WTA-owned execution.

## 5. Route Architecture

Recommended public routes:

- `/alaska`
- `/alaska/shore-excursions`
- `/alaska/cruise-excursions`
- `/juneau`
- `/juneau/tours`
- `/juneau/shore-excursions`
- `/juneau/helicopter-tours`
- `/juneau/whale-watching`
- `/juneau/mendenhall-glacier`
- `/juneau/cruise-port-excursions`
- `/skagway`
- `/skagway/white-pass-railroad`
- `/ketchikan`
- `/ketchikan/misty-fjords`
- `/icy-strait`
- `/sitka`
- `/seward`

Compatibility routes to consider:

- `/tours/juneau`
- `/tours/alaska`
- `/cruises/ports/juneau-alaska`
- `/cruises/shore-excursions`

Route roles:

- `/alaska`: authority and decision hub.
- `/alaska/shore-excursions`: commercial Alaska-wide browse/decision surface.
- `/alaska/cruise-excursions`: cruise planner surface with cruise line/ship/date intake.
- Port routes: one-port decision pages.
- Category routes: one activity class across ports.
- Existing SEO article routes: support pages and internal-link cluster.

## 6. Homepage Module Plan

For the WTA Alaska commercial hub:

1. Cinematic hero
   - Alaska port imagery.
   - Headline centered on cruise-safe Alaska excursions.
   - Primary CTA: "Find my port-day move."
   - Secondary CTA: "Browse Alaska ports."

2. Cruise/date planner
   - Cruise passenger vs not on cruise.
   - Cruise line.
   - Ship.
   - Port.
   - Docking date.
   - Arrival/departure window.
   - Travelers.
   - Mobility/weather tolerance.

3. Trust strip
   - Cruise-safe planning.
   - Return-to-ship awareness.
   - Weather-aware fallbacks.
   - Local decision support.
   - Partner execution where available.
   - No fake guarantee claims.

4. Decision-first recommendation block
   - "Your strongest move today."
   - "Backup if weather breaks."
   - "Fallback marketplace coverage."
   - Shows reason, risk, return margin, and provider type.

5. Featured tours/cards
   - Juneau helicopter.
   - Juneau whale watching.
   - Juneau Mendenhall.
   - Skagway White Pass.
   - Ketchikan Misty Fjords.
   - Icy Strait whale watching.
   - Sitka wildlife/rainforest.
   - Seward Kenai Fjords.

6. Category grid
   - Whale watching.
   - Glacier.
   - Helicopter.
   - Dog sledding.
   - Train.
   - Fishing.
   - Bear/wildlife.
   - Kayaking/rafting.
   - Rainforest.
   - Private.
   - Accessible.
   - Kid-friendly.

7. Port-safe planning block
   - Short port call.
   - Full day in port.
   - Tendered port.
   - Weather-sensitive activity.
   - Transfer-day activity.

8. Guides/FAQ block
   - Helicopter vs whale watching.
   - What happens if a tour cancels.
   - What happens if you miss the ship.
   - Ship excursion vs independent.
   - Best excursions by port.

9. Partner/fallback disclosure
   - "Some bookings complete with partner operators."
   - "Marketplace options are fallback inventory."
   - "Guarantees are shown only when provider-supported."

10. Internal DCC continuity params
   - `decision_corridor`
   - `decision_action`
   - `decision_option`
   - `decision_product`
   - `decision_state`
   - `dcc_handoff_id`
   - `sourcePage`
   - `port`
   - `date`

## 7. Port Page Module Plan

Each port page should follow the same structure:

1. Port-specific hero.
2. Cruise-window intake.
3. One recommended move.
4. Backup move.
5. Weather/timing warning.
6. Featured partner/internal cards.
7. Fallback inventory section, visually separated.
8. Port logistics: dock/tender notes, travel time, return margin.
9. Category clusters.
10. FAQ and guide links.
11. Machine-readable schema.

Port-specific recommendation defaults:

- Juneau: helicopter when budget/weather/timing allow; whale watching as broad default; Mendenhall as land fallback.
- Skagway: White Pass railroad as canonical first-timer move; Yukon and dog sledding only when timing supports it.
- Ketchikan: Misty Fjords when scenic flight/boat risk fits; wildlife/bear or cultural/town fallback otherwise.
- Icy Strait: whale watching or bear search depending season and risk.
- Sitka: wildlife cruise for broad payoff; cultural/rainforest for lighter day.
- Seward: Kenai Fjords when time allows; transfer-day planning when cruise logistics dominate.

## 8. Category Page Module Plan

Category pages should answer: "Is this activity the right port-day move for me?"

Core category pages:

- `/alaska/whale-watching`
- `/alaska/helicopter-tours`
- `/alaska/glacier-tours`
- `/alaska/dog-sledding`
- `/alaska/train-tours`
- `/alaska/fishing-tours`
- `/alaska/bear-wildlife-tours`
- `/alaska/kayaking-rafting`
- `/alaska/rainforest-tours`
- `/alaska/private-tours`
- `/alaska/accessible-shore-excursions`
- `/alaska/kid-friendly-shore-excursions`

Module structure:

- Category verdict.
- Best ports for this category.
- Weather and timing risk.
- Who should choose it.
- Who should avoid it.
- Featured cards by port.
- Fallback inventory, labeled.
- FAQ/schema.

## 9. Tour Card Data Model

```ts
type WtaTourCard = {
  id: string;
  title: string;
  port: string;
  category: string;
  duration: string;
  price_from: string | null;
  rating: number | null;
  review_count: number | null;
  image: string;
  cruise_safe: boolean | "unknown";
  weather_risk: "low" | "medium" | "high" | "unknown";
  return_to_ship_confidence: "low" | "medium" | "high" | "provider_guaranteed" | "unknown";
  provider_type: "partner" | "affiliate_fallback" | "internal";
  cta_href: string;
  decision_reason: string;
  fallback_reason?: string;
  tags: string[];
};
```

Rules:

- Use `rating`, `review_count`, and `price_from` only from provider data or approved internal source.
- Do not invent ratings.
- Do not invent prices.
- Do not claim cruise-safe if only inferred.
- `provider_guaranteed` requires actual provider guarantee support.
- `affiliate_fallback` cards must be visually and semantically labeled as fallback inventory.

## 10. Cruise/Date Planner Data Model

```ts
type WtaCruisePlannerInput = {
  traveler_mode: "cruise_passenger" | "independent_traveler" | "unknown";
  cruise_line?: string;
  ship?: string;
  sailing_date?: string;
  port?: string;
  arrival_time?: string;
  departure_time?: string;
  port_call_length_minutes?: number;
  party_size?: number;
  mobility_needs?: "none" | "limited_walking" | "wheelchair" | "unknown";
  weather_risk_tolerance?: "low" | "medium" | "high";
  activity_preference?: string[];
  budget_band?: "value" | "moderate" | "premium" | "unknown";
  fallback_ok?: boolean;
};

type WtaCruisePlannerResult = {
  recommended_card_id: string;
  alternate_card_ids: string[];
  fallback_card_ids: string[];
  decision_reason: string;
  return_to_ship_risk: "low" | "medium" | "high" | "unknown";
  weather_fallback_needed: boolean;
  blocked_reasons: string[];
  continuity_params: Record<string, string>;
};
```

## 11. Trust Badge Rules

Allowed only if supportable:

- Cruise-safe planning.
- Return-to-ship awareness.
- Weather-aware fallbacks.
- Local decision support.
- Partner/direct booking where the actual provider flow supports it.
- Book now/pay later only if the provider supports it.
- Guaranteed return to ship only if the provider actually guarantees it.
- Best price only if legally and operationally supportable.

Avoid:

- Guaranteed return to ship as a WTA-level claim unless contractually true.
- Best price guarantee without proof.
- Secure payments unless WTA controls or can accurately describe the provider checkout.
- Local operator claim unless it is true for the provider.
- Review/rating claims without sourced data.

## 12. Provider/Fallback Monetization Model

Priority order:

1. Partner/FareHarbor/WTA execution where controlled and available.
2. Internal DCC/WTA decision pages where the buyer still needs narrowing.
3. Affiliate fallback inventory through Viator/GetYourGuide only when controlled partner execution is unavailable, irrelevant, or too narrow.
4. Cruise-line/ship-booked recommendation when the risk profile makes independent booking the wrong move.

Accounting doctrine:

- Partner handoff is commercial intent.
- FareHarbor/WTA handoff is controlled execution when the operator relationship supports it.
- Viator/GetYourGuide is fallback inventory.
- Fallback rows and clicks must never be counted as owned execution proof.
- Marketplace fallback should be tracked as gap/coverage telemetry.

## 13. SEO Keyword Clusters

Primary:

- Alaska shore excursions.
- Alaska cruise excursions.
- Juneau shore excursions.
- Juneau tours.
- Juneau helicopter tours.
- Juneau whale watching.
- Juneau Mendenhall Glacier tour.
- Juneau cruise port excursions.

Secondary:

- Best Juneau excursions for cruise passengers.
- Helicopter vs whale watching Juneau.
- Skagway train tours.
- Skagway White Pass railroad.
- Ketchikan Misty Fjords tour.
- Icy Strait whale watching.
- Sitka shore excursions.
- Seward Kenai Fjords tour.

Long-tail decision clusters:

- What to do if Juneau helicopter tour is canceled.
- What happens if you miss the ship in Juneau.
- Cruise excursions vs independent in Alaska.
- Best Alaska excursions for short port calls.
- Alaska shore excursions for families.
- Accessible Alaska cruise excursions.
- Alaska whale watching best month.

## 14. Schema/Machine-Readable Plan

Use:

- `WebSite` with search action only when search exists.
- `Organization` for WTA/DCC network relationship.
- `BreadcrumbList` on all hub/port/category pages.
- `ItemList` for featured tours and category recommendations.
- `FAQPage` on planning/guide sections.
- `Product`/`Offer` only where WTA is selling or provider data supports current price/availability.
- `TouristTrip` or `Trip` only when structured fields are supportable.
- `WebPage`/`CollectionPage` for commercial browse and decision hubs.

Machine-readable consistency:

- Update sitemap when routes are added.
- Update `agent.json` governed corridors if WTA becomes an Alaska-wide corridor, not only Juneau.
- Update `llms.txt` with the WTA route hierarchy and fallback doctrine.
- Preserve canonical URLs.
- Preserve `decision_*` handoff params across WTA/partner/fallback transitions.

## 15. Implementation Phases

Phase 1: Plan + route inventory

- This document.
- Confirm current JFD/WTA route ownership.
- Confirm provider source of truth.
- Confirm which claims are legally/supportably allowed.

Phase 2: Juneau homepage scaffold

- Create a public WTA/DCC Juneau commercial hub.
- Use static safe cards.
- Do not add checkout/payment logic.
- Keep existing FareHarbor handoff untouched.

Phase 3: Featured tour/card data

- Add typed static tour-card data with provider labels.
- Populate only sourced price/rating/review fields.
- Label fallback inventory.

Phase 4: Cruise/date planner shell

- Build non-booking planner inputs.
- Produce recommendation state only.
- Preserve DCC continuity params.

Phase 5: Port/category route templates

- Add route templates for Skagway, Ketchikan, Sitka, Icy Strait, Seward.
- Add category templates for whale, helicopter, glacier, train, wildlife, kayaking, family, accessible.

Phase 6: Provider handoff/fallback tracking

- Track partner handoff, fallback clickout, and decision continuity.
- Do not interpret fallback as owned execution.
- Do not change payment/checkout/order logic.

Phase 7: SEO/schema/machine-readable audit

- Add schema only where supportable.
- Update sitemap, `agent.json`, and `llms.txt`.
- Validate canonical paths and no fake guarantee claims.

## 16. No-Touch Boundaries

- No PARR.
- No checkout/payment/order/session files.
- No WTS parked route-context repair.
- No Feastly lifecycle work.
- No fake guarantee claims.
- No copied competitor text, images, CSS, HTML, brand, or assets.
- No raw provider payment logic changes.
- No broad marketplace catalog that looks like owned execution.
- No "guaranteed return to ship" unless provider actually guarantees it.
- No "book now/pay later" unless provider supports it.
- No fake ratings, reviews, or price claims.

## 17. Recommended First Code Patch

Recommended first patch: a static, public-safe Juneau commercial decision hub that uses existing data and existing handoff behavior.

Smallest safe scope:

- Create or upgrade `/juneau` or `/juneau/shore-excursions`.
- Add a premium hero.
- Add a supportable trust strip.
- Add a read-only cruise/date planner shell.
- Add static featured cards for:
  - Juneau helicopter partner/direct handoff.
  - Juneau whale watching internal/partner lane.
  - Mendenhall fallback lane.
- Add provider labels and fallback disclosures.
- Link to existing pages:
  - `/juneau/helicopter-tours`
  - `/juneau/whale-watching-tours`
  - `/juneau/mendenhall`
  - `/juneau/what-to-do-if-helicopter-tour-canceled`
  - `/juneau/helicopter-vs-whale-watching`
- Do not add new checkout/payment/order logic.
- Do not touch Viator payment/prebook/booking code.
- Do not touch FareHarbor integration behavior beyond links already supported.

Why this first:

- Juneau already has the strongest WTA/JFD execution path.
- DCC already has Juneau decision content.
- It closes the biggest commercial presentation gap without creating an Alaska-wide fake catalog.
- It gives WTA a parity-plus surface before expanding to Skagway/Ketchikan/Sitka/Seward.
