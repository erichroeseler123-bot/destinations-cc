# JFD and WTS Microsite SEO and Last-Minute Booking Plan

Status: planning only  
Date: 2026-05-27  
Scope: Juneau Flight Deck and Welcome to the Swamp microsites  
Parent brand context: Welcome to Alaska Tours and Welcome to New Orleans Tours

## 1. Role Definition

Juneau Flight Deck is not the broad Alaska catalog. It is the narrow, urgent Juneau decision surface for cruise passengers and high-intent travelers choosing between helicopter, whale watching, glacier access, weather backup, and short-port-call options.

Welcome to the Swamp is not the broad New Orleans catalog. It is the narrow, urgent New Orleans swamp decision surface for visitors choosing between airboat, covered/small boat, hotel pickup, family fit, no-car logistics, and today/tomorrow availability.

Each microsite exists to win a specific decision:

- JFD: "What should I do in Juneau when port time, weather, budget, and live helicopter availability matter right now?"
- WTS: "What swamp tour should I book from New Orleans when pickup, timing, group fit, and last-minute availability matter right now?"

Broad brand split:

- Welcome to Alaska Tours owns the Alaska-wide shore-excursion authority layer.
- Juneau Flight Deck owns urgent Juneau helicopter/whale/glacier execution decisions.
- Welcome to New Orleans Tours owns the New Orleans-wide tours authority layer.
- Welcome to the Swamp owns urgent swamp/airboat/hotel-pickup execution decisions.

## 2. Juneau Flight Deck Target Queries

Primary JFD query set:

- Juneau helicopter tour from cruise port.
- Juneau helicopter tours last minute.
- Juneau glacier helicopter tour worth it.
- Juneau whale watching vs helicopter.
- Juneau helicopter vs glacier boat.
- Juneau cruise excursion with short port call.
- Juneau helicopter tour weather cancellation.
- Best Juneau excursion for cruise passengers.

Secondary JFD query set:

- Juneau helicopter tours available today.
- Juneau helicopter tours tomorrow.
- Juneau glacier landing tour from cruise ship.
- Juneau dogsled helicopter tour worth it.
- What to do if Juneau helicopter tour is canceled.
- Juneau whale watching backup plan.
- Juneau Mendenhall fallback.
- Juneau shore excursion short time in port.

## 3. Welcome to the Swamp Target Queries

Primary WTS query set:

- New Orleans swamp tour hotel pickup.
- Swamp tour today New Orleans.
- Last minute swamp tour New Orleans.
- Best swamp tour New Orleans.
- Airboat vs swamp boat New Orleans.
- New Orleans swamp tour without car.
- Family friendly swamp tour New Orleans.
- Small boat swamp tour New Orleans.

Secondary WTS query set:

- Airboat tour New Orleans today.
- New Orleans airboat tour hotel pickup.
- New Orleans swamp tour from French Quarter.
- New Orleans swamp tour with kids.
- Covered boat swamp tour New Orleans.
- New Orleans bayou tour hotel pickup.
- New Orleans swamp tour rain.
- New Orleans swamp tour tomorrow.

## 4. Microsite Page Architecture

### Juneau Flight Deck

Recommended JFD route set:

- `/`
- `/juneau-helicopter-tours`
- `/juneau-helicopter-tours-from-cruise-port`
- `/juneau-whale-watching-vs-helicopter`
- `/juneau-glacier-helicopter-worth-it`
- `/last-minute-juneau-excursions`
- `/juneau-weather-backup`
- `/short-port-call-juneau`

Existing related JFD routes currently observed:

- `/`
- `/helicopter`
- `/juneau-helicopter-tours`
- `/juneau-whale-watching-tours`
- `/helicopter-vs-whale-watching-juneau`
- `/best-excursions-in-juneau`
- `/what-to-do-in-juneau-cruise-port`
- `/juneau-dogsled-helicopter-tours`
- `/juneau-glacier-landing-tours`
- `/juneau/best-independent-excursions`
- `/juneau/cruise-excursions-vs-independent`
- `/juneau/what-happens-if-you-miss-the-ship`
- `/juneau/what-to-do-if-helicopter-tour-canceled`
- `/skagway/helicopter`
- `/tours/[slug]`

JFD architecture decision:

- Keep `/` focused on immediate date-first helicopter availability.
- Add or strengthen cruise-port and weather-backup pages.
- Use broad Alaska/WTA pages only when the traveler is still planning the full Alaska trip.
- Avoid making JFD a full Alaska catalog.

### Welcome to the Swamp

Recommended WTS route set:

- `/`
- `/new-orleans-swamp-tour-hotel-pickup`
- `/swamp-tour-today-new-orleans`
- `/last-minute-swamp-tour-new-orleans`
- `/airboat-vs-swamp-boat-new-orleans`
- `/small-boat-swamp-tour-new-orleans`
- `/family-friendly-swamp-tour-new-orleans`
- `/new-orleans-swamp-tour-without-car`

Existing related WTS routes currently observed:

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

WTS architecture decision:

- Keep `/` focused on today/tomorrow airboat or swamp-tour availability.
- Add exact-match last-minute and pickup pages only when they feed the same decision system.
- Keep broad New Orleans tour category content on Welcome to New Orleans Tours or DCC.
- Avoid turning WTS into food, ghost, cemetery, or general tours content.

## 5. Homepage Module Plan for Each Microsite

### Juneau Flight Deck homepage

Modules:

1. Verdict hero
   - "Check Juneau helicopter availability for your cruise day."
   - Date-first CTA.
   - Strong but supportable cruise-day framing.

2. Last-minute booking strip
   - Today.
   - Tomorrow.
   - Cruise date.
   - Known weather-risk disclosure.

3. Primary recommendation card
   - Helicopter if weather, budget, and port window fit.
   - Direct/FareHarbor partner handoff where supported.

4. Alternative/fallback card
   - Whale watching if helicopter risk is high.
   - Mendenhall land fallback if port window is short or weather breaks the flight lane.

5. Decision comparison module
   - Helicopter vs whale watching.
   - Helicopter vs glacier boat/Mendenhall.
   - Premium memory vs lower-risk port day.

6. Timing/safety module
   - Port arrival/departure window.
   - Return-to-ship awareness.
   - Weather cancellation risk.
   - Short port call warning.

7. FAQ
   - Is a helicopter tour worth it?
   - What if it cancels?
   - Is whale watching a safer backup?
   - What should I do with a short port call?

8. Trust strip
   - Cruise-safe planning.
   - Weather-aware fallback.
   - Port timing aware.
   - Partner handoff where verified.
   - Return-to-ship awareness, not guarantee unless provider guarantees it.

9. Clean CTA
   - "Check your Juneau date."
   - "Compare helicopter vs whale watching."

10. Handoff disclosure
   - Booking may complete with the operator/provider.
   - Marketplace fallback is fallback inventory, not owned execution.

### Welcome to the Swamp homepage

Modules:

1. Verdict hero
   - "Find a New Orleans swamp tour for today or tomorrow."
   - Pickup-aware and format-aware CTA.

2. Last-minute booking strip
   - Today.
   - Tomorrow.
   - Hotel pickup.
   - Family/group fit.

3. Primary recommendation card
   - Hotel-pickup swamp tour for most no-car visitors.
   - Airboat if speed/loud/rugged is the point.
   - Covered/small boat if family/nature/photo priority.

4. Alternative/fallback card
   - Covered boat if airboat is too intense.
   - Marketplace fallback if primary shortlist does not fit.

5. Decision comparison module
   - Airboat vs covered boat.
   - Hotel pickup vs drive yourself.
   - Family fit vs party group.

6. Timing/safety module
   - Pickup zone.
   - Weather/rain.
   - Heat/exposure.
   - Short trip fit.

7. FAQ
   - Do swamp tours pick up from hotels?
   - Can I book a swamp tour today?
   - Airboat or covered boat?
   - Is a swamp tour good with kids?

8. Trust strip
   - Hotel-pickup aware.
   - No-car friendly.
   - Family-fit guidance.
   - Weather-aware options.
   - Local decision support.

9. Clean CTA
   - "Find pickup-friendly tours."
   - "Show airboat tours today."

10. Handoff disclosure
   - GetYourGuide/Viator confirms live availability where used.
   - Provider terms control pickup, cancellation, and confirmation.

## 6. Last-Minute Booking Logic

### Juneau

Inputs:

- Cruise port date.
- Arrival time.
- Departure time.
- Ship return margin.
- Party size.
- Budget band.
- Weather risk tolerance.
- Mobility comfort.
- Helicopter vs whale/glacier preference.

Decision rules:

- If port call is short, bias away from high-friction premium options unless timing is clearly safe.
- If helicopter weather risk is high, show whale watching backup first.
- If budget is open and weather/port margin are acceptable, helicopter remains the premium primary recommendation.
- If group comfort is mixed, whale watching is usually the broader-fit fallback.
- If both weather and timing are tight, Mendenhall land fallback becomes safer.
- Do not promise return-to-ship unless provider guarantee exists.

### Welcome to the Swamp

Inputs:

- Date.
- Today/tomorrow intent.
- Hotel/French Quarter location.
- Pickup zone.
- Drive-self willingness.
- Family vs party group.
- Weather/rain sensitivity.
- Airboat vs covered/small boat preference.
- Time window.

Decision rules:

- If no car or pickup matters, prioritize pickup-aware options.
- If group includes kids or comfort-sensitive travelers, bias toward covered/small boat.
- If party/thrill group and weather is acceptable, airboat can be primary.
- If rain/exposure risk is high, avoid claiming weather-proof; show lower-exposure or provider-confirmed alternatives.
- If same-day inventory is thin, show fallback inventory clearly labeled.
- If the visitor is staying in/near the French Quarter and has limited time, avoid over-recommending transfer-heavy options.

## 7. Decision Comparison Blocks

### Juneau

Primary comparison:

- Helicopter if weather and budget fit.
- Whale watching if weather risk or group comfort matters.
- Mendenhall land tour if short port call or lower risk matters.

Block structure:

- Best for.
- Avoid if.
- Weather risk.
- Port-time fit.
- Price/risk profile.
- Clean CTA.

### Welcome to the Swamp

Primary comparison:

- Hotel-pickup swamp tour for most visitors.
- Airboat if fast/loud/rugged is desired.
- Small/covered boat if family/nature/photo priority.
- Fallback marketplace only if primary does not fit.

Block structure:

- Best for.
- Avoid if.
- Pickup needs.
- Weather/rain exposure.
- Group fit.
- Clean CTA.

## 8. Trust Badge Rules

### JFD allowed if supportable

- Cruise-safe planning.
- Weather-aware fallback.
- Port timing aware.
- Partner handoff.
- Return-to-ship awareness.

### WTS allowed if supportable

- Hotel pickup aware.
- No-car friendly.
- Family-fit guidance.
- Weather-aware options.
- Local decision support.

### Block unsupported claims

- Guaranteed return to ship unless provider guarantees it.
- Best price unless legally/supportably true.
- Locally owned unless true.
- Exclusive access unless true.
- Guaranteed pickup unless provider guarantees it.
- No-risk cancellation unless provider terms prove it.
- Guaranteed wildlife sightings.

Safer language:

- "Return-to-ship awareness" instead of "guaranteed return to ship."
- "Pickup-aware planning" instead of "guaranteed hotel pickup."
- "Weather-aware fallback" instead of "weather-proof booking."
- "Provider terms apply" wherever cancellation/payment/pickup claims appear.

## 9. Provider/Fallback Doctrine

Priority order:

1. Partner/direct execution where verified.
2. Controlled operator handoff where supported.
3. Microsite decision surface when user still needs narrowing.
4. Viator/GetYourGuide fallback only when needed.

Rules:

- Marketplace fallback is coverage inventory, not owned execution.
- Fallback clicks are coverage/gap signals, not owned execution proof.
- Do not count fallback rows as successful owned conversion.
- Handoff params must preserve:
  - `decision_corridor`
  - `sourcePage`
  - `primary_recommendation`
  - `fallback_reason`
  - `decision_action`
  - `decision_option`
  - `decision_product`
  - `decision_state`
  - `date`
  - `port`
  - WTS `intent`, `topic`, `subtype`, `context`

## 10. SEO/Machine-Readable Plan

### Title/meta templates

JFD:

- `{Decision} | Juneau Flight Deck`
- `{Tour Type} from Cruise Port | Juneau Flight Deck`
- `Last-Minute Juneau Excursions | Helicopter, Whale, Glacier`
- `Juneau Weather Backup Plan | Helicopter and Whale Watching`

WTS:

- `{Decision} | Welcome to the Swamp`
- `{Tour Type} New Orleans | Hotel Pickup and Last-Minute Options`
- `Swamp Tour Today New Orleans | Welcome to the Swamp`
- `New Orleans Swamp Tour Without a Car | Welcome to the Swamp`

### Schema

Use:

- `FAQPage`.
- `BreadcrumbList`.
- `ItemList` for recommended options.
- `WebPage`.
- `CollectionPage` where appropriate.
- `Product`/`Offer` only when actual seller/provider relationship supports it.

Avoid:

- Product schema for fallback marketplace rows unless provider data supports it.
- Offer schema without current sourced price/availability.
- Organization/operator claims that are not true.

### Machine-readable surfaces

Maintain:

- `llms.txt`.
- `agent.json`.
- `sitemap.xml`.
- canonical URLs.
- route governance.
- decision/handoff params.

JFD improvements:

- Add machine-readable clarity that JFD is a Juneau helicopter/whale/glacier decision microsite.
- Include last-minute, weather, and short-port-call pages when they exist.
- Preserve DCC/WTA relationship and direct/operator/fallback distinctions.

WTS improvements:

- Add exact-match last-minute and hotel-pickup pages to sitemap after launch.
- Expand `llms.txt` canonical sections to include last-minute, pickup, family, and no-car pages.
- Keep DCC relationship clear: WTS narrows; broad New Orleans planning belongs to WNO/DCC.

### Cannibalization controls

- JFD should not duplicate WTA broad Alaska shore excursion pages.
- WTA should link into JFD when the user needs an urgent Juneau helicopter/whale/glacier decision.
- WTS should not duplicate WNO broad New Orleans tours pages.
- WNO should link into WTS when the user needs an urgent swamp/airboat/pickup decision.
- After a decision is made, do not send users back into broad comparison loops.

## 11. Relationship to Broad Brands

Welcome to Alaska Tours -> JFD:

- Link into JFD for urgent Juneau helicopter decisions.
- Link into JFD for weather backup and short-port-call Juneau decisions.
- Use WTA for Alaska-wide planning, ports, and categories.

JFD -> Welcome to Alaska Tours:

- Link back only when the traveler needs broader Alaska planning.
- Do not route a ready-to-book Juneau user back into broad Alaska catalog browsing.

Welcome to New Orleans Tours -> WTS:

- Link into WTS for swamp-specific booking decisions.
- Link into WTS when hotel pickup, airboat vs boat, family fit, or today/tomorrow inventory is the main issue.

WTS -> Welcome to New Orleans Tours:

- Link back only when the user needs broader New Orleans tour planning.
- Do not route a ready-to-book swamp user back into ghost/food/cemetery catalog browsing.

Decision continuity rule:

- Once the microsite has a recommended lane, preserve it through handoff.
- Do not reset the user to a generic marketplace search unless no tighter path exists.

## 12. Implementation Phases

Phase 1: inventory + plan

- This document.
- Confirm route ownership and domain boundaries.
- Confirm supportable trust claims.

Phase 2: JFD homepage rewrite/scaffold

- Make `/` a more explicit last-minute Juneau decision hub.
- Keep date-first helicopter availability.
- Add whale/Mendenhall fallback cards.

Phase 3: WTS homepage rewrite/scaffold

- Keep today/tomorrow availability.
- Add pickup-first and covered/small-boat alternative cards.
- Make provider/fallback disclosure more prominent.

Phase 4: JFD last-minute pages

- Add or strengthen:
  - `/juneau-helicopter-tours-from-cruise-port`
  - `/last-minute-juneau-excursions`
  - `/juneau-weather-backup`
  - `/short-port-call-juneau`

Phase 5: WTS last-minute pages

- Add or strengthen:
  - `/new-orleans-swamp-tour-hotel-pickup`
  - `/swamp-tour-today-new-orleans`
  - `/last-minute-swamp-tour-new-orleans`
  - `/new-orleans-swamp-tour-without-car`

Phase 6: provider handoff/fallback tracking

- Preserve source, date, recommendation, and fallback reason.
- Track marketplace fallback separately from partner/direct handoff.
- Do not change payment/order code.

Phase 7: SEO/schema/machine-readable audit

- Update sitemap.
- Update `agent.json`.
- Update `llms.txt`.
- Validate schema.
- Check canonical/cannibalization boundaries against WTA/WNO parent brands.

## 13. Recommended First Code Patches

### JFD first patch

Patch:

- `/juneau-helicopter-tours-from-cruise-port`

Why:

- Directly targets cruise passengers.
- Aligns with existing JFD resolver rule for cruise-port handoffs.
- Reinforces date-first helicopter availability without becoming an Alaska catalog.
- Can link to weather backup, whale fallback, and short-port-call guidance.

Smallest safe scope:

- Static page or existing SEO entry page upgrade.
- Verdict hero.
- Cruise-port timing module.
- Helicopter primary card.
- Whale/Mendenhall fallback cards.
- Provider/fallback disclosure.
- FAQ schema.
- No checkout/payment/order changes.

### WTS first patch

Patch:

- `/new-orleans-swamp-tour-hotel-pickup`

Why:

- Directly targets no-car visitors and French Quarter hotel travelers.
- Aligns with existing WTS pickup resolver rule and warm-transfer context.
- High commercial intent.
- Does not require broad New Orleans catalog work.

Smallest safe scope:

- Static page or existing WTS entry-page pattern.
- Verdict hero.
- Pickup-zone and no-car logic.
- Hotel-pickup primary card.
- Airboat/covered boat alternatives.
- Provider pickup/cancellation disclosure.
- FAQ schema.
- No checkout/payment/order changes.

## 14. Current Biggest SEO Gaps

JFD gaps:

- Exact-match cruise-port helicopter page needs stronger microsite treatment.
- Last-minute Juneau excursions route is not clearly present.
- Weather-backup page exists in DCC/JFD forms but should be a microsite conversion path.
- Short-port-call page is not clearly present.
- JFD needs clearer relationship to WTA so it does not become broad Alaska.

WTS gaps:

- Exact-match hotel-pickup route is not clearly present.
- Same-day and last-minute exact-match pages are not clearly present as standalone routes.
- No-car visitor page is not clearly present.
- Existing homepage is airboat-heavy; pickup-first and covered/small-boat alternatives should be surfaced earlier.
- WTS needs clearer relationship to WNO so it does not become broad New Orleans.

## 15. No-Touch Boundaries

- No PARR.
- No checkout/payment/order logic.
- No Feastly lifecycle work.
- No WTS parked route-context repair unless separately scoped.
- No fake guarantee claims.
- No treating Viator/GetYourGuide fallback as owned execution.
- No unsupported return-to-ship, pickup, best-price, local ownership, or exclusive-access claims.
- No broad WTA/WNO catalog work inside JFD/WTS microsite patches.
