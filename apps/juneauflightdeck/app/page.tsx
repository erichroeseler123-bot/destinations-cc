import type { Metadata } from "next";
import HelicopterDispatchBoard from "./components/HelicopterDispatchBoard";

export const metadata: Metadata = {
  title: "Juneau Helicopter & Glacier Tours | Cruise-Safe Alaska Excursions",
  description:
    "Compare Juneau helicopter glacier tours, Mendenhall scenery, whale-watching backups, and cruise-safe timing before opening provider booking pages.",
  alternates: { canonical: "https://juneauflightdeck.com/" },
  openGraph: {
    title: "Juneau Helicopter & Glacier Tours",
    description:
      "Compare glacier flights, Mendenhall scenery, whale-watching backups, and cruise-safe timing for a Juneau shore day.",
    url: "https://juneauflightdeck.com/",
    type: "website",
  },
};

export default function HomePage() {
  return <HelicopterDispatchBoard portSlug="juneau" sourcePage="/" />;
}
