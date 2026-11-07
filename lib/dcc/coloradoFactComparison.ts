/**
 * Colorado Mountain Corridor Fact-Based Option Comparison
 *
 * Enforces verified CDOT rules and compares DEN-to-Mountain options on the
 * 6 concrete facts a traveler can actually use:
 * 1. Pickup wait
 * 2. Rental collection
 * 3. Parking
 * 4. Vehicle and gear fit
 * 5. Confirmed pricing
 * 6. Availability
 *
 * Shared Road Rule:
 * Where two or more choices use the same road (I-70 through the Eisenhower-Johnson
 * Memorial Tunnel, Vail Pass, US-6, or CO-9), DCC applies the exact same verified
 * road conditions and highway transit windows to all options on that road.
 */

export interface CdotVerifiedCorridorFacts {
  ejmtMetering: {
    authority: "Colorado Department of Transportation (CDOT)";
    officialUrl: "https://www.codot.gov/travel/ejmt/metering";
    verifiedAt: string;
    ruleSummary: string;
    sharedRoadImplication: string;
  };
  passengerTractionLawPenalties: {
    statute: "C.R.S. § 42-4-106 (Code 15 Traction Law & Code 16 Passenger Chain Law)";
    authority: "Colorado Department of Transportation (CDOT)";
    officialUrl: "https://www.codot.gov/travel/winter-driving/tractionlaw";
    verifiedAt: string;
    activeWindow: "September 1 – May 31 on I-70 between Dotsero (MP 133) and Morrison (MP 259)";
    noncomplianceFineUsd: 100;
    noncomplianceSurchargeUsd: 33;
    noncomplianceTotalUsd: 133;
    laneClosureFineUsd: 500;
    laneClosureSurchargeUsd: 156;
    laneClosureTotalUsd: 656;
    penaltySummary: string;
  };
  sharedI70RoadConditionBaseline: {
    roadSegment: "I-70 West / East via Eisenhower–Johnson Memorial Tunnel (11,158 ft) & Vail Pass (10,662 ft)";
    clearBaselineHighwayDrive: "1 hr 45 min – 2 hr 15 min highway drive time (DEN to Breckenridge / Vail)";
    stormOrMeteringHighwayDrive: "3.5 – 4.5+ hours highway drive time for ALL vehicles on I-70 when CDOT activates EJMT tunnel metering, winter snowplowing holds, or hazmat tunnel runs";
    equalRoadTreatmentStatement: string;
  };
}

export interface ColoradoTransferOptionFactRow {
  optionId:
    | "gosno-private-suv"
    | "gosno-private-van"
    | "epic-shared-shuttle"
    | "self-drive-awd-rental"
    | "rtd-bustang-public";
  optionName: string;
  operatorOrAuthority: string;
  pickupWait: string;
  rentalCollection: string;
  parking: string;
  vehicleAndGearFit: string;
  confirmedPricing: string;
  availability: string;
  sharedRoadConditions: string;
  nextStepUrl: string;
  nextStepLabel: string;
}

export const CDOT_I70_VERIFIED_FACTS: CdotVerifiedCorridorFacts = {
  ejmtMetering: {
    authority: "Colorado Department of Transportation (CDOT)",
    officialUrl: "https://www.codot.gov/travel/ejmt/metering",
    verifiedAt: "2026-11-07",
    ruleSummary:
      "CDOT Eisenhower–Johnson Memorial Tunnel (EJMT) metering stops traffic entering the affected tunnel bore to prevent vehicles from backing up inside the tunnel during peak volume, snow removal, or hazmat runs.",
    sharedRoadImplication:
      "Because metering holds traffic at the tunnel approach portals (Georgetown/Hidden Valley WB and Silverthorne EB), every vehicle traveling I-70—whether a private SUV, private van, shared shuttle, rental SUV, or Bustang coach—uses the same road and experiences the same tunnel-metering holds.",
  },
  passengerTractionLawPenalties: {
    statute:
      "C.R.S. § 42-4-106 (Code 15 Traction Law & Code 16 Passenger Chain Law)",
    authority: "Colorado Department of Transportation (CDOT)",
    officialUrl: "https://www.codot.gov/travel/winter-driving/tractionlaw",
    verifiedAt: "2026-11-07",
    activeWindow:
      "September 1 – May 31 on I-70 between Dotsero (MP 133) and Morrison (MP 259)",
    noncomplianceFineUsd: 100,
    noncomplianceSurchargeUsd: 33,
    noncomplianceTotalUsd: 133,
    laneClosureFineUsd: 500,
    laneClosureSurchargeUsd: 156,
    laneClosureTotalUsd: 656,
    penaltySummary:
      "CDOT passenger guidance lists a $100 fine plus a $33 surcharge ($133 total) for Traction/Chain Law noncompliance, with higher penalties ($500 fine plus a $156 surcharge = $656 total) when a noncompliant vehicle blocks a lane or causes a roadway closure.",
  },
  sharedI70RoadConditionBaseline: {
    roadSegment:
      "I-70 West / East via Eisenhower–Johnson Memorial Tunnel (11,158 ft) & Vail Pass (10,662 ft)",
    clearBaselineHighwayDrive:
      "1 hr 45 min – 2 hr 15 min highway drive time (DEN to Breckenridge / Vail)",
    stormOrMeteringHighwayDrive:
      "3.5 – 4.5+ hours highway drive time for ALL vehicles on I-70 when CDOT activates EJMT tunnel metering, winter snowplowing holds, or hazmat tunnel runs",
    equalRoadTreatmentStatement:
      "Where choices use the same road (I-70 / EJMT / Vail Pass / CO-9), DCC applies the exact same verified road conditions and highway transit times. Time differences between options come strictly from DEN airport pickup wait, off-airport rental car collection, and multi-stop lodge loops—never from claiming one vehicle bypasses I-70 tunnel metering.",
  },
};

const SHARED_I70_ROAD_CELL =
  "Same road (I-70 / EJMT): 1h 45m–2h 15m clear highway drive; 3.5–4.5+ hrs during winter storms or CDOT EJMT tunnel metering (metering stops traffic entering the affected tunnel for all vehicles).";

export const COLORADO_TRANSFER_FACT_COMPARISON: ColoradoTransferOptionFactRow[] =
  [
    {
      optionId: "gosno-private-suv",
      optionName: "GoSno Private AWD/4WD SUV (1–6 Passengers)",
      operatorOrAuthority: "GoSno LLC (CO PUC LL-03577)",
      pickupWait:
        "0 min scheduled terminal holding — dedicated driver tracks your DEN flight and texts your exact Level 5 curbside pickup door after baggage claim (answer card/llms.txt list Island 2 Doors 506–510 W / 507–511 E; pickup guide notes exact door varies by airport conditions).",
      rentalCollection:
        "None — board curbside at DEN Jeppesen Terminal and exit directly at your resort lodging door (optional 20–30 min grocery stop on advance request).",
      parking:
        "$0 overnight resort parking (direct lodge drop-off; use free Breck Free Ride, Summit Stage, or Town of Vail buses in town).",
      vehicleAndGearFit:
        "Verified seating_limit: 6 passengers max. With 5–6 passengers + 170–190 cm ski bags, internal cargo requires folding part of the 3rd row or confirming a roof box (requires_operator_confirmation). Skis, snowboards, and standard luggage included at no extra charge when fitting safely.",
      confirmedPricing:
        "Flat private SUV one-way from DEN: $349 Winter Park / Keystone / Copper · $399 Breckenridge · $499 Vail · $549 Beaver Creek · $599 Steamboat · $699 Aspen / Snowmass / Crested Butte.",
      availability:
        "Online bookable (available_for_online_booking, online_bookable: true) on 9 Colorado resort routes via gosno.co; Crested Butte ($699) and BZN–Big Sky ($299) are quote_only.",
      sharedRoadConditions: SHARED_I70_ROAD_CELL,
      nextStepUrl:
        "https://gosno.co/breckenridge?origin=DEN&destination=Breckenridge&passengers=4&passengerCount=4&vehicleClass=suv&src=dcc-colorado-fact-table",
      nextStepLabel: "Book Private SUV on GoSno →",
    },
    {
      optionId: "gosno-private-van",
      optionName: "GoSno Private Passenger Van (Up to 10 Passengers)",
      operatorOrAuthority: "GoSno LLC (CO PUC LL-03577)",
      pickupWait:
        "0 min scheduled terminal holding — private group dispatch from DEN Level 5 curbside once your party claims ski bags.",
      rentalCollection:
        "None — single door-to-door commercial vehicle for your group; avoids splitting into two rental cars.",
      parking:
        "$0 overnight resort parking (eliminates paying $80–$130+/night total to park two separate rental SUVs in Vail or Breckenridge).",
      vehicleAndGearFit:
        "Verified seating_limit: 10 passengers max, subject to luggage and ski-gear fit. Groups of 11+ passengers exceed a single GoSno van and require a multi-vehicle quote (gosno.co/request-quote). Van interior barrier and ski racks depend on physical vehicle assignment (requires_operator_confirmation).",
      confirmedPricing:
        "Flat private van one-way from DEN: $499 Winter Park / Keystone · $599 Copper / Breckenridge / Vail · $649 Beaver Creek · $899 Steamboat / Aspen / Snowmass.",
      availability:
        "Published route fares on gosno.co (available_for_online_booking in route feed; live /api/availability marks van requests quoteOnly: true to confirm date/time slot and ski-gear fit; Crested Butte quote_only; Big Sky van currently_unavailable).",
      sharedRoadConditions: SHARED_I70_ROAD_CELL,
      nextStepUrl:
        "https://gosno.co/vail?origin=DEN&destination=Vail&passengers=7&passengerCount=7&vehicleClass=van&src=dcc-colorado-fact-table",
      nextStepLabel: "Open GoSno 10-Pax Van / Confirm Fit →",
    },
    {
      optionId: "epic-shared-shuttle",
      optionName: "Epic Mountain Express Shared Shuttle (Per-Seat)",
      operatorOrAuthority: "Epic Mountain Express",
      pickupWait:
        "30–60 min scheduled terminal staging at DEN Level 5 (West Side near Carousel #18 / Door 502) plus multi-stop resort drop-offs.",
      rentalCollection:
        "None — check in at DEN terminal counter/curbside; commercial driver handles winter highway operation.",
      parking: "$0 overnight resort parking.",
      vehicleAndGearFit:
        "Shared 10–12 passenger van booked per seat. Includes 2 baggage items (including 1 ski/snowboard bag) + 1 small personal item per guest ($10 extra bag fee with advance notice). Best when travelers land on staggered flights.",
      confirmedPricing:
        "Per-seat one-way rate varies by date & peak period: $59–$129/guest (Transfer Center) or $69–$139/guest (Door-to-Door) before 20% Epic Mountain Rewards discount on non-blackout dates.",
      availability:
        "Scheduled daily departures serving Breckenridge, Keystone, Copper, Vail, and Beaver Creek (does not serve Winter Park, Steamboat, Aspen/Snowmass, Crested Butte, or Big Sky).",
      sharedRoadConditions: SHARED_I70_ROAD_CELL,
      nextStepUrl: "https://www.epicmountainexpress.com/shuttle-rates",
      nextStepLabel: "Check Epic Shared Shuttle Rates ↗",
    },
    {
      optionId: "self-drive-awd-rental",
      optionName: "Self-Drive Airport Rental AWD/4WD SUV",
      operatorOrAuthority: "DEN Off-Airport Rental Car Fleets (Subject to CDOT C.R.S. § 42-4-106)",
      pickupWait:
        "15–30 min wait at DEN Level 5 Island 4 for off-airport rental shuttle bus to Pena Blvd rental lots.",
      rentalCollection:
        "45–75 min total pickup + counter queue + physical tire inspection (must verify M+S or 3PMSF sidewall symbol and >= 3/16-inch tread depth) plus return refueling and drop-off.",
      parking:
        "$40–$65+/night per vehicle in Vail Village/Lionshead parking structures; $15–$45+/night in Breckenridge overnight town/resort lots.",
      vehicleAndGearFit:
        "1 standard SUV fits 4–5 passengers with ski bags (7–10 travelers require 2 separate AWD SUVs). Most rental contracts prohibit physical tire chains (Code 16), and fleet tires frequently lack winter tread.",
      confirmedPricing:
        "Variable daily AWD tariff + fuel + I-70 Express Lane tolls + $15–$65+/night parking. CDOT Code 15 passenger noncompliance carries a $100 fine + $33 surcharge ($133 total), rising to $500 fine + $156 surcharge ($656 total) if a noncompliant vehicle blocks a lane.",
      availability:
        "Subject to peak winter weekend AWD/4WD inventory shortages at DEN; reserving 'AWD or similar' does not guarantee 3PMSF winter tires.",
      sharedRoadConditions: SHARED_I70_ROAD_CELL,
      nextStepUrl: "https://www.codot.gov/travel/winter-driving/tractionlaw",
      nextStepLabel: "Verify CDOT Traction Law Rules ↗",
    },
    {
      optionId: "rtd-bustang-public",
      optionName: "RTD A-Line Rail + CDOT Bustang West Line + Free Local Bus",
      operatorOrAuthority: "RTD Denver · CDOT Bustang · Summit Stage / Town of Vail",
      pickupWait:
        "15–30 min RTD A-Line headway at DEN Transit Center (37-min train ride to Union Station) + scheduled Bustang coach departure window.",
      rentalCollection:
        "None — requires walking with all suitcases and ski bags between RTD A-Line platform, Union Station Underground Bus Concourse, and Frisco/Vail Transfer Center.",
      parking: "$0 overnight resort parking.",
      vehicleAndGearFit:
        "Full-size Bustang West Line motorcoaches provide under-coach ski/luggage bays and onboard restroom (11-pax Pegasus vans have compact cargo bays). Travelers must carry their own gear across 2–3 transit transfers.",
      confirmedPricing:
        "$10.50 RTD A-Line (DEN to Union Station) + $12–$22 CDOT Bustang to Frisco ($0 Summit Stage to Breckenridge) or $17 Bustang to Vail = $27.50 total DEN–Vail one-way ($0 Town of Vail in-resort bus).",
      availability:
        "Fixed daily timetable departing Denver Union Station; Pegasus express vans require advance seat reservations.",
      sharedRoadConditions: SHARED_I70_ROAD_CELL,
      nextStepUrl: "https://www.codot.gov/travel/bustang",
      nextStepLabel: "View CDOT Bustang Schedule ↗",
    },
  ];
