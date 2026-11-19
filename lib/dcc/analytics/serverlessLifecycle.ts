import { after } from "next/server";
import {
  TRAFFIC_EVENT_TYPES,
  type AnalyticsEventType,
} from "./contract";

export type AnalyticsDeliveryTier = "best_effort_traffic" | "recoverable_milestone";

const BEST_EFFORT_SET = new Set<string>(TRAFFIC_EVENT_TYPES);

export function classifyEventDeliveryTier(eventType: AnalyticsEventType | string): AnalyticsDeliveryTier {
  return BEST_EFFORT_SET.has(eventType) ? "best_effort_traffic" : "recoverable_milestone";
}

const activeLifecycleTasks = new Set<Promise<void>>();

/**
 * Registers background analytics work with Next.js 16 / Vercel's supported request-context
 * `after()` (`waitUntil`) lifecycle hook so responses return immediately without freezing
 * in-flight background promises on serverless/Fluid Compute.
 *
 * Falls back cleanly to a tracked promise set when invoked outside a Next.js request scope
 * (e.g., direct route-handler unit tests).
 */
export function scheduleServerlessAfterTask(fn: () => Promise<void>): void {
  const startTracked = (): Promise<void> => {
    const p = Promise.resolve()
      .then(() => fn())
      .catch(() => undefined)
      .finally(() => {
        activeLifecycleTasks.delete(p);
      });
    activeLifecycleTasks.add(p);
    return p;
  };

  try {
    after(() => startTracked());
  } catch {
    void startTracked();
  }
}

export async function flushServerlessAfterTasks(): Promise<void> {
  while (activeLifecycleTasks.size > 0) {
    await Promise.allSettled(Array.from(activeLifecycleTasks));
  }
}
