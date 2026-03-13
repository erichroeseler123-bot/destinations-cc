import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mighty Argo Cable Car Shuttle Tickets",
  description: "Book shuttle options from Denver to Idaho Springs for the Argo Mine and cable car.",
  alternates: { canonical: "/mighty-argo-shuttle" },
};

export default function ArgoPage() {
  return (
    <main>
      <div className="wrap" style={{ display: "grid", gap: 16 }}>
        <p className="badge">DCC Colorado Micro-Route</p>
        <h1>Mighty Argo Cable Car Shuttle Tickets</h1>
        <p>Decision-first transportation page: Denver to Idaho Springs with clean timing and pickup flow.</p>
        <div className="row">
          <Link className="cta primary" href="/book?route=argo&product=argo-seat">Book Seat Shuttle - $59</Link>
          <Link className="cta" href="/book?route=argo&product=argo-suv">Book Private SUV - $499</Link>
        </div>
        <section className="card">
          <h2>Linked Authority Pages</h2>
          <div className="grid grid-2" style={{ marginTop: 12 }}>
            <Link className="card" href="/vegas">Vegas Layer</Link>
            <Link className="card" href="/alaska">Alaska Layer</Link>
            <Link className="card" href="/cruises">Cruises Layer</Link>
            <Link className="card" href="/national-parks">National Parks Map</Link>
            <Link className="card" href="/new-orleans">New Orleans Layer</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
