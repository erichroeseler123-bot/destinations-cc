import { buildDccReturnUrl } from "@/lib/dcc/satelliteHandoffs";

export const WTA_SITE_ORIGIN = "https://welcometoalaskatours.com";
export const WTA_WIDGET_BASE_PATH = "/widget";
export const WTA_WIDGET_BASE = `${WTA_SITE_ORIGIN}${WTA_WIDGET_BASE_PATH}`;

export type WtaWidgetAttribution = {
  handoffId?: string;
  source?: string;
  sourceSlug?: string;
  sourcePage?: string;
  topicSlug?: string;
  portSlug?: string;
  productSlug?: string;
  eventDate?: string;
  returnPath?: string;
  dccReturnUrl?: string;
  embedDomain?: string;
  embedPath?: string;
  widgetPlacement?: string;
  embedId?: string;
};

function setIfPresent(params: URLSearchParams, key: string, value?: string) {
  if (typeof value === "string" && value.trim()) {
    params.set(key, value.trim());
  }
}

export function buildWtaProductWidgetUrl(input: {
  company: string;
  item: string | number;
  attribution?: WtaWidgetAttribution;
}) {
  const url = new URL(
    `${WTA_WIDGET_BASE_PATH}/${encodeURIComponent(input.company)}/${encodeURIComponent(String(input.item))}`,
    WTA_SITE_ORIGIN
  );
  const attribution = input.attribution || {};
  const handoffId = attribution.handoffId?.trim();

  setIfPresent(url.searchParams, "dcc_handoff_id", handoffId);
  setIfPresent(url.searchParams, "source", attribution.source || "dcc");
  setIfPresent(url.searchParams, "source_slug", attribution.sourceSlug);
  setIfPresent(url.searchParams, "source_page", attribution.sourcePage);
  setIfPresent(url.searchParams, "topic", attribution.topicSlug);
  setIfPresent(url.searchParams, "port_slug", attribution.portSlug);
  setIfPresent(url.searchParams, "product_slug", attribution.productSlug);
  setIfPresent(url.searchParams, "date", attribution.eventDate);
  setIfPresent(url.searchParams, "embed_domain", attribution.embedDomain);
  setIfPresent(url.searchParams, "embed_path", attribution.embedPath);
  setIfPresent(url.searchParams, "widget_placement", attribution.widgetPlacement);
  setIfPresent(url.searchParams, "embed_id", attribution.embedId);

  const dccReturnUrl =
    attribution.dccReturnUrl ||
    buildDccReturnUrl(attribution.returnPath, handoffId);
  setIfPresent(url.searchParams, "dcc_return", dccReturnUrl);

  return url.toString();
}
