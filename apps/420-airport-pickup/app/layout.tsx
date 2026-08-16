import type { Metadata } from "next";
import { buildOperatorServiceJsonLd } from "@/lib/schema";
import DccPortfolioBridge from "@/app/components/DccPortfolioBridge";
import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://420friendlyairportpickup.com"),
  title: "Private Denver Airport Pickup for 21+ Travelers",
  description: "Private DEN arrival transportation for adults 21+, including direct hotel pickup, optional dispensary-stop planning, and onward Colorado transportation guidance.",
};

const operatorJsonLd = buildOperatorServiceJsonLd("https://420friendlyairportpickup.com", {
  business: { name: "420 Friendly Airport Pickup", description: "Private Denver airport arrival transportation for adults 21+, with direct rides, optional retail-stop planning, and onward Colorado transportation guidance.", areaServed: [{ "@type": "City", name: "Denver" }, { "@type": "AdministrativeArea", name: "Colorado Front Range" }] },
  service: { name: "Private Denver airport arrival service", description: "Private pickup from Denver International Airport with direct Denver drop-off and optional lawful 21+ retail-stop planning.", areaServed: [{ "@type": "City", name: "Denver" }, { "@type": "AdministrativeArea", name: "Colorado Front Range" }] },
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
