import fs from "node:fs";
import path from "node:path";

type CityFreshnessReport = {
  summary: {
    total_cities: number;
    fresh: number;
    due_soon: number;
    stale: number;
    missing_money_lane: number;
  };
  cities: Array<{
    city_key: string;
    status: "fresh" | "due_soon" | "stale";
    days_until_due: number;
  }>;
};

const REPORT_PATH = path.join(
  process.cwd(),
  "data",
  "network",
  "health",
  "city-freshness.v1.json"
);

function main() {
  if (!fs.existsSync(REPORT_PATH)) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          reason: "missing_report",
          report_path: REPORT_PATH,
          message:
            "City freshness report is missing. Run dcc:city:freshness:report first.",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const report = JSON.parse(
    fs.readFileSync(REPORT_PATH, "utf8")
  ) as CityFreshnessReport;
  const failOnDueSoon = process.env.DCC_CITY_FAIL_ON_DUE_SOON === "1";

  const staleCities = report.cities.filter((c) => c.status === "stale");
  const dueSoonCities = report.cities.filter((c) => c.status === "due_soon");

  const result = {
    ok:
      staleCities.length === 0 &&
      (!failOnDueSoon || dueSoonCities.length === 0),
    fail_on_due_soon: failOnDueSoon,
    summary: report.summary,
    stale_cities: staleCities,
    due_soon_cities: dueSoonCities,
  };

  console.log(JSON.stringify(result, null, 2));

  if (staleCities.length > 0) {
    process.exit(1);
  }
  if (failOnDueSoon && dueSoonCities.length > 0) {
    process.exit(1);
  }
}

main();
