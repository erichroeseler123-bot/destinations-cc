import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import DenseLocationView from "@/app/components/dcc/DenseLocationView";
import { logDiscoveryRequest } from "@/lib/dcc/discoveryTelemetry";
import { canonicalCoordinate, getDiscoverableLocation, isIndexableCoordinate } from "@/lib/dcc/locationDiscovery";

const SITE_URL = "https://www.destinationcommandcenter.com";

function parseCoordinate(value: string, min: number, max: number) {
  const decoded = decodeURIComponent(value);
  if (!/^-?\d+(?:\.\d+)?$/.test(decoded)) return null;
  const number = Number(decoded);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
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

  const known = getDiscoverableLocation(lat, lng);
  const indexable = isIndexableCoordinate(lat, lng);
  const coordinate = `${canonicalCoordinate(lat)}, ${canonicalCoordinate(lng)}`;
  const label = known?.name || coordinate;

  return {
    title: `${label} | Destination Command Center`,
    description: known
      ? `Dense public location intelligence for ${known.name}, anchored to latitude ${canonicalCoordinate(lat)} and longitude ${canonicalCoordinate(lng)}.`
      : `Dense public location intelligence for latitude ${canonicalCoordinate(lat)} and longitude ${canonicalCoordinate(lng)}.`,
    alternates: { canonical: `/location/${canonicalCoordinate(lat)}/${canonicalCoordinate(lng)}` },
    robots: { index: indexable, follow: true },
  };
}

export default async function CoordinateLocationPage({ params }: PageProps) {
  const raw = await params;
  const lat = parseCoordinate(raw.lat, -90, 90);
  const lng = parseCoordinate(raw.lng, -180, 180);
  if (lat == null || lng == null) notFound();

  const canonicalLat = canonicalCoordinate(lat);
  const canonicalLng = canonicalCoordinate(lng);
  if (raw.lat !== canonicalLat || raw.lng !== canonicalLng) {
    permanentRedirect(`/location/${canonicalLat}/${canonicalLng}`);
  }

  const known = getDiscoverableLocation(lat, lng);
  const indexable = isIndexableCoordinate(lat, lng);
  const h = await headers();
  logDiscoveryRequest({
    surface: "location_page",
    path: `/location/${canonicalLat}/${canonicalLng}`,
    userAgent: h.get("user-agent"),
    referer: h.get("referer"),
    coordinate: `${canonicalLat},${canonicalLng}`,
    indexable,
  });

  const pageUrl = `${SITE_URL}/location/${canonicalLat}/${canonicalLng}`;
  const apiUrl = `${SITE_URL}/api/location/${canonicalLat}/${canonicalLng}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": pageUrl,
    name: known?.name || `DCC location ${canonicalLat}, ${canonicalLng}`,
    url: pageUrl,
    geo: {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    },
    subjectOf: {
      "@type": "DataFeed",
      name: "Destination Command Center dense coordinate intelligence",
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
      <DenseLocationView lat={lat} lng={lng} knownName={known?.name || null} />
    </>
  );
}
