import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Alaska Travel Hub",
  description: "Cruise-port and route logic page for Alaska planning.",
  alternates: { canonical: "/alaska" },
};

export default function AlaskaPage() {
  return (
    <main>
      <div className="wrap" style={{ display: "grid", gap: 16 }}>
        <p className="badge">DCC Region Layer</p>
        <h1>Alaska</h1>
        <p>Cruise ports, weather buffers, and day-plan constraints that actually matter.</p>
        <div className="grid grid-2">
          <Link className="card" href="/mighty-argo-shuttle">Argo Shuttle Layer</Link>
          <Link className="card" href="/vegas">Vegas Layer</Link>
          <Link className="card" href="/cruises">Cruises Layer</Link>
          <Link className="card" href="/national-parks">National Parks Map</Link>
          <Link className="card" href="/new-orleans">New Orleans Layer</Link>
        </div>
      </div>
    </main>
  );
}
