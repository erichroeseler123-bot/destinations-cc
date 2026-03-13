export type ShareArtifactType = "weekend" | "live-pulse" | "next48";

type ShareEventPayload = {
  artifactType: ShareArtifactType;
  action:
    | "open"
    | "toggle"
    | "generate_start"
    | "generate_success"
    | "generate_failed"
    | "download_success"
    | "download_failed"
    | "share_success"
    | "share_failed"
    | "share_link_success"
    | "copy";
  context: string;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackShareArtifact(payload: ShareEventPayload): void {
  if (typeof window === "undefined") return;
  const event = {
    event: "dcc_share_artifact",
    ...payload,
    timestamp: new Date().toISOString(),
  };

  window.dispatchEvent(new CustomEvent("dcc:share-artifact", { detail: event }));
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(event);
  }
}

export async function shareOrCopyArtifact(options: {
  title: string;
  text: string;
  url: string;
  artifactType: ShareArtifactType;
  context: string;
}): Promise<"shared" | "copied" | "failed"> {
  const { title, text, url, artifactType, context } = options;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title, text, url });
      trackShareArtifact({ artifactType, action: "share_link_success", context });
      return "shared";
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
      trackShareArtifact({ artifactType, action: "copy", context });
      return "copied";
    }
  } catch {
    return "failed";
  }

  return "failed";
}
