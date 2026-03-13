import type { PortView } from "./ports";

export function areaSlug(s: string | undefined | null): string {
  if (!s) return "unknown";
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getPortAreaLabel(port: Pick<PortView, "region" | "area">): string {
  return port.region?.trim() || port.area?.trim() || "Other";
}

export function groupPortsByArea<T extends PortView>(ports: T[]): Map<string, T[]> {
  const byArea = new Map<string, T[]>();
  for (const port of ports) {
    const key = getPortAreaLabel(port);
    byArea.set(key, [...(byArea.get(key) || []), port]);
  }
  return byArea;
}

export function getRegionPorts<T extends PortView>(ports: T[], regionSlug: string): T[] {
  return ports
    .filter((p) => areaSlug(getPortAreaLabel(p)) === regionSlug)
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export function getRegionStaticParams<T extends PortView>(ports: T[]): Array<{ region: string }> {
  const areas = new Set<string>();
  for (const port of ports) areas.add(areaSlug(getPortAreaLabel(port)));
  return Array.from(areas).map((region) => ({ region }));
}
