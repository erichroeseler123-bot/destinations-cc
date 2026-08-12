import { listNetworkSatellites } from "../../lib/dcc/contracts/networkSatellites";
import { SUITE_SITES } from "../../src/data/network-graph";

function host(value: string) {
  return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
}

const suiteHosts = new Map(SUITE_SITES.map((site) => [host(site.url), site]));
const handoffHosts = new Map(listNetworkSatellites().map((site) => [host(site.origin), site]));

const errors: string[] = [];
for (const [hostname, satellite] of handoffHosts) {
  if (!suiteHosts.has(hostname)) errors.push(`Handoff satellite ${satellite.name} (${hostname}) is missing from SUITE_SITES.`);
}

for (const [hostname, site] of suiteHosts) {
  if (site.id === "dcc" || site.id === "rrfp") continue;
  if (!handoffHosts.has(hostname)) errors.push(`Suite site ${site.name} (${hostname}) has no canonical DCC handoff registry entry.`);
}

if (errors.length) {
  console.error("Suite registry alignment failed:\n" + errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Suite registry alignment passed: ${suiteHosts.size} suite sites, ${handoffHosts.size} handoff satellites.`);
