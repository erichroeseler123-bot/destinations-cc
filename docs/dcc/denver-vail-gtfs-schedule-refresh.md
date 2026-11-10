# DEN → Union Station → Vail GTFS Schedule Refresh Runbook

The **“Can I still catch the bus to Vail?”** checker on `/transportation/colorado/denver-to-vail-shuttle-guide` uses three separate GTFS route schedule bundles compiled into [`lib/dcc/transit/denverVailGtfsScheduleData.ts`](../../lib/dcc/transit/denverVailGtfsScheduleData.ts):

1. **RTD University of Colorado A Line (`route_id="A"`, `stop_id="34476"` → `stop_id="34667"`)**
   - Source archive: `https://www.rtd-denver.com/files/gtfs/RTD_Denver_Purchased_Transportation_Commuter_Rail_GTFS.zip`
   - Current `feed_version`: `Sep26-37040-4-3-20260922-172143`
   - Current validity window: `2026-09-27` through `2027-01-02`
   - Holiday exceptions (`calendar_dates.txt`):
     - Thanksgiving (`2026-11-26`): removes `MT`, `P_Fri`, `WK`; adds `SU`
     - Christmas (`2026-12-25`): removes `FR`, `P_Fri`, `WK`; adds `SU`
     - New Year’s Day (`2027-01-01`): removes `FR`, `P_Fri`, `WK`; adds `SU`

2. **CDOT Bustang West Line (`route_id="WEST"`, `stop_id="34316"` → `stop_id="35174"`)**
   - Source archive: `https://www.rtd-denver.com/files/gtfs/bustang-co-us.zip`
   - Current `feed_version`: `Sep26-37355-20-21-20261105-153942`
   - Current validity window: `2026-09-27` through `2027-01-02`
   - Holiday exceptions (`calendar_dates.txt`):
     - Thanksgiving (`2026-11-26`): removes `WK`; adds `SU`
     - Christmas (`2026-12-25`): removes `WK`; adds `SU`
     - New Year’s Day (`2027-01-01`): removes `WK`; adds `SU`

3. **CDOT Bustang Pegasus Shuttle Van (`route_id="PEGA"`, `stop_id="34385"` → `stop_id="35174"`)**
   - Source archive: `https://www.rtd-denver.com/files/gtfs/bustang-co-us.zip`
   - Current `feed_version`: `Sep26-37355-20-21-20261105-153942`
   - Current validity window: `2026-09-27` through `2027-01-02`
   - Holiday exceptions (`calendar_dates.txt`):
     - Thanksgiving (`2026-11-26`): removes `WK`; adds `SU`
     - Christmas (`2026-12-25`): removes `P_Fri`, `WK`; adds `SU`
     - New Year’s Day (`2027-01-01`): removes `P_Fri`, `WK`; adds `SU`

---

## When to Refresh

The current runboard expires on **January 2, 2027 (`2027-01-02`)**. Any date after `2027-01-02` (such as `2027-01-03`) automatically triggers the **`Schedule needs verification`** fallback state until the winter/spring 2027 runboard is ingested.

RTD typically publishes the January runboard 2–3 weeks before the cutover date (mid-December). Refresh the feed as soon as RTD posts the new `RTD_Denver_Purchased_Transportation_Commuter_Rail_GTFS.zip` and `bustang-co-us.zip` archives on `https://www.rtd-denver.com/open-records/open-spatial-information/gtfs`.

---

## How to Refresh the Schedule

1. **Run the automated GTFS refresh script** from the repository root:
   ```bash
   node scripts/dcc/refresh-denver-vail-gtfs-schedule.mjs
   ```
   This script:
   - Downloads `RTD_Denver_Purchased_Transportation_Commuter_Rail_GTFS.zip` and `bustang-co-us.zip` directly from RTD.
   - Extracts `feed_info.txt`, `calendar.txt`, `calendar_dates.txt`, `trips.txt`, and `stop_times.txt`.
   - Builds the three separate operator schedule bundles (`RTD_A_LINE_SCHEDULE_BUNDLE`, `BUSTANG_WEST_SCHEDULE_BUNDLE`, and `PEGASUS_SCHEDULE_BUNDLE`) with each operator's `calendar` and `calendarDates` holiday exceptions.
   - Overwrites `lib/dcc/transit/denverVailGtfsScheduleData.ts` with the updated `validStartDate`, `validEndDate`, `feedVersion`s, calendars, and trip tables.

   *(Optional)* If you have already downloaded and extracted the archives locally into `<dir>/rtd_pt_cr` and `<dir>/bustang`, pass `--from-dir`:
   ```bash
   node scripts/dcc/refresh-denver-vail-gtfs-schedule.mjs --from-dir <dir>
   ```

2. **Run the verification test suite and TypeScript check:**
   ```bash
   node --import tsx --test tests/dcc/denver-vail-bus-checker.test.ts
   npm run typecheck
   ```

3. **Verify the `feedStartDate` and `feedEndDate` in `lib/dcc/transit/denverVailGtfsScheduleData.ts`:**
   - Confirm that `DENVER_VAIL_GTFS_METADATA.validEndDate` extends past `2027-01-02` and that holiday exceptions (`calendarDates`) in all three bundles match the new runboard.
