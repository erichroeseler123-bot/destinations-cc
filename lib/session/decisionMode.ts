import type { DecisionMode, UserSession } from "@/types/session";

export const DECISION_MODE_QUERY_PARAM = "mode";
export const DECISION_PATH_QUERY_PARAM = "path";
export const GUIDED_QUERY_VALUE = "guided";
const STORAGE_PREFIX = "dcc_decision_session_v1";

type SearchParamInput = Record<string, string | string[] | undefined> | URLSearchParams | undefined;

type ResolvedDecisionState = {
  mode: DecisionMode;
  source: "url" | "session" | "default";
  session: UserSession | null;
};

function readFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getStorageKey(intent: string) {
  return `${STORAGE_PREFIX}:${intent}`;
}

function readModeValue(searchParams: SearchParamInput) {
  if (!searchParams) return null;
  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(DECISION_MODE_QUERY_PARAM) || searchParams.get(DECISION_PATH_QUERY_PARAM);
  }
  return (
    readFirst(searchParams[DECISION_MODE_QUERY_PARAM]) ||
    readFirst(searchParams[DECISION_PATH_QUERY_PARAM]) ||
    null
  );
}

export function readDecisionModeFromSearchParams(searchParams: SearchParamInput): DecisionMode {
  return readModeValue(searchParams) === GUIDED_QUERY_VALUE ? "guided" : "browse";
}

export function buildGuidedHref(pathname: string, params?: URLSearchParams | Record<string, string | undefined>) {
  const next = new URLSearchParams(params instanceof URLSearchParams ? params : undefined);

  if (params && !(params instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value.length > 0) next.set(key, value);
    }
  }

  next.set(DECISION_MODE_QUERY_PARAM, GUIDED_QUERY_VALUE);
  next.set(DECISION_PATH_QUERY_PARAM, GUIDED_QUERY_VALUE);

  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function persistDecisionSession(session: UserSession) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(getStorageKey(session.context.intent), JSON.stringify(session));
  } catch {
    // Persistence should never block navigation.
  }
}

export function readPersistedDecisionSession(intent: string): UserSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(getStorageKey(intent));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserSession;
    if (!parsed || parsed.decisionMode !== "guided" || !parsed.context?.intent) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPersistedDecisionSession(intent: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(getStorageKey(intent));
  } catch {
    // Ignore storage failures.
  }
}

export function resolveDecisionState(intent: string, searchParams?: URLSearchParams): ResolvedDecisionState {
  if (readDecisionModeFromSearchParams(searchParams) === "guided") {
    const session = readPersistedDecisionSession(intent);
    return { mode: "guided", source: "url", session };
  }

  const session = readPersistedDecisionSession(intent);
  if (session?.decisionMode === "guided") {
    return { mode: "guided", source: "session", session };
  }

  return { mode: "browse", source: "default", session: null };
}
