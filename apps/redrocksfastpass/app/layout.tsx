import type { Metadata } from "next";
import ServiceWorkerRegistration from "@/app/components/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Red Rocks Day Pass • $25 Shuttle • Union Station",
  description:
    "Book a $25 round-trip daytime shuttle from Denver Union Station to Red Rocks Park for sightseeing, hiking, and photos.",
  alternates: { canonical: "https://redrocksfastpass.com/" },
  openGraph: {
    title: "Red Rocks Day Pass • $25 Shuttle • Union Station",
    description:
      "Book a $25 round-trip daytime shuttle from Denver Union Station to Red Rocks Park for sightseeing, hiking, and photos.",
    url: "https://redrocksfastpass.com/",
    type: "website"
  }
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Red Rocks Day Pass Shuttle",
  description: "$25 round-trip shuttle from Union Station to Red Rocks Park",
  provider: {
    "@type": "LocalBusiness",
    name: "GoSno LLC",
    url: "https://gosno.co"
  },
  areaServed: {
    "@type": "City",
    name: "Denver"
  },
  offers: {
    "@type": "Offer",
    price: "25",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="alternate" type="application/json" href="/agent.json" />
        <link rel="alternate" type="text/plain" href="/llms.txt" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="RR Fast Pass" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
        />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
