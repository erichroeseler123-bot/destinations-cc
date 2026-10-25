import {
  deriveSupportedPlanningNotes,
  summarizeRecentReviews,
  type ThirdPartyReviewInput,
} from "@/lib/dcc/guestFeedback";

type TravelerTakeawaysProps = {
  title?: string;
  description?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  durationMinutes?: number | null;
  durationText?: string | null;
  productCode?: string | null;
  reviews?: ThirdPartyReviewInput[] | null;
  checkStatus?: "checked_ok" | "unavailable" | "not_checked";
  lastRetrievedAt?: string | null;
  retrievedAt?: string | null;
  windowDays?: number;
  referenceDate?: Date | string;
  pickupIncluded?: boolean | null;
  freeCancellation?: boolean | null;
  summary?: string[] | null;
  compact?: boolean;
};

export default function TravelerTakeaways(props: TravelerTakeawaysProps) {
  if (props.compact) {
    const items = (props.summary || []).filter(Boolean);
    const planningNotes = deriveSupportedPlanningNotes({
      durationMinutes: props.durationMinutes,
      pickupIncluded: props.pickupIncluded,
      freeCancellation: props.freeCancellation,
    });
    if (items.length === 0 && planningNotes.length === 0) {
      return null;
    }
    return (
      <div className="rounded-2xl border border-white/10 bg-black/25 p-3.5 space-y-2 text-xs">
        {items.length > 0 && (
          <div>
            <p className="font-bold uppercase tracking-wider text-cyan-300 text-[11px]">
              Recent Third-Party Review Summary (180d)
            </p>
            <ul className="mt-1 space-y-1 text-zinc-200">
              {items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        )}
        {planningNotes.length > 0 && (
          <div>
            <p className="font-bold uppercase tracking-wider text-indigo-300 text-[11px]">
              Planning Advice ({planningNotes[0].basis})
            </p>
            <p className="mt-1 text-zinc-300">{planningNotes[0].note}</p>
          </div>
        )}
      </div>
    );
  }

  const effectiveCheckStatus =
    props.checkStatus ??
    (Array.isArray(props.reviews) && props.reviews.length > 0
      ? "checked_ok"
      : "unavailable");

  const summary = summarizeRecentReviews({
    productCode: props.productCode,
    reviews: props.reviews,
    checkStatus: effectiveCheckStatus,
    lastRetrievedAt: props.lastRetrievedAt,
    windowDays: props.windowDays ?? 180,
    referenceDate: props.referenceDate,
    totalProviderReviewCount: props.reviewCount,
  });

  const planningNotes = deriveSupportedPlanningNotes({
    durationMinutes: props.durationMinutes,
    pickupIncluded: props.pickupIncluded,
    freeCancellation: props.freeCancellation,
  });

  const stateBadgeStyle =
    summary.state === "thematic_summary"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
      : summary.state === "limited_recent_data"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
        : summary.state === "no_recent_reviews"
          ? "border-zinc-500/40 bg-zinc-800 text-zinc-200"
          : "border-rose-500/40 bg-rose-500/10 text-rose-200";

  return (
    <section
      aria-label="Recent third-party review summary and planning notes"
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            Third-Party Review Evidence ({summary.windowDays}-Day Rolling Window)
          </p>
          <h2 className="text-xl font-bold text-white">
            {summary.statusHeadline}
          </h2>
          <p className="text-xs text-zinc-400">
            {summary.firstPartyCollectionNotice} {summary.authorityNotice}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${stateBadgeStyle}`}
        >
          {summary.state === "thematic_summary"
            ? "Recent Thematic Summary"
            : summary.state === "limited_recent_data"
              ? "Limited Recent Data"
              : summary.state === "no_recent_reviews"
                ? "No Recent Reviews Found"
                : "Recent Reviews Unavailable"}
        </span>
      </div>

      <p className="text-sm text-zinc-300 leading-relaxed">
        {summary.statusDetail}
      </p>

      {/* Provenance & Sampling Metadata Grid */}
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <dt className="font-bold uppercase tracking-wider text-zinc-400">
            Sources
          </dt>
          <dd className="mt-1 text-zinc-200 font-medium">
            {summary.sources.length > 0
              ? summary.sources.join(", ")
              : "No recent review sources"}
          </dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <dt className="font-bold uppercase tracking-wider text-zinc-400">
            Covered Publication Dates
          </dt>
          <dd className="mt-1 text-zinc-200 font-mono">
            {summary.coveredDateRange
              ? `${summary.coveredDateRange.earliest} → ${summary.coveredDateRange.latest}`
              : `Window: ${summary.windowStartDate} → ${summary.windowEndDate}`}
          </dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <dt className="font-bold uppercase tracking-wider text-zinc-400">
            Reviews Analyzed
          </dt>
          <dd className="mt-1 text-zinc-200 font-medium">
            {summary.eligibleRecentCount} eligible in last {summary.windowDays}d
            ({summary.totalProvidedCount} retrieved)
          </dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <dt className="font-bold uppercase tracking-wider text-zinc-400">
            Last Retrieval & Verification
          </dt>
          <dd className="mt-1 text-zinc-200">
            {summary.lastRetrievedAt
              ? `Retrieved ${summary.lastRetrievedAt}`
              : "Retrieval timestamp not recorded"}
          </dd>
        </div>
      </dl>

      {/* Thematic Statements (only when state === "thematic_summary") */}
      {summary.state === "thematic_summary" && (
        <div className="space-y-4">
          {summary.positives.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Supported Positives (≥2 recent reviews per theme)
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {summary.positives.map((theme) => (
                  <div
                    key={`pos-${theme.themeId}`}
                    className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-200">
                        {theme.topicLabel}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-300/80">
                        Refs: {theme.supportingReviewIds.join(", ")}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-100">{theme.statement}</p>
                    <ul className="space-y-1 pt-1 border-t border-white/10 text-xs text-zinc-300">
                      {theme.supportingExcerpts.slice(0, 3).map((ex) => (
                        <li key={ex.reviewId}>
                          <span className="font-mono text-zinc-400">
                            [{ex.publishedDate} • {ex.provider}
                            {ex.providerVerified ? " • Provider-verified" : ""}]
                          </span>{" "}
                          &ldquo;{ex.excerpt}&rdquo;
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.negatives.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                Supported Negatives & Friction Points (≥2 recent reviews per theme)
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {summary.negatives.map((theme) => (
                  <div
                    key={`neg-${theme.themeId}`}
                    className="rounded-2xl border border-rose-500/25 bg-rose-950/20 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-rose-200">
                        {theme.topicLabel}
                      </span>
                      <span className="text-[11px] font-mono text-rose-300/80">
                        Refs: {theme.supportingReviewIds.join(", ")}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-100">{theme.statement}</p>
                    <ul className="space-y-1 pt-1 border-t border-white/10 text-xs text-zinc-300">
                      {theme.supportingExcerpts.slice(0, 3).map((ex) => (
                        <li key={ex.reviewId}>
                          <span className="font-mono text-zinc-400">
                            [{ex.publishedDate} • {ex.provider}
                            {ex.providerVerified ? " • Provider-verified" : ""}]
                          </span>{" "}
                          &ldquo;{ex.excerpt}&rdquo;
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.disagreements.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Reviewer Disagreements & Mixed Outcomes
              </h3>
              <div className="grid gap-3">
                {summary.disagreements.map((theme) => (
                  <div
                    key={`dis-${theme.themeId}`}
                    className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-200">
                        {theme.topicLabel}
                      </span>
                      <span className="text-[11px] font-mono text-amber-300/80">
                        Refs: {theme.supportingReviewIds.join(", ")}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-100">{theme.statement}</p>
                    <ul className="space-y-1 pt-1 border-t border-white/10 text-xs text-zinc-300">
                      {theme.supportingExcerpts.slice(0, 4).map((ex) => (
                        <li key={ex.reviewId}>
                          <span className="font-mono text-zinc-400">
                            [{ex.publishedDate} • {ex.provider}
                            {ex.rating != null ? ` • ${ex.rating}/5` : ""}]
                          </span>{" "}
                          &ldquo;{ex.excerpt}&rdquo;
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Individual Dated Excerpts when in Limited Data state */}
      {summary.state === "limited_recent_data" &&
        summary.eligibleReviews.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Individual Eligible Recent Reviews (Insufficient Sample for Thematic Generalization)
            </h3>
            <ul className="grid gap-2.5 md:grid-cols-2">
              {summary.eligibleReviews.map((rev) => (
                <li
                  key={rev.reviewId}
                  className="rounded-2xl border border-white/10 bg-black/25 p-3.5 text-xs text-zinc-200 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>
                      {rev.publishedDate} • {rev.provider}
                    </span>
                    <span>
                      {rev.rating != null ? `${rev.rating}/5` : "Unrated"} • ID:{" "}
                      {rev.reviewId}
                    </span>
                  </div>
                  <p className="leading-relaxed">&ldquo;{rev.excerpt}&rdquo;</p>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Sampling & Verification Limitations Footer */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5 text-xs text-zinc-400 space-y-1">
        <p>
          <strong className="text-zinc-300">Sampling & Coverage Note:</strong>{" "}
          {summary.samplingLimitations}
        </p>
        <p>
          <strong className="text-zinc-300">Verification Status:</strong>{" "}
          {summary.providerVerificationSummary}
        </p>
      </div>

      {/* Separate, Explicitly Labeled Planning Advice */}
      {planningNotes.length > 0 && (
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Planning Advice (From Operator Schedule Metadata — Not Guest Reviews)
            </span>
          </div>
          <ul className="space-y-2 text-xs text-zinc-200">
            {planningNotes.map((item) => (
              <li key={item.id}>
                <strong className="text-indigo-200">{item.basis}:</strong>{" "}
                {item.note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
