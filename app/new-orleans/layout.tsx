import { Suspense } from "react";
import { Playfair_Display, Pinyon_Script } from 'next/font/google';
import type { Metadata } from "next";
import JsonLd from "@/app/components/dcc/JsonLd";
import { HeaderNav, FooterNav } from "./components/MarketplaceNavigation";
import WnoFunnelTracker from "./components/WnoFunnelTracker";
import ContextualPlanningPaths from "./components/ContextualPlanningPaths";
import WnoMobileConversionMount from "./components/WnoMobileConversionMount";
import { buildWnoSiteGraph } from "./lib/structuredData";
import siteTheme from "./components/siteWideTheme.module.css";

const newOrleansDisplayFont = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-new-orleans-display',
});

const newOrleansScriptFont = Pinyon_Script({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-new-orleans-script',
});

const socialDescription = "Welcome to New Orleans Tours helps visitors choose curated local experiences with timely recommendations, personal planning help, and direct booking when they are ready.";

export const metadata: Metadata = {
  metadataBase: new URL("https://welcometoneworleanstours.com"),
  applicationName: "Welcome to New Orleans Tours",
  title: {
    default: "Welcome to New Orleans Tours | Find the Right New Orleans Experience",
    template: "%s | Welcome to New Orleans Tours",
  },
  openGraph: {
    title: "Welcome to New Orleans Tours | Find the Right New Orleans Experience",
    description: socialDescription,
    url: "https://welcometoneworleanstours.com",
    siteName: "Welcome to New Orleans Tours",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Welcome to New Orleans Tours | Find the Right New Orleans Experience",
    description: socialDescription,
  },
  verification: {
    google: process.env.WTONOT_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function NewOrleansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${siteTheme.siteShell} flex flex-col min-h-screen ${newOrleansDisplayFont.variable} ${newOrleansScriptFont.variable}`}>
      <JsonLd data={buildWnoSiteGraph()} />
      <WnoFunnelTracker />
      <HeaderNav />
      <main className={`${siteTheme.pageWash} flex-1 w-full relative`}>
        {children}
      </main>
      <ContextualPlanningPaths />
      <FooterNav />
      <Suspense fallback={null}>
        <WnoMobileConversionMount />
      </Suspense>
    </div>
  );
}