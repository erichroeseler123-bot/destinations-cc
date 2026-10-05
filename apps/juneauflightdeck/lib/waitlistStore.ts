import { promises as fs } from "node:fs";
import path from "node:path";
import { getDb, ensureDbTables } from "./db";
import {
  fetchFareHarborDateRange,
  filterOpenAvailabilities,
  buildFareHarborDirectBookingUrl,
  JUNEAU_OPERATORS,
} from "./fareharborRange";
import { dispatchSeatDropNotification } from "./notificationDispatcher";

export interface ScannedProduct {
  key: string;
  name: string;
  operator: string;
  port: "juneau" | "skagway";
  tourType: "dog_sledding" | "glacier_landing" | "ice_trek" | "flightseeing";
  itemPk: number;
  companyShortname: string;
  cancellationPolicy: string;
}

export const SCANNED_PRODUCTS: ScannedProduct[] = [
  {
    key: "temsco_juneau_dog_sledding",
    name: "TEMSCO Glacier Dog Sledding by Helicopter",
    operator: "TEMSCO Helicopters (Juneau)",
    port: "juneau",
    tourType: "dog_sledding",
    itemPk: 214810,
    companyShortname: "temscoair-juneau",
    cancellationPolicy:
      "TEMSCO Aviation Juneau terms: 100% full refund at least 48 hours prior to flight departure. Non-refundable within 48 hours. 100% refund for weather cancellations or cruise ship delay.",
  },
  {
    key: "temsco_juneau_glacier_landing",
    name: "TEMSCO Mendenhall Glacier Landing",
    operator: "TEMSCO Helicopters (Juneau)",
    port: "juneau",
    tourType: "glacier_landing",
    itemPk: 214803,
    companyShortname: "temscoair-juneau",
    cancellationPolicy:
      "TEMSCO Aviation Juneau terms: 100% full refund at least 48 hours prior to flight departure. Non-refundable within 48 hours. 100% refund for weather cancellations or cruise ship delay.",
  },
  {
    key: "coastal_juneau_icefield",
    name: "Coastal Helicopters Icefield Excursion",
    operator: "Coastal Helicopters",
    port: "juneau",
    tourType: "glacier_landing",
    itemPk: 413056,
    companyShortname: "coastalhelicopters",
    cancellationPolicy:
      "Coastal Helicopters published terms: 100% full refund at least 7 days (168 hours) prior to flight departure. 50% charge (50% refund) 4–6 days (96–144 hours) ahead. Non-refundable within 3 days (less than 72 hours). 100% full refund if flight is grounded due to weather or cruise delay.",
  },
  {
    key: "northstar_juneau_ice_trek",
    name: "NorthStar Glacier Ice Trek & Climb",
    operator: "NorthStar Trekking",
    port: "juneau",
    tourType: "ice_trek",
    itemPk: 116035,
    companyShortname: "northstartrekking",
    cancellationPolicy:
      "NorthStar Trekking terms: 100% full refund at least 48 hours prior to flight departure. Non-refundable within 48 hours. 100% refund for weather cancellations or cruise ship delay.",
  },
  {
    key: "temsco_skagway_dog_sledding",
    name: "TEMSCO Skagway Denver Glacier Dog Sledding",
    operator: "TEMSCO Helicopters (Skagway)",
    port: "skagway",
    tourType: "dog_sledding",
    itemPk: 213556,
    companyShortname: "temscoair-skagway",
    cancellationPolicy:
      "TEMSCO Aviation Skagway terms: 100% full refund with 48 hours notice prior to tour departure time. Non-refundable within 48 hours. 100% refund if weather prevents safe flying or cruise ship bypasses Skagway.",
  },
  {
    key: "temsco_skagway_glacier_landing",
    name: "TEMSCO Skagway Meade Glacier Landing",
    operator: "TEMSCO Helicopters (Skagway)",
    port: "skagway",
    tourType: "glacier_landing",
    itemPk: 213561,
    companyShortname: "temscoair-skagway",
    cancellationPolicy:
      "TEMSCO Aviation Skagway terms: 100% full refund with 48 hours notice prior to tour departure time. Non-refundable within 48 hours. 100% refund if weather prevents safe flying or cruise ship bypasses Skagway.",
  },
];

export type WaitlistStatus =
  | "active_scanning"    // Actively querying operator inventories
  | "opening_detected"  // Seat opening detected by scanner for passenger's date/party
  | "contact_pending"   // Notification/dispatch alert sent, awaiting passenger checkout
  | "held"              // ONLY when an operator hold is placed with holdReference and holdExpiresAt
  | "booking_confirmed" // Verified completed booking via checkout URL / operator confirmation
  | "cancelled";        // Passenger declined or expired

export interface WaitlistEntry {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone?: string;
  cruiseLine: string;
  shipName: string;
  portDate: string; // primary date
  juneauDate?: string; // explicit Juneau port date if multi-port or Juneau scan
  skagwayDate?: string; // explicit Skagway port date if multi-port or Skagway scan
  dateVerification: "passenger_supplied" | "verified_itinerary";
  portCity: "juneau" | "skagway" | "either";
  tourType: "any" | "glacier_landing" | "dog_sledding" | "ice_trek" | "flightseeing";
  partySize: number;
  notes?: string;
  preferredOperator?: "temsco" | "coastal" | "northstar" | "any";
  bookingMode: "instant_alert" | "concierge_dispatch" | "priority_hold" | "sms_alert";
  status: WaitlistStatus;
  lastScannedAt?: string;
  matchedPort?: "juneau" | "skagway";
  matchedOperator?: string;
  matchedSlotTime?: string;
  fareharborCheckoutUrl?: string;
  estimatedValue?: number;
  cancellationPolicyNotes?: string;
  dispatchAlertNotes?: string;
  operatorHoldStatus: "not_held" | "held" | "unsupported";
  operatorHoldReference?: string;
  operatorHoldExpiresAt?: string;
  notificationDispatchedAt?: string;
  notificationDeliveryId?: string;
}

const SEED_ENTRIES: WaitlistEntry[] = [
  {
    id: "JFD-SCAN-JUL14-48291",
    createdAt: "2026-09-28T14:22:00.000Z",
    name: "Michael & Sarah Henderson",
    email: "henderson.family@gmail.com",
    phone: "(206) 555-0194",
    cruiseLine: "Princess Cruises",
    shipName: "Discovery Princess",
    portDate: "2027-07-14",
    juneauDate: "2027-07-14",
    dateVerification: "passenger_supplied",
    portCity: "juneau",
    tourType: "dog_sledding",
    partySize: 4,
    notes: "Docking at Franklin Dock 1:00 PM. Dog sledding is top bucket list item!",
    bookingMode: "concierge_dispatch",
    status: "active_scanning",
    operatorHoldStatus: "not_held",
    lastScannedAt: "2026-10-01T10:00:00.000Z",
    estimatedValue: 2596,
    cancellationPolicyNotes:
      "TEMSCO Aviation Juneau terms: 100% full refund at least 48 hours prior to flight departure. Non-refundable within 48 hours. 100% refund for weather cancellations or cruise ship delay.",
  },
  {
    id: "JFD-SCAN-JUL22-19402",
    createdAt: "2026-09-29T09:15:00.000Z",
    name: "David Miller",
    email: "dmiller99@yahoo.com",
    phone: "(415) 555-8821",
    cruiseLine: "Holland America Line",
    shipName: "Eurodam",
    portDate: "2027-07-22",
    juneauDate: "2027-07-22",
    dateVerification: "passenger_supplied",
    portCity: "juneau",
    tourType: "glacier_landing",
    partySize: 2,
    notes: "Interested in Mendenhall Glacier landing, open to afternoon slot",
    bookingMode: "concierge_dispatch",
    status: "contact_pending",
    operatorHoldStatus: "not_held",
    matchedPort: "juneau",
    matchedOperator: "Coastal Helicopters",
    matchedSlotTime: "2:15 PM Departure",
    fareharborCheckoutUrl: "https://fareharbor.com/embeds/book/welcometoalaskatours/items/561220/",
    lastScannedAt: "2026-10-01T10:00:00.000Z",
    estimatedValue: 898,
    cancellationPolicyNotes:
      "Coastal Helicopters published terms: 100% full refund at least 7 days (168 hours) prior to flight departure. 50% charge (50% refund) 4–6 days (96–144 hours) ahead. Non-refundable within 3 days (less than 72 hours). 100% full refund if flight is grounded due to weather or cruise delay.",
    dispatchAlertNotes:
      "Opening detected: Coastal Helicopters Icefield Excursion on 2027-07-22 (2:15 PM Departure). Notification alert dispatched to dmiller99@yahoo.com. Status: contact_pending. Operator hold: not_held (direct operator checkout link provided).",
    notificationDispatchedAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "JFD-SCAN-AUG03-67319",
    createdAt: "2026-09-30T11:40:00.000Z",
    name: "Jessica & Tom Vance",
    email: "vance.tom@outlook.com",
    phone: "(303) 555-3419",
    cruiseLine: "Norwegian Cruise Line (NCL)",
    shipName: "Norwegian Encore",
    portDate: "2027-08-03",
    juneauDate: "2027-08-03",
    dateVerification: "passenger_supplied",
    portCity: "juneau",
    tourType: "any",
    partySize: 2,
    notes: "Docking AJ Dock. Any helicopter seat that lands on ice!",
    bookingMode: "instant_alert",
    status: "contact_pending",
    operatorHoldStatus: "not_held",
    matchedPort: "juneau",
    matchedOperator: "TEMSCO Helicopters (Juneau)",
    matchedSlotTime: "3:30 PM Departure",
    fareharborCheckoutUrl: "https://fareharbor.com/embeds/book/welcometoalaskatours/items/560822/",
    lastScannedAt: "2026-10-01T10:00:00.000Z",
    estimatedValue: 898,
    cancellationPolicyNotes:
      "TEMSCO Aviation Juneau terms: 100% full refund at least 48 hours prior to flight departure. Non-refundable within 48 hours. 100% refund for weather cancellations or cruise ship delay.",
    dispatchAlertNotes:
      "Opening detected: TEMSCO Mendenhall Glacier Landing on 2027-08-03 (3:30 PM Departure). Direct checkout link sent to (303) 555-3419 and vance.tom@outlook.com. Status: contact_pending. Operator hold: not_held.",
    notificationDispatchedAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "JFD-SCAN-AUG18-90214",
    createdAt: "2026-10-01T08:10:00.000Z",
    name: "Robert Chang Party",
    email: "rchang.md@gmail.com",
    phone: "(512) 555-7281",
    cruiseLine: "Royal Caribbean",
    shipName: "Ovation of the Seas",
    portDate: "2027-08-18",
    juneauDate: "2027-08-18",
    dateVerification: "passenger_supplied",
    portCity: "juneau",
    tourType: "ice_trek",
    partySize: 3,
    notes: "Active hikers, seeking NorthStar Trekking crampon hike",
    bookingMode: "instant_alert",
    status: "active_scanning",
    operatorHoldStatus: "not_held",
    lastScannedAt: "2026-10-01T10:00:00.000Z",
    estimatedValue: 1797,
    cancellationPolicyNotes:
      "NorthStar Trekking terms: 100% full refund at least 48 hours prior to flight departure. Non-refundable within 48 hours. 100% refund for weather cancellations or cruise ship delay.",
  },
];

let inMemoryStore: WaitlistEntry[] = [...SEED_ENTRIES];

export function getTodayAlaskaDate(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Juneau",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function getDataDirs(): string[] {
  const dirs = [path.join(process.cwd(), "data", "waitlist")];
  if (process.env.VERCEL) {
    dirs.push(path.join("/tmp", "waitlist"));
  }
  return dirs;
}

function getWritableDataDir(): string {
  if (process.env.VERCEL) {
    return path.join("/tmp", "waitlist");
  }
  return path.join(process.cwd(), "data", "waitlist");
}

export async function getAllWaitlistEntries(): Promise<WaitlistEntry[]> {
  const sql = getDb();
  if (sql) {
    try {
      await ensureDbTables();
      const rows = await sql`
        SELECT raw_entry FROM jfd_waitlist_submissions
        ORDER BY port_date ASC;
      `;
      if (rows && rows.length > 0) {
        const dbEntries = rows.map((r: any) => r.raw_entry as WaitlistEntry);
        const map = new Map<string, WaitlistEntry>();
        for (const item of inMemoryStore) map.set(item.id, item);
        for (const item of dbEntries) map.set(item.id, item);
        inMemoryStore = Array.from(map.values());
        return [...inMemoryStore].sort((a, b) => a.portDate.localeCompare(b.portDate));
      }
    } catch (err) {
      console.warn("[WaitlistStore] DB query failed, falling back to disk/in-memory:", err);
    }
  }

  try {
    const dataDirs = getDataDirs();
    const diskEntries: WaitlistEntry[] = [];

    for (const dir of dataDirs) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.endsWith(".json")) {
            const content = await fs.readFile(path.join(dir, file), "utf8");
            diskEntries.push(JSON.parse(content));
          }
        }
      } catch {
        // Directory may not exist yet
      }
    }

    if (diskEntries.length > 0) {
      const map = new Map<string, WaitlistEntry>();
      for (const item of inMemoryStore) map.set(item.id, item);
      for (const item of diskEntries) map.set(item.id, item);
      inMemoryStore = Array.from(map.values());
    }
  } catch {
    // Directory might not exist yet, fallback to in-memory store
  }

  return [...inMemoryStore].sort((a, b) => a.portDate.localeCompare(b.portDate));
}

export async function saveWaitlistEntry(entry: WaitlistEntry): Promise<void> {
  const sql = getDb();
  if (sql) {
    await ensureDbTables();
    await sql`
      INSERT INTO jfd_waitlist_submissions (
        id, name, email, phone, cruise_line, ship_name,
        port_city, port_date, juneau_date, skagway_date,
        tour_type, party_size, booking_mode, status,
        operator_hold_status, notes, estimated_value,
        last_scanned_at, raw_entry
      ) VALUES (
        ${entry.id}, ${entry.name}, ${entry.email}, ${entry.phone || null},
        ${entry.cruiseLine}, ${entry.shipName}, ${entry.portCity},
        ${entry.portDate}, ${entry.juneauDate || null}, ${entry.skagwayDate || null},
        ${entry.tourType}, ${entry.partySize}, ${entry.bookingMode},
        ${entry.status}, ${entry.operatorHoldStatus}, ${entry.notes || null},
        ${entry.estimatedValue || 0}, ${entry.lastScannedAt ? new Date(entry.lastScannedAt) : null},
        ${JSON.stringify(entry)}::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        operator_hold_status = EXCLUDED.operator_hold_status,
        last_scanned_at = EXCLUDED.last_scanned_at,
        raw_entry = EXCLUDED.raw_entry;
    `;
  }

  const existingIdx = inMemoryStore.findIndex((e) => e.id === entry.id);
  if (existingIdx >= 0) {
    inMemoryStore[existingIdx] = entry;
  } else {
    inMemoryStore.unshift(entry);
  }

  try {
    const dataDir = getWritableDataDir();
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(path.join(dataDir, `${entry.id}.json`), JSON.stringify(entry, null, 2), "utf8");
  } catch (err) {
    console.warn("[WaitlistStore] Disk write failed:", err);
  }
}

export async function updateWaitlistStatus(
  id: string,
  status: WaitlistEntry["status"],
  updates?: Partial<WaitlistEntry>
): Promise<WaitlistEntry | null> {
  const all = await getAllWaitlistEntries();
  const entry = all.find((e) => e.id === id);
  if (!entry) return null;

  const updated: WaitlistEntry = {
    ...entry,
    status,
    ...updates,
  };

  await saveWaitlistEntry(updated);
  return updated;
}

export interface SweepResult {
  sweptAt: string;
  totalDatesSwept: number;
  dates: string[];
  openingsFound: number;
  openings: Array<{
    port: "juneau" | "skagway";
    portDate: string;
    operator: string;
    tourName: string;
    seatsAvailable: number;
    matchedGuestId?: string;
    bookingMode?: string;
    notificationDeliveryId?: string;
  }>;
}

/**
 * Sweeps fleet inventories strictly grouping by operator + product + port + date.
 * Skagway inventory is NEVER swept against Juneau port dates, and Juneau inventory
 * is NEVER swept against Skagway port dates.
 * 
 * Status Lifecycle:
 * active_scanning -> opening_detected -> contact_pending -> held (if confirmed by operator) -> booking_confirmed
 */
export async function execute10AmDailySweep(): Promise<SweepResult> {
  const all = await getAllWaitlistEntries();
  const today = getTodayAlaskaDate();

  // Strictly exclude expired watch dates (dates in the past)
  const activeEntries = all.filter((e) => {
    if (e.status !== "active_scanning") return false;
    const targetDate = e.portDate || e.juneauDate || e.skagwayDate;
    if (targetDate && targetDate < today) return false;
    return true;
  });

  const timestamp = new Date().toISOString();
  const openingsFound: SweepResult["openings"] = [];
  const scannedDates = new Set<string>();

  if (activeEntries.length === 0) {
    return {
      sweptAt: timestamp,
      totalDatesSwept: 0,
      dates: [],
      openingsFound: 0,
      openings: [],
    };
  }

  for (const product of SCANNED_PRODUCTS) {
    // 1. Identify active entries that want this port AND match this tour type
    const candidateEntries = activeEntries.filter((entry) => {
      if (entry.status !== "active_scanning") return false;

      const wantsPort =
        entry.portCity === "either" ||
        (entry.portCity === "juneau" && product.port === "juneau") ||
        (entry.portCity === "skagway" && product.port === "skagway");
      if (!wantsPort) return false;

      const wantsTour =
        entry.tourType === "any" || entry.tourType === product.tourType;
      if (!wantsTour) return false;

      // Operator preference check
      if (entry.preferredOperator && entry.preferredOperator !== "any") {
        const matchesOp = product.operator
          .toLowerCase()
          .includes(entry.preferredOperator.toLowerCase());
        if (!matchesOp) return false;
      }

      const targetDate =
        product.port === "juneau"
          ? entry.juneauDate || (entry.portCity === "juneau" ? entry.portDate : undefined)
          : entry.skagwayDate || (entry.portCity === "skagway" ? entry.portDate : undefined);

      return Boolean(targetDate);
    });

    if (candidateEntries.length === 0) {
      continue;
    }

    // 2. Collect ONLY the target dates corresponding to THIS port
    const productDates = new Set<string>();
    for (const entry of candidateEntries) {
      const targetDate =
        product.port === "juneau"
          ? entry.juneauDate || (entry.portCity === "juneau" ? entry.portDate : undefined)
          : entry.skagwayDate || (entry.portCity === "skagway" ? entry.portDate : undefined);
      if (targetDate) {
        productDates.add(targetDate);
        scannedDates.add(targetDate);
      }
    }

    const sortedDates = Array.from(productDates).sort();
    if (sortedDates.length === 0) continue;

    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];

    try {
      const availabilities = await fetchFareHarborDateRange({
        companyShortname: product.companyShortname,
        itemPk: product.itemPk,
        startDate,
        endDate,
      });

      const openSlots = filterOpenAvailabilities(availabilities, 1);

      for (const slot of openSlots) {
        const slotDate = slot.start_at.slice(0, 10);
        if (!productDates.has(slotDate)) continue;

        // Find candidate entries waiting specifically on this date for this port
        const matchingEntries = candidateEntries.filter((entry) => {
          if (entry.status !== "active_scanning") return false;
          const targetDate =
            product.port === "juneau"
              ? entry.juneauDate || (entry.portCity === "juneau" ? entry.portDate : undefined)
              : entry.skagwayDate || (entry.portCity === "skagway" ? entry.portDate : undefined);

          return targetDate === slotDate && entry.partySize <= slot.capacity;
        });

        for (const entry of matchingEntries) {
          const slotTime = new Date(slot.start_at).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            timeZone: "America/Juneau",
          });

          const checkoutUrl = buildFareHarborDirectBookingUrl(
            product.companyShortname,
            product.itemPk,
            slot.pk
          );

          // Dispatch notification to passenger and record delivery
          const notification = await dispatchSeatDropNotification({
            guestId: entry.id,
            guestName: entry.name,
            email: entry.email,
            phone: entry.phone,
            shipName: entry.shipName,
            cruiseLine: entry.cruiseLine,
            port: product.port,
            portDate: slotDate,
            operator: product.operator,
            tourName: product.name,
            departureTime: `${slotTime} Departure`,
            partySize: entry.partySize,
            checkoutUrl,
            cancellationPolicy: product.cancellationPolicy,
          });

          if (!notification) {
            // Duplicate notification prevented / already dispatched
            continue;
          }

          // Accurate lifecycle transition:
          // ONLY transition to contact_pending if the alert was actually DELIVERED to the traveler.
          // Simulated or failed deliveries must NEVER stop active scanning for real customers!
          if (notification.status === "delivered") {
            entry.status = "contact_pending";
          } else {
            console.log(
              `[DailySweep] Delivery status is ${notification.status} for ${entry.id}; preserving active_scanning status so scans continue.`
            );
          }
          entry.operatorHoldStatus = "not_held";
          entry.lastScannedAt = timestamp;
          entry.matchedPort = product.port;
          entry.matchedOperator = product.operator;
          entry.matchedSlotTime = `${slotTime} Departure`;
          entry.fareharborCheckoutUrl = checkoutUrl;
          entry.cancellationPolicyNotes = product.cancellationPolicy;
          entry.notificationDispatchedAt = notification.dispatchedAt;
          entry.notificationDeliveryId = notification.deliveryId;
          entry.dispatchAlertNotes = `Opening detected for ${product.name} on ${slotDate} (${slotTime}). Delivery status: ${notification.status}. Operator hold: not_held.`;

          await saveWaitlistEntry(entry);

          openingsFound.push({
            port: product.port,
            portDate: slotDate,
            operator: product.operator,
            tourName: product.name,
            seatsAvailable: slot.capacity,
            matchedGuestId: entry.id,
            bookingMode: entry.bookingMode,
            notificationDeliveryId: notification.deliveryId,
          });
        }
      }
    } catch (err) {
      console.error(
        `[DailySweep] Error sweeping ${product.operator} - ${product.name} (PK: ${product.itemPk}):`,
        err
      );
    }
  }

  // Update lastScannedAt on any entries that remain active_scanning
  for (const entry of activeEntries) {
    if (entry.status === "active_scanning") {
      entry.lastScannedAt = timestamp;
      await saveWaitlistEntry(entry);
    }
  }

  const allDates = Array.from(scannedDates).sort();
  return {
    sweptAt: timestamp,
    totalDatesSwept: allDates.length,
    dates: allDates,
    openingsFound: openingsFound.length,
    openings: openingsFound,
  };
}
