import fs from "node:fs";
import path from "node:path";

type CruiseFreshnessReport = {
  summary: {
    total_entities: number;
    total_ports: number;
    total_ships: number;
    fresh: number;
    due_soon: number;
    stale: number;
    sailings_count: number;
    source_generated_at: string;
  };
  entities: Array<{
    entity_type: "port" | "ship";
    slug: string;
    status: "fresh" | "due_soon" | "stale";
    days_until_due: number;
  }>;
};

const REPORT_PATH = path.join(
  process.cwd(),
  "data",
  "network",
  "health",
  "cruise-freshness.v1.json"
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
            "Cruise freshness report is missing. Run dcc:cruise:freshness:report first.",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const report = JSON.parse(
    fs.readFileSync(REPORT_PATH, "utf8")
  ) as CruiseFreshnessReport;
  const failOnDueSoon = process.env.DCC_CRUISE_FAIL_ON_DUE_SOON === "1";

  const staleEntities = report.entities.filter((c) => c.status === "stale");
  const dueSoonEntities = report.entities.filter((c) => c.status === "due_soon");

  const result = {
    ok:
      staleEntities.length === 0 &&
      (!failOnDueSoon || dueSoonEntities.length === 0),
    fail_on_due_soon: failOnDueSoon,
    summary: report.summary,
    stale_entities: staleEntities,
    due_soon_entities: dueSoonEntities,
  };

  console.log(JSON.stringify(result, null, 2));

  if (staleEntities.length > 0) {
    process.exit(1);
  }
  if (failOnDueSoon && dueSoonEntities.length > 0) {
    process.exit(1);
  }
}

main();
