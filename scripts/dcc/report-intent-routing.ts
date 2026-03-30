import { REDIRECT_INTENT_REGISTRY } from "@/src/data/routing/redirect-intent-registry";

function priorityScore(item: (typeof REDIRECT_INTENT_REGISTRY)[number]) {
  let score = 0;
  if (item.needsIntentUpgrade) score += 5;
  if (item.nextStepExists === "no") score += 4;
  if (item.nextStepExists === "partial") score += 2;
  score += 6 - item.intentMatchScore;
  if (item.detectedIntent === "act") score += 2;
  if (item.detectedIntent === "compare") score += 1;
  return score;
}

const ranked = [...REDIRECT_INTENT_REGISTRY]
  .map((item) => ({ ...item, priorityScore: priorityScore(item) }))
  .sort((a, b) => b.priorityScore - a.priorityScore || a.sourcePath.localeCompare(b.sourcePath));

const focus = ranked.filter((item) => item.needsIntentUpgrade || item.nextStepExists !== "yes" || item.intentMatchScore <= 3);

const summary = {
  records: REDIRECT_INTENT_REGISTRY.length,
  upgradesNeeded: REDIRECT_INTENT_REGISTRY.filter((item) => item.needsIntentUpgrade).length,
  partialNextSteps: REDIRECT_INTENT_REGISTRY.filter((item) => item.nextStepExists === "partial").length,
  noNextSteps: REDIRECT_INTENT_REGISTRY.filter((item) => item.nextStepExists === "no").length,
  lowMatch: REDIRECT_INTENT_REGISTRY.filter((item) => item.intentMatchScore <= 3).length,
  topPriorities: focus.slice(0, 10).map((item) => ({
    sourcePath: item.sourcePath,
    detectedIntent: item.detectedIntent,
    destinationPath: item.destinationPath,
    destinationType: item.destinationType,
    intentMatchScore: item.intentMatchScore,
    needsIntentUpgrade: item.needsIntentUpgrade,
    nextStepExists: item.nextStepExists,
    priorityScore: item.priorityScore,
    notes: item.notes,
  })),
};

console.log(JSON.stringify(summary, null, 2));
