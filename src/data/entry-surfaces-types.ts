export type EntrySurfaceKind = "city" | "corridor" | "feeder";

export type EntrySurfaceIntent = "transport" | "tours" | "activity" | "mixed";

export type EntrySurfaceSource = "city-registry" | "corridor-config" | "page-registry" | "override";

export type EntrySurface = {
  id: string;
  label: string;
  path: string;
  canonicalPath: string;
  source: EntrySurfaceSource;
  kind: EntrySurfaceKind;
  intent: EntrySurfaceIntent;
  clusterId: string;
  state?: string;
  tokens: string[];
  searchText: string;
  priority: number;
  rankScore: number;
  showInHeader: boolean;
  showInHomepage: boolean;
  showInCommand: boolean;
};

export type EntrySurfaceOverride = Omit<EntrySurface, "source" | "canonicalPath" | "searchText"> & {
  source?: EntrySurfaceSource;
};
