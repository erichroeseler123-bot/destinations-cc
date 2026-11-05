# GoSno DEN ↔ Winter Park Verification Report (Corrected Attribution & QA Classification)

**Date:** 2026-11-05  
**Status:** Corrected — Simulated Test Results Explicitly Distinguished from Real Business Totals

---

## 1. Executive Correction

An earlier verification summary for the **DEN ↔ Winter Park** DCC → GoSno handoff and reconciliation workflow presented funnel figures (`3`/`4` visitors, `3` followed handoffs, `2`/`3` confirmed bookings, and `$1,347.00`/`$1,696.00` gross revenue) under a `Production (isTest: false)` column without clarifying that those figures came from **automated synthetic test fixtures** (`tests/dcc/90-applicability-engine-and-opaque-attribution.test.ts` Test 11: `vis-prod-1`..`3`, `GOSNO-WP-OUT-1001`, `GOSNO-WP-RT-1002`, and Test 3/4: `GOSNO-E2E-99001`).

Furthermore, because local test suites previously executed while `.env.local` (`DATABASE_URL`) was active without a test-runtime guard in `shouldSyncToPostgres()`, **144 synthetic QA click records** (including `clk_63e61f872ed44985aae9f3d0` / `GOSNO-E2E-99001`) were replicated into Neon Postgres (`dcc_opaque_click_attributions` and `dcc_durable_transactional_ledger`).

### Corrected Business & Verification Totals (As of 2026-11-05)

| Metric Category | Observed Customer Production Totals (`trafficClass: "production"`) | Simulated / QA Verification Totals (`trafficClass: "test"`) | Notes & Provenance |
| :--- | :--- | :--- | :--- |
| **New Visitors** | **0** | **5** (in Test 11 unit test) | Synthetic visitor IDs (`vis-prod-1`..`3`, `vis-test-1`..`2`) are automated test fixtures, not real travelers. |
| **Qualified Outbound Handoffs** | **0** | **144** (persisted QA rows reclassified to `test`) | All 144 historical QA/test click records in Neon Postgres have been reclassified to `isTest: true`, `trafficClass: "test"`. |
| **Confirmed Customer Bookings** | **0** | **3** (`GOSNO-WP-OUT-1001`, `GOSNO-WP-RT-1002`, `GOSNO-E2E-99001` in tests) | Zero real customer reservations have been confirmed via GoSno webhook or CSV settlement yet. |
| **Gross Confirmed Revenue** | **\$0.00** | **\$1,696.00** (Test 11) / **\$749.00** (`GOSNO-E2E-99001`) | Simulated webhook payloads only. Excluded from production business totals. |
| **Reconciled Paid Commission** | **\$0.00** | **\$112.35** (`GOSNO-E2E-99001` simulated fixture) | No real commission payouts have been settled. |

---

## 2. Structural Safeguards Implemented

1. **Shared GoSno Handoff Builder (`lib/dcc/applicability/gosnoHandoffBuilder.ts`):**
   - Both `POST /api/v1/applicability/evaluate` and the legacy `GET /go/dcc-to-gosno` redirect now construct GoSno handoffs through `buildSharedGoSnoHandoffUrlAndDetails` and `issueSharedGoSnoHandoffAttribution`.
   - `/go/dcc-to-gosno` now constructs the complete target URL and `tripDetails` (`direction`, `tripType`, `origin`, `destination`, `routeId`, `offerId`, `travelDate`, `pickupTime`, `passengerCount`, `standardBagCount`, `skiOrOversizeBagCount`, `returnDate`, `returnPickupTime`, `returnRouteId`, `originatingPage`) **before** minting the opaque `click_id` and running `sanitizeOutboundPartnerUrlWithOpaqueClickId`.
2. **Test-Runtime Postgres Isolation (`lib/dcc/storage/durableTransactionalStore.ts`):**
   - `shouldSyncToPostgres()` now detects automated test execution (`NODE_ENV === "test"`, `--test` in `process.execArgv`, or `.test.` in `process.argv`) and disables background/forced Neon Postgres replication during test runs unless `DCC_ENABLE_PG_SYNC_IN_TESTS=1` is explicitly set.
3. **Persisted QA Exclusion (`lib/dcc/commerce/opaqueAttributionLedger.ts`):**
   - `reconcilePartnerWebhookByClickId` and `getFunnelMetricsReport` automatically classify booking references containing `TEST-`, `SIM-`, `QA-`, `SANDBOX-`, or `E2E-` (including `GOSNO-E2E-99001`) and synthetic test receipt hashes into `isTest: true` / `trafficClass: "test"`, ensuring persisted QA records never inflate production business totals.
