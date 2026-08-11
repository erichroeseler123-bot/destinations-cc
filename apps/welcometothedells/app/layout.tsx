import type { Metadata } from "next";
import { ACTION_CARDS, HUBS, SITE_URL } from "@/lib/content";
import "./globals.css";

const DESCRIPTION =
  "Plan a Wisconsin Dells trip by what you actually want to do: boat tours, Ducks, waterparks, rainy-day activities, family plans, adult weekends, downtown, Lake Delton, and large-group options.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Welcome to the Dells | Wisconsin Dells Things to Do & Trip Planner",
    template: "%s | Welcome to the Dells",
  },
  description: DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Welcome to the Dells | Wisconsin Dells Things to Do & Trip Planner",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Welcome to the Dells",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Welcome to the Dells",
    description: DESCRIPTION,
  },
};

function JsonLd() {
  const graph = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Welcome to the Dells",
      url: SITE_URL,
      description: DESCRIPTION,
      areaServed: ["Wisconsin Dells, Wisconsin", "Lake Delton, Wisconsin"],
      isPartOf: { "@id": "https://www.destinationcommandcenter.com/#organization" },
      knowsAbout: [
        "Wisconsin Dells",
        "Things to do in Wisconsin Dells",
        "Wisconsin Dells attractions",
        "Wisconsin Dells waterparks",
        "Wisconsin Dells boat tours",
        "Original Wisconsin Ducks",
        "Wisconsin Dells rainy day activities",
        "Wisconsin Dells family trips",
        "Wisconsin Dells adults-only trips",
        "Downtown Wisconsin Dells",
        "Lake Delton",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Welcome to the Dells",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      isPartOf: { "@id": "https://www.destinationcommandcenter.com/#website" },
      about: HUBS.map((hub) => hub.name),
      inLanguage: "en-US",
    },
    {
      "@type": "ItemList",
      "@id": `${SITE_URL}/#planning-options`,
      name: "Wisconsin Dells trip-planning options",
      itemListElement: ACTION_CARDS.map((card, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: card.title,
        description: `${card.body} Parking: ${card.parkingFriction}. Time: ${card.timeCommitment}.`,
        url: card.href,
      })),
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "What should first-time visitors do in Wisconsin Dells?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A simple first trip can start with one signature river or Duck experience, one major attraction or waterpark, and enough open time for downtown or a meal without crossing town repeatedly.",
          },
        },
        {
          "@type": "Question",
          name: "What can you do in Wisconsin Dells when it rains?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Indoor waterparks, shows, arcades, indoor attractions, meals, and other low-weather-risk options can keep a Dells day useful when outdoor plans change.",
          },
        },
        {
          "@type": "Question",
          name: "Is Wisconsin Dells only for families with kids?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Adults can build a Dells trip around river scenery, dinner, nightlife, downtown, scenic stops, and a slower resort or Lake Delton stay.",
          },
        },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <JsonLd />
        {children}
        <footer className="network-footer">
          <span>Welcome to the Dells — practical Wisconsin Dells trip planning.</span>
          <a href="https://www.destinationcommandcenter.com/wisconsin-dells?utm_source=welcometothedells&utm_medium=referral&utm_campaign=dells-footer">Research Wisconsin Dells in Destination Command Center</a>
        </footer>
      </body>
    </html>
  );
}
