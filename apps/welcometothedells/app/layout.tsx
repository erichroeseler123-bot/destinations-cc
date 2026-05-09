import type { Metadata } from "next";
import { ACTION_CARDS, HUBS, SITE_URL } from "@/lib/content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Welcome to the Dells | Wisconsin Dells Decision Surface",
  description:
    "A DCC satellite decision surface for Wisconsin Dells: River Ops first, Feastly food drops for rental-house groups, and fallback inventory only when needed.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Welcome to the Dells",
    description: "Narrow the Dells plan, preserve intent, and move into Feastly or controlled operator execution.",
    url: SITE_URL,
    siteName: "Welcome to the Dells",
    type: "website",
  },
};

function JsonLd() {
  const graph = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Welcome to the Dells",
      url: SITE_URL,
      description:
        "Welcome to the Dells is the Wisconsin Dells satellite decision surface in the Destination Command Center network.",
      isPartOf: {
        "@id": "https://www.destinationcommandcenter.com/#organization",
      },
      hasPart: {
        "@id": "https://feastlyspread.com/#website",
      },
      knowsAbout: [
        "Wisconsin Dells",
        "Wisconsin Dells Parkway",
        "Downtown Wisconsin Dells",
        "Lake Delton",
        "Wisconsin Dells decision compression",
        "River Ops controlled execution",
        "Feastly owned food-drop execution",
        "family travel logistics",
      ],
      additionalProperty: [
        {
          "@type": "PropertyValue",
          name: "parent_network",
          value: "Destination Command Center",
        },
        {
          "@type": "PropertyValue",
          name: "dcc_network_role",
          value: "satellite_decision_surface",
        },
        {
          "@type": "PropertyValue",
          name: "execution_tier",
          value: "decision_surface",
        },
        {
          "@type": "PropertyValue",
          name: "continuity_contract",
          value:
            "DCC routes Dells intent; Welcome to the Dells narrows the local decision before execution handoff.",
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Welcome to the Dells",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      isPartOf: {
        "@id": "https://www.destinationcommandcenter.com/#website",
      },
      hasPart: {
        "@id": "https://feastlyspread.com/#website",
      },
      about: HUBS.map((hub) => hub.name),
    },
    {
      "@type": "WebSite",
      "@id": "https://feastlyspread.com/#website",
      name: "FeastlySpread",
      url: "https://feastlyspread.com",
      isPartOf: {
        "@id": "https://www.destinationcommandcenter.com/#website",
      },
      additionalProperty: [
        {
          "@type": "PropertyValue",
          name: "dcc_network_role",
          value: "owned_execution_operator",
        },
        {
          "@type": "PropertyValue",
          name: "execution_tier",
          value: "owned_execution",
        },
        {
          "@type": "PropertyValue",
          name: "dcc_relationship",
          value:
            "Feastly executes resolved Wisconsin Dells large-group food logistics intent from Welcome to the Dells and DCC.",
        },
      ],
    },
    {
      "@type": "ItemList",
      "@id": `${SITE_URL}/#next-stop-cards`,
      name: "Wisconsin Dells Next Stop Cards",
      itemListElement: ACTION_CARDS.map((card, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: card.title,
        description: `${card.body} Parking: ${card.parkingFriction}. Time: ${card.timeCommitment}.`,
        url: card.href,
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }),
      }}
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
          <span>Part of the Destination Command Center network.</span>
          <a href="https://www.destinationcommandcenter.com/network">Network doctrine</a>
        </footer>
      </body>
    </html>
  );
}
