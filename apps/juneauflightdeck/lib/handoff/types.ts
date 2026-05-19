export type HandoffContext = {
  handoffId?: string;
  sourcePage?: string;
  decisionCorridor?: string;
  decisionCta?: string;
  decisionAction?: string;
  decisionOption?: string;
  decisionProduct?: string;
  decisionEntry?: string;
  decisionState?: string;
  requestedLane?: string;
  resolvedLane?: string;
  topic?: string;
  subtype?: string;
  date?: string;
  port?: string;
  productSlug?: string;
  continuationLabel?: string;
  rank?: number;
  widgetId?: string;
  widgetPlacement?: string;
};

export type InitialUiState = {
  headline: string;
  supportLine?: string;
  arrivalConfirmationLine?: string;
  primaryCtaLabel: string;
  urgency?: "low" | "medium" | "high";
  defaultCardSlug?: string;
  prioritizedCardSlugs?: string[];
  sortMode?: "recommended" | "availability" | "price" | "fit";
  prefilledDate?: string;
  fitSignal?: string;
};

export type ResolverResult = {
  patch: Partial<InitialUiState>;
  confidence: number;
  reason: string;
};

export type ResolverRule<PageModel = unknown> = {
  id: string;
  match: (context: HandoffContext, model?: PageModel) => boolean;
  resolve: (context: HandoffContext, model?: PageModel) => ResolverResult;
};

export type ResolvedField<T = unknown> = {
  value: T;
  confidence: number;
  ruleId: string;
  reason: string;
};

export type ResolvedStateResult = {
  state: InitialUiState;
  winners: Map<keyof InitialUiState, ResolvedField>;
};
