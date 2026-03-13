export type Next48EntityType = "city" | "port";

export type Next48BucketKey = "now" | "tonight" | "tomorrow" | "later-48h";

export type Next48Category =
  | "concerts"
  | "sports"
  | "festivals"
  | "tours"
  | "nightlife";

export type Next48Filter = "all" | Next48Category;

export type Next48SourceName =
  | "concerts"
  | "sports"
  | "festivals"
  | "tours"
  | "curated"
  | "live-pulse";

export type Next48Link = {
  label: string;
  href: string;
  kind: "internal" | "external";
};

export type Next48CandidateItem = {
  id: string;
  source: Next48SourceName;
  category: Next48Category;
  title: string;
  startAt: string;
  venueOrArea: string;
  image: string;
  whyItMatters: string;
  significance: number;
  actionability: number;
  localRelevance: number;
  authorityCta: Next48Link;
  executionCta?: Next48Link;
};

export type Next48Item = Next48CandidateItem & {
  bucket: Next48BucketKey;
  score: number;
};

export type Next48SourceResult = {
  source: Next48SourceName;
  status: "ok" | "error";
  items: Next48CandidateItem[];
  error?: string;
};

export type Next48SourceContext = {
  entityType: Next48EntityType;
  slug: string;
  now: Date;
  debugFailSource?: Next48SourceName | null;
};

export type Next48Feed = {
  entityType: Next48EntityType;
  slug: string;
  generatedAt: string;
  buckets: Record<Next48BucketKey, Next48Item[]>;
  counts: Record<Next48BucketKey, number>;
  totalItems: number;
  sourceDiagnostics: Array<{
    source: Next48SourceName;
    status: "ok" | "error";
    itemCount: number;
    error?: string;
  }>;
  availableFilters: Next48Filter[];
};

export const NEXT48_BUCKET_ORDER: Next48BucketKey[] = [
  "now",
  "tonight",
  "tomorrow",
  "later-48h",
];

export const NEXT48_FILTERS: Next48Filter[] = [
  "all",
  "concerts",
  "sports",
  "festivals",
  "tours",
  "nightlife",
];
