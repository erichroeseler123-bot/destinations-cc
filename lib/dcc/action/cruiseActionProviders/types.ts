import type { CruiseSailing } from "@/lib/dcc/cruise/schema";

export type CruiseProviderFetchContext = {
  timeout_ms: number;
};

export type CruiseProviderAdapter = {
  id: "carnival" | "royalcaribbean" | "norwegian";
  isConfigured: () => boolean;
  fetchSailings: (ctx: CruiseProviderFetchContext) => Promise<CruiseSailing[]>;
};

export type CruiseProviderFetchResult = {
  provider: CruiseProviderAdapter["id"];
  sailings: CruiseSailing[];
  error?: string;
};
