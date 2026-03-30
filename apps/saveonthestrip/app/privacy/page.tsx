import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Save On The Strip",
  description:
    "Privacy details for Save On The Strip, including analytics, help-request submissions, and connected-site handoff context.",
  alternates: { canonical: "https://saveonthestrip.com/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main style={{ display: "grid", gap: 20 }}>
      <section className="panel">
        <div className="eyebrow">Legal</div>
        <div style={{ height: 10 }} />
        <h2>Privacy policy</h2>
        <p>
          Save On The Strip may collect standard analytics data, basic routing context, and request details when you browse the site or ask for help with Vegas plans, deals, tours, or timeshare-related questions.
        </p>
        <p>
          If you move from Save On The Strip into connected sites, Destination Command Center may receive attribution and lifecycle event data so the network can understand which pages and offers are actually useful.
        </p>
      </section>

      <section className="card">
        <div className="eyebrow">What this includes</div>
        <ul className="list">
          <li>Page views, referral context, and general device or browser information</li>
          <li>Optional lead or help-request details you submit</li>
          <li>Clickout and handoff context to connected sites</li>
        </ul>
      </section>
    </main>
  );
}
