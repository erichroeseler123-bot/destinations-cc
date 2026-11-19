# UnCruise Juneau Helicopter Guide — Append-Only Evidence & Channel Ledger

**Route:** `/guides/uncruise-juneau-helicopter-tours` (`https://juneauflightdeck.com/guides/uncruise-juneau-helicopter-tours`)  
**Release State:** Preview Only (`UNCRUISE_GUIDE_HUMAN_ATTESTATION_CLEARED = false`)  
**Last Primary-Source Retrieval:** `2026-11-19` (America/Denver)

---

## 1. Chronological Evidence History (Append-Only)

Earlier audit files in `dcc-package-v14/dcc-research/` (`2026-10-21`) and `apps/juneauflightdeck/lib/verifiedOperatorPricing.ts` (`2026-11-18`) are preserved untouched in the repository. Corrections and fresh primary-source checks are appended below without overwriting historical records:

1. **`2026-10-21` — Historical Research Baseline (`dcc-package-v14/dcc-research/juneau-coastal-inventory.json`, `juneau-site-claim-audit.json`, `coastal-candidate-import.json`)**
   - Flagged Coastal Helicopters Icefield Excursion glacier-minute wording discrepancy (`30–35 min` vs. `35–40 min` on `coastalhelicopters.com/tours/icefield-excursion/`).
   - Recorded that FareHarbor item `413056` lacked active affiliate partner attribution (`asn=`) and that Viator `6251SHOREXICEWALK` pickup/cancellation fields were only partially observed and lacked human editorial attestation.
   - Identified legacy `/go/juneau/helicopter-tours` as a broken `404` route on Juneau Flight Deck (`JFD`).

2. **`2026-11-18` — Verified Operator Direct Tariff Baseline (`apps/juneauflightdeck/lib/verifiedOperatorPricing.ts`)**
   - Verified direct primary-source base tariffs and clothed weight-balance thresholds across TEMSCO Helicopters (`$449` Mendenhall Walk; `$759` seasonal Dog Sled; `+$150` at `250+ lbs` clothed), Coastal Helicopters (`$459` Standard `1–259 lbs`, `$609` Standard Plus `260–299 lbs`, `$918` Premium `300+ lbs` on Icefield Walk), and NorthStar Trekking (`$539` Walkabout `3.25h`, `$599` Glacier Trek `4.25h`, `$789` seasonal Dog Sled; `+$250` at `250+ lbs` clothed), all excluding CBJ sales tax and fees.

3. **`2026-11-19` — UnCruise & Operator Channel Primary-Source Retrieval (`lib/uncruiseJuneauGuideData.ts`)**
   - Automated primary-source HTTP retrievals executed on `2026-11-19` against UnCruise Adventures' official public terms and Alaska preparation guide, plus TEMSCO, NorthStar, and Coastal public product/FAQ pages.
   - **Publication Rule Retained:** Automated primary-source retrieval is recorded as `automated_primary_source_checked` and is **never** described as human verification. `UNCRUISE_GUIDE_HUMAN_ATTESTATION_CLEARED` remains `false` until human editorial attestation clears the held channel items below.

---

## 2. Claim-to-Source Matrix (`2026-11-19`)

| Claim ID | Subject | Applicable Channel | Verified Claim Summary | Primary Source URL | Retrieval Date | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `UC-FARE-01` | UnCruise Adventures | UnCruise Cruise Fare | Includes embarkation/disembarkation day group transfers & baggage handling between `JNU`, `76 Egan Drive`, and the vessel; from-the-vessel guided activities/gear (kayaks, paddleboards, inflatable skiffs, hikes); Glacier Bay / Tongass permits; onboard meals and standard bar beverages. Explicitly excludes *"Optional pre or post cruise excursions and land tours"* and provides no refund for voluntarily omitted transfers. | `https://uncruise.com/pages/terms-conditions` | `2026-11-19` | `automated_primary_source_checked` (human sign-off pending) |
| `UC-JNU-02` | UnCruise Adventures | UnCruise Juneau Turnaround (`76 Egan Drive`) | Check-in, embarkation, and disembarkation at `76 Egan Drive` (Downtown Juneau, hours `9:00 a.m.–4:30 p.m.`). Embarkation day: arrive `JNU` by `4:00 p.m.` (`3:00 p.m.` *Safari Quest*); check luggage with UnCruise no later than `3:00 p.m.`; return to hospitality by `4:30 p.m.` (`3:00 p.m.` *Safari Quest*). Disembarkation day: schedule `JNU` return flights no earlier than `11:30 a.m.`; final e-documents sent ~45 days pre-sailing. | `https://uncruise.com/pages/prepare-for-your-cruise-alaska` | `2026-11-19` | `automated_primary_source_checked` (human sign-off pending) |
| `TEMSCO-DIR-01` | TEMSCO Helicopters | Direct Operator (`temscoair.com`) | Mendenhall Glacier & Guided Walk (`2h 15m` total; `$449` ages 2+, under 2 free lap child, `+$150` at `250+ lbs` clothed as of `2026-11-18`). Selected start time is prompt downtown departure (arrive `15 min` early). Pickup at bottom of Goldbelt/Mount Roberts Tram (`490 S. Franklin St.`) and *"select few hotels."* No bags/cases on aircraft (base lockers for small personal items only). Direct cancel `48h+` for `100%` refund; `100%` operator weather refund (decisions usually within `1 hr` of departure). | `https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/` | `2026-11-19` | `automated_primary_source_checked` (`HELD-TEMSCO-HOTEL-LIST` held) |
| `NORTHSTAR-DIR-01` | NorthStar Trekking | Direct Operator (`northstartrekking.com`) | Glacier Trek (`4h 15m`, ages 12+, `$599`) & Walkabout (`3h 15m`, ages 8+, `$539`) as of `2026-11-18` (`+$250` at `250+ lbs` clothed). Official FAQ confirms pickup/drop-off in most Juneau locations excluding Mendenhall Glacier Recreation Area (cruise-ship direct guests meet at Goldbelt Tramway). No bags/purses on aircraft (Airport Base lockers + provided hip pack). Direct cancel `>24h` receives refund minus `10%` fee (`<24h` non-refundable); operator weather cancel offers reschedule or `100%` refund. | `https://northstartrekking.com/faqs/` & `https://northstartrekking.com/adventures/helicopter-glacier-trek/` | `2026-11-19` | `automated_primary_source_checked` (`HELD-NORTHSTAR-PICKUP-CLOCK` held) |
| `COASTAL-VIA-01` | Coastal Helicopters via Viator | Viator Partner Listing (`6251SHOREXICEWALK`) | Operated by Coastal Helicopters (`8995 Yandukin Dr`, `~2h 35m` door-to-door, no lap children, clothed weight-balance tiers, `100%` operator weather refund), sold through Viator (`P00058396`, `mcid=42383`). Coastal Direct's `490 S. Franklin St.` pickup promise and `7-day` voluntary cancellation policy are **strictly withheld** from the Viator card until Viator `6251SHOREXICEWALK` is human-attested. | `https://coastalhelicopters.com/tours/icefield-excursion/` & `https://coastalhelicopters.com/faq/` | `2026-11-19` | `held_pending_channel_attestation` |

---

## 3. Specific Held Claims (Individual Card Holds)

| Hold ID | Card / Channel | Held Claim Scope | Reason Held | Required Traveler / Release Action |
| :--- | :--- | :--- | :--- | :--- |
| `HELD-TEMSCO-HOTEL-LIST` | TEMSCO Direct | Qualifying Juneau pickup hotel list & self-drive check-in timing | Public page states *"bottom of the Goldbelt/Mount Roberts Tram and select few hotels"* without naming the specific hotels online. | Traveler confirms hotel eligibility with TEMSCO Juneau (`907-789-9501`) or meets `15 min` early at `490 S. Franklin St.` with suitcases stored. |
| `HELD-NORTHSTAR-PICKUP-CLOCK` | NorthStar Direct | Exact hotel pickup lead-time offset & cruise-turnaround suitcase storage | Pickup covers most Juneau locations (excluding Mendenhall Glacier Recreation Area), but exact pickup minute offsets depend on hotel address and base lockers fit small items only. | Traveler verifies exact pickup time on NorthStar reservation (`907-790-4530`) and stores full suitcases at hotel or UnCruise `76 Egan Drive`. |
| `HELD-COASTAL-VIATOR-PICKUP` | Coastal via Viator (`6251SHOREXICEWALK`) | Viator meeting/pickup equivalence for hotel vs. downtown guests | October `2026-10-21` Viator capture was partial and not human-attested as identical to Coastal Direct's `490 S. Franklin St.` pickup rule. | Human check of live Viator `6251SHOREXICEWALK` pickup selector required before claiming specific pickup addresses on the Viator card. |
| `HELD-COASTAL-VIATOR-CANCELLATION` | Coastal via Viator (`6251SHOREXICEWALK`) | Viator voluntary customer cancellation cutoff | Coastal Direct enforces a `7-day` (`100%`) / `4–6-day` (`50%`) / `<3-day` (`0%`) policy, whereas Viator partner checkout governs Viator bookings. | Human attestation of live Viator `6251SHOREXICEWALK` checkout cancellation cutoff required; Coastal Direct cancellation rules are never displayed as Viator terms. |
| `HELD-COASTAL-GLACIER-MINUTES` | Coastal via Viator (`6251SHOREXICEWALK`) | Exact minutes on Herbert Glacier ice (`30–35 min` vs. `35–40 min`) | `coastalhelicopters.com/tours/icefield-excursion/` states `30–35 minutes` in intro prose and `35–40 minutes` in Quick Details. | Guide frames planning around the `~2h 35m` door-to-door footprint (`~60–65 min` combined flight + glacier landing) rather than a single ice-minute promise. |

---

## 4. Commerce Handoff & Attribution Separation

All three outbound CTAs route through `https://www.destinationcommandcenter.com/go/commerce/handoff` (`sourcePage=/guides/uncruise-juneau-helicopter-tours`, `&qa=1` appended whenever `VERCEL_ENV !== "production"` so Preview/synthetic verification is excluded from Production business metrics):

1. **TEMSCO Direct**: `provider=direct`, `account=temsco-juneau`, `product=temsco-mendenhall-glacier-walk`, `campaign=jfd-uncruise-guide-temsco-direct`, CTA `"Check availability with TEMSCO"` (`\$0` assumed affiliate commission; seller click recorded separately from bookings).
2. **NorthStar Direct**: `provider=direct`, `account=northstar-juneau`, `product=northstar-glacier-ice-trek`, `campaign=jfd-uncruise-guide-northstar-direct`, CTA `"Check availability with NorthStar"` (`\$0` assumed affiliate commission; seller click recorded separately from bookings).
3. **Coastal via Viator**: `provider=viator`, `account=P00058396`, `product=6251SHOREXICEWALK`, `campaign=jfd-uncruise-guide-coastal-viator`, CTA `"Check availability on Viator"` (preserves Viator `P00058396` and `mcid=42383`; distinguishes operator Coastal Helicopters from seller Viator).
