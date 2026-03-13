import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "National Parks Layer",
  description:
    "National Parks as a DCC cross-network layer spanning authority, discovery, monetized, and intelligence workflows.",
  alternates: { canonical: "/national-parks" },
};

const PARKS = [
  { name: "Rocky Mountain", left: "58%", top: "38%" },
  { name: "Zion", left: "45%", top: "51%" },
  { name: "Grand Canyon", left: "43%", top: "61%" },
  { name: "Denali", left: "19%", top: "20%" }
];

export default function ParksPage() {
  return (
    <main>
      <div className="wrap" style={{ display: "grid", gap: 16 }}>
        <p className="badge">DCC Map Layer</p>
        <h1>National Parks</h1>
        <div className="card">
          <h2>Cross-Network Role</h2>
          <p>
            This page is part of the full DCC system, not an isolated section. It ties together Authority,
            Discovery, Monetized, and Intelligence flows.
          </p>
        </div>
        <div className="card">
          <h2>Map Layer v1</h2>
          <div style={{ position: "relative", height: 360, borderRadius: 14, border: "1px solid #27272a", marginTop: 12, background: "linear-gradient(135deg,#0f172a,#1f2937)" }}>
            {PARKS.map((p) => (
              <div key={p.name} style={{ position: "absolute", left: p.left, top: p.top, transform: "translate(-50%,-50%)" }}>
                <div style={{ width: 10, height: 10, borderRadius: 999, background: "#6ee7b7" }} />
                <div style={{ marginTop: 4, fontSize: 12, background: "rgba(0,0,0,0.7)", padding: "4px 6px", borderRadius: 8 }}>{p.name}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-2">
          <Link className="card" href="/mighty-argo-shuttle">Argo Shuttle Layer</Link>
          <Link className="card" href="/vegas">Vegas Layer</Link>
          <Link className="card" href="/alaska">Alaska Layer</Link>
          <Link className="card" href="/cruises">Cruises Layer</Link>
          <Link className="card" href="/new-orleans">New Orleans Layer</Link>
        </div>
      </div>
    </main>
  );
}
