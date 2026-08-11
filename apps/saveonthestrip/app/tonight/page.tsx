import type { Metadata } from "next";
import Link from "next/link";
import { getVegasWhatsLiveFeed, type Next48BucketKey } from "@/lib/whatsLive";

export const metadata: Metadata = {
  title: "What to Do in Las Vegas Tonight | Save On The Strip",
  description: "A short Vegas tonight decision board: what is happening soon, what deserves attention, and where to go next without endless scrolling.",
  alternates: { canonical: "https://saveonthestrip.com/tonight" },
};

export default async function TonightPage() {
  const feed = await getVegasWhatsLiveFeed().catch(() => null);
  const items = feed
    ? (["now", "tonight"] as Next48BucketKey[])
        .flatMap((bucket) => feed.feed.buckets[bucket] || [])
        .slice(0, 12)
    : [];

  return (
    <main>
      <section className="hero">
        <div className="eyebrow">Vegas tonight</div>
        <h1>YOU DO NOT NEED 100 OPTIONS.</h1>
        <p className="lead">Pick one strong night, leave room for Vegas to happen, and stop scrolling.</p>
        <div className="hero-actions">
          <Link href="/shows" className="button button-primary">Browse shows</Link>
          <Link href="/free-things" className="button button-secondary">Do something free first</Link>
        </div>
      </section>

      <section className="panel">
        <div className="eyebrow">Live board</div>
        <h2>What is happening soon</h2>
        <div style={{ height: 18 }} />
        {items.length ? (
          <div className="grid">
            {items.map((item) => (
              <article className="card" key={item.id}>
                <div className="eyebrow">{item.category}</div>
                <h2>{item.title}</h2>
                <p>{new Date(item.startAt).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })} • {item.venueOrArea}</p>
                <p>{item.whyItMatters}</p>
                <Link href={item.authorityCta.href} className="button button-secondary">{item.authorityCta.label}</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="card">
            <h2>The live feed is quiet.</h2>
            <p>We would rather show no live picks than pretend stale inventory is current.</p>
            <Link href="/shows" className="button button-primary">Use the show guide</Link>
          </div>
        )}
      </section>

      <section className="panel panel-tight">
        <div className="eyebrow">Fast fallback</div>
        <h2>Three ways to rescue a blank Vegas night.</h2>
        <div className="value-prop-grid">
          <article className="value-prop-card"><strong>Buy one real ticket</strong><p>Choose the show you would actually remember tomorrow.</p></article>
          <article className="value-prop-card"><strong>Use a free reset</strong><p>Bellagio, Fremont, walking the Strip, or another zero-cost move can fill the gap.</p></article>
          <article className="value-prop-card"><strong>Do less</strong><p>Dinner plus one good thing is a complete Vegas night.</p></article>
        </div>
      </section>
    </main>
  );
}
