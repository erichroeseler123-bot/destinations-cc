import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Las Vegas Travel Hub",
  description: "Timing-first Vegas planning page with connected route layers.",
  alternates: { canonical: "/vegas" },
};

export default function VegasPage() {
  return (
    <main>
      <div className="wrap" style={{ display: "grid", gap: 16 }}>
        <p className="badge">DCC Destination Layer</p>
        <h1>Las Vegas</h1>
        <p>Shows, nightlife, transfer timing, and route pairings.</p>
        <div className="grid grid-2">
          <Link className="card" href="/mighty-argo-shuttle">Argo Shuttle Layer</Link>
          <Link className="card" href="/alaska">Alaska Layer</Link>
          <Link className="card" href="/cruises">Cruises Layer</Link>
          <Link className="card" href="/national-parks">National Parks Map</Link>
          <Link className="card" href="/new-orleans">New Orleans Layer</Link>
        </div>
      </div>
    </main>
  );
}
