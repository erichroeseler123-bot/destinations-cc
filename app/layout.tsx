// app/layout.tsx
import type { Metadata } from "next";
import './globals.css';
import DccRootShell from "@/app/components/dcc/DccRootShell";
import { getGetYourGuidePublicConfig } from "@/lib/getyourguide/config";
import { SITE_IDENTITY } from "@/src/data/site-identity";

const headingFont = { variable: "font-var-heading" };
const accentFont = { variable: "font-var-accent" };
const sansFont = { variable: "font-var-sans" };
const monoFont = { variable: "font-var-mono" };

const GA_MEASUREMENT_ID = "G-S6JEJVWVDT";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_IDENTITY.siteUrl),
  applicationName: SITE_IDENTITY.name,
  title: SITE_IDENTITY.homepageTitle,
  description: SITE_IDENTITY.canonicalDescription,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    siteName: SITE_IDENTITY.name,
    type: "website",
    locale: "en_US",
    url: SITE_IDENTITY.siteUrl,
    title: SITE_IDENTITY.homepageTitle,
    description: SITE_IDENTITY.homepageDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_IDENTITY.homepageTitle,
    description: SITE_IDENTITY.homepageDescription,
  },
  category: "travel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { partnerId: gygPartnerId } = getGetYourGuidePublicConfig();

  return (
    <html lang="en">
      <head>
        <link rel="alternate" type="application/json" href="/agent.json" />
        <link rel="alternate" type="text/plain" href="/llms.txt" />
      </head>
      <body className={`${headingFont.variable} ${accentFont.variable} ${sansFont.variable} ${monoFont.variable}`}>
        <DccRootShell
          gaMeasurementId={GA_MEASUREMENT_ID}
          gygPartnerId={gygPartnerId}
        >
          {children}
        </DccRootShell>
      </body>
    </html>
  );
}
