# Viator Partner API Full Access Production Audit & WTS Link Verification

**Date:** 2026-09-18  
**Environment:** Vercel Production (`dcc-v2-monolith`)  
**Access Tier:** Approved Full Access (`full_access`)  
**Assigned Partner Account ID:** `P00306962` (Master Campaign ID: `42383`)  
**Audit Scope:** Strictly Read-Only (Catalog, Product Details, Availability Schedules, Real-Time Availability Check, Product Reviews). No booking, payment, hold, cancellation, or amendment endpoints called.

---

## 1. Environment & Credential Security Posture

- **Credential Source:** Read dynamically from Vercel Production deployment environment (`process.env.VIATOR_API_KEY`).
- **Key Metadata:** `present=true`, `length=36` characters.
- **Exposure Prevention:** Never printed, echoed, logged, committed, or placed in client bundles.
- **Gitignore Confirmation:**
  - `.gitignore` lines 3, 4, 8, 9, 15 exclude `.env`, `.env.local`, `.env*`, `!.env.example`, and `.env*.local`.
  - `git status --ignored` verified that all local `.env` files are ignored by git.

---

## 2. Endpoint Verification & Audit Matrix

| Endpoint | Method | HTTP Status | Status Text | Result | Permitted Fields / Payload Highlights |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/destinations` | GET | `200` | OK | **PASS** | `totalDestinations`: 3,394 worldwide destinations. Fields: `destinationId`, `name`, `type`, `parentDestinationId`, `lookupId`, `destinationUrl`, `defaultCurrencyCode`, `timeZone`, `coordinates`. |
| `/products/3780AIRBOAT` | GET | `200` | OK | **PASS** | Title: *"Airboat Ride with Optional Transportation from New Orleans"*, Status: `ACTIVE`, Supplier: `Gray Line New Orleans`, Confirmation: `INSTANT_THEN_MANUAL`, Cancellation: `STANDARD` (free >24h), Images: 24, Reviews: 429 total (4.6★), Official `productUrl` provided. |
| `/products/3780SWAMP` | GET | `200` | OK | **PASS** | Title: *"New Orleans Swamp and Bayou Alligator Tour"*, Status: `ACTIVE`, Supplier: `Gray Line New Orleans`, Confirmation: `INSTANT_THEN_MANUAL`, Cancellation: `STANDARD` (free >24h), Images: 15, Reviews: 1,334 total (4.3★), Official `productUrl` provided. |
| `/products/6953SWAMPTRANS` | GET | `200` | OK | **PASS** | Title: *"New Orleans Swamp and Bayou Boat Tour with Transportation"*, Status: `ACTIVE`, Supplier: `Cajun Encounters Tour Co.`, Confirmation: `INSTANT`, Cancellation: `STANDARD` (free >24h), Images: 6, Reviews: 7,100 total (4.9★), Official `productUrl` provided. |
| `/availability/schedules/3780AIRBOAT` | GET | `200` | OK | **PASS** | 6 bookable options (`TG1`, etc.), operating seasons mapped through 2027-12-31, timed entries, unavailable dates / sold-out tracking. |
| `/availability/schedules/3780SWAMP` | GET | `200` | OK | **PASS** | Bookable options, operating seasons mapped through 2027-12-31, timed entries, unavailable dates / sold-out tracking. |
| `/availability/schedules/6953SWAMPTRANS` | GET | `200` | OK | **PASS** | Bookable options, operating seasons mapped through 2027-12-31, timed entries, unavailable dates / sold-out tracking. |
| `/availability/check?productCode=3780AIRBOAT` | POST | `200` | OK | **PASS** | Live check for 2026-10-15 (2 Adults): Option `TG1` at `08:30` is `available: true`, remaining capacity 25. Recommended Retail: $180.00, Partner Net: $165.60, Commission: $14.40. |
| `/availability/check?productCode=3780SWAMP` | POST | `200` | OK | **PASS** | Live check for 2026-10-15 (2 Adults): Option `10:45AM` at `08:30` is `available: true`, remaining capacity 39. Recommended Retail: $110.50, Partner Net: $101.66, Commission: $8.84. |
| `/availability/check?productCode=6953SWAMPTRANS` | POST | `200` | OK | **PASS** | Live check for 2026-10-15 (2 Adults): Option `SWAMPWTRANS0930` at `09:30` is `available: true`. Recommended Retail: $151.04, Partner Net: $138.96, Commission: $12.08. |
| `/reviews/product?productCode=3780AIRBOAT` | POST | `200` | OK | **PASS** | 429 total reviews (Viator: 259, TripAdvisor: 170). Ratings distribution: 5★ (336), 4★ (49), 3★ (22), 2★ (9), 1★ (13). Live verified reviews returned. |
| `/reviews/product?productCode=3780SWAMP` | POST | `200` | OK | **PASS** | 1,334 total reviews (Viator: 1,007, TripAdvisor: 327). Ratings distribution: 5★ (800), 4★ (276), 3★ (132), 2★ (65), 1★ (61). Live verified reviews returned. |
| `/reviews/product?productCode=6953SWAMPTRANS` | POST | `200` | OK | **PASS** | 7,100 total reviews (Viator: 1,071, TripAdvisor: 6,029). Ratings distribution: 5★ (6,710), 4★ (270), 3★ (58), 2★ (25), 1★ (37). Live verified reviews with multi-resolution TripAdvisor photos returned. |

---

## 3. Authorization Limitations & Policy Notes

1. **Review Endpoint Provider Requirement:**
   - The `/reviews/product` endpoint requires the `provider` property in the request payload (`"ALL"`, `"VIATOR"`, or `"TRIPADVISOR"`). Omitting it returns `400 Bad Request`. `lib/viator/client.ts` has been updated to pass `provider: "ALL"` by default.
   - Compliance notice: TripAdvisor review content is not indexed on public pages directly; only aggregated ratings/counts are displayed on public surfaces.
2. **Affiliate Attribution Account:**
   - The approved Full Access production credential is bound to Partner ID `P00306962` (mcid `42383`).
   - `DEFAULT_CONFIG.pid` and `DEFAULT_CONFIG.accessTier` have been updated to `"P00306962"` and `"full_access"` respectively.
3. **Affiliate Checkout Integrity:**
   - Direct booking and payment processing remain intentionally disabled and uncalled, preserving the affiliate checkout model where users complete transactions directly on Viator.

---

## 4. Welcome to the Swamp Link Repair

In `lib/liveProductLinks.ts`, the three product links have been repaired using API-confirmed titles, suppliers, and slug paths, while preserving all tracking and attribution tags:

### 1. Airboat Swamp Tour
- **Product Code:** `3780AIRBOAT`
- **Confirmed Title:** *Airboat Ride with Optional Transportation from New Orleans*
- **Supplier:** Gray Line New Orleans
- **Repaired URL:**
  ```text
  https://www.viator.com/tours/New-Orleans/Airboat-Ride-with-Round-Trip-Transport-from-New-Orleans/d675-3780AIRBOAT?pid=P00306962&mcid=42383&medium=link&campaign=wts-plan-airboat&utm_source=welcometotheswamp.com&utm_medium=affiliate&utm_campaign=wts-plan-airboat
  ```

### 2. Covered Boat Swamp Tour
- **Product Code:** `3780SWAMP`
- **Confirmed Title:** *New Orleans Swamp and Bayou Alligator Tour*
- **Supplier:** Gray Line New Orleans
- **Repaired URL:**
  ```text
  https://www.viator.com/tours/New-Orleans/Swamp-and-Bayou-Sightseeing-Tour-with-Boat-Ride-from-New-Orleans/d675-3780SWAMP?pid=P00306962&mcid=42383&medium=link&campaign=wts-plan-covered-boat&utm_source=welcometotheswamp.com&utm_medium=affiliate&utm_campaign=wts-plan-covered-boat
  ```

### 3. Swamp Tour With Pickup
- **Product Code:** `6953SWAMPTRANS`
- **Confirmed Title:** *New Orleans Swamp and Bayou Boat Tour with Transportation*
- **Supplier:** Cajun Encounters Tour Co.
- **Repaired URL:**
  ```text
  https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour-With-Transport/d675-6953SWAMPTRANS?pid=P00306962&mcid=42383&medium=link&campaign=wts-plan-pickup&utm_source=welcometotheswamp.com&utm_medium=affiliate&utm_campaign=wts-plan-pickup
  ```

---

## 5. Verification & Test Summary

- **TypeScript Validation:** `tsc --noEmit` passed with 0 errors across root and `apps/welcometotheswamp`.
- **Automated Tests:** 21/21 tests in `npm test` suite passed cleanly.
- **Application Build:** `apps/welcometotheswamp` built successfully (27 static/dynamic pages compiled).
