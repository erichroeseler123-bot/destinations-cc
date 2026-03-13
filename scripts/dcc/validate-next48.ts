import { buildNext48Feed } from "@/lib/dcc/next48/feed";

type Finding = { severity: "error" | "info"; code: string; message: string };

const findings: Finding[] = [];
const now = new Date();

const targets = [
  { entityType: "city" as const, slug: "denver" },
  { entityType: "port" as const, slug: "juneau" },
];

for (const target of targets) {
  const feed = await buildNext48Feed({ entityType: target.entityType, slug: target.slug, now });

  const allItems = [
    ...feed.buckets.now,
    ...feed.buckets.tonight,
    ...feed.buckets.tomorrow,
    ...feed.buckets["later-48h"],
  ];

  if (!allItems.length) {
    findings.push({ severity: "error", code: "next48.empty", message: `${target.entityType}:${target.slug} has no next48 items.` });
  }

  for (const item of allItems) {
    const deltaMs = new Date(item.startAt).getTime() - now.getTime();
    if (deltaMs > 48 * 60 * 60 * 1000) {
      findings.push({ severity: "error", code: "next48.window_violation", message: `${target.slug} item ${item.id} is outside 48h window.` });
    }
  }

  if (!feed.sourceDiagnostics.some((d) => d.source === "live-pulse")) {
    findings.push({ severity: "error", code: "next48.live_pulse_missing", message: `${target.slug} missing live-pulse diagnostics.` });
  }

  findings.push({ severity: "info", code: "next48.count", message: `${target.slug} items: ${allItems.length}` });
}

const errors = findings.filter((f) => f.severity === "error");
const infos = findings.filter((f) => f.severity === "info");

console.log(JSON.stringify({ ok: errors.length === 0, errors_count: errors.length, infos_count: infos.length, errors, infos }, null, 2));
if (errors.length) process.exit(1);
