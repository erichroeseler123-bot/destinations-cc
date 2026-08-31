import type { Metadata } from "next";
import CinematicHomepageTop from "./CinematicHomepageTop";

// Keep this app entrypoint tied to the shared New Orleans storefront so WNO production
// rebuilds when final shared presentation polish is ready to ship.
export const metadata: Metadata = {
  title: "Welcome to New Orleans Tours | Find the Right Experience",
  description: "Choose the New Orleans experience that fits your group, time, transportation, and interests, then check live operator availability.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Welcome to New Orleans Tours | Find the Right Experience",
    description: "Choose the New Orleans experience that fits your group, time, transportation, and interests.",
    url: "/",
    type: "website",
  },
};

export default function HomePage() {
  return <CinematicHomepageTop />;
}
