import type { Metadata } from "next";
import { buildOperatorServiceJsonLd } from "@/lib/schema";
import DccPortfolioBridge from "@/app/components/DccPortfolioBridge";
import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://420friendlyairportpickup.com"),
  title: "420-Friendly Colorado Airport Transportation",
  description: "Private Colorado airport transportation for adults 21+ from DEN and COS, with Denver, Colorado Springs, mountain transfers, and optional lawful retail-stop planning when practical.",
};

const areaServed = [
  { "@type": "City", name: "Denver" },
  { "@type": "City", name: "Colorado Springs" },
  { "@type": "AdministrativeArea", name: "Colorado" },
];

const operatorJsonLd = buildOperatorServiceJsonLd("https://420friendlyairportpickup.com", {
  business: {
    name: "420 Friendly Airport Pickup",
    description: "Private Colorado airport transportation for adults 21+ from Denver International Airport and Colorado Springs Airport, with optional lawful retail-stop planning when practical.",
    areaServed,
  },
  service: {
    name: "Private Colorado airport transportation",
    description: "Private pickup from DEN and COS with Denver, Colorado Springs, and mountain-destination transportation plus optional lawful 21+ retail-stop planning when practical.",
    areaServed,
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>
      <DccPortfolioBridge site="420-airport-pickup" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(operatorJsonLd) }} />
      <div className="site-root"><SiteHeader />{children}<SiteFooter /></div>
    </body></html>
  );
}
