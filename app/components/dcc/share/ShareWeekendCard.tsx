"use client";

import { useEffect, useMemo, useState } from "react";
import StoryArtifactFrame from "@/app/components/dcc/share/StoryArtifactFrame";
import { shareOrCopyArtifact, trackShareArtifact } from "@/lib/dcc/share/analytics";
import {
  downloadBlobAsFile,
  renderStoryCardToBlob,
  shareBlobAsFile,
  toApprovedHeroPath,
} from "@/lib/dcc/share/storyCard";
import type { Next48EntityType, Next48Feed } from "@/lib/dcc/next48/types";

type ApiPayload = { ok: boolean; feed?: Next48Feed; error?: string };

type Props = {
  entityType?: Next48EntityType;
  slug?: string;
  title?: string;
  subtitle?: string;
  context?: string;
  fallbackHero?: string;
  pageUrl?: string;
};

function formatTimestamp(value: string): string {
  const dt = new Date(value);
  return dt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ShareWeekendCard({
  entityType = "city",
  slug = "denver",
  title,
  subtitle = "Authority Snapshot",
  context,
  fallbackHero,
  pageUrl,
}: Props) {
  const [feed, setFeed] = useState<Next48Feed | null>(null);
  const [status, setStatus] = useState("idle");
  const resolvedContext = context || `${entityType}:${slug}`;
  const resolvedTitle = title || `Share This Weekend: ${slug.replace(/-/g, " ")}`;
  const resolvedFallbackHero =
    fallbackHero ||
    (entityType === "city"
      ? `/images/authority/cities/${slug}/hero.webp`
      : `/images/authority/ports/${slug}/hero.webp`);
  const resolvedUrl = pageUrl || `https://destinationcommandcenter.com/${entityType === "city" ? "cities" : "ports"}/${slug}`;

  useEffect(() => {
    trackShareArtifact({ artifactType: "weekend", action: "open", context: resolvedContext });
    fetch(`/api/internal/next48?entityType=${entityType}&slug=${slug}`)
      .then(async (res) => {
        const payload = (await res.json()) as ApiPayload;
        if (!res.ok || !payload.ok || !payload.feed) throw new Error(payload.error || "failed");
        setFeed(payload.feed);
      })
      .catch(() => setFeed(null));
  }, [entityType, slug, resolvedContext]);

  const topItems = useMemo(() => {
    if (!feed) return [];
    return [...feed.buckets.now, ...feed.buckets.tonight, ...feed.buckets.tomorrow].slice(0, 3);
  }, [feed]);

  const timestamp = formatTimestamp(feed?.generatedAt || new Date().toISOString());
  const heroImage = toApprovedHeroPath(topItems[0]?.image, resolvedFallbackHero);

  async function generateCardBlob() {
    trackShareArtifact({ artifactType: "weekend", action: "generate_start", context: resolvedContext });
    try {
      const blob = await renderStoryCardToBlob({
        title: resolvedTitle,
        subtitle,
        timestamp,
        heroImage,
        lines: topItems.length
          ? topItems.map((item) => `${item.title} — ${item.venueOrArea}`)
          : ["Live weekend picks are updating now."],
      });
      trackShareArtifact({ artifactType: "weekend", action: "generate_success", context: resolvedContext });
      return blob;
    } catch {
      trackShareArtifact({ artifactType: "weekend", action: "generate_failed", context: resolvedContext });
      return null;
    }
  }

  async function onDownload() {
    const blob = await generateCardBlob();
    if (!blob) {
      setStatus("generate failed");
      return;
    }
    try {
      downloadBlobAsFile(blob, `${slug}-weekend-story-card.png`);
      trackShareArtifact({ artifactType: "weekend", action: "download_success", context: resolvedContext });
      setStatus("downloaded");
    } catch {
      trackShareArtifact({ artifactType: "weekend", action: "download_failed", context: resolvedContext });
      setStatus("download failed");
    }
  }

  async function onShare() {
    const text = topItems.length
      ? topItems.map((item) => `${item.title} — ${item.venueOrArea}`).join("\n")
      : "Live weekend picks are updating now.";

    const blob = await generateCardBlob();
    if (blob) {
      const didShareFile = await shareBlobAsFile({
        blob,
        filename: `${slug}-weekend-story-card.png`,
        title: resolvedTitle,
        text,
        url: resolvedUrl,
      });

      if (didShareFile) {
        trackShareArtifact({ artifactType: "weekend", action: "share_success", context: resolvedContext });
        setStatus("shared");
        return;
      }
    }

    const result = await shareOrCopyArtifact({
      title: resolvedTitle,
      text,
      url: resolvedUrl,
      artifactType: "weekend",
      context: resolvedContext,
    });

    if (result === "failed") {
      trackShareArtifact({ artifactType: "weekend", action: "share_failed", context: resolvedContext });
    }
    setStatus(result);
  }

  return (
    <section className="space-y-3">
      <StoryArtifactFrame title={resolvedTitle} subtitle={subtitle} timestamp={timestamp} heroImage={heroImage}>
        {topItems.length ? (
          topItems.map((item) => (
            <p key={item.id} className="text-sm text-zinc-100">
              • {item.title} — {item.venueOrArea}
            </p>
          ))
        ) : (
          <p className="text-sm text-zinc-200">Live weekend picks are updating now.</p>
        )}
      </StoryArtifactFrame>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onShare}
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-zinc-100"
        >
          Share image
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-zinc-100"
        >
          Download PNG
        </button>
        {status !== "idle" ? <span className="text-xs text-zinc-400">{status}</span> : null}
      </div>
    </section>
  );
}
