import { getVegasShows } from "@/lib/ticketmaster";
import { getVegasTours } from "@/lib/fareharbor";

export type Next48BucketKey = "now" | "tonight" | "tomorrow" | "later-48h";
export type Next48Category = "concerts" | "sports" | "festivals" | "tours" | "nightlife";

export type Next48Link = {
  label: string;
  href: string;
  kind: "internal" | "external";
};

export type Next48Item = {
  id: string;
  category: Next48Category;
  title: string;
  startAt: string;
  venueOrArea: string;
  image: string;
  whyItMatters: string;
  authorityCta: Next48Link;
  executionCta?: Next48Link;
};

export type Next48Feed = {
  slug: string;
  buckets: Record<Next48BucketKey, Next48Item[]>;
  counts: Record<Next48BucketKey, number>;
};

const DCC_NEXT48_URL =
  "https://www.destinationcommandcenter.com/api/internal/next48?entityType=city&slug=las-vegas";

function createEmptyBuckets(): Record<Next48BucketKey, Next48Item[]> {
  return {
    now: [],
    tonight: [],
    tomorrow: [],
    "later-48h": [],
  };
}

function toIso(date: Date) {
  return date.toISOString();
}

function bucketForDate(date: Date, now: Date): Next48BucketKey | null {
  const diffMs = date.getTime() - now.getTime();
  if (diffMs < -4 * 60 * 60 * 1000) return null;
  const diffHours = diffMs / (60 * 60 * 1000);
  if (diffHours <= 6) return "now";
  if (diffHours <= 18) return "tonight";
  if (diffHours <= 36) return "tomorrow";
  if (diffHours <= 48) return "later-48h";
  return null;
}

function toFeed(items: Next48Item[], now = new Date()): Next48Feed {
  const buckets = createEmptyBuckets();
  for (const item of items) {
    const start = new Date(item.startAt);
    const bucket = bucketForDate(start, now);
    if (bucket) buckets[bucket].push(item);
  }

  return {
    slug: "las-vegas",
    buckets,
    counts: {
      now: buckets.now.length,
      tonight: buckets.tonight.length,
      tomorrow: buckets.tomorrow.length,
      "later-48h": buckets["later-48h"].length,
    },
  };
}

export function feedHasItems(feed: Next48Feed) {
  return Object.values(feed.counts).some((count) => count > 0);
}

function buildCuratedVegasFallback(now = new Date()): Next48Feed {
  const tonight = new Date(now);
  tonight.setHours(20, 0, 0, 0);
  if (tonight.getTime() <= now.getTime()) tonight.setDate(tonight.getDate() + 1);

  const laterTonight = new Date(tonight);
  laterTonight.setHours(22, 0, 0, 0);

  const tomorrowMorning = new Date(now);
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(9, 0, 0, 0);

  const tomorrowNight = new Date(now);
  tomorrowNight.setDate(tomorrowNight.getDate() + 1);
  tomorrowNight.setHours(19, 30, 0, 0);

  return toFeed(
    [
      {
        id: "curated:bellagio-fountains",
        category: "nightlife",
        title: "Bellagio Fountains and center-Strip walk",
        startAt: toIso(tonight),
        venueOrArea: "Bellagio",
        image: "",
        whyItMatters:
          "The easiest no-pressure Vegas night move when you want something live-feeling without committing to a ticket.",
        authorityCta: { label: "See free things", href: "/free-things", kind: "internal" },
      },
      {
        id: "curated:fremont-street",
        category: "nightlife",
        title: "Fremont Street live canopy and downtown energy",
        startAt: toIso(laterTonight),
        venueOrArea: "Fremont Street Experience",
        image: "",
        whyItMatters:
          "A strong night pick when you want music, LED spectacle, and a different Vegas mood from the Strip.",
        authorityCta: { label: "Open free things", href: "/free-things", kind: "internal" },
      },
      {
        id: "curated:grand-canyon",
        category: "tours",
        title: "Grand Canyon day trip options from Las Vegas",
        startAt: toIso(tomorrowMorning),
        venueOrArea: "Grand Canyon",
        image: "",
        whyItMatters:
          "Useful when you want one big outing tomorrow instead of spending the whole trip inside casino corridors.",
        authorityCta: { label: "See Grand Canyon tours", href: "/tours", kind: "internal" },
      },
      {
        id: "curated:sphere",
        category: "concerts",
        title: "Sphere planning and featured show picks",
        startAt: toIso(tomorrowNight),
        venueOrArea: "Sphere",
        image: "",
        whyItMatters:
          "The best premium Vegas night lane when you want one signature show instead of endless ticket browsing.",
        authorityCta: { label: "Open Sphere guide", href: "/shows/sphere", kind: "internal" },
      },
    ],
    now,
  );
}

function mergeFeeds(primary: Next48Feed, secondary: Next48Feed): Next48Feed {
  const merged = createEmptyBuckets();

  (Object.keys(merged) as Next48BucketKey[]).forEach((bucket) => {
    const seen = new Set<string>();
    for (const item of [...(primary.buckets[bucket] || []), ...(secondary.buckets[bucket] || [])]) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged[bucket].push(item);
    }
  });

  return {
    slug: primary.slug || secondary.slug || "las-vegas",
    buckets: merged,
    counts: {
      now: merged.now.length,
      tonight: merged.tonight.length,
      tomorrow: merged.tomorrow.length,
      "later-48h": merged["later-48h"].length,
    },
  };
}

function takeTopItems(feed: Next48Feed, maxPerBucket = 4): Next48Feed {
  const buckets = createEmptyBuckets();
  (Object.keys(buckets) as Next48BucketKey[]).forEach((bucket) => {
    buckets[bucket] = (feed.buckets[bucket] || []).slice(0, maxPerBucket);
  });
  return {
    slug: feed.slug,
    buckets,
    counts: {
      now: buckets.now.length,
      tonight: buckets.tonight.length,
      tomorrow: buckets.tomorrow.length,
      "later-48h": buckets["later-48h"].length,
    },
  };
}

async function buildLocalFeed(now = new Date()): Promise<Next48Feed> {
  const [shows, tourPayload] = await Promise.all([
    getVegasShows().catch(() => []),
    getVegasTours().catch(() => ({ tours: [], companies: [], configured: false })),
  ]);

  const showItems: Next48Item[] = shows
    .slice(0, 8)
    .map((show) => {
      const startAt =
        show.dateTime ||
        (show.localDate ? toIso(new Date(`${show.localDate}T${show.localTime || "20:00"}:00`)) : null);
      if (!startAt) return null;

      return {
        id: `show:${show.id}`,
        category: "concerts",
        title: show.name,
        startAt,
        venueOrArea: show.venueName || "Las Vegas",
        image: show.imageUrl || "",
        whyItMatters: "Real Vegas show inventory for the next 48 hours.",
        authorityCta: { label: "See show page", href: "/shows", kind: "internal" },
        executionCta: show.url
          ? {
              label: "View tickets",
              href: `/api/tickets/out?target=${encodeURIComponent(show.url)}&affiliateTarget=ticketmaster&sourcePath=/api/whats-live&sourceSlug=saveonthestrip-whats-live&sourcePage=/api/whats-live&topicSlug=vegas-live&eventId=${encodeURIComponent(show.id)}&eventName=${encodeURIComponent(show.name)}${show.localDate ? `&eventDate=${encodeURIComponent(show.localDate)}` : ""}`,
              kind: "internal",
            }
          : undefined,
      };
    })
    .filter(Boolean) as Next48Item[];

  const tourItems: Next48Item[] = tourPayload.tours.slice(0, 6).map((tour, index) => {
    const start = new Date(now);
    start.setHours(9 + (index % 3) * 2, 0, 0, 0);
    start.setDate(now.getDate() + (index < 3 ? 1 : 2));

    return {
      id: `tour:${tour.id}`,
      category: "tours",
      title: tour.name,
      startAt: toIso(start),
      venueOrArea: tour.areaLabel,
      image: tour.imageUrl || "",
      whyItMatters: "A strong next-day Vegas outing when you want more than casino time.",
      authorityCta: { label: "See tour page", href: `/tours/${tour.slug}`, kind: "internal" },
      executionCta: tour.productUrl
        ? {
            label: "View operator",
            href: `/api/tours/out?target=${encodeURIComponent(tour.productUrl)}&sourcePath=/api/whats-live&sourceSlug=saveonthestrip-whats-live&sourcePage=/api/whats-live&topicSlug=vegas-live&productSlug=${encodeURIComponent(tour.slug)}&company=${encodeURIComponent(tour.company)}&itemPk=${encodeURIComponent(String(tour.itemPk))}&area=${encodeURIComponent(tour.area)}`,
            kind: "internal",
          }
        : undefined,
    };
  });

  return toFeed([...showItems, ...tourItems], now);
}

export async function getVegasWhatsLiveFeed() {
  const now = new Date();
  const localFeed = await buildLocalFeed(now).catch(() => toFeed([], now));
  const curatedFeed = buildCuratedVegasFallback(now);

  try {
    const response = await fetch(DCC_NEXT48_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const payload = await response.json();
    if (response.ok && payload?.ok && payload?.feed) {
      const merged = mergeFeeds(payload.feed as Next48Feed, mergeFeeds(localFeed, curatedFeed));
      return { ok: true, feed: takeTopItems(merged), fallback: false as const };
    }
  } catch {}

  const mergedFallback = mergeFeeds(localFeed, curatedFeed);
  return {
    ok: true,
    feed: takeTopItems(feedHasItems(mergedFallback) ? mergedFallback : curatedFeed),
    fallback: true as const,
  };
}
