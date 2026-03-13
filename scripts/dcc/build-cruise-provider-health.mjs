import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const ACTION_DIR = path.join(ROOT, "data", "action");
const OUT_PATH = path.join(ACTION_DIR, "cruise.providers.health.json");

const TIMEOUT_MS = Number(process.env.CRUISE_PROVIDER_TIMEOUT_MS || 5000);

const PROVIDERS = [
  {
    id: "carnival",
    feedUrl: process.env.CARNIVAL_CRUISE_FEED_URL || "",
    apiKey: process.env.CARNIVAL_CRUISE_API_KEY || "",
  },
  {
    id: "royalcaribbean",
    feedUrl: process.env.ROYAL_CARIBBEAN_CRUISE_FEED_URL || "",
    apiKey: process.env.ROYAL_CARIBBEAN_CRUISE_API_KEY || "",
  },
  {
    id: "norwegian",
    feedUrl: process.env.NORWEGIAN_CRUISE_FEED_URL || "",
    apiKey: process.env.NORWEGIAN_CRUISE_API_KEY || "",
  },
];

function countRows(payload) {
  if (Array.isArray(payload)) return payload.length;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.sailings)) return payload.sailings.length;
    if (Array.isArray(payload.data)) return payload.data.length;
  }
  return 0;
}

async function fetchJson(url, apiKey, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = { accept: "application/json" };
    if (apiKey) headers["x-api-key"] = apiKey;
    const res = await fetch(url, { headers, signal: controller.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const started = Date.now();
  const providerStatus = [];

  for (const provider of PROVIDERS) {
    if (!provider.feedUrl) {
      providerStatus.push({
        provider: provider.id,
        configured: false,
        live_rows: 0,
        ok: false,
        error: null,
      });
      continue;
    }

    try {
      const payload = await fetchJson(provider.feedUrl, provider.apiKey, TIMEOUT_MS);
      const rows = countRows(payload);
      providerStatus.push({
        provider: provider.id,
        configured: true,
        live_rows: rows,
        ok: true,
        error: null,
      });
    } catch (error) {
      providerStatus.push({
        provider: provider.id,
        configured: true,
        live_rows: 0,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const snapshot = {
    generated_at: new Date().toISOString(),
    timeout_ms: TIMEOUT_MS,
    duration_ms: Date.now() - started,
    totals: {
      providers_total: providerStatus.length,
      providers_configured: providerStatus.filter((p) => p.configured).length,
      live_rows: providerStatus.reduce((acc, p) => acc + p.live_rows, 0),
      provider_errors: providerStatus.filter((p) => p.error).length,
    },
    provider_status: providerStatus,
  };

  fs.mkdirSync(ACTION_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(snapshot, null, 2) + "\n");

  console.log(`Built provider health snapshot: ${OUT_PATH}`);
  console.log(`Configured providers: ${snapshot.totals.providers_configured}/${snapshot.totals.providers_total}`);
  console.log(`Live rows: ${snapshot.totals.live_rows}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
