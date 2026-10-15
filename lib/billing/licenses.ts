import crypto from "crypto";
import fs from "fs";
import path from "path";
import { eq, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { dccLicenses, type DccLicenseRow } from "@/lib/db/schema";

export type LicensePlan = "venue_monthly" | "venue_annual" | "api_builder" | "api_pro" | "sandbox";

export type LicenseRecord = {
  key: string;
  email: string;
  plan: LicensePlan;
  status: "active" | "cancelled" | "past_due";
  authorizedDomains: string[];
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  maxMonthlyRequests: number;
  currentPeriodRequests: number;
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
};

const DATA_DIR = path.join(process.cwd(), "data", "licenses");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(key: string): string {
  ensureDataDir();
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(DATA_DIR, `${safeKey}.json`);
}

function persistLicenseFile(record: LicenseRecord): void {
  try {
    const file = getFilePath(record.key);
    fs.writeFileSync(file, JSON.stringify(record, null, 2), "utf8");
  } catch (err) {
    console.error("Local disk license cache failed:", err);
  }
}

function loadLicenseFile(key: string): LicenseRecord | null {
  try {
    const file = getFilePath(key);
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw) as LicenseRecord;
  } catch {
    return null;
  }
}

function rowToRecord(row: DccLicenseRow): LicenseRecord {
  return {
    key: row.key,
    email: row.email,
    plan: row.plan as LicensePlan,
    status: row.status as "active" | "cancelled" | "past_due",
    authorizedDomains: Array.isArray(row.authorizedDomains) ? row.authorizedDomains : [],
    stripeCustomerId: row.stripeCustomerId || undefined,
    stripeSubscriptionId: row.stripeSubscriptionId || undefined,
    maxMonthlyRequests: row.maxMonthlyRequests,
    currentPeriodRequests: row.currentPeriodRequests,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    revokedAt: row.revokedAt ? new Date(row.revokedAt).toISOString() : undefined,
  };
}

export function generateApiKey(prefix = "dcc_live"): string {
  const randomBytes = crypto.randomBytes(16).toString("hex");
  return `${prefix}_${randomBytes}`;
}

const PLAN_LIMITS: Record<LicensePlan, number> = {
  sandbox: 3000,
  venue_monthly: 50000,
  venue_annual: 75000,
  api_builder: 25000,
  api_pro: 150000,
};

export async function createVerifiedLicense(params: {
  email: string;
  plan: LicensePlan;
  authorizedDomains?: string[];
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  livemode?: boolean;
}): Promise<LicenseRecord> {
  // Explicitly respect Stripe's livemode boolean
  const isLive = params.livemode === true;

  const prefix = isLive
    ? params.plan.startsWith("venue")
      ? "dcc_venue"
      : "dcc_live"
    : params.plan.startsWith("venue")
    ? "dcc_test_venue"
    : "dcc_test_live";

  const key = generateApiKey(prefix);
  const now = new Date();
  const normalizedDomains = (params.authorizedDomains || []).map((d) => normalizeDomain(d)).filter(Boolean);
  const maxReqs = PLAN_LIMITS[params.plan] || 25000;

  const record: LicenseRecord = {
    key,
    email: params.email.trim().toLowerCase(),
    plan: params.plan,
    status: "active",
    authorizedDomains: normalizedDomains,
    stripeCustomerId: params.stripeCustomerId,
    stripeSubscriptionId: params.stripeSubscriptionId,
    maxMonthlyRequests: maxReqs,
    currentPeriodRequests: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // 1. Primary: Persistent Neon PostgreSQL database
  try {
    const db = getDb();
    if (db) {
      await db.insert(dccLicenses).values({
        key,
        email: record.email,
        plan: record.plan,
        status: "active",
        authorizedDomains: normalizedDomains,
        stripeCustomerId: record.stripeCustomerId || null,
        stripeSubscriptionId: record.stripeSubscriptionId || null,
        maxMonthlyRequests: maxReqs,
        currentPeriodRequests: 0,
        metadata: { livemode: isLive, mode: isLive ? "live" : "test" },
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch (err) {
    console.error("Failed to insert license into Neon DB:", err);
  }

  // 2. Secondary fallback / local cache
  persistLicenseFile(record);
  return record;
}

export async function getLicenseByKey(key?: string | null): Promise<LicenseRecord | null> {
  if (!key) return null;
  const trimmed = key.trim();

  // Try Neon DB
  try {
    const db = getDb();
    if (db) {
      const [row] = await db.select().from(dccLicenses).where(eq(dccLicenses.key, trimmed)).limit(1);
      if (row) return rowToRecord(row);
    }
  } catch (err) {
    console.error("Neon DB query failed for getLicenseByKey:", err);
  }

  // Fallback to local file cache
  return loadLicenseFile(trimmed);
}

export async function findLicense(identifier: string): Promise<LicenseRecord | null> {
  if (!identifier) return null;
  const trimmed = identifier.trim();

  // Try Neon DB query across key, subscription, customer ID, or email
  try {
    const db = getDb();
    if (db) {
      const [row] = await db
        .select()
        .from(dccLicenses)
        .where(
          or(
            eq(dccLicenses.key, trimmed),
            eq(dccLicenses.stripeSubscriptionId, trimmed),
            eq(dccLicenses.stripeCustomerId, trimmed),
            eq(dccLicenses.email, trimmed.toLowerCase())
          )
        )
        .limit(1);
      if (row) return rowToRecord(row);
    }
  } catch (err) {
    console.error("Neon DB query failed for findLicense:", err);
  }

  // Fallback to file search
  const direct = loadLicenseFile(trimmed);
  if (direct) return direct;

  try {
    ensureDataDir();
    const files = fs.readdirSync(DATA_DIR);
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      const content = fs.readFileSync(path.join(DATA_DIR, f), "utf8");
      const record = JSON.parse(content) as LicenseRecord;
      if (
        record.stripeSubscriptionId === trimmed ||
        record.stripeCustomerId === trimmed ||
        record.email === trimmed.toLowerCase()
      ) {
        return record;
      }
    }
  } catch {
    // fallback ignore
  }
  return null;
}

export async function updateLicenseStatus(
  keyOrSubscriptionId: string,
  newStatus: "active" | "cancelled" | "past_due",
): Promise<LicenseRecord | null> {
  const license = await findLicense(keyOrSubscriptionId);
  if (!license) return null;

  const now = new Date();
  license.status = newStatus;
  license.updatedAt = now.toISOString();
  if (newStatus === "cancelled") {
    license.revokedAt = license.updatedAt;
  }

  // Neon DB update
  try {
    const db = getDb();
    if (db) {
      await db
        .update(dccLicenses)
        .set({
          status: newStatus,
          updatedAt: now,
          revokedAt: newStatus === "cancelled" ? now : null,
        })
        .where(eq(dccLicenses.key, license.key));
    }
  } catch (err) {
    console.error("Failed to update license status in Neon DB:", err);
  }

  persistLicenseFile(license);
  return license;
}

export async function addAuthorizedDomain(key: string, domain: string): Promise<LicenseRecord | null> {
  const license = await getLicenseByKey(key);
  if (!license) return null;

  const normalized = normalizeDomain(domain);
  if (normalized && !license.authorizedDomains.includes(normalized)) {
    license.authorizedDomains.push(normalized);
    const now = new Date();
    license.updatedAt = now.toISOString();

    try {
      const db = getDb();
      if (db) {
        await db
          .update(dccLicenses)
          .set({
            authorizedDomains: license.authorizedDomains,
            updatedAt: now,
          })
          .where(eq(dccLicenses.key, license.key));
      }
    } catch (err) {
      console.error("Failed to update authorized domains in Neon DB:", err);
    }

    persistLicenseFile(license);
  }
  return license;
}

export async function revokeLicense(key: string): Promise<boolean> {
  const res = await updateLicenseStatus(key, "cancelled");
  return Boolean(res);
}

function normalizeDomain(input: string): string {
  try {
    const clean = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    return clean;
  } catch {
    return "";
  }
}

export async function verifyDomainAuthorization(
  key: string | null,
  originOrReferer?: string | null,
): Promise<{
  authorized: boolean;
  reason?: string;
  license?: LicenseRecord;
}> {
  if (!key) {
    return { authorized: false, reason: "missing_license_key" };
  }

  const license = await getLicenseByKey(key);
  if (!license) {
    return { authorized: false, reason: "invalid_license_key" };
  }

  if (license.status !== "active") {
    return { authorized: false, reason: `license_${license.status}`, license };
  }

  // Production guard: reject test licenses on live production sales environment
  const isProduction = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production";
  if (isProduction && license.key.startsWith("dcc_test_")) {
    return { authorized: false, reason: "test_license_rejected_in_production", license };
  }

  if (!originOrReferer) {
    // Allow direct test calls when in development or when no domain was whitelisted yet
    if (process.env.NODE_ENV !== "production" || license.authorizedDomains.length === 0) {
      return { authorized: true, license };
    }
    return { authorized: false, reason: "missing_referer", license };
  }

  const host = normalizeDomain(originOrReferer);

  // Localhost allowed in development
  if (process.env.NODE_ENV !== "production" && (host.includes("localhost") || host.includes("127.0.0.1"))) {
    return { authorized: true, license };
  }

  // If no domains are configured yet, allow initial installation verification
  if (license.authorizedDomains.length === 0) {
    return { authorized: true, license };
  }

  const matches = license.authorizedDomains.some((d) => host === d || host.endsWith(`.${d}`));
  if (!matches) {
    return { authorized: false, reason: "domain_not_whitelisted", license };
  }

  return { authorized: true, license };
}

export async function recordApiUsage(key?: string | null): Promise<{
  allowed: boolean;
  remaining: number;
  plan: LicensePlan;
  status: string;
}> {
  if (!key) {
    // Free Sandbox: allowed up to 100/day
    return { allowed: true, remaining: 100, plan: "sandbox", status: "active" };
  }

  const license = await getLicenseByKey(key);
  if (!license) {
    return { allowed: false, remaining: 0, plan: "sandbox", status: "unregistered" };
  }

  if (license.status !== "active") {
    return { allowed: false, remaining: 0, plan: license.plan, status: license.status };
  }

  const isProduction = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production";
  if (isProduction && license.key.startsWith("dcc_test_")) {
    return { allowed: false, remaining: 0, plan: license.plan, status: "test_mode_rejected_in_production" };
  }

  license.currentPeriodRequests += 1;
  const remaining = Math.max(0, license.maxMonthlyRequests - license.currentPeriodRequests);
  const allowed = license.currentPeriodRequests <= license.maxMonthlyRequests;

  // Atomic update in Neon DB across serverless workers
  try {
    const db = getDb();
    if (db) {
      await db
        .update(dccLicenses)
        .set({
          currentPeriodRequests: sql`${dccLicenses.currentPeriodRequests} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(dccLicenses.key, license.key));
    }
  } catch (err) {
    console.error("Failed to atomically record API usage in Neon DB:", err);
  }

  // Persist updated count to disk cache
  persistLicenseFile(license);

  return { allowed, remaining, plan: license.plan, status: license.status };
}
