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
   - Raw GTFS `calendar_dates.txt` exceptions:
     - Thanksgiving (`2026-11-26`), Christmas (`2026-12-25`), and New Year’s Day (`2027-01-01`): removes `WK`; adds `SU`
   - Reconciled with Bustang’s published **Westbound – Holidays** schedule (`https://ridebustang.com/routes/west-line/`, *"Holiday service runs on Memorial Day, July 4th, Thanksgiving, and Christmas"*):
     - Operates 10 of 15 Sunday departures from Union Station Gate B19 (`06:00`, `07:00`, `08:45`, `09:30`, `11:00`, `12:30`, `13:15`, `14:00`, `16:30`, `17:15`) and excludes the 5 runs marked `—` on holidays (`08:00`, `10:15`, `11:45`, `14:45`, `15:30`).

3. **CDOT Bustang Pegasus Shuttle Van (`route_id="PEGA"`, `stop_id="34385"` → `stop_id="35174"`)**
   - Source archive: `https://www.rtd-denver.com/files/gtfs/bustang-co-us.zip`
   - Current `feed_version`: `Sep26-37355-20-21-20261105-153942`
   - Current validity window: `2026-09-27` through `2027-01-02`
   - Raw GTFS `calendar_dates.txt` exceptions:
     - Thanksgiving (`2026-11-26`): removes `WK`; adds `SU`
     - Christmas (`2026-12-25`): removes `P_Fri`, `WK`; adds `SU`
     - New Year’s Day (`2027-01-01`): removes `P_Fri`, `WK`; adds `SU`
   - Reconciled with Bustang’s published Pegasus holiday policy (`https://ridebustang.com/routes/denver-avon/`, *"Service does not run on Thanksgiving or Christmas"*):
     - Suppresses all Pegasus trips (`trips = []`, `activeRouteServiceIds = []`) on Thanksgiving and Christmas, while preserving the GTFS Sunday (`SU`) schedule on New Year’s Day (`2027-01-01`).

---

## Separation of Generated GTFS Data vs. Sourced Holiday Overrides

- **Generated GTFS data (`lib/dcc/transit/denverVailGtfsScheduleData.ts`)**: Overwritten whenever `node scripts/dcc/refresh-denver-vail-gtfs-schedule.mjs` is run. Never hand-edit this file.
- **Sourced holiday overrides (`lib/dcc/transit/denverVailSourcedHolidayOverrides.ts`)**: Kept in a separate version-controlled module so Bustang’s published holiday policies (West Line 10-run Holiday timetable on Memorial Day, July 4th, Thanksgiving, and Christmas; Pegasus no-service policy on Thanksgiving and Christmas) survive automated GTFS refreshes without manual re-patching.

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
   - Overwrites `lib/dcc/transit/denverVailGtfsScheduleData.ts` while leaving `lib/dcc/transit/denverVailSourcedHolidayOverrides.ts` untouched.

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
