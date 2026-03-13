export type CityAnalyticsLinkInput = {
  href: string;
  city: string;
  lane: "money" | "events" | "authority";
  sourceSection:
    | "city_money_lane_primary"
    | "city_money_lane_secondary"
    | "city_money_lane_intent"
    | "city_events_primary"
    | "city_events_secondary"
    | "city_events_intent";
  intentQuery?: string;
};

export function buildCityTrackedHref(input: CityAnalyticsLinkInput): string {
  const [rawPathAndQuery, hash = ""] = input.href.split("#");
  const [pathname, rawQuery = ""] = rawPathAndQuery.split("?");
  const params = new URLSearchParams(rawQuery);

  params.set("city", input.city);
  params.set("lane", input.lane);
  params.set("source_section", input.sourceSection);
  if (input.intentQuery) {
    params.set("intent_query", input.intentQuery);
  }

  const query = params.toString();
  const withQuery = query ? `${pathname}?${query}` : pathname;
  return hash ? `${withQuery}#${hash}` : withQuery;
}
