# GoSno Colorado Ski Transportation Microsite Plan

Date: 2026-05-27

Status: planning only. No code, checkout, payment, order, Feastly, WTS, or deployment work is authorized by this document.

## 1. Role Definition

GoSno is not a broad Colorado travel guide.

GoSno is the ski and mountain transportation decision microsite for Colorado resort travel. Its job is to solve one high-intent problem:

How do I get from Denver, Denver International Airport, or a Denver-area pickup to a ski resort without driving?

The microsite should compress the transportation decision into one recommended move, then preserve the route, pickup timing, luggage, ski gear, group size, and vehicle-fit context through handoff and booking.

GoSno should not become a generic attractions catalog, lodging guide, restaurant guide, or all-Colorado content site. DCC can handle broader discovery. GoSno should execute or route transportation intent.

## 2. Current Inventory

Inspected GoSno app surfaces:

- `apps/gosno/app/page.tsx`
- `apps/gosno/app/denver-to-breckenridge-shuttle/page.tsx`
- `apps/gosno/app/denver-airport-to-breckenridge/page.tsx`
- `apps/gosno/app/denver-to-vail-shuttle/page.tsx`
- `apps/gosno/lib/handoff/gosnoResolver.ts`
- `apps/gosno/lib/route-governance.ts`
- `apps/gosno/lib/seoEntryPages.ts`
- `apps/gosno/app/sitemap.ts`
- `apps/gosno/app/agent.json/route.ts`
- `apps/gosno/app/llms.txt/route.ts`

Inspected DCC mountain surfaces:

- `app/denver-to-mountains/page.tsx`
- `app/denver-to-mountains/breckenridge/page.tsx`
- `app/denver-to-mountains/breckenridge/transportation/page.tsx`
- `app/transportation/colorado/denver-to-breckenridge-shuttle-guide/page.tsx`
- `app/transportation/colorado/denver-to-breckenridge-without-a-car/page.tsx`
- `app/transportation/colorado/denver-to-vail-shuttle-guide/page.tsx`
- `app/can-you-get-to-breckenridge-without-a-car/page.tsx`
- `app/shuttle-vs-driving-breckenridge/page.tsx`
- `app/breckenridge-vs-vail/page.tsx`
- `lib/dcc/routing/breckenridgeSharedExperiment.ts`
- `lib/satellite-runtime/examples/gosno.ts`

Existing GoSno route inventory includes:

- `/`
- `/book`
- `/destinations`
- `/airport-shuttle`
- `/denver-airport-shuttle-to-ski-resorts`
- `/denver-to-breckenridge`
- `/denver-to-breckenridge-shuttle`
- `/denver-airport-to-breckenridge`
- `/denver-to-vail-shuttle`
- `/breckenridge`
- `/breckenridge-shuttle`
- `/vail`
- `/keystone`
- `/copper`
- `/copper-mountain`
- `/winter-park`
- `/aspen`
- `/snowmass`
- `/steamboat`
- `/steamboat-springs`
- `/beaver-creek`
- `/black-hawk`
- `/services`
- `/services/airport-shuttle`
- `/services/return-shuttle`
- `/services/round-trip`
- `/services/group-transport`
- `/services/black-hawk-shuttle`
- `/about`
- `/contact`
- `/faq`
- `/blog`
- `/privacy-policy`
- `/terms-and-conditions`
- `/cancellation-policy`
- `/sitemap.xml`
- `/agent.json`
- `/llms.txt`

Current strengths:

- Exact-match Breckenridge and Vail pages already exist.
- Route governance already distinguishes promoted, indexable, live-unpromoted, satellite, and utility paths.
- Sitemap is generated from governed indexable paths.
- `agent.json` and `llms.txt` already identify GoSno as an owned execution operator for Denver-to-mountain transportation.
- DCC already links the Breckenridge transportation decision into GoSno with decision continuity parameters.
- Handoff logic already preserves route and booking intent for GoSno execution.

Current gaps:

- The homepage is already execution-focused but still needs a clearer last-minute ski transportation decision module.
- Several high-value exact-match pages are missing or only covered by broader resort pages.
- Route pages need a consistent route-card model that explains pickup, destination, gear fit, weather risk, and group fit.
- Trust language must avoid unsupported claims such as guaranteed availability, storm-proof travel, 24/7 service, cheapest pricing, or full resort coverage unless verified.
- Broader DCC mountain pages and GoSno route pages need a clear division: DCC decides, GoSno executes.

## 3. Target Query Clusters

Primary commercial queries:

- Denver to Breckenridge shuttle
- Denver Airport to Breckenridge shuttle
- Denver to Vail shuttle
- Denver Airport to Vail transportation
- Denver to Keystone shuttle
- Denver to Copper Mountain shuttle
- Denver to Winter Park shuttle
- ski shuttle from Denver
- private ski shuttle Colorado
- Denver mountain transportation
- Denver to ski resort shuttle
- Breckenridge airport transfer
- Colorado ski transportation

Supporting decision queries:

- Denver to Breckenridge without a car
- Breckenridge shuttle vs rental car
- Denver airport to ski resort with skis
- ski shuttle with luggage from Denver
- private van to Breckenridge
- winter driving Denver to Breckenridge
- I-70 ski traffic shuttle
- Denver to mountains transportation in snow
- group ski shuttle from Denver
- ski resort airport transfer Colorado

Last-minute intent queries:

- shuttle to Breckenridge today
- Denver airport to Breckenridge tomorrow
- last minute ski shuttle Denver
- weekend ski shuttle from Denver
- Denver to Vail transportation today
- Denver ski shuttle with flight delay

## 4. Microsite Page Architecture

Recommended GoSno microsite structure:

- `/`
- `/denver-to-breckenridge-shuttle`
- `/denver-airport-to-breckenridge`
- `/denver-to-vail-shuttle`
- `/denver-airport-to-vail`
- `/denver-to-keystone-shuttle`
- `/denver-to-copper-mountain-shuttle`
- `/denver-to-winter-park-shuttle`
- `/ski-shuttle-from-denver`
- `/private-ski-shuttle-colorado`
- `/denver-mountain-transportation`
- `/breckenridge-airport-transfer`

Existing route aliases should remain compatibility paths, not primary SEO targets:

- `/breckenridge`
- `/breckenridge-shuttle`
- `/breckenridge/index.html`
- `/copper-mountain`
- `/steamboat-springs`

Recommended canonical hierarchy:

- Homepage explains GoSno's role and routes users into the correct resort lane.
- Exact-match route pages capture high-intent search demand.
- Resort pages support route selection and compatibility.
- Service pages handle generic airport, return, group, and private transport intent.
- `/book` remains a booking continuation surface, not a primary search landing page.

## 5. Homepage Module Plan

The GoSno homepage should behave like a transportation verdict page, not a catalog.

Recommended modules:

1. Verdict hero
   - Headline: Denver airport to ski resort transportation without winter driving.
   - One primary CTA: choose route or start Breckenridge transfer.
   - Secondary CTA: continue booking if route context already exists.

2. Pickup, destination, date input shell
   - Pickup: DEN, Denver hotel, Denver address.
   - Destination: Breckenridge, Vail, Keystone, Copper, Winter Park, Aspen, Beaver Creek, Steamboat, Snowmass.
   - Date/time shell for route planning.
   - The shell can be static first; do not claim live availability unless connected to supported inventory.

3. Trust strip
   - Airport pickup aware.
   - Ski gear friendly.
   - Winter road aware.
   - Private group options.
   - Resort-route focused.

4. What ride fits decision block
   - Shared shuttle if route/timing fits.
   - Private SUV or van for late flights, family groups, luggage, skis, or tight timing.
   - Rental car only if visitor accepts winter driving and parking.
   - Rideshare is weak for long mountain routes and storm days.

5. Featured resort routes
   - Breckenridge.
   - Vail.
   - Keystone.
   - Copper Mountain.
   - Winter Park.
   - Aspen or Beaver Creek as premium/private long-distance lanes.

6. Private vs shared decision module
   - Present tradeoffs without fake guarantees.
   - Preserve decision state into CTA.

7. Airport vs Denver pickup module
   - DEN arrivals.
   - Downtown Denver hotel pickup.
   - Private address pickup.
   - Return trip planning.

8. Weather and road-risk planning block
   - Frame winter driving, I-70 variability, storm delays, and parking as decision factors.
   - Do not promise storm-proof transport.

9. Ski gear and luggage block
   - Gear capacity is a planning factor.
   - User must confirm group size and gear in booking.

10. FAQ
   - How far is Breckenridge from Denver?
   - Should I rent a car or take a shuttle?
   - Can I bring skis?
   - What if my flight is delayed?
   - Should I book private or shared?
   - How early should I leave the resort for DEN?

11. Clear CTA
   - Continue into the correct route.
   - Do not send resolved users back into broad comparison loops.

12. Handoff disclosure
   - DCC may route users into GoSno.
   - GoSno executes or routes the transportation request.
   - Fallback inventory is not owned execution.

## 6. Last-Minute Booking Logic

GoSno should support last-minute decision framing without claiming unsupported live inventory.

Required logic:

- Today/tomorrow/weekend framing.
- Storm and winter road warning.
- Pickup window clarity.
- Airport arrival time logic.
- Return trip timing.
- Ski gear and luggage capacity.
- Group-size vehicle fit.
- Resort check-in timing.
- Fallback if route is not covered.

Airport timing rules:

- Same-day airport arrivals need a pickup buffer around landing, bags, ski gear, and winter road conditions.
- Late-night arrivals generally bias toward private transfer if supported.
- Early return flights require conservative resort departure timing.
- Flight delay handling should be described only if operationally supported.

Route-risk rules:

- I-70 and mountain weather should be framed as planning risk, not as a guarantee failure.
- Private transfer can reduce coordination friction but cannot eliminate road closures or storms.
- Shared shuttle can be the default if route and timing fit.
- Rental car belongs in the comparison only as a self-managed fallback.

Fallback rules:

- If GoSno cannot cover the requested route, preserve origin, destination, date, group size, and fallback reason.
- Fallback clicks are coverage-gap signals, not proof of GoSno-owned execution.

## 7. Decision Comparison Blocks

Shared shuttle:

- Best when available and timing fits.
- Strong fit for solo travelers, couples, and flexible groups.
- Lower coordination burden than driving.
- Do not claim availability unless backed by a live inventory source.

Private SUV or van:

- Best when the group has luggage, skis, kids, odd arrival time, late flight, or lodging-specific pickup/drop-off needs.
- Strong fit for families, private groups, premium trips, and late arrivals.
- Higher cost but lower friction.

Rental car:

- Only a good fit if the visitor is comfortable with winter mountain driving, I-70 traffic, parking, fuel, and return-day fatigue.
- Good for travelers who need full schedule control and accept road risk.

Rideshare:

- Weak for long mountain routes, storm days, ski gear, and return-trip certainty.
- Should not be positioned as the primary answer.

Marketplace or partner fallback:

- Use only if GoSno cannot execute or route the trip directly.
- Clearly mark as fallback or partner inventory.
- Do not count fallback rows as owned execution proof.

## 8. Route Card Data Model

Recommended route card fields:

```ts
type GoSnoRouteCard = {
  id: string;
  title: string;
  origin: string;
  destination: string;
  route_type:
    | "airport_transfer"
    | "city_pickup"
    | "resort_transfer"
    | "private_transfer"
    | "shared_shuttle";
  duration_estimate: string;
  price_from: string | null;
  weather_risk: "low" | "medium" | "high" | "variable";
  gear_fit: "light" | "ski_gear_friendly" | "group_gear";
  group_fit: "solo" | "couple" | "family" | "group" | "private_group";
  pickup_options: string[];
  destination_dropoff_notes: string;
  provider_type: "owned" | "partner" | "affiliate_fallback" | "unavailable";
  cta_href: string;
  decision_reason: string;
  fallback_reason: string | null;
  tags: string[];
};
```

Required public copy behavior:

- If `provider_type` is `owned`, the page may identify the route as GoSno execution only where operationally true.
- If `provider_type` is `partner`, the page must label the provider relationship clearly.
- If `provider_type` is `affiliate_fallback`, the card must not imply GoSno owns execution.
- If `provider_type` is `unavailable`, the card should route to contact, inquiry, or a fallback page without pretending booking exists.

## 9. Trust Badge Rules

Allowed only if supportable:

- Airport pickup aware.
- Ski gear friendly.
- Winter road aware.
- Private group options.
- Resort-route focused.
- Local decision support.
- Book now/pay later only if supported by the actual booking provider.
- Guaranteed pickup only if operationally true and documented.

Blocked unless verified:

- Guaranteed availability.
- Guaranteed cheapest.
- Storm-proof travel.
- 24/7 service.
- Every resort coverage.
- Guaranteed pickup.
- Guaranteed flight-delay protection.
- Guaranteed road-closure workaround.
- Locally owned, unless verified.
- Licensed/insured claims, unless verified.

Neutral language to prefer:

- "Plan around winter road conditions."
- "Built for travelers with ski gear and luggage."
- "Choose private when timing and gear control matter."
- "Route-focused transportation support."
- "Confirm final details in booking."

## 10. SEO Strategy

Primary SEO targets:

- Denver to Breckenridge shuttle.
- Denver Airport to Breckenridge shuttle.
- Denver to Vail shuttle.
- Denver Airport to Vail transportation.
- Denver to Keystone shuttle.
- Denver to Copper Mountain shuttle.
- Denver to Winter Park shuttle.
- ski shuttle from Denver.
- private ski shuttle Colorado.
- Denver mountain transportation.
- Breckenridge airport transfer.

Page-level SEO approach:

- Use exact-match route pages for high-intent route queries.
- Use resort pages for broader resort transportation context.
- Use service pages for airport shuttle, private group, round-trip, and return-trip intent.
- Use FAQ schema where the answers are operationally safe and do not overclaim.
- Avoid broad Colorado travel content that competes with DCC, EarthOS Atlas, or future destination guides.

Internal linking:

- DCC mountain pages should link into GoSno only after the transport decision is narrowed.
- GoSno exact route pages should link to booking or route-specific pages, not back into broad comparison loops.
- GoSno homepage should surface the most valuable resort lanes without becoming a directory.

Content gaps to fill:

- `/denver-airport-to-vail`
- `/denver-to-keystone-shuttle`
- `/denver-to-copper-mountain-shuttle`
- `/denver-to-winter-park-shuttle`
- `/ski-shuttle-from-denver`
- `/private-ski-shuttle-colorado`
- `/denver-mountain-transportation`
- `/breckenridge-airport-transfer`

## 11. Schema and Machine-Readable Plan

Use:

- `WebSite`
- `Organization`
- `BreadcrumbList`
- `ItemList` for resort routes.
- `FAQPage` for route and service FAQ sections.
- `Service` schema where appropriate.
- `Product` or `Offer` only if GoSno is actually selling or controlling the route and pricing data is supportable.
- `llms.txt`
- `agent.json`
- `sitemap.xml`
- Canonical URLs.
- `decision_*` handoff params.

Machine-readable rules:

- Route pages should preserve `decision_corridor`, `origin`, `destination`, `pickup`, `dropoff`, `route`, `ride_type`, `mode`, and `source_page`.
- DCC handoffs should not be stripped when the user enters GoSno.
- Public schema should not expose internal telemetry, revenue state, do-not-touch flags, raw conversion data, or invalid telemetry states.
- Fallback inventory should be machine-labeled as fallback, not owned execution.

Existing machine-readable surfaces:

- GoSno sitemap is governed by `GOSNO_INDEXABLE_ROUTE_PATHS`.
- GoSno `agent.json` identifies owned execution operator status.
- GoSno `llms.txt` declares DCC relationship, execution role, and doctrine.

Recommended next machine-readable additions:

- Add route-specific entries only after route pages exist and claims are reviewed.
- Keep unsupported route pages out of sitemap until they are real, coherent, and safe.
- Add FAQ schema to exact-match route pages after copy is verified.

## 12. Monetization Model

Priority order:

1. GoSno-owned route first where available.
2. Partner/private operator fallback where needed.
3. Marketplace fallback only if no controlled route exists.
4. Inquiry/contact route if the request cannot be safely fulfilled.

Rules:

- Do not count marketplace fallback clicks as owned execution proof.
- Do not describe affiliate inventory as GoSno-operated transport.
- Do not imply route coverage until GoSno or a partner can execute it.
- Preserve fallback reason for DCC and EarthOS coverage analysis.

Revenue intent should be measured by:

- Route page visits.
- Route CTA clicks.
- Booking opens with route context.
- Completed booking only if the booking lifecycle is valid.
- Contact/inquiry submissions where direct booking is unavailable.

## 13. Relationship to DCC and EarthOS

DCC relationship:

- DCC routes Denver-to-mountains intent into GoSno after narrowing the transport decision.
- DCC should explain the decision tradeoff: shuttle, private transfer, self-drive.
- DCC should not keep users in comparison once the transport decision is resolved.
- DCC should preserve decision parameters into GoSno handoff.

EarthOS relationship:

- EarthOS Atlas can show GoSno as the Colorado mountain transport node.
- Internal EarthOS Command Map can later track route coverage, telemetry health, drift, and next actions.
- Public EarthOS surfaces must not expose revenue state, invalid telemetry, do-not-touch flags, or internal next actions.

GoSno continuity:

- GoSno should preserve `decision_corridor`.
- GoSno should preserve origin and destination.
- GoSno should preserve pickup timing and vehicle fit.
- GoSno should preserve source page and route context.
- GoSno should not send resolved transport intent back into broad travel comparison.

## 14. Implementation Phases

Phase 1: inventory and plan

- Complete this document.
- Confirm existing GoSno route inventory.
- Confirm no PARR, payment, order, Feastly, or WTS work is involved.

Phase 2: GoSno homepage rewrite/scaffold

- Add last-minute ski transportation decision shell.
- Tighten primary CTA and route selection.
- Add supportable trust strip.
- Avoid unsupported availability claims.

Phase 3: Breckenridge route page

- Strengthen `/denver-to-breckenridge-shuttle` as the first exact-match route patch.
- Preserve existing booking handoff.
- Add route-card and FAQ content only if claims are supportable.

Phase 4: Vail, Keystone, Copper, and Winter Park route templates

- Use the Breckenridge route page as the pattern.
- Add exact-match route pages only where route support is clear.
- Keep unsupported routes as future targets or inquiry paths.

Phase 5: Pickup, destination, date planner shell

- Add static shell first.
- Do not claim live availability until real inventory support exists.
- Preserve route and timing context into handoff.

Phase 6: Provider handoff and fallback tracking

- Label provider types clearly.
- Preserve fallback reason.
- Track fallback as coverage gap, not owned execution.

Phase 7: SEO and machine-readable audit

- Review sitemap, canonical URLs, `agent.json`, `llms.txt`, schema, and route governance.
- Ensure new pages do not create duplicate/cannibal paths.
- Confirm unsupported claims are absent.

## 15. No-Touch Boundaries

Do not touch:

- PARR.
- Checkout code.
- Payment code.
- Order code.
- Square code.
- Feastly.
- WTS parked route-context repair.
- Shuttleya Argo route ownership.
- Runtime data files.
- Database migrations.
- Deployment configuration.

Do not claim:

- Guaranteed availability.
- Guaranteed cheapest price.
- Storm-proof travel.
- 24/7 service.
- Every resort coverage.
- Guaranteed pickup.
- Live inventory unless supported.
- Marketplace fallback as owned execution.

Do not build:

- Broad Colorado guide sprawl.
- Generic attractions directory.
- Public claims based on internal telemetry.
- New payment or checkout behavior.

## 16. Biggest SEO Gaps

Highest-value gaps:

- Missing exact-match GoSno route for Denver Airport to Vail.
- Missing exact-match GoSno route for Denver to Keystone shuttle.
- Missing exact-match GoSno route for Denver to Copper Mountain shuttle.
- Missing exact-match GoSno route for Denver to Winter Park shuttle.
- Missing page for private ski shuttle Colorado.
- Missing page for Denver mountain transportation.
- Missing page for Breckenridge airport transfer.

Conversion gaps:

- Homepage needs a sharper last-minute booking shell.
- Route pages should explain private vs shared vs self-drive without reopening the whole travel search.
- Gear, luggage, group size, and return-trip timing should be first-class planning fields.
- Unsupported route coverage should route to inquiry/fallback cleanly.

Machine-readable gaps:

- New exact-match route pages should be added to route governance only after they are real and supportable.
- FAQ schema should wait until copy is verified.
- Provider/fallback labels should be explicit before any fallback inventory is shown.

## 17. Recommended First Code Patch

First patch recommendation: `/denver-to-breckenridge-shuttle`.

Reason:

- It is already indexable and governed.
- It matches the highest-value exact query cluster.
- DCC already treats Breckenridge as the primary mountain decision lane.
- It can improve revenue intent without expanding route ownership.
- It can reuse existing `SeoEntryPage` and booking handoff behavior.
- It avoids PARR, payment, order, Feastly, and WTS risk.

Patch shape:

- Strengthen the page as a high-intent decision page.
- Add route-card content for shared shuttle vs private ride vs self-drive fallback.
- Add supportable trust strip.
- Add FAQ content around airport pickup, ski gear, luggage, timing, and return trip.
- Preserve existing booking CTAs and route context.
- Do not alter payment, checkout, order, or booking lifecycle code.

Second patch recommendation: GoSno homepage.

Reason:

- The homepage already has the right execution-layer framing.
- It needs a clearer pickup/destination/date shell and last-minute booking decision module.
- This should follow the Breckenridge page pattern so the homepage does not become too broad.

Third patch recommendation: `/denver-airport-to-vail`.

Reason:

- Vail already has a route page and recommendation coverage.
- Airport-to-Vail is a high-intent missing exact-match page.
- It can follow the Breckenridge airport page pattern once route support is confirmed.

## 18. Final Recommendation

Proceed with GoSno as a focused Colorado ski transportation microsite, not a broad Colorado travel site.

The safest revenue path is:

1. Improve `/denver-to-breckenridge-shuttle`.
2. Tighten the homepage around route selection and last-minute transfer logic.
3. Add exact-match pages for airport-to-Vail, Keystone, Copper, Winter Park, private ski shuttle, and Denver mountain transportation only where route coverage and claims are supportable.
4. Preserve DCC-to-GoSno decision continuity.
5. Keep fallback inventory clearly labeled and out of owned-execution metrics.
