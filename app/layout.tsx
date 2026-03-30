// app/layout.tsx
import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from 'next/font/google';
import './globals.css'; // your global styles
import SiteHeader from "@/app/components/dcc/SiteHeader";
import SiteBreadcrumbs from "@/app/components/dcc/SiteBreadcrumbs";
import SiteFooter from "@/app/components/dcc/SiteFooter";
import WhatsLiveFloatingButton from "@/app/components/dcc/next48/WhatsLiveFloatingButton";
import TravelpayoutsDriveScript from "@/app/components/dcc/TravelpayoutsDriveScript";
import { getTravelpayoutsDrivePolicy } from "@/lib/travelpayouts/policy";
import { getLiveCityRegistryNodes } from "@/src/data/cities-registry";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import { SITE_CONFIG } from "@/src/data/site-config";

const headingFont = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-heading',
});

const accentFont = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-accent',
});

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
  const brandKey = SITE_CONFIG.socialBrandKey;
  const navCities = getLiveCityRegistryNodes().map((city) => ({
    slug: city.slug,
    name: city.name,
    canonicalPath: city.canonicalPath,
    state: city.state,
  }));
  const drivePolicy = getTravelpayoutsDrivePolicy();

  return (
    <html lang="en">
      <head>
        <link rel="alternate" type="application/json" href="/agent.json" />
        <link rel="alternate" type="text/plain" href="/llms.txt" />
      </head>
      <body className={`${headingFont.variable} ${accentFont.variable}`}>
        <TravelpayoutsDriveScript
          enabled={drivePolicy.enabled}
          src={drivePolicy.src}
          allowedPrefixes={drivePolicy.allowedPrefixes}
          blockedPrefixes={drivePolicy.blockedPrefixes}
        />
        <a href="#main-content" className="dcc-skip-link">
          Skip to main content
        </a>
        <SiteHeader cities={navCities} />
        <div id="main-content" className="dcc-site-shell">
          <div className="dcc-site-shell__inner">
            <SiteBreadcrumbs />
            {children}
          </div>
        </div>
        <WhatsLiveFloatingButton />
        <SiteFooter />
      </body>
    </html>
  );
}
