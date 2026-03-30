import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TimeshareMap } from "@/app/components/TimeshareMap";
import { getVegasTimeshareResort, VEGAS_TIMESHARE_RESORTS } from "@/lib/timeshares";

type TimeshareDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return VEGAS_TIMESHARE_RESORTS.map((resort) => ({ slug: resort.slug }));
}

export async function generateMetadata({ params }: TimeshareDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resort = getVegasTimeshareResort(slug);

  if (!resort) {
    return {
      title: "Timeshare resort not found | Save On The Strip",
    };
  }

  return {
    title: `${resort.name} | Save On The Strip`,
    description: `${resort.name} location, area fit, Strip access, nearby landmarks, and map for Las Vegas travelers.`,
    alternates: {
      canonical: `https://saveonthestrip.com/timeshares/${resort.slug}`,
    },
  };
}

export default async function TimeshareDetailPage({ params }: TimeshareDetailPageProps) {
  const { slug } = await params;
  const resort = getVegasTimeshareResort(slug);

  if (!resort) {
    notFound();
  }

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <section className="panel">
        <div className="eyebrow">{resort.area}</div>
        <div style={{ height: 10 }} />
        <h1 className="detail-title">{resort.name}</h1>
        <p className="lead">
          {resort.brand} with a Las Vegas base that is best suited for {resort.bestFor.toLowerCase()}
        </p>
        <div style={{ height: 12 }} />
        <div className="cta-row">
          <Link href="/timeshares" className="button button-secondary">
            Back to all timeshares
          </Link>
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <div className="eyebrow">Location</div>
          <h2>{resort.name}</h2>
          <p>{resort.locationSummary}</p>
          <p>
            <strong>Address:</strong> {resort.address}
          </p>
          <p>
            <strong>Strip access:</strong> {resort.stripAccess}
          </p>
        </article>

        <article className="card">
          <div className="eyebrow">Nearby</div>
          <h2>What is around it</h2>
          <p>
            <strong>Best for:</strong> {resort.bestFor}
          </p>
          <p>
            <strong>Nearby landmarks:</strong> {resort.nearby.join(" • ")}
          </p>
          <ul className="list">
            {resort.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel">
        <div className="eyebrow">Map</div>
        <div style={{ height: 10 }} />
        <h2>{resort.name} in Las Vegas</h2>
        <p>
          This map is loaded with OpenStreetMap so you can quickly see where the property sits
          before deciding whether it fits your trip.
        </p>
        <div style={{ height: 16 }} />
        <TimeshareMap query={resort.mapsQuery} label={resort.name} />
      </section>
    </main>
  );
}
