import { buildDecisionContinuationParams } from "@/lib/dcc/contracts/decisionContinuation";
import {
  getDecisionPatternExecutionUrl,
  getDecisionPatterns,
} from "@/lib/dcc/decisionPatterns";
import {
  SYSTEM_INVENTORY,
  getSystemInventoryCorridorExecution,
} from "@/src/data/system-inventory";
import { getRootRouteGovernance } from "@/src/data/route-governance";

const SITE_URL = "https://www.destinationcommandcenter.com";

export { CANONICAL_CONTINUATION_FIELDS } from "@/lib/dcc/decisionPatterns";

export type PublicCorridorContract = {
  id: string;
  label: string;
  planningPath: string;
  planningUrl: string;
  executionSurface: string;
  noReask: true;
  continuity: {
    requiredFields: readonly string[];
    defaultPolicy: "continue_without_reset";
    behavior: string;
    sampleParams: Record<string, string>;
  };
};

function assertCanonicalPlanningPath(pathname: string) {
  const governance = getRootRouteGovernance(pathname);
  if (!governance || (governance.publishState !== "promoted" && governance.publishState !== "indexable")) {
    throw new Error(`Public corridor planning path is not canonical and public: ${pathname}`);
  }
}

function assertExecutionSurface(corridorId: string, executionSurface: string) {
  const execution = getSystemInventoryCorridorExecution(corridorId);
  if (!execution) {
    throw new Error(`Missing corridor execution for ${corridorId}`);
  }
  if (execution.bookingSurface !== executionSurface) {
    throw new Error(
      `Execution surface mismatch for ${corridorId}: expected ${execution.bookingSurface}, received ${executionSurface}`,
    );
  }
}

export function getPublicCorridorContracts(): PublicCorridorContract[] {
  return getDecisionPatterns().map((pattern) => {
    const executionSurface = getDecisionPatternExecutionUrl(pattern);
    assertCanonicalPlanningPath(pattern.canonicalDecisionPath);
    assertExecutionSurface(pattern.corridorId, executionSurface);

    return {
      id: pattern.corridorId,
      label: pattern.label,
      planningPath: pattern.canonicalDecisionPath,
      planningUrl: `${SITE_URL}${pattern.canonicalDecisionPath}`,
      executionSurface,
      noReask: true,
      continuity: {
        requiredFields: pattern.handoffParams,
        defaultPolicy: "continue_without_reset",
        behavior:
          "Do not restart a completed decision. Preserve the decision state and continue directly into the execution surface.",
        sampleParams: buildDecisionContinuationParams({
          sourcePage: pattern.canonicalDecisionPath,
          corridor: pattern.corridorId,
          cta: "primary",
          action: pattern.action,
          option: pattern.option,
          product: pattern.product,
          sourceSurface: "dcc",
          destinationSurface: "operator",
          policy: "continue_without_reset",
        }),
      },
    };
  });
}

export function getPublicMachineReadablePaths() {
  const planningPaths = getPublicCorridorContracts().map((corridor) => corridor.planningPath);
  return ["/", "/about", "/ai", ...planningPaths];
}

export function getPublicOperatorIndexabilitySnapshot() {
  const routes = SYSTEM_INVENTORY.routes.filter((route) =>
    ["shuttleya", "420-airport-pickup"].includes(route.owner),
  );
  return routes.map((route) => ({
    owner: route.owner,
    path: route.path,
    publishState: route.publishState,
  }));
}
