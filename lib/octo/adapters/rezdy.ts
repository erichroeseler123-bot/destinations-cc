import crypto from "crypto";
import http from "http";
import {
  OctoAvailabilitySlot,
  OctoAvailabilityStatus,
  OctoBookingResult,
  OctoBookingStatus,
  OctoConfirmBookingParams,
  OctoContact,
  OctoCreateHoldParams,
  OctoCustomBookingField,
  OctoParticipantField,
  OctoPickupLocation,
  OctoProduct,
  OctoUnitItemRequest,
  OctoVerifiedPaymentEvidence,
} from "../types";
import { BaseOctoAdapter, OctoApiError } from "./base";
import { OctoClientConfig } from "./types";

/**
 * Rezdy Native REST API v1 Types (inspected from https://developers.rezdy.com/ & GoSno live read-only responses)
 */
export interface RezdyV1RequestStatus {
  success: boolean;
  version?: string;
  error?: {
    errorCode?: string;
    errorMessage?: string;
  };
}

export interface RezdyV1PriceOption {
  id: number;
  label: string;
  price: number;
  seatsUsed: number;
  minQuantity?: number;
  maxQuantity?: number;
  priceGroupType?: "EACH" | "TOTAL";
  productCode: string;
}

export interface RezdyV1BookingField {
  label: string;
  value?: string;
  requiredPerParticipant?: boolean;
  requiredPerBooking?: boolean;
  fieldType?: string;
}

export interface RezdyV1Product {
  productCode: string;
  internalCode?: string;
  name: string;
  shortDescription?: string;
  description?: string;
  productType?: string;
  bookingMode?: "INVENTORY" | "DATE_ENQUIRY" | "NO_DATE";
  currency: string;
  advertisedPrice?: number;
  priceOptions: RezdyV1PriceOption[];
  quantityRequired?: boolean;
  quantityRequiredMin?: number;
  quantityRequiredMax?: number;
  durationMinutes?: number;
  confirmMode?: string;
  supplierId?: number;
  supplierAlias?: string;
  supplierName?: string;
  bookingFields?: RezdyV1BookingField[];
  isApiBookingSupported?: boolean;
  isMultiProductBookingSupported?: boolean;
}

export interface RezdyV1Session {
  id: number;
  productCode: string;
  startTime?: string;
  endTime?: string;
  startTimeLocal: string;
  endTimeLocal?: string;
  allDay?: boolean;
  seats: number;
  seatsAvailable: number;
  priceOptions?: RezdyV1PriceOption[];
}

export interface RezdyV1BookingQuantity {
  optionLabel: string;
  optionPrice?: number;
  value: number;
  priceGroupType?: string;
}

export interface RezdyV1PickupLocation {
  pickupId?: number;
  locationName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  pickupInstructions?: string;
  pickupTime?: string;
}

export interface RezdyV1BookingItem {
  productName?: string;
  productCode: string;
  startTime?: string;
  endTime?: string;
  startTimeLocal: string;
  endTimeLocal?: string;
  amount: number;
  subtotal?: number;
  totalItemTax?: number;
  totalQuantity?: number;
  quantities: RezdyV1BookingQuantity[];
  sessionId?: number;
  participants?: OctoParticipantField[][];
  pickupId?: number;
  pickupLocation?: RezdyV1PickupLocation;
  extras?: unknown[];
  vouchers?: unknown[];
}

export interface RezdyV1Customer {
  id?: number;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phone?: string;
}

export interface RezdyV1PaymentEntry {
  type: "CREDITCARD" | "CASH" | "BANKTRANSFER" | "OTHER";
  amount: number;
  currency: string;
  date: string;
  label: string;
  recipient: "SUPPLIER" | "AGENT";
}

export interface RezdyV1Booking {
  orderNumber: string;
  status: string;
  supplierId?: number;
  supplierName?: string;
  supplierAlias?: string;
  resellerReference?: string;
  totalAmount: number;
  totalCurrency?: string;
  totalPaid?: number;
  totalDue?: number;
  dateCreated?: string;
  dateConfirmed?: string;
  datePaid?: string;
  dateUpdated?: string;
  customer: RezdyV1Customer;
  items: RezdyV1BookingItem[];
  fields?: RezdyV1BookingField[];
  payments?: RezdyV1PaymentEntry[];
  comments?: string;
  internalNotes?: string;
  sendNotifications?: boolean;
  source?: string;
  vouchers?: unknown[];
  paymentOption?: string;
  barcodeType?: string;
}

export interface RezdyCapturedExchange {
  step: string;
  timestamp: string;
  evidenceClass: "live_rezdy_v1_read_only" | "dcc_written_local_simulator" | "rezdy_hosted_staging_sandbox";
  request: {
    method: string;
    urlRedacted: string;
    headersRedacted: Record<string, string>;
    body: unknown;
  };
  response: {
    status: number;
    body: unknown;
  };
}

/**
 * Exact provider-hosted staging account, credentials, and permissions required for
 * live write testing against Rezdy's hosted staging sandbox (`api.rezdy-staging.com`).
 */
export const REZDY_PROVIDER_HOSTED_TESTING_REQUIREMENTS = {
  environmentName: "Rezdy Provider-Hosted Staging Sandbox",
  adminPortalUrl: "https://app.rezdy-staging.com",
  apiBaseUrl: "https://api.rezdy-staging.com/v1",
  authenticationMechanism: "HTTP header `apiKey: <REZDY_STAGING_API_KEY>` or query parameter `?apiKey=<REZDY_STAGING_API_KEY>`",
  requiredEnvVars: ["REZDY_STAGING_API_KEY", "REZDY_STAGING_BASE_URL"],
  requiredAccountTypes: [
    {
      role: "Staging Supplier Account (Direct Operator API)",
      setupPath: "Log in to https://app.rezdy-staging.com -> Settings / Integrations -> Rezdy API -> Generate Supplier API Key",
      capabilities: "Full read/write access to supplier products, session inventory (/v1/availability), and booking lifecycle (/v1/bookings) for that staging supplier.",
    },
    {
      role: "Staging Marketplace Agent Account (Reseller API)",
      setupPath: "Log in to https://app.rezdy-staging.com (Agent portal) -> Settings -> API Key, AND have the staging Supplier share a Negotiated Rate / Rate Sheet (e.g., 10% commission rate sheet) with the Agent.",
      capabilities: "Read access to shared supplier products/sessions and write access to create/update/cancel bookings attributed to the Agent.",
    },
  ],
  requiredEndpointPermissions: [
    "GET /v1/products and GET /v1/products/{productCode} (product metadata, priceOptions, bookingMode, confirmMode, bookingFields)",
    "GET /v1/availability?productCode={code}&startTimeLocal=...&endTimeLocal=... (session inventory, seats, seatsAvailable)",
    "GET /v1/bookings?resellerReference={ref}&limit=100 (idempotent duplicate recovery by deterministic resellerReference)",
    "GET /v1/bookings/{orderNumber} (retrieve full booking object prior to PUT update and for reconciliation)",
    "POST /v1/bookings (create PROCESSING hold or CONFIRMED booking with customer, items, quantities, participants, fields, pickupLocation)",
    "PUT /v1/bookings/{orderNumber} (submit complete retrieved booking object with permitted changes)",
    "DELETE /v1/bookings/{orderNumber} (cancel hold or confirmed booking and release held session inventory)",
  ],
  liveCredentialCapabilityAudit: {
    auditedAt: "2026-10-30T06:09:29Z",
    credentialType: "Live Production Supplier API Key (GoSno Mountain Transportation, supplierId: 230001, supplierAlias: gosnotransportation58)",
    authorizedOperationsVerifiedByLiveGet: [
      { endpoint: "GET https://api.rezdy.com/v1/products/{productCode}", status: 200, authorized: true },
      { endpoint: "GET https://api.rezdy.com/v1/availability", status: 200, authorized: true },
      { endpoint: "GET https://api.rezdy.com/v1/bookings?limit=1", status: 200, authorized: true, notes: "Returns full RezdyV1Booking objects including items, quantities, participants, fields, payments, dateCreated, dateConfirmed, datePaid" },
      { endpoint: "GET https://api.rezdy.com/v1/categories?limit=3", status: 200, authorized: true },
      { endpoint: "GET https://api.rezdy.com/v1/companies", status: 404, authorized: false, notes: "Not a valid v1 endpoint; supplier identity is embedded on /v1/products and /v1/bookings" },
    ],
    writeOperationsPolicy: {
      liveProductionEndpoint: "https://api.rezdy.com/v1/bookings",
      credentialWriteCapableInProd: true,
      dccExecutionPolicy: "DISABLED_BY_SAFETY_BOUNDARY — DCC never executes POST/PUT/DELETE against GoSno's live production Rezdy account during testing so zero live or paid production bookings are created.",
      stagingSandboxEndpoint: "https://api.rezdy-staging.com/v1/products",
      stagingProbeStatus: 401,
      stagingProbeError: { errorCode: "4", errorMessage: "Invalid API Key" },
      blockerSummary: "Production Rezdy API keys are rejected by api.rezdy-staging.com with HTTP 401 (errorCode 4). Provider-hosted write tests require provisioning REZDY_STAGING_API_KEY in app.rezdy-staging.com.",
    },
  },
} as const;

/**
 * Canonical GoSno <-> DCC <-> Rezdy v1 Product & Route Mapping Registry
 * Derived from GoSno's authoritative route registry and verified against live Rezdy GET /v1/products/{code}.
 */
export interface GosnoDccProductMapping {
  dccProductId: string;
  routeId: string;
  rezdyProductCode: string;
  internalCode: string;
  title: string;
  origin: string;
  destination: string;
  direction: "OUTBOUND" | "RETURN";
  vehicleClass: "suv" | "van";
  maxPassengers: number;
  optionId: string;
  unitId: string;
  canonicalQuantityLabel: string;
  priceOptionId: number;
  priceDollars: number;
  priceCents: number;
  currency: "USD";
  durationMinutes: number;
  onlineBookable: boolean;
  quoteOnly: boolean;
  meetingPoint: string;
}

export const GOSNO_DCC_PRODUCT_MAPPINGS: readonly GosnoDccProductMapping[] = [
  {
    dccProductId: "dcc:gosno:den-breckenridge:suv",
    routeId: "DEN-BRECKENRIDGE",
    rezdyProductCode: "P7477S",
    internalCode: "denver-to-breckenridge-private-suv",
    title: "Denver Airport to Breckenridge — Private SUV Transfer",
    origin: "DEN",
    destination: "Breckenridge",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_69029050",
    unitId: "unit_suburban_69029050",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029050,
    priceDollars: 399,
    priceCents: 39900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-vail:suv",
    routeId: "DEN-VAIL",
    rezdyProductCode: "PXFGPP",
    internalCode: "denver-to-vail-private-suv",
    title: "Denver Airport to Vail — Private SUV Transfer",
    origin: "DEN",
    destination: "Vail",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_75298226",
    unitId: "unit_suburban_75298226",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 75298226,
    priceDollars: 499,
    priceCents: 49900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:snowmass-den:suv",
    routeId: "SNOWMASS-DEN",
    rezdyProductCode: "PEAVH0",
    internalCode: "GOSNO_SNOWMASS_DEN_SUV",
    title: "Snowmass to Denver Airport — Private SUV Transfer",
    origin: "Snowmass",
    destination: "DEN",
    direction: "RETURN",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_group_76622153",
    unitId: "unit_group_76622153",
    canonicalQuantityLabel: "Group from 1 to 2",
    priceOptionId: 76622153,
    priceDollars: 699,
    priceCents: 69900,
    currency: "USD",
    durationMinutes: 240,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "Confirmed lodging, condo, or private residence access point",
  },
  {
    dccProductId: "dcc:gosno:den-breckenridge:van",
    routeId: "DEN-BRECKENRIDGE-VAN",
    rezdyProductCode: "PKQDPG",
    internalCode: "GOSNO_DEN_BRECKENRIDGE_VAN",
    title: "Denver International Airport (DEN) to Breckenridge - Private Van Transfer",
    origin: "DEN",
    destination: "Breckenridge",
    direction: "OUTBOUND",
    vehicleClass: "van",
    maxPassengers: 10,
    optionId: "opt_van_73379226",
    unitId: "unit_van_73379226",
    canonicalQuantityLabel: "Private Van 10ppl",
    priceOptionId: 73379226,
    priceDollars: 599,
    priceCents: 59900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: false,
    quoteOnly: true,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-beaver-creek:suv",
    routeId: "DEN-BEAVER-CREEK",
    rezdyProductCode: "P9AP71",
    internalCode: "denver-to-beaver-creek-private-suv",
    title: "Denver Airport to Beaver Creek — Private SUV Transfer",
    origin: "DEN",
    destination: "Beaver Creek",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_p9ap71",
    unitId: "unit_suburban_p9ap71",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029051,
    priceDollars: 549,
    priceCents: 54900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-keystone:suv",
    routeId: "DEN-KEYSTONE",
    rezdyProductCode: "P9PQRN",
    internalCode: "denver-to-keystone-private-suv",
    title: "Denver Airport to Keystone — Private SUV Transfer",
    origin: "DEN",
    destination: "Keystone",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_p9pqrn",
    unitId: "unit_suburban_p9pqrn",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029052,
    priceDollars: 349,
    priceCents: 34900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-copper:suv",
    routeId: "DEN-COPPER",
    rezdyProductCode: "PHCYQL",
    internalCode: "denver-to-copper-private-suv",
    title: "Denver Airport to Copper Mountain — Private SUV Transfer",
    origin: "DEN",
    destination: "Copper Mountain",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_phcyql",
    unitId: "unit_suburban_phcyql",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029053,
    priceDollars: 399,
    priceCents: 39900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-winter-park:suv",
    routeId: "DEN-WINTER-PARK",
    rezdyProductCode: "P360K5",
    internalCode: "denver-to-winter-park-private-suv",
    title: "Denver Airport to Winter Park — Private SUV Transfer",
    origin: "DEN",
    destination: "Winter Park",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_p360k5",
    unitId: "unit_suburban_p360k5",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029054,
    priceDollars: 349,
    priceCents: 34900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-steamboat:suv",
    routeId: "DEN-STEAMBOAT",
    rezdyProductCode: "PEZN8V",
    internalCode: "denver-to-steamboat-private-suv",
    title: "Denver Airport to Steamboat Springs — Private SUV Transfer",
    origin: "DEN",
    destination: "Steamboat Springs",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_pezn8v",
    unitId: "unit_suburban_pezn8v",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029055,
    priceDollars: 599,
    priceCents: 59900,
    currency: "USD",
    durationMinutes: 180,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-aspen:suv",
    routeId: "DEN-ASPEN",
    rezdyProductCode: "P11TWN",
    internalCode: "denver-to-aspen-private-suv",
    title: "Denver Airport to Aspen — Private SUV Transfer",
    origin: "DEN",
    destination: "Aspen",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_p11twn",
    unitId: "unit_suburban_p11twn",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029056,
    priceDollars: 699,
    priceCents: 69900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-snowmass:suv",
    routeId: "DEN-SNOWMASS",
    rezdyProductCode: "PP1A72",
    internalCode: "denver-to-snowmass-private-suv",
    title: "Denver Airport to Snowmass — Private SUV Transfer",
    origin: "DEN",
    destination: "Snowmass",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_pp1a72",
    unitId: "unit_suburban_pp1a72",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029057,
    priceDollars: 699,
    priceCents: 69900,
    currency: "USD",
    durationMinutes: 240,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
] as const;

export function resolveGosnoRezdyProductMapping(
  identifier: string | null | undefined,
): GosnoDccProductMapping | null {
  if (!identifier) return null;
  const trimmed = identifier.trim();
  const upper = trimmed.toUpperCase();
  const normalizedRoute = upper.replace(/_/g, "-");

  for (const mapping of GOSNO_DCC_PRODUCT_MAPPINGS) {
    if (
      mapping.dccProductId.toLowerCase() === trimmed.toLowerCase() ||
      mapping.rezdyProductCode.toUpperCase() === upper ||
      mapping.routeId.toUpperCase() === normalizedRoute ||
      mapping.internalCode.toLowerCase() === trimmed.toLowerCase()
    ) {
      return mapping;
    }
  }
  return null;
}

/**
 * Deterministic, compact, URL-safe Rezdy resellerReference generator (max 26 chars).
 */
export function buildDccRezdyResellerReference(seed: string): string {
  if (!seed || !seed.trim()) {
    throw new OctoApiError(400, "MISSING_RESELLER_REFERENCE_SEED", "Seed is required to build a deterministic Rezdy resellerReference");
  }
  const digest = crypto.createHash("sha256").update(seed.trim()).digest("base64url").slice(0, 22);
  return `DCC-${digest}`;
}

/**
 * Strictly parses an explicit Rezdy local datetime (`YYYY-MM-DD HH:mm:ss` or `YYYY-MM-DDTHH:mm:ss`).
 * NEVER invents a fallback time (such as `10:00:00`) when only a date or session ID is passed.
 */
export function parseStrictRezdyDateTimeLocal(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  const fullMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})$/);
  if (fullMatch) {
    return `${fullMatch[1]} ${fullMatch[2]}`;
  }
  const minuteMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})$/);
  if (minuteMatch) {
    return `${minuteMatch[1]} ${minuteMatch[2]}:00`;
  }
  return null;
}

/**
 * Builds a canonical, stateless availability slot ID encoding productCode, sessionId, and startTimeLocal
 * so separate server instances can resolve the exact Rezdy session without any in-memory session cache.
 */
export function formatCanonicalRezdySlotId(
  productCode: string,
  sessionId: number | string,
  startTimeLocal: string,
): string {
  const strictTime = parseStrictRezdyDateTimeLocal(startTimeLocal);
  if (!strictTime) {
    throw new OctoApiError(
      502,
      "INVALID_REZDY_SESSION_START_TIME",
      `Rezdy session ${sessionId} for ${productCode} has invalid startTimeLocal '${startTimeLocal}'`,
    );
  }
  return `rezdy_sess_${productCode}_${sessionId}_${strictTime.replace(" ", "T")}`;
}

/**
 * Parses a canonical stateless Rezdy slot ID or an explicit datetime locator.
 * Returns null if the input lacks an explicit departure datetime (preventing invented departure times).
 */
export function parseStatelessRezdyAvailabilityLocator(
  availabilityId: string,
): {
  productCode?: string;
  sessionId?: number;
  startTimeLocal: string;
  datePart: string;
} | null {
  if (!availabilityId || typeof availabilityId !== "string") return null;
  const trimmed = availabilityId.trim();

  // Format 1: rezdy_sess_<productCode>_<sessionId>_<YYYY-MM-DDTHH:mm:ss>
  const canonicalMatch = trimmed.match(
    /^rezdy_sess_([A-Za-z0-9_-]+)_(\d+)_(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?)$/,
  );
  if (canonicalMatch) {
    const startTimeLocal = parseStrictRezdyDateTimeLocal(canonicalMatch[3]);
    if (!startTimeLocal) return null;
    return {
      productCode: canonicalMatch[1],
      sessionId: Number(canonicalMatch[2]),
      startTimeLocal,
      datePart: startTimeLocal.slice(0, 10),
    };
  }

  // Format 2: <sessionId>@<YYYY-MM-DD HH:mm:ss>
  const atMatch = trimmed.match(/^(\d+)@(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?)$/);
  if (atMatch) {
    const startTimeLocal = parseStrictRezdyDateTimeLocal(atMatch[2]);
    if (!startTimeLocal) return null;
    return {
      sessionId: Number(atMatch[1]),
      startTimeLocal,
      datePart: startTimeLocal.slice(0, 10),
    };
  }

  // Format 3: Explicit datetime YYYY-MM-DD HH:mm:ss or YYYY-MM-DDTHH:mm:ss
  const directTime = parseStrictRezdyDateTimeLocal(trimmed);
  if (directTime) {
    return {
      startTimeLocal: directTime,
      datePart: directTime.slice(0, 10),
    };
  }

  return null;
}

/**
 * Validates required customer contact fields for executable Rezdy booking operations.
 * Refuses to invent dummy customer names, emails, or phone numbers.
 */
export function validateRequiredRezdyCustomer(
  contact: OctoContact | undefined | null,
  operationName: string,
): RezdyV1Customer {
  if (!contact || typeof contact !== "object") {
    throw new OctoApiError(
      400,
      "MISSING_CUSTOMER_DETAILS",
      `${operationName} requires customer contact details (firstName, lastName, emailAddress); refusing to substitute dummy customer details.`,
    );
  }

  const rawFull = typeof contact.fullName === "string" ? contact.fullName.trim().replace(/\s+/g, " ") : "";
  const fullParts = rawFull ? rawFull.split(" ") : [];

  const firstName = (contact.firstName || fullParts[0] || "").trim();
  const lastName = (
    contact.lastName ||
    (fullParts.length > 1 ? fullParts.slice(1).join(" ") : "")
  ).trim();
  const email = typeof contact.emailAddress === "string" ? contact.emailAddress.trim() : "";
  const phone = typeof contact.phoneNumber === "string" ? contact.phoneNumber.trim() : undefined;

  if (!firstName || !lastName) {
    throw new OctoApiError(
      400,
      "MISSING_CUSTOMER_NAME",
      `${operationName} requires both customer firstName and lastName (or a multi-word fullName); refusing to invent placeholder names.`,
    );
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new OctoApiError(
      400,
      "MISSING_CUSTOMER_EMAIL",
      `${operationName} requires a valid customer emailAddress; refusing to substitute a dummy email address.`,
    );
  }

  return {
    firstName,
    lastName,
    email,
    ...(phone ? { phone } : {}),
  };
}

/**
 * Maps Rezdy native booking statuses to OCTO booking statuses without mapping unfamiliar statuses to ON_HOLD.
 */
export function mapRezdyStatusToOctoStatus(
  rawStatus: string | undefined,
  orderNumber: string,
): OctoBookingStatus {
  const normalized = typeof rawStatus === "string" ? rawStatus.trim().toUpperCase() : "";
  switch (normalized) {
    case "PROCESSING":
    case "ON_HOLD":
    case "NEW":
      return "ON_HOLD";
    case "CONFIRMED":
      return "CONFIRMED";
    case "CANCELLED":
      return "CANCELLED";
    case "ABANDONED":
    case "ABANDONED_CART":
      return "EXPIRED";
    case "WAITING_SUPPLIER":
    case "WAITING_CUSTOMER":
    case "PENDING_SUPPLIER":
    case "PENDING_CUSTOMER":
      return "PENDING";
    case "REJECTED":
    case "DECLINED":
      return "REJECTED";
    default:
      throw new OctoApiError(
        502,
        "UNRECOGNIZED_REZDY_BOOKING_STATUS",
        `Rezdy returned unrecognized booking status '${String(rawStatus)}' for order ${orderNumber}`,
      );
  }
}

function redactRezdyUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.searchParams.has("apiKey")) {
      parsed.searchParams.set("apiKey", "[REDACTED]");
    }
    if (parsed.searchParams.has("token")) {
      parsed.searchParams.set("token", "[REDACTED]");
    }
    return parsed.toString();
  } catch {
    return rawUrl.replace(/apiKey=[^&]+/g, "apiKey=[REDACTED]");
  }
}

function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const copy: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (/apikey|authorization|token/i.test(k)) {
      copy[k] = "[REDACTED]";
    } else {
      copy[k] = v;
    }
  }
  return copy;
}

/**
 * Stateless Rezdy Native REST API v1 Adapter implementing DCC's `OctoProviderAdapter` interface.
 *
 * Key Guarantees:
 * - Zero in-memory session or booking caches: every operation works across independent requests and server instances.
 * - Full-object PUT updates: `confirmBooking` and `updateBooking` retrieve the existing booking via `GET /v1/bookings/{orderNumber}`,
 *   preserve `items`, `quantities`, `participants`, `fields`, `pickupId`, `pickupLocation`, `payments`, and `customer`,
 *   apply permitted updates, and submit the complete object via `PUT /v1/bookings/{orderNumber}`.
 * - No invented fallbacks: missing prices, option labels, departure times, product codes, or customer details fail closed with explicit `OctoApiError`s.
 * - Truthful availability & hold states: quote-only products (`QUOTE_ONLY`) and dates with zero returned sessions (`[]`) are never labeled `SOLD_OUT` or given invented `10:00:00` departure times; hold expiry is derived deterministically from `dateCreated`, never regenerated from `Date.now()` on retrieval.
 */
export class RezdyAdapter extends BaseOctoAdapter {
  private capturedExchanges: RezdyCapturedExchange[] = [];

  constructor(config: OctoClientConfig & { requestTimeoutMs?: number }) {
    super({
      ...config,
      timeoutMs: config.timeoutMs ?? config.requestTimeoutMs,
      platform: "rezdy",
      headers: {
        "X-Rezdy-Integration": "DCC-Rezdy-v1",
        ...(config.headers || {}),
      },
    });
  }

  public getCapturedExchanges(): RezdyCapturedExchange[] {
    return [...this.capturedExchanges];
  }

  public clearCapturedExchanges(): void {
    this.capturedExchanges = [];
  }

  private classifyEndpointEvidenceClass(): RezdyCapturedExchange["evidenceClass"] {
    if (this.endpoint.includes("127.0.0.1") || this.endpoint.includes("localhost")) {
      return "dcc_written_local_simulator";
    }
    if (this.endpoint.includes("rezdy-staging.com")) {
      return "rezdy_hosted_staging_sandbox";
    }
    return "live_rezdy_v1_read_only";
  }

  protected override getAuthHeaders(idempotencyKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "DestinationCommandCenter-Rezdy-v1/1.1",
      ...this.customHeaders,
    };
    if (this.apiKey) {
      headers["apiKey"] = this.apiKey;
    }
    if (idempotencyKey) {
      headers["X-DCC-Idempotency-Key"] = idempotencyKey;
    }
    return headers;
  }

  private buildRezdyV1Url(path: string, queryParams?: Record<string, string | number | undefined>): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const base = this.endpoint.replace(/\/+$/, "");
    const v1Base = base.endsWith("/v1") || base.includes("rezdy-admin") ? base : `${base}/v1`;

    if (v1Base.includes("rezdy-admin")) {
      const url = new URL(v1Base);
      url.searchParams.set("path", normalizedPath);
      if (this.apiKey && !url.searchParams.has("token")) {
        url.searchParams.set("token", this.apiKey);
      }
      if (queryParams) {
        for (const [k, v] of Object.entries(queryParams)) {
          if (v !== undefined) url.searchParams.set(k, String(v));
        }
      }
      return url.toString();
    }

    const url = new URL(`${v1Base}${normalizedPath}`);
    if (this.apiKey) {
      url.searchParams.set("apiKey", this.apiKey);
    }
    if (queryParams) {
      for (const [k, v] of Object.entries(queryParams)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  protected async rezdyRequest<T = any>(
    stepName: string,
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    options?: {
      query?: Record<string, string | number | undefined>;
      body?: unknown;
      idempotencyKey?: string;
    },
  ): Promise<T> {
    // Safety guardrail: never execute mutating POST/PUT/DELETE against live production Rezdy
    const evidenceClass = this.classifyEndpointEvidenceClass();
    if (method !== "GET" && evidenceClass === "live_rezdy_v1_read_only") {
      throw new OctoApiError(
        403,
        "LIVE_PRODUCTION_WRITE_DISABLED",
        `Refusing to execute mutating ${method} ${path} against live production Rezdy endpoint (${this.endpoint}) while direct production sales are disabled.`,
      );
    }

    const url = this.buildRezdyV1Url(path, options?.query);
    const headers = this.getAuthHeaders(options?.idempotencyKey);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      const rawText = await res.text();
      let parsed: any = null;
      try {
        parsed = rawText ? JSON.parse(rawText) : {};
      } catch {
        parsed = { rawText };
      }

      const payload =
        parsed && typeof parsed === "object" && "ok" in parsed && "data" in parsed && parsed.data?.requestStatus
          ? parsed.data
          : parsed;
      const effectiveStatus =
        parsed && typeof parsed === "object" && typeof parsed.status === "number" && "data" in parsed
          ? parsed.status
          : res.status;

      this.capturedExchanges.push({
        step: stepName,
        timestamp: new Date().toISOString(),
        evidenceClass,
        request: {
          method,
          urlRedacted: redactRezdyUrl(url),
          headersRedacted: redactHeaders(headers),
          body: options?.body ?? null,
        },
        response: {
          status: effectiveStatus,
          body: payload,
        },
      });

      const reqStatus: RezdyV1RequestStatus | undefined = payload?.requestStatus;
      if (effectiveStatus >= 400 || (reqStatus && reqStatus.success === false)) {
        const errCode = reqStatus?.error?.errorCode
          ? `REZDY_ERR_${reqStatus.error.errorCode}`
          : `HTTP_${effectiveStatus}`;
        const errMsg =
          reqStatus?.error?.errorMessage ||
          payload?.error ||
          payload?.message ||
          res.statusText ||
          "Rezdy v1 API error";
        const mappedStatus =
          reqStatus?.error?.errorCode === "4" || /invalid api key/i.test(String(errMsg))
            ? 401
            : effectiveStatus >= 400
            ? effectiveStatus
            : 400;
        throw new OctoApiError(mappedStatus, errCode, String(errMsg), payload);
      }

      return payload as T;
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new OctoApiError(504, "PROVIDER_TIMEOUT", `Rezdy v1 endpoint timed out after ${this.timeoutMs}ms`);
      }
      if (err instanceof OctoApiError) {
        throw err;
      }
      throw new OctoApiError(502, "CONNECTION_FAILED", err.message || "Failed to communicate with Rezdy v1 API");
    } finally {
      clearTimeout(timer);
    }
  }

  private translateRezdyProductToOcto(
    rezdyProd: RezdyV1Product,
    mapping?: GosnoDccProductMapping | null,
  ): OctoProduct {
    const resolvedMapping = mapping ?? resolveGosnoRezdyProductMapping(rezdyProd.productCode);
    const priceOptions = Array.isArray(rezdyProd.priceOptions) ? rezdyProd.priceOptions : [];
    if (priceOptions.length === 0) {
      throw new OctoApiError(
        422,
        "MISSING_REZDY_PRICE_OPTIONS",
        `Rezdy product ${rezdyProd.productCode} returned no priceOptions`,
      );
    }

    const currency = rezdyProd.currency || resolvedMapping?.currency;
    if (!currency) {
      throw new OctoApiError(
        422,
        "MISSING_REZDY_PRODUCT_CURRENCY",
        `Rezdy product ${rezdyProd.productCode} is missing currency`,
      );
    }

    const options = priceOptions.map((po, idx) => {
      if (!po.label || !po.label.trim() || !Number.isFinite(Number(po.price)) || Number(po.price) <= 0) {
        throw new OctoApiError(
          422,
          "INVALID_REZDY_PRICE_OPTION",
          `Rezdy product ${rezdyProd.productCode} has a priceOption with missing label or non-positive price`,
        );
      }

      const optionId =
        idx === 0 && resolvedMapping
          ? resolvedMapping.optionId
          : `opt_rezdy_${po.id || po.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
      const unitId =
        idx === 0 && resolvedMapping
          ? resolvedMapping.unitId
          : `unit_rezdy_${po.id || po.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

      return {
        id: optionId,
        default: idx === 0,
        internalName: po.label,
        reference: po.label,
        title: `${rezdyProd.name} (${po.label})`,
        description: rezdyProd.shortDescription || rezdyProd.description,
        units: [
          {
            id: unitId,
            internalName: po.label,
            reference: String(po.id || po.label),
            type: "OTHER" as const,
            pricingFrom: [
              {
                original: Number(po.price),
                retail: Number(po.price),
                currency,
                currencyPrecision: 2,
                includedTaxesAndFees: false,
              },
            ],
            restrictions: {
              minQuantity: po.minQuantity ?? rezdyProd.quantityRequiredMin ?? 1,
              maxQuantity: po.maxQuantity ?? rezdyProd.quantityRequiredMax ?? 1,
            },
          },
        ],
        requiredContactFields: ["firstName", "lastName", "emailAddress", "phoneNumber"],
      };
    });

    const primaryOption = priceOptions[0];
    const primaryPrice = Number(primaryOption.price);
    const isQuoteOnly = Boolean(
      resolvedMapping?.quoteOnly ||
        resolvedMapping?.onlineBookable === false ||
        rezdyProd.bookingMode === "DATE_ENQUIRY" ||
        rezdyProd.bookingMode === "NO_DATE",
    );

    return {
      id: resolvedMapping?.dccProductId || rezdyProd.productCode,
      internalName: rezdyProd.internalCode || rezdyProd.productCode,
      reference: rezdyProd.productCode,
      title: rezdyProd.name,
      description: rezdyProd.description || rezdyProd.shortDescription,
      country: "US",
      location: resolvedMapping ? `${resolvedMapping.origin} -> ${resolvedMapping.destination}` : undefined,
      destinationSlug: resolvedMapping?.destination.toLowerCase().replace(/\s+/g, "-"),
      timeZone: "America/Denver",
      defaultCurrency: currency,
      options,
      capabilities: ["octo/core", "octo/pricing"],
      durationMinutes: rezdyProd.durationMinutes ?? resolvedMapping?.durationMinutes,
      meetingPoint: resolvedMapping?.meetingPoint,
      providerExternalIds: {
        rezdyLocation: "colorado",
        custom: {
          rezdyProductCode: rezdyProd.productCode,
          routeId: resolvedMapping?.routeId || rezdyProd.productCode,
          vehicleClass: resolvedMapping?.vehicleClass || "unknown",
          maxPassengers: resolvedMapping?.maxPassengers || 0,
          canonicalQuantityLabel: primaryOption.label,
          priceDollars: primaryPrice,
          priceCents: Math.round(primaryPrice * 100),
          quoteOnly: isQuoteOnly ? 1 : 0,
          onlineBookable: isQuoteOnly ? 0 : 1,
        },
      },
    };
  }

  override async getSupplier(): Promise<Record<string, unknown>> {
    const products = await this.getProducts();
    return {
      id: "gosno-rezdy-v1",
      name: "GoSno Mountain Transportation (Rezdy Native REST API v1)",
      endpoint: this.endpoint,
      platform: "rezdy",
      productCount: products.length,
    };
  }

  override async getProducts(): Promise<OctoProduct[]> {
    const data = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      products?: RezdyV1Product[];
    }>("getProducts", "/products", "GET", { query: { limit: 100 } });

    const products = Array.isArray(data.products) ? data.products : [];
    return products.map((p) => this.translateRezdyProductToOcto(p));
  }

  override async getProduct(productId: string): Promise<OctoProduct> {
    if (!productId || !productId.trim()) {
      throw new OctoApiError(400, "MISSING_PRODUCT_ID", "productId is required");
    }
    const mapping = resolveGosnoRezdyProductMapping(productId);
    const rezdyProductCode = mapping?.rezdyProductCode || productId.trim();

    const data = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      product?: RezdyV1Product;
    }>(`getProduct:${rezdyProductCode}`, `/products/${encodeURIComponent(rezdyProductCode)}`, "GET");

    if (!data.product || !data.product.productCode) {
      throw new OctoApiError(404, "INVALID_PRODUCT_ID", `Rezdy product ${rezdyProductCode} not found`);
    }

    const usableOption = data.product.priceOptions?.find((po) => po.label && po.label.trim().length > 0);
    if (!usableOption) {
      throw new OctoApiError(
        422,
        "MISSING_REZDY_PRICE_OPTION_LABEL",
        `Rezdy product ${rezdyProductCode} has no usable booking price option label`,
      );
    }

    return this.translateRezdyProductToOcto(data.product, mapping);
  }

  override async getAvailabilityCalendar(
    productId: string,
    optionId: string,
    localDateStart: string,
    localDateEnd: string,
  ): Promise<OctoAvailabilitySlot[]> {
    const mapping = resolveGosnoRezdyProductMapping(productId);
    const rezdyProductCode = mapping?.rezdyProductCode || productId;
    const startTimeLocal = `${localDateStart.slice(0, 10)} 00:00:00`;
    const endTimeLocal = `${localDateEnd.slice(0, 10)} 23:59:59`;

    const data = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      sessions?: RezdyV1Session[];
    }>(`getAvailabilityCalendar:${rezdyProductCode}`, "/availability", "GET", {
      query: {
        productCode: rezdyProductCode,
        startTimeLocal,
        endTimeLocal,
      },
    });

    return this.translateSessionsToSlots(
      rezdyProductCode,
      optionId,
      data.sessions || [],
      mapping,
      [],
    );
  }

  override async checkAvailability(
    productId: string,
    optionId: string,
    localDate: string,
    unitItems: OctoUnitItemRequest[] = [],
  ): Promise<OctoAvailabilitySlot[]> {
    if (!productId || !productId.trim()) {
      throw new OctoApiError(400, "MISSING_PRODUCT_ID", "productId is required for checkAvailability");
    }
    const mapping = resolveGosnoRezdyProductMapping(productId);
    const rezdyProductCode = mapping?.rezdyProductCode || productId.trim();
    const datePart = localDate.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      throw new OctoApiError(400, "INVALID_DATE_FORMAT", `Invalid localDate '${localDate}'; expected YYYY-MM-DD`);
    }

    const startTimeLocal = `${datePart} 00:00:00`;
    const endTimeLocal = `${datePart} 23:59:59`;

    const data = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      sessions?: RezdyV1Session[];
    }>(`checkAvailability:${rezdyProductCode}:${datePart}`, "/availability", "GET", {
      query: {
        productCode: rezdyProductCode,
        startTimeLocal,
        endTimeLocal,
      },
    });

    return this.translateSessionsToSlots(
      rezdyProductCode,
      optionId,
      data.sessions || [],
      mapping,
      unitItems,
    );
  }

  /**
   * Translates Rezdy v1 sessions into OCTO availability slots:
   * - Never invents a departure time or synthetic slot when `sessions.length === 0` (returns `[]`).
   * - Never labels quote-only products as `SOLD_OUT` (uses `QUOTE_ONLY` if a session exists, or `[]` if no sessions exist).
   * - Never falls back to `$399` or `"Suburban"` if session/product pricing is missing.
   * - Encodes a stateless canonical slot ID (`rezdy_sess_<code>_<sessionId>_<YYYY-MM-DDTHH:mm:ss>`) so `createBookingHold`
   *   works across independent server instances without any in-memory session cache.
   */
  private translateSessionsToSlots(
    rezdyProductCode: string,
    optionId: string,
    sessions: RezdyV1Session[],
    mapping: GosnoDccProductMapping | null,
    unitItems: OctoUnitItemRequest[],
  ): Array<OctoAvailabilitySlot & { quoteOnly?: boolean; reason?: string; rezdyProductCode?: string; sessionId?: number }> {
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return [];
    }

    const requestedUnits = Math.max(
      1,
      unitItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
    );
    const requestedPassengers = unitItems.reduce(
      (sum, item) => sum + Number((item as any).passengers || 0),
      0,
    );

    const isQuoteOnly = Boolean(mapping?.quoteOnly || mapping?.onlineBookable === false);
    const exceedsMaxPassengers =
      mapping != null && requestedPassengers > 0 && requestedPassengers > mapping.maxPassengers;

    return sessions.map((session) => {
      if (session.id == null || !session.startTimeLocal) {
        throw new OctoApiError(
          502,
          "INVALID_REZDY_SESSION",
          `Rezdy session for ${rezdyProductCode} is missing id or startTimeLocal`,
        );
      }

      const strictStart = parseStrictRezdyDateTimeLocal(session.startTimeLocal);
      if (!strictStart) {
        throw new OctoApiError(
          502,
          "INVALID_REZDY_SESSION_DATETIME",
          `Rezdy session ${session.id} has unparseable startTimeLocal '${session.startTimeLocal}'`,
        );
      }

      const seatsAvailable = Number(session.seatsAvailable ?? 0);
      const seatsTotal = Number(session.seats ?? 0);
      const po = session.priceOptions?.[0];
      const rawPrice = po?.price ?? mapping?.priceDollars;
      const optionLabel = po?.label || mapping?.canonicalQuantityLabel;

      if (rawPrice == null || !Number.isFinite(Number(rawPrice)) || Number(rawPrice) <= 0 || !optionLabel) {
        throw new OctoApiError(
          422,
          "MISSING_REZDY_SESSION_PRICING",
          `Rezdy session ${session.id} for ${rezdyProductCode} is missing priceOption price or label`,
        );
      }

      const priceDollars = Number(rawPrice);
      const unitId = mapping?.unitId || `unit_rezdy_${po?.id || optionLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

      let status: OctoAvailabilityStatus;
      let slotAvailable = false;
      let reason: string | undefined;

      if (isQuoteOnly) {
        status = "QUOTE_ONLY";
        slotAvailable = false;
        reason = "QUOTE_ONLY_PRODUCT";
      } else if (seatsAvailable <= 0) {
        status = "SOLD_OUT";
        slotAvailable = false;
        reason = "ZERO_SEATS_AVAILABLE";
      } else if (exceedsMaxPassengers) {
        status = "CAPACITY_EXCEEDED";
        slotAvailable = false;
        reason = "MAX_PASSENGERS_EXCEEDED";
      } else if (seatsAvailable < requestedUnits) {
        status = "CAPACITY_EXCEEDED";
        slotAvailable = false;
        reason = "INSUFFICIENT_SEATS";
      } else {
        status = "AVAILABLE";
        slotAvailable = true;
      }

      const canonicalId = formatCanonicalRezdySlotId(rezdyProductCode, session.id, strictStart);

      return {
        id: canonicalId,
        sessionId: Number(session.id),
        localDateTimeStart: strictStart,
        localDateTimeEnd: session.endTimeLocal ? (parseStrictRezdyDateTimeLocal(session.endTimeLocal) || session.endTimeLocal) : undefined,
        allDay: Boolean(session.allDay),
        available: slotAvailable,
        status,
        vacancies: isQuoteOnly ? null : Math.max(0, seatsAvailable),
        capacity: seatsTotal,
        maxUnits: mapping?.maxPassengers,
        unitPricing: [
          {
            unitId,
            pricing: {
              original: priceDollars,
              retail: priceDollars,
              currency: mapping?.currency || "USD",
              currencyPrecision: 2,
              includedTaxesAndFees: false,
            },
          },
        ],
        pickupAvailable: true,
        quoteOnly: isQuoteOnly,
        ...(reason ? { reason } : {}),
        rezdyProductCode,
      };
    });
  }

  /**
   * Look up existing Rezdy bookings by deterministic `resellerReference` for duplicate-request protection.
   */
  public async fetchBookingsByResellerReference(resellerReference: string): Promise<RezdyV1Booking[]> {
    const data = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      bookings?: RezdyV1Booking[];
    }>(`fetchBookingsByResellerReference:${resellerReference}`, "/bookings", "GET", {
      query: {
        resellerReference,
        limit: 100,
      },
    });
    return Array.isArray(data.bookings) ? data.bookings : [];
  }

  /**
   * Retrieve the full authoritative `RezdyV1Booking` object from `GET /v1/bookings/{orderNumber}`.
   */
  public async getRawRezdyBooking(orderNumber: string): Promise<RezdyV1Booking> {
    if (!orderNumber || !orderNumber.trim()) {
      throw new OctoApiError(400, "MISSING_ORDER_NUMBER", "Rezdy orderNumber is required");
    }
    const fetched = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      booking?: RezdyV1Booking;
    }>(`getBooking:${orderNumber}`, `/bookings/${encodeURIComponent(orderNumber)}`, "GET");

    if (!fetched.booking || !fetched.booking.orderNumber) {
      throw new OctoApiError(404, "BOOKING_NOT_FOUND", `Rezdy order ${orderNumber} not found`);
    }

    if (!Array.isArray(fetched.booking.items) || fetched.booking.items.length === 0) {
      throw new OctoApiError(
        502,
        "REZDY_BOOKING_MISSING_ITEMS",
        `Rezdy order ${orderNumber} returned without booking items`,
      );
    }

    return fetched.booking;
  }

  /**
   * Translates a native `RezdyV1Booking` into an `OctoBookingResult` without any invented fallbacks:
   * - Requires `items[0].productCode`, `items[0].startTimeLocal`, `items[0].quantities[0].optionLabel`, and finite `totalAmount`.
   * - Maps status strictly via `mapRezdyStatusToOctoStatus` (never mapping unfamiliar statuses to `ON_HOLD`).
   * - Computes `utcHoldExpires` deterministically from `booking.dateCreated` (never generating a fresh 15-minute expiry from `Date.now()`).
   */
  private translateRezdyBookingToOcto(
    booking: RezdyV1Booking,
    options?: {
      expirationMinutes?: number;
    },
  ): OctoBookingResult {
    if (!booking || !booking.orderNumber) {
      throw new OctoApiError(502, "INVALID_REZDY_BOOKING", "Rezdy booking object is missing orderNumber");
    }

    const firstItem = booking.items?.[0];
    if (!firstItem || !firstItem.productCode) {
      throw new OctoApiError(
        502,
        "REZDY_BOOKING_MISSING_PRODUCT_CODE",
        `Rezdy order ${booking.orderNumber} is missing items[0].productCode`,
      );
    }

    const firstQty = firstItem.quantities?.[0];
    if (!firstQty || !firstQty.optionLabel) {
      throw new OctoApiError(
        502,
        "REZDY_BOOKING_MISSING_OPTION_LABEL",
        `Rezdy order ${booking.orderNumber} is missing items[0].quantities[0].optionLabel`,
      );
    }

    if (!firstItem.startTimeLocal) {
      throw new OctoApiError(
        502,
        "REZDY_BOOKING_MISSING_START_TIME",
        `Rezdy order ${booking.orderNumber} is missing items[0].startTimeLocal`,
      );
    }

    const rawTotal = booking.totalAmount ?? firstItem.amount;
    if (rawTotal == null || !Number.isFinite(Number(rawTotal)) || Number(rawTotal) < 0) {
      throw new OctoApiError(
        502,
        "REZDY_BOOKING_MISSING_AMOUNT",
        `Rezdy order ${booking.orderNumber} is missing a valid totalAmount/item.amount`,
      );
    }

    const totalPrice = Number(rawTotal);
    const quantity = Math.max(1, Number(firstQty.value ?? 1));
    const unitPrice = Number((Number(firstItem.amount ?? totalPrice) / quantity).toFixed(2));
    const currency = booking.totalCurrency || "USD";

    const mapping = resolveGosnoRezdyProductMapping(firstItem.productCode);
    const productId = mapping?.dccProductId || firstItem.productCode;
    const optionId = mapping?.optionId || `opt_rezdy_${firstQty.optionLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    const availabilityId =
      firstItem.sessionId != null
        ? formatCanonicalRezdySlotId(firstItem.productCode, firstItem.sessionId, firstItem.startTimeLocal)
        : parseStrictRezdyDateTimeLocal(firstItem.startTimeLocal) || firstItem.startTimeLocal;

    let status = mapRezdyStatusToOctoStatus(booking.status, booking.orderNumber);
    let utcHoldExpires: string | null = null;
    let dccCheckoutDeadlineUtc: string | null = null;
    let dccCheckoutExpired = false;

    if (status === "ON_HOLD") {
      // Authoritative provider hold expiry is only populated if Rezdy explicitly supplies an expiry timestamp
      const explicitProviderExpiry =
        (booking as any).utcHoldExpires ||
        (booking as any).holdExpiresAt ||
        (booking as any).expiresAt ||
        null;
      if (
        typeof explicitProviderExpiry === "string" &&
        !Number.isNaN(Date.parse(explicitProviderExpiry))
      ) {
        const providerExpiresMs = Date.parse(explicitProviderExpiry);
        utcHoldExpires = new Date(providerExpiresMs).toISOString();
        if (Date.now() > providerExpiresMs) {
          status = "EXPIRED";
        }
      }

      // Separate DCC checkout deadline derived from booking.dateCreated (never conflated with provider hold expiry)
      if (booking.dateCreated && !Number.isNaN(Date.parse(booking.dateCreated))) {
        const createdMs = Date.parse(booking.dateCreated);
        const holdMinutes = options?.expirationMinutes ?? 15;
        const deadlineMs = createdMs + holdMinutes * 60 * 1000;
        dccCheckoutDeadlineUtc = new Date(deadlineMs).toISOString();
        dccCheckoutExpired = Date.now() > deadlineMs;
      }
    }

    const unitItems = Array.from({ length: quantity }, (_, idx) => ({
      uuid: `${booking.orderNumber}_item_${idx + 1}`,
      unitId: mapping?.unitId || firstQty.optionLabel,
      pricing: {
        original: unitPrice,
        retail: unitPrice,
        currency,
        currencyPrecision: 2,
        includedTaxesAndFees: false,
      },
    }));

    return {
      uuid: booking.orderNumber,
      status,
      utcHoldExpires,
      dccCheckoutDeadlineUtc,
      dccCheckoutExpired,
      productId,
      optionId,
      availabilityId,
      createdAt: booking.dateCreated,
      contact: booking.customer
        ? {
            fullName: `${booking.customer.firstName || ""} ${booking.customer.lastName || ""}`.trim(),
            firstName: booking.customer.firstName,
            lastName: booking.customer.lastName,
            emailAddress: booking.customer.email,
            phoneNumber: booking.customer.phone,
            notes: booking.comments,
          }
        : undefined,
      pickupLocation: firstItem.pickupLocation
        ? {
            pickupId: firstItem.pickupId ?? firstItem.pickupLocation.pickupId,
            locationName: firstItem.pickupLocation.locationName,
            address: firstItem.pickupLocation.address,
            latitude: firstItem.pickupLocation.latitude,
            longitude: firstItem.pickupLocation.longitude,
            pickupInstructions: firstItem.pickupLocation.pickupInstructions,
            pickupTime: firstItem.pickupLocation.pickupTime,
          }
        : undefined,
      customFields: Array.isArray(booking.fields)
        ? booking.fields.map((f) => ({
            label: f.label,
            value: f.value,
            requiredPerParticipant: f.requiredPerParticipant,
            requiredPerBooking: f.requiredPerBooking,
          }))
        : undefined,
      participants: firstItem.participants,
      unitItems,
      totalPrice,
      currency,
      supplierReference: booking.orderNumber,
      resellerReference: booking.resellerReference,
      confirmedAt: booking.dateConfirmed,
      cancelledAt: status === "CANCELLED" ? booking.dateUpdated : undefined,
      voucher:
        status === "CONFIRMED"
          ? {
              code: booking.orderNumber,
              redemptionInstructions:
                "Present Rezdy order number at GoSno private transfer pickup point.",
            }
          : undefined,
    };
  }

  private assertLiveProductionWriteAllowed(operation: string): void {
    const evidenceClass = this.classifyEndpointEvidenceClass();
    if (evidenceClass === "live_rezdy_v1_read_only") {
      throw new OctoApiError(
        403,
        "LIVE_PRODUCTION_WRITE_DISABLED",
        `Refusing to execute mutating ${operation} against live production Rezdy endpoint (${this.endpoint}) while direct production sales are disabled.`,
      );
    }
  }

  /**
   * Stateless Rezdy Booking Hold Creation (`POST /v1/bookings` with `status: "PROCESSING"`).
   * - Requires valid customer contact (`firstName`, `lastName`, `emailAddress`).
   * - Requires an explicit departure datetime or canonical slot ID in `availabilityId` (never invents `10:00:00`).
   * - Queries live `GET /v1/availability` to verify the session exists, has sufficient `seatsAvailable`,
   *   and resolves the authoritative `optionLabel` and `price` from Rezdy (without any in-memory session cache).
   */
  override async createBookingHold(
    params: OctoCreateHoldParams,
    idempotencyKey?: string,
  ): Promise<OctoBookingResult> {
    this.assertLiveProductionWriteAllowed("createBookingHold");

    if (!params.productId || !params.productId.trim()) {
      throw new OctoApiError(400, "MISSING_PRODUCT_ID", "productId is required to create a Rezdy booking hold");
    }
    if (!params.optionId || !params.optionId.trim()) {
      throw new OctoApiError(400, "MISSING_OPTION_ID", "optionId is required to create a Rezdy booking hold");
    }
    if (!Array.isArray(params.unitItems) || params.unitItems.length === 0) {
      throw new OctoApiError(400, "MISSING_UNIT_ITEMS", "At least one unitItem is required to create a Rezdy booking hold");
    }

    const totalQuantity = params.unitItems.reduce((sum, u) => sum + (Number(u.quantity) || 0), 0);
    if (!Number.isFinite(totalQuantity) || totalQuantity <= 0) {
      throw new OctoApiError(400, "INVALID_UNIT_QUANTITY", "unitItems quantity must be a positive integer");
    }

    const mapping = resolveGosnoRezdyProductMapping(params.productId);
    if (!mapping && params.productId.trim().toLowerCase().startsWith("dcc:")) {
      throw new OctoApiError(
        400,
        "UNMAPPED_PRODUCT_ID",
        `Product ID '${params.productId}' is not mapped to any verified Rezdy product code.`,
      );
    }
    if (mapping?.quoteOnly || mapping?.onlineBookable === false) {
      throw new OctoApiError(
        400,
        "QUOTE_ONLY_PRODUCT_NOT_BOOKABLE",
        `Product ${params.productId} (${mapping.rezdyProductCode}) is quote-only and cannot be booked online without a custom quote.`,
      );
    }

    const customer = validateRequiredRezdyCustomer(params.contact, "createBookingHold");

    const locator = parseStatelessRezdyAvailabilityLocator(params.availabilityId);
    if (!locator) {
      throw new OctoApiError(
        400,
        "MISSING_EXPLICIT_DEPARTURE_TIME",
        `availabilityId '${params.availabilityId}' does not contain an explicit session departure datetime (expected rezdy_sess_<code>_<sessionId>_<YYYY-MM-DDTHH:mm:ss> or YYYY-MM-DD HH:mm:ss). Refusing to invent a 10:00:00 departure time.`,
      );
    }

    const rezdyProductCode = mapping?.rezdyProductCode || params.productId.trim();
    if (locator.productCode && locator.productCode.toUpperCase() !== rezdyProductCode.toUpperCase()) {
      throw new OctoApiError(
        400,
        "PRODUCT_SESSION_MISMATCH",
        `availabilityId product '${locator.productCode}' does not match requested product '${rezdyProductCode}'`,
      );
    }

    // Stateless live session lookup via GET /v1/availability for that exact date
    const availData = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      sessions?: RezdyV1Session[];
    }>(`verifySessionForHold:${rezdyProductCode}:${locator.datePart}`, "/availability", "GET", {
      query: {
        productCode: rezdyProductCode,
        startTimeLocal: `${locator.datePart} 00:00:00`,
        endTimeLocal: `${locator.datePart} 23:59:59`,
      },
    });

    const sessions = Array.isArray(availData.sessions) ? availData.sessions : [];
    const matchedSession = sessions.find((s) => {
      const sStart = parseStrictRezdyDateTimeLocal(s.startTimeLocal);
      if (locator.sessionId != null && Number(s.id) !== locator.sessionId) {
        return false;
      }
      return sStart === locator.startTimeLocal;
    });

    if (!matchedSession) {
      throw new OctoApiError(
        400,
        "REZDY_SESSION_NOT_FOUND",
        `No Rezdy session found for product ${rezdyProductCode} at '${locator.startTimeLocal}'${locator.sessionId ? ` (sessionId ${locator.sessionId})` : ""}`,
      );
    }

    // Resolve price option strictly from the matched session or GET /v1/products/{code} (never fallback to $399 or "Suburban")
    let sessionPriceOption = matchedSession.priceOptions?.[0];
    if (!sessionPriceOption || !sessionPriceOption.label || !Number.isFinite(Number(sessionPriceOption.price))) {
      const prodData = await this.rezdyRequest<{
        requestStatus?: RezdyV1RequestStatus;
        product?: RezdyV1Product;
      }>(`getProductForHold:${rezdyProductCode}`, `/products/${encodeURIComponent(rezdyProductCode)}`, "GET");
      sessionPriceOption = prodData.product?.priceOptions?.[0];
    }

    if (
      !sessionPriceOption ||
      !sessionPriceOption.label ||
      !sessionPriceOption.label.trim() ||
      !Number.isFinite(Number(sessionPriceOption.price)) ||
      Number(sessionPriceOption.price) <= 0
    ) {
      throw new OctoApiError(
        422,
        "MISSING_REZDY_PRICE_OPTION",
        `Rezdy product ${rezdyProductCode} session ${matchedSession.id} has no valid priceOption label or price`,
      );
    }

    const optionLabel = sessionPriceOption.label.trim();
    const unitPriceDollars = Number(sessionPriceOption.price);
    const totalAmountDollars = Number((unitPriceDollars * totalQuantity).toFixed(2));

    const resellerReference = buildDccRezdyResellerReference(
      idempotencyKey || params.uuid || `${rezdyProductCode}:${matchedSession.id}:${locator.startTimeLocal}`,
    );

    // 1. Upstream Rezdy duplicate-request recovery via GET /v1/bookings?resellerReference=...
    // Checked BEFORE seatsAvailable exhaustion so an idempotent retry of a hold that consumed the last seat reconciles cleanly.
    const existingBookings = await this.fetchBookingsByResellerReference(resellerReference);
    const activeExisting = existingBookings.find((b) => b.status !== "CANCELLED");
    if (activeExisting) {
      const existingItem = activeExisting.items?.[0];
      const existingQty = existingItem?.quantities?.[0];
      const existingStart = existingItem?.startTimeLocal
        ? parseStrictRezdyDateTimeLocal(existingItem.startTimeLocal)
        : null;

      if (
        existingItem?.productCode !== rezdyProductCode ||
        existingStart !== locator.startTimeLocal ||
        Number(existingItem?.amount) !== totalAmountDollars ||
        existingQty?.optionLabel !== optionLabel ||
        Number(existingQty?.value) !== totalQuantity
      ) {
        throw new OctoApiError(
          400,
          "ALTERED_IDEMPOTENCY_REQUEST",
          `Rezdy resellerReference ${resellerReference} already exists on order ${activeExisting.orderNumber} with different booking parameters.`,
        );
      }

      return this.translateRezdyBookingToOcto(activeExisting, {
        expirationMinutes: params.expirationMinutes,
      });
    }

    if (Number(matchedSession.seatsAvailable ?? 0) <= 0 || Number(matchedSession.seatsAvailable ?? 0) < totalQuantity) {
      throw new OctoApiError(
        400,
        "REZDY_SESSION_SOLD_OUT",
        `Rezdy session ${matchedSession.id} (${matchedSession.startTimeLocal}) has ${matchedSession.seatsAvailable} seatsAvailable (requested ${totalQuantity})`,
      );
    }

    // 2. Build complete Rezdy v1 booking hold payload
    const createPayload: Record<string, unknown> = {
      resellerReference,
      status: "PROCESSING",
      customer,
      items: [
        {
          productCode: rezdyProductCode,
          startTimeLocal: locator.startTimeLocal,
          amount: totalAmountDollars,
          quantities: [
            {
              optionLabel,
              optionPrice: unitPriceDollars,
              value: totalQuantity,
            },
          ],
          sessionId: Number(matchedSession.id),
          ...(params.participants ? { participants: params.participants } : {}),
          ...(params.pickupLocation
            ? {
                ...(params.pickupLocation.pickupId != null ? { pickupId: params.pickupLocation.pickupId } : {}),
                pickupLocation: { ...params.pickupLocation },
              }
            : {}),
        },
      ],
      ...(Array.isArray(params.customFields) && params.customFields.length > 0
        ? { fields: params.customFields.map((f) => ({ ...f })) }
        : {}),
      ...(params.notes || params.contact?.notes
        ? { comments: params.notes || params.contact?.notes }
        : {}),
    };

    try {
      const created = await this.rezdyRequest<{
        requestStatus?: RezdyV1RequestStatus;
        booking?: RezdyV1Booking;
      }>(`createBookingHold:${rezdyProductCode}`, "/bookings", "POST", {
        body: createPayload,
        idempotencyKey,
      });

      if (!created.booking || !created.booking.orderNumber) {
        throw new OctoApiError(502, "REZDY_INVALID_BOOKING_RESPONSE", "Rezdy did not return a booking orderNumber");
      }

      return this.translateRezdyBookingToOcto(created.booking, {
        expirationMinutes: params.expirationMinutes,
      });
    } catch (err: any) {
      // If a transport drop or 409 conflict occurred after Rezdy accepted the booking,
      // attempt idempotent recovery via GET /v1/bookings?resellerReference=...
      if (err instanceof OctoApiError && (err.status === 409 || err.status === 502 || err.status === 503)) {
        const recoveredList = await this.fetchBookingsByResellerReference(resellerReference).catch(() => []);
        const recovered = recoveredList.find((b) => b.status !== "CANCELLED");
        if (recovered) {
          return this.translateRezdyBookingToOcto(recovered, {
            expirationMinutes: params.expirationMinutes,
          });
        }
      }
      throw err;
    }
  }

  /**
   * Retrieves the full existing Rezdy booking via `GET /v1/bookings/{orderNumber}`,
   * preserves `items`, `quantities`, `participants`, `fields`, `pickupId`, `pickupLocation`, `payments`, and `customer`,
   * applies permitted modifications, and submits the complete booking object via `PUT /v1/bookings/{orderNumber}`.
   */
  public async retrieveAndSubmitFullBookingUpdate(
    orderNumber: string,
    changes: {
      status?: "PROCESSING" | "CONFIRMED" | "CANCELLED";
      resellerReference?: string;
      contact?: Partial<OctoContact>;
      pickupLocation?: OctoPickupLocation;
      customFields?: OctoCustomBookingField[];
      participants?: OctoParticipantField[][];
      comments?: string;
      internalNotes?: string;
      verifiedPaymentEvidence?: OctoVerifiedPaymentEvidence;
    },
    idempotencyKey?: string,
  ): Promise<RezdyV1Booking> {
    this.assertLiveProductionWriteAllowed("retrieveAndSubmitFullBookingUpdate");

    const existing = await this.getRawRezdyBooking(orderNumber);

    const explicitProviderExpiry =
      (existing as any).utcHoldExpires ||
      (existing as any).holdExpiresAt ||
      (existing as any).expiresAt ||
      null;
    if (
      changes.status === "CONFIRMED" &&
      String(existing.status || "").toUpperCase() === "PROCESSING" &&
      typeof explicitProviderExpiry === "string" &&
      !Number.isNaN(Date.parse(explicitProviderExpiry))
    ) {
      const providerExpiresMs = Date.parse(explicitProviderExpiry);
      if (Date.now() > providerExpiresMs) {
        throw new OctoApiError(
          400,
          "EXPIRED_HOLD",
          `Rezdy provider hold ${orderNumber} expired at ${new Date(providerExpiresMs).toISOString()} and cannot be confirmed.`,
        );
      }
    }

    // Merge customer while preserving existing customer fields (id, firstName, lastName, email, phone)
    let updatedCustomer: RezdyV1Customer = { ...existing.customer };
    if (changes.contact) {
      const mergedContact: OctoContact = {
        fullName:
          changes.contact.fullName ||
          `${changes.contact.firstName || existing.customer?.firstName || ""} ${changes.contact.lastName || existing.customer?.lastName || ""}`.trim(),
        firstName: changes.contact.firstName || existing.customer?.firstName,
        lastName: changes.contact.lastName || existing.customer?.lastName,
        emailAddress: changes.contact.emailAddress || existing.customer?.email || "",
        phoneNumber: changes.contact.phoneNumber ?? existing.customer?.phone,
      };
      const validatedCustomer = validateRequiredRezdyCustomer(mergedContact, `updateBooking(${orderNumber})`);
      updatedCustomer = {
        ...(existing.customer?.id != null ? { id: existing.customer.id } : {}),
        ...validatedCustomer,
      };
    } else {
      // Ensure existing customer is still valid
      if (!updatedCustomer.firstName || !updatedCustomer.lastName || !updatedCustomer.email) {
        throw new OctoApiError(
          400,
          "MISSING_CUSTOMER_DETAILS",
          `Existing Rezdy order ${orderNumber} lacks complete customer details and no customer update was provided`,
        );
      }
    }

    // Preserve all items and their nested quantities, participants, pickupLocation, extras, vouchers
    const updatedItems: RezdyV1BookingItem[] = existing.items.map((item, idx) => {
      const clonedItem: RezdyV1BookingItem = {
        ...item,
        quantities: Array.isArray(item.quantities) ? item.quantities.map((q) => ({ ...q })) : [],
        ...(Array.isArray(item.participants)
          ? { participants: item.participants.map((pGroup) => pGroup.map((f) => ({ ...f }))) }
          : {}),
        ...(item.pickupLocation ? { pickupLocation: { ...item.pickupLocation } } : {}),
        ...(Array.isArray(item.extras) ? { extras: [...item.extras] } : {}),
        ...(Array.isArray(item.vouchers) ? { vouchers: [...item.vouchers] } : {}),
      };

      if (idx === 0) {
        if (changes.participants) {
          clonedItem.participants = changes.participants.map((pGroup) => pGroup.map((f) => ({ ...f })));
        }
        if (changes.pickupLocation) {
          if (changes.pickupLocation.pickupId != null) {
            clonedItem.pickupId = changes.pickupLocation.pickupId;
          }
          clonedItem.pickupLocation = {
            ...(clonedItem.pickupLocation || {}),
            ...changes.pickupLocation,
          };
        }
      }

      return clonedItem;
    });

    // Preserve existing custom booking fields and merge any updated fields by label
    const existingFields = Array.isArray(existing.fields) ? existing.fields.map((f) => ({ ...f })) : [];
    if (Array.isArray(changes.customFields) && changes.customFields.length > 0) {
      for (const patchField of changes.customFields) {
        const matchIdx = existingFields.findIndex(
          (ef) => ef.label.trim().toLowerCase() === patchField.label.trim().toLowerCase(),
        );
        if (matchIdx >= 0) {
          existingFields[matchIdx] = {
            ...existingFields[matchIdx],
            value: patchField.value,
          };
        } else {
          existingFields.push({ ...patchField });
        }
      }
    }

    // Preserve existing payments; append a payment record ONLY when verifiedPaymentEvidence is supplied
    const updatedPayments: RezdyV1PaymentEntry[] = Array.isArray(existing.payments)
      ? existing.payments.map((p) => ({ ...p }))
      : [];

    if (changes.verifiedPaymentEvidence) {
      const ev = changes.verifiedPaymentEvidence;
      if (
        ev.verified !== true ||
        !ev.provider ||
        !ev.transactionId ||
        !Number.isFinite(ev.capturedAmount) ||
        ev.capturedAmount <= 0 ||
        !ev.capturedAt ||
        Number.isNaN(Date.parse(ev.capturedAt))
      ) {
        throw new OctoApiError(
          422,
          "UNVERIFIED_PAYMENT_EVIDENCE",
          "Cannot attach payment record to Rezdy booking without valid verifiedPaymentEvidence",
        );
      }

      const alreadyRecorded = updatedPayments.some((p) => p.label.includes(ev.transactionId));
      if (!alreadyRecorded) {
        updatedPayments.push({
          type: "CREDITCARD",
          amount: ev.capturedAmount,
          currency: ev.currency || existing.totalCurrency || "USD",
          date: ev.capturedAt,
          label: `${ev.provider.toUpperCase()}_VERIFIED: ${ev.transactionId}`,
          recipient: "SUPPLIER",
        });
      }
    }

    const fullUpdatePayload: RezdyV1Booking = {
      ...existing,
      orderNumber: existing.orderNumber,
      status: changes.status || existing.status,
      resellerReference: changes.resellerReference || existing.resellerReference,
      customer: updatedCustomer,
      items: updatedItems,
      ...(existingFields.length > 0 ? { fields: existingFields } : {}),
      ...(updatedPayments.length > 0 ? { payments: updatedPayments } : {}),
      ...(changes.comments !== undefined
        ? { comments: changes.comments }
        : existing.comments !== undefined
        ? { comments: existing.comments }
        : {}),
      ...(changes.internalNotes !== undefined
        ? { internalNotes: changes.internalNotes }
        : existing.internalNotes !== undefined
        ? { internalNotes: existing.internalNotes }
        : {}),
    };

    const updated = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      booking?: RezdyV1Booking;
    }>(`putFullBooking:${orderNumber}`, `/bookings/${encodeURIComponent(orderNumber)}`, "PUT", {
      body: fullUpdatePayload,
      idempotencyKey,
    });

    if (!updated.booking || !updated.booking.orderNumber) {
      throw new OctoApiError(502, "REZDY_UPDATE_FAILED", `Rezdy failed to update order ${orderNumber}`);
    }

    return updated.booking;
  }

  override async confirmBooking(
    uuid: string,
    params: OctoConfirmBookingParams,
    idempotencyKey?: string,
  ): Promise<OctoBookingResult> {
    this.assertLiveProductionWriteAllowed("confirmBooking");

    if (!uuid || !uuid.trim()) {
      throw new OctoApiError(400, "MISSING_BOOKING_UUID", "Booking orderNumber/uuid is required for confirmBooking");
    }

    // Validate customer details strictly (never fall back to "Traveler Guest" or "traveler@example.com")
    validateRequiredRezdyCustomer(params.contact, `confirmBooking(${uuid})`);

    const updatedBooking = await this.retrieveAndSubmitFullBookingUpdate(
      uuid,
      {
        status: "CONFIRMED",
        resellerReference: params.resellerReference,
        contact: params.contact,
        pickupLocation: params.pickupLocation,
        customFields: params.customFields,
        participants: params.participants,
        comments: params.contact.notes,
        verifiedPaymentEvidence: params.verifiedPaymentEvidence,
      },
      idempotencyKey,
    );

    return this.translateRezdyBookingToOcto(updatedBooking);
  }

  override async updateBooking(
    uuid: string,
    patch: Partial<OctoBookingResult> & {
      contact?: Partial<OctoContact>;
      pickupLocation?: OctoPickupLocation;
      customFields?: OctoCustomBookingField[];
      participants?: OctoParticipantField[][];
      notes?: string;
    },
    idempotencyKey?: string,
  ): Promise<OctoBookingResult> {
    this.assertLiveProductionWriteAllowed("updateBooking");

    if (!uuid || !uuid.trim()) {
      throw new OctoApiError(400, "MISSING_BOOKING_UUID", "Booking orderNumber/uuid is required for updateBooking");
    }

    const updatedBooking = await this.retrieveAndSubmitFullBookingUpdate(
      uuid,
      {
        resellerReference: patch.resellerReference,
        contact: patch.contact,
        pickupLocation: patch.pickupLocation,
        customFields: patch.customFields,
        participants: patch.participants,
        comments: patch.notes ?? patch.contact?.notes,
      },
      idempotencyKey,
    );

    return this.translateRezdyBookingToOcto(updatedBooking);
  }

  override async getBooking(uuid: string): Promise<OctoBookingResult> {
    const raw = await this.getRawRezdyBooking(uuid);
    return this.translateRezdyBookingToOcto(raw);
  }

  override async cancelBooking(
    uuid: string,
    reason?: string,
    idempotencyKey?: string,
  ): Promise<OctoBookingResult> {
    this.assertLiveProductionWriteAllowed("cancelBooking");

    if (!uuid || !uuid.trim()) {
      throw new OctoApiError(400, "MISSING_BOOKING_UUID", "Booking orderNumber/uuid is required for cancelBooking");
    }

    // Retrieve existing booking first so we never fall back to invented product/option/price details if DELETE returns a minimal response
    const preCancelBooking = await this.getRawRezdyBooking(uuid);

    const cancelled = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      booking?: RezdyV1Booking;
    }>(`cancelBooking:${uuid}`, `/bookings/${encodeURIComponent(uuid)}`, "DELETE", {
      idempotencyKey,
    });

    const authoritativeCancelled: RezdyV1Booking =
      cancelled.booking && Array.isArray(cancelled.booking.items) && cancelled.booking.items.length > 0
        ? { ...cancelled.booking, status: "CANCELLED" }
        : {
            ...preCancelBooking,
            status: "CANCELLED",
            dateUpdated: new Date().toISOString(),
          };

    const result = this.translateRezdyBookingToOcto(authoritativeCancelled);
    result.cancellationReason = reason || "Cancelled by customer request";
    result.cancelledAt = authoritativeCancelled.dateUpdated || new Date().toISOString();
    return result;
  }
}

/**
 * DCC-Written Local Rezdy v1 HTTP Simulator (NOT a Rezdy-Hosted Sandbox)
 *
 * Implements Rezdy v1's documented REST contract over local HTTP (`http://127.0.0.1:<port>/v1`)
 * seeded with product and session payloads captured from GoSno's live Rezdy catalog.
 *
 * Enforces Rezdy's real API constraints:
 * - `POST /v1/bookings` requires `customer` (`firstName`, `lastName`, `email`), `items[0].productCode`,
 *   `items[0].startTimeLocal`, `items[0].quantities[0].optionLabel`, and an available session.
 * - `PUT /v1/bookings/{orderNumber}` requires the FULL booking object (`orderNumber`, `customer`, non-empty `items`
 *   matching the booking), replacing the stored record so tests verify that `items`, `participants`, `fields`,
 *   `pickupLocation`, and `payments` are preserved across updates.
 * - Supports fault injection (`responseDelayMs`, `failNextPostWithTimeout`, `customBookingStatus`) for testing
 *   provider timeouts, retry recovery, and unfamiliar status rejection.
 */
export interface LocalRezdyV1SimulatorHandle {
  readonly isProviderHostedSandbox: false;
  readonly simulatorLabel: "dcc_written_local_simulator";
  baseUrl: string;
  apiKey: string;
  getOrders: () => RezdyV1Booking[];
  getOrderByNumber: (orderNumber: string) => RezdyV1Booking | undefined;
  mutateOrderForTest: (orderNumber: string, mutator: (order: RezdyV1Booking) => void) => void;
  setFaultInjection: (faults: {
    delayMs?: number;
    dropConnectionAfterCreateOnce?: boolean;
    postCommitDelayMsOnce?: number;
  }) => void;
  getServerLogs: () => Array<{ method: string; path: string; status: number; body?: unknown }>;
  close: () => Promise<void>;
}

/** @deprecated Alias kept for compatibility; use LocalRezdyV1SimulatorHandle */
export type RezdyV1TestServerHandle = LocalRezdyV1SimulatorHandle;

export const LIVE_CAPTURED_GOSNO_REZDY_PRODUCTS: Record<string, RezdyV1Product> = {
  P7477S: {
    productCode: "P7477S",
    internalCode: "denver-to-breckenridge-private-suv",
    name: "Denver Airport to Breckenridge — Private SUV Transfer",
    shortDescription:
      "Private SUV transfer from Denver International (DEN) to Breckenridge with flight tracking and room for ski gear.",
    description:
      "A private SUV picks you up curbside at Denver International (DEN) and drives your group straight to Breckenridge. Flight tracking is included so we are there when you land, with room for ski bags and winter luggage. Pre-book your return to Denver at the same time. Priced per vehicle.",
    productType: "PRIVATE_TOUR",
    bookingMode: "INVENTORY",
    currency: "USD",
    advertisedPrice: 399,
    supplierId: 230001,
    supplierAlias: "gosnotransportation58",
    supplierName: "GoSno Mountain Transportation",
    priceOptions: [
      {
        price: 399,
        label: "Suburban",
        id: 69029050,
        seatsUsed: 1,
        productCode: "P7477S",
      },
    ],
    quantityRequired: true,
    quantityRequiredMin: 1,
    quantityRequiredMax: 3,
    durationMinutes: 150,
    confirmMode: "AUTOCONFIRM",
  },
  PXFGPP: {
    productCode: "PXFGPP",
    internalCode: "denver-to-vail-private-suv",
    name: "Denver Airport to Vail — Private SUV Transfer",
    productType: "PRIVATE_TOUR",
    bookingMode: "INVENTORY",
    currency: "USD",
    advertisedPrice: 499,
    supplierId: 230001,
    supplierAlias: "gosnotransportation58",
    supplierName: "GoSno Mountain Transportation",
    priceOptions: [
      {
        price: 499,
        label: "Suburban",
        id: 75298226,
        seatsUsed: 1,
        productCode: "PXFGPP",
      },
    ],
    quantityRequired: true,
    quantityRequiredMin: 1,
    quantityRequiredMax: 3,
    durationMinutes: 150,
    confirmMode: "AUTOCONFIRM",
  },
  PEAVH0: {
    productCode: "PEAVH0",
    internalCode: "GOSNO_SNOWMASS_DEN_SUV",
    name: "Snowmass to Denver Airport — Private SUV Transfer",
    productType: "PRIVATE_TOUR",
    bookingMode: "INVENTORY",
    currency: "USD",
    advertisedPrice: 699,
    supplierId: 230001,
    supplierAlias: "gosnotransportation58",
    supplierName: "GoSno Mountain Transportation",
    priceOptions: [
      {
        price: 699,
        label: "Group from 1 to 2",
        id: 76622153,
        seatsUsed: 1,
        minQuantity: 1,
        maxQuantity: 2,
        priceGroupType: "EACH",
        productCode: "PEAVH0",
      },
    ],
    quantityRequired: true,
    quantityRequiredMin: 1,
    quantityRequiredMax: 2,
    durationMinutes: 240,
    confirmMode: "AUTOCONFIRM",
  },
  PKQDPG: {
    productCode: "PKQDPG",
    internalCode: "GOSNO_DEN_BRECKENRIDGE_VAN",
    name: "Denver International Airport (DEN) to Breckenridge - Private Van Transfer",
    productType: "PRIVATE_TOUR",
    bookingMode: "INVENTORY",
    currency: "USD",
    advertisedPrice: 599,
    supplierId: 230001,
    supplierAlias: "gosnotransportation58",
    supplierName: "GoSno Mountain Transportation",
    priceOptions: [
      {
        price: 599,
        label: "Private Van 10ppl",
        id: 73379226,
        seatsUsed: 1,
        productCode: "PKQDPG",
      },
    ],
    quantityRequired: true,
    quantityRequiredMin: 1,
    quantityRequiredMax: 1,
    durationMinutes: 150,
    confirmMode: "AUTOCONFIRM",
  },
};

export const LIVE_CAPTURED_GOSNO_REZDY_SESSIONS: Record<string, RezdyV1Session[]> = {
  P7477S: [
    {
      id: 497020486,
      productCode: "P7477S",
      startTime: "2026-11-12T17:53:00Z",
      endTime: "2026-11-12T20:23:00Z",
      startTimeLocal: "2026-11-12 10:53:00",
      endTimeLocal: "2026-11-12 13:23:00",
      allDay: false,
      seats: 1,
      seatsAvailable: 1,
      priceOptions: [
        {
          price: 399,
          label: "Suburban",
          id: 69029050,
          seatsUsed: 1,
          productCode: "P7477S",
        },
      ],
    },
    {
      id: 507139971,
      productCode: "P7477S",
      startTime: "2026-12-14T22:05:00Z",
      endTime: "2026-12-15T00:35:00Z",
      startTimeLocal: "2026-12-14 15:05:00",
      endTimeLocal: "2026-12-14 17:35:00",
      allDay: false,
      seats: 999,
      seatsAvailable: 0,
      priceOptions: [
        {
          price: 399,
          label: "Suburban",
          id: 69029050,
          seatsUsed: 1,
          productCode: "P7477S",
        },
      ],
    },
  ],
  PXFGPP: [
    {
      id: 498001122,
      productCode: "PXFGPP",
      startTime: "2026-11-12T18:00:00Z",
      endTime: "2026-11-12T20:30:00Z",
      startTimeLocal: "2026-11-12 11:00:00",
      endTimeLocal: "2026-11-12 13:30:00",
      allDay: false,
      seats: 1,
      seatsAvailable: 1,
      priceOptions: [
        {
          price: 499,
          label: "Suburban",
          id: 75298226,
          seatsUsed: 1,
          productCode: "PXFGPP",
        },
      ],
    },
  ],
  PEAVH0: [
    {
      id: 499002233,
      productCode: "PEAVH0",
      startTime: "2026-11-15T17:00:00Z",
      endTime: "2026-11-15T21:00:00Z",
      startTimeLocal: "2026-11-15 10:00:00",
      endTimeLocal: "2026-11-15 14:00:00",
      allDay: false,
      seats: 2,
      seatsAvailable: 2,
      priceOptions: [
        {
          price: 699,
          label: "Group from 1 to 2",
          id: 76622153,
          seatsUsed: 1,
          productCode: "PEAVH0",
        },
      ],
    },
  ],
  PKQDPG: [],
};

export async function startLocalRezdyV1Simulator(options?: {
  apiKey?: string;
}): Promise<LocalRezdyV1SimulatorHandle> {
  const expectedApiKey = options?.apiKey || "rezdy_sim_key_dcc_gosno_pilot_32chars_01";
  const sessionsByProduct = new Map<string, RezdyV1Session[]>(
    Object.entries(LIVE_CAPTURED_GOSNO_REZDY_SESSIONS).map(([code, list]) => [
      code,
      list.map((s) => ({ ...s, priceOptions: s.priceOptions?.map((po) => ({ ...po })) })),
    ]),
  );
  const bookingsByOrderNumber = new Map<string, RezdyV1Booking>();
  const serverLogs: Array<{ method: string; path: string; status: number; body?: unknown }> = [];
  let orderCounter = 1000;
  let faultConfig: {
    delayMs?: number;
    dropConnectionAfterCreateOnce?: boolean;
    postCommitDelayMsOnce?: number;
  } = {};

  const sendJson = (res: http.ServerResponse, status: number, payload: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
  };

  const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url || "/", "http://127.0.0.1");
    const method = req.method || "GET";
    const suppliedKey = reqUrl.searchParams.get("apiKey") || req.headers["apikey"];

    let rawBody = "";
    req.on("data", (chunk) => {
      rawBody += chunk;
    });
    req.on("end", async () => {
      if (faultConfig.delayMs && faultConfig.delayMs > 0) {
        await new Promise((r) => setTimeout(r, faultConfig.delayMs));
      }

      let parsedBody: any = undefined;
      if (rawBody) {
        try {
          parsedBody = JSON.parse(rawBody);
        } catch {
          parsedBody = rawBody;
        }
      }

      if (suppliedKey !== expectedApiKey) {
        serverLogs.push({ method, path: reqUrl.pathname, status: 401, body: parsedBody });
        return sendJson(res, 401, {
          requestStatus: {
            success: false,
            error: { errorCode: "4", errorMessage: "Invalid API Key" },
          },
        });
      }

      // GET /v1/products
      if (method === "GET" && reqUrl.pathname === "/v1/products") {
        serverLogs.push({ method, path: reqUrl.pathname, status: 200 });
        return sendJson(res, 200, {
          requestStatus: { success: true, version: "v1" },
          products: Object.values(LIVE_CAPTURED_GOSNO_REZDY_PRODUCTS),
        });
      }

      // GET /v1/products/{productCode}
      const prodMatch = reqUrl.pathname.match(/^\/v1\/products\/([^/]+)$/);
      if (method === "GET" && prodMatch) {
        const code = decodeURIComponent(prodMatch[1]);
        const prod = LIVE_CAPTURED_GOSNO_REZDY_PRODUCTS[code];
        if (!prod) {
          serverLogs.push({ method, path: reqUrl.pathname, status: 404 });
          return sendJson(res, 404, {
            requestStatus: {
              success: false,
              error: { errorCode: "404", errorMessage: `Product ${code} not found` },
            },
          });
        }
        serverLogs.push({ method, path: reqUrl.pathname, status: 200 });
        return sendJson(res, 200, {
          requestStatus: { success: true, version: "v1" },
          product: prod,
        });
      }

      // GET /v1/availability
      if (method === "GET" && reqUrl.pathname === "/v1/availability") {
        const code = reqUrl.searchParams.get("productCode") || "";
        const startTimeLocal = reqUrl.searchParams.get("startTimeLocal") || "";
        const endTimeLocal = reqUrl.searchParams.get("endTimeLocal") || "";
        const allSessions = sessionsByProduct.get(code) || [];
        const filtered = allSessions.filter((s) => {
          if (startTimeLocal && s.startTimeLocal < startTimeLocal) return false;
          if (endTimeLocal && s.startTimeLocal > endTimeLocal) return false;
          return true;
        });
        serverLogs.push({ method, path: `${reqUrl.pathname}?productCode=${code}`, status: 200 });
        return sendJson(res, 200, {
          requestStatus: { success: true, version: "v1" },
          sessions: filtered,
        });
      }

      // GET /v1/bookings?resellerReference=...
      if (method === "GET" && reqUrl.pathname === "/v1/bookings") {
        const resellerRef = reqUrl.searchParams.get("resellerReference");
        const all = Array.from(bookingsByOrderNumber.values());
        const matched = resellerRef
          ? all.filter((b) => b.resellerReference === resellerRef)
          : all;
        serverLogs.push({
          method,
          path: `${reqUrl.pathname}${resellerRef ? `?resellerReference=${resellerRef}` : ""}`,
          status: 200,
        });
        return sendJson(res, 200, {
          requestStatus: { success: true, version: "v1" },
          bookings: matched,
        });
      }

      // POST /v1/bookings (Create Hold / Processing Booking)
      if (method === "POST" && reqUrl.pathname === "/v1/bookings") {
        if (
          !parsedBody?.customer?.firstName ||
          !parsedBody?.customer?.lastName ||
          !parsedBody?.customer?.email
        ) {
          serverLogs.push({ method, path: reqUrl.pathname, status: 400, body: parsedBody });
          return sendJson(res, 400, {
            requestStatus: {
              success: false,
              error: {
                errorCode: "MISSING_CUSTOMER",
                errorMessage: "Rezdy POST /v1/bookings requires customer firstName, lastName, and email",
              },
            },
          });
        }

        const item = parsedBody?.items?.[0];
        const prod = item?.productCode ? LIVE_CAPTURED_GOSNO_REZDY_PRODUCTS[item.productCode] : null;
        if (!prod) {
          serverLogs.push({ method, path: reqUrl.pathname, status: 400, body: parsedBody });
          return sendJson(res, 400, {
            requestStatus: {
              success: false,
              error: { errorCode: "INVALID_PRODUCT", errorMessage: "Unknown Rezdy productCode" },
            },
          });
        }

        const qty = item?.quantities?.[0];
        const validOption = prod.priceOptions.find((po) => po.label === qty?.optionLabel);
        if (!validOption) {
          serverLogs.push({ method, path: reqUrl.pathname, status: 400, body: parsedBody });
          return sendJson(res, 400, {
            requestStatus: {
              success: false,
              error: {
                errorCode: "INVALID_OPTION_LABEL",
                errorMessage: `Invalid quantity optionLabel '${qty?.optionLabel}' for ${prod.productCode}`,
              },
            },
          });
        }

        // Prevent duplicate active bookings for the same resellerReference
        if (parsedBody.resellerReference) {
          const dup = Array.from(bookingsByOrderNumber.values()).find(
            (b) => b.resellerReference === parsedBody.resellerReference && b.status !== "CANCELLED",
          );
          if (dup) {
            serverLogs.push({ method, path: reqUrl.pathname, status: 409, body: parsedBody });
            return sendJson(res, 409, {
              requestStatus: {
                success: false,
                error: {
                  errorCode: "DUPLICATE_RESELLER_REFERENCE",
                  errorMessage: `Active booking ${dup.orderNumber} already exists for resellerReference ${parsedBody.resellerReference}`,
                },
              },
            });
          }
        }

        const prodSessions = sessionsByProduct.get(prod.productCode) || [];
        const targetSession =
          item.sessionId != null
            ? prodSessions.find((s) => s.id === Number(item.sessionId))
            : prodSessions.find((s) => s.startTimeLocal === item.startTimeLocal);

        if (!targetSession || targetSession.seatsAvailable < Number(qty?.value || 1)) {
          serverLogs.push({ method, path: reqUrl.pathname, status: 400, body: parsedBody });
          return sendJson(res, 400, {
            requestStatus: {
              success: false,
              error: {
                errorCode: "SESSION_SOLD_OUT",
                errorMessage: "Requested Rezdy session has insufficient seatsAvailable",
              },
            },
          });
        }

        targetSession.seatsAvailable -= Number(qty?.value || 1);

        orderCounter += 1;
        const orderNumber = `RZSIM${orderCounter}`;
        const nowIso = new Date().toISOString();
        const amount = Number(item.amount ?? validOption.price * Number(qty?.value || 1));

        const booking: RezdyV1Booking = {
          orderNumber,
          status: parsedBody.status || "PROCESSING",
          supplierId: prod.supplierId || 230001,
          supplierName: prod.supplierName || "GoSno Mountain Transportation",
          supplierAlias: prod.supplierAlias || "gosnotransportation58",
          resellerReference: parsedBody.resellerReference || "",
          totalAmount: amount,
          totalCurrency: prod.currency,
          totalPaid: 0,
          totalDue: amount,
          dateCreated: nowIso,
          dateUpdated: nowIso,
          customer: {
            id: 900000 + orderCounter,
            firstName: parsedBody.customer.firstName,
            lastName: parsedBody.customer.lastName,
            email: parsedBody.customer.email,
            ...(parsedBody.customer.phone ? { phone: parsedBody.customer.phone } : {}),
          },
          items: [
            {
              productName: prod.name,
              productCode: prod.productCode,
              startTime: targetSession.startTime,
              endTime: targetSession.endTime,
              startTimeLocal: item.startTimeLocal,
              endTimeLocal: targetSession.endTimeLocal,
              amount,
              subtotal: amount,
              totalItemTax: 0,
              totalQuantity: Number(qty?.value || 1),
              quantities: [
                {
                  optionLabel: validOption.label,
                  optionPrice: validOption.price,
                  value: Number(qty?.value || 1),
                  priceGroupType: "EACH",
                },
              ],
              sessionId: targetSession.id,
              participants: Array.isArray(item.participants) ? item.participants : [],
              ...(item.pickupId != null ? { pickupId: item.pickupId } : {}),
              ...(item.pickupLocation ? { pickupLocation: item.pickupLocation } : {}),
              extras: Array.isArray(item.extras) ? item.extras : [],
              vouchers: [],
            },
          ],
          fields: Array.isArray(parsedBody.fields)
            ? parsedBody.fields
            : [{ label: "Barcode", value: orderNumber }],
          payments: Array.isArray(parsedBody.payments) ? parsedBody.payments : [],
          comments: parsedBody.comments,
          internalNotes: parsedBody.internalNotes,
          source: "API",
          vouchers: [],
          barcodeType: "QR_CODE",
        };

        bookingsByOrderNumber.set(orderNumber, booking);
        serverLogs.push({ method, path: reqUrl.pathname, status: 200, body: parsedBody });

        if (faultConfig.dropConnectionAfterCreateOnce) {
          faultConfig.dropConnectionAfterCreateOnce = false;
          req.socket.destroy();
          return;
        }

        if (faultConfig.postCommitDelayMsOnce && faultConfig.postCommitDelayMsOnce > 0) {
          const waitMs = faultConfig.postCommitDelayMsOnce;
          faultConfig.postCommitDelayMsOnce = undefined;
          await new Promise((r) => setTimeout(r, waitMs));
        }

        return sendJson(res, 200, {
          requestStatus: { success: true, version: "v1" },
          booking,
        });
      }

      // GET / PUT / DELETE /v1/bookings/{orderNumber}
      const orderMatch = reqUrl.pathname.match(/^\/v1\/bookings\/([^/]+)$/);
      if (orderMatch) {
        const orderNumber = decodeURIComponent(orderMatch[1]);
        const existing = bookingsByOrderNumber.get(orderNumber);
        if (!existing) {
          serverLogs.push({ method, path: reqUrl.pathname, status: 404 });
          return sendJson(res, 404, {
            requestStatus: {
              success: false,
              error: { errorCode: "404", errorMessage: `Order ${orderNumber} not found` },
            },
          });
        }

        if (method === "GET") {
          serverLogs.push({ method, path: reqUrl.pathname, status: 200 });
          return sendJson(res, 200, {
            requestStatus: { success: true, version: "v1" },
            booking: existing,
          });
        }

        if (method === "PUT") {
          // Enforce native Rezdy full-booking PUT requirement:
          // Rejects partial updates that omit items, quantities, or customer!
          if (
            !parsedBody ||
            !Array.isArray(parsedBody.items) ||
            parsedBody.items.length === 0 ||
            !parsedBody.items[0]?.productCode ||
            !parsedBody.items[0]?.startTimeLocal ||
            !Array.isArray(parsedBody.items[0]?.quantities) ||
            parsedBody.items[0].quantities.length === 0 ||
            !parsedBody.customer?.firstName ||
            !parsedBody.customer?.lastName ||
            !parsedBody.customer?.email
          ) {
            serverLogs.push({ method, path: reqUrl.pathname, status: 400, body: parsedBody });
            return sendJson(res, 400, {
              requestStatus: {
                success: false,
                error: {
                  errorCode: "MISSING_FULL_BOOKING_OBJECT",
                  errorMessage:
                    "Rezdy PUT /v1/bookings/{orderNumber} requires the complete booking object (customer, items, quantities, startTimeLocal)",
                },
              },
            });
          }

          const nowIso = new Date().toISOString();
          const payments = Array.isArray(parsedBody.payments) ? parsedBody.payments : [];
          const paidSum = payments.reduce((sum: number, p: any) => sum + (Number(p?.amount) || 0), 0);

          const updatedBooking: RezdyV1Booking = {
            ...existing,
            ...parsedBody,
            orderNumber: existing.orderNumber,
            dateCreated: existing.dateCreated,
            dateConfirmed:
              parsedBody.status === "CONFIRMED"
                ? existing.dateConfirmed || nowIso
                : existing.dateConfirmed,
            datePaid: paidSum > 0 ? existing.datePaid || nowIso : existing.datePaid,
            dateUpdated: nowIso,
            totalPaid: paidSum,
            totalDue: Math.max(0, Number((existing.totalAmount - paidSum).toFixed(2))),
            customer: parsedBody.customer,
            items: parsedBody.items,
            fields: Array.isArray(parsedBody.fields) ? parsedBody.fields : [],
            payments,
          };

          bookingsByOrderNumber.set(orderNumber, updatedBooking);
          serverLogs.push({ method, path: reqUrl.pathname, status: 200, body: parsedBody });
          return sendJson(res, 200, {
            requestStatus: { success: true, version: "v1" },
            booking: updatedBooking,
          });
        }

        if (method === "DELETE") {
          const nowIso = new Date().toISOString();
          if (existing.status !== "CANCELLED") {
            existing.status = "CANCELLED";
            existing.dateUpdated = nowIso;
            const firstItem = existing.items?.[0];
            if (firstItem?.sessionId) {
              const prodSessions = sessionsByProduct.get(firstItem.productCode) || [];
              const session = prodSessions.find((s) => s.id === firstItem.sessionId);
              if (session) {
                session.seatsAvailable += Number(firstItem.quantities?.[0]?.value || 1);
              }
            }
          }
          serverLogs.push({ method, path: reqUrl.pathname, status: 200 });
          return sendJson(res, 200, {
            requestStatus: { success: true, version: "v1" },
            booking: existing,
          });
        }
      }

      serverLogs.push({ method, path: reqUrl.pathname, status: 404 });
      return sendJson(res, 404, {
        requestStatus: {
          success: false,
          error: { errorCode: "404", errorMessage: `Unsupported path ${reqUrl.pathname}` },
        },
      });
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;

  return {
    isProviderHostedSandbox: false,
    simulatorLabel: "dcc_written_local_simulator",
    baseUrl: `http://127.0.0.1:${port}/v1`,
    apiKey: expectedApiKey,
    getOrders: () => Array.from(bookingsByOrderNumber.values()),
    getOrderByNumber: (orderNumber: string) => bookingsByOrderNumber.get(orderNumber),
    mutateOrderForTest: (orderNumber: string, mutator: (order: RezdyV1Booking) => void) => {
      const ord = bookingsByOrderNumber.get(orderNumber);
      if (ord) mutator(ord);
    },
    setFaultInjection: (faults) => {
      faultConfig = { ...faultConfig, ...faults };
    },
    getServerLogs: () => [...serverLogs],
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

/**
 * Compatibility alias for `startLocalRezdyV1Simulator`.
 * NOTE: This is a DCC-written local HTTP simulator, NOT a Rezdy-hosted staging sandbox.
 */
export const startRezdyV1TestServer = startLocalRezdyV1Simulator;
