import { z } from "zod";
import type { PlaceDiscoveryCard } from "@/lib/dcc/graph/placeActionGraph";
import type { GraphContextPayload } from "@/lib/dcc/graph/context";
import type { DccMediaAsset } from "@/lib/dcc/media/schema";
import type { DecisionEnginePage } from "@/lib/dcc/decision/schema";
import type { Next48Feed } from "@/lib/dcc/next48/types";
import type { LivePulseFeed } from "@/lib/dcc/livePulse/types";
import { DccEntityTypeSchema, type DccEntityType } from "@/lib/dcc/entities/types";

export const SurfaceModuleNameSchema = z.enum([
  "counts",
  "graph",
  "media",
  "decision",
  "next48",
  "livePulse",
  "share",
]);
export type SurfaceModuleName = z.infer<typeof SurfaceModuleNameSchema>;

export const SurfaceEntityKeySchema = z.string().regex(/^(city|port|venue|attraction|route):[a-z0-9-]+$/);
export type SurfaceEntityKey = string;
export const SurfaceEntityTypeSchema = DccEntityTypeSchema;

export type EntitySurfaceIndexEntry = {
  key: SurfaceEntityKey;
  entityType: DccEntityType;
  slug: string;
  canonicalPath: string;
  priority: "gold" | "high" | "standard";
  placeGraphSlug?: string;
  enabledModules: SurfaceModuleName[];
};
export type SurfaceEntityIndexEntry = EntitySurfaceIndexEntry;

export type EntitySurfaceIndex = {
  version: number;
  updated_at: string;
  entities: EntitySurfaceIndexEntry[];
};

export type SurfaceRequest = {
  entityKey: SurfaceEntityKey;
  modules?: SurfaceModuleName[];
  strict?: boolean;
  now?: Date;
  allowLowTierModules?: SurfaceModuleName[];
};

export type SurfaceModuleStatus = {
  status: "ok" | "missing" | "error";
  message?: string;
};

export type SurfaceCountsData = {
  placeGraph: PlaceDiscoveryCard | null;
  totals: {
    tours: number | null;
    cruises: number | null;
    transport: number | null;
    events: number | null;
  };
};

export type SurfaceGraphData = {
  context: GraphContextPayload | null;
};

export type SurfaceMediaData = {
  hero: DccMediaAsset | null;
  gallery: DccMediaAsset[];
  section: DccMediaAsset[];
};

export type SurfaceDecisionData = {
  page: DecisionEnginePage | null;
};

export type SurfaceNext48Data = {
  feed: Next48Feed | null;
};

export type SurfaceLivePulseData = {
  feed: LivePulseFeed | null;
};

export type SurfaceShareData = {
  cards: Array<{
    kind: "weekend" | "next48" | "livePulse";
    enabled: boolean;
    context: string;
  }>;
};

export type SurfaceCountsModule = SurfaceCountsData;
export type SurfaceGraphModule = SurfaceGraphData;
export type SurfaceMediaModule = SurfaceMediaData;
export type SurfaceDecisionModule = SurfaceDecisionData;
export type SurfaceNext48Module = SurfaceNext48Data & { supported?: boolean };
export type SurfaceLivePulseModule = SurfaceLivePulseData & { supported?: boolean };
export type SurfaceShareModule = SurfaceShareData;

export type SurfaceModules = {
  counts?: SurfaceCountsModule;
  graph?: SurfaceGraphModule;
  media?: SurfaceMediaModule;
  decision?: SurfaceDecisionModule;
  next48?: SurfaceNext48Module;
  livePulse?: SurfaceLivePulseModule;
  share?: SurfaceShareModule;
};

export type SurfaceResponse = {
  request: SurfaceRequest;
  entity: SurfaceEntityIndexEntry;
  surface?: SurfaceEntityIndexEntry;
  modules: SurfaceModules;
  diagnostics: {
    generatedAt: string;
    errors: string[];
    warnings: string[];
    moduleStatus: Partial<Record<SurfaceModuleName, SurfaceModuleStatus>>;
  };
};
