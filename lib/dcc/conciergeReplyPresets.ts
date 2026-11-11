import { buildAddToCruisePromenadeUrl } from "@/lib/dcc/shared/addToCruisePromenadeUrl";

export const CONCIERGE_PRESET_IDS = [
  "jfd_mvib0lba_2027_05_17",
  "jfd_mv1sadck_2027_06_14",
] as const;

export type ConciergePresetId = (typeof CONCIERGE_PRESET_IDS)[number];

export interface HydratedConciergePreset {
  presetId: ConciergePresetId;
  entryId: "JFD-SCAN-MVIB0LBA-77420" | "JFD-SCAN-MV1SADCK-44807";
  defaultItemKey: string;
  fromBrand: "juneauflightdeck";
  cruiseShip: string;
  portDate: string;
  partySize: number;
  viatorProductCode: string;
  viatorHandoffUrl: string;
  addToCruisePromenadeUrl: string;
  subject: string;
  textBody: string;
}

const DCC_HANDOFF_ENDPOINT =
  "https://www.destinationcommandcenter.com/go/commerce/handoff";

export function isConciergePresetId(
  value: unknown,
): value is ConciergePresetId {
  return (
    typeof value === "string" &&
    (CONCIERGE_PRESET_IDS as readonly string[]).includes(value)
  );
}

export function extractPassengerFirstName(
  fullName: string | null | undefined,
): string {
  const first = (fullName || "").trim().split(/\s+/)[0] || "";
  return first || "there";
}

export function resolveConciergePresetIdForSourceId(
  sourceId: string | null | undefined,
): ConciergePresetId | null {
  const normalized = (sourceId || "").trim().toUpperCase();
  if (normalized === "JFD-SCAN-MVIB0LBA-77420") {
    return "jfd_mvib0lba_2027_05_17";
  }
  if (normalized === "JFD-SCAN-MV1SADCK-44807") {
    return "jfd_mv1sadck_2027_06_14";
  }
  return null;
}

function buildPresetHandoffUrl(params: {
  product: string;
  date: string;
  partySize: number;
  cruiseShip: string;
  campaign: string;
  viatorUrl: string;
}): string {
  const qs = new URLSearchParams();
  qs.set("site", "juneauflightdeck.com");
  qs.set("provider", "viator");
  qs.set("account", "P00058396");
  qs.set("product", params.product);
  qs.set("date", params.date);
  qs.set("partySize", String(params.partySize));
  qs.set("cruiseShip", params.cruiseShip);
  qs.set("campaign", params.campaign);
  qs.set("url", params.viatorUrl);
  return `${DCC_HANDOFF_ENDPOINT}?${qs.toString()}`;
}

export function buildHydratedConciergePreset(
  presetId: ConciergePresetId,
  options?: {
    guestName?: string | null;
    guestFirstName?: string | null;
    shareCode?: string | null;
  },
): HydratedConciergePreset {
  const firstName =
    options?.guestFirstName && options.guestFirstName.trim()
      ? options.guestFirstName.trim()
      : extractPassengerFirstName(options?.guestName);

  if (presetId === "jfd_mvib0lba_2027_05_17") {
    const viatorUrl =
      "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Dog-Sledding-Tour/d941-6251SHOREXDOGSLED?pid=P00058396&mcid=42383&medium=api&campaign=jfd-concierge-mvib0lba&startDate=2027-05-17&numTravelers=4";
    const viatorHandoffUrl = buildPresetHandoffUrl({
      product: "6251SHOREXDOGSLED",
      date: "2027-05-17",
      partySize: 4,
      cruiseShip: "Royal Princess",
      campaign: "jfd-concierge-mvib0lba",
      viatorUrl,
    });
    const addToCruisePromenadeUrl = buildAddToCruisePromenadeUrl({
      title: "Juneau Helicopter Glacier Dog Sledding",
      port: "juneau",
      portDate: "2027-05-17",
      ship: "Royal Princess",
      partySize: 4,
      operator: "Coastal Helicopters",
      fitStatus: "fits",
      sourceSite: "juneauflightdeck.com",
      productCode: "6251SHOREXDOGSLED",
      shareCode: options?.shareCode || null,
    });

    const subject =
      "Your Summer 2027 Juneau Helicopter Dog-Sled Options — Royal Princess (May 17–18, 2027 · Party of 4)";

    const textBody = [
      `Hi ${firstName},`,
      "",
      "Great news — 2027 Juneau glacier helicopter and dog-sledding calendars are open for your Royal Princess port call on May 17, 2027 (Party of 4), with verified port-safe afternoon departures:",
      "",
      "1) JUNEAU PRIMARY OPTIONS (Monday, May 17, 2027 — True Glacier Snowfield Sled Ride):",
      "• Coastal Helicopters — Herbert Glacier Dog Sled Tour: $769/person base",
      "  Port-safe May 17 afternoon slots: 2:00 PM, 2:40 PM, 3:20 PM, and 4:00 PM",
      "  (Extended Dog Sled option also available at $899/person at 2:40 PM · https://coastalhelicopters.com/tours/dog-sled-tours/)",
      "• NorthStar Helicopters — Norris Glacier Dog Sled Adventure: $789/person base",
      "  Port-safe May 17 afternoon slot: 3:00 PM (https://northstartrekking.com/adventures/juneau-glacier-dog-sled-adventure/)",
      "",
      "2) IMPORTANT SKAGWAY WEATHER-BACKUP WARNING (Tuesday, May 18, 2027):",
      "• TEMSCO Skagway Glacier Discovery / Camp ($649/person) is a musher camp & puppy DEMO ONLY — guests do NOT ride a dog sled in Skagway! Prioritize booking your true glacier dog-sled ride in Juneau on May 17 first, and treat Skagway strictly as a non-sled glacier landing backup if Juneau clouds out.",
      "",
      "3) VIATOR WORRY-FREE SHORE EXCURSION BOOKING HANDOFF (Coastal Dog Sled · d941-6251SHOREXDOGSLED):",
      viatorHandoffUrl,
      "",
      "4) ADD TO CRUISE PROMENADE PLAN (Free Group Itinerary Sync):",
      `Add to Cruise Promenade Plan: ${addToCruisePromenadeUrl}`,
      "",
      "Partner & Channel Disclosure: Booking through our Viator partner link above (pid=P00058396) may earn Juneau Flight Deck / Destination Command Center a referral commission at no extra cost to you. Direct operator links to Coastal Helicopters, NorthStar, and TEMSCO are provided commission-free for transparent comparison.",
      "",
      "Reply directly to this email if you would like help double-checking FAA passenger weight surcharges or locking in your preferred slot.",
      "",
      "Warm regards,",
      "Juneau Flight Deck Concierge Desk",
      "https://juneauflightdeck.com",
    ].join("\n");

    return {
      presetId,
      entryId: "JFD-SCAN-MVIB0LBA-77420",
      defaultItemKey: "jfd:waitlist:JFD-SCAN-MVIB0LBA-77420",
      fromBrand: "juneauflightdeck",
      cruiseShip: "Royal Princess",
      portDate: "2027-05-17",
      partySize: 4,
      viatorProductCode: "6251SHOREXDOGSLED",
      viatorHandoffUrl,
      addToCruisePromenadeUrl,
      subject,
      textBody,
    };
  }

  const viatorUrl =
    "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api&campaign=jfd-concierge-mv1sadck&startDate=2027-06-14&numTravelers=2";
  const viatorHandoffUrl = buildPresetHandoffUrl({
    product: "6251SHOREXICEWALK",
    date: "2027-06-14",
    partySize: 2,
    cruiseShip: "Koningsdam",
    campaign: "jfd-concierge-mv1sadck",
    viatorUrl,
  });
  const addToCruisePromenadeUrl = buildAddToCruisePromenadeUrl({
    title: "Juneau Helicopter Tour & Guided Icefield Walk",
    port: "juneau",
    portDate: "2027-06-14",
    ship: "Koningsdam",
    partySize: 2,
    operator: "Coastal Helicopters",
    fitStatus: "fits",
    sourceSite: "juneauflightdeck.com",
    productCode: "6251SHOREXICEWALK",
    shareCode: options?.shareCode || null,
  });

  const subject =
    "IMPORTANT Timing Update + 2027 Juneau Glacier Flight Options — Koningsdam (June 14, 2027 · Party of 2)";

  const textBody = [
    `Hi ${firstName},`,
    "",
    "We reviewed the official 2027 CLAA Juneau cruise berth schedule for Holland America Koningsdam on Monday, June 14, 2027 (Party of 2) and wanted to flag an essential timing safety update alongside your open flight options:",
    "",
    "⚠️ CRUCIAL TIMING SAFETY WARNING:",
    "Koningsdam docks in Juneau at 1:30 PM per the official 2027 CLAA schedule — do NOT book the 1:40 PM Coastal Helicopters slot referenced in the Oct 25 alert (10 minutes is not enough time to clear gangway security and meet dockside pickup). Choose 2:20 PM or later!",
    "",
    "1) VERIFIED PORT-SAFE GLACIER LANDING & AIRBOAT OPTIONS (June 14, 2027):",
    "• Coastal Helicopters — Icefield Excursion (Herbert Glacier Walk): $459/person base",
    "  Port-safe June 14 departures: 2:20 PM, 3:00 PM, 3:40 PM, 4:20 PM, 5:00 PM, and 5:40 PM",
    "  (https://coastalhelicopters.com/tours/icefield-excursion/)",
    "• NorthStar Helicopters — Taku Glacier Airboat & Helicopter Adventure: $757/person base at 5:15 PM",
    "• NorthStar Helicopters — Helicopter Glacier Walkabout (1 Hour on Ice): $539/person base at 5:30 PM",
    "  (https://northstartrekking.com/treks/tours/helicopter-glacier-walkabout/)",
    "• Optional Snowfield Dog-Sled Upgrades: $769/person (Coastal Herbert Glacier) or $789/person (NorthStar Norris Glacier)",
    "",
    "2) VIATOR WORRY-FREE SHORE EXCURSION (§20) BOOKING HANDOFF (Coastal Icefield Walk · d941-6251SHOREXICEWALK):",
    viatorHandoffUrl,
    "",
    "3) ADD TO CRUISE PROMENADE PLAN (Free Group Itinerary Sync):",
    `Add to Cruise Promenade Plan: ${addToCruisePromenadeUrl}`,
    "",
    "Partner & Channel Disclosure: Booking through our Viator partner link above (pid=P00058396) may earn Juneau Flight Deck / Destination Command Center a referral commission at no extra cost to you. Direct operator links to Coastal Helicopters and NorthStar are provided commission-free for transparent comparison.",
    "",
    "Reply directly to this email if you'd like help choosing between the 2:20 PM–5:40 PM Coastal departures or NorthStar's 5:15 PM / 5:30 PM flights.",
    "",
    "Warm regards,",
    "Juneau Flight Deck Concierge Desk",
    "https://juneauflightdeck.com",
  ].join("\n");

  return {
    presetId,
    entryId: "JFD-SCAN-MV1SADCK-44807",
    defaultItemKey: "jfd:waitlist:JFD-SCAN-MV1SADCK-44807",
    fromBrand: "juneauflightdeck",
    cruiseShip: "Koningsdam",
    portDate: "2027-06-14",
    partySize: 2,
    viatorProductCode: "6251SHOREXICEWALK",
    viatorHandoffUrl,
    addToCruisePromenadeUrl,
    subject,
    textBody,
  };
}

export function buildGenericJfdConciergeTemplate(options: {
  guestName?: string | null;
  shipName?: string | null;
  datesOrMonth?: string | null;
  partySize?: number | string | null;
}): { subject: string; textBody: string } {
  const firstName = extractPassengerFirstName(options.guestName);
  const shipPart = options.shipName ? ` — ${options.shipName}` : "";
  const datePart = options.datesOrMonth ? ` (${options.datesOrMonth})` : "";
  const partyNum = Number(options.partySize) || 2;

  const viatorUrl =
    "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api&campaign=jfd-concierge-general";
  const handoffUrl = buildPresetHandoffUrl({
    product: "6251SHOREXICEWALK",
    date:
      options.datesOrMonth && /^\d{4}-\d{2}-\d{2}$/.test(options.datesOrMonth)
        ? options.datesOrMonth
        : "2027-06-15",
    partySize: partyNum,
    cruiseShip: options.shipName || "Cruise Ship",
    campaign: "jfd-concierge-general",
    viatorUrl,
  });
  const cpUrl = buildAddToCruisePromenadeUrl({
    title: "Juneau Helicopter Glacier Landing",
    port: "juneau",
    ship: options.shipName || null,
    partySize: partyNum,
    operator: "Coastal Helicopters",
    fitStatus: "fits",
    sourceSite: "juneauflightdeck.com",
    productCode: "6251SHOREXICEWALK",
  });

  return {
    subject: `Your Juneau Helicopter Glacier Options${shipPart}${datePart}`,
    textBody: [
      `Hi ${firstName},`,
      "",
      `Thank you for reaching out to Juneau Flight Deck regarding your upcoming Juneau port day${shipPart}${datePart} for ${partyNum} guest(s).`,
      "",
      "Here are the verified cruise-safe Juneau Part 135 glacier flight options to compare:",
      "• Coastal Helicopters Icefield Excursion (Herbert Glacier Walk · Viator §20 Worry-Free Shore Excursion):",
      `  ${handoffUrl}`,
      "• Save & coordinate port plans on Cruise Promenade:",
      `  Add to Cruise Promenade Plan: ${cpUrl}`,
      "",
      "Partner Disclosure: Booking through our Viator partner link (pid=P00058396) may earn Juneau Flight Deck / Destination Command Center a referral commission at no extra cost to you.",
      "",
      "Reply directly if you'd like us to check specific departure buffers against your ship's all-aboard time.",
      "",
      "Warm regards,",
      "Juneau Flight Deck Concierge Desk",
    ].join("\n"),
  };
}
