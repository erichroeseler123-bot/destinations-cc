import {
  CanonicalLiveSignalArraySchema,
  type CanonicalLiveSignal,
  type EdgeSignalMap,
} from "@/lib/dcc/routing/schema";
import { toEdgeSignalKey } from "@/lib/dcc/routing/resolve";

type EdgeSignalGet = (key: string) => Promise<unknown>;

type DashboardSafeLiveSignals = {
  live_signals?: Record<string, unknown>;
};

function parseSignalArray(value: unknown): CanonicalLiveSignal[] {
  const parsed = CanonicalLiveSignalArraySchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

function parseDashboardSafeSignalArray(value: unknown, subjectId: string): CanonicalLiveSignal[] {
  const parsed = value as DashboardSafeLiveSignals | null | undefined;
  return parseSignalArray(parsed?.live_signals?.[subjectId]);
}

async function defaultEdgeGet<T>(key: string) {
  const { get } = await import("@vercel/edge-config");
  return get<T>(key);
}

export async function getActiveSignalsForSubject(
  subjectId: string,
  options?: {
    edgeConfigEnabled?: boolean;
    edgeGet?: EdgeSignalGet;
  }
): Promise<CanonicalLiveSignal[]> {
  const edgeConfigEnabled =
    options?.edgeConfigEnabled ?? Boolean(process.env.EDGE_CONFIG || process.env.EDGE_CONFIG_ID);

  if (!edgeConfigEnabled) {
    return [];
  }

  try {
    const edgeGet = options?.edgeGet || ((key: string) => defaultEdgeGet<CanonicalLiveSignal[]>(key));
    const key = toEdgeSignalKey(subjectId);
    const value = await edgeGet(key);
    const directSignals = parseSignalArray(value);

    if (directSignals.length > 0) {
      return directSignals;
    }

    const plainSubjectValue = await edgeGet(subjectId);
    const plainSubjectSignals = parseSignalArray(plainSubjectValue);
    if (plainSubjectSignals.length > 0) {
      return plainSubjectSignals;
    }

    const nestedSignals = parseDashboardSafeSignalArray(value, subjectId);
    if (nestedSignals.length > 0) {
      return nestedSignals;
    }

    const rootValue = await edgeGet("live_signals");
    return parseDashboardSafeSignalArray(rootValue, subjectId);
  } catch {
    return [];
  }
}

export async function getEdgeSignalMapForSubjects(
  subjectIds: string[],
  options?: {
    edgeConfigEnabled?: boolean;
    edgeGet?: EdgeSignalGet;
  }
): Promise<EdgeSignalMap> {
  const uniqueSubjectIds = Array.from(new Set(subjectIds.filter(Boolean)));
  const signalEntries = await Promise.all(
    uniqueSubjectIds.map(async (subjectId) => {
      const signals = await getActiveSignalsForSubject(subjectId, options);
      return [toEdgeSignalKey(subjectId), signals] as const;
    })
  );

  return Object.fromEntries(signalEntries);
}
