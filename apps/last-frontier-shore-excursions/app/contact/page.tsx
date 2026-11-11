import type { Metadata } from "next";
import Link from "next/link";
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
      <p className="eyebrow">Concierge &amp; Port Window Desk</p>
      <h1>Alaska Multi-Cabin &amp; Port Logistics Inquiry</h1>
      <p className="lead" style={{ maxWidth: 820 }}>
        Coordinating multiple cabins across Juneau, Skagway, Ketchikan, Sitka, or Icy Strait Point? Share your ship schedule and party size below for human planning guidance on dock shuttles, 45-minute all-aboard buffers, and verified excursion options.
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
