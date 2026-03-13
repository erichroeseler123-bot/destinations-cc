import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cruise Explorer",
  description: "Cruise-focused authority page linked to destination layers.",
  alternates: { canonical: "/cruises" },
};

export default function CruisesPage() {
  return (
    <main>
      <div className="wrap" style={{ display: "grid", gap: 16 }}>
        <p className="badge">DCC Cruise Layer</p>
        <h1>Cruise Explorer</h1>
        <p>Port and ship planning with linked authority pages for destination context.</p>
        <div className="grid grid-2">
          <Link className="card" href="/mighty-argo-shuttle">Argo Shuttle Layer</Link>
          <Link className="card" href="/vegas">Vegas Layer</Link>
          <Link className="card" href="/alaska">Alaska Layer</Link>
          <Link className="card" href="/national-parks">National Parks Map</Link>
          <Link className="card" href="/new-orleans">New Orleans Layer</Link>
        </div>
      </div>
    </main>
  );
}
