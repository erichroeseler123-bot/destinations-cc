import type { Metadata } from "next";
import Link from "next/link";
import { HERO_IMAGE } from "@/lib/images";
import { LfseInquiryForm } from "@/components/LfseInquiryForm";
import { TrustDisclosure } from "@/components/TrustDisclosure";

export const metadata: Metadata = {
  title: "Alaska Multi-Cabin & Port Logistics Inquiry",
  description:
    "Contact Last Frontier Shore Excursions for multi-cabin group planning, Ward Cove / AJ Dock transfer timing checks, and cruise-safe Alaska excursion comparisons.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="shell" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--line)", aspectRatio: "21 / 9", maxHeight: 300, marginBottom: 28, background: "#eef5f6" }}>
        <img
          src={HERO_IMAGE.url}
          alt={HERO_IMAGE.alt}
          width={1600}
          height={900}
          loading="eager"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <p className="eyebrow" style={{ color: "var(--muted)" }}>Concierge &amp; Port Window Desk</p>
      <h1>Alaska Multi-Cabin &amp; Port Logistics Inquiry</h1>
      <p className="lead" style={{ maxWidth: 820 }}>
        Coordinating multiple cabins across Juneau, Skagway, Ketchikan, Sitka, or Icy Strait Point? Share your ship schedule and party size below for human planning guidance on dock shuttles, 2-hour recommended all-aboard return buffers, and verified excursion options.
      </p>

      <section className="card" style={{ marginTop: 22 }}>
        <h2>Independent Planning Boundary (Not a Cruise Line or Merchant of Record)</h2>
        <p>
          <strong>Last Frontier Shore Excursions is an independent excursion comparison and concierge guide.</strong> We are not affiliated with any cruise line, and we do not act as merchant of record or collect payment on this site. When you decide to book, you complete checkout directly with the local Alaska operator or verified booking partner (such as Viator, GetYourGuide, or FareHarbor-connected local operators), who controls live seat inventory, tickets, and cancellation terms.
        </p>
      </section>

      <LfseInquiryForm />

      <TrustDisclosure />

      <p style={{ marginTop: 28 }}>
        <Link href="/about">About &amp; Affiliate Transparency</Link> ·{" "}
        <Link href="/">← Back to Alaska shore-excursion planning</Link>
      </p>
    </main>
  );
}
