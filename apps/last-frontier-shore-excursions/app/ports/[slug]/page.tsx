import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PORTS, getPort } from "@/lib/ports";
import { buildViatorSearchUrl } from "@/lib/viator";

export function generateStaticParams() {
  return PORTS.map((port) => ({ slug: port.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const port = getPort(slug);
  if (!port) return {};
  return {
    title: `${port.name} Shore Excursions | Last Frontier Shore Excursions`,
    description: `Compare ${port.name} Alaska shore excursions by experience, fit, and weather backup. Built specifically for cruise passengers with limited time in port.`,
    alternates: { canonical: `/ports/${port.slug}` },
  };
}

export default async function PortPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const port = getPort(slug);
  if (!port) notFound();

  const searches = port.searchTerms.map((term, index) => ({
    label: index === 0 ? `Browse ${port.name} excursions` : term,
    href: buildViatorSearchUrl(term, `${port.slug}-${index + 1}`),
  }));

  return (
    <main>
      <section className="port-hero">
        <div className="shell">
          <p className="eyebrow" style={{color:"#607078"}}>{port.region} · Cruise port guide</p>
          <h1>{port.name} shore excursions</h1>
          <p className="lead" style={{color:"#607078"}}>{port.hook}</p>
          <div className="cta-row">
            <a className="button" href={searches[0].href} rel="sponsored nofollow">Browse live tours</a>
            <a className="button secondary" href="#fit">Choose by fit</a>
          </div>
        </div>
      </section>

      <section className="section" id="fit">
        <div className="shell">
          <p className="eyebrow" style={{color:"#607078"}}>Best fits</p>
          <h2>What kind of Alaska day do you want?</h2>
          <div className="grid">
            {port.bestFor.map((item, index) => (
              <article className="card" key={item}>
                <h3>{item}</h3>
                <p>Use this as the anchor for the day, then compare departure time, duration, meeting point, and cancellation terms before booking.</p>
                <a className="button" href={buildViatorSearchUrl(`${port.name} ${item}`, `${port.slug}-${index + 10}`)} rel="sponsored nofollow">Compare {item.toLowerCase()}</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="rule">
            <p className="eyebrow" style={{color:"#8b4c25"}}>Weather backup</p>
            <h2 style={{marginTop:8}}>Have a second plan before Alaska chooses for you.</h2>
            <p className="lead" style={{color:"#607078"}}>{port.weatherBackup}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <p className="eyebrow" style={{color:"#607078"}}>Before booking</p>
          <h2>Four things matter more on a cruise day.</h2>
          <div className="grid">
            {[
              ["Your actual port window", "Do not use the ship's full published port time as excursion time. You still need disembarkation and return margin."],
              ["Meeting point", "Know whether the tour meets at the pier, requires a shuttle, or begins elsewhere in town."],
              ["Duration", "A shorter excellent excursion is usually better than a perfect-looking tour that leaves no recovery margin."],
              ["Cancellation terms", "Alaska weather changes plans. Read the operator's cancellation and weather policy before paying."],
            ].map(([title, copy]) => <article className="card" key={title}><h3>{title}</h3><p>{copy}</p></article>)}
          </div>
          <div className="cta-row">
            {searches.map((search) => <a className="button" href={search.href} rel="sponsored nofollow" key={search.href}>{search.label}</a>)}
          </div>
        </div>
      </section>
    </main>
  );
}
