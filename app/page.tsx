import type { Metadata } from "next";
import { headers } from "next/headers";
import NewOrleansToursPage from "@/app/new-orleans/tours/page";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/dcc/jsonld";
import MasterRadarTerminal from "@/components/MasterRadarTerminal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: SITE_IDENTITY.homepageTitle,
  description: SITE_IDENTITY.homepageDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_IDENTITY.name,
    description: SITE_IDENTITY.homepageDescription,
    url: SITE_IDENTITY.siteUrl,
    type: "website",
  },
};

function isWelcomeToNewOrleansToursHost(host: string) {
  const normalized = host.toLowerCase().split(":")[0] || "";
  return normalized === "welcometoneworleanstours.com" || normalized === "www.welcometoneworleanstours.com";
}

async function getRequestHost() {
  try {
    const requestHeaders = await headers();

    return (
      requestHeaders.get("x-forwarded-host") ||
      requestHeaders.get("host") ||
      ""
    );
  } catch {
    return "";
  }
}

export default async function HomePage() {
  const host = await getRequestHost();

  if (isWelcomeToNewOrleansToursHost(host)) {
    return <NewOrleansToursPage />;
  }

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [buildOrganizationJsonLd(), buildWebsiteJsonLd()],
        }}
      />
      <MasterRadarTerminal />
    </>
  );
}
