import fs from "node:fs";
import path from "node:path";
import { evaluateCityPublishability } from "@/src/lib/sitemap/city-publishability";
import { CITY_AUTHORITY_CONFIG } from "@/src/data/city-authority-config";

type RouteKey = "tours" | "shows" | "attractions" | "day-trips" | "helicopter";

function main() {
  const cities = Object.entries(CITY_AUTHORITY_CONFIG)
    .map(([cityKey, config]) => evaluateCityPublishability(cityKey, config))
    .sort((a, b) => a.cityKey.localeCompare(b.cityKey));

  const routeKeys: RouteKey[] = ["tours", "shows", "attractions", "day-trips", "helicopter"];

  const report = {
    version: "sitemap-coverage.v1",
    generated_at: new Date().toISOString(),
    summary: {
      cities_total: cities.length,
      cities_publishable: cities.filter((c) => c.root.included).length,
      cities_excluded: cities.filter((c) => !c.root.included).length,
      routes: Object.fromEntries(
        routeKeys.map((key) => [
          key,
          {
            included: cities.filter((c) => c.routes[key].included).length,
            excluded: cities.filter((c) => !c.routes[key].included).length,
          },
        ])
      ) as Record<RouteKey, { included: number; excluded: number }>,
    },
    cities: cities.map((city) => ({
      city_key: city.cityKey,
      root: {
        included: city.root.included,
        reasons: city.root.reasons,
      },
      routes: Object.fromEntries(
        routeKeys.map((key) => [
          key,
          {
            included: city.routes[key].included,
            reasons: city.routes[key].reasons,
          },
        ])
      ) as Record<RouteKey, { included: boolean; reasons: string[] }>,
    })),
  };

  const outDir = path.join(process.cwd(), "data", "network", "health");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "sitemap-coverage.v1.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        summary: report.summary,
        output: {
          sitemap_coverage: outPath,
        },
      },
      null,
      2
    )
  );
}

main();
