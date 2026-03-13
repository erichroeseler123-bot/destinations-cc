import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "New Orleans Travel Hub",
  description: "Timing-first New Orleans authority page connected to other destination layers.",
  alternates: { canonical: "/new-orleans" },
};

export default function NewOrleansPage() {
  return (
    <main>
      <div className="wrap" style={{ display: "grid", gap: 16 }}>
        <p className="badge">DCC Destination Layer</p>
        <h1>New Orleans</h1>
        <p>Music, food, and logistics planning without itinerary chaos.</p>
        <div className="grid grid-2">
          <Link className="card" href="/mighty-argo-shuttle">Argo Shuttle Layer</Link>
          <Link className="card" href="/vegas">Vegas Layer</Link>
          <Link className="card" href="/alaska">Alaska Layer</Link>
          <Link className="card" href="/cruises">Cruises Layer</Link>
          <Link className="card" href="/national-parks">National Parks Map</Link>
        </div>
      </div>
    </main>
  );
}
