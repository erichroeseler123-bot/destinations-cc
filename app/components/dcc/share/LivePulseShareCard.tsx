"use client";

import { useEffect, useState } from "react";
import StoryArtifactFrame from "@/app/components/dcc/share/StoryArtifactFrame";
import { shareOrCopyArtifact, trackShareArtifact } from "@/lib/dcc/share/analytics";
import {
  downloadBlobAsFile,
  renderStoryCardToBlob,
  shareBlobAsFile,
  toApprovedHeroPath,
} from "@/lib/dcc/share/storyCard";
import type { LivePulseFeed } from "@/lib/dcc/livePulse/types";

type ApiPayload = { ok: boolean; feed?: LivePulseFeed; error?: string };

function formatTimestamp(value: string): string {
  const dt = new Date(value);
  return dt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function LivePulseShareCard() {
  const [feed, setFeed] = useState<LivePulseFeed | null>(null);
  const [status, setStatus] = useState("idle");
  const context = "venue:red-rocks-amphitheatre";
  const title = "Red Rocks Live Pulse";
  const subtitle = "Right Now";
  const pageUrl = "https://destinationcommandcenter.com/venues/red-rocks-amphitheatre";

  useEffect(() => {
    trackShareArtifact({ artifactType: "live-pulse", action: "open", context });
    fetch("/api/internal/live-pulse?entityType=venue&slug=red-rocks-amphitheatre&target=entity&limit=4")
      .then(async (res) => {
        const payload = (await res.json()) as ApiPayload;
        if (!res.ok || !payload.ok || !payload.feed) throw new Error(payload.error || "failed");
        setFeed(payload.feed);
      })
      .catch(() => setFeed(null));
  }, []);

  const timestamp = formatTimestamp(feed?.generatedAt || new Date().toISOString());
  const heroImage = toApprovedHeroPath(
    feed?.items[0]?.imageUrl,
    "/images/authority/venues/red-rocks-amphitheatre/hero.webp"
  );

  async function generateCardBlob() {
    trackShareArtifact({ artifactType: "live-pulse", action: "generate_start", context });
    try {
      const lines = feed?.items.length
        ? feed.items.slice(0, 3).map((item) => `${item.title} · ${item.confidence} confidence · ${item.corroborationCount} reports`)
        : ["Live Pulse updates are refreshing now."];

      const blob = await renderStoryCardToBlob({
        title,
        subtitle,
        timestamp,
        heroImage,
        lines,
      });

      trackShareArtifact({ artifactType: "live-pulse", action: "generate_success", context });
      return blob;
    } catch {
      trackShareArtifact({ artifactType: "live-pulse", action: "generate_failed", context });
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
      downloadBlobAsFile(blob, "red-rocks-live-pulse-story-card.png");
      trackShareArtifact({ artifactType: "live-pulse", action: "download_success", context });
      setStatus("downloaded");
    } catch {
      trackShareArtifact({ artifactType: "live-pulse", action: "download_failed", context });
      setStatus("download failed");
    }
  }

  async function onShare() {
    const text = feed?.items.length
      ? feed.items.slice(0, 3).map((item) => `${item.title} (${item.confidence})`).join("\n")
      : "Live Pulse updates are refreshing now.";

    const blob = await generateCardBlob();
    if (blob) {
      const didShareFile = await shareBlobAsFile({
        blob,
        filename: "red-rocks-live-pulse-story-card.png",
        title,
        text,
        url: pageUrl,
      });

      if (didShareFile) {
        trackShareArtifact({ artifactType: "live-pulse", action: "share_success", context });
        setStatus("shared");
        return;
      }
    }

    const result = await shareOrCopyArtifact({
      title,
      text,
      url: pageUrl,
      artifactType: "live-pulse",
      context,
    });
    if (result === "failed") {
      trackShareArtifact({ artifactType: "live-pulse", action: "share_failed", context });
    }
    setStatus(result);
  }

  return (
    <section className="space-y-3">
      <StoryArtifactFrame title={title} subtitle={subtitle} timestamp={timestamp} heroImage={heroImage}>
        {feed?.items.length ? (
          feed.items.slice(0, 3).map((item) => (
            <p key={item.id} className="text-sm text-zinc-100">
              • {item.title} · {item.confidence} confidence · {item.corroborationCount} reports
            </p>
          ))
        ) : (
          <p className="text-sm text-zinc-200">Live Pulse updates are refreshing now.</p>
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
