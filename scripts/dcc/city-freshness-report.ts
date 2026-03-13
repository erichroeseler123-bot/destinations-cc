import fs from "node:fs";
import path from "node:path";
import { CITY_AUTHORITY_CONFIG } from "@/src/data/city-authority-config";
import { CITY_MONEY_LANES } from "@/src/data/city-money-lanes";

type FreshnessStatus = "fresh" | "due_soon" | "stale";

type CityFreshnessRow = {
  city_key: string;
  city_name: string;
  canonical_path: string;
  updated_at: string;
  refresh_interval_days: number;
  age_days: number;
  due_at: string;
  days_until_due: number;
  status: FreshnessStatus;
  has_money_lane: boolean;
};

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const now = new Date();
  const rows: CityFreshnessRow[] = Object.entries(CITY_AUTHORITY_CONFIG)
    .map(([key, cfg]) => {
      const updatedAt = new Date(cfg.updatedAt);
      const dueAt = new Date(updatedAt.getTime() + cfg.refreshIntervalDays * 24 * 60 * 60 * 1000);
      const ageDays = daysBetween(now, updatedAt);
      const daysUntilDue = daysBetween(dueAt, now);
      const nearDueThreshold = Math.floor(cfg.refreshIntervalDays * 0.2);

      let status: FreshnessStatus = "fresh";
      if (daysUntilDue < 0) status = "stale";
      else if (daysUntilDue <= nearDueThreshold) status = "due_soon";

      return {
        city_key: key,
        city_name: cfg.cityName,
        canonical_path: cfg.canonicalPath,
        updated_at: cfg.updatedAt,
        refresh_interval_days: cfg.refreshIntervalDays,
        age_days: ageDays,
        due_at: dueAt.toISOString().slice(0, 10),
        days_until_due: daysUntilDue,
        status,
        has_money_lane: Boolean(CITY_MONEY_LANES[key]),
      };
    })
    .sort((a, b) => a.city_key.localeCompare(b.city_key));

  const summary = {
    total_cities: rows.length,
    fresh: rows.filter((r) => r.status === "fresh").length,
    due_soon: rows.filter((r) => r.status === "due_soon").length,
    stale: rows.filter((r) => r.status === "stale").length,
    missing_money_lane: rows.filter((r) => !r.has_money_lane).length,
  };

  const report = {
    version: "city-freshness.v1",
    generated_at: now.toISOString(),
    summary,
    cities: rows,
  };

  const outDir = path.join(process.cwd(), "data", "network", "health");
  ensureDir(outDir);
  const outPath = path.join(outDir, "city-freshness.v1.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(
    JSON.stringify(
      {
        city_freshness: outPath,
        summary,
      },
      null,
      2
    )
  );
}

main();
