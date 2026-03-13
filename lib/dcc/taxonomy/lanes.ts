export const DCC_LANES = ["tours", "cruises", "events", "transport"] as const;

export type DccLane = (typeof DCC_LANES)[number];

export const DCC_LANE_ORDER: readonly DccLane[] = DCC_LANES;

export const DCC_LANE_LABELS: Record<DccLane, string> = {
  tours: "Tours available",
  cruises: "Cruise sailings",
  events: "Events",
  transport: "Transport",
};

export const DCC_LANE_SECTION_TARGETS: Record<DccLane, { label: string; id: string }> = {
  tours: { label: "Tours section", id: "section-external-listings" },
  cruises: { label: "Cruise focus", id: "section-lane-focus" },
  events: { label: "Event context", id: "section-observations" },
  transport: { label: "Transport context", id: "section-observations" },
};

export function isDccLane(value: string): value is DccLane {
  return (DCC_LANES as readonly string[]).includes(value);
}

export function parseAliveFilter(raw: string | null | undefined): DccLane[] {
  if (!raw) return [];
  const requested = raw
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(isDccLane);
  const set = new Set(requested);
  return DCC_LANE_ORDER.filter((lane) => set.has(lane));
}

export function serializeAliveFilter(lanes: readonly DccLane[]): string {
  const set = new Set(lanes);
  return DCC_LANE_ORDER.filter((lane) => set.has(lane)).join(",");
}
