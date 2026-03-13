import fs from "node:fs";
import path from "node:path";
import {
  listCruiseCanonicalPortSlugs,
  listCruiseShipSlugs,
} from "@/lib/dcc/internal/cruisePayload";

type FreshnessStatus = "fresh" | "due_soon" | "stale";

type CruiseFreshnessRow = {
  entity_type: "port" | "ship";
  slug: string;
  updated_at: string;
  refresh_interval_days: number;
  age_days: number;
  due_at: string;
  days_until_due: number;
  status: FreshnessStatus;
};

const ROOT = process.cwd();
const CACHE_PATH = path.join(ROOT, "data", "action", "cruise.sailings.cache.json");

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function statusFor(daysUntilDue: number, refreshIntervalDays: number): FreshnessStatus {
  if (daysUntilDue < 0) return "stale";
  const nearDueThreshold = Math.floor(refreshIntervalDays * 0.2);
  if (daysUntilDue <= nearDueThreshold) return "due_soon";
  return "fresh";
}

function readCacheMeta(): { generatedAt: Date | null; generatedAtRaw: string | null; sailingsCount: number } {
  if (!fs.existsSync(CACHE_PATH)) {
    return { generatedAt: null, generatedAtRaw: null, sailingsCount: 0 };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")) as {
      generated_at?: string;
      sailings?: unknown[];
    };
    const generatedAtRaw = typeof raw.generated_at === "string" ? raw.generated_at : null;
    const generatedAt = generatedAtRaw ? new Date(generatedAtRaw) : null;
    const validGeneratedAt =
      generatedAt && !Number.isNaN(generatedAt.getTime()) ? generatedAt : null;
    return {
      generatedAt: validGeneratedAt,
      generatedAtRaw,
      sailingsCount: Array.isArray(raw.sailings) ? raw.sailings.length : 0,
    };
  } catch {
    return { generatedAt: null, generatedAtRaw: null, sailingsCount: 0 };
  }
}

function main() {
  const now = new Date();
  const meta = readCacheMeta();
  const baseUpdatedAt = meta.generatedAt || now;
  const baseUpdatedAtRaw = meta.generatedAtRaw || now.toISOString();

  const portRefreshIntervalDays = Number(
    process.env.CRUISE_PORT_REFRESH_INTERVAL_DAYS || "30"
  );
  const shipRefreshIntervalDays = Number(
    process.env.CRUISE_SHIP_REFRESH_INTERVAL_DAYS || "45"
  );

  const portRows: CruiseFreshnessRow[] = listCruiseCanonicalPortSlugs()
    .sort()
    .map((slug) => {
      const ageDays = daysBetween(now, baseUpdatedAt);
      const dueAt = new Date(
        baseUpdatedAt.getTime() + portRefreshIntervalDays * 24 * 60 * 60 * 1000
      );
      const daysUntilDue = daysBetween(dueAt, now);
      return {
        entity_type: "port",
        slug,
        updated_at: baseUpdatedAtRaw,
        refresh_interval_days: portRefreshIntervalDays,
        age_days: ageDays,
        due_at: dueAt.toISOString().slice(0, 10),
        days_until_due: daysUntilDue,
        status: statusFor(daysUntilDue, portRefreshIntervalDays),
      };
    });

  const shipRows: CruiseFreshnessRow[] = listCruiseShipSlugs()
    .sort()
    .map((slug) => {
      const ageDays = daysBetween(now, baseUpdatedAt);
      const dueAt = new Date(
        baseUpdatedAt.getTime() + shipRefreshIntervalDays * 24 * 60 * 60 * 1000
      );
      const daysUntilDue = daysBetween(dueAt, now);
      return {
        entity_type: "ship",
        slug,
        updated_at: baseUpdatedAtRaw,
        refresh_interval_days: shipRefreshIntervalDays,
        age_days: ageDays,
        due_at: dueAt.toISOString().slice(0, 10),
        days_until_due: daysUntilDue,
        status: statusFor(daysUntilDue, shipRefreshIntervalDays),
      };
    });

  const rows = [...portRows, ...shipRows];
  const cacheAgeDays = daysBetween(now, baseUpdatedAt);
  const summary = {
    total_entities: rows.length,
    total_ports: portRows.length,
    total_ships: shipRows.length,
    fresh: rows.filter((r) => r.status === "fresh").length,
    due_soon: rows.filter((r) => r.status === "due_soon").length,
    stale: rows.filter((r) => r.status === "stale").length,
    sailings_count: meta.sailingsCount,
    source_generated_at: baseUpdatedAtRaw,
    cache_age_days: cacheAgeDays,
  };

  const report = {
    version: "cruise-freshness.v1",
    generated_at: now.toISOString(),
    summary,
    entities: rows,
  };

  const outDir = path.join(ROOT, "data", "network", "health");
  ensureDir(outDir);
  const outPath = path.join(outDir, "cruise-freshness.v1.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(
    JSON.stringify(
      {
        cruise_freshness: outPath,
        summary,
      },
      null,
      2
    )
  );
}

main();
