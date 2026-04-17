export type DecisionMode = "browse" | "guided";

export interface UserSession {
  decisionMode: DecisionMode;
  context: {
    intent: string;
    source: string;
    preference?: string;
  };
}
