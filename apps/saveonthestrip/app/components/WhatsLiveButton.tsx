"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Next48BucketKey = "now" | "tonight" | "tomorrow" | "later-48h";
type Next48Filter = "all" | "concerts" | "sports" | "festivals" | "tours" | "nightlife";

type Next48Link = {
  label: string;
  href: string;
  kind: "internal" | "external";
};

type Next48Item = {
  id: string;
  category: Exclude<Next48Filter, "all">;
  title: string;
  startAt: string;
  venueOrArea: string;
  image: string;
  whyItMatters: string;
  authorityCta: Next48Link;
  executionCta?: Next48Link;
};

type Next48Feed = {
  slug: string;
  buckets: Record<Next48BucketKey, Next48Item[]>;
  counts: Record<Next48BucketKey, number>;
};

type ApiPayload = {
  ok: boolean;
  feed?: Next48Feed;
  error?: string;
};

function buildClientFallbackFeed(): Next48Feed {
  const now = new Date();
  const tonight = new Date(now);
  tonight.setHours(20, 0, 0, 0);
  if (tonight.getTime() <= now.getTime()) tonight.setDate(tonight.getDate() + 1);

  const tomorrowMorning = new Date(now);
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(9, 0, 0, 0);

  const later = new Date(now);
  later.setDate(later.getDate() + 1);
  later.setHours(19, 30, 0, 0);

  return {
    slug: "las-vegas",
    buckets: {
      now: [],
      tonight: [
        {
          id: "client:fremont",
          category: "nightlife",
          title: "Fremont Street and Bellagio after dark",
          startAt: tonight.toISOString(),
          venueOrArea: "Las Vegas",
          image: "",
          whyItMatters:
            "Good fallback picks when you want something live-feeling in Vegas right now without waiting on a feed.",
          authorityCta: {
            label: "See free things",
            href: "/free-things",
            kind: "internal",
          },
        },
      ],
      tomorrow: [
        {
          id: "client:grand-canyon",
          category: "tours",
          title: "Grand Canyon and Hoover Dam tomorrow",
          startAt: tomorrowMorning.toISOString(),
          venueOrArea: "Las Vegas day trips",
          image: "",
          whyItMatters:
            "A strong next-day Vegas move when you want one big outing instead of another slow Strip day.",
          authorityCta: {
            label: "See tours",
            href: "/tours",
            kind: "internal",
          },
        },
      ],
      "later-48h": [
        {
          id: "client:sphere",
          category: "concerts",
          title: "Featured Sphere planning picks",
          startAt: later.toISOString(),
          venueOrArea: "Sphere",
          image: "",
          whyItMatters:
            "The strongest premium show lane when you want one signature Vegas night built around a clear headliner pick.",
          authorityCta: {
            label: "Open Sphere guide",
            href: "/shows/sphere",
            kind: "internal",
          },
        },
      ],
    },
    counts: {
      now: 0,
      tonight: 1,
      tomorrow: 1,
      "later-48h": 1,
    },
  };
}

const BUCKET_LABELS: Record<Next48BucketKey, string> = {
  now: "Now",
  tonight: "Tonight",
  tomorrow: "Tomorrow",
  "later-48h": "Next 48h",
};

const FILTERS: Next48Filter[] = ["all", "concerts", "sports", "festivals", "tours", "nightlife"];

function formatStart(value: string) {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "Check time";
  return dt.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function categoryLabel(value: Next48Item["category"]) {
  if (value === "concerts") return "Concert";
  if (value === "sports") return "Sports";
  if (value === "festivals") return "Festival";
  if (value === "tours") return "Tour";
  return "Nightlife";
}

export function WhatsLiveButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<Next48Feed | null>(null);
  const [activeBucket, setActiveBucket] = useState<Next48BucketKey>("tonight");
  const [activeFilter, setActiveFilter] = useState<Next48Filter>("all");

  useEffect(() => {
    if (!open || feed || loading) return;

    let aborted = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    setLoading(true);
    setError(null);

    fetch("/api/whats-live", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as ApiPayload;
        if (!response.ok || !payload.ok || !payload.feed) {
          throw new Error(payload.error || "Could not load Vegas live picks");
        }
        if (!aborted) {
          setFeed(payload.feed);
          const firstNonEmpty =
            (Object.keys(payload.feed.counts) as Next48BucketKey[]).find(
              (bucket) => payload.feed?.counts[bucket]
            ) || "now";
          setActiveBucket(firstNonEmpty);
        }
      })
      .catch((err: unknown) => {
        if (!aborted) {
          setFeed(buildClientFallbackFeed());
          setActiveBucket("tonight");
          setError(String(err));
        }
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (!aborted) setLoading(false);
      });

    return () => {
      aborted = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [open, feed, loading]);

  const firstNonEmptyBucket = useMemo(() => {
    if (!feed) return "tonight" as Next48BucketKey;
    return (
      (Object.keys(feed.counts) as Next48BucketKey[]).find((bucket) => feed.counts[bucket] > 0) ||
      "tonight"
    );
  }, [feed]);

  const firstBucketForActiveFilter = useMemo(() => {
    if (!feed) return "tonight" as Next48BucketKey;
    const buckets = Object.keys(feed.buckets) as Next48BucketKey[];
    if (activeFilter === "all") {
      return (
        buckets.find((bucket) => (feed.buckets[bucket] || []).length > 0) || "tonight"
      );
    }

    return (
      buckets.find((bucket) =>
        (feed.buckets[bucket] || []).some((item) => item.category === activeFilter)
      ) || "tonight"
    );
  }, [feed, activeFilter]);

  const displayBucket = useMemo(() => {
    if (!feed) return activeBucket;
    const bucketItems = feed.buckets[activeBucket] || [];
    const hasMatches =
      activeFilter === "all"
        ? bucketItems.length > 0
        : bucketItems.some((item) => item.category === activeFilter);

    if (hasMatches) return activeBucket;
    return activeFilter === "all" ? firstNonEmptyBucket : firstBucketForActiveFilter;
  }, [activeBucket, activeFilter, feed, firstBucketForActiveFilter, firstNonEmptyBucket]);

  const items = useMemo(() => {
    if (!feed) return [] as Next48Item[];
    const base = feed.buckets[displayBucket] || [];
    if (activeFilter === "all") return base;
    return base.filter((item) => item.category === activeFilter);
  }, [feed, displayBucket, activeFilter]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setActiveFilter("all");
          setOpen(true);
        }}
        className="whats-live-trigger"
      >
        What&apos;s Live?
      </button>

      {open ? (
        <div className="whats-live-overlay">
          <button
            type="button"
            className="whats-live-backdrop"
            aria-label="Close What's Live"
            onClick={() => setOpen(false)}
          />

          <section className="whats-live-drawer">
            <header className="whats-live-header">
              <div>
                <p className="eyebrow">Vegas live picks</p>
                <h3>What&apos;s live in Vegas</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="pill">
                Close
              </button>
            </header>

            <p className="whats-live-copy">
              No location permission needed. This is already tuned for Las Vegas and the next 48
              hours.
            </p>

            {loading ? <p className="whats-live-empty">Loading Vegas live picks...</p> : null}
            {error ? <p className="whats-live-empty">Showing backup Vegas picks right now.</p> : null}

            {!loading && feed ? (
              <>
                <div className="whats-live-rail">
                  {(Object.keys(feed.counts) as Next48BucketKey[]).map((bucket) => (
                    <button
                      type="button"
                      key={bucket}
                      onClick={() => setActiveBucket(bucket)}
                      className={`pill ${displayBucket === bucket ? "pill-active" : ""}`}
                    >
                      {BUCKET_LABELS[bucket]} ({feed.counts[bucket]})
                    </button>
                  ))}
                </div>

                <div className="whats-live-rail">
                  {FILTERS.map((filter) => (
                    <button
                      type="button"
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`pill ${activeFilter === filter ? "pill-active" : ""}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="whats-live-list">
                  {items.length ? (
                    items.map((item) => (
                      <article className="card whats-live-card" key={item.id}>
                        {item.image ? (
                          <>
                            <div className="inline-media-frame">
                              <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                sizes="(max-width: 900px) 100vw, 50vw"
                                className="media-image"
                              />
                            </div>
                            <div style={{ height: 12 }} />
                          </>
                        ) : null}
                        <div className="eyebrow">
                          {categoryLabel(item.category)} • {formatStart(item.startAt)}
                        </div>
                        <h2 style={{ marginTop: 10 }}>{item.title}</h2>
                        <p>{item.venueOrArea}</p>
                        <p>{item.whyItMatters}</p>
                        <div className="detail-actions">
                          <a
                            href={item.authorityCta.href}
                            target={item.authorityCta.kind === "external" ? "_blank" : undefined}
                            rel={item.authorityCta.kind === "external" ? "noreferrer" : undefined}
                            className="button button-primary"
                          >
                            {item.authorityCta.label}
                          </a>
                          {item.executionCta ? (
                            <a
                              href={item.executionCta.href}
                              target={item.executionCta.kind === "external" ? "_blank" : undefined}
                              rel={item.executionCta.kind === "external" ? "noreferrer" : undefined}
                              className="button button-secondary"
                            >
                              {item.executionCta.label}
                            </a>
                          ) : null}
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="whats-live-empty">No strong matches in this bucket yet.</p>
                  )}
                </div>
              </>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
