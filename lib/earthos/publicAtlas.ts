import atlasData from "@/data/earthos/public-atlas-nodes.v1.json";

export const PUBLIC_ATLAS_STATUSES = [
  "live",
  "building",
  "field_test",
  "future_target",
  "fallback_market",
] as const;

export type PublicAtlasStatus = (typeof PUBLIC_ATLAS_STATUSES)[number];

export type PublicAtlasNode = {
  id: string;
  label: string;
  public_label: string;
  node_type: string;
  lat: number;
  lng: number;
  region: string;
  public_status: PublicAtlasStatus;
  public_description: string;
  related_domain: string;
  public_cta_label: string;
  public_cta_href: string;
  visual_weight: 1 | 2 | 3;
  arc_targets: string[];
  disclaimer: string;
  is_public: boolean;
  show_on_public_atlas: boolean;
};

type RawAtlasData = {
  version: string;
  updated_at: string;
  nodes: PublicAtlasNode[];
};

export type PublicAtlasStatusFilter = PublicAtlasStatus | "all";

export const PUBLIC_ATLAS_FILTERS: Array<{
  value: PublicAtlasStatusFilter;
  label: string;
  shortLabel: string;
}> = [
  { value: "all", label: "All", shortLabel: "All" },
  { value: "live", label: "Live", shortLabel: "Live" },
  { value: "building", label: "Building", shortLabel: "Build" },
  { value: "field_test", label: "Field tests", shortLabel: "Field" },
  { value: "future_target", label: "Future targets", shortLabel: "Future" },
  { value: "fallback_market", label: "Fallback markets", shortLabel: "Fallback" },
];

export const PUBLIC_ATLAS_STATUS_LABELS: Record<PublicAtlasStatus, string> = {
  live: "Live",
  building: "Building",
  field_test: "Field test",
  future_target: "Future target",
  fallback_market: "Fallback market",
};

export const PUBLIC_ATLAS_STATUS_COPY: Record<PublicAtlasStatus, string> = {
  live: "Visible public corridor or destination node.",
  building: "Active public buildout, still governed.",
  field_test: "Manual test surface, not automated telemetry proof.",
  future_target: "Research target for future network coverage.",
  fallback_market: "Coverage market, not owned execution.",
};

export const atlasDataVersion = (atlasData as RawAtlasData).version;
export const atlasUpdatedAt = (atlasData as RawAtlasData).updated_at;

export function getPublicAtlasNodes() {
  return (atlasData as RawAtlasData).nodes.filter((node) => node.is_public && node.show_on_public_atlas);
}

export function getPublicAtlasStats(nodes = getPublicAtlasNodes()) {
  return PUBLIC_ATLAS_STATUSES.map((status) => ({
    status,
    label: PUBLIC_ATLAS_STATUS_LABELS[status],
    count: nodes.filter((node) => node.public_status === status).length,
  }));
}
