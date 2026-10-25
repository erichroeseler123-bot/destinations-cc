export type ThirdPartyReviewInput = {
  reviewId: string;
  productCode?: string | null;
  provider?: string | null;
  source?: string | null;
  /**
   * Actual publication date of the review from the third-party provider (YYYY-MM-DD or ISO-8601).
   * Sync or cache timestamps must NEVER be passed here.
   */
  publishedDate?: string | null;
  /**
   * Optional sync/retrieval timestamp. Explicitly ignored when filtering by publication window.
   */
  syncedAt?: string | null;
  rating?: number | null;
  title?: string | null;
  text?: string | null;
  userName?: string | null;
  /**
   * True ONLY when the upstream review provider explicitly establishes verified-booking status.
   */
  providerVerified?: boolean | null;
};

export type GuestFeedbackInput = {
  title: string;
  description?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  durationMinutes?: number | null;
  productCode?: string | null;
  reviews?: ThirdPartyReviewInput[] | null;
  checkStatus?: "checked_ok" | "unavailable" | "not_checked";
  lastRetrievedAt?: string | null;
  windowDays?: number;
  referenceDate?: Date | string;
};

export type SupportedPlanningNote = {
  id: string;
  label: "Planning Advice";
  basis: string;
  note: string;
};

export type RecentReviewExcerpt = {
  reviewId: string;
  publishedDate: string;
  rating: number | null;
  excerpt: string;
  provider: string;
  providerVerified: boolean;
};

export type RecentReviewThemeStatement = {
  themeId: string;
  topicLabel: string;
  polarity: "positive" | "negative" | "disagreement";
  statement: string;
  supportingReviewIds: string[];
  supportingExcerpts: RecentReviewExcerpt[];
};

export type RecentReviewSummaryState =
  | "thematic_summary"
  | "limited_recent_data"
  | "no_recent_reviews"
  | "unavailable";

export type RecentReviewSummaryResult = {
  state: RecentReviewSummaryState;
  statusHeadline: string;
  statusDetail: string;
  firstPartyCollectionNotice: string;
  authorityNotice: string;
  windowDays: number;
  windowStartDate: string;
  windowEndDate: string;
  sources: string[];
  coveredDateRange: { earliest: string; latest: string } | null;
  totalProvidedCount: number;
  productMatchedCount: number;
  excludedWrongProductCount: number;
  deduplicatedCount: number;
  excludedUndatedCount: number;
  excludedOutsideWindowCount: number;
  eligibleRecentCount: number;
  lastRetrievedAt: string | null;
  samplingLimitations: string;
  providerVerificationSummary: string;
  positives: RecentReviewThemeStatement[];
  negatives: RecentReviewThemeStatement[];
  disagreements: RecentReviewThemeStatement[];
  eligibleReviews: RecentReviewExcerpt[];
};

export type RecentReviewSummaryOptions = {
  productCode?: string | null;
  reviews?: ThirdPartyReviewInput[] | null;
  checkStatus?: "checked_ok" | "unavailable" | "not_checked";
  lastRetrievedAt?: string | null;
  retrievedAt?: string | null;
  sourcesQueried?: string[];
  samplingNote?: string;
  windowDays?: number;
  referenceDate?: Date | string;
  minEligibleReviewsForSummary?: number;
  minReviewsPerTheme?: number;
  totalProviderReviewCount?: number | null;
};

const FIRST_PARTY_NOTICE =
  "DCC does not collect first-party reviews or ratings.";

const AUTHORITY_NOTICE =
  "Review sentiment reflects third-party traveler opinions and never overrides authoritative current rules, official closures, or operational safety boundaries.";

function parseStrictPublicationDate(raw: string | null | undefined): {
  isoDate: string;
  timestampMs: number;
} | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Require at least YYYY-MM-DD prefix
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const isoDate = `${match[1]}-${match[2]}-${match[3]}`;
  const parsedMs = Date.parse(`${isoDate}T00:00:00.000Z`);
  if (!Number.isFinite(parsedMs)) return null;
  return { isoDate, timestampMs: parsedMs };
}

function normalizeReferenceDate(ref: Date | string | undefined): {
  isoDate: string;
  endOfDayMs: number;
} {
  const dateObj =
    ref instanceof Date
      ? ref
      : typeof ref === "string" && ref.trim()
        ? new Date(ref)
        : new Date();
  const safeDate = Number.isFinite(dateObj.getTime()) ? dateObj : new Date();
  const isoDate = safeDate.toISOString().slice(0, 10);
  const endOfDayMs = Date.parse(`${isoDate}T23:59:59.999Z`);
  return { isoDate, endOfDayMs };
}

function truncateExcerpt(text: string, maxLen = 180): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen - 1).trimEnd()}…`;
}

type TopicPattern = {
  themeId: string;
  topicLabel: string;
  topicRe: RegExp;
  positiveRe: RegExp;
  negativeRe: RegExp;
  positiveTemplate: (count: number) => string;
  negativeTemplate: (count: number) => string;
  disagreementTemplate: (posCount: number, negCount: number) => string;
};

const TOPIC_PATTERNS: TopicPattern[] = [
  {
    themeId: "guide_and_crew",
    topicLabel: "Guide & Crew Quality",
    topicRe: /\b(guide|guides|captain|pilot|driver|crew|naturalist|narrat\w*|staff|instructor)\b/i,
    positiveRe:
      /\b(knowledgeable|helpful|friendly|great|excellent|informative|professional|safe|fantastic|amazing|attentive|clear)\b/i,
    negativeRe:
      /\b(rude|unhelpful|rushed|hard to hear|inaudible|disorganized|late|unprofessional|poor|boring|ignored)\b/i,
    positiveTemplate: (n) =>
      `${n} recent reviews highlighted knowledgeable or attentive guides, pilots, or crew.`,
    negativeTemplate: (n) =>
      `${n} recent reviews raised concerns about guide communication, pacing, or crew organization.`,
    disagreementTemplate: (pos, neg) =>
      `Recent reviewers disagreed on guide and crew execution (${pos} positive vs. ${neg} critical).`,
  },
  {
    themeId: "timing_and_logistics",
    topicLabel: "Timing, Transfers & Port Return",
    topicRe:
      /\b(time|timing|schedule|pickup|drop[\s-]?off|shuttle|transfer|dock|ship|port|wait|waiting|delay\w*|on time|buffer|minutes|hours)\b/i,
    positiveRe:
      /\b(on time|smooth|easy|prompt|plenty of time|well[\s-]?organized|seamless|efficient|punctual|back to the ship)\b/i,
    negativeRe:
      /\b(late|delay\w*|rushed|short|not enough time|waited|long wait|confusing|missed|stressful|tight|crowded shuttle)\b/i,
    positiveTemplate: (n) =>
      `${n} recent reviews reported punctual pickup, smooth transfers, or comfortable return timing.`,
    negativeTemplate: (n) =>
      `${n} recent reviews noted rushed stop durations, transfer delays, or pickup friction.`,
    disagreementTemplate: (pos, neg) =>
      `Recent reviewers reported mixed experiences with transfer timing and stop duration (${pos} smooth vs. ${neg} rushed/delayed).`,
  },
  {
    themeId: "scenery_and_wildlife",
    topicLabel: "Scenery, Glacier & Wildlife Sightings",
    topicRe:
      /\b(whale\w*|glacier\w*|icefield|bear\w*|wildlife|views?|scenery|scenic|falls|nugget|canyon|red rocks)\b/i,
    positiveRe:
      /\b(breathtaking|stunning|amazing|incredible|saw|spotted|close|beautiful|spectacular|unforgettable|worth)\b/i,
    negativeRe:
      /\b(didn't see|did not see|no whales|distant|blocked|obstructed|disappointing|underwhelming|poor view)\b/i,
    positiveTemplate: (n) =>
      `${n} recent reviews described strong scenic visibility or wildlife/glacier viewing.`,
    negativeTemplate: (n) =>
      `${n} recent reviews reported limited wildlife sightings or obstructed/distant views.`,
    disagreementTemplate: (pos, neg) =>
      `Recent reviewers had differing scenic or wildlife outcomes (${pos} strong sightings/views vs. ${neg} limited visibility/sightings).`,
  },
  {
    themeId: "weather_and_conditions",
    topicLabel: "Weather & Operating Conditions",
    topicRe:
      /\b(weather|rain\w*|fog\w*|cloud\w*|wind\w*|cold|freezing|choppy|rough|seasick|visibility|cancel\w*)\b/i,
    positiveRe:
      /\b(clear|sunny|calm|prepared|warm gear|poncho|handled the weather|Smooth ride)\b/i,
    negativeRe:
      /\b(foggy|rained out|poor visibility|rough water|choppy|freezing|cold|canceled|cancelled|turbulent)\b/i,
    positiveTemplate: (n) =>
      `${n} recent reviews noted favorable weather or effective cold/rain gear preparation.`,
    negativeTemplate: (n) =>
      `${n} recent reviews cited rain, low fog ceilings, rough water, or weather disruptions impacting the experience.`,
    disagreementTemplate: (pos, neg) =>
      `Recent reviews reflect variable weather impact across departures (${pos} comfortable/clear vs. ${neg} impacted by rain, fog, or rough conditions).`,
  },
  {
    themeId: "crowds_and_value",
    topicLabel: "Group Size, Comfort & Value",
    topicRe:
      /\b(crowd\w*|packed|group size|small group|spacious|comfortable|price|worth the money|expensive|overpriced|value)\b/i,
    positiveRe:
      /\b(small group|spacious|comfortable|worth every penny|great value|not crowded|plenty of room)\b/i,
    negativeRe:
      /\b(crowded|overcrowded|packed|cramped|overpriced|too expensive|not worth|rip[\s-]?off)\b/i,
    positiveTemplate: (n) =>
      `${n} recent reviews praised comfortable group sizing, seating space, or overall value.`,
    negativeTemplate: (n) =>
      `${n} recent reviews criticized crowded conditions, cramped seating, or high cost relative to time spent.`,
    disagreementTemplate: (pos, neg) =>
      `Recent reviewers disagreed on crowd comfort and value for money (${pos} positive vs. ${neg} critical).`,
  },
];

const NEGATION_PREFIX_RE =
  /\b(?:not|never|no|neither|nor|wasn['’]?t|weren['’]?t|isn['’]?t|aren['’]?t|didn['’]?t|doesn['’]?t|don['’]?t|couldn['’]?t|wouldn['’]?t|hardly|barely|scarcely|far\s+from|anything\s+but|without|lack\s+of|lacked)\s+(?:\w+\s+){0,2}$/i;

function evaluateClauseSignals(
  clause: string,
  pattern: TopicPattern,
): { hasPos: boolean; hasNeg: boolean } {
  let hasPos = false;
  let hasNeg = false;

  const posGlobal = new RegExp(
    pattern.positiveRe.source,
    pattern.positiveRe.flags.includes("g")
      ? pattern.positiveRe.flags
      : `${pattern.positiveRe.flags}g`,
  );
  const negGlobal = new RegExp(
    pattern.negativeRe.source,
    pattern.negativeRe.flags.includes("g")
      ? pattern.negativeRe.flags
      : `${pattern.negativeRe.flags}g`,
  );

  for (const match of clause.matchAll(posGlobal)) {
    const matchedText = match[0] || "";
    const idx = match.index ?? 0;
    const prefix = clause.slice(Math.max(0, idx - 45), idx);
    const alreadyContainsNegation = /^\s*(?:not|no|never)\b/i.test(matchedText);
    if (!alreadyContainsNegation && NEGATION_PREFIX_RE.test(prefix)) {
      hasNeg = true;
    } else {
      hasPos = true;
    }
  }

  for (const match of clause.matchAll(negGlobal)) {
    const matchedText = match[0] || "";
    const idx = match.index ?? 0;
    const prefix = clause.slice(Math.max(0, idx - 45), idx);
    const alreadyContainsNegation = /^\s*(?:not|no|never|didn['’]?t|did\s+not)\b/i.test(
      matchedText,
    );
    if (!alreadyContainsNegation && NEGATION_PREFIX_RE.test(prefix)) {
      hasPos = true;
    } else {
      hasNeg = true;
    }
  }

  return { hasPos, hasNeg };
}

function classifyReviewPolarityForTopic(
  review: { rating: number | null; combinedText: string },
  pattern: TopicPattern,
): "positive" | "negative" | "both" | null {
  if (!pattern.topicRe.test(review.combinedText)) return null;

  const rawClauses = review.combinedText
    .split(/(?:[.!?;]+|\s+—\s+|\b(?:but|however|though|although|yet|whereas|while)\b)/i)
    .map((c) => c.trim())
    .filter(Boolean);

  const topicClauses = rawClauses.filter((c) => pattern.topicRe.test(c));
  const clausesToEvaluate = topicClauses.length > 0 ? topicClauses : [review.combinedText];

  let hasPosWords = false;
  let hasNegWords = false;
  for (const clause of clausesToEvaluate) {
    const res = evaluateClauseSignals(clause, pattern);
    if (res.hasPos) hasPosWords = true;
    if (res.hasNeg) hasNegWords = true;
  }

  // If topic clause only named the noun and the predicate was in an adjacent clause, check full text
  if (!hasPosWords && !hasNegWords && clausesToEvaluate !== rawClauses) {
    const fallback = evaluateClauseSignals(review.combinedText, pattern);
    hasPosWords = fallback.hasPos;
    hasNegWords = fallback.hasNeg;
  }

  if (hasPosWords && hasNegWords) {
    return "both";
  }
  if (hasNegWords) return "negative";
  if (hasPosWords) return "positive";
  if (review.rating != null) {
    if (review.rating >= 4) return "positive";
    if (review.rating <= 3) return "negative";
  }
  return null;
}

export type RealThirdPartyReviewCacheLookup = {
  checkStatus: "checked_ok" | "unavailable";
  reviews: ThirdPartyReviewInput[];
  lastRetrievedAt: string | null;
  cachePath: string | null;
  diagnosticReason: string;
};

/**
 * Connects the production review summarizer to the real synced third-party review cache
 * (`data/viator-reviews/{productCode}.json`). Does NOT invent sample reviews and does NOT
 * retry live API calls when credentials are missing or unauthorized.
 * When no synced review cache exists for a product, returns `checkStatus: "unavailable"`
 * so callers display "Recent reviews unavailable" rather than "No recent reviews found".
 */
export function loadPermittedThirdPartyReviewCacheForProduct(input: {
  targetOptionId: string;
  viatorProductCode?: string | null;
}): RealThirdPartyReviewCacheLookup {
  const code = input.viatorProductCode?.trim() || "";
  if (!code) {
    return {
      checkStatus: "unavailable",
      reviews: [],
      lastRetrievedAt: null,
      cachePath: null,
      diagnosticReason:
        "No permitted third-party review product code is mapped for this option (DCC does not collect first-party reviews).",
    };
  }

  const safeCode = code.replace(/[^a-zA-Z0-9_-]/g, "_");
  const relativeCachePath = `data/viator-reviews/${safeCode}.json`;

  if (typeof window !== "undefined" || typeof process === "undefined") {
    return {
      checkStatus: "unavailable",
      reviews: [],
      lastRetrievedAt: null,
      cachePath: relativeCachePath,
      diagnosticReason: `No synced third-party review cache loaded in browser context for ${safeCode}.`,
    };
  }

  try {
    const getBuiltin = (process as unknown as {
      getBuiltinModule?: (id: string) => unknown;
    }).getBuiltinModule;
    const nodeFs = getBuiltin
      ? (getBuiltin("fs") as typeof import("node:fs"))
      : undefined;
    const nodePath = getBuiltin
      ? (getBuiltin("path") as typeof import("node:path"))
      : undefined;

    if (!nodeFs || !nodePath) {
      return {
        checkStatus: "unavailable",
        reviews: [],
        lastRetrievedAt: null,
        cachePath: relativeCachePath,
        diagnosticReason: `Filesystem review cache reader unavailable in this runtime for ${safeCode}.`,
      };
    }

    const cachePath = nodePath.join(process.cwd(), "data", "viator-reviews", `${safeCode}.json`);
    if (!nodeFs.existsSync(cachePath)) {
      return {
        checkStatus: "unavailable",
        reviews: [],
        lastRetrievedAt: null,
        cachePath,
        diagnosticReason: `No synced third-party review cache file at data/viator-reviews/${safeCode}.json (upstream Viator Partner API /reviews/product authorization is currently pending; DCC does not substitute fabricated reviews or retry with an invalid key).`,
      };
    }

    const stats = nodeFs.statSync(cachePath);
    const parsed = JSON.parse(nodeFs.readFileSync(cachePath, "utf8"));
    const rawRows: Array<Record<string, unknown>> = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.reviews)
        ? parsed.reviews
        : [];
    const mapped: ThirdPartyReviewInput[] = rawRows.map((row) => ({
      reviewId: String(row.reviewId || ""),
      productCode: input.targetOptionId,
      provider: typeof row.provider === "string" && row.provider ? row.provider : "Viator",
      publishedDate: typeof row.publishedDate === "string" ? row.publishedDate : null,
      rating: typeof row.rating === "number" ? row.rating : null,
      title: typeof row.title === "string" ? row.title : null,
      text: typeof row.text === "string" ? row.text : null,
      userName: typeof row.userName === "string" ? row.userName : null,
      providerVerified:
        String(row.provider || "viator").toLowerCase() === "viator",
    }));

    return {
      checkStatus: "checked_ok",
      reviews: mapped,
      lastRetrievedAt: stats.mtime.toISOString(),
      cachePath,
      diagnosticReason: `Loaded ${mapped.length} cached third-party review record(s) from data/viator-reviews/${safeCode}.json.`,
    };
  } catch {
    return {
      checkStatus: "unavailable",
      reviews: [],
      lastRetrievedAt: null,
      cachePath: relativeCachePath,
      diagnosticReason: `Failed to read third-party review cache for ${safeCode}.`,
    };
  }
}

/**
 * Produces an honest, traceable summary of recent third-party reviews within a rolling
 * window (default 180 days). Never invents review claims from product titles, categories,
 * aggregate ratings, or undated entries, and never silently widens the date window.
 */
export function summarizeRecentReviews(
  options: RecentReviewSummaryOptions,
): RecentReviewSummaryResult {
  const windowDays =
    typeof options.windowDays === "number" && options.windowDays > 0
      ? Math.floor(options.windowDays)
      : 180;
  const minEligibleReviewsForSummary =
    typeof options.minEligibleReviewsForSummary === "number" &&
    options.minEligibleReviewsForSummary >= 1
      ? Math.floor(options.minEligibleReviewsForSummary)
      : 3;
  const minReviewsPerTheme =
    typeof options.minReviewsPerTheme === "number" &&
    options.minReviewsPerTheme >= 1
      ? Math.floor(options.minReviewsPerTheme)
      : 2;

  const { isoDate: windowEndDate, endOfDayMs: windowEndMs } =
    normalizeReferenceDate(options.referenceDate);
  const windowStartMs = windowEndMs - windowDays * 24 * 60 * 60 * 1000;
  const windowStartDate = new Date(windowStartMs).toISOString().slice(0, 10);

  const checkStatus =
    options.checkStatus ??
    (Array.isArray(options.reviews) ? "checked_ok" : "unavailable");

  if (checkStatus !== "checked_ok" || !Array.isArray(options.reviews)) {
    return {
      state: "unavailable",
      statusHeadline: "Recent reviews unavailable",
      statusDetail:
        "Third-party review text and publication dates could not be retrieved or are not integrated for this option. DCC does not fabricate review summaries from product titles, categories, or aggregate star ratings.",
      firstPartyCollectionNotice: FIRST_PARTY_NOTICE,
      authorityNotice: AUTHORITY_NOTICE,
      windowDays,
      windowStartDate,
      windowEndDate,
      sources: [],
      coveredDateRange: null,
      totalProvidedCount: 0,
      productMatchedCount: 0,
      excludedWrongProductCount: 0,
      deduplicatedCount: 0,
      excludedUndatedCount: 0,
      excludedOutsideWindowCount: 0,
      eligibleRecentCount: 0,
      lastRetrievedAt: options.lastRetrievedAt ?? options.retrievedAt ?? null,
      samplingLimitations:
        "No third-party review feed was available at check time.",
      providerVerificationSummary: "Not applicable (reviews unavailable).",
      positives: [],
      negatives: [],
      disagreements: [],
      eligibleReviews: [],
    };
  }

  const resolvedLastRetrievedAt = options.lastRetrievedAt ?? options.retrievedAt ?? null;
  const targetProductCode = options.productCode?.trim().toLowerCase() || null;
  const totalProvidedCount = options.reviews.length;

  let productMatchedCount = 0;
  let excludedWrongProductCount = 0;
  let deduplicatedCount = 0;
  let excludedUndatedCount = 0;
  let excludedOutsideWindowCount = 0;

  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();
  const eligibleInternal: Array<{
    reviewId: string;
    publishedDate: string;
    publishedMs: number;
    rating: number | null;
    combinedText: string;
    excerpt: string;
    provider: string;
    providerVerified: boolean;
  }> = [];

  for (const raw of options.reviews) {
    if (!raw || typeof raw !== "object") continue;

    // 1. Match review to the correct product when productCode is specified
    if (targetProductCode && raw.productCode) {
      if (raw.productCode.trim().toLowerCase() !== targetProductCode) {
        excludedWrongProductCount++;
        continue;
      }
    }
    productMatchedCount++;

    // 2. Filter strictly by publication date (never sync date); exclude undated reviews
    const pub = parseStrictPublicationDate(raw.publishedDate);
    if (!pub) {
      excludedUndatedCount++;
      continue;
    }

    // 3. Enforce rolling window [windowStartDate, windowEndDate] without widening
    if (pub.timestampMs < windowStartMs || pub.timestampMs > windowEndMs) {
      excludedOutsideWindowCount++;
      continue;
    }

    const bodyText = [raw.title?.trim(), raw.text?.trim()]
      .filter(Boolean)
      .join(" — ")
      .trim();
    if (!bodyText) {
      excludedUndatedCount++;
      continue;
    }

    // 4. Deduplicate by reviewId and normalized content + publication date
    const cleanId = String(raw.reviewId || "").trim();
    const contentSig = `${pub.isoDate}::${bodyText.toLowerCase().replace(/\s+/g, " ")}`;
    if ((cleanId && seenIds.has(cleanId)) || seenSignatures.has(contentSig)) {
      deduplicatedCount++;
      continue;
    }
    if (cleanId) seenIds.add(cleanId);
    seenSignatures.add(contentSig);

    const providerLabel = (raw.provider || raw.source || "Third-party provider").trim();
    eligibleInternal.push({
      reviewId: cleanId || `review-${eligibleInternal.length + 1}`,
      publishedDate: pub.isoDate,
      publishedMs: pub.timestampMs,
      rating: typeof raw.rating === "number" && Number.isFinite(raw.rating) ? raw.rating : null,
      combinedText: bodyText,
      excerpt: truncateExcerpt(bodyText),
      provider: providerLabel,
      providerVerified: raw.providerVerified === true,
    });
  }

  eligibleInternal.sort((a, b) => b.publishedMs - a.publishedMs);

  const sources = Array.from(new Set(eligibleInternal.map((r) => r.provider)));
  const coveredDateRange =
    eligibleInternal.length > 0
      ? {
          earliest: eligibleInternal[eligibleInternal.length - 1].publishedDate,
          latest: eligibleInternal[0].publishedDate,
        }
      : null;

  const eligibleReviews: RecentReviewExcerpt[] = eligibleInternal.map((r) => ({
    reviewId: r.reviewId,
    publishedDate: r.publishedDate,
    rating: r.rating,
    excerpt: r.excerpt,
    provider: r.provider,
    providerVerified: r.providerVerified,
  }));

  const verifiedCount = eligibleReviews.filter((r) => r.providerVerified).length;
  const providerVerificationSummary =
    eligibleReviews.length === 0
      ? "0 eligible recent reviews."
      : verifiedCount === eligibleReviews.length
        ? `Provider-established verified booking status on all ${verifiedCount} analyzed reviews.`
        : verifiedCount > 0
          ? `${verifiedCount} of ${eligibleReviews.length} analyzed reviews carry provider-verified status; remaining reviews do not have provider verification metadata.`
          : "Provider does not establish verified-booking status on these reviews; treated as unverified third-party submissions.";

  const totalCatalogCount = options.totalProviderReviewCount ?? null;
  const samplingLimitations = [
    `Rolling ${windowDays}-day publication window (${windowStartDate} to ${windowEndDate}).`,
    `Inspected ${totalProvidedCount} retrieved review record(s): ${eligibleReviews.length} eligible within window, ${excludedOutsideWindowCount} excluded as older than ${windowDays} days, ${excludedUndatedCount} excluded as undated/empty, ${deduplicatedCount} duplicate(s) removed${excludedWrongProductCount > 0 ? `, ${excludedWrongProductCount} mismatched product record(s) excluded` : ""}.`,
    totalCatalogCount && totalCatalogCount > totalProvidedCount
      ? `Provider reports ${totalCatalogCount} lifetime reviews across all years; only the retrieved sample of ${totalProvidedCount} reviews was available for date-filtered analysis.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  // State 1: 0 eligible recent reviews after a successful check
  if (eligibleReviews.length === 0) {
    return {
      state: "no_recent_reviews",
      statusHeadline: "No recent reviews found",
      statusDetail: `Review check succeeded, but 0 dated third-party reviews were published within the rolling ${windowDays}-day window (${windowStartDate} to ${windowEndDate}).${excludedOutsideWindowCount > 0 ? ` ${excludedOutsideWindowCount} older review(s) outside the ${windowDays}-day window were excluded rather than widening the window.` : ""}`,
      firstPartyCollectionNotice: FIRST_PARTY_NOTICE,
      authorityNotice: AUTHORITY_NOTICE,
      windowDays,
      windowStartDate,
      windowEndDate,
      sources,
      coveredDateRange: null,
      totalProvidedCount,
      productMatchedCount,
      excludedWrongProductCount,
      deduplicatedCount,
      excludedUndatedCount,
      excludedOutsideWindowCount,
      eligibleRecentCount: 0,
      lastRetrievedAt: resolvedLastRetrievedAt,
      samplingLimitations,
      providerVerificationSummary,
      positives: [],
      negatives: [],
      disagreements: [],
      eligibleReviews: [],
    };
  }

  // State 2: Sparse evidence (< minEligibleReviewsForSummary, default 3)
  if (eligibleReviews.length < minEligibleReviewsForSummary) {
    return {
      state: "limited_recent_data",
      statusHeadline: `Limited recent review data (${eligibleReviews.length} of ${minEligibleReviewsForSummary} required for thematic summary)`,
      statusDetail: `Only ${eligibleReviews.length} dated third-party review(s) were published between ${windowStartDate} and ${windowEndDate}. DCC requires at least ${minEligibleReviewsForSummary} recent reviews and ${minReviewsPerTheme} supporting reviews per theme before generating a thematic summary.`,
      firstPartyCollectionNotice: FIRST_PARTY_NOTICE,
      authorityNotice: AUTHORITY_NOTICE,
      windowDays,
      windowStartDate,
      windowEndDate,
      sources,
      coveredDateRange,
      totalProvidedCount,
      productMatchedCount,
      excludedWrongProductCount,
      deduplicatedCount,
      excludedUndatedCount,
      excludedOutsideWindowCount,
      eligibleRecentCount: eligibleReviews.length,
      lastRetrievedAt: resolvedLastRetrievedAt,
      samplingLimitations,
      providerVerificationSummary,
      positives: [],
      negatives: [],
      disagreements: [],
      eligibleReviews,
    };
  }

  // State 3: >= 3 eligible recent reviews -> evaluate themes requiring >= 2 distinct supporting reviews
  const positives: RecentReviewThemeStatement[] = [];
  const negatives: RecentReviewThemeStatement[] = [];
  const disagreements: RecentReviewThemeStatement[] = [];

  for (const pattern of TOPIC_PATTERNS) {
    const posMatches: RecentReviewExcerpt[] = [];
    const negMatches: RecentReviewExcerpt[] = [];

    for (let i = 0; i < eligibleInternal.length; i++) {
      const rev = eligibleInternal[i];
      const excerptObj = eligibleReviews[i];
      const pol = classifyReviewPolarityForTopic(rev, pattern);
      if (pol === "positive") {
        posMatches.push(excerptObj);
      } else if (pol === "negative") {
        negMatches.push(excerptObj);
      } else if (pol === "both") {
        posMatches.push(excerptObj);
        negMatches.push(excerptObj);
      }
    }

    const distinctIds = new Set([
      ...posMatches.map((r) => r.reviewId),
      ...negMatches.map((r) => r.reviewId),
    ]);

    if (
      posMatches.length >= 1 &&
      negMatches.length >= 1 &&
      distinctIds.size >= minReviewsPerTheme
    ) {
      const combinedExcerpts = [
        ...posMatches,
        ...negMatches.filter(
          (n) => !posMatches.some((p) => p.reviewId === n.reviewId),
        ),
      ];
      disagreements.push({
        themeId: pattern.themeId,
        topicLabel: pattern.topicLabel,
        polarity: "disagreement",
        statement: pattern.disagreementTemplate(posMatches.length, negMatches.length),
        supportingReviewIds: combinedExcerpts.map((r) => r.reviewId),
        supportingExcerpts: combinedExcerpts,
      });
    }

    if (posMatches.length >= minReviewsPerTheme) {
      positives.push({
        themeId: pattern.themeId,
        topicLabel: pattern.topicLabel,
        polarity: "positive",
        statement: pattern.positiveTemplate(posMatches.length),
        supportingReviewIds: posMatches.map((r) => r.reviewId),
        supportingExcerpts: posMatches,
      });
    }

    if (negMatches.length >= minReviewsPerTheme) {
      negatives.push({
        themeId: pattern.themeId,
        topicLabel: pattern.topicLabel,
        polarity: "negative",
        statement: pattern.negativeTemplate(negMatches.length),
        supportingReviewIds: negMatches.map((r) => r.reviewId),
        supportingExcerpts: negMatches,
      });
    }
  }

  const totalThemes = positives.length + negatives.length + disagreements.length;
  if (totalThemes === 0) {
    return {
      state: "limited_recent_data",
      statusHeadline: `Recent reviews analyzed (${eligibleReviews.length} in last ${windowDays} days) — no recurring multi-review theme`,
      statusDetail: `${eligibleReviews.length} recent third-party reviews were analyzed between ${windowStartDate} and ${windowEndDate}, but no single topic was cited by at least ${minReviewsPerTheme} distinct reviews. Individual dated excerpts are shown below without synthetic generalization.`,
      firstPartyCollectionNotice: FIRST_PARTY_NOTICE,
      authorityNotice: AUTHORITY_NOTICE,
      windowDays,
      windowStartDate,
      windowEndDate,
      sources,
      coveredDateRange,
      totalProvidedCount,
      productMatchedCount,
      excludedWrongProductCount,
      deduplicatedCount,
      excludedUndatedCount,
      excludedOutsideWindowCount,
      eligibleRecentCount: eligibleReviews.length,
      lastRetrievedAt: resolvedLastRetrievedAt,
      samplingLimitations,
      providerVerificationSummary,
      positives: [],
      negatives: [],
      disagreements: [],
      eligibleReviews,
    };
  }

  return {
    state: "thematic_summary",
    statusHeadline: `Recent third-party review summary (${eligibleReviews.length} reviews in last ${windowDays} days)`,
    statusDetail: `Synthesized from ${eligibleReviews.length} deduplicated third-party reviews published between ${coveredDateRange?.earliest} and ${coveredDateRange?.latest} (rolling ${windowDays}-day window). Every theme below is supported by at least ${minReviewsPerTheme} distinct recent reviews.`,
    firstPartyCollectionNotice: FIRST_PARTY_NOTICE,
    authorityNotice: AUTHORITY_NOTICE,
    windowDays,
    windowStartDate,
    windowEndDate,
    sources,
    coveredDateRange,
    totalProvidedCount,
    productMatchedCount,
    excludedWrongProductCount,
    deduplicatedCount,
    excludedUndatedCount,
    excludedOutsideWindowCount,
    eligibleRecentCount: eligibleReviews.length,
    lastRetrievedAt: resolvedLastRetrievedAt,
    samplingLimitations,
    providerVerificationSummary,
    positives,
    negatives,
    disagreements,
    eligibleReviews,
  };
}

/**
 * Generates independently supported planning notes from explicit operator schedule/duration
 * metadata. Always labeled as "Planning Advice" — never presented as guest reviews.
 */
export function deriveSupportedPlanningNotes(input: {
  durationMinutes?: number | null;
  pickupIncluded?: boolean | null;
  freeCancellation?: boolean | null;
}): SupportedPlanningNote[] {
  const notes: SupportedPlanningNote[] = [];

  if (typeof input.durationMinutes === "number" && input.durationMinutes > 0) {
    if (input.durationMinutes >= 300) {
      notes.push({
        id: "planning-duration-full",
        label: "Planning Advice",
        basis: `Operator stated duration (${Math.round((input.durationMinutes / 60) * 10) / 10} hours / ${input.durationMinutes} minutes)`,
        note: "Half-day or full-day time commitment; verify that check-in, transfer time, and return buffer fit your ship all-aboard or evening schedule.",
      });
    } else if (input.durationMinutes <= 150) {
      notes.push({
        id: "planning-duration-short",
        label: "Planning Advice",
        basis: `Operator stated duration (${input.durationMinutes} minutes)`,
        note: "Shorter activity duration that can fit narrower port windows once dock-to-meeting-point transfers and return buffers are accounted for.",
      });
    }
  }

  if (input.pickupIncluded === true) {
    notes.push({
      id: "planning-pickup-included",
      label: "Planning Advice",
      basis: "Operator pickup specification",
      note: "Includes designated pickup/transfer coordination; confirm your exact dock kiosk or hotel pickup time on your confirmation voucher.",
    });
  } else if (input.pickupIncluded === false) {
    notes.push({
      id: "planning-meeting-point",
      label: "Planning Advice",
      basis: "Operator meeting-point specification",
      note: "Requires independent transit to the meeting point; add local transfer time and dock shuttle slack to your schedule calculation.",
    });
  }

  if (input.freeCancellation === true) {
    notes.push({
      id: "planning-cancellation-terms",
      label: "Planning Advice",
      basis: "Operator cancellation policy metadata",
      note: "Advertises a free cancellation cutoff window; verify the exact hour cutoff in local destination time before booking.",
    });
  } else if (input.freeCancellation === false) {
    notes.push({
      id: "planning-nonrefundable-terms",
      label: "Planning Advice",
      basis: "Operator cancellation policy metadata",
      note: "Non-refundable or restricted cancellation terms apply; verify weather-cancellation refund provisions before purchase.",
    });
  }

  return notes;
}

/**
 * Legacy-compatible helper inspected under Governing Product Direction Section 2 & 6.
 * NEVER generates review-like statements from product titles, categories, aggregate ratings,
 * or canned templates. Returns thematic statements ONLY when backed by >= 3 eligible recent
 * third-party reviews within the rolling 180-day window.
 */
export function summarizeGuestFeedback(input: GuestFeedbackInput): string[] {
  if (!input.reviews || input.reviews.length === 0) {
    return [];
  }
  const summary = summarizeRecentReviews({
    productCode: input.productCode,
    reviews: input.reviews,
    checkStatus: input.checkStatus ?? "checked_ok",
    lastRetrievedAt: input.lastRetrievedAt,
    windowDays: input.windowDays ?? 180,
    referenceDate: input.referenceDate,
    totalProviderReviewCount: input.reviewCount,
  });

  if (summary.state !== "thematic_summary") {
    return [];
  }

  return [
    ...summary.positives.map((p) => p.statement),
    ...summary.negatives.map((n) => n.statement),
    ...summary.disagreements.map((d) => d.statement),
  ];
}
