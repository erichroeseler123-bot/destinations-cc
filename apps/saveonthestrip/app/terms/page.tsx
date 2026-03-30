import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms | Save On The Strip",
  description:
    "Terms for using Save On The Strip, including planning content, handoff routes, and site usage expectations.",
  alternates: { canonical: "https://saveonthestrip.com/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main style={{ display: "grid", gap: 20 }}>
      <section className="panel">
        <div className="eyebrow">Legal</div>
        <div style={{ height: 10 }} />
        <h2>Terms of use</h2>
        <p>
          Save On The Strip is a planning and routing site. Offer details, ticket availability, tour inventory, and hotel information can change quickly, so users should confirm final terms on the connected booking or provider site before purchase.
        </p>
        <p>
          Some links on this site route into connected external sites. Those sites may have separate policies, terms, and booking conditions.
        </p>
      </section>
    </main>
  );
}
