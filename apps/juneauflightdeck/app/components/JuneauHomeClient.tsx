"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import DecisionWidgetCard from "./DecisionWidgetCard";
import CertaintyBlock from "./decision/CertaintyBlock";
import GuidedFlowController from "./decision/GuidedFlowController";
import GuidedResults from "./decision/GuidedResults";
import { buildGuidedHref } from "../../lib/session/decisionMode";
import { trackWidgetEvent, type DecisionWidget } from "../../lib/telemetry";
import type { HandoffContext, InitialUiState } from "../../lib/handoff/types";
import type { DecisionMode } from "../../types/session";

type ResolutionDebug = {
  downgraded: boolean;
  winners: Array<{
    field: string;
    confidence: number;
    ruleId: string;
    reason: string;
  }>;
};

type ViatorProduct = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  priceLabel: string | null;
  imageUrl: string | null;
  supplierName: string | null;
  bookHref: string;
};

type JuneauProductsResponse = {
  generatedAt: string;
  selectedDate?: string | null;
  signals: { headline?: string };
  browseHref?: string;
  products: ViatorProduct[];
};

const DCC_ORIGIN = process.env.NEXT_PUBLIC_DCC_ORIGIN || "https://www.destinationcommandcenter.com";
const PAGE_URL = "https://juneauflightdeck.com/";
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1508264165352-258a6f82b6f4?auto=format&fit=crop&w=1400&q=80";
const HANDOFF_STORAGE_KEY = "dcc_handoff_id";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function inferProductSlug(product: ViatorProduct) {
  const title = `${product.title} ${product.description || ""}`.toLowerCase();
  if (/\bdog.?sled\b/.test(title)) return "dogsled-combo";
  if (/\bicefield\b/.test(title)) return "icefield-explorer";
  if (/\bglacier\b.*\blanding\b|\blanding\b.*\bglacier\b/.test(title)) return "glacier-landing";
  return slugify(product.title || product.id || "tour");
}

function prioritizeProducts(products: ViatorProduct[], initialUiState: InitialUiState) {
  const priority = new Map(
    (initialUiState.prioritizedCardSlugs || []).map((slug, index) => [slug, index]),
  );

  return [...products].sort((a, b) => {
    const aRank = priority.get(inferProductSlug(a)) ?? 999;
    const bRank = priority.get(inferProductSlug(b)) ?? 999;
    if (aRank !== bRank) return aRank - bRank;
    return a.title.localeCompare(b.title);
  });
}

function buildSeasonBounds(year: number) {
  return {
    min: `${year}-05-01`,
    max: `${year}-09-30`,
  };
}

function formatDuration(durationMinutes: number | null) {
  if (!Number.isFinite(durationMinutes) || durationMinutes === null || durationMinutes <= 0) return null;
  if (durationMinutes % 60 === 0) return `${durationMinutes / 60} hr`;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (!hours) return `${minutes} min`;
  return `${hours} hr ${minutes} min`;
}

function formatUpdatedLabel(generatedAt: string) {
  if (!generatedAt) return "Live now";
  const parsed = new Date(generatedAt);
  if (Number.isNaN(parsed.getTime())) return "Live now";
  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function buildTrackedHref(href: string, handoffId: string) {
  if (!handoffId) return href;

  try {
    const url = new URL(href, PAGE_URL);
    url.searchParams.set("dcc_handoff_id", handoffId);
    return url.toString();
  } catch {
    return href;
  }
}

function buildPromiseLine(product: ViatorProduct) {
  const description = (product.description || "").trim();
  if (description) return description;
  return "Open the live listing for your cruise day, confirm timing and inclusions, and book the option that feels right.";
}

function buildProofPoints(product: ViatorProduct, selectedDate: string | null | undefined, index: number) {
  const points: string[] = [];
  if (selectedDate) points.push(`Showing for ${selectedDate}`);
  if ((product.title || "").toLowerCase().includes("glacier")) points.push("Iconic glacier-flight route");
  if ((product.title || "").toLowerCase().includes("landing")) points.push("Landing-style experience");
  if (index === 0) points.push("Good first option to check");
  return points.slice(0, 3);
}

function buildFitTags(product: ViatorProduct, index: number) {
  const tags = ["Premium"];
  const title = (product.title || "").toLowerCase();
  if (index === 0) tags.push("First-time");
  if (title.includes("glacier")) tags.push("Signature Juneau");
  if (title.includes("landing")) tags.push("Best-view");
  if (title.includes("dog")) tags.push("Adventure");
  return Array.from(new Set(tags)).slice(0, 3);
}

function buildAvailabilityLabel(selectedDate: string | null | undefined, index: number) {
  if (!selectedDate) return "Choose a cruise day first";
  if (index === 0) return "Popular dates can tighten first";
  if (index === 1) return "Worth checking if the first option is not ideal";
  return "Another option to compare for your day";
}

function buildDecisionWidgets(
  products: ViatorProduct[],
  handoffId: string,
  selectedDate: string | null | undefined,
): DecisionWidget[] {
  return products.slice(0, 3).map((product, index) => {
    const variant = index === 0 ? "primary" : index === 1 ? "backup" : "edge";
    const recommendationLabel =
      index === 0
        ? "Start here"
        : index === 1
          ? "Also worth a look"
          : "Another option";

    return {
      id: `jfd-${product.id}-${variant}`,
      corridor: "wta",
      productId: product.id,
      variant,
      intent: "trust",
      recommendationLabel,
      title: product.title,
      promiseLine: buildPromiseLine(product),
      proofPoints: buildProofPoints(product, selectedDate, index),
      fitTags: buildFitTags(product, index),
      priceFrom: product.priceLabel || undefined,
      durationLabel: formatDuration(product.durationMinutes) || undefined,
      availabilityLabel: buildAvailabilityLabel(selectedDate, index),
      availabilitySeverity: index === 0 ? "high" : index === 1 ? "medium" : "low",
      imageUrl: product.imageUrl || undefined,
      action: "external_booking",
      ctaLabel: "Check availability",
      href: buildTrackedHref(product.bookHref, handoffId),
      position: index + 1,
      prefill: {
        date: selectedDate || undefined,
        priority: "premium",
        travelerType: index === 0 ? "first-time" : "short-port",
      },
    };
  });
}

export default function JuneauHomeClient({
  initialDate,
  initialQuery,
  initialWidgetMode,
  initialHandoffId,
  initialData,
  initialHandoffContext,
  initialUiState,
  initialDecisionMode,
  initialResolutionDebug,
  seasonYear,
}: {
  initialDate: string;
  initialQuery: string;
  initialWidgetMode: boolean;
  initialHandoffId: string;
  initialData: JuneauProductsResponse | null;
  initialHandoffContext: HandoffContext;
  initialUiState: InitialUiState;
  initialDecisionMode: DecisionMode;
  initialResolutionDebug: ResolutionDebug;
  seasonYear: number;
}) {
  const bounds = buildSeasonBounds(seasonYear);
  const [date, setDate] = useState(initialUiState.prefilledDate || initialDate);
  const [query, setQuery] = useState(initialQuery);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [data, setData] = useState<JuneauProductsResponse>({
    generatedAt: initialData?.generatedAt || "",
    selectedDate: initialData?.selectedDate || initialDate || null,
    signals: initialData?.signals || {},
    browseHref: initialData?.browseHref,
    products: initialData?.products || [],
  });
  const [loading, setLoading] = useState(Boolean(initialDate) && !initialData);
  const [handoffId] = useState(() => {
    if (initialHandoffId) return initialHandoffId;
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem(HANDOFF_STORAGE_KEY) || "";
  });
  const skippedInitialFetchRef = useRef(false);
  const winningRuleIds = initialResolutionDebug.winners.map((winner) => winner.ruleId);
  const winningFields = Object.fromEntries(
    initialResolutionDebug.winners.map((winner) => {
      const value = initialUiState[winner.field as keyof InitialUiState];
      return [winner.field, Array.isArray(value) ? value.join("|") : value == null ? "" : String(value)];
    }),
  );

  useEffect(() => {
    const current = new URL(window.location.href);
    if (date) current.searchParams.set("date", date);
    else current.searchParams.delete("date");
    if (query.trim()) current.searchParams.set("q", query.trim());
    else current.searchParams.delete("q");
    window.history.replaceState({}, "", current.toString());
  }, [date, query]);

  useEffect(() => {
    if (!date) return;

    if (
      !skippedInitialFetchRef.current &&
      refreshNonce === 0 &&
      initialData &&
      initialDate === date
    ) {
      skippedInitialFetchRef.current = true;
      return;
    }

    let ignore = false;

    fetch(`${DCC_ORIGIN}/api/public/juneau-heli-products-viator?date=${encodeURIComponent(date)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load Juneau helicopter products");
        return (await response.json()) as JuneauProductsResponse;
      })
      .then((payload) => {
        if (!ignore) setData(payload);
      })
      .catch(() => {
        if (!ignore) {
          setData({
            generatedAt: "",
            selectedDate: date,
            signals: {},
            products: [],
          });
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [date, initialData, initialDate, refreshNonce]);

  useEffect(() => {
    const shell = document.getElementById("app-shell");
    document.body.classList.toggle("widget-mode", initialWidgetMode);
    shell?.classList.toggle("widget-shell", initialWidgetMode);

    return () => {
      document.body.classList.remove("widget-mode");
      shell?.classList.remove("widget-shell");
    };
  }, [initialWidgetMode]);

  useEffect(() => {
    if (!initialHandoffContext.handoffId) return;
    trackWidgetEvent("handoff_viewed", {
      corridor: "wta",
      page_type: "wta-helicopter",
      source_page: initialHandoffContext.sourcePage || "/",
      handoff_id: initialHandoffContext.handoffId,
      requested_lane: initialHandoffContext.requestedLane,
      resolved_lane: initialHandoffContext.resolvedLane,
      topic: initialHandoffContext.topic,
      subtype: initialHandoffContext.subtype,
      date: initialHandoffContext.date,
      port: initialHandoffContext.port,
      product_slug: initialUiState.defaultCardSlug,
      default_card_slug: initialUiState.defaultCardSlug,
      fit_signal: initialUiState.fitSignal,
      urgency: initialUiState.urgency,
      confidence_downgraded: initialResolutionDebug.downgraded,
      winning_rule_ids: winningRuleIds,
      winning_fields: winningFields,
      stage: "hero_rendered",
    });
  }, [initialHandoffContext, initialResolutionDebug.downgraded, initialUiState, winningFields, winningRuleIds]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    console.debug("JFD initial resolution", {
      handoff: initialHandoffContext,
      state: initialUiState,
      downgraded: initialResolutionDebug.downgraded,
      winners: initialResolutionDebug.winners,
    });
  }, [initialHandoffContext, initialResolutionDebug, initialUiState]);

  useEffect(() => {
    if (!handoffId) return;
    window.sessionStorage.setItem(HANDOFF_STORAGE_KEY, handoffId);
  }, [handoffId]);

  useEffect(() => {
    if (!initialWidgetMode || typeof window.parent?.postMessage !== "function") return;

    const postHeight = () => {
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
      );

      window.parent.postMessage(
        {
          type: "DCC_WIDGET_RESIZE",
          widget: "juneauflightdeck",
          height,
        },
        "*",
      );
    };

    postHeight();
    const observer = new ResizeObserver(() => postHeight());
    observer.observe(document.body);
    window.addEventListener("load", postHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("load", postHeight);
    };
  }, [initialWidgetMode]);

  const updatedLabel = formatUpdatedLabel(data.generatedAt);
  const normalizedQuery = normalizeQuery(query);
  const filteredProducts = data.products.filter((product) => {
    if (!normalizedQuery) return true;
    const haystack = normalizeQuery(
      [product.title, product.description, product.supplierName].filter(Boolean).join(" "),
    );
    return haystack.includes(normalizedQuery);
  });
  const orderedProducts = prioritizeProducts(filteredProducts, initialUiState);
  const featuredWidgets = buildDecisionWidgets(orderedProducts, handoffId, data.selectedDate);
  const primaryWidget = featuredWidgets[0];
  const alternativeWidgets = featuredWidgets.slice(1);
  const guidedHref = useMemo(() => {
    const href = buildGuidedHref("/", date ? { date } : undefined);
    return `${href}#live-slots`;
  }, [date]);

  useEffect(() => {
    if (!date || !initialHandoffContext.handoffId || !featuredWidgets.length) return;
    trackWidgetEvent("shortlist_rendered", {
      corridor: "wta",
      page_type: "wta-helicopter",
      source_page: initialHandoffContext.sourcePage || "/",
      handoff_id: initialHandoffContext.handoffId,
      requested_lane: initialHandoffContext.requestedLane,
      resolved_lane: initialHandoffContext.resolvedLane,
      topic: initialHandoffContext.topic,
      subtype: initialHandoffContext.subtype,
      date,
      port: initialHandoffContext.port,
      product_slug: initialUiState.defaultCardSlug,
      default_card_slug: initialUiState.defaultCardSlug,
      shortlist_count: featuredWidgets.length,
      confidence_downgraded: initialResolutionDebug.downgraded,
      winning_rule_ids: winningRuleIds,
      winning_fields: winningFields,
      stage: "cards_ready",
    });
  }, [
    date,
    featuredWidgets.length,
    initialHandoffContext,
    initialResolutionDebug.downgraded,
    initialUiState.defaultCardSlug,
    winningFields,
    winningRuleIds,
  ]);

  function trackCertaintyClick(metrics: { timeToClickMs: number; scrollDepth: number }) {
    trackWidgetEvent("certainty_cta_clicked", {
      corridor: "wta",
      page_type: "wta-helicopter",
      source_page: initialHandoffContext.sourcePage || "/",
      handoff_id: initialHandoffContext.handoffId,
      requested_lane: initialHandoffContext.requestedLane,
      resolved_lane: initialHandoffContext.resolvedLane,
      topic: initialHandoffContext.topic,
      subtype: initialHandoffContext.subtype,
      date: date || initialHandoffContext.date,
      port: initialHandoffContext.port,
      product_slug: initialUiState.defaultCardSlug,
      default_card_slug: initialUiState.defaultCardSlug,
      fit_signal: initialUiState.fitSignal,
      urgency: initialUiState.urgency,
      confidence_downgraded: initialResolutionDebug.downgraded,
      winning_rule_ids: winningRuleIds,
      winning_fields: winningFields,
      stage: "certainty_block",
      surface: "juneau-certainty-block",
      decision_mode: "guided",
      scroll_depth_at_click: metrics.scrollDepth,
      time_to_click_ms: metrics.timeToClickMs,
      intent: "glacier_experience",
    });
  }

  function trackEnteredGuidedFlow(source: "url" | "session" | "default") {
    trackWidgetEvent("entered_guided_flow", {
      corridor: "wta",
      page_type: "wta-helicopter-guided",
      source_page: initialHandoffContext.sourcePage || "/",
      handoff_id: initialHandoffContext.handoffId,
      requested_lane: initialHandoffContext.requestedLane,
      resolved_lane: initialHandoffContext.resolvedLane,
      topic: initialHandoffContext.topic,
      subtype: initialHandoffContext.subtype,
      date: date || initialHandoffContext.date,
      port: initialHandoffContext.port,
      product_slug: initialUiState.defaultCardSlug,
      default_card_slug: initialUiState.defaultCardSlug,
      fit_signal: initialUiState.fitSignal,
      urgency: initialUiState.urgency,
      confidence_downgraded: initialResolutionDebug.downgraded,
      winning_rule_ids: winningRuleIds,
      winning_fields: winningFields,
      stage: "guided_entry",
      surface: "juneau-guided-results",
      decision_mode: "guided",
      entry_source: source,
      intent: "glacier_experience",
    });
  }

  function trackPrimaryRecommendationClick(widget: DecisionWidget) {
    trackWidgetEvent("primary_recommendation_clicked", {
      corridor: "wta",
      page_type: "wta-helicopter-guided",
      source_page: initialHandoffContext.sourcePage || "/",
      handoff_id: initialHandoffContext.handoffId,
      requested_lane: initialHandoffContext.requestedLane,
      resolved_lane: initialHandoffContext.resolvedLane,
      topic: initialHandoffContext.topic,
      subtype: initialHandoffContext.subtype,
      date: date || initialHandoffContext.date,
      port: initialHandoffContext.port,
      product_slug: widget.productId,
      default_card_slug: initialUiState.defaultCardSlug,
      fit_signal: initialUiState.fitSignal,
      urgency: initialUiState.urgency,
      confidence_downgraded: initialResolutionDebug.downgraded,
      winning_rule_ids: winningRuleIds,
      winning_fields: winningFields,
      stage: "guided_primary_click",
      surface: "juneau-guided-results",
      decision_mode: "guided",
      recommended_option: widget.productId,
      destination: widget.href,
      intent: "glacier_experience",
    });
  }

  function handleDateChange(nextDate: string) {
    setDate(nextDate);
    setLoading(Boolean(nextDate));
  }

  function handleRefresh() {
    if (!date) return;
    setLoading(true);
    setRefreshNonce((value) => value + 1);
  }

  const guidedResults = (
    <section className="panel guided-panel">
      <div className="guided-panel__top">
        <div style={{ display: "grid", gap: 8 }}>
          <p className="eyebrow" style={{ marginBottom: 0 }}>
            Guided Juneau path
          </p>
          <h2 style={{ margin: 0 }}>Lock in your cruise day</h2>
          <p className="muted" style={{ margin: 0 }}>
            Choose the one day you will actually be in port. Then open the clearest helicopter option for that date.
          </p>
        </div>
        <input
          className="date-input"
          type="date"
          min={bounds.min}
          max={bounds.max}
          value={date}
          onChange={(event) => handleDateChange(event.target.value)}
        />
      </div>

      {date && primaryWidget ? (
        <>
          <div className="meta-row">
            <div className="last-updated">Last updated: {updatedLabel}</div>
            <button className="refresh-link" type="button" onClick={handleRefresh}>
              Refresh this date
            </button>
          </div>
          <GuidedResults
            eyebrow="Handled path"
            title={`Best match for ${date}`}
            description="This is the clearest fit for your day."
            primary={
              <DecisionWidgetCard
                widget={primaryWidget}
                pageType="wta-helicopter-guided"
                sourcePage="/"
                onActionClick={() => trackPrimaryRecommendationClick(primaryWidget)}
                showImage
              />
            }
            alternatives={
              <div className="guided-alternatives">
                {alternativeWidgets.map((widget) => (
                  <DecisionWidgetCard
                    key={widget.id}
                    widget={widget}
                    pageType="wta-helicopter-guided"
                    sourcePage="/"
                    showImage={false}
                  />
                ))}
              </div>
            }
            alternativesLabel="Prefer a different pace?"
          />
        </>
      ) : (
        <div className="guided-empty">
          <h3>Pick your Juneau day first</h3>
          <p>
            Once you choose the date, we keep the shortlist tight and lead with the clearest helicopter option for that day.
          </p>
        </div>
      )}
    </section>
  );

  const browseResults = (
    <section className="panel">
      <p className="eyebrow">Date-first booking</p>
      <h2>Select your Juneau day</h2>
      <p className="muted">Choose the one day you will actually be in port. Then check the premium helicopter tours showing for that date.</p>
      <div className="meta-row">
        <input
          className="date-input"
          type="date"
          min={bounds.min}
          max={bounds.max}
          value={date}
          onChange={(event) => handleDateChange(event.target.value)}
        />
      </div>
      <div className="meta-row">
        <input
          className="date-input"
          type="text"
          placeholder="Optional filter: glacier landing, dog sled, operator name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {date ? (
        <>
          {featuredWidgets.length ? (
            <div className="widget-stack">
              <div className="widget-stack__header">
                <p className="eyebrow">Start with these</p>
                <h2>Start here for {date}</h2>
                <p className="muted">
                  Open the first card first. It is the clearest default for a premium Juneau helicopter day.
                </p>
              </div>
              <div className="widget-stack__grid">
                {featuredWidgets.map((widget) => (
                  <DecisionWidgetCard
                    key={widget.id}
                    widget={widget}
                    pageType="wta-helicopter"
                    sourcePage="/"
                  />
                ))}
              </div>
            </div>
          ) : null}
          <div className="meta-row">
            <div className="last-updated">Last updated: {updatedLabel}</div>
            <button className="refresh-link" type="button" onClick={handleRefresh}>
              Refresh this date
            </button>
          </div>
          <h2 style={{ marginTop: 18 }}>Helicopter tours to check for {date}</h2>
          {data.signals.headline ? <p className="muted">{data.signals.headline}</p> : null}
          <div className="list">
            {loading ? (
              <div className="slot-card">
                <h3>Loading helicopter products</h3>
                <div className="slot-summary">Checking Juneau helicopter products for your selected date now.</div>
              </div>
            ) : orderedProducts.length ? (
              orderedProducts.map((product) => {
                const durationLabel = formatDuration(product.durationMinutes);
                const bookHref = buildTrackedHref(product.bookHref, handoffId);
                return (
                  <a key={product.id} href={bookHref} className="slot-card product-card">
                    {product.imageUrl ? (
                      <div className="product-image-wrap">
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    ) : null}
                    <div className="slot-head">
                      <div>
                        <div className="slot-time">Helicopter tour</div>
                        <h3>{product.title}</h3>
                      </div>
                      {product.priceLabel ? <div className="seat-badge">{product.priceLabel}</div> : null}
                    </div>
                    {product.description ? <div className="slot-summary">{product.description}</div> : null}
                    <div className="product-meta">
                      {durationLabel ? <span>{durationLabel}</span> : null}
                      {product.supplierName ? <span>{product.supplierName}</span> : null}
                    </div>
                    <div className="slot-summary">
                      Open the live listing to confirm availability and book this tour for your day.
                    </div>
                    <div className="button button-primary">Open this listing</div>
                  </a>
                );
              })
            ) : (
              <div className="slot-card">
                <h3>No helicopter products are showing right now</h3>
                <div className="slot-summary">
                  {query.trim()
                    ? `No helicopter tours matched "${query.trim()}" for this date. Clear the filter or try again.`
                    : "No helicopter tours are showing for this date right now. Refresh once or try a nearby day."}
                </div>
                <a
                  href={data.browseHref || `${DCC_ORIGIN}/juneau/helicopter-tours`}
                  className="button button-secondary"
                  target="_blank"
                  rel="noreferrer"
                >
                  Browse broader Juneau options
                </a>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="slot-card">
          <h3>Start with your cruise date</h3>
          <div className="slot-summary">
            Juneau helicopter inventory changes by day. Pick the exact date you will be in port to see the real list.
          </div>
        </div>
      )}
    </section>
  );

  return (
    <main>
      <section className="hero">
        <div className="hero-grid">
          <div>
            <p className="eyebrow">Juneau helicopter tours</p>
            <h1>{initialUiState.headline}</h1>
            {initialUiState.arrivalConfirmationLine ? (
              <p className="trust-line">{initialUiState.arrivalConfirmationLine}</p>
            ) : null}
            <p className="hero-copy">
              {initialUiState.supportLine ||
                "Pick your cruise day first. Then open the helicopter tour most likely to be worth your one shot in Juneau."}
            </p>
          </div>
        </div>
      </section>

      <section className="panel certainty-panel">
        <div style={{ position: "relative", width: "100%", height: 192, borderRadius: 24, overflow: "hidden" }}>
          <Image src={HERO_IMAGE} alt="Juneau helicopter tour mood image" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
        </div>
        <CertaintyBlock
          surface="juneau-certainty-block"
          eyebrow="Handled path"
          verdict="Best move: Lock in your Juneau day"
          title="A Juneau day that still works when conditions change."
          paragraphs={[
            "Planning your day in Juneau should not depend on perfect weather or last-minute guessing. This is the simplest way to lock in a high-quality experience without worrying about what might shift.",
            "You get access to the signature Juneau experience without having to sort through every helicopter option yourself. Start with the handled path, then open the clearest fit for your cruise day.",
          ]}
          proofChips={["Less timing risk", "Cleaner day-of decision", "No re-planning later"]}
          ctaLabel="Lock in your day"
          href={guidedHref}
          microcopy="Fastest path from decision to booking."
          sessionContext={{
            intent: "glacier_experience",
            source: "certainty_block",
            preference: "certainty_first",
          }}
          theme="juneau"
          onCtaClick={trackCertaintyClick}
        />
      </section>

      <section id="live-slots">
        <GuidedFlowController
          initialMode={initialDecisionMode}
          intent="glacier_experience"
          surface="juneau-guided-flow"
          guided={guidedResults}
          browse={browseResults}
          wallLabel=""
          resetLabel="See all options"
          browseHint=""
          onEnteredGuidedFlow={trackEnteredGuidedFlow}
        />
      </section>
    </main>
  );
}
