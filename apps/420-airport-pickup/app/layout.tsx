import type { Metadata } from "next";
import { buildOperatorServiceJsonLd } from "@/lib/schema";
import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://420friendlyairportpickup.com"),
  title: "420 Friendly Airport Pickup | Denver Airport Rides",
  description:
    "Book Denver airport rides with either a standard private pickup or a 420-friendly arrival that includes the dispensary stop in the plan.",
};

const operatorJsonLd = buildOperatorServiceJsonLd("https://420friendlyairportpickup.com", {
  business: {
    name: "420 Friendly Airport Pickup",
    description: "Denver airport pickup site for private arrivals, dispensary-stop rides, and direct transportation planning after landing.",
    areaServed: [
      { "@type": "City", name: "Denver" },
      { "@type": "AdministrativeArea", name: "Colorado Front Range" },
    ],
  },
  service: {
    name: "Denver airport pickup booking",
    description: "Airport pickup, dispensary-stop rides, and direct Denver arrival transportation with clear package options and checkout.",
    areaServed: [
      { "@type": "City", name: "Denver" },
      { "@type": "AdministrativeArea", name: "Colorado Front Range" },
    ],
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(operatorJsonLd) }}
        />
        <div className="site-root">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
