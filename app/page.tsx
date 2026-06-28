import type { Metadata } from "next";
import { headers } from "next/headers";
import NewOrleansToursPage from "@/app/new-orleans/tours/page";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import DestinationSearch from "@/app/components/DestinationSearch";

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
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-gray-900">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl uppercase">
          Destination Command Center
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Travel decisions, routed correctly.
        </p>
      </div>
      <DestinationSearch />
    </main>
  );
}
