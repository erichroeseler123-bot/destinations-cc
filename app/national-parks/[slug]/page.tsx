import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NationalParkAuthoritySection from "@/app/components/dcc/NationalParkAuthoritySection";
import {
  getNationalParkBySlug,
  listNationalParkSlugs,
} from "@/src/data/national-parks-authority-config";

const BASE_URL = "https://destinationcommandcenter.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return listNationalParkSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const park = getNationalParkBySlug(slug);
  if (!park) return { title: "National Park" };

  const pageTitle = `${park.name} Guide | DCC National Parks`;
  const description = park.heroSummary;

  return {
    title: pageTitle,
    description,
    alternates: { canonical: `/national-parks/${park.slug}` },
    openGraph: {
      title: pageTitle,
      description,
      url: `${BASE_URL}/national-parks/${park.slug}`,
      type: "website",
    },
  };
}

export default async function NationalParkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const park = getNationalParkBySlug(slug);
  if (!park) notFound();

  const pageUrl = `${BASE_URL}/national-parks/${park.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: park.name,
        description: park.heroSummary,
      },
      {
        "@type": "TouristDestination",
        name: park.name,
        url: pageUrl,
        description: park.heroSummary,
        geo: {
          "@type": "GeoCoordinates",
          latitude: park.geo.latitude,
          longitude: park.geo.longitude,
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: park.address.addressLocality,
          addressRegion: park.address.addressRegion,
          addressCountry: park.address.addressCountry,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: park.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-6">
          <Link href="/national-parks" className="text-sm text-zinc-400 hover:text-zinc-200">
            Back to National Parks →
          </Link>
        </div>
        <NationalParkAuthoritySection park={park} />
      </div>
    </main>
  );
}
