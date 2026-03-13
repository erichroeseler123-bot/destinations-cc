export type ProviderAdapterDiagnostics = {
  source: string;
  cache_status: "bypass" | "fresh" | "stale" | "miss";
  stale: boolean;
  last_updated: string | null;
  fallback_reason: string | null;
};

export type ProviderAdapterResult<T> = {
  ok: boolean;
  data: T;
  diagnostics: ProviderAdapterDiagnostics;
};

export type ProviderAdapter<TQuery, TData> = {
  id: string;
  isConfigured(): boolean;
  fetch(query: TQuery): Promise<ProviderAdapterResult<TData>>;
};
