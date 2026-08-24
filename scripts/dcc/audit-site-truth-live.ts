import { DCC_SITE_TRUTH } from "../../lib/dcc/siteTruth";

type FetchResult = {
  url: string;
  ok: boolean;
  status?: number;
  text: string;
  error?: string;
};

type Finding = {
  site: string;
  level: "error" | "warning";
  message: string;
};

const REQUIRED_REACHABLE = new Set(["destination-command-center", "shuttleya"]);
const findings: Finding[] = [];

async function fetchText(url: string): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "DCC-Truth-Audit/1.0 (+https://www.destinationcommandcenter.com)",
        Accept: "text/html,application/json,text/plain;q=0.9,*/*;q=0.1",
      },
    });
    return {
      url,
      ok: response.ok,
      status: response.status,
      text: await response.text(),
    };
  } catch (error) {
    return {
      url,
      ok: false,
      text: "",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function add(site: string, level: Finding["level"], message: string) {
  findings.push({ site, level, message });
}

function containsAny(text: string, phrases: readonly string[]) {
  const normalized = text.toLowerCase();
  return phrases.some((phrase) => normalized.includes(phrase.toLowerCase()));
}

async function auditSite(record: (typeof DCC_SITE_TRUTH)[number]) {
  const base = record.url.replace(/\/$/, "");
  const [homepage, agent, llms] = await Promise.all([
    fetchText(`${base}/`),
    fetchText(`${base}/agent.json`),
    fetchText(`${base}/llms.txt`),
  ]);

  if (!homepage.ok) {
    add(
      record.id,
      REQUIRED_REACHABLE.has(record.id) ? "error" : "warning",
      `homepage unreachable (${homepage.status ?? homepage.error ?? "unknown error"})`,
    );
  }

  if (agent.ok && !agent.text.includes(record.dcc_id)) {
    add(record.id, "error", `agent.json is reachable but does not declare ${record.dcc_id}`);
  }

  if (llms.ok && !llms.text.includes(record.name)) {
    add(record.id, "warning", "llms.txt is reachable but does not clearly identify the current property name");
  }

  if (!agent.ok && !llms.ok) {
    add(record.id, "warning", "neither agent.json nor llms.txt was reachable during the audit");
  }

  if (record.id === "shuttleya") {
    const surfaces = [homepage, agent, llms].filter((surface) => surface.ok);
    const forbidden = [
      "Initiate $35 Checkout",
      "Book Your Seat Now",
      "STATUS: ACTIVE",
      "9AM Shuttle to Mighty Argo Cable Car",
    ];

    for (const surface of surfaces) {
      if (containsAny(surface.text, forbidden)) {
        add(record.id, "error", `${surface.url} still exposes a retired Mighty Argo sales/active-service claim`);
      }
    }

    if (homepage.ok && !containsAny(homepage.text, ["not operating", "retired"])) {
      add(record.id, "error", "homepage does not clearly state that the former Mighty Argo scheduled shuttle is not operating");
    }
    if (agent.ok && !containsAny(agent.text, ["retired_not_operating"])) {
      add(record.id, "error", "agent.json does not preserve retired_not_operating for the former Mighty Argo service");
    }
    if (llms.ok && !containsAny(llms.text, ["retired", "not operating"])) {
      add(record.id, "error", "llms.txt does not preserve the retired Mighty Argo service state");
    }
  }

  if (record.id === "bigsky-gosno" && homepage.ok) {
    if (!containsAny(homepage.text, ["november 15, 2026", "nov 15, 2026", "2026-11-15"])) {
      add(record.id, "error", "prelaunch homepage does not expose the November 15, 2026 first-service date");
    }
    if (!homepage.text.includes("299") || !homepage.text.includes("548")) {
      add(record.id, "error", "prelaunch homepage does not expose both canonical $299 one-way and $548 round-trip figures");
    }
  }

  if (record.id === "welcome-to-the-swamp" && homepage.ok) {
    const lower = homepage.text.toLowerCase();
    if (lower.includes("$5") && lower.includes("orientation pass")) {
      add(record.id, "error", "homepage appears to reintroduce the retired/stale $5 French Quarter Orientation Pass as a Swamp product");
    }
  }

  return {
    site: record.id,
    status: record.status.state,
    homepage: homepage.ok ? homepage.status : homepage.status ?? homepage.error,
    agent: agent.ok ? agent.status : agent.status ?? agent.error,
    llms: llms.ok ? llms.status : llms.status ?? llms.error,
  };
}

const results = [];
for (const record of DCC_SITE_TRUTH) {
  results.push(await auditSite(record));
}

const errors = findings.filter((finding) => finding.level === "error");
const warnings = findings.filter((finding) => finding.level === "warning");

console.log(JSON.stringify({
  audited_at: new Date().toISOString(),
  sites: results,
  errors,
  warnings,
}, null, 2));

if (errors.length > 0) {
  process.exitCode = 1;
}
