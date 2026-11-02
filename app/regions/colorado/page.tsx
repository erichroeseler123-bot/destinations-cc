import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const revalidate = 3600;

export const metadata: Metadata = {
  title:
    "Colorado Regional Travel Reference, Corridors & Coordinate Nodes | Destination Command Center",
  description:
    "Colorado regional travel reference connecting Denver, Red Rocks Amphitheatre, the I-70 Denver–Breckenridge mountain corridor, Idaho Springs, and live Front Range/Summit County coordinate intelligence.",
  alternates: { canonical: "https://destinationcommandcenter.com/destinations/colorado" },
  robots: { index: false, follow: true },
};

export default function ColoradoRegion() {
  permanentRedirect("/destinations/colorado");
}
