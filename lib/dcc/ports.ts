import legacyPortsData from "@/data/ports.generated.json";
import type { DccNode } from "./schema";
import {
  getNodeBySlugInClass,
  getNodesByClass,
  loadBySlugClassIndex,
} from "./registry";

export type PortView = {
  slug: string;
  name: string;
  area?: string;
  region?: string;
  city?: string;
  country?: string;
  tags?: string[];
  passenger_volume?: number;
};

const LEGACY_FALLBACK_ENABLED = process.env.DCC_LEGACY_FALLBACK !== "false";

function areaFromNode(node: DccNode): string {
  if (node.admin?.locality) return node.admin.locality;
  const areaTag = (node.tags || []).find((t) => t.startsWith("area:"));
  if (areaTag) return areaTag.replace(/^area:/, "");
  return "Other";
}

function countryFromNode(node: DccNode): string {
  return node.admin?.country_name || node.admin?.country_code || "Unknown";
}

function toPortView(node: DccNode): PortView {
  const area = areaFromNode(node);
  return {
    slug: node.slug,
    name: node.display_name || node.name,
    area,
    region: area,
    city: node.display_name || node.name,
    country: countryFromNode(node),
    tags: node.tags || [],
    passenger_volume: node.metrics?.passenger_volume ?? undefined,
  };
}

function getLegacyPorts(): PortView[] {
  return legacyPortsData as PortView[];
}

function getCanonicalPorts(): PortView[] {
  const portNodes = getNodesByClass("port");
  return portNodes.map(toPortView);
}

export function getEffectivePorts(): PortView[] {
  try {
    const canonical = getCanonicalPorts();
    if (canonical.length > 0) return canonical;
  } catch {
    // no-op: fall through
  }
  return LEGACY_FALLBACK_ENABLED ? getLegacyPorts() : [];
}

export function getPortBySlug(slug: string): PortView | null {
  try {
    const canonical = getNodeBySlugInClass(slug, "port");
    if (canonical) return toPortView(canonical);
  } catch {
    // no-op: fall through
  }
  if (!LEGACY_FALLBACK_ENABLED) return null;
  return getLegacyPorts().find((p) => p.slug === slug) || null;
}

export function getPortSlugs(): string[] {
  const slugs = new Set<string>();
  if (LEGACY_FALLBACK_ENABLED) {
    for (const p of getLegacyPorts()) slugs.add(p.slug);
  }
  try {
    const bySlugClass = loadBySlugClassIndex();
    Object.keys(bySlugClass.port || {}).forEach((s) => slugs.add(s));
  } catch {
    // no-op
  }
  return Array.from(slugs);
}
