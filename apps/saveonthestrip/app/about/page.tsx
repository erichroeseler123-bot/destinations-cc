import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Save On The Strip",
  description:
    "What Save On The Strip is for, how to use it, and how it helps travelers make faster Vegas decisions.",
  alternates: { canonical: "https://saveonthestrip.com/about" },
  openGraph: {
    title: "About Save On The Strip",
    description:
      "Learn how Save On The Strip helps travelers sort through Vegas shows, tours, deals, and practical hotel moves faster.",
    url: "https://saveonthestrip.com/about",
    type: "article",
  },
};

export default function AboutPage() {
  return (
    <main style={{ display: "grid", gap: 20 }}>
      <section className="panel">
        <div className="eyebrow">About Save On The Strip</div>
        <div style={{ height: 10 }} />
        <h2>Vegas help that gets to the point</h2>
        <p>
          Save On The Strip is built to help travelers sort through Vegas shows, day trips, and
          practical deals faster. The goal is simple: make it easier to pick a good night out or a
          worthwhile day trip without bouncing through ten low-value pages first.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <div className="eyebrow">What you will find here</div>
          <ul className="list">
            <li>Vegas show picks and ticket routes</li>
            <li>Grand Canyon and Hoover Dam day-trip ideas</li>
            <li>Deals, free ticket pickup angles, and quick local help</li>
            <li>Lower-friction options for short stays</li>
          </ul>
        </article>
        <article className="card">
          <div className="eyebrow">How to use it</div>
          <ul className="list">
            <li>Start with shows if you want a strong night plan</li>
            <li>Start with tours if you want one big outing from Vegas</li>
            <li>Use featured picks when you want the fastest answer</li>
            <li>Use the wider lists when you want to compare options</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
