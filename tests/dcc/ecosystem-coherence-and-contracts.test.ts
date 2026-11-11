import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";

import {
  CONNECTED_CRUISE_PORT_COUNT,
  cruisePortDirectory,
} from "@/lib/dcc/cruisePortDirectory";
import {
  DCC_ACTIVE_DECISION_ENGINES,
  DCC_PRODUCT_SCOPE,
} from "@/lib/dcc/productScope";
import { buildMcpDiscoveryDocument } from "@/lib/dcc/machine/v03/discoveryAndMcp";
import { GET as getRootAgentJson } from "@/app/agent.json/route";
import { GET as getRootLlmsTxt } from "@/app/llms.txt/route";
import { GET as getRootWellKnownDcc } from "@/app/.well-known/dcc/route";
import { GET as getRootWellKnownDccSite } from "@/app/.well-known/dcc-site/route";
import { GET as getOpenApiJson } from "@/app/openapi.json/route";
import { GET as getPublicNetworkFeed } from "@/app/api/public/network-feed/route";
import { resolveNetworkRecord } from "@/lib/dcc/networkRecordResolver";
import { GET as getDellsWellKnownSite } from "@/apps/welcometothedells/app/.well-known/dcc-site/route";
import { GET as getSotsWellKnownSite } from "@/apps/saveonthestrip/app/.well-known/dcc-site/route";
import { GET as getFqoWellKnownSite } from "@/apps/frenchquarterorientation/app/.well-known/dcc-site/route";
import { GET as getWnoAgentJson } from "@/apps/welcometoneworleanstours/app/agent.json/route";
import { GET as getSotsAlaskaPartnerHandoff } from "@/apps/saveonthestrip/app/handoff/partner/welcome-to-alaska/route";
import { GET as getDellsOutboundRedirect } from "@/apps/welcometothedells/app/out/wisconsin-dells/[slug]/route";
import { resolveDellsRiverOutboundTarget } from "@/apps/welcometothedells/lib/riverOutbound";
import { RIVER_OPS_OUTBOUND_TARGETS } from "@/apps/welcometothedells/lib/content";
import { getPortRecommendationActions } from "@/lib/dcc/handoffAnalytics";
import {
  mapFindingRowToInboxItem,
  normalizeInquiryNotificationStatus,
  resolveSiteAndChannelMeta,
  resolveSpecialistHostForChannel,
} from "@/lib/dcc/operatorInbox";
import { buildCruisePromenadeCoordinationHref } from "@/lib/dcc/commercialAttribution";
import {
  resolveDccIngestBaseUrl,
  resolveDccInternalSecret,
  resolveViatorPid,
} from "@/lib/dcc/shared/envCompat";
import { stripEdgePiiQueryParams } from "@/lib/dcc/shared/edgeContextAndPii";
import { escapeHtml } from "@/lib/dcc/shared/specialistInquiryClient";
import { proxy as wnoProxy } from "@/apps/welcometoneworleanstours/proxy";
import { SYSTEM_INVENTORY } from "@/src/data/system-inventory";
import { getCorridorCatalogEntry } from "@/lib/dcc/telemetry/corridorCatalog";
import { EVENT_NAMES } from "@/lib/dcc/telemetry/corridorEvents";

const REPO_ROOT = process.cwd();

function collectSourceFiles(dirPath: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dirPath)) return results;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === ".git"
    ) {
      continue;
    }
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx|js|mjs|json)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

describe("DCC Ecosystem Coherence, Machine Contracts, & Consolidation Release Gate", () => {
  it("1. aligns dynamic 629 cruise ports, >=10 MCP tools, 7 decision engines, 5 flagship nodes, and 8 regional hubs across scope.json, llms.txt, agent.json, and .well-known/dcc", async () => {
    assert.equal(CONNECTED_CRUISE_PORT_COUNT, 629);
    assert.equal(cruisePortDirectory.length, 629);

    const mcpDoc = buildMcpDiscoveryDocument();
    const mcpToolNames = mcpDoc.tools.map((t) => t.name);
    assert.ok(
      mcpToolNames.length >= 10,
      `Expected at least 10 MCP tools, found ${mcpToolNames.length}`,
    );

    const expectedEngines = [
      "juneau-helicopter-tours",
      "hawaii-whale-watching",
      "denver-to-mountain-transportation",
      "alaska-shore-excursions",
      "new-orleans-swamp-tours",
      "new-orleans-city-tours",
      "cruise-port-day-excursions",
    ];
    const expectedFlagships = [
      "juneau",
      "new-orleans",
      "red-rocks",
      "denver-breckenridge",
      "las-vegas",
    ];
    const expectedRegionalHubs = [
      "colorado",
      "alaska",
      "louisiana",
      "nevada",
      "florida",
      "montana",
      "wisconsin",
      "us-virgin-islands",
    ];

    // scope.json
    const productScopeSrc = fs.readFileSync(
      path.join(REPO_ROOT, "lib/dcc/productScope.ts"),
      "utf8",
    );
    assert.doesNotMatch(
      productScopeSrc,
      /lib\/dcc\/machine\/v03\/discoveryAndMcp|lib\/dcc\/machine\/v03\/runtimeStoreV03|lib\/dcc\/cruisePortDirectory|node:fs|node:child_process/,
      "lib/dcc/productScope.ts must stay pure JSON/TS so sub-app sitemaps (e.g., WNO) build cleanly under Turbopack",
    );
    const inv = DCC_PRODUCT_SCOPE.machineContractInventory;
    assert.equal(DCC_PRODUCT_SCOPE.machineLayerVersion, "0.3.0");
    assert.equal(inv.connectedCruisePortCount, 629);
    assert.equal(inv.decisionEngineCount, 7);
    assert.deepEqual([...inv.decisionEngines].sort(), [...expectedEngines].sort());
    assert.deepEqual(inv.registeredMcpTools, mcpToolNames);
    assert.equal(inv.flagshipNodeCount, 5);
    assert.deepEqual([...inv.flagshipNodes].sort(), [...expectedFlagships].sort());
    assert.equal(inv.regionalHubCount, 8);
    assert.deepEqual([...inv.regionalHubs].sort(), [...expectedRegionalHubs].sort());

    // agent.json
    const agentRes = await getRootAgentJson();
    assert.equal(agentRes.status, 200);
    const agentJson = await agentRes.json();
    assert.equal(agentJson.machine_layer_version, "0.3.0");
    assert.equal(agentJson.dcc_machine_layer.connected_cruise_port_count, 629);
    assert.equal(agentJson.dcc_machine_layer.active_engines.length, 7);
    assert.deepEqual(
      [...agentJson.dcc_machine_layer.active_engines].sort(),
      [...expectedEngines].sort(),
    );
    assert.deepEqual(agentJson.dcc_machine_layer.registered_mcp_tools, mcpToolNames);
    assert.equal(agentJson.dcc_machine_layer.flagship_nodes.length, 5);
    assert.equal(agentJson.dcc_machine_layer.regional_hubs.length, 8);
    assert.equal(agentJson.dcc_machine_layer.regional_llms_hubs.length, 8);

    // .well-known/dcc
    const wkRes = await getRootWellKnownDcc();
    assert.equal(wkRes.status, 200);
    const wkJson = await wkRes.json();
    assert.equal(wkJson.specVersion, "0.3.0");
    assert.equal(wkJson.machineContractInventory.machineLayerVersion, "0.3.0");
    assert.equal(wkJson.machineContractInventory.connectedCruisePortCount, 629);
    assert.equal(wkJson.machineContractInventory.decisionEngines.length, 7);
    assert.deepEqual(
      wkJson.machineContractInventory.registeredMcpTools,
      mcpToolNames,
    );
    assert.equal(wkJson.machineContractInventory.flagshipNodes.length, 5);
    assert.equal(wkJson.machineContractInventory.regionalHubs.length, 8);

    // llms.txt
    const llmsRes = await getRootLlmsTxt();
    assert.equal(llmsRes.status, 200);
    const llmsText = await llmsRes.text();
    assert.match(llmsText, /Machine Layer Version\*\*:\s*`0\.3\.0`/);
    assert.match(llmsText, /\b629\b/);
    assert.equal(llmsText.includes("632"), false);
    for (const toolName of mcpToolNames) {
      assert.equal(
        llmsText.includes(toolName),
        true,
        `llms.txt missing MCP tool ${toolName}`,
      );
    }
    for (const engineId of expectedEngines) {
      assert.equal(
        llmsText.includes(engineId),
        true,
        `llms.txt missing decision engine ${engineId}`,
      );
    }
    for (const hub of expectedRegionalHubs) {
      assert.equal(
        llmsText.includes(`/destinations/${hub}/llms.txt`),
        true,
        `llms.txt missing regional hub /destinations/${hub}/llms.txt`,
      );
    }
    assert.equal(llmsText.includes("/juneau/llms.txt"), true);
    assert.equal(llmsText.includes("/new-orleans/llms.txt"), true);
    assert.equal(llmsText.includes("/vegas/llms.txt"), true);

    // openapi.json OCTO sandbox boundary
    const openApiRes = await getOpenApiJson(
      new Request("https://www.destinationcommandcenter.com/openapi.json"),
    );
    const openApiJson = await openApiRes.json();
    const octoText = JSON.stringify(openApiJson);
    assert.match(octoText, /live_authorized/i);
    assert.match(octoText, /protocol sandbox|non-production/i);
  });

  it("2. enforces /.well-known/dcc-site 404 on unknown/excluded sites and 200 on Dells, Strip, and FQO, plus dynamic /network and WNO agent.json superset", async () => {
    const unknownRes = await getRootWellKnownDccSite(
      new Request(
        "https://www.destinationcommandcenter.com/.well-known/dcc-site?site=completely-unknown-domain.example",
      ),
    );
    assert.equal(unknownRes.status, 404);

    for (const site of [
      "welcometothedells",
      "saveonthestrip",
      "frenchquarterorientation",
    ]) {
      const res = await getRootWellKnownDccSite(
        new Request(
          `https://www.destinationcommandcenter.com/.well-known/dcc-site?site=${site}`,
        ),
      );
      assert.equal(res.status, 200, `Expected 200 for ?site=${site}`);
      const body = await res.json();
      assert.equal(body.site_id, site);
      assert.equal(body.privacy_and_security.exposes_secrets, false);
    }

    assert.equal((await getDellsWellKnownSite()).status, 200);
    assert.equal((await getSotsWellKnownSite()).status, 200);
    assert.equal((await getFqoWellKnownSite()).status, 200);

    const wnoAgent = await (await getWnoAgentJson()).json();
    assert.equal(wnoAgent.machine_layer_version, "0.3.0");
    assert.ok(wnoAgent.site);

    const feedJson = await (await getPublicNetworkFeed()).json();
    assert.ok(feedJson.sites.length >= 12);
    assert.equal(
      feedJson.sites.some((s: { url?: string }) =>
        String(s.url || "").includes("welcometoalaskatours.com"),
      ),
      false,
    );

    assert.ok(resolveNetworkRecord("last-frontier-shore-excursions"));
    assert.ok(resolveNetworkRecord("welcome-to-new-orleans-tours"));
    assert.ok(resolveNetworkRecord("welcome-to-the-dells"));
    assert.ok(resolveNetworkRecord("save-on-the-strip"));
    assert.ok(resolveNetworkRecord("french-quarter-orientation"));
    assert.ok(resolveNetworkRecord("gosno"));
    assert.ok(resolveNetworkRecord("party-at-red-rocks"));
    assert.equal(resolveNetworkRecord("welcometoalaskatours"), null);
  });

  it("3. contains zero legacy FAA AWC / FAA PAJN METAR / NOAA Aviation METAR attribution strings in app/ and lib/", () => {
    const forbiddenStrings = [
      "FAA / NWS Aviation Weather Center",
      "FAA/NWS Aviation Weather Center",
      "FAA AWC",
      "FAA PAJN METAR",
      "NOAA Aviation METAR",
    ];
    const files = [
      ...collectSourceFiles(path.join(REPO_ROOT, "app")),
      ...collectSourceFiles(path.join(REPO_ROOT, "lib")),
    ];

    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      for (const bad of forbiddenStrings) {
        if (content.includes(bad)) {
          violations.push(`${path.relative(REPO_ROOT, file)} -> "${bad}"`);
        }
      }
    }
    assert.deepEqual(violations, []);
  });

  it("4. contains zero active redirect/link targets to contained welcometoalaskatours.com in apps/saveonthestrip or lib/dcc/handoffAnalytics.ts and removes ShuttleYa/PARR truth contradictions", async () => {
    const sotsFiles = collectSourceFiles(
      path.join(REPO_ROOT, "apps", "saveonthestrip"),
    );
    for (const file of sotsFiles) {
      const content = fs.readFileSync(file, "utf8");
      assert.equal(
        content.includes("welcometoalaskatours.com"),
        false,
        `${path.relative(REPO_ROOT, file)} still references welcometoalaskatours.com`,
      );
    }

    const handoffAnalyticsSource = fs.readFileSync(
      path.join(REPO_ROOT, "lib", "dcc", "handoffAnalytics.ts"),
      "utf8",
    );
    assert.equal(
      handoffAnalyticsSource.includes("welcometoalaskatours.com"),
      false,
    );

    const actions = getPortRecommendationActions("juneau-alaska");
    for (const action of actions) {
      assert.equal(action.href.includes("welcometoalaskatours.com"), false);
    }

    const sotsPartnerRes = await getSotsAlaskaPartnerHandoff(
      new NextRequest(
        "https://saveonthestrip.com/handoff/partner/welcome-to-alaska?dcc_handoff_id=ho-test-99&port=juneau-alaska&email=secret@example.com&phone=5551234",
      ),
    );
    assert.equal(sotsPartnerRes.status, 308);
    const loc = sotsPartnerRes.headers.get("location") || "";
    assert.match(loc, /^https:\/\/www\.lastfrontiershoreexcursions\.com\/ports\/juneau\?/);
    assert.equal(loc.includes("email="), false);
    assert.equal(loc.includes("phone="), false);

    // ShuttleYa & Party at Red Rocks truth checks
    assert.equal(
      SYSTEM_INVENTORY.operators.some((op) => op.id === "argo"),
      false,
    );
    assert.equal(
      SYSTEM_INVENTORY.bookingEndpoints.some(
        (ep) => ep.id === "parr-shared-red-rocks" || ep.operator === "argo",
      ),
      false,
    );
    assert.equal(
      SYSTEM_INVENTORY.corridorExecutions.some(
        (ce) => ce.corridorId === "argo-day-transport",
      ),
      false,
    );
    const argoCorridor = getCorridorCatalogEntry("argo-day-transport");
    assert.equal(argoCorridor?.status, "deprecated");
    assert.ok(getCorridorCatalogEntry("wisconsin-dells-signature"));
    assert.ok(getCorridorCatalogEntry("wisconsin-dells-river-ops"));
    for (const evt of [
      "hub_selected",
      "next_stop_viewed",
      "support_opened",
      "certainty_cta_clicked",
      "entered_guided_flow",
    ]) {
      assert.equal(
        (EVENT_NAMES as readonly string[]).includes(evt),
        true,
        `Missing corridor event ${evt}`,
      );
    }
  });

  it("5. routes all 8 specialist channels to their exact sourceSite and specialistSite in operatorInbox.ts without accidental fallback and honors notificationStatus", () => {
    const expectedChannels: ReadonlyArray<{
      channel: string;
      sourceSite: string;
      specialistSite: string;
    }> = [
      {
        channel: "juneauflightdeck-inquiry",
        sourceSite: "juneauflightdeck",
        specialistSite: "juneauflightdeck.com",
      },
      {
        channel: "welcometoneworleanstours-inquiry",
        sourceSite: "welcometoneworleanstours",
        specialistSite: "welcometoneworleanstours.com",
      },
      {
        channel: "lastfrontiershoreexcursions-inquiry",
        sourceSite: "lastfrontiershoreexcursions",
        specialistSite: "lastfrontiershoreexcursions.com",
      },
      {
        channel: "welcometothedells-inquiry",
        sourceSite: "welcometothedells",
        specialistSite: "welcometothedells.com",
      },
      {
        channel: "saveonthestrip-help-request",
        sourceSite: "saveonthestrip",
        specialistSite: "saveonthestrip.com",
      },
      {
        channel: "welcometotheswamp-inquiry",
        sourceSite: "welcometotheswamp",
        specialistSite: "welcometotheswamp.com",
      },
      {
        channel: "gosno-dispatch",
        sourceSite: "gosno",
        specialistSite: "gosno.co",
      },
      {
        channel: "parr-inquiry",
        sourceSite: "partyatredrocks",
        specialistSite: "partyatredrocks.com",
      },
    ];

    for (const entry of expectedChannels) {
      const siteMeta = resolveSiteAndChannelMeta(entry.channel);
      assert.equal(
        siteMeta.sourceSite,
        entry.sourceSite,
        `Channel ${entry.channel} mapped to wrong sourceSite`,
      );
      assert.notEqual(siteMeta.sourceSite, "destinationcommandcenter");

      const host = resolveSpecialistHostForChannel(entry.channel);
      assert.equal(host, entry.specialistSite);

      const mapped = mapFindingRowToInboxItem(
        {
          finding_id: `control-map:transactional-submission:production:${entry.channel}:sub-${entry.sourceSite}-1`,
          owner: "dcc-specialist-ingest",
          note: `${entry.channel} lead`,
          created_at: "2026-11-11T10:00:00Z",
          metadata: {
            channel: entry.channel,
            submissionId: `sub-${entry.sourceSite}-1`,
            name: "Alex Rivera",
            email: "alex.rivera@realdomain.org",
            message: "Checking private group availability for 6 guests.",
            notificationStatus: "not_configured",
            emailSent: false,
            emailReason: "missing_email_config",
          },
        },
        true,
      );

      assert.ok(mapped);
      assert.equal(mapped.sourceSite, entry.sourceSite);
      assert.equal(mapped.attribution?.specialistSite, entry.specialistSite);
      assert.equal(mapped.notificationStatus, "not_configured");
    }

    assert.equal(
      normalizeInquiryNotificationStatus(
        "welcometothedells-inquiry",
        { notificationStatus: "not_configured" },
        true,
      ).notificationStatus,
      "not_configured",
    );
    assert.equal(
      normalizeInquiryNotificationStatus(
        "welcometothedells-inquiry",
        { notificationStatus: "sent", emailProviderId: "re_123" },
        false,
      ).notificationStatus,
      "delivered",
    );
    assert.equal(
      normalizeInquiryNotificationStatus(
        "welcometothedells-inquiry",
        { notificationStatus: "failed", emailReason: "resend_500" },
        true,
      ).notificationStatus,
      "failed",
    );

    const cpGosno = buildCruisePromenadeCoordinationHref({
      specialistSite: "gosno.co",
      portSlug: null,
    });
    assert.equal(cpGosno.href.includes("utm_source=gosno&"), true);
    assert.equal(cpGosno.href.includes("utm_source=gosno.co"), false);
  });

  it("6. resolves all configured Dells /out/wisconsin-dells/[slug] river targets cleanly (302), strips PII query params, preserves safe UTMs/PIDs, and preserves WNO 308 redirects", async () => {
    const allSlugs = [
      ...RIVER_OPS_OUTBOUND_TARGETS.map((t) => t.slug),
      "jet-boat-adventures",
      "original-wisconsin-ducks",
      "sunset-dinner-cruise",
      "upper-dells-boat-tour",
      "upper-dells-scenic",
    ];

    for (const slug of allSlugs) {
      const target = resolveDellsRiverOutboundTarget(slug);
      assert.ok(target, `Expected target for Dells slug '${slug}'`);

      const req = new NextRequest(
        `https://welcometothedells.com/out/wisconsin-dells/${slug}?email=leak@example.com&phone=5559999&name=Jane+Doe&cabin=8012&dcc_handoff_id=ho-dells-1`,
      );
      const res = await getDellsOutboundRedirect(req, {
        params: Promise.resolve({ slug }),
      });
      assert.ok(
        res.status === 302 || res.status === 307,
        `Expected 302/307 for ${slug}, got ${res.status}`,
      );
      const location = res.headers.get("location") || "";
      assert.match(location, /^https:\/\//);
      assert.equal(location.includes("email="), false);
      assert.equal(location.includes("phone="), false);
      assert.equal(location.includes("name="), false);
      assert.equal(location.includes("cabin="), false);
      assert.equal(location.includes("dcc_handoff_id=ho-dells-1"), true);
      if (target.provider === "viator") {
        assert.equal(location.includes("pid=P00249726"), true);
      }
    }

    const unknownRes = await getDellsOutboundRedirect(
      new NextRequest(
        "https://welcometothedells.com/out/wisconsin-dells/nonexistent-slug",
      ),
      { params: Promise.resolve({ slug: "nonexistent-slug" }) },
    );
    assert.equal(unknownRes.status, 404);

    // Shared helpers & WNO legacy 308 redirects
    assert.equal(
      escapeHtml('<script>alert("xss")</script>'),
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
    assert.equal(
      resolveDccIngestBaseUrl({
        DCC_API_BASE_URL: "https://preview.destinationcommandcenter.com/",
      }),
      "https://preview.destinationcommandcenter.com",
    );
    assert.equal(
      resolveDccInternalSecret({ OPERATOR_INBOX_SECRET: "sec-123" }),
      "sec-123",
    );
    assert.equal(
      resolveViatorPid({ NEXT_PUBLIC_LAST_FRONTIER_VIATOR_PID: "P00058396" }),
      "P00058396",
    );

    const dirtyUrl = new URL(
      "https://juneauflightdeck.com/helicopter?passenger_weight=210&stateroom=9102&utm_source=dcc",
    );
    const stripped = stripEdgePiiQueryParams(dirtyUrl);
    assert.equal(stripped.mutated, true);
    assert.equal(dirtyUrl.searchParams.has("passenger_weight"), false);
    assert.equal(dirtyUrl.searchParams.has("stateroom"), false);
    assert.equal(dirtyUrl.searchParams.get("utm_source"), "dcc");

    for (const [legacyPath, targetPath] of [
      [
        "/things-to-do-in-new-orleans-today",
        "/guides/things-to-do-in-new-orleans-today",
      ],
      [
        "/things-to-do-before-a-cruise-new-orleans",
        "/guides/things-to-do-before-a-cruise-new-orleans",
      ],
      [
        "/things-to-do-after-a-cruise-new-orleans",
        "/guides/things-to-do-after-a-cruise-new-orleans",
      ],
      ["/4-hours-in-new-orleans", "/guides/4-hours-in-new-orleans"],
    ]) {
      const wnoLegacyRes = await wnoProxy(
        new NextRequest(`https://www.welcometoneworleanstours.com${legacyPath}`),
      );
      assert.equal(wnoLegacyRes.status, 308);
      assert.equal(
        new URL(wnoLegacyRes.headers.get("location") || "").pathname,
        targetPath,
      );
    }
  });
});
