import crypto from "crypto";
import {
  OctoAvailabilitySlot,
  OctoBookingResult,
  OctoConfirmBookingParams,
  OctoCreateHoldParams,
  OctoProduct,
} from "./types";

export const MOCK_OCTO_SUPPLIER = {
  id: "mock-octo-alaska-expeditions",
  name: "Alaska Premier Expeditions & Tours",
  website: "https://mock-alaska-expeditions.dcc.internal",
  contactEmail: "reservations@mock-alaska-expeditions.dcc.internal",
  country: "US",
  currency: "USD",
  version: "1.0",
  capabilities: ["octo/core", "octo/pricing", "octo/content", "octo/pickups"],
};

export const MOCK_OCTO_PRODUCTS: OctoProduct[] = [
  {
    id: "prod_alaska_whale_glacier",
    internalName: "Juneau Coastal Glaciers & Whale Watching Tour",
    reference: "APE-JNU-01",
    title: "Juneau Coastal Glaciers & Whale Watching Tour",
    description:
      "Authoritative 3.5-hour marine wildlife expedition through Saginaw Channel and Auke Bay with naturalist guides, heated jet-boat cabin, and guaranteed humpback whale sightings.",
    country: "US",
    location: "Juneau, Alaska",
    destinationSlug: "juneau",
    placeCoordinates: { lat: 58.3005, lng: -134.4201 },
    timeZone: "America/Juneau",
    defaultCurrency: "USD",
    durationMinutes: 210,
    meetingPoint: "Auke Bay Harbor, Loading Float B, Juneau, AK 99801",
    cancellationPolicy: "Full refund up to 24 hours prior to departure. 100% weather refund guarantee.",
    capabilities: ["octo/core", "octo/pricing", "octo/content", "octo/pickups"],
    options: [
      {
        id: "opt_morning_cruise",
        default: true,
        internalName: "Morning Wildlife Cruise (09:00 AM)",
        title: "Morning Wildlife Cruise (09:00 AM)",
        description: "Calm morning waters, optimal whale feeding conditions.",
        cancellationCutoffSeconds: 86400,
        units: [
          {
            id: "unit_adult",
            internalName: "Adult (13+)",
            type: "ADULT",
            pricingFrom: [
              {
                original: 17900,
                retail: 17900,
                net: 16110,
                currency: "USD",
                currencyPrecision: 2,
                includedTaxesAndFees: true,
              },
            ],
            restrictions: { minAge: 13, maxQuantity: 20 },
          },
          {
            id: "unit_child",
            internalName: "Child (3-12)",
            type: "CHILD",
            pricingFrom: [
              {
                original: 11900,
                retail: 11900,
                net: 10710,
                currency: "USD",
                currencyPrecision: 2,
                includedTaxesAndFees: true,
              },
            ],
            restrictions: { minAge: 3, maxAge: 12, accompaniedBy: ["unit_adult"] },
          },
          {
            id: "unit_infant",
            internalName: "Infant (0-2)",
            type: "INFANT",
            pricingFrom: [
              {
                original: 0,
                retail: 0,
                net: 0,
                currency: "USD",
                currencyPrecision: 2,
                includedTaxesAndFees: true,
              },
            ],
            restrictions: { minAge: 0, maxAge: 2, accompaniedBy: ["unit_adult"] },
          },
        ],
      },
    ],
  },
  {
    id: "prod_redrocks_sunset",
    internalName: "Red Rocks Sunset Guided Adventure",
    reference: "PARR-RR-02",
    title: "Red Rocks Sunset Guided Adventure & Amphitheatre Walk",
    description:
      "Direct operator-led geological walk and amphitheatre historical exploration before twilight over the Denver skyline. Direct Morrison departure.",
    country: "US",
    location: "Morrison, Colorado",
    destinationSlug: "red-rocks",
    placeCoordinates: { lat: 39.6654, lng: -105.2057 },
    timeZone: "America/Denver",
    defaultCurrency: "USD",
    durationMinutes: 150,
    meetingPoint: "Red Rocks Trading Post, Morrison, CO 80465",
    cancellationPolicy: "Cancel up to 12 hours before start for a 100% refund.",
    capabilities: ["octo/core", "octo/pricing", "octo/content"],
    options: [
      {
        id: "opt_sunset_walk",
        default: true,
        internalName: "Sunset Guided Walk",
        title: "Sunset Guided Walk",
        units: [
          {
            id: "unit_adult",
            internalName: "General Admission",
            type: "ADULT",
            pricingFrom: [
              {
                original: 8900,
                retail: 8900,
                net: 8010,
                currency: "USD",
                currencyPrecision: 2,
                includedTaxesAndFees: true,
              },
            ],
          },
        ],
      },
    ],
  },
];

// In-memory state for mock supplier bookings
const mockBookingsStore = new Map<string, OctoBookingResult>();

export class MockOctoSupplierEngine {
  static getSupplier() {
    return MOCK_OCTO_SUPPLIER;
  }

  static getProducts(): OctoProduct[] {
    return MOCK_OCTO_PRODUCTS;
  }

  static getProduct(productId: string): OctoProduct | null {
    return MOCK_OCTO_PRODUCTS.find((p) => p.id === productId) || null;
  }

  static getAvailabilityCalendar(
    productId: string,
    optionId: string,
    localDateStart: string,
    localDateEnd: string
  ): OctoAvailabilitySlot[] {
    const slots: OctoAvailabilitySlot[] = [];
    const start = new Date(localDateStart);
    const end = new Date(localDateEnd);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      slots.push({
        id: `avail_${productId}_${optionId}_${dateStr}_0900`,
        localDateTimeStart: `${dateStr}T09:00:00`,
        localDateTimeEnd: `${dateStr}T12:30:00`,
        allDay: false,
        available: true,
        status: "AVAILABLE",
        vacancies: 18,
        capacity: 24,
        maxUnits: 10,
      });
    }

    return slots;
  }

  static checkAvailability(
    productId: string,
    optionId: string,
    localDate: string,
    unitItems?: any[]
  ): OctoAvailabilitySlot[] {
    const checkDate = new Date(`${localDate}T00:00:00Z`);
    // Reject dates more than 1 day in the past
    if (!isNaN(checkDate.getTime()) && checkDate.getTime() < Date.now() - 86400000) {
      return [];
    }

    return [
      {
        id: `avail_${productId}_${optionId}_${localDate}_0900`,
        localDateTimeStart: `${localDate}T09:00:00`,
        localDateTimeEnd: `${localDate}T12:30:00`,
        allDay: false,
        available: true,
        status: "AVAILABLE",
        vacancies: 16,
        capacity: 24,
        maxUnits: 8,
        unitPricing: [
          {
            unitId: "unit_adult",
            pricing: {
              original: 17900,
              retail: 17900,
              net: 16110,
              currency: "USD",
              currencyPrecision: 2,
              includedTaxesAndFees: true,
            },
          },
          {
            unitId: "unit_child",
            pricing: {
              original: 11900,
              retail: 11900,
              net: 10710,
              currency: "USD",
              currencyPrecision: 2,
              includedTaxesAndFees: true,
            },
          },
          {
            unitId: "unit_infant",
            pricing: {
              original: 0,
              retail: 0,
              net: 0,
              currency: "USD",
              currencyPrecision: 2,
              includedTaxesAndFees: true,
            },
          },
        ],
      },
    ];
  }

  static createHold(params: OctoCreateHoldParams): OctoBookingResult {
    const uuid = params.uuid || crypto.randomUUID();
    const product = this.getProduct(params.productId);
    if (!product) {
      throw new Error(`PRODUCT_NOT_FOUND: ${params.productId}`);
    }

    // Expiration calculated strictly by expirationMinutes per OCTO Core specification
    const expirationMinutes = params.expirationMinutes || 15;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();

    // Calculate pricing based on units
    let totalCents = 0;
    const unitItemResults = params.unitItems.map((item) => {
      let unitPrice = 17900;
      if (item.unitId === "unit_child") unitPrice = 11900;
      if (item.unitId === "unit_infant") unitPrice = 0;
      if (params.productId === "prod_redrocks_sunset") unitPrice = 8900;

      totalCents += unitPrice * item.quantity;
      return {
        uuid: crypto.randomUUID(),
        unitId: item.unitId,
        pricing: {
          original: unitPrice * item.quantity,
          retail: unitPrice * item.quantity,
          currency: "USD",
          currencyPrecision: 2,
          includedTaxesAndFees: true,
        },
      };
    });

    const booking: OctoBookingResult = {
      uuid,
      status: "ON_HOLD",
      utcHoldExpires: expiresAt,
      productId: params.productId,
      optionId: params.optionId,
      availabilityId: params.availabilityId,
      unitItems: unitItemResults,
      totalPrice: totalCents / 100,
      currency: "USD",
      supplierReference: `APE-BK-${uuid.slice(0, 8).toUpperCase()}`,
      checkoutUrl: `https://mock-alaska-expeditions.dcc.internal/checkout/${uuid}`,
    };

    mockBookingsStore.set(uuid, booking);
    return booking;
  }

  static confirmBooking(uuid: string, params: OctoConfirmBookingParams): OctoBookingResult {
    const booking = mockBookingsStore.get(uuid);
    if (!booking) {
      throw new Error(`BOOKING_NOT_FOUND: ${uuid}`);
    }

    if (booking.status === "EXPIRED") {
      throw new Error("EXPIRED_HOLD: Booking hold has expired");
    }

    if (booking.status === "CANCELLED") {
      throw new Error("INVALID_STATUS: Booking has already been cancelled");
    }

    booking.status = "CONFIRMED";
    booking.utcHoldExpires = null;
    booking.contact = params.contact;
    booking.resellerReference = params.resellerReference;
    booking.confirmedAt = new Date().toISOString();
    booking.voucher = {
      code: `VOUCHER-${uuid.slice(0, 8).toUpperCase()}`,
      barcodeUrl: `https://mock-alaska-expeditions.dcc.internal/vouchers/${uuid}.png`,
      redemptionInstructions: "Present this digital voucher to the dock master at Loading Float B.",
    };

    mockBookingsStore.set(uuid, booking);
    return booking;
  }

  static getBooking(uuid: string): OctoBookingResult | null {
    return mockBookingsStore.get(uuid) || null;
  }

  static updateBooking(uuid: string, patch: Partial<OctoBookingResult>): OctoBookingResult {
    const booking = mockBookingsStore.get(uuid);
    if (!booking) throw new Error(`BOOKING_NOT_FOUND: ${uuid}`);

    Object.assign(booking, patch);
    mockBookingsStore.set(uuid, booking);
    return booking;
  }

  static cancelBooking(uuid: string, reason?: string): OctoBookingResult {
    const booking = mockBookingsStore.get(uuid);
    if (!booking) throw new Error(`BOOKING_NOT_FOUND: ${uuid}`);

    booking.status = "CANCELLED";
    booking.cancellationReason = reason || "Cancelled via DCC";
    booking.cancelledAt = new Date().toISOString();
    mockBookingsStore.set(uuid, booking);
    return booking;
  }

  static reset() {
    mockBookingsStore.clear();
  }
}
