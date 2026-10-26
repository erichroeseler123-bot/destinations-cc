import { ZodError } from "zod";
import { summarizeRecentReviews } from "@/lib/dcc/guestFeedback";
import type {
  BookingDestination,
  CandidateOption,
  DecisionEngineDefinition,
  DecisionEvaluateOptions,
  DecisionResult,
  EliminatedOption,
  EvaluatedViableOption,
  EvidenceClaim,
  HardConstraintEvalContext,
  ReviewEvidence,
  SourceRecord,
  SourceStatus,
  UnknownOrStaleFact,
} from "@/lib/dcc/decisionEngines/types";

export class DecisionEngineInputValidationError extends Error {
  public readonly issues: Array<{ path: string; message: string }>;

  constructor(message: string, issues: Array<{ path: string; message: string }>) {
    super(message);
    this.name = "DecisionEngineInputValidationError";
    this.issues = issues;
  }
}

export function validateEngineAnswers<TInput>(
  definition: DecisionEngineDefinition<TInput>,
  rawInput: unknown,
): TInput {
  const inputToParse =
    rawInput === undefined || rawInput === null
      ? definition.defaultExampleInput
      : rawInput;

  const parsed = definition.answerSchema.safeParse(inputToParse);
  if (!parsed.success) {
    const issues = (parsed.error as ZodError).issues.map((issue) => ({
      path: issue.path.join(".") || "root",
      message: issue.message,
    }));
    throw new DecisionEngineInputValidationError(
      `Invalid decision engine input for ${definition.engineId}: ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`,
      issues,
    );
  }
  return parsed.data;
}

export function evaluateSourceRecordStatus(
  source: SourceRecord,
  now: Date,
  overrideStatus?: SourceStatus,
): SourceRecord {
  if (overrideStatus) {
    return {
      ...source,
      status: overrideStatus,
      statusNote: `Status overridden to ${overrideStatus}.`,
    };
  }

  if (
    source.status === "withdrawn" ||
    source.status === "conflicted" ||
    source.status === "unavailable"
  ) {
    return source;
  }

  const expiresMs = Date.parse(source.expiresAt);
  if (Number.isFinite(expiresMs) && now.getTime() > expiresMs) {
    return {
      ...source,
      status: "stale",
      statusNote: `Source verification expired at ${source.expiresAt}; due for re-verification.`,
    };
  }

  return source;
}

export function assertNoWtaBookingDestination(
  engineId: string,
  destinations: BookingDestination[],
): void {
  for (const dest of destinations) {
    if (
      /welcometoalaskatours/i.test(dest.url) ||
      /Welcome to Alaska Tours/i.test(dest.sellerName) ||
      /Welcome to Alaska Tours/i.test(dest.label)
    ) {
      throw new Error(
        `Ownership policy violation in engine ${engineId}: booking destination ${dest.destinationId} points to disallowed Welcome to Alaska Tours (${dest.url}).`,
      );
    }
  }
}

export function assertDecisionChangingClaimsHaveSources(
  engineId: string,
  claims: EvidenceClaim[],
  sourcesById: Map<string, SourceRecord>,
): void {
  for (const claim of claims) {
    if (!claim.isDecisionChanging) continue;
    if (!claim.sourceIds || claim.sourceIds.length === 0) {
      throw new Error(
        `Evidence policy violation in ${engineId}: decision-changing claim '${claim.claimId}' has no sourceIds.`,
      );
    }
    for (const sid of claim.sourceIds) {
      if (!sourcesById.has(sid)) {
        throw new Error(
          `Evidence policy violation in ${engineId}: claim '${claim.claimId}' references unknown sourceId '${sid}'.`,
        );
      }
    }
  }
}

function buildOptionReviewEvidence(
  option: CandidateOption,
  now: Date,
  options?: DecisionEvaluateOptions,
): ReviewEvidence | null {
  const cfg =
    options?.reviewConfigOverrides?.[option.optionId] ??
    option.reviewEvidenceConfig;
  if (!cfg) return null;

  const summaryResult = summarizeRecentReviews({
    productCode: cfg.productCode,
    reviews: cfg.reviews,
    checkStatus: cfg.checkStatus,
    lastRetrievedAt: cfg.lastRetrievedAt,
    sourcesQueried: cfg.sourcesQueried,
    windowDays: 180,
    referenceDate: now,
    minEligibleReviewsForSummary: 3,
    minReviewsPerTheme: 2,
  });

  return {
    optionId: option.optionId,
    productCode: cfg.productCode,
    summaryResult,
    sourceIds: option.sourceIds,
  };
}

export function evaluateDecisionEngine<TInput>(
  definition: DecisionEngineDefinition<TInput>,
  rawInput: unknown,
  options?: DecisionEvaluateOptions,
): DecisionResult<TInput> {
  const now = options?.now ?? new Date("2026-10-26T12:00:00.000Z");
  const normalizedAnswers = validateEngineAnswers(definition, rawInput);

  // 1. Evaluate all SourceRecords for freshness / overrides
  const evaluatedSources = definition.sourceRecords.map((src) =>
    evaluateSourceRecordStatus(
      src,
      now,
      options?.sourceStatusOverrides?.[src.sourceId],
    ),
  );
  const sourcesById = new Map<string, SourceRecord>(
    evaluatedSources.map((s) => [s.sourceId, s]),
  );

  // 2. Assert every decision-changing claim is backed by at least one registered SourceRecord
  assertDecisionChangingClaimsHaveSources(
    definition.engineId,
    definition.evidenceClaims,
    sourcesById,
  );

  const claimsById = new Map<string, EvidenceClaim>(
    definition.evidenceClaims.map((c) => [c.claimId, c]),
  );

  // 3. Detect example scenario vs. personalized traveler input
  const exampleDetection = definition.isExampleScenarioDetector(
    rawInput,
    normalizedAnswers,
  );
  const globalUnknownOrStaleFacts: UnknownOrStaleFact[] = [
    ...exampleDetection.missingInputFacts,
  ];
  const globalWarnings: string[] = [];

  if (exampleDetection.isExample && exampleDetection.banner) {
    globalWarnings.push(exampleDetection.banner);
  }

  // Record global stale/unavailable/withdrawn sources
  for (const src of evaluatedSources) {
    if (src.status !== "current") {
      const category: UnknownOrStaleFact["category"] =
        src.status === "stale"
          ? "stale_source"
          : src.status === "unavailable"
            ? "unavailable_source"
            : "conflicted_source";
      globalUnknownOrStaleFacts.push({
        factId: `source-status-${src.sourceId}`,
        optionId: null,
        category,
        summary: `Source '${src.sourceTitle}' (${src.sourceOrganization}) is currently ${src.status.toUpperCase()}.`,
        impactOnDecision:
          src.statusNote ||
          "Options depending on this source are explicitly qualified and require direct confirmation with the operator or agency.",
        sourceIds: [src.sourceId],
      });
    }
  }

  const evalContext: HardConstraintEvalContext = {
    now,
    evaluatedSourcesById: sourcesById,
    computeTimingForOption: (opt) =>
      definition.computeTimingForOption(opt, normalizedAnswers),
  };

  const soldOutSet = new Set(options?.soldOutOptionIds ?? []);
  const viableOptions: EvaluatedViableOption[] = [];
  const eliminatedOptions: EliminatedOption[] = [];

  // 4. Evaluate each CandidateOption: Hard Constraints FIRST, Preferences ONLY if all Hard Constraints pass
  for (const candidate of definition.candidateOptions) {
    const failedHardConstraintIds: string[] = [];
    const eliminationReasons: string[] = [];
    const whatInputChangeWouldAlterResult: string[] = [];
    const optionUnknowns: UnknownOrStaleFact[] = [];
    const optionWarnings: string[] = [];

    // Built-in hard constraint: verified sold-out status
    if (soldOutSet.has(candidate.optionId)) {
      failedHardConstraintIds.push("hc-verified-sold-out");
      eliminationReasons.push(
        `${candidate.shortLabel} has a verified sold-out status for the selected departure window.`,
      );
      whatInputChangeWouldAlterResult.push(
        "Selecting an alternate travel date or morning/afternoon departure window with open inventory would make this option viable.",
      );
    }

    for (const rule of definition.hardConstraintRules) {
      const check = rule.evaluate(candidate, normalizedAnswers, evalContext);
      if (!check.passed) {
        failedHardConstraintIds.push(rule.ruleId);
        if (check.eliminationReason) {
          eliminationReasons.push(check.eliminationReason);
        }
        if (check.whatInputChangeWouldAlterResult) {
          whatInputChangeWouldAlterResult.push(
            check.whatInputChangeWouldAlterResult,
          );
        }
      } else {
        if (check.unknownOrStaleWarning) {
          optionUnknowns.push(check.unknownOrStaleWarning);
        }
        if (check.decisionChangingWarning) {
          optionWarnings.push(check.decisionChangingWarning);
        }
      }
    }

    // Check supporting sources for this option
    const supportingSources = candidate.sourceIds
      .map((sid) => sourcesById.get(sid))
      .filter((s): s is SourceRecord => Boolean(s));
    const withdrawnOrConflictedSupporting = supportingSources.filter(
      (s) => s.status === "withdrawn" || s.status === "conflicted",
    );
    const nonCurrentSupporting = supportingSources.filter(
      (s) => s.status !== "current",
    );

    if (withdrawnOrConflictedSupporting.length > 0) {
      for (const badSrc of withdrawnOrConflictedSupporting) {
        failedHardConstraintIds.push("hc-evidence-withdrawn-or-conflicted");
        eliminationReasons.push(
          `Withdrawn from positive recommendations because supporting source '${badSrc.sourceTitle}' (${badSrc.sourceOrganization}) has status ${badSrc.status.toUpperCase()}.`,
        );
        whatInputChangeWouldAlterResult.push(
          `Requires re-verification and restoration of source '${badSrc.sourceTitle}' (${badSrc.sourceId}) before this option can be recommended.`,
        );
      }
    }

    for (const staleSrc of nonCurrentSupporting) {
      optionUnknowns.push({
        factId: `opt-${candidate.optionId}-src-${staleSrc.sourceId}`,
        optionId: candidate.optionId,
        category:
          staleSrc.status === "stale"
            ? "stale_source"
            : staleSrc.status === "unavailable"
              ? "unavailable_source"
              : "conflicted_source",
        summary: `Supporting source '${staleSrc.sourceTitle}' (${staleSrc.sourceOrganization}) is ${staleSrc.status}.`,
        impactOnDecision: `Recommendation for ${candidate.shortLabel} is qualified until '${staleSrc.sourceTitle}' is re-verified directly.`,
        sourceIds: [staleSrc.sourceId],
      });
      optionWarnings.push(
        `Evidence qualification: supporting source '${staleSrc.sourceTitle}' is ${staleSrc.status}; verify schedule and rules directly before booking.`,
      );
    }

    // Evaluate claim-level freshness: withdraw any claim whose backing sources are not all current
    const rawClaims = candidate.claimIds
      .map((cid) => claimsById.get(cid))
      .filter((c): c is EvidenceClaim => Boolean(c));
    const supportingClaims: EvidenceClaim[] = [];
    for (const claim of rawClaims) {
      const claimSources = claim.sourceIds
        .map((sid) => sourcesById.get(sid))
        .filter((s): s is SourceRecord => Boolean(s));
      const hasNonCurrentClaimSource =
        claimSources.length === 0 ||
        claimSources.some((s) => s.status !== "current");
      if (hasNonCurrentClaimSource) {
        optionUnknowns.push({
          factId: `opt-${candidate.optionId}-claim-${claim.claimId}`,
          optionId: candidate.optionId,
          category: "stale_source",
          summary: `Claim '${claim.claimId}' (${claim.classification}) was withdrawn/qualified because backing source(s) [${claim.sourceIds.join(", ")}] are not current.`,
          impactOnDecision: `Decision claim '${claim.statement}' cannot be asserted as current verified evidence until source re-verification.`,
          sourceIds: claim.sourceIds,
        });
      } else {
        supportingClaims.push(claim);
      }
    }

    if (failedHardConstraintIds.length > 0) {
      eliminatedOptions.push({
        optionId: candidate.optionId,
        title: candidate.title,
        shortLabel: candidate.shortLabel,
        optionKind: candidate.optionKind,
        failedHardConstraintIds,
        eliminationReasons,
        whatInputChangeWouldAlterResult:
          whatInputChangeWouldAlterResult.length > 0
            ? whatInputChangeWouldAlterResult
            : [
                "Adjusting the incompatible date, time window, mobility, or age input above would re-evaluate this option.",
              ],
        supportingSourceIds: candidate.sourceIds,
      });
      continue;
    }

    // Option passed ALL hard constraints -> now evaluate PreferenceRules
    let preferenceScore = 0;
    const preferenceBreakdown: EvaluatedViableOption["preferenceBreakdown"] = [];
    const whyItFits: string[] = [];

    const timingCalculation = evalContext.computeTimingForOption(candidate);
    whyItFits.push(timingCalculation.summary);

    for (const prefRule of definition.preferenceRules) {
      const res = prefRule.evaluate(candidate, normalizedAnswers, evalContext);
      const clampedPoints = Math.max(0, Math.min(prefRule.maxPoints, res.points));
      preferenceScore += clampedPoints;
      if (res.reason) {
        preferenceBreakdown.push({
          ruleId: prefRule.ruleId,
          label: prefRule.label,
          points: clampedPoints,
          reason: res.reason,
        });
        if (clampedPoints > 0) {
          whyItFits.push(res.reason);
        }
      }
    }

    const hasQualification =
      optionUnknowns.length > 0 || nonCurrentSupporting.length > 0;
    const qualificationStatus: EvaluatedViableOption["qualificationStatus"] =
      hasQualification ? "qualified_stale_or_unknown" : "verified_fit";

    const bookingDestinations = definition.customizeBookingDestinations
      ? definition.customizeBookingDestinations(
          candidate,
          normalizedAnswers,
          exampleDetection.isExample,
        )
      : candidate.bookingDestinations;

    assertNoWtaBookingDestination(definition.engineId, bookingDestinations);

    const reviewEvidence = buildOptionReviewEvidence(candidate, now, options);

    viableOptions.push({
      optionId: candidate.optionId,
      title: candidate.title,
      shortLabel: candidate.shortLabel,
      optionKind: candidate.optionKind,
      actualOperators: candidate.actualOperators,
      islandsOrRegions: candidate.islandsOrRegions,
      departureAreas: candidate.departureAreas,
      vesselOrVehicleType: candidate.vesselOrVehicleType,
      indicativePriceUsd: candidate.indicativePriceUsd,
      fitTier:
        candidate.optionKind === "public_or_diy"
          ? "noncommercial_alternative"
          : hasQualification
            ? "qualified_fit"
            : "strong_fit",
      qualificationStatus,
      preferenceScore,
      preferenceBreakdown,
      commercialWeightApplied: 0,
      whyItFits,
      tradeoffs: candidate.tradeoffs,
      timingCalculation,
      comparisonValues: candidate.comparisonValues,
      unknownOrStaleFacts: optionUnknowns,
      decisionChangingWarnings: optionWarnings,
      supportingClaims,
      supportingSources,
      reviewEvidence,
      bookingDestinations,
    });
  }

  // 5. Sort viable options deterministically:
  //    Guided/commercial options before noncommercial shore lookouts for primary tour ranking,
  //    then verified_fit before qualified_stale_or_unknown,
  //    then preferenceScore descending,
  //    then timing netSlackMinutes descending,
  //    then optionId ascending.
  viableOptions.sort((a, b) => {
    const aIsTour = a.optionKind !== "public_or_diy" ? 1 : 0;
    const bIsTour = b.optionKind !== "public_or_diy" ? 1 : 0;
    if (bIsTour !== aIsTour) return bIsTour - aIsTour;

    const aVerified = a.qualificationStatus === "verified_fit" ? 1 : 0;
    const bVerified = b.qualificationStatus === "verified_fit" ? 1 : 0;
    if (bVerified !== aVerified) return bVerified - aVerified;

    if (b.preferenceScore !== a.preferenceScore) {
      return b.preferenceScore - a.preferenceScore;
    }

    const aSlack = a.timingCalculation.netSlackMinutes ?? 999;
    const bSlack = b.timingCalculation.netSlackMinutes ?? 999;
    if (bSlack !== aSlack) return bSlack - aSlack;

    return a.optionId.localeCompare(b.optionId);
  });

  // Determine bestFitOption (only among guided/private tour options when at least one is viable)
  const viableTourOptions = viableOptions.filter(
    (o) => o.optionKind !== "public_or_diy",
  );
  const bestFitOption = viableTourOptions.length > 0 ? viableTourOptions[0] : null;
  if (bestFitOption && bestFitOption.qualificationStatus === "verified_fit") {
    bestFitOption.fitTier = "best_fit";
  }

  const alternatives = viableOptions.filter(
    (o) => o.optionId !== bestFitOption?.optionId,
  );

  let noTourResponsiblyRecommendedReason: string | null = null;
  if (!bestFitOption) {
    const primaryElimReasons = eliminatedOptions
      .slice(0, 3)
      .map((e) => `${e.shortLabel}: ${e.eliminationReasons[0] || "Failed hard constraint"}`)
      .join(" | ");
    noTourResponsiblyRecommendedReason =
      `No commercial tour can be responsibly recommended for these exact constraints (${primaryElimReasons}).` +
      (viableOptions.some((o) => o.optionKind === "public_or_diy")
        ? " A noncommercial shore-based or DIY option remains available below with its limitations noted."
        : "");
  }

  const allUnknownOrStaleFacts: UnknownOrStaleFact[] = [
    ...globalUnknownOrStaleFacts,
    ...viableOptions.flatMap((o) => o.unknownOrStaleFacts),
  ];

  const allWarnings = Array.from(
    new Set([
      ...globalWarnings,
      ...viableOptions.flatMap((o) => o.decisionChangingWarnings),
      ...(noTourResponsiblyRecommendedReason
        ? [noTourResponsiblyRecommendedReason]
        : []),
    ]),
  );

  let conciseVerdict: string;
  const prefix = exampleDetection.isExample
    ? "Example Scenario (enter your travel date and specifics above for a personalized verdict): "
    : "";

  if (!bestFitOption) {
    conciseVerdict = `${prefix}${noTourResponsiblyRecommendedReason}`;
  } else if (bestFitOption.qualificationStatus === "qualified_stale_or_unknown") {
    conciseVerdict = `${prefix}No unqualified positive recommendation can be issued because required schedule or source evidence is stale or unverified. Top qualified option requiring direct confirmation: ${bestFitOption.title} (preference score ${bestFitOption.preferenceScore}; ${bestFitOption.timingCalculation.summary}).`;
  } else {
    conciseVerdict = `${prefix}Best fit is ${bestFitOption.title} (preference score ${bestFitOption.preferenceScore}; ${bestFitOption.timingCalculation.summary}). ${viableTourOptions.length} tour option(s) passed all hard constraints and ${eliminatedOptions.length} incompatible option(s) were eliminated.`;
  }

  const currentCount = evaluatedSources.filter(
    (s) => s.status === "current",
  ).length;
  const staleCount = evaluatedSources.filter((s) => s.status === "stale").length;
  const unavailableOrWithdrawnCount = evaluatedSources.filter(
    (s) =>
      s.status === "unavailable" ||
      s.status === "withdrawn" ||
      s.status === "conflicted",
  ).length;

  const evidenceStatus: DecisionResult["evidenceHealth"]["status"] =
    unavailableOrWithdrawnCount > 0
      ? "has_withdrawn_or_conflicted"
      : staleCount > 0
        ? "has_stale_or_unavailable"
        : "all_current";

  const allBookingDestinations = viableOptions.flatMap(
    (o) => o.bookingDestinations,
  );
  assertNoWtaBookingDestination(definition.engineId, allBookingDestinations);

  return {
    engineId: definition.engineId,
    engineVersion: definition.version,
    evaluatedAt: now.toISOString(),
    isExampleScenario: exampleDetection.isExample,
    exampleScenarioBanner: exampleDetection.banner,
    normalizedAnswers,
    conciseVerdict,
    noTourResponsiblyRecommendedReason,
    bestFitOption,
    viableOptions,
    alternatives,
    eliminatedOptions,
    tradeoffs: viableOptions.map((o) => ({
      optionId: o.optionId,
      shortLabel: o.shortLabel,
      strengths: o.tradeoffs.strengths,
      limitations: o.tradeoffs.limitations,
    })),
    unknownOrStaleFacts: allUnknownOrStaleFacts,
    decisionChangingWarnings: allWarnings,
    evidenceHealth: {
      status: evidenceStatus,
      recommendedCacheControl:
        evidenceStatus === "all_current"
          ? "public, max-age=60, stale-while-revalidate=300"
          : "no-store",
      currentCount,
      staleCount,
      unavailableOrWithdrawnCount,
    },
    sourceReferences: evaluatedSources,
    bookingDestinations: allBookingDestinations,
    commercialNeutrality: {
      commercialWeightAppliedToRanking: 0,
      preselectedCommissionSeller: false,
      disclosure:
        "Hard constraints and preference rankings are computed strictly from verified operational, timing, vessel, and safety facts with zero commercial weight (commercialWeightAppliedToRanking = 0). Direct operators, DCC owned specialist sites, affiliate marketplaces, and noncommercial alternatives are disclosed transparently after the decision.",
    },
  };
}
