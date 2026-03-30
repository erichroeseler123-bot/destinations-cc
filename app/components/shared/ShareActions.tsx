"use client";

import { useState } from "react";
import { getShareDefaults } from "../../../lib/socials";

type ShareActionsProps = {
  brandKey?: string;
  url: string;
  title: string;
  mode?: "compact" | "default" | "feature";
  className?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function ShareActions({
  brandKey = "dcc",
  url,
  title,
  mode = "default",
  className,
}: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const shareDefaults = getShareDefaults(brandKey);
  const hashtags = (shareDefaults.hashtags || []).join(",");
  const text = `${title}`;

  const xUrl = new URL("https://twitter.com/intent/tweet");
  xUrl.searchParams.set("url", url);
  xUrl.searchParams.set("text", text);
  if (hashtags) xUrl.searchParams.set("hashtags", hashtags);
  if (shareDefaults.xHandle) {
    xUrl.searchParams.set("via", shareDefaults.xHandle.replace(/^@/, ""));
  }

  const facebookUrl = new URL("https://www.facebook.com/sharer/sharer.php");
  facebookUrl.searchParams.set("u", url);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const shareTheme =
    brandKey === "partyatredrocks"
      ? "border-fuchsia-400/20 bg-fuchsia-400/10 text-white hover:border-fuchsia-300/35 hover:bg-fuchsia-400/15"
      : brandKey === "wta"
        ? "border-sky-300/20 bg-sky-300/10 text-slate-50 hover:border-sky-200/35 hover:bg-sky-300/15"
        : brandKey === "saveonthestrip"
          ? "border-amber-300/20 bg-amber-300/10 text-white hover:border-amber-200/35 hover:bg-amber-300/15"
          : "border-cyan-400/20 bg-cyan-400/10 text-cyan-50 hover:border-cyan-300/35 hover:bg-cyan-400/15";

  const buttonBase =
    mode === "compact"
      ? "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition duration-200"
      : mode === "feature"
        ? "inline-flex items-center rounded-full border px-4 py-2.5 text-sm font-semibold transition duration-200"
        : "inline-flex items-center rounded-full border px-3 py-2 text-sm font-semibold transition duration-200";

  return (
    <div className={cx("flex flex-wrap items-center gap-2", className)}>
      <a
        href={xUrl.toString()}
        target="_blank"
        rel="noreferrer noopener"
        className={cx(buttonBase, shareTheme)}
      >
        {mode === "feature" ? "Post ride plan" : "Share on X"}
      </a>

      <a
        href={facebookUrl.toString()}
        target="_blank"
        rel="noreferrer noopener"
        className={cx(buttonBase, shareTheme)}
      >
        {mode === "feature" ? "Send to Facebook" : "Share on Facebook"}
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className={cx(buttonBase, shareTheme)}
      >
        {copied ? "Copied" : mode === "feature" ? "Copy route link" : "Copy link"}
      </button>
    </div>
  );
}
