import { getLiveCityBundle, LIVE_CITY_DATA, LIVE_CITY_REGISTRY } from "@/lib/dcc/liveCity";

type Severity = "error" | "warn" | "info";
type Finding = { severity: Severity; code: string; message: string };

function push(findings: Finding[], severity: Severity, code: string, message: string) {
  findings.push({ severity, code, message });
}

function isFresh(asOf: string, staleAfter: string, ttlSeconds: number) {
  const asOfMs = new Date(asOf).getTime();
  const staleAfterMs = new Date(staleAfter).getTime();
  return staleAfterMs - asOfMs === ttlSeconds * 1000;
}

const registryCities = new Set(LIVE_CITY_REGISTRY.cities.map((entry) => entry.slug));
const dataCities = Object.keys(LIVE_CITY_DATA) as Array<keyof typeof LIVE_CITY_DATA>;

for (const city of dataCities) {
  const bundle = getLiveCityBundle(city);
  const findings: Finding[] = [];

  if (!registryCities.has(city)) {
    push(findings, "error", "registry.missing_city", `City "${city}" exists in LIVE_CITY_DATA but not in data/cities/index.json.`);
  }

  const anchorSlugs = new Set(bundle.anchors.anchors.map((entry) => entry.slug));
  const districtSlugs = new Set(bundle.districts.districts.map((entry) => entry.slug));
  const venueSlugs = new Set(bundle.venues.venues.map((entry) => entry.slug));
  const placeSlugs = new Set(bundle.places.places.map((entry) => entry.slug));
  const eventIds = new Set(bundle.events.events.map((entry) => entry.id));

  for (const dataset of [bundle.anchors, bundle.districts, bundle.venues, bundle.places, bundle.events, bundle.signals]) {
    if (dataset.city !== city) {
      push(findings, "error", "dataset.city_mismatch", `Dataset city "${dataset.city}" does not match bundle "${city}".`);
    }
    if (!isFresh(dataset.as_of, dataset.stale_after, dataset.ttl_seconds)) {
      push(
        findings,
        "error",
        "dataset.freshness_mismatch",
        `Dataset "${dataset.schema.entity}" has stale_after "${dataset.stale_after}" inconsistent with as_of "${dataset.as_of}" + ttl_seconds ${dataset.ttl_seconds}.`,
      );
    }
  }

  for (const anchor of bundle.anchors.anchors) {
    for (const slug of anchor.district_slugs) {
      if (!districtSlugs.has(slug)) {
        push(findings, "error", "anchor.missing_district", `Anchor "${anchor.slug}" references missing district "${slug}".`);
      }
    }
    for (const slug of anchor.nearby_venue_slugs) {
      if (!venueSlugs.has(slug)) {
        push(findings, "error", "anchor.missing_venue", `Anchor "${anchor.slug}" references missing venue "${slug}".`);
      }
    }
    for (const slug of anchor.nearby_place_slugs) {
      if (!placeSlugs.has(slug)) {
        push(findings, "error", "anchor.missing_place", `Anchor "${anchor.slug}" references missing place "${slug}".`);
      }
    }
  }

  for (const district of bundle.districts.districts) {
    for (const slug of district.venue_slugs) {
      if (!venueSlugs.has(slug)) {
        push(findings, "error", "district.missing_venue", `District "${district.slug}" references missing venue "${slug}".`);
      }
    }
    for (const slug of district.place_slugs) {
      if (!placeSlugs.has(slug)) {
        push(findings, "error", "district.missing_place", `District "${district.slug}" references missing place "${slug}".`);
      }
    }
  }

  for (const venue of bundle.venues.venues) {
    for (const slug of venue.district_slugs) {
      if (!districtSlugs.has(slug)) {
        push(findings, "error", "venue.missing_district", `Venue "${venue.slug}" references missing district "${slug}".`);
      }
    }
    for (const slug of venue.near_anchor_slugs) {
      if (!anchorSlugs.has(slug)) {
        push(findings, "error", "venue.missing_anchor", `Venue "${venue.slug}" references missing anchor "${slug}".`);
      }
    }
  }

  for (const place of bundle.places.places) {
    for (const slug of place.district_slugs) {
      if (!districtSlugs.has(slug)) {
        push(findings, "error", "place.missing_district", `Place "${place.slug}" references missing district "${slug}".`);
      }
    }
  }

  for (const event of bundle.events.events) {
    if (!venueSlugs.has(event.venue_slug)) {
      push(findings, "error", "event.missing_venue", `Event "${event.id}" references missing venue "${event.venue_slug}".`);
    }
    if (new Date(event.end_time).getTime() <= new Date(event.start_time).getTime()) {
      push(findings, "error", "event.invalid_time_range", `Event "${event.id}" has end_time before start_time.`);
    }
  }

  for (const signal of bundle.signals.signals) {
    if (new Date(signal.expires_at).getTime() <= new Date(signal.starts_at).getTime()) {
      push(findings, "error", "signal.invalid_time_range", `Signal "${signal.id}" has expires_at before starts_at.`);
    }
    for (const slug of signal.near_anchor_slugs) {
      if (!anchorSlugs.has(slug)) {
        push(findings, "error", "signal.missing_anchor", `Signal "${signal.id}" references missing anchor "${slug}".`);
      }
    }
    if (signal.linked_event_id && !eventIds.has(signal.linked_event_id)) {
      push(findings, "error", "signal.missing_event", `Signal "${signal.id}" references missing event "${signal.linked_event_id}".`);
    }
    if (signal.linked_venue_slug && !venueSlugs.has(signal.linked_venue_slug)) {
      push(findings, "error", "signal.missing_venue", `Signal "${signal.id}" references missing venue "${signal.linked_venue_slug}".`);
    }
    if (signal.linked_place_slug && !placeSlugs.has(signal.linked_place_slug)) {
      push(findings, "error", "signal.missing_place", `Signal "${signal.id}" references missing place "${signal.linked_place_slug}".`);
    }
    for (const slug of signal.affected_district_slugs ?? []) {
      if (!districtSlugs.has(slug)) {
        push(findings, "error", "signal.missing_district", `Signal "${signal.id}" references missing district "${slug}".`);
      }
    }
    if (signal.provenance === "source_backed" && !signal.source_ref) {
      push(findings, "error", "signal.missing_source_ref", `Signal "${signal.id}" is source_backed but missing source_ref.`);
    }
    if (signal.provenance !== "source_backed" && signal.source_ref) {
      push(findings, "warn", "signal.unexpected_source_ref", `Signal "${signal.id}" has source_ref but provenance is "${signal.provenance}".`);
    }
  }

  const errors = findings.filter((finding) => finding.severity === "error");
  const warns = findings.filter((finding) => finding.severity === "warn");

  if (findings.length === 0) {
    console.log(`[live-city] ${city}: ok`);
    continue;
  }

  for (const finding of findings) {
    const prefix = finding.severity.toUpperCase().padEnd(5);
    console.log(`[live-city] ${city} ${prefix} ${finding.code} ${finding.message}`);
  }

  console.log(`[live-city] ${city}: ${errors.length} error(s), ${warns.length} warning(s)`);

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

for (const city of LIVE_CITY_REGISTRY.cities) {
  if (!(city.slug in LIVE_CITY_DATA)) {
    console.log(`[live-city] registry ERROR registry.missing_pack City "${city.slug}" exists in data/cities/index.json but has no loaded city pack.`);
    process.exitCode = 1;
  }
}
