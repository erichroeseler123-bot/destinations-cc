import type { Metadata } from "next";
import "./globals.css";

const GETYOURGUIDE_PARTNER_ID = process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID || "F2MMUUH";

export const metadata: Metadata = {
  title: "Juneau Flight Deck",
  description:
    "Date-first Juneau helicopter tours with fast Viator partner booking links for your cruise day.",
  alternates: { canonical: "https://juneauflightdeck.com/" },
  openGraph: {
    title: "Juneau Flight Deck",
    description:
      "Date-first Juneau helicopter tours with fast booking links for your exact cruise day.",
    url: "https://juneauflightdeck.com/",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          async
          defer
          src="https://widget.getyourguide.com/dist/pa.umd.production.min.js"
          data-gyg-partner-id={GETYOURGUIDE_PARTNER_ID}
        />
      </head>
      <body>
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
