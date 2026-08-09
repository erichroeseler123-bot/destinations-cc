import fs from "fs";
import path from "path";

type Site = {
  site_id: string;
  domain: string;
  role: string;
  terminal: boolean;
};

type SitesRegistry = {
  version: string;
  sites: Site[];
};

type Intent = {
  intent_id: string;
  primary_owner: string;
  supporting_sites: string[];
};

type IntentRegistry = {
  version: string;
  intents: Intent[];
};

type Handoff = {
  handoff_id: string;
  from: string;
  to: string;
  terminal: boolean;
  context: string[];
};

type HandoffRegistry = {
  version: string;
  handoffs: Handoff[];
};

function readJson<T>(name: string): T {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "network", name), "utf8")
  ) as T;
}

function assertUnique(values: string[], label: string, errors: string[]) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) errors.push(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

function main() {
  const sites = readJson<SitesRegistry>("sites.v1.json");
  const intents = readJson<IntentRegistry>("intent-ownership.v1.json");
  const handoffs = readJson<HandoffRegistry>("handoffs.v1.json");
  const errors: string[] = [];
  const warnings: string[] = [];

  assertUnique(sites.sites.map((site) => site.site_id), "site_id", errors);
  assertUnique(sites.sites.map((site) => site.domain), "domain", errors);
  assertUnique(intents.intents.map((intent) => intent.intent_id), "intent_id", errors);
  assertUnique(handoffs.handoffs.map((handoff) => handoff.handoff_id), "handoff_id", errors);

  const siteIds = new Set(sites.sites.map((site) => site.site_id));
  const siteById = new Map(sites.sites.map((site) => [site.site_id, site]));

  for (const intent of intents.intents) {
    if (!siteIds.has(intent.primary_owner)) {
      errors.push(`Intent ${intent.intent_id} has unknown primary_owner: ${intent.primary_owner}`);
    }
    for (const siteId of intent.supporting_sites) {
      if (!siteIds.has(siteId)) {
        errors.push(`Intent ${intent.intent_id} has unknown supporting site: ${siteId}`);
      }
      if (siteId === intent.primary_owner) {
        errors.push(`Intent ${intent.intent_id} repeats primary owner as supporting site: ${siteId}`);
      }
    }
  }

  for (const handoff of handoffs.handoffs) {
    if (!siteIds.has(handoff.from)) {
      errors.push(`Handoff ${handoff.handoff_id} has unknown from site: ${handoff.from}`);
    }
    if (!siteIds.has(handoff.to)) {
      errors.push(`Handoff ${handoff.handoff_id} has unknown to site: ${handoff.to}`);
    }
    if (handoff.from === handoff.to) {
      errors.push(`Handoff ${handoff.handoff_id} routes a site to itself`);
    }
    if (!Array.isArray(handoff.context) || handoff.context.length === 0) {
      warnings.push(`Handoff ${handoff.handoff_id} carries no explicit context fields`);
    }

    const target = siteById.get(handoff.to);
    if (handoff.terminal && target && !target.terminal) {
      warnings.push(
        `Handoff ${handoff.handoff_id} is marked terminal but target ${handoff.to} is not a terminal site`
      );
    }
  }

  const dccId = "dcc:site:destination-command-center";
  if (!siteIds.has(dccId)) errors.push(`Missing canonical DCC site: ${dccId}`);

  const summary = {
    ok: errors.length === 0,
    versions: {
      sites: sites.version,
      intents: intents.version,
      handoffs: handoffs.version,
    },
    site_count: sites.sites.length,
    intent_count: intents.intents.length,
    handoff_count: handoffs.handoffs.length,
    errors,
    warnings,
  };

  if (errors.length) {
    console.error(JSON.stringify(summary, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(summary, null, 2));
}

main();
