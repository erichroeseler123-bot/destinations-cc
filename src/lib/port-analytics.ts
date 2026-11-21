import type { PortExcursionCategory } from "@/src/data/port-authority-config";

export type PortAnalyticsLinkInput = {
  href: string;
  port: string;
  lane: "authority";
  sourceSection:
    | "port_excursions_primary"
    | "port_excursions_secondary"
    | "port_excursions_category"
    | "port_related_links";
  intentQuery?: string;
  categoryLabel?: string;
};

export function buildPortTrackedHref(input: PortAnalyticsLinkInput): string {
  const [rawPathAndQuery, hash = ""] = input.href.split("#");
  const [pathname, rawQuery = ""] = rawPathAndQuery.split("?");
  const params = new URLSearchParams(rawQuery);

  if (!params.get("port")) {
    params.set("port", input.port);
  }
  params.set("lane", input.lane);
  params.set("source_section", input.sourceSection);
  if (input.intentQuery) params.set("intent_query", input.intentQuery);
  if (input.categoryLabel) params.set("category_label", input.categoryLabel);

  const query = params.toString();
  const withQuery = query ? `${pathname}?${query}` : pathname;
  return hash ? `${withQuery}#${hash}` : withQuery;
}

export function buildPortExcursionHref(
  portName: string,
  category: PortExcursionCategory,
  portSlug?: string,
): string {
  const encodedTourId = category.viatorTourId?.trim();
  if (encodedTourId) {
    const out = new URLSearchParams();
    if (category.viatorBookingUrl?.trim()) {
      out.set("u", category.viatorBookingUrl.trim());
    }
    out.set("product", encodedTourId);
    if (portSlug?.trim()) {
      out.set("port", portSlug.trim());
    }
    out.set("surface", "dcc_port_excursions_category");
    return `/go/out?${out.toString()}`;
  }

  const query = (category.viatorQuery || `${portName} ${category.label}`).trim();
  return `/tours?q=${encodeURIComponent(query)}`;
}
