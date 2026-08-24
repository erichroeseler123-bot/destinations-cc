import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Airboat vs Covered Swamp Boat in New Orleans",
  description:
    "This comparison now lives at Welcome to the Swamp, the specialist site for choosing between New Orleans swamp-tour formats.",
  alternates: { canonical: "https://welcometotheswamp.com/airboat-vs-boat" },
  robots: { index: false, follow: true },
};

export default function CoveredBoatVsAirboatPage() {
  permanentRedirect("https://welcometotheswamp.com/airboat-vs-boat");
  return null;
}
