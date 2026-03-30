export type MediaSource =
  | "local"
  | "ticketmaster"
  | "bandsintown"
  | "viator"
  | "fareharbor"
  | "seatgeek"
  | "unsplash"
  | "wikimedia";

export type MediaAttribution = {
  label: string;
  href?: string;
};

export type MediaTermsBucket =
  | "owned"
  | "provider-restricted"
  | "open-license"
  | "hotlink-only"
  | "synthetic";

export type NodeImageAsset = {
  src: string;
  alt: string;
  source: MediaSource;
  attribution?: MediaAttribution;
  sourceId?: string;
  pageUrl?: string;
  license?: string;
  licenseUrl?: string;
  providerTermsBucket?: MediaTermsBucket;
  canIndex?: boolean;
  hotlinkOnly?: boolean;
  width?: number;
  height?: number;
  priority?: number;
};

export type NodeImageSet = {
  hero?: NodeImageAsset | null;
  card?: NodeImageAsset | null;
  gallery?: NodeImageAsset[];
};

export type MediaEntityType =
  | "hotel"
  | "casino"
  | "attraction"
  | "district"
  | "pool"
  | "beach"
  | "artist"
  | "show"
  | "venue"
  | "tour"
  | "sports-team"
  | "sports-event";

export type MediaRequest = {
  entityType: MediaEntityType;
  slug: string;
  sourceHints?: Record<string, string | number | boolean | null | undefined>;
};

export type MediaRecord = {
  entityType: MediaEntityType;
  slug: string;
  imageSet: NodeImageSet;
  source: MediaSource;
  updatedAt: string;
};
