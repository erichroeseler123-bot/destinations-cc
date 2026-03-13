import { buildLivePulseFeed } from "@/lib/dcc/livePulse/feed";
import { LIVE_PULSE_SIGNAL_CATALOG } from "@/lib/dcc/livePulse/types";
import { buildSeedSignals } from "@/lib/dcc/livePulse/store";

type Finding = { severity: "error" | "info"; code: string; message: string };

const findings: Finding[] = [];
const now = new Date();
const seeds = buildSeedSignals(now);

for (const seed of seeds) {
  if ((seed.note || "").length > 140) {
    findings.push({ severity: "error", code: "live_pulse.note_too_long", message: `${seed.id} note exceeds 140 chars.` });
  }
  const catalog = LIVE_PULSE_SIGNAL_CATALOG[seed.signalType];
  const durationMinutes = Math.floor((new Date(seed.expiresAt).getTime() - new Date(seed.createdAt).getTime()) / 60000);
  if (catalog.category === "vibe" && durationMinutes > 60) {
    findings.push({ severity: "error", code: "live_pulse.vibe_ttl", message: `${seed.id} vibe signal exceeds 60 minute TTL.` });
  }
  if (catalog.category === "operational" && durationMinutes > 120) {
    findings.push({ severity: "error", code: "live_pulse.ops_ttl", message: `${seed.id} operational signal exceeds 120 minute TTL.` });
  }
}

const denverFeed = buildLivePulseFeed({ entityType: "city", entitySlug: "denver", target: "city-feed", limit: 6 }, now);
const juneauFeed = buildLivePulseFeed({ entityType: "port", entitySlug: "juneau", target: "entity", limit: 6 }, now);
const redRocksFeed = buildLivePulseFeed({ entityType: "venue", entitySlug: "red-rocks-amphitheatre", target: "entity", limit: 6 }, now);

if (!denverFeed.items.length) {
  findings.push({ severity: "error", code: "live_pulse.denver_empty", message: "Denver city-feed has no active signals." });
}
if (!juneauFeed.items.length) {
  findings.push({ severity: "error", code: "live_pulse.juneau_empty", message: "Juneau port entity feed has no active signals." });
}
if (!redRocksFeed.items.length) {
  findings.push({ severity: "error", code: "live_pulse.redrocks_empty", message: "Red Rocks entity feed has no active signals." });
}

findings.push({ severity: "info", code: "live_pulse.denver_count", message: `Denver feed items: ${denverFeed.items.length}` });
findings.push({ severity: "info", code: "live_pulse.juneau_count", message: `Juneau feed items: ${juneauFeed.items.length}` });
findings.push({ severity: "info", code: "live_pulse.redrocks_count", message: `Red Rocks feed items: ${redRocksFeed.items.length}` });

const errors = findings.filter((f) => f.severity === "error");
const infos = findings.filter((f) => f.severity === "info");

console.log(JSON.stringify({ ok: errors.length === 0, errors_count: errors.length, infos_count: infos.length, errors, infos }, null, 2));
if (errors.length) process.exit(1);
