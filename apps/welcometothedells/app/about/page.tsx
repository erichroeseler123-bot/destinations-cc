import type { Metadata } from "next";
import Link from "next/link";
import { DCC_DELLS_URL, SITE_URL } from "@/lib/content";

export const metadata: Metadata = {
  title: "About Welcome to the Dells",
  description:
    "How Welcome to the Dells helps visitors plan river tours, Ducks, downtown stops, and group logistics across Wisconsin Dells and Lake Delton.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <main style={{ maxWidth: "56rem", margin: "0 auto", padding: "3rem 1.25rem 4rem" }}>
      <p style={{ fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.75 }}>
        Destination Command Center Network · Wisconsin Dells
      </p>
      <h1 style={{ fontSize: "2.25rem", lineHeight: 1.15, marginTop: "0.5rem" }}>
        About Welcome to the Dells
      </h1>
      <p style={{ fontSize: "1.1rem", lineHeight: 1.65, marginTop: "1rem" }}>
        Welcome to the Dells is an independent Wisconsin Dells and Lake Delton decision guide built to help
        families, couples, and vacation-rental groups solve what to do next without drowning in Parkway noise.
      </p>

      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1.35rem", marginBottom: "0.5rem" }}>What We Do</h2>
        <p style={{ lineHeight: 1.65 }}>
          We organize the Dells into three real-world movement zones—Downtown / Broadway, Wisconsin Dells Parkway
          (Hwy 12), and Lake Delton / Outskirts—and compare Upper and Lower Dells boat tours, Original Wisconsin
          Ducks, jet boat runs, rainy-day backups, and group meal logistics.
        </p>
      </section>

      <section
        style={{
          marginTop: "2rem",
          padding: "1.25rem",
          border: "1px solid rgba(148, 163, 184, 0.35)",
          borderRadius: "0.75rem",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
          Independent Guide &amp; Booking Boundary Disclosure
        </h2>
        <p style={{ lineHeight: 1.65 }}>
          Welcome to the Dells is an independent editorial and trip-routing property in the Destination Command
          Center network—not a tour boat operator, resort, municipal tourism bureau, or merchant of record.
          When you follow a ticket or activity link, reservations, live departure times, pricing, safety rules,
          cancellation terms, and payment capture are handled directly by the operating company or disclosed
          booking marketplace (such as Original Wisconsin Ducks / Dells Boat Tours ticket hubs, Feastly Spread,
          or Viator). Some outbound links carry disclosed partner or affiliate attribution at no extra cost to you.
        </p>
      </section>

      <section style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: "0.85rem" }}>
        <Link href="/boat-tours" style={{ textDecoration: "underline", fontWeight: 600 }}>
          Compare Boat Tours &amp; Ducks
        </Link>
        <Link href="/contact" style={{ textDecoration: "underline", fontWeight: 600 }}>
          Contact the Dells Trip Planning Desk
        </Link>
        <a href={DCC_DELLS_URL} style={{ textDecoration: "underline", fontWeight: 600 }}>
          Wisconsin Dells Reference on Destination Command Center
        </a>
      </section>
    </main>
  );
}
