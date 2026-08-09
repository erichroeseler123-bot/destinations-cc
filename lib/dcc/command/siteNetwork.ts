import fs from "fs";
import path from "path";
import type { CommandSiteNetworkModel } from "@/lib/dcc/command/types";

type SiteRegistry = {
  sites: Array<{
    site_id: string;
    name: string;
    domain: string;
    role: string;
    promotion_status: string;
    monetization_mode: string;
    terminal: boolean;
  }>;
};

type IntentRegistry = {
  intents: Array<{
    intent_id: string;
    primary_owner: string;
    stage: string;
  }>;
};

type HandoffRegistry = {
  handoffs: Array<{
    handoff_id: string;
    from: string;
    to: string;
    when: string;
    context: string[];
    terminal: boolean;
  }>;
};

function readJson<T>(name: string): T {
  const filePath = path.join(process.cwd(), "data", "network", name);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function getCommandSiteNetwork(): CommandSiteNetworkModel {
  const sitesRegistry = readJson<SiteRegistry>("sites.v1.json");
  const intentRegistry = readJson<IntentRegistry>("intent-ownership.v1.json");
  const handoffRegistry = readJson<HandoffRegistry>("handoffs.v1.json");

  const intentsByOwner = new Map<string, string[]>();
  for (const intent of intentRegistry.intents) {
    const list = intentsByOwner.get(intent.primary_owner) ?? [];
    list.push(intent.intent_id.replace("dcc:intent:", "").replace(/-/g, " "));
    intentsByOwner.set(intent.primary_owner, list);
  }

  const inbound = new Map<string, number>();
  const outbound = new Map<string, number>();
  for (const handoff of handoffRegistry.handoffs) {
    inbound.set(handoff.to, (inbound.get(handoff.to) ?? 0) + 1);
    outbound.set(handoff.from, (outbound.get(handoff.from) ?? 0) + 1);
  }

  const sites = sitesRegistry.sites.map((site) => ({
    id: site.site_id,
    name: site.name,
    domain: site.domain,
    role: site.role.replace(/_/g, " "),
    promotionStatus: site.promotion_status,
    monetizationMode: site.monetization_mode.replace(/_/g, " "),
    terminal: site.terminal,
    ownedIntents: intentsByOwner.get(site.site_id) ?? [],
    inboundCount: inbound.get(site.site_id) ?? 0,
    outboundCount: outbound.get(site.site_id) ?? 0,
  }));

  const siteNames = new Map(sites.map((site) => [site.id, site.name]));
  const handoffs = handoffRegistry.handoffs.map((handoff) => ({
    id: handoff.handoff_id,
    fromId: handoff.from,
    fromName: siteNames.get(handoff.from) ?? handoff.from,
    toId: handoff.to,
    toName: siteNames.get(handoff.to) ?? handoff.to,
    reason: handoff.when,
    context: handoff.context,
    terminal: handoff.terminal,
  }));

  const orphanedSites = sites.filter((site) => site.inboundCount === 0 && site.id !== "dcc:site:destination-command-center");
  const nonMonetizedEndpoints = sites.filter((site) => site.terminal && site.monetizationMode === "handoff");

  return {
    siteCount: sites.length,
    intentCount: intentRegistry.intents.length,
    handoffCount: handoffs.length,
    terminalCount: sites.filter((site) => site.terminal).length,
    orphanedSiteCount: orphanedSites.length,
    nonMonetizedEndpointCount: nonMonetizedEndpoints.length,
    sites,
    handoffs,
  };
}
