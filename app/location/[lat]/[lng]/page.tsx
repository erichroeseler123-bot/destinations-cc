import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import LocationFirstHome from "@/app/components/dcc/LocationFirstHome";

const SITE_URL = "https://www.destinationcommandcenter.com";

function parseCoordinate(value: string, min: number, max: number) {
  const decoded = decodeURIComponent(value);
  if (!/^-?\d+(?:\.\d+)?$/.test(decoded)) return null;
  const number = Number(decoded);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function canonical(value: number) {
  return value.toFixed(5);
}

type PageProps = {
  params: Promise<{ lat: string; lng: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const raw = await params;
  const lat = parseCoordinate(raw.lat, -90, 90);
  const lng = parseCoordinate(raw.lng, -180, 180);
  if (lat == null || lng == null) {
    return { title: "Location not found | Destination Command Center", robots: { index: false, follow: false } };
  }

  const coordinate = `${canonical(lat)}, ${canonical(lng)}`;
  return {
    title: `${coordinate} | Destination Command Center`,
    description: `Live public location intelligence for latitude ${canonical(lat)} and longitude ${canonical(lng)}.`,
    alternates: { canonical: `/location/${canonical(lat)}/${canonical(lng)}` },
    robots: { index: false, follow: true },
  };
}

export default async function CoordinateLocationPage({ params }: PageProps) {
  const raw = await params;
  const lat = parseCoordinate(raw.lat, -90, 90);
  const lng = parseCoordinate(raw.lng, -180, 180);
  if (lat == null || lng == null) notFound();

  const canonicalLat = canonical(lat);
  const canonicalLng = canonical(lng);
  if (raw.lat !== canonicalLat || raw.lng !== canonicalLng) {
    permanentRedirect(`/location/${canonicalLat}/${canonicalLng}`);
  }

  const pageUrl = `${SITE_URL}/location/${canonicalLat}/${canonicalLng}`;
  const apiUrl = `${SITE_URL}/api/location/${canonicalLat}/${canonicalLng}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": pageUrl,
    name: `DCC location ${canonicalLat}, ${canonicalLng}`,
    url: pageUrl,
    geo: {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    },
    subjectOf: {
      "@type": "DataFeed",
      name: "Destination Command Center coordinate location data",
      url: apiUrl,
      encodingFormat: "application/json",
    },
    isPartOf: {
      "@type": "WebSite",
      name: "Destination Command Center",
      url: SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <LocationFirstHome initialCoordinates={{ lat, lng }} />
    </>
  );
}
