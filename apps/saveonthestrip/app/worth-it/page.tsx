import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What Is Worth It in Las Vegas? | Save On The Strip",
  description: "A practical Vegas worth-it filter for shows, tours, hotels, upgrades, and attractions before you spend.",
  alternates: { canonical: "https://saveonthestrip.com/worth-it" },
};

const filters = [
  { title: "Would you remember it tomorrow?", copy: "If the answer is no, it probably does not deserve premium Vegas pricing." },
  { title: "Can you get the same feeling free?", copy: "Use Bellagio, Fremont, the Strip, and other free wins before buying a weaker paid substitute." },
  { title: "Does it solve the right part of the trip?", copy: "A great show does not fix a daytime problem, and another attraction does not fix a bad hotel location." },
  { title: "Is the upgrade actually meaningful?", copy: "Pay more when the upgrade changes the experience, not just because the checkout page offers it." },
] as const;

export default function WorthItPage() {
  return (
    <main>
      <section className="hero">
        <div className="eyebrow">Vegas value filter</div>
        <h1>IS IT ACTUALLY WORTH IT?</h1>
        <p className="lead">Vegas is very good at making optional spending feel mandatory. Run the purchase through four questions first.</p>
      </section>

      <section className="panel panel-tight">
        <div className="value-prop-grid">
          {filters.map((item) => (
            <article className="value-prop-card" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="eyebrow">Spend on purpose</div>
        <h2>Put the filter to work.</h2>
        <div className="grid">
          <Link href="/shows" className="card"><div className="eyebrow">Shows</div><h2>Which night deserves a ticket?</h2><p>Compare the actual entertainment before paying premium prices.</p></Link>
          <Link href="/tours" className="card"><div className="eyebrow">Tours</div><h2>Is leaving the Strip worth a day?</h2><p>Use a big outing when it changes the trip enough to justify the time and money.</p></Link>
          <Link href="/hotels" className="card"><div className="eyebrow">Hotels</div><h2>Does the hotel move improve the trip?</h2><p>Location, renovation status, and friction can matter more than another room upgrade.</p></Link>
          <Link href="/free-things" className="card"><div className="eyebrow">Free</div><h2>What can you get for $0?</h2><p>Check the free version of Vegas before buying filler.</p></Link>
        </div>
      </section>
    </main>
  );
}
