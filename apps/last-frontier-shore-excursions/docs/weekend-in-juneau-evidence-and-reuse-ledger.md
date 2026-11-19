# Weekend in Juneau (`/guides/weekend-in-juneau`) — Bounded Reuse Audit & Primary-Source Ledger

**Owner Surface:** Last Frontier Shore Excursions (`LFSE`, `https://www.lastfrontiershoreexcursions.com/guides/weekend-in-juneau`)  
**Release State:** Preview Only (`WEEKEND_IN_JUNEAU_RELEASE_READY = false`)  
**Primary-Source Verification Date:** `2026-11-19` (America/Denver)

---

## 1. Bounded Reuse Audit Findings

Before creating `/guides/weekend-in-juneau`, we audited `destinations-cc`, all active worktrees, GitHub repositories under `erichroeseler123-bot`, and all Vercel projects under `team_A35bPkpQ920idHaAvOwWpsSX`:

1. **DCC `"Share This Weekend: Juneau"` (`app/components/dcc/share/ShareWeekendCard.tsx`, mounted in `app/ports/[slug]/PortPageShared.tsx`):**
   - **What it actually is:** A client-side `1080×1920` social story-card PNG generator backed by `/api/internal/next48?entityType=port&slug=juneau`, rendering a 3-bullet `"Port Intelligence Snapshot"` (`now` / `tonight` / `tomorrow`).
   - **Disposition:** Not a multi-day fly-in destination stay guide, base-neighborhood comparison, or printable itinerary. Left untouched on DCC; zero route overlap with LFSE.
2. **Legacy Vercel project `alaska-os` (`erichroeseler123-bots-projects/alaska-os`):**
   - **What it actually is:** An inactive Vercel project record last updated `336` days ago with **zero active deployments** (`No deployments found under erichroeseler123-bots-projects`, Latest Production URL: `--`) and zero code in `destinations-cc`.
   - **Disposition:** Confirmed inactive shell; no duplicate route or live destination-stay product exists.
3. **Reusable Network Capabilities Adopted:**
   - **LFSE (`lastfrontiershoreexcursions.com`):** Owns the destination-stay guide at `/guides/weekend-in-juneau`, reusing LFSE’s verified Juneau port/category/operator pages (`/ports/juneau`, `/operators/*`, `/tours/*`), `buildDccHandoffAffiliateUrl` (`Viator` `P00281144`, `mcid=42383`), `resolveSoutheastAlaskaTourDirectRezgoHref` (`Juneau Tours & Whale Watch` Rezgo `#31703`, `#32329`, `#344494`, `refid=dccjuneau10` via `/go/out`), vetted public-domain/CC Commons photography (`public/images/SOURCES.md`), and `/api/telemetry`.
   - **JFD (`juneauflightdeck.com`):** Supplies deeper aviation comparisons (`/temsco-vs-coastal-vs-northstar-juneau`), VFR ceiling & FAA WeatherCam guidance (`/juneau-glacier-flight-weather`), weight-balance rules (`/juneau-helicopter-tour-weight-limits-and-seating`), and canceled-flight backups (`/juneau/what-to-do-if-helicopter-tour-canceled`). **Strictly zero public links** point to JFD’s Preview-only `/guides/uncruise-juneau-helicopter-tours` route.
   - **DCC (`destinationcommandcenter.com`):** Supplies shared Southeast Alaska operator/place snapshots (`lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours.ts`) and `/go/commerce/handoff` + `/go/out` redirectors (`&qa=1` appended on non-production builds).

---

## 2. Primary-Source Ledger (`Operator + Product + Booking Channel + Applicable Date`)

| Claim ID | Operator / Entity | Product / Scope | Booking / Reference Channel | Applicable Date | Verified Facts & Practical Restrictions | Official Source URL |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `JNU-STAY-01` | Silverbow Inn Hotel & Suites | Downtown Juneau boutique hotel (`120 Second St.`) | Official hotel website (non-affiliate) | `2026-11-19` | Walkable downtown base; includes breakfast, 24/7 snack bar, roof-deck hot tub, fire pits, and ground-floor *In Bocca al Lupo*. No hotel airport shuttle (`~8.5–9 mi` taxi/rideshare from `JNU`). | `https://silverbowinn.com/` |
| `JNU-STAY-02` | The Historic Alaskan Hotel & Bar | Historic 1913 downtown hotel (`167 S. Franklin St.`) | Official hotel website (non-affiliate) | `2026-11-19` | `21+` adult-only establishment attached to an active live-music bar; historic hillside walk-up has **no elevator** (`2+` flights of stairs from lobby), no AC, compact rooms, and half of rooms use code-locked shared hall bathrooms. | `https://www.thealaskanhotel.com/` |
| `JNU-STAY-03` | Frontier Suites Hotel in Juneau | Valley / Airport all-kitchen hotel (`9400 Glacier Hwy`) | Official hotel website (non-affiliate) | `2026-11-19` | Non-smoking rooms/suites all include **full kitchens**, on-site laundry, fitness center, and complimentary `JNU` Airport & AMHS Ferry Terminal shuttle (`4:00 a.m.–11:00 p.m.` summer / `4:30 a.m.–10:30 p.m.` winter; call `907-790-6600`). Does not run complimentary evening shuttles to downtown (`~8.5–9 mi`). | `https://frontiersuites.com/` |
| `JNU-TRANS-01` | Capital Transit (CBJ) | Public bus fares & Mendenhall/Airport routes | Exact cash on board or Token Transit app | `2026-11-19` | One-way fare: `$2.00` General (`19+`), `$1.00` Youth (`6–18`), Free (`5 & under`). Routes `3` & `4` stop at Dredge Lake Rd / Glacier Spur Rd—requiring a **`1.5-mile` (`~30-min`) walk each way** (`3 mi` roundtrip) to Mendenhall Visitor Center. | `https://juneaucapitaltransit.org/fares/` |
| `JNU-DINE-01` | Salt | Downtown dinner (`200 Seward St.`) | Direct phone `(907) 500-5000` / walk-in | `2026-11-19` | Dinner daily `5:00 p.m.–9:00 p.m.` (breakfast daily from `6:00 a.m.`); third-party reservation platforms are not used. | `https://www.saltalaska.com/` |
| `JNU-DINE-02` | In Bocca al Lupo | Downtown dinner (`120 Second St.`) | Direct restaurant website / walk-in | `2026-11-19` | Handmade pasta, wood-fired pizza & Alaska seafood specials; dinner `Mon–Sat 5:00 p.m.–9:00 p.m.`, **closed Sundays**. | `https://www.inboccaallupoak.com/` |
| `JNU-DINE-03` | The Hangar on the Wharf | Merchants Wharf dining (`2 Marine Way`) | Direct phone `+1 907-586-5018` / walk-in | `2026-11-19` | Historic `1932` floatplane hangar on Gastineau Channel; `Sun–Thu 11:00 a.m.–9:00 p.m.`, `Fri–Sat 11:00 a.m.–9:30 p.m.` | `https://www.hangaronthewharf.com/` |
| `JNU-DINE-04` | Devil’s Club Brewing & Deckhand Dave’s | Downtown taproom (`100 N. Franklin`) & seasonal fish tacos (`139 S. Franklin`) | Walk-in | `2026-11-19` | Devil’s Club open `Mon–Sat 11:00 a.m.–9:00 p.m.`, `Sun 11:00 a.m.–8:00 p.m.`; Deckhand Dave’s seasonal outdoor court (confirm spring–fall opening dates). | `https://www.devilsclubbrewing.com/` & `https://www.deckhanddaves.com/` |
| `JNU-WHALE-01` | Juneau Tours & Whale Watch | Auke Bay Whale Watch (`#31703`), Combo (`#32329`), Mendenhall Shuttle (`#344494`) | Authorized Rezgo Direct (`/go/out`, `refid=dccjuneau10`) | `2026-11-19` | Direct website lists Mendenhall Shuttle from `$65` (`3h`, Apr–Sep) and Whale + Mendenhall Combo from `$199`. Operates in rain and low cloud ceilings. | `https://www.juneautours.com/` |
| `JNU-WHALE-02` | Harv & Marv’s Outback Alaska / Alaska Galore Tours | Small-boat Statter Harbor whale watching (`6` to `20` guests) | Viator Partner (`#331813P1`, `P00281144`) & Harv & Marv’s Direct (`$0` commission) | `2026-11-19` | Harv & Marv’s direct lists `Marv's Signature` (`18` guests, `4h`, from `$179`) & `Harv's Original` (`6` guests, `4h`, from `$210`); Viator `#331813P1` (`Alaska Galore Tours`, `3.5h`, max `20` guests). | `https://www.harvandmarvs-juneau-whale-watching.com/` |
| `JNU-AIR-01` | TEMSCO · NorthStar · Coastal | Juneau Icefield helicopter landings & crampon treks | Viator Partner (`#6251SHOREXICEWALK`) & JFD Direct Operator Handoffs | `2026-11-18` / `2026-11-19` | Direct base tariffs (+ CBJ tax/fees): TEMSCO Walk `$449` (`2h 15m`, `+$150` at `250+ lbs`), Coastal Walk `$459` Standard (`~2h 35m`, no lap children; also sold on Viator `#6251SHOREXICEWALK`), NorthStar Walkabout `$539` (`3h 15m`, `8+`) & Trek `$599` (`4h 15m`, `12+`, `+$250` at `250+ lbs`). No bags on aircraft; `100%` operator weather refund. | `https://temscoair.com/`, `https://northstartrekking.com/`, `https://coastalhelicopters.com/` |
| `JNU-AIR-02` | Wings Airways & Taku Glacier Lodge | 5-Glacier Seaplane & Taku Lodge Salmon Feast (`2 Marine Way`) | Viator Partner (`#110048P1`, `P00281144`) & Wings Direct (`$0` commission) | `2026-11-19` | Departs downtown `2 Marine Way` (walkable from downtown hotels); window seat for every guest; direct site lists `3h` Taku Lodge Feast `$465–$510` & `40m` 5-Glacier flight `$325–$370`. | `https://wingsairways.com/` |
| `JNU-KAYAK-01` | Above & Beyond Alaska | Channel Islands Whale Kayak (`6h`) & Mendenhall Canoe + Hike (`5.5h`) | Direct operator website (`beyondak.com`, `$0` commission) | `2026-11-19` | Locally employee-owned since `2002`: `Paddle with Whales` (`6h`, easy–moderate, from `$449 + tax`) & `Mendenhall Canoe Paddle & Hike` (`5.5h`, moderate, from `$349 + tax`). | `https://beyondak.com/` |
| `JNU-CULT-01` | USFS · Alaska State Museum · Sealaska Heritage · Goldbelt Tram | Trails, museums & Mount Roberts tramway status | Public agencies & direct venues | `2026-11-19` | USFS `$5` summer Mendenhall Visitor Center/Photo Point pass (`May 1–Sep 30`, `16+`) or America the Beautiful pass; Alaska State Museum (`395 Whittier St.`, `$14` summer / `$9` winter, `18 & under` free); Sealaska Heritage (`105 S. Seward St.`); Goldbelt upper tram (`490 S. Franklin St.`) **temporarily closed for assessment as of `2026-11-19`** while Lower Terminal coffee/carving center remained open. | `https://museums.alaska.gov/asm/asmhome.html`, `https://sealaskaheritage.org/`, `https://www.goldbelttram.com/` |

---

## 3. Separate Telemetry Contract (`/api/telemetry`)

1. **`lfse_guide_engagement`** — Itinerary duration switch (`2_full_days` vs. `3_full_days`), home-base toggle (`downtown` vs. `valley_airport`), prep-checklist toggle, or non-commercial official reference click.
2. **`lfse_printable_plan_used`** — `Print / Save PDF Plan` (`window.print()`) or compact printable trip-sheet preview toggled.
3. **`lfse_jfd_guide_handoff`** — Contextual aviation-guide click from LFSE to `juneauflightdeck.com`.
4. **`lfse_seller_handoff_click`** — Outbound availability click to Rezgo (`/go/out`), Viator (`/go/commerce/handoff`), or direct operator site (`bookingConfirmed: false` — never treated as a confirmed booking or earned commission). Preview/QA events carry `qa: true` and are isolated from Production DCC engagement ingestion.
