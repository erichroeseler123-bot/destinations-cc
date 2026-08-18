import type { Metadata } from "next";
import CinematicHomepageTop from "./CinematicHomepageTop";

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
