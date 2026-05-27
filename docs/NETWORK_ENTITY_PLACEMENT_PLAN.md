# Network Entity Placement Plan

Date: 2026-05-27

Status: planning only. This document defines entity placement, canonical relationships, SEO ownership, handoff rules, and machine-readable alignment for the destination network. It does not authorize code changes, checkout/payment/order changes, or deployment.

## 1. Network Doctrine

The destination network must occupy the internet as one governed system, not as scattered SEO projects.

Core doctrine:

- DCC decides.
- EarthOS maps and governs.
- Broad brands own category breadth.
- Microsites own urgent high-intent decisions.
- Operators execute.
- Marketplaces are fallback inventory.

Role definitions:

- Destination Command Center is the decision layer. It explains the problem, narrows the choices, and routes users toward one recommended move.
- EarthOS is the public and internal network reference layer. It maps approved nodes, governs relationships, and keeps network truth from drifting.
- Broad brands are category authorities. They own wide commercial topics such as Alaska shore excursions or New Orleans tours.
- Microsites are focused decision surfaces. They win urgent or high-intent queries and resolve a narrow visitor problem quickly.
- Operators are execution surfaces. They book, confirm, fulfill, or directly hand off the service.
- Marketplaces provide fallback inventory. They are not owned execution unless a separate provider relationship says otherwise.

## 2. Domain Placement Table

| Domain / entity | Role | Geography | Primary query cluster | Secondary query cluster | Parent entity | Child entities | Handoff targets | Money action | Machine-readable assets needed | What it must not become |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `destinationcommandcenter.com` | Decision layer and network hub | Multi-destination | destination decisions, what should I book, route comparisons, destination command center | corridor pages, transport decisions, excursion decisions, fallback planning | EarthOS governance | Broad brands, microsites, operators, Atlas nodes | PARR, GoSno, Shuttleya, WTA/JFD, WNO/WTS, fallback marketplaces | Route user to best next action | `sitemap.xml`, `robots.txt`, canonical URLs, WebSite, Organization, BreadcrumbList, ItemList where relevant, `llms.txt`, `agent.json`, decision handoff params | Generic OTA, raw marketplace catalog, public telemetry dashboard, checkout system |
| `partyatredrocks.com` | Protected operator / money path | Red Rocks Amphitheatre, Morrison, Denver | Red Rocks shuttle from Denver, Red Rocks transportation, Party at Red Rocks | private Red Rocks ride, shared shuttle, Red Rocks pickup | DCC / EarthOS | Red Rocks shuttle booking paths, trust/support pages | Existing PARR booking path, customer support | Book Red Rocks shuttle/private ride | `sitemap.xml`, `robots.txt`, canonical URLs, Organization, LocalBusiness or Service where supportable, FAQPage, `agent.json` if handoff continuity exists | Experimental checkout playground, broad Colorado guide, DCC dashboard, unsupported Rezdy/Square refactor |
| `gosno.co` | Ski/mountain transportation operator microsite | Colorado mountains, Denver, DEN, I-70 resort corridors | Denver to Breckenridge shuttle, Denver Airport to Breckenridge shuttle, Denver to Vail shuttle, ski shuttle from Denver | Denver mountain transportation, private ski shuttle Colorado, Breckenridge airport transfer | DCC / EarthOS | Breckenridge, Vail, Keystone, Copper, Winter Park, Aspen, Beaver Creek, Steamboat route pages | GoSno booking/route request, partner fallback only when needed | Book/request mountain transfer | `sitemap.xml`, `robots.txt`, canonical URLs, WebSite, Organization, Service, FAQPage, `llms.txt`, `agent.json`, decision handoff params | Broad Colorado travel guide, resort lodging directory, unsupported availability engine, Shuttleya ownership replacement |
| `shuttleya.com` | Shuttle/operator execution surface | Colorado front range and mountain-adjacent corridors | Denver to Argo shuttle, Argo shuttle, Idaho Springs shuttle | group shuttle, private shuttle, event shuttle | DCC / EarthOS | Argo route, future Colorado route nodes | Shuttleya booking/request paths | Book/request shuttle | `sitemap.xml`, `robots.txt`, canonical URLs, Organization, Service, FAQPage, `agent.json` if handoff continuity exists | Generic transportation marketplace, broad Colorado guide, GoSno replacement without explicit route ownership change |
| `welcometoalaskatours.com` | Broad Alaska shore excursion authority | Alaska cruise ports | Alaska shore excursions, Alaska cruise excursions, Juneau shore excursions | Skagway tours, Ketchikan tours, Sitka tours, Seward tours, Icy Strait excursions | DCC / EarthOS | Juneau Flight Deck, Alaska port/category pages | JFD, WTA/FareHarbor partner where available, Viator/GYG fallback only | Partner handoff or qualified fallback click | `sitemap.xml`, `robots.txt`, canonical URLs, WebSite, Organization, BreadcrumbList, ItemList, FAQPage, `llms.txt`, `agent.json`, canonical port/category schema | Fake owned tour operator, raw affiliate wall, copied competitor catalog, unsupported return-to-ship guarantee |
| `juneauflightdeck.com` | Juneau urgent-decision microsite | Juneau cruise port | Juneau helicopter tour from cruise port, Juneau helicopter tours last minute, Juneau whale watching vs helicopter | helicopter weather cancellation, short port call Juneau, best Juneau excursion for cruise passengers | Welcome to Alaska Tours / DCC / EarthOS | Juneau helicopter, whale, glacier, short-port-call, weather-backup pages | WTA/FareHarbor partner where available, GYG/Viator fallback only when needed | Book/hand off to Juneau excursion provider | `sitemap.xml`, `robots.txt`, canonical URLs, WebSite, Organization, FAQPage, BreadcrumbList, ItemList, `llms.txt`, `agent.json`, decision handoff params | Broad Alaska catalog, fake live availability, fake guarantee surface, fallback inventory disguised as owned execution |
| `welcometoneworleanstours.com` | Broad New Orleans tour authority | New Orleans | New Orleans tours, things to do in New Orleans, New Orleans swamp tours | ghost tours, cemetery tours, food tours, cocktail tours, French Quarter tours | DCC / EarthOS | Welcome to the Swamp, New Orleans category pages | WTS, partner/direct providers if available, Viator/GYG fallback only | Partner handoff or qualified fallback click | `sitemap.xml`, `robots.txt`, canonical URLs, WebSite, Organization, BreadcrumbList, ItemList, FAQPage, `llms.txt`, `agent.json` once handoff logic exists | Swamp-only microsite, generic OTA, unsupported locally-owned/guarantee claims, broad blog with no decision engine |
| `welcometotheswamp.com` | Swamp/airboat urgent-decision microsite | New Orleans, bayou/swamp corridors | New Orleans swamp tour hotel pickup, swamp tour today New Orleans, last minute swamp tour New Orleans | airboat vs swamp boat New Orleans, family friendly swamp tour, no-car swamp tour | Welcome to New Orleans Tours / DCC / EarthOS | Swamp pickup, airboat, small boat, family, no-car, weather pages | WTS partner/fallback provider paths, GYG/Viator fallback only when needed | Book/hand off to swamp tour provider | `sitemap.xml`, `robots.txt`, canonical URLs, WebSite, Organization, FAQPage, BreadcrumbList, ItemList, `llms.txt`, `agent.json`, decision handoff params | Broad New Orleans tour authority, fake hotel pickup guarantee, unsupported local operator claim, Feastly or food-tour surface |
| `feastlyspread.com` | Food/group dining or catering surface, currently telemetry-sensitive | Wisconsin Dells / food and group meal contexts | group meals, catering, food spread, feast planning | Wisconsin Dells food, large group dining, delivery/pickup where applicable | DCC / EarthOS | Future food/catering decision nodes | Feastly booking/contact path only after lifecycle is valid | Booking/contact request only after telemetry lifecycle is fixed | `sitemap.xml`, `robots.txt`, canonical URLs, Organization/Service where supportable, `llms.txt` or `agent.json` only after flow is valid | Revenue dashboard truth source while telemetry is invalid, public proof of conversions, premature DCC wiring |
| `bluehillsoutpost.com` | Field-test destination/outpost node | Blue Hills / regional outdoor field-test area | Blue Hills Outpost, local guide/outpost queries | cabin/lake/outdoor local guide queries | EarthOS / DCC field-test governance | Manual outreach list, local partner pages if approved | Manual email/form/contact only | Manual inquiry or local partner contact | `sitemap.xml`, `robots.txt`, canonical URLs, Organization or WebSite, basic FAQ if supportable | DCC telemetry proof source, fake booking engine, universal destination claim, automated outreach telemetry |
| EarthOS Atlas | Public visual reference layer | Multi-destination | EarthOS Atlas, destination network map, destination intelligence map | destination corridors, public network nodes, future target map | EarthOS governance | Public-safe nodes for DCC, PARR, GoSno, Shuttleya, WTA/JFD, WNO/WTS, Blue Hills, fallback markets | Public-safe destination/domain CTAs only | Awareness and navigation, not checkout | Noindex at first, then canonical route if public claims are reviewed; public-safe JSON data, Organization/WebSite relationship to DCC/EarthOS | Raw telemetry layer, real estate listing site, proof of revenue, universal coverage claim, internal command map |

## 3. Canonical Relationship Rules

DCC relationship rules:

- DCC links to broad brands when the user still needs category breadth.
- DCC links to microsites when the user has urgent narrow intent.
- DCC links to operators when the decision is resolved and execution is real.
- DCC may link to fallback marketplaces only when owned/operator execution is unavailable, irrelevant, or intentionally secondary.

EarthOS Atlas relationship rules:

- EarthOS Atlas links only to public-safe nodes.
- EarthOS Atlas may show active, building, field-test, future-target, and fallback-market status.
- EarthOS Atlas must not expose internal revenue state, raw booking counts, telemetry invalidity details, do-not-touch flags, or private property data.
- EarthOS Atlas must not imply universal coverage.

Broad brand relationship rules:

- Broad brands link down to microsites for urgent high-intent decisions.
- Broad brands keep wide category and destination coverage.
- Broad brands should not steal exact urgent intent from their microsites.
- Broad brands should not pretend fallback inventory is owned execution.

Microsite relationship rules:

- Microsites link to operators, partner providers, or fallback marketplaces.
- Microsites should not route users back into broad comparison loops after a decision is made.
- Microsites preserve route, source, decision, and fallback context through handoff.

Operator relationship rules:

- Operators execute.
- Operators do not send resolved users back to DCC comparison pages as the primary path.
- Operators may link to DCC or broad brands for planning/support context only when it does not interrupt booking.

Marketplace relationship rules:

- Viator, GetYourGuide, and similar providers are fallback inventory unless a separate direct/partner execution relationship is established.
- Fallback marketplace links must be clearly labeled.
- Marketplace fallback clicks are gap or coverage telemetry, not owned execution proof.

## 4. SEO Cannibalization Rules

Each domain should own a distinct query zone.

| Query | Ranking owner | Supporting entities | Notes |
| --- | --- | --- | --- |
| destination command center | `destinationcommandcenter.com` / EarthOS | EarthOS Atlas | Brand/network query. |
| destination intelligence map | EarthOS Atlas | DCC | Atlas can rank once claims and copy are public-safe. |
| Red Rocks shuttle from Denver | `partyatredrocks.com` | DCC Red Rocks pages | PARR is protected money path. DCC should qualify and hand off. |
| Red Rocks transportation | `partyatredrocks.com` or DCC decision page | PARR | DCC may rank for decision framing; PARR should own booking action. |
| Denver to Breckenridge shuttle | `gosno.co` | DCC Denver-to-mountains | GoSno owns route execution intent. |
| Denver Airport to Breckenridge shuttle | `gosno.co` | DCC Denver-to-mountains | GoSno owns airport transfer execution. |
| Denver to Vail shuttle | `gosno.co` | DCC Colorado transport guides | GoSno owns route execution if supportable. |
| Denver to Argo shuttle | `shuttleya.com` | DCC Argo pages | Shuttleya owns Argo execution if operationally true. |
| Alaska shore excursions | `welcometoalaskatours.com` | DCC Alaska hub | Broad Alaska brand owns category breadth. |
| Alaska cruise excursions | `welcometoalaskatours.com` | DCC cruises pages | Broad brand owns commercial catalog/planner. |
| Juneau helicopter tour from cruise port | `juneauflightdeck.com` | WTA, DCC Juneau pages | JFD owns urgent Juneau decision. |
| Juneau whale watching vs helicopter | `juneauflightdeck.com` or DCC decision article | WTA | JFD should win high-intent decision; DCC can support. |
| New Orleans tours | `welcometoneworleanstours.com` | DCC New Orleans | Broad New Orleans brand owns category breadth. |
| New Orleans swamp tour hotel pickup | `welcometotheswamp.com` | WNO, DCC swamp pages | WTS owns urgent swamp/pickup decision. |
| swamp tour today New Orleans | `welcometotheswamp.com` | WNO | WTS owns last-minute swamp demand. |
| group meals / Feastly-related food intent | `feastlyspread.com` only after lifecycle validity | DCC food nodes later | Do not use invalid telemetry as proof. |
| Blue Hills Outpost | `bluehillsoutpost.com` | EarthOS field-test node | Field-test site owns exact local brand query. |

General cannibalization rules:

- Broad brands should not duplicate microsite exact-match pages unless the broad page is clearly a hub and links down.
- Microsites should not broaden into category authority pages that belong to the parent brand.
- DCC should own decision and comparison framing, not final category catalogs where a broad brand exists.
- Operators should own booking and execution queries.
- Field-test sites should own only their local brand/field-test space until demand is proven.

## 5. Handoff Rules

Required handoff preservation:

- Preserve `decision_corridor`.
- Preserve `source_path`.
- Preserve `source_domain` where available.
- Preserve `decision_product`.
- Preserve `decision_option`.
- Preserve `decision_action`.
- Preserve `decision_cta`.
- Preserve `fallback_reason` when fallback inventory is used.
- Preserve route-specific context such as origin, destination, pickup timing, group size, ship/port time, venue, or event.

Behavior rules:

- No downstream re-decision after DCC or a microsite has made the recommendation.
- Primary recommendation appears first.
- Alternative appears only when risk, timing, budget, party fit, or operational constraints justify it.
- Fallback appears only when the main path does not fit or cannot execute.
- Booking or request pages should not strip decision context.
- Operator pages should receive users with enough context to finish the money action.

Examples:

- DCC Red Rocks page -> PARR booking path with Red Rocks source and product context.
- DCC Denver-to-mountains page -> GoSno route page or booking with route and pickup context.
- Welcome to Alaska Tours Juneau page -> Juneau Flight Deck for urgent helicopter/whale/glacier decision.
- Welcome to New Orleans Tours swamp category -> Welcome to the Swamp for pickup/airboat/small-boat narrowing.
- DCC fallback -> Viator/GetYourGuide only when owned/partner execution does not fit.

## 6. Machine-Readable Rules

Each public site should have:

- `sitemap.xml`.
- `robots.txt`.
- Canonical URLs.
- JSON-LD appropriate to role.
- `llms.txt` where useful.
- `agent.json` where handoff logic exists.
- Organization/WebSite relationship back to DCC/EarthOS where appropriate.
- BreadcrumbList for routed commercial pages.
- FAQPage only where answers are supportable.
- ItemList for featured route/tour lists.
- Service/Product/Offer only where the operator or provider relationship supports it.

Role-specific schema rules:

- DCC: WebSite, Organization, BreadcrumbList, ItemList, FAQPage, decision/corridor metadata, and clear handoff relationships.
- EarthOS Atlas: WebSite/Organization and public-safe network node descriptions; no raw telemetry schema.
- Broad brands: WebSite, Organization, BreadcrumbList, ItemList, FAQPage, category and port/destination schema.
- Microsites: WebSite, Organization, BreadcrumbList, FAQPage, ItemList, Service/Product only when supportable.
- Operators: Organization, Service, LocalBusiness where appropriate, FAQPage, and Product/Offer only where booking and pricing are real.
- Field tests: conservative WebSite/Organization and canonical pages only.
- Marketplace fallbacks: outbound links must be labeled fallback; do not wrap them in owned-execution schema.

Machine-readable alignment rules:

- Sitemap, canonical URL, JSON-LD, `agent.json`, and `llms.txt` must agree on role and domain.
- Machine-readable files must not claim owned execution where only fallback inventory exists.
- Machine-readable files must not expose raw telemetry, invalid data, or internal next actions.
- Handoff-capable sites should document their DCC/EarthOS relationship in `agent.json` or equivalent.

## 7. EarthOS Atlas Role

EarthOS Atlas is the public visual reference point for the network.

It is:

- A public map of approved destination network nodes.
- A brand surface for the governed destination network.
- A safe visual index of active, building, future-target, field-test, and fallback-market nodes.
- A way to understand how DCC, broad brands, microsites, operators, and fallback markets relate geographically.

It is not:

- The raw telemetry layer.
- The internal command map.
- A real estate listing site.
- Universal coverage.
- Proof of revenue.
- A checkout surface.
- A public do-not-touch or invalid-data dashboard.

Allowed public statuses:

- `live`
- `building`
- `field_test`
- `future_target`
- `fallback_market`

Blocked public fields:

- Revenue state.
- Raw booking counts.
- Checkout starts.
- Booking completions.
- Telemetry invalid details.
- Do-not-touch flags.
- Internal next action.
- Machine drift notes.
- Private property data.
- Internal operator notes.

## 8. First Three Alignment Moves

### Move 1: PARR Red Rocks Money Cluster

Goal:

Protect and strengthen the proven money path without touching risky checkout/session refactors.

Actions:

- Keep PARR checkout/payment/order/session logic protected.
- Keep DCC Red Rocks pages as decision and qualification surfaces.
- Keep PARR as the booking/action owner for Red Rocks shuttle and private ride queries.
- Ensure DCC -> PARR handoffs preserve source path, corridor, product, CTA, and route context.
- Align PARR sitemap, canonical pages, trust/support pages, and machine-readable assets with the operator role.
- Continue manual traffic push with exact Red Rocks demand and partner outreach.

Do not:

- Publish parked checkout/session refactor as-is.
- Let DCC become the PARR dashboard or checkout layer.
- Send resolved Red Rocks users into generic transportation comparison.

### Move 2: WTA/JFD Alaska Hierarchy

Goal:

Separate broad Alaska category authority from urgent Juneau decision capture.

Actions:

- Position Welcome to Alaska Tours as the broad Alaska shore excursion and cruise excursion brand.
- Position Juneau Flight Deck as the urgent Juneau helicopter/whale/glacier/cruise-safe decision microsite.
- Link WTA down into JFD for high-intent Juneau helicopter, whale-vs-helicopter, weather fallback, and short-port-call queries.
- Keep DCC Alaska pages as decision/context feeders.
- Label FareHarbor/WTA partner paths, Viator, and GetYourGuide fallback clearly.
- Align sitemap, canonical URLs, `agent.json`, `llms.txt`, and schema across WTA/JFD.

Do not:

- Let JFD become a full Alaska catalog.
- Let WTA steal urgent Juneau microsite queries.
- Claim guaranteed return-to-ship, live availability, or owned execution unless provider support exists.

### Move 3: WNO/WTS New Orleans Hierarchy

Goal:

Create a broad New Orleans tour authority while keeping Welcome to the Swamp focused on swamp/airboat/hotel-pickup decisions.

Actions:

- Position Welcome to New Orleans Tours as the broad New Orleans tours brand.
- Position Welcome to the Swamp as the focused swamp/airboat/hotel-pickup/last-minute microsite.
- Link WNO down into WTS for swamp tour hotel pickup, swamp tour today, airboat vs boat, family/no-car, and weather-sensitive swamp queries.
- Keep DCC New Orleans pages as decision/context feeders.
- Label Viator/GetYourGuide fallback clearly unless a direct/partner execution path exists.
- Align sitemap, canonical URLs, `agent.json`, `llms.txt`, and schema across WNO/WTS.

Do not:

- Let WTS become a broad New Orleans tour catalog.
- Let WNO overclaim hotel pickup, local ownership, cancellation, or best-price claims.
- Count fallback marketplace clickouts as owned execution.

## 9. Operating Rule

Every domain must answer one question:

What job does this entity perform in the governed destination network?

If a page does not support that job, it should be parked, moved to the correct entity, noindexed, or rewritten before promotion.

The network should feel broad to users but strict internally:

- DCC decides.
- EarthOS maps and governs.
- Broad brands carry category breadth.
- Microsites resolve urgent intent.
- Operators execute.
- Marketplaces fill gaps.
