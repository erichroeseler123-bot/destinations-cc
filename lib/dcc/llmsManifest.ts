import {
  evaluateNodeClaimDependencies,
  getAllTravelReferenceNodes,
  resolveTransportModeComparison,
  type TravelReferenceNode,
} from "@/lib/dcc/travelReferenceCore";
import {
  getRegionalHubByStateSlug,
  type RegionalHubModel,
} from "@/lib/dcc/regionalHubs";

const ORIGIN = "https://destinationcommandcenter.com";

export function resolveNodeBySlugOrId(slugOrId: string): TravelReferenceNode | null {
  const normalized = slugOrId.trim().toLowerCase();
  const nodes = getAllTravelReferenceNodes();
  for (const node of nodes) {
    if (
      node.id === normalized ||
      node.slug === normalized ||
      node.canonicalPath === `/${normalized}` ||
      node.canonicalPath === `/routes/${normalized}` ||
      node.aliasPaths.includes(`/${normalized}`) ||
      node.aliasPaths.includes(`/routes/${normalized}`)
    ) {
      return node;
    }
  }
  return null;
}

export function buildTravelReferenceNodeLlmsTxt(node: TravelReferenceNode): string {
  const depReport = evaluateNodeClaimDependencies(node);
  const lines: string[] = [];

  lines.push(`# ${node.title} — DCC Regional AI Sub-Manifest (llms.txt)`);
  lines.push("");
  lines.push(`> ${node.heroSummary}`);
  lines.push("");
  lines.push("## 1. Canonical Identity & Coordinate Endpoints");
  lines.push(`- **Node ID**: \`${node.id}\``);
  lines.push(`- **Place Classification**: \`${node.placeType}\``);
  lines.push(`- **Canonical Reference URL**: ${ORIGIN}${node.canonicalPath}`);
  lines.push(`- **Alias Routes**: ${node.aliasPaths.map((p) => `${ORIGIN}${p}`).join(", ")}`);
  lines.push(
    `- **Primary Coordinate**: \`${node.primaryCoordinate.lat}, ${node.primaryCoordinate.lng}\` (${node.primaryCoordinate.label})`,
  );
  lines.push(`- **Coordinate HTML View**: ${ORIGIN}${node.primaryCoordinate.canonicalLocationPath}`);
  lines.push(`- **Coordinate JSON API (v2)**: ${ORIGIN}${node.primaryCoordinate.canonicalApiPath}`);
  lines.push(`- **Last Substantive Review**: ${node.lastReviewedAt}`);
  lines.push(`- **Coverage Scope**: ${node.coverageScopeStatement}`);

  if (node.secondaryCoordinates.length > 0) {
    lines.push("");
    lines.push("### Secondary Anchor Coordinates & Elevations");
    for (const sec of node.secondaryCoordinates) {
      lines.push(
        `- **${sec.label}**: \`${sec.lat}, ${sec.lng}\` | Elevation: ${sec.elevationFt.toLocaleString()} ft | Role: ${sec.roleInPlace} | API: ${ORIGIN}${sec.canonicalApiPath}`,
      );
    }
  }

  lines.push("");
  lines.push("## 2. Rule-Based Operational Math & At-a-Glance Facts");
  for (const fact of node.atAGlance) {
    const cites = fact.citationIds?.length ? ` (Citations: ${fact.citationIds.join(", ")})` : "";
    lines.push(`- **${fact.label}** [${fact.authorityType}]: ${fact.value}${cites}`);
  }

  if (node.id === "juneau") {
    lines.push("");
    lines.push("### Juneau Cruise Port-Day Buffer Math & Low-Bandwidth Replan (Deterministic Rules)");
    lines.push(
      `- **Low-Bandwidth Replan Surface (Weak Wi-Fi / Dock Changes, <= 50 KB compressed target)**: ${ORIGIN}/juneau/replan and ${ORIGIN}/juneau?low_bw=1 — text-first replanning with ship arrival/all-aboard updates, offline last-saved plan snapshot, and direct continuation to Juneau Flight Deck via ${ORIGIN}/go/dcc-to-juneau-flight-deck.`,
    );
    lines.push(
      "- **Recommended Ship-Return Buffer (All Berths — CT, AS, FKL, AJ, Tender)**: Require at least **1:59:59+ (2-hour / 120-minute)** return buffer after tour completion and confirmed return transfer before ship all-aboard time; options with `< 1:59:59` show exact remaining buffer and are not recommended, options outside the sailing window are blocked, and missing transfer/meeting evidence is marked **Needs verification**.",
    );
    lines.push(
      "- **AJ Dock (1.2 mi south) & Anchored Tender Operations**: Add shuttle queue (~25–35 min) or tender boat cycle (~40–50 min) on top of the **120-minute (2-hour)** recommended return buffer before last tender / all-aboard time.",
    );
    lines.push(
      "- **Mendenhall Glacier Access**: USFS Tongass National Forest enforces commercial visitor capacity caps; municipal Capital Transit bus stops 1.5 miles (30-min walk each way) from the Visitor Center.",
    );
  } else if (node.id === "red-rocks") {
    lines.push("");
    lines.push("### Red Rocks Concert Ingress/Egress & Statutory Park Rules");
    lines.push(
      "- **Elevation & Grade**: Amphitheatre sits at **6,450 ft**; Lower Lots require a steep uphill climb (~300–400 ft vertical gain) at altitude.",
    );
    lines.push(
      "- **Post-Show Pickup & Rideshare Geofence (Jurassic Lot)**: Post-show Uber/Lyft pickups are prohibited at Upper North and Top Circle; the venue puts general post-show pickup at **Jurassic Lot by Entrance 2** with typical **60–90+ minute** post-encore queues.",
    );
    lines.push(
      "- **Overnight Vehicle Rule**: The venue states that overnight vehicles should be moved **before 10:00 a.m. the next day**.",
    );
    lines.push(
      "- **Party at Red Rocks Private Rides**: Party at Red Rocks currently offers private rides and publishes **$399 for a Suburban up to 6** and **$599 for a van up to 10**, subject to availability.",
    );
  } else if (node.id === "denver-breckenridge") {
    lines.push("");
    lines.push("### I-70 Mountain Corridor Statutory Traction, EJMT Metering & Shared Road Conditions");
    lines.push(
      "- **CDOT Eisenhower–Johnson Memorial Tunnel (EJMT) Metering (https://www.codot.gov/travel/ejmt/metering)**: CDOT tunnel metering stops traffic entering the affected tunnel at portal signals to prevent standing backups inside the tunnel bore. All vehicles on I-70 share this exact road condition.",
    );
    lines.push(
      "- **Colorado Passenger Vehicle Traction Law (Code 15, C.R.S. § 42-4-106)**: Active annually **September 1 – May 31** on I-70 from Morrison (MP 259) to Dotsero (MP 133). Requires 4WD/AWD or 3PMSF/M+S tires with minimum **3/16-inch tread depth**, or chains/AutoSock. CDOT passenger guidance lists a **$100 fine plus a $33 surcharge ($133 total)** for noncompliance, with higher penalties (**$500 fine plus a $156 surcharge = $656 total**) when noncompliance causes a lane closure.",
    );
    lines.push(
      "- **Passenger Vehicle Chain Law (Code 16)**: Requires chains or alternative traction devices on ALL vehicles during severe storm holds.",
    );
    lines.push(
      "- **Elevation Gain**: Route climbs from Denver (5,280 ft) through Eisenhower-Johnson Memorial Tunnels (**11,158 ft**) to Breckenridge Base (**9,600 ft**).",
    );
  } else if (node.id === "new-orleans") {
    lines.push("");
    lines.push("### New Orleans Statutory Transit & Excursion Rules");
    lines.push(
      "- **MSY Airport Posted Taxi Fare (City Code Sec. 162-609 · https://flymsy.com/taxis-2/)**: From Louis Armstrong International Airport (MSY) to the CBD or French Quarter west of Elysian Fields Ave, the posted fare is **$36.00 total for 1 or 2 passengers** and **$15.00 per person for 3 or more passengers** ($45 for 3, $60 for 4, and **$75 for 5 passengers when one suitable cab can carry the group and its luggage**). Compare with a verified private van quote when available.",
    );
    lines.push(
      "- **Vieux Carré (French Quarter) Coach Restriction**: Motorcoaches exceeding **32 feet** are prohibited inside the historic French Quarter grid; swamp and plantation tour pickups stage at perimeter hotels or the Steamboat Natchez riverfront dock.",
    );
  } else if (node.id === "las-vegas") {
    lines.push("");
    lines.push("### Las Vegas Airport Zone Fares & Red Rock Canyon Timed-Entry Rules");
    lines.push(
      "- **Nevada Taxicab Authority LAS Airport Zone Fares**: Fixed geographic zone fares ($21–$30+ depending on Strip zone) govern all taxi trips from Harry Reid International Airport (LAS) to the Strip.",
    );
    lines.push(
      "- **BLM Red Rock Canyon Timed-Entry Law**: Mandatory Recreation.gov timed-entry reservation required daily **8:00 AM – 5:00 PM from October 1 through May 31** for the 13-mile Scenic Drive.",
    );
  }

  lines.push("");
  lines.push("## 3. Side-by-Side Transit & Route Comparison Matrix");
  lines.push(`> **Key Takeaway**: ${node.gettingThereAndAround.keyDecisionTakeaway}`);
  lines.push("");
  lines.push(
    "| Mode | Operator / Authority | Pricing Model | Egress / Transit Timing & Bottlenecks | Statutory Laws & Operational Rules | Official Source |",
  );
  lines.push("| :--- | :--- | :--- | :--- | :--- | :--- |");
  for (const mode of node.gettingThereAndAround.modes) {
    const comp = resolveTransportModeComparison(mode);
    lines.push(
      `| **${mode.modeName}** (\`${mode.id}\`) | ${mode.operatorOrAuthority} | ${comp.pricingModel} | ${comp.egressOrTransitTiming} | ${comp.statutoryOrOperationalRule} | [${mode.officialResourceLabel}](${mode.officialResourceUrl}) |`,
    );
  }

  lines.push("");
  lines.push("## 4. Operational Non-Conflation Rules (Weather vs. Operations)");
  lines.push(`- **Headline**: ${node.operationalBoundaries.headline}`);
  lines.push(`- **Non-Conflation Principle**: ${node.operationalBoundaries.weatherVsOperationsExplanation}`);
  lines.push(`- **Missing / Expired Data Rule**: ${node.operationalBoundaries.missingOrExpiredDataRule}`);
  lines.push("- **Capabilities Requiring Direct Official External Check**:");
  for (const ext of node.operationalBoundaries.whatRequiresOfficialExternalCheck) {
    lines.push(
      `  - **${ext.capability}**: ${ext.whyNotAutomated} → Verify at [${ext.officialSourceLabel}](${ext.officialSourceUrl})`,
    );
  }

  lines.push("");
  lines.push("## 5. 6-Factor Entry & Document Dependency Rules");
  lines.push(`> ${node.beforeYouGo.whyCoordinatesCannotAnswerEntry}`);
  lines.push("");
  for (const scenario of node.beforeYouGo.entryScenarios) {
    lines.push(`### ${scenario.scenarioLabel} (\`${scenario.id}\`)`);
    lines.push(`- **Nationality**: ${scenario.dependencies.nationality}`);
    lines.push(`- **Passport & Documents**: ${scenario.dependencies.passportAndDocuments}`);
    lines.push(`- **Residence Context**: ${scenario.dependencies.residenceContext}`);
    lines.push(`- **Routing & Transit**: ${scenario.dependencies.routingAndTransit}`);
    lines.push(`- **Trip Purpose**: ${scenario.dependencies.tripPurpose}`);
    lines.push(`- **Date & Validity Rule**: ${scenario.dependencies.dateAndValidityRule}`);
    lines.push(`- **Official Rule Summary**: ${scenario.officialRequirementSummary}`);
    lines.push(`- **Practical Explanation**: ${scenario.dccPracticalExplanation}`);
    for (const link of scenario.officialLinks) {
      lines.push(`- **Primary Authority**: [${link.label} (${link.issuingOrganization})](${link.url})`);
    }
    lines.push("");
  }

  lines.push("## 6. Timing, Seasonality & Access Constraints");
  for (const item of node.timingSeasonalityAndAccess.items) {
    lines.push(
      `- **${item.title}** (${item.windowOrScope}): ${item.factualBasis} — *DCC Interpretation*: ${item.dccInterpretation}`,
    );
  }

  lines.push("");
  lines.push("## 7. Authoritative Evidence Registry & Freshness Status");
  lines.push(
    `- **Claim Dependency Summary**: ${depReport.supportedCount} supported, ${depReport.qualifiedCount} qualified, ${depReport.withdrawnCount} withdrawn.`,
  );
  for (const cit of node.evidenceRegistry) {
    const evalState = depReport.byCitationId[cit.id]?.evidenceStatus || "current";
    lines.push(
      `- **[${cit.id}]** (${evalState}, \`${cit.authorityType}\`, checked ${cit.lastCheckedAt}): ${cit.claimSummary} — *${cit.issuingOrganization}* (${cit.sourceUrl})`,
    );
  }

  lines.push("");
  lines.push("## 8. Parent Manifests & Machine Contracts");
  lines.push(`- **Site-Wide AI Manifest**: ${ORIGIN}/llms.txt`);
  lines.push(`- **Product Scope Contract**: ${ORIGIN}/scope.json`);
  lines.push(`- **Agent Discovery Manifest**: ${ORIGIN}/agent.json`);
  lines.push(`- **OpenAPI 3.1 Specification**: ${ORIGIN}/openapi.json`);
  lines.push("");

  return lines.join("\n");
}

export function buildRegionalHubLlmsTxt(hub: RegionalHubModel): string {
  const lines: string[] = [];

  lines.push(`# ${hub.name} (${hub.stateCode}) — DCC Regional AI Sub-Manifest (llms.txt)`);
  lines.push("");
  lines.push(`> ${hub.heroSummary}`);
  lines.push("");
  lines.push("## 1. Regional Hub Identity & Governance");
  lines.push(`- **State / Territory**: ${hub.name} (\`${hub.stateCode}\`)`);
  lines.push(`- **Canonical Regional Hub URL**: ${ORIGIN}${hub.canonicalPath}`);
  lines.push(`- **Regional Alias URL**: ${ORIGIN}${hub.regionAliasPath}`);
  lines.push(`- **Regional AI Sub-Manifest**: ${ORIGIN}${hub.llmsTxtPath}`);
  lines.push(`- **Centroid Coordinate**: \`${hub.centroid.lat}, ${hub.centroid.lng}\``);
  if (hub.manifestRecord) {
    lines.push(`- **Publication Acceptance State**: \`${hub.manifestRecord.acceptanceState}\``);
    lines.push(`- **Governed Robots Policy**: \`${hub.manifestRecord.robotsTag}\``);
    lines.push(
      `- **Evidence Snapshot ID**: \`${hub.manifestRecord.evidenceSnapshotId || "none (unpromoted)"}\``,
    );
  }

  lines.push("");
  lines.push("## 2. Granular Node AI Sub-Manifests in This Region");
  for (const sub of hub.aiSubManifests) {
    lines.push(`- **${sub.label}**: ${ORIGIN}${sub.href} — ${sub.scope}`);
  }

  if (hub.referenceNodes.length > 0) {
    lines.push("");
    lines.push("## 3. Verified Travel Reference Nodes & Transit Comparison Matrices");
    for (const node of hub.referenceNodes) {
      lines.push("");
      lines.push(`### ${node.title} (${ORIGIN}${node.canonicalPath})`);
      lines.push(`- **Primary Coordinate**: \`${node.primaryCoordinate.lat}, ${node.primaryCoordinate.lng}\` (${ORIGIN}${node.primaryCoordinate.canonicalLocationPath})`);
      lines.push(`- **Summary**: ${node.heroSummary}`);
      lines.push(`- **Transit Decision Takeaway**: ${node.gettingThereAndAround.keyDecisionTakeaway}`);
      lines.push("");
      lines.push(
        "| Mode | Authority | Pricing Model | Egress / Transit Timing | Statutory & Operational Rule |",
      );
      lines.push("| :--- | :--- | :--- | :--- | :--- |");
      for (const mode of node.gettingThereAndAround.modes) {
        const comp = resolveTransportModeComparison(mode);
        lines.push(
          `| **${mode.modeName}** | ${mode.operatorOrAuthority} | ${comp.pricingModel} | ${comp.egressOrTransitTiming} | ${comp.statutoryOrOperationalRule} |`,
        );
      }
    }
  }

  lines.push("");
  lines.push(`## 4. Registered Coordinates in ${hub.name} (${hub.coordinates.length})`);
  for (const coord of hub.coordinates) {
    const elev = coord.elevationFt ? ` | Elevation: ${coord.elevationFt.toLocaleString()} ft` : "";
    lines.push(
      `- **${coord.title}** (\`${coord.lat}, ${coord.lng}\`${elev}): HTML ${ORIGIN}${coord.locationPath} | JSON API ${ORIGIN}${coord.apiPath} — ${coord.summary}`,
    );
  }

  if (hub.venues.length > 0) {
    lines.push("");
    lines.push(`## 5. Registered Event & Sports Venues in ${hub.name} (${hub.venues.length})`);
    for (const v of hub.venues) {
      lines.push(`- **${v.name}** (${v.cityName}): ${ORIGIN}${v.href} — ${v.description}`);
    }
  }

  if (hub.ports.length > 0) {
    lines.push("");
    lines.push(`## 6. Registered Cruise & Ferry Ports in ${hub.name} (${hub.ports.length})`);
    for (const p of hub.ports) {
      lines.push(`- **${p.name}** (${p.area}): ${ORIGIN}${p.href} — ${p.summary}`);
    }
  }

  if (hub.decisionGuides.length > 0) {
    lines.push("");
    lines.push(`## 7. Published Decision Guides in ${hub.name} (${hub.decisionGuides.length})`);
    for (const g of hub.decisionGuides) {
      lines.push(`- **${g.title}**: ${ORIGIN}${g.href} — ${g.summary}`);
    }
  }

  lines.push("");
  lines.push("## 8. Parent Site-Wide Manifests");
  lines.push(`- **Root AI Readme**: ${ORIGIN}/llms.txt`);
  lines.push(`- **Regional Hubs Index**: ${ORIGIN}/destinations`);
  lines.push("");

  return lines.join("\n");
}

export function resolveLlmsTxtByRegionOrNodeSlug(slug: string): string | null {
  const hub = getRegionalHubByStateSlug(slug);
  if (hub) {
    return buildRegionalHubLlmsTxt(hub);
  }
  const node = resolveNodeBySlugOrId(slug);
  if (node) {
    return buildTravelReferenceNodeLlmsTxt(node);
  }
  return null;
}
