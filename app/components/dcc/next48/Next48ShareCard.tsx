"use client";

import { useState } from "react";
import StoryArtifactFrame from "@/app/components/dcc/share/StoryArtifactFrame";
import { shareOrCopyArtifact, trackShareArtifact } from "@/lib/dcc/share/analytics";
import {
  downloadBlobAsFile,
  renderStoryCardToBlob,
  shareBlobAsFile,
  toApprovedHeroPath,
} from "@/lib/dcc/share/storyCard";
import type { Next48Feed } from "@/lib/dcc/next48/types";

type Props = {
  feed: Next48Feed;
};

function topLabels(feed: Next48Feed): string[] {
  const items = [...feed.buckets.now, ...feed.buckets.tonight, ...feed.buckets.tomorrow].slice(0, 3);
  return items.map((item) => `${item.title} — ${item.venueOrArea}`);
}

function formatTimestamp(value: string): string {
  const dt = new Date(value);
  return dt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function Next48ShareCard({ feed }: Props) {
  const labels = topLabels(feed);
  const fallbackHero =
    feed.entityType === "city"
      ? `/images/authority/cities/${feed.slug}/hero.webp`
      : `/images/authority/ports/${feed.slug}/hero.webp`;
  const heroImage = toApprovedHeroPath(
    [...feed.buckets.now, ...feed.buckets.tonight, ...feed.buckets.tomorrow][0]?.image,
    fallbackHero
  );
  const [status, setStatus] = useState("idle");
  const title = `Next 48 Hours in ${feed.slug.replace(/-/g, " ")}`;
  const context = `${feed.entityType}:${feed.slug}`;
  const pageUrl = `https://destinationcommandcenter.com/${feed.entityType === "city" ? "cities" : "ports"}/${feed.slug}`;

  function onOpen() {
    trackShareArtifact({ artifactType: "next48", action: "open", context });
  }

  async function generateCardBlob() {
    trackShareArtifact({ artifactType: "next48", action: "generate_start", context });
    try {
      const blob = await renderStoryCardToBlob({
        title,
        subtitle: "Share Snapshot",
        timestamp: formatTimestamp(feed.generatedAt),
        heroImage,
        lines: labels.length ? labels : ["Live discovery updates are refreshing now."],
      });
      trackShareArtifact({ artifactType: "next48", action: "generate_success", context });
      return blob;
    } catch {
      trackShareArtifact({ artifactType: "next48", action: "generate_failed", context });
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
      downloadBlobAsFile(blob, `${feed.slug}-next48-story-card.png`);
      trackShareArtifact({ artifactType: "next48", action: "download_success", context });
      setStatus("downloaded");
    } catch {
      trackShareArtifact({ artifactType: "next48", action: "download_failed", context });
      setStatus("download failed");
    }
  }

  async function onShare() {
    const text = labels.length ? labels.join("\n") : "Live discovery updates are refreshing now.";

    const blob = await generateCardBlob();
    if (blob) {
      const didShareFile = await shareBlobAsFile({
        blob,
        filename: `${feed.slug}-next48-story-card.png`,
        title,
        text,
        url: pageUrl,
      });

      if (didShareFile) {
        trackShareArtifact({ artifactType: "next48", action: "share_success", context });
        setStatus("shared");
        return;
      }
    }

    const result = await shareOrCopyArtifact({
      title,
      text,
      url: pageUrl,
      artifactType: "next48",
      context,
    });

    if (result === "failed") {
      trackShareArtifact({ artifactType: "next48", action: "share_failed", context });
    }
    setStatus(result);
  }

  return (
    <section className="space-y-3">
      <div onMouseEnter={onOpen} onFocus={onOpen}>
        <StoryArtifactFrame
          title={title}
          subtitle="Share Snapshot"
          timestamp={formatTimestamp(feed.generatedAt)}
          heroImage={heroImage}
        >
          {labels.length ? (
            labels.map((line) => (
              <p key={line} className="text-sm text-zinc-100">
                • {line}
              </p>
            ))
          ) : (
            <p className="text-sm text-zinc-200">Live discovery updates are refreshing now.</p>
          )}
        </StoryArtifactFrame>
      </div>

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
