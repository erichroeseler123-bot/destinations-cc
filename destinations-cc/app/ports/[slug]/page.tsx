import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";

/* -----------------------------
   Types
----------------------------- */

type Neighbor = {
  slug: string;
  name: string;
  distance_km: number;
};

type Port = {
  slug: string;
  name: string;
  city: string;
  region: string;
  country: string;
  iso_country: string;
  lat: number;
  lng: number;
  dock_notes?: string;
  seasonal_notes?: string;
  passenger_volume?: number;
  volume_year?: number;
  primary_type?: string;
  itinerary_role?: string;
  tags: string[];
  sources: string[];
  neighbors: Neighbor[];
};

/* -----------------------------
   Static rendering (important)
----------------------------- */

export const dynamic = "force-static";

/* -----------------------------
   Data loader
----------------------------- */

function getAllPorts(): Port[] {
  const filePath = path.join(
    process.cwd(),
    "data",
    "ports.generated.json"
  );

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

/* -----------------------------
   Page
----------------------------- */

export default function PortPage({
  params,
}: {
  params: { slug: string };
}) {
  const ports = getAllPorts();
  const port = ports.find((p) => p.slug === params.slug);

  if (!port) return notFound();

  /* -----------------------------
     Schema.org (JSON-LD)
  ----------------------------- */

  const portSchema = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "name": port.name,
    "description": `${port.name} cruise port in ${port.city}, ${port.region}, ${port.country}.`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": port.city,
      "addressRegion": port.region,
      "addressCountry": port.country,
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": port.lat,
      "longitude": port.lng,
    },
    "keywords": port.tags?.join(", "),
    "touristType": "Cruise passengers",
  };

  /* -----------------------------
     Render
  ----------------------------- */

  return (
    <main className="min-h-screen bg-black text-white px-6 py-20 max-w-4xl mx-auto">

      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(portSchema),
        }}
      />

      {/* Header */}
      <h1 className="text-4xl font-bold mb-2">
        {port.name}
      </h1>

      <p className="text-zinc-300 mb-8">
        {port.city}, {port.region}, {port.country}
      </p>

      {/* Port Details */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Port Details</h2>
        <ul className="list-disc list-inside text-zinc-200 space-y-1">
          <li>Latitude: {port.lat}</li>
          <li>Longitude: {port.lng}</li>
          {port.primary_type && <li>Type: {port.primary_type}</li>}
          {port.itinerary_role && <li>Itinerary Role: {port.itinerary_role}</li>}
        </ul>
      </section>

      {/* Dock & Seasonal Notes */}
      {(port.dock_notes || port.seasonal_notes) && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Dock & Seasonal Notes</h2>
          {port.dock_notes && (
            <p className="mb-2 text-zinc-200">{port.dock_notes}</p>
          )}
          {port.seasonal_notes && (
            <p className="text-zinc-200">{port.seasonal_notes}</p>
          )}
        </section>
      )}

      {/* Passenger Volume */}
      {port.passenger_volume && port.volume_year && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Passenger Volume</h2>
          <p className="text-zinc-200">
            {port.passenger_volume.toLocaleString()} passengers ({port.volume_year})
          </p>
        </section>
      )}

      {/* Nearby Ports */}
      {port.neighbors?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Nearby Ports</h2>
          <ul className="list-disc list-inside space-y-1">
            {port.neighbors.map((n) => (
              <li key={n.slug}>
                <Link
                  href={`/ports/${n.slug}`}
                  className="text-blue-400 hover:underline"
                >
                  {n.name}
                </Link>{" "}
                ({Math.round(n.distance_km)} km)
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sources */}
      {port.sources?.length > 0 && (
        <footer className="text-sm text-zinc-400">
          Sources: {port.sources.join(", ")}
        </footer>
      )}

    </main>
  );
}
