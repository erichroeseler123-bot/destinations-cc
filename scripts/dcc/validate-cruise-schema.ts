import {
  buildCruisePayload,
  listCruiseCanonicalPortSlugs,
  listCruiseShipSlugs,
} from "@/lib/dcc/internal/cruisePayload";
import { CRUISE_SPECIALTY_LANES } from "@/src/data/cruise-specialty-lanes";
import { hasCruisePortAddress, hasCruisePortGeo } from "@/src/data/cruise-port-geo";

type Finding = {
  severity: "error" | "warn";
  code: string;
  message: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidDate(value: string): boolean {
  const ts = Date.parse(value);
  return !Number.isNaN(ts);
}

function push(findings: Finding[], severity: Finding["severity"], code: string, message: string) {
  findings.push({ severity, code, message });
}

function isValidRouteHref(href: string): boolean {
  return /^\/[^\s]*$/.test(href);
}

function validateSailingCore(
  findings: Finding[],
  ctx: { entityType: "port" | "ship"; slug: string; sailingId: string },
  sailing: {
    line: string;
    ship: string;
    departure_date: string;
    starting_price?: { amount?: number; currency?: string };
  }
) {
  if (!isNonEmptyString(sailing.line)) {
    push(
      findings,
      "error",
      "sailing.missing_line",
      `${ctx.entityType}:${ctx.slug}:${ctx.sailingId} missing sailing.line`
    );
  }
  if (!isNonEmptyString(sailing.ship)) {
    push(
      findings,
      "error",
      "sailing.missing_ship",
      `${ctx.entityType}:${ctx.slug}:${ctx.sailingId} missing sailing.ship`
    );
  }
  if (!isNonEmptyString(sailing.departure_date) || !isValidDate(sailing.departure_date)) {
    push(
      findings,
      "error",
      "sailing.invalid_departure_date",
      `${ctx.entityType}:${ctx.slug}:${ctx.sailingId} has invalid departure_date`
    );
  }
  if (typeof sailing.starting_price?.amount === "number") {
    if (!Number.isFinite(sailing.starting_price.amount) || sailing.starting_price.amount < 0) {
      push(
        findings,
        "error",
        "offer.invalid_price",
        `${ctx.entityType}:${ctx.slug}:${ctx.sailingId} has invalid starting_price.amount`
      );
    }
    if (!isNonEmptyString(sailing.starting_price.currency)) {
      push(
        findings,
        "error",
        "offer.missing_currency",
        `${ctx.entityType}:${ctx.slug}:${ctx.sailingId} has price but missing currency`
      );
    }
  }
}

async function validatePortSchema(findings: Finding[]) {
  const slugs = listCruiseCanonicalPortSlugs();
  for (const slug of slugs) {
    const payload = await buildCruisePayload({ type: "port", value: slug });
    if (!payload || payload.cruises.length === 0) {
      push(findings, "error", "port.empty_payload", `port:${slug} has empty payload`);
      continue;
    }
    if (!isNonEmptyString(payload.query.value)) {
      push(findings, "error", "port.missing_query_value", `port:${slug} missing query.value`);
    }
    if (slug !== "at-sea" && !hasCruisePortGeo(slug)) {
      push(findings, "warn", "port.missing_geo", `port:${slug} missing geo coordinates`);
    }
    if (slug !== "at-sea" && !hasCruisePortAddress(slug)) {
      push(findings, "warn", "port.missing_address", `port:${slug} missing postal-style address metadata`);
    }

    let priced = 0;
    for (const sailing of payload.cruises) {
      validateSailingCore(
        findings,
        { entityType: "port", slug, sailingId: sailing.sailing_id },
        {
          line: sailing.line,
          ship: sailing.ship,
          departure_date: sailing.departure_date,
          starting_price: sailing.starting_price,
        }
      );
      if (typeof sailing.starting_price?.amount === "number") priced += 1;
    }

    const priceCoverage = payload.cruises.length > 0 ? priced / payload.cruises.length : 0;
    if (priceCoverage < 0.2) {
      push(
        findings,
        "warn",
        "port.low_price_coverage",
        `port:${slug} low price coverage ${(priceCoverage * 100).toFixed(1)}% (<20%)`
      );
    }
  }
}

async function validateShipSchema(findings: Finding[]) {
  const slugs = listCruiseShipSlugs();
  for (const slug of slugs) {
    const payload = await buildCruisePayload({ type: "ship", value: slug });
    if (!payload || payload.cruises.length === 0) {
      push(findings, "error", "ship.empty_payload", `ship:${slug} has empty payload`);
      continue;
    }

    let priced = 0;
    for (const sailing of payload.cruises) {
      validateSailingCore(
        findings,
        { entityType: "ship", slug, sailingId: sailing.sailing_id },
        {
          line: sailing.line,
          ship: sailing.ship,
          departure_date: sailing.departure_date,
          starting_price: sailing.starting_price,
        }
      );
      if (typeof sailing.starting_price?.amount === "number") priced += 1;
    }

    const priceCoverage = payload.cruises.length > 0 ? priced / payload.cruises.length : 0;
    if (priceCoverage < 0.2) {
      push(
        findings,
        "warn",
        "ship.low_price_coverage",
        `ship:${slug} low price coverage ${(priceCoverage * 100).toFixed(1)}% (<20%)`
      );
    }
  }
}

function validateSpecialtyLanes(
  findings: Finding[],
  validPortSlugs: Set<string>,
  validShipSlugs: Set<string>
) {
  const laneKeys = new Set<string>();
  for (const lane of CRUISE_SPECIALTY_LANES) {
    if (laneKeys.has(lane.key)) {
      push(findings, "error", "specialty.duplicate_key", `specialty lane "${lane.key}" appears more than once`);
    }
    laneKeys.add(lane.key);

    if (!isNonEmptyString(lane.title)) {
      push(findings, "error", "specialty.missing_title", `specialty lane "${lane.key}" missing title`);
    }
    if (!isNonEmptyString(lane.updatedAt) || !isValidDate(lane.updatedAt)) {
      push(findings, "error", "specialty.invalid_updated_at", `specialty lane "${lane.key}" missing valid updatedAt`);
    }
    if (!isNonEmptyString(lane.description)) {
      push(findings, "error", "specialty.missing_description", `specialty lane "${lane.key}" missing description`);
    }
    if (!isNonEmptyString(lane.ctaLabel)) {
      push(findings, "error", "specialty.missing_cta_label", `specialty lane "${lane.key}" missing ctaLabel`);
    }
    if (!isNonEmptyString(lane.ctaHref) || !isValidRouteHref(lane.ctaHref)) {
      push(findings, "error", "specialty.invalid_cta_href", `specialty lane "${lane.key}" has invalid ctaHref "${lane.ctaHref}"`);
    }
    if (lane.organizers && lane.organizers.some((organizer) => !isNonEmptyString(organizer))) {
      push(findings, "error", "specialty.invalid_organizers", `specialty lane "${lane.key}" has an invalid organizer entry`);
    }
    if (lane.tags && lane.tags.some((tag) => !isNonEmptyString(tag))) {
      push(findings, "error", "specialty.invalid_tags", `specialty lane "${lane.key}" has an invalid tag entry`);
    }
    if (lane.viatorQuery !== undefined && !isNonEmptyString(lane.viatorQuery)) {
      push(findings, "error", "specialty.invalid_viator_query", `specialty lane "${lane.key}" has an invalid viatorQuery`);
    }

    if (!Array.isArray(lane.intents) || lane.intents.length === 0) {
      push(findings, "error", "specialty.empty_intents", `specialty lane "${lane.key}" requires at least one intent`);
    } else {
      for (const [idx, intent] of lane.intents.entries()) {
        if (!isNonEmptyString(intent.label) || !isNonEmptyString(intent.query)) {
          push(findings, "error", "specialty.intent_shape", `specialty lane "${lane.key}" intent[${idx}] must include label + query`);
        }
      }
    }

    if (!Array.isArray(lane.featuredPortSlugs) || lane.featuredPortSlugs.length === 0) {
      push(findings, "warn", "specialty.empty_featured_ports", `specialty lane "${lane.key}" has no featuredPortSlugs`);
    } else {
      for (const slug of lane.featuredPortSlugs) {
        if (!validPortSlugs.has(slug)) {
          push(findings, "error", "specialty.unknown_featured_port", `specialty lane "${lane.key}" references unknown port slug "${slug}"`);
        }
      }
    }

    if (!Array.isArray(lane.featuredShipSlugs) || lane.featuredShipSlugs.length === 0) {
      push(findings, "warn", "specialty.empty_featured_ships", `specialty lane "${lane.key}" has no featuredShipSlugs`);
    } else {
      for (const slug of lane.featuredShipSlugs) {
        if (!validShipSlugs.has(slug)) {
          push(findings, "error", "specialty.unknown_featured_ship", `specialty lane "${lane.key}" references unknown ship slug "${slug}"`);
        }
      }
    }

    if (lane.featuredPortSlugs.length === 0 && lane.featuredShipSlugs.length === 0) {
      push(findings, "warn", "specialty.empty_featured_graph", `specialty lane "${lane.key}" has no featured ports or ships`);
    }
  }
}

async function main() {
  const findings: Finding[] = [];
  const portSlugs = listCruiseCanonicalPortSlugs();
  const shipSlugs = listCruiseShipSlugs();
  const portSlugSet = new Set(portSlugs);
  const shipSlugSet = new Set(shipSlugs);

  await validatePortSchema(findings);
  await validateShipSchema(findings);
  validateSpecialtyLanes(findings, portSlugSet, shipSlugSet);

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warn");

  const summary = {
    ok: errors.length === 0,
    ports_count: portSlugs.length,
    ships_count: shipSlugs.length,
    specialty_lanes_count: CRUISE_SPECIALTY_LANES.length,
    errors_count: errors.length,
    warnings_count: warnings.length,
    errors,
    warnings,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (errors.length > 0) process.exit(1);
}

main();
