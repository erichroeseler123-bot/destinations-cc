import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Idaho Springs, Colorado | Destination Command Center",
  description:
    "Idaho Springs hub: access points, timing buffers, weather realities, and links to major routes like the Mighty Argo Gondola.",
};

export default function IdahoSpringsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Idaho Springs Hub
        </h1>
        <p className="mt-4 text-zinc-300 max-w-2xl">
          This is the staging area for Clear Creek corridor logistics: buffers,
          road conditions, pickup patterns, and route links.
        </p>

        <div className="mt-10 grid gap-4">
          <Link
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 hover:bg-white/10 transition"
            href="/mighty-argo-shuttle"
          >
            <div className="font-semibold">Argo cable car shuttle + mine tour logistics</div>
            <div className="text-sm text-zinc-300">Idaho Springs attraction guide with Denver transport options →</div>
          </Link>

          <Link
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 hover:bg-white/10 transition"
            href="/cities/denver"
          >
            <div className="font-semibold">Denver Origin Hub</div>
            <div className="text-sm text-zinc-300">Where most routes start →</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
