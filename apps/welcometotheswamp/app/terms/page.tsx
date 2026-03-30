import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms | Welcome to the Swamp",
  description: "Terms for using Welcome to the Swamp.",
  alternates: { canonical: "https://welcometotheswamp.com/terms" },
};

export default function TermsPage() {
  return (
    <main className="page-stack">
      <section className="panel prose-panel">
        <p className="eyebrow">Terms</p>
        <h1>Terms</h1>
        <p>
          The content on this site is for general travel-planning guidance. Wildlife sightings, conditions, weather, and operator details can change. Verify critical facts before making non-refundable plans.
        </p>
        <p>
          External booking, product, and availability surfaces are provided by third parties or Destination Command Center. Those downstream surfaces may have their own terms and policies.
        </p>
      </section>
    </main>
  );
}
