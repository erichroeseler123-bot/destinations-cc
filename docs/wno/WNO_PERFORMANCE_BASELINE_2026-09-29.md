# Welcome to New Orleans Tours (WNO) Performance Baseline & Improvement Record

**Record Date:** September 29, 2026  
**Deployment Date:** September 29, 2026  
**Application:** Welcome to New Orleans Tours (`apps/welcometoneworleanstours`)  
**GA4 Measurement ID:** `G-S6JEJVWVDT`  
**Production Host:** `https://www.welcometoneworleanstours.com`  

---

## 1. Search Console Baseline Metrics (28-Day Period Ending 2026-09-29)

The following baseline metrics from Google Search Console and the separate AI Discovery Report establish the official performance foundation prior to the deployment of the GoSno/WTA reality-first conversion improvements:

| Metric | Baseline Value | Notes |
| :--- | :--- | :--- |
| **Total Clicks** | **8** | 28-day organic web search clicks |
| **Total Impressions** | **~1,560** | 28-day organic web search impressions |
| **Click-Through Rate (CTR)** | **0.5%** | Average web CTR across all queries |
| **Average Search Position** | **49.3** | Deep search index visibility |
| **Google AI Overviews / AI Report** | **36 impressions** | Citations and appearances in AI-synthesized search results |

---

## 2. Priority URLs & Implemented Improvements

### Priority 1: `/compare/whitney-vs-oak-alley`
- **Search Intent:** Preserved the comparison search intent (slavery education museum vs. historic Greek Revival estate with 300-year-old oak allee).
- **Verified Pricing:** Corrected pricing to exact flat rates: **$89.00 flat rate per adult** for both Whitney Plantation and Oak Alley Plantation (includes round-trip motorcoach transportation from 400 Toulouse St + museum/grounds admission).
- **Transportation Truth:** Made departure point unmistakable: departs from **400 Toulouse St (French Quarter riverfront at Steamboat NATCHEZ dock)**; not hotel pickup.
- **Cancellation Policy:** Documented operator policy: **Full refund with 24 hours notice prior to departure**.
- **Heading Fix:** Dynamic table header displays `Key Comparison: Whitney Plantation vs Oak Alley Plantation`.

### Priority 2: `/compare/natchez-vs-city-of-new-orleans-riverboat`
- **Bug Fix:** Removed the unrelated hardcoded heading `"Top Comparison: Whitney vs Oak Alley"`; dynamic heading now correctly renders `Key Comparison: Steamboat NATCHEZ vs Riverboat CITY of NEW ORLEANS`.
- **Pricing & Vessel Reconciliation:**
  - **Steamboat NATCHEZ:** Reconciled to the **$44.00 flat rate per adult** Daytime Jazz Cruise (2-hour cruise, live Duke Heitger Steamboat Stompers Jazz trio, calliope concert). Optional Creole lunch buffet available. Also noted the $58 Evening Jazz Cruise and $105 dinner cruise.
  - **Riverboat CITY of NEW ORLEANS:** Reconciled to the **$26.00 flat rate per adult** ($25.75 exact; child $12.75) daily 75-minute sightseeing cruise (live Captain's narration, modern 4-deck vessel with elevator accessibility).
- **Cancellation Truth:** Removed misleading "Free 24h Cancel" trust badges; steamboat company tickets are strictly non-refundable per FareHarbor operator contract. Cruises sail rain or shine; dockside held if Coast Guard halts navigation.

### Priority 3: `/swamp-tours` and `/guides/best-swamp-tour-with-transportation`
- **Vessel Differences:** Clear operational separation between shaded, family-friendly covered pontoon boats (all ages, pregnant guests, infants) and high-speed open-air airboats (5+ age rule, hearing protection required).
- **Pricing:**
  - Covered Swamp Boat: **$35.00 flat rate self-drive** / **$60.00 flat rate with round-trip hotel shuttle** ($25 child self-drive / $50 child shuttle).
  - High-Speed Airboat: **$60.00 flat rate self-drive** / **$85–$95 with shuttle** ($119 small airboat with coach).
- **Transportation Truth:** Explicitly distinguished Gray Line central French Quarter coach (400 Toulouse St) from Ragin Cajun hotel pickup and self-drive docks (Luling / Barataria).
- **Rideshare Return Warning:** Prominently warned travelers never to take Uber/Lyft to rural bayous on self-drive tickets because return rideshares do not service the swamp areas.

### Priority 4: Plantation Combinations
- **Routes:** `/new-orleans-plantation-and-swamp-tour`, `/guides/new-orleans-plantation-and-swamp-tour`, `/guides/oak-alley-vs-whitney-plantation-vs-swamp-tour`.
- **Pricing:** Coordinated full-day packages verified at **$130.00–$131.00 flat rate per adult**, including morning swamp boat cruise, lunch transit, and afternoon plantation tour.

### Priority 5: `/garden-district-tours`
- **Inventory Truth:** WNO does not sell a walking tour of the Garden District.
- **Bookable Products:** Clearly labeled as vehicle-based city tours that feature the Garden District:
  - Gray Line City, Cemetery & Garden District Tour: **$55.00 flat rate per adult** (3 hours, climate-controlled motorcoach, departs 400 Toulouse St, includes guided stroll through St. Louis Cemetery No. 3).
  - Southern Style City Tour: **$50.00 flat rate per person** (3 hours, minibus with hotel pickup).
- **Explicit CTAs:** Replaced generic "See Garden District tours" with **"See City Coach Tours (Featuring Garden District)"**.

---

## 3. Customer-Facing Terminology & Pricing Standard

1. **Jargon Removal:**
   - Removed all occurrences of `"Governed Experience Graph"` and internal data-model jargon.
   - Replaced with traveler-friendly terms: `"Verified operator details"`, `"verified tour records"`, and `"verified tour details"`.
2. **Pricing Transparency:**
   - Removed unnecessary `"From"` wording across fixed-rate products.
   - Labeled bundled fares as `"Flat rate: $XX"` with specific passenger unit (`adult`, `child`, `person`).
   - Labeled whether hotel pickup is included or if guests meet at a central departure point (400 Toulouse St).

---

## 4. Technical & Infrastructure Verification

1. **Apex-to-www Permanent 308 Redirect:**
   - `welcometoneworleanstours.com` permanently redirects with HTTP 308 to `https://www.welcometoneworleanstours.com/:path*`.
   - Implemented across Next.js config (`next.config.mjs`), Vercel edge configuration (`vercel.json`), standalone WNO proxy (`apps/welcometoneworleanstours/proxy.ts`), and root proxy (`proxy.ts`).
2. **Analytics & Handoff Tracking:**
   - GA4 Measurement ID: `G-S6JEJVWVDT`.
   - Outbound clicks to FareHarbor track `fareharbor_checkout_opened`, `fareharbor_cta_clicked`, and `booking_opened`.
   - Crucially, outbound clicks **never** emit `purchase` events (avoiding false conversion attribution).
3. **Machine Feeds:**
   - Validated against Stage 2 contract via `scripts/test-wno-stage2-feeds.ts` (all 6 machine endpoints passing).
