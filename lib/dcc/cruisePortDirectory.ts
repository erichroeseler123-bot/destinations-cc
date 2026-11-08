import directory from "@/data/cruise-port-directory.json";
import { getEffectivePorts, type PortView } from "@/lib/dcc/ports";
import { buildViatorSearchUrl } from "@/lib/viator/links";

type CruisePortSource = {
  line: string;
  url: string;
  portCode?: string;
};

type CruisePortReference = {
  slug: string;
  name: string;
  area?: string;
  country?: string;
  aliases?: string[];
  sources: CruisePortSource[];
  viatorDestination?: { id: number; name: string };
};

export type CruisePortDirectoryEntry = PortView & {
  coverage: "guide" | "reference";
  aliases?: string[];
  sources: CruisePortSource[];
  path: string;
  viatorDestination?: CruisePortReference["viatorDestination"];
};

const references: CruisePortReference[] = directory.ports;
const referencesBySlug = new Map(references.map((port) => [port.slug, port]));

export const cruisePortDirectorySources = directory.sources;

export function getCruisePortReference(slug: string) {
  return referencesBySlug.get(slug) ?? null;
}

export function getCruisePortViatorSearch(port: CruisePortReference) {
  if (!port.viatorDestination) return undefined;
  return buildViatorSearchUrl(
    [port.viatorDestination.name, port.country, "shore excursions"].filter(Boolean).join(" "),
    { campaign: `dcc-port-${port.slug}`, medium: "link" },
  );
}

export function getCruisePortDirectory(): CruisePortDirectoryEntry[] {
  const entries = new Map<string, CruisePortDirectoryEntry>();

  for (const port of references) {
    entries.set(port.slug, {
      ...port,
      coverage: "reference",
      path: `/ports/${port.slug}`,
    });
  }

  for (const guide of getEffectivePorts()) {
    const reference = entries.get(guide.slug);
    entries.set(guide.slug, {
      ...reference,
      ...guide,
      coverage: "guide",
      sources: reference?.sources ?? [],
      path: `/ports/${guide.slug}`,
    });
  }

  return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name));
}
