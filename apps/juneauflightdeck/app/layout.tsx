import type { Metadata } from "next";
import "./globals.css";

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
      <body>
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
