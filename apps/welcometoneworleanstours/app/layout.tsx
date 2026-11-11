import { Suspense } from "react";
import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import JsonLd from "@/app/components/dcc/JsonLd";
import WnoFunnelTracker from "@/app/new-orleans/components/WnoFunnelTracker";
import WnoMobileConversionMount from "@/app/new-orleans/components/WnoMobileConversionMount";
import FareHarborLightframeLoader from "@/app/new-orleans/components/FareHarborLightframeLoader";
import { buildWnoSiteGraph } from "@/app/new-orleans/lib/structuredData";
import "../../../app/globals.css";
import "./wno-recovery.css";
import "./wno-v2.css";
import "./wno-current-colors.css";
import "./wno-page-identity.css";
import "./wno-category-layouts.css";
import "./wno-home-black-gold.css";
import "./wno-freeze-fixes.css";
import "./wno-exact-surfaces.css";
import "./wno-remake.css";
import "@/app/new-orleans/data/truthLayerRuntime";
import { WnoPublicHeader, WnoPublicFooter } from "./components/WnoPublicShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.welcometoneworleanstours.com"),
  title: {
    default: "Welcome to New Orleans Tours | Bayou, French Quarter, Jazz & History",
    template: "%s",
  },
  description:
    "Browse curated New Orleans swamp tours, French Quarter walks, live jazz steamboats, food tours, and historic River Road plantations with clear pickup and direct booking.",
  openGraph: {
    siteName: "Welcome to New Orleans Tours",
    type: "website",
  },
  verification: {
    google: process.env.WTONOT_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

const isProduction = process.env.VERCEL_ENV === "production";
const gaId = isProduction ? "G-MD9WE039CB" : undefined;

if (isProduction && !gaId) {
  throw new Error(
    "Analytics Deployment Failure: Missing NEXT_PUBLIC_GA_MEASUREMENT_ID"
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="wno-build-commit" content="918493a6" />
        <link rel="preconnect" href="https://fareharbor.com" />
        <link rel="dns-prefetch" href="//fareharbor.com" />
      </head>
      <body>
        <div className="flex flex-col min-h-screen">
          <JsonLd data={buildWnoSiteGraph()} />
          <FareHarborLightframeLoader />
          <WnoFunnelTracker />
          <WnoPublicHeader />
          <main id="wno-main-content" className="flex-1 w-full relative">
            {children}
          </main>
          <WnoPublicFooter />
          <Suspense fallback={null}>
            <WnoMobileConversionMount />
          </Suspense>
        </div>
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
