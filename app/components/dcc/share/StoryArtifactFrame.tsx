"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  timestamp: string;
  children: ReactNode;
  footer?: string;
  heroImage?: string;
};

export default function StoryArtifactFrame({
  title,
  subtitle,
  timestamp,
  children,
  footer = "destinations.cc",
  heroImage,
}: Props) {
  return (
    <article className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-[linear-gradient(180deg,rgba(24,24,27,0.86),rgba(9,9,11,0.95))] shadow-[0_25px_60px_rgba(0,0,0,0.45)]">
      <div className="relative aspect-[9/16] p-5 text-white">
        {heroImage ? (
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage: `linear-gradient(180deg,rgba(0,0,0,0.45),rgba(0,0,0,0.78)),url(${heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : null}
        <header className="relative z-10 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200">{subtitle}</p>
          <h4 className="text-2xl font-black leading-tight tracking-tight">{title}</h4>
          <p className="text-xs text-zinc-300">Updated {timestamp}</p>
        </header>
        <div className="relative z-10 mt-4 h-[1px] w-full bg-white/15" />
        <div className="relative z-10 mt-4 space-y-3">{children}</div>
        <footer className="absolute bottom-6 left-5 z-10 text-[11px] text-zinc-400">{footer}</footer>
      </div>
    </article>
  );
}
