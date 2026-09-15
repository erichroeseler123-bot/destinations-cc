import crypto from "crypto";
import { getDb } from "@/lib/db/client";
import {
  dccTravelerProfiles,
  dccAuthTokens,
  dccOrders,
  octoBookings,
  dccOrderItems,
  dccOrderPayments,
} from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import {
  AuthChallenge,
  TravelerProfile,
  TravelerSession,
  TravelerTripsSummary,
  TravelerTripOrder,
  TravelerTripBooking,
} from "./types";

export const TRAVELER_SESSION_COOKIE = "dcc_traveler_session";
const SESSION_VERSION = "v1";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const CHALLENGE_TTL_MINUTES = 15;

// In-memory fallback stores for deterministic offline testing and caching
const profileStore = new Map<string, TravelerProfile>();
const profileByEmailStore = new Map<string, TravelerProfile>();
const challengeStore = new Map<string, AuthChallenge>();

function getSessionSecret() {
  return (process.env.INTERNAL_API_SECRET || process.env.ADMIN_ACCESS_KEY || "dcc_traveler_session_secret_2026").trim();
}

function signSession(version: string, travelerId: string, email: string, expiresAt: string, nonce: string): string {
  const secret = getSessionSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(`${version}.${travelerId}.${email}.${expiresAt}.${nonce}`)
    .digest("hex");
}

export class DccTravelerService {
  /**
   * Get or create a traveler profile by email
   */
  static async getOrCreateProfile(
    email: string,
    fullNameOrOptions?: string | { fullName?: string; phone?: string; phoneNumber?: string; country?: string; metadata?: Record<string, unknown> },
    phoneNumberArg?: string,
    metadataArg?: Record<string, unknown>
  ): Promise<TravelerProfile> {
    const normalizedEmail = email.trim().toLowerCase();

    let fullName: string | undefined;
    let phoneNumber: string | undefined;
    let metadata: Record<string, unknown> = metadataArg || {};

    if (typeof fullNameOrOptions === "string") {
      fullName = fullNameOrOptions.trim();
      phoneNumber = phoneNumberArg?.trim();
    } else if (fullNameOrOptions && typeof fullNameOrOptions === "object") {
      fullName = typeof fullNameOrOptions.fullName === "string" ? fullNameOrOptions.fullName.trim() : undefined;
      phoneNumber = typeof (fullNameOrOptions.phoneNumber || fullNameOrOptions.phone) === "string"
        ? (fullNameOrOptions.phoneNumber || fullNameOrOptions.phone)!.trim()
        : undefined;
      if (fullNameOrOptions.country) {
        metadata = { ...metadata, country: fullNameOrOptions.country };
      }
      if (fullNameOrOptions.metadata) {
        metadata = { ...metadata, ...fullNameOrOptions.metadata };
      }
    }
    
    // Check in-memory store first
    const existingMem = profileByEmailStore.get(normalizedEmail);
    if (existingMem) {
      if (fullName && !existingMem.fullName) existingMem.fullName = fullName;
      if (phoneNumber && !existingMem.phoneNumber) existingMem.phoneNumber = phoneNumber;
      existingMem.updatedAt = new Date().toISOString();
      return existingMem;
    }

    const db = getDb();
    if (db) {
      try {
        const [existing] = await db
          .select()
          .from(dccTravelerProfiles)
          .where(eq(dccTravelerProfiles.email, normalizedEmail));

        if (existing) {
          const profile: TravelerProfile = {
            id: existing.id,
            email: existing.email,
            fullName: existing.fullName || fullName,
            phoneNumber: existing.phoneNumber || phoneNumber,
            metadata: (existing.metadata as Record<string, unknown>) || {},
            createdAt: existing.createdAt.toISOString(),
            updatedAt: existing.updatedAt.toISOString(),
          };
          profileStore.set(profile.id, profile);
          profileByEmailStore.set(normalizedEmail, profile);
          return profile;
        }
      } catch (err) {
        console.warn("Neon DB query warning on traveler profile, falling back to memory:", err);
      }
    }

    // Create new profile
    const id = `dcc:trav:${crypto.randomUUID().slice(0, 12)}`;
    const now = new Date().toISOString();
    const newProfile: TravelerProfile = {
      id,
      email: normalizedEmail,
      fullName,
      phoneNumber,
      metadata: metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      try {
        await db.insert(dccTravelerProfiles).values({
          id: newProfile.id,
          email: newProfile.email,
          fullName: newProfile.fullName || null,
          phoneNumber: newProfile.phoneNumber || null,
          metadata: newProfile.metadata || {},
        });
      } catch (err) {
        console.warn("Neon DB insert warning on traveler profile:", err);
      }
    }

    profileStore.set(newProfile.id, newProfile);
    profileByEmailStore.set(normalizedEmail, newProfile);
    return newProfile;
  }

  /**
   * Get traveler profile by ID
   */
  static async getProfile(travelerId: string): Promise<TravelerProfile | null> {
    const mem = profileStore.get(travelerId);
    if (mem) return mem;

    const db = getDb();
    if (db) {
      try {
        const [existing] = await db
          .select()
          .from(dccTravelerProfiles)
          .where(eq(dccTravelerProfiles.id, travelerId));

        if (existing) {
          const profile: TravelerProfile = {
            id: existing.id,
            email: existing.email,
            fullName: existing.fullName || undefined,
            phoneNumber: existing.phoneNumber || undefined,
            metadata: (existing.metadata as Record<string, unknown>) || {},
            createdAt: existing.createdAt.toISOString(),
            updatedAt: existing.updatedAt.toISOString(),
          };
          profileStore.set(profile.id, profile);
          profileByEmailStore.set(profile.email, profile);
          return profile;
        }
      } catch (err) {
        console.warn("Neon DB query warning on getProfile:", err);
      }
    }

    return null;
  }

  /**
   * Get traveler profile by email
   */
  static async getProfileByEmail(email: string): Promise<TravelerProfile | null> {
    const normalized = email.trim().toLowerCase();
    const mem = profileByEmailStore.get(normalized);
    if (mem) return mem;

    const db = getDb();
    if (db) {
      try {
        const [existing] = await db
          .select()
          .from(dccTravelerProfiles)
          .where(eq(dccTravelerProfiles.email, normalized));

        if (existing) {
          const profile: TravelerProfile = {
            id: existing.id,
            email: existing.email,
            fullName: existing.fullName || undefined,
            phoneNumber: existing.phoneNumber || undefined,
            metadata: (existing.metadata as Record<string, unknown>) || {},
            createdAt: existing.createdAt.toISOString(),
            updatedAt: existing.updatedAt.toISOString(),
          };
          profileStore.set(profile.id, profile);
          profileByEmailStore.set(normalized, profile);
          return profile;
        }
      } catch (err) {
        console.warn("Neon DB query warning on getProfileByEmail:", err);
      }
    }

    return null;
  }

  /**
   * Create a passwordless authentication challenge (OTP + Token)
   */
  static async createPasswordlessChallenge(email: string): Promise<AuthChallenge> {
    const normalizedEmail = email.trim().toLowerCase();
    const challengeId = `chal_${crypto.randomUUID().slice(0, 12)}`;
    const token = crypto.randomBytes(24).toString("hex");
    // Generate secure 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MINUTES * 60 * 1000).toISOString();

    const challenge: AuthChallenge = {
      challengeId,
      email: normalizedEmail,
      token,
      otpCode,
      expiresAt,
    };

    challengeStore.set(challengeId, challenge);
    challengeStore.set(token, challenge);
    challengeStore.set(`${normalizedEmail}:${otpCode}`, challenge);

    const db = getDb();
    if (db) {
      try {
        await db.insert(dccAuthTokens).values({
          id: challengeId,
          email: normalizedEmail,
          tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
          otpCode,
          expiresAt: new Date(expiresAt),
        });
      } catch (err) {
        console.warn("Neon DB insert warning on auth token:", err);
      }
    }

    return challenge;
  }

  /**
   * Verify passwordless challenge via OTP or magic token
   */
  static async verifyPasswordlessChallenge(
    email: string,
    codeOrToken: string
  ): Promise<{ profile: TravelerProfile; session: TravelerSession }> {
    const normalizedEmail = email.trim().toLowerCase();
    const input = codeOrToken.trim();

    // Check in-memory store
    let challenge =
      challengeStore.get(input) ||
      challengeStore.get(`${normalizedEmail}:${input}`);

    if (!challenge) {
      // Check Neon DB
      const db = getDb();
      if (db) {
        try {
          const [dbChallenge] = await db
            .select()
            .from(dccAuthTokens)
            .where(
              eq(dccAuthTokens.email, normalizedEmail)
            );

          if (dbChallenge && !dbChallenge.consumedAt) {
            const isMatch =
              dbChallenge.otpCode === input ||
              dbChallenge.tokenHash === crypto.createHash("sha256").update(input).digest("hex");

            if (isMatch && new Date(dbChallenge.expiresAt) > new Date()) {
              challenge = {
                challengeId: dbChallenge.id,
                email: dbChallenge.email,
                token: input,
                otpCode: dbChallenge.otpCode,
                expiresAt: dbChallenge.expiresAt.toISOString(),
              };

              // Mark consumed
              await db
                .update(dccAuthTokens)
                .set({ consumedAt: new Date() })
                .where(eq(dccAuthTokens.id, dbChallenge.id));
            }
          }
        } catch (err) {
          console.warn("Neon DB error verifying auth token:", err);
        }
      }
    }

    if (!challenge) {
      throw new Error("Invalid or expired authentication code");
    }

    if (new Date(challenge.expiresAt) < new Date()) {
      challengeStore.delete(challenge.challengeId);
      throw new Error("Authentication code has expired. Please request a new code.");
    }

    // Mark challenge as consumed
    challengeStore.delete(challenge.challengeId);
    challengeStore.delete(challenge.token);
    challengeStore.delete(`${normalizedEmail}:${challenge.otpCode}`);

    // Get or create traveler profile
    const profile = await this.getOrCreateProfile(normalizedEmail);

    // Generate signed session
    const session = this.createSession(profile);

    return { profile, session };
  }

  /**
   * Create signed stateless session token
   */
  static createSession(profile: TravelerProfile): TravelerSession {
    const now = Math.floor(Date.now() / 1000);
    const expiresAtSeconds = now + SESSION_TTL_SECONDS;
    const expiresAt = new Date(expiresAtSeconds * 1000).toISOString();
    const nonce = crypto.randomBytes(12).toString("hex");
    const sig = signSession(SESSION_VERSION, profile.id, profile.email, String(expiresAtSeconds), nonce);

    const sessionToken = `${SESSION_VERSION}.${profile.id}.${Buffer.from(profile.email).toString("base64url")}.${expiresAtSeconds}.${nonce}.${sig}`;

    return {
      sessionToken,
      travelerId: profile.id,
      email: profile.email,
      expiresAt,
    };
  }

  /**
   * Verify signed session token
   */
  static verifySession(sessionToken: string | null | undefined): { travelerId: string; email: string } | null {
    if (!sessionToken) return null;

    const parts = sessionToken.split(".");
    if (parts.length !== 6) return null;

    const [version, travelerId, encodedEmail, expiresAtSecondsStr, nonce, signature] = parts;
    if (version !== SESSION_VERSION) return null;

    const expiresAtSeconds = Number(expiresAtSecondsStr);
    if (!Number.isFinite(expiresAtSeconds)) return null;
    if (expiresAtSeconds <= Math.floor(Date.now() / 1000)) return null;

    let email = "";
    try {
      email = Buffer.from(encodedEmail, "base64url").toString("utf8");
    } catch {
      return null;
    }

    const expectedSig = signSession(version, travelerId, email, expiresAtSecondsStr, nonce);
    if (!expectedSig || expectedSig.length !== signature.length) return null;

    try {
      const isValid = crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signature));
      if (!isValid) return null;
    } catch {
      return null;
    }

    return { travelerId, email };
  }

  /**
   * Get all trips and bookings for a traveler
   * External referral clickouts (Viator, FareHarbor) never appear here unless imported authorized bookings.
   */
  static async getTravelerTrips(travelerIdOrEmail: string): Promise<TravelerTripsSummary> {
    let profile: TravelerProfile | null = null;
    if (travelerIdOrEmail.startsWith("dcc:trav:")) {
      profile = await this.getProfile(travelerIdOrEmail);
    } else {
      profile = await this.getProfileByEmail(travelerIdOrEmail);
    }

    if (!profile) {
      profile = await this.getOrCreateProfile(travelerIdOrEmail);
    }

    const { DccOrderService } = await import("@/lib/orders");
    const { DccBookingService } = await import("@/lib/bookings");

    // Fetch master orders for traveler
    const orders = await DccOrderService.getOrdersByTravelerOrEmail(profile.id, profile.email);
    const tripOrders: TravelerTripOrder[] = [];

    let activeCount = 0;
    let pastCount = 0;

    for (const order of orders) {
      const tripBookings: TravelerTripBooking[] = [];

      for (const item of order.items) {
        let bookingDetails: any = null;
        if (item.bookingId) {
          bookingDetails = await DccBookingService.getBooking(item.bookingId);
        }

        const isCancelled = item.status === "CANCELLED" || bookingDetails?.status === "CANCELLED";
        const isCompleted = item.serviceCompleted || item.status === "COMPLETED";

        const tripBooking: TravelerTripBooking = {
          bookingId: item.bookingId || item.itemId,
          bookingUuid: item.bookingUuid || item.itemId,
          productId: item.productId,
          productTitle: item.productTitle || item.productId,
          optionId: item.optionId,
          optionTitle: item.optionTitle,
          availabilityId: item.availabilityId,
          operatorSlug: item.operatorSlug || "dcc-operator",
          operatorName: item.operatorName || "Authorized Operator",
          status: isCancelled ? "CANCELLED" : isCompleted ? "COMPLETED" : (item.status || "CONFIRMED"),
          eventDate: item.eventDate || bookingDetails?.eventDate,
          eventTime: item.eventTime || bookingDetails?.eventTime,
          price: item.price,
          currency: item.currency || "USD",
          unitItems: item.unitItems || [],
          voucher: bookingDetails?.voucher || (item as any).voucher || {
            code: `DCC-${(item.bookingId || item.itemId).replace(/^dcc:(bk|item):/, "").slice(0, 8).toUpperCase()}`,
            redemptionUrl: `https://destinationcommandcenter.com/voucher/${item.bookingId || item.itemId}`,
            instructions: "Present this digital voucher or QR code upon arrival at the tour meeting point.",
          },
          meetingPoint: bookingDetails?.meetingPoint || (item as any).meetingPoint,
          cancellationPolicy: "Free cancellation up to 24 hours before the scheduled departure.",
        };

        tripBookings.push(tripBooking);
      }

      if (order.status === "CONFIRMED" || order.status === "ON_HOLD") {
        activeCount++;
      } else if (order.status === "COMPLETED") {
        pastCount++;
      }

      tripOrders.push({
        orderId: order.orderId,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        totalPrice: order.totalPrice,
        currency: order.currency,
        paymentId: order.paymentId,
        paymentStatus: order.status === "CONFIRMED" ? "captured" : "pending",
        items: tripBookings,
      });
    }

    return {
      traveler: profile,
      orders: tripOrders,
      activeTripsCount: activeCount,
      pastTripsCount: pastCount,
    };
  }
}
