import type { Metadata } from "next";
import { VegasDecisionPage } from "../components/VegasDecisionPage";

export const metadata: Metadata = {
  title: "What to Do With 4 Hours in Las Vegas | Save On The Strip",
  description: "A practical four-hour Vegas plan that avoids spending the whole window in transit or in line.",
  alternates: { canonical: "https://saveonthestrip.com/four-hours-in-vegas" },
};

export default function Page() {
  return <VegasDecisionPage eyebrow="Four hours in Vegas" title="Do one compact Vegas thing well." lead="Four hours disappears fast. Stay geographically tight and do not build a cross-town scavenger hunt." verdict="Pick one zone: central Strip, south Strip, north Strip, or Fremont. Do not try to do all of Las Vegas." sections={[
    { title: "Central Strip", body: "Bellagio, Caesars, Paris, LINQ, and nearby attractions work well when you want classic Strip energy with minimal repositioning.", links: [{ href: "/free-things", label: "Find free nearby wins" }] },
    { title: "Downtown", body: "Fremont can fill a compact block better than bouncing between distant Strip resorts." },
    { title: "One ticketed anchor", body: "If a show or attraction is the point, make that the anchor and keep everything else close by.", links: [{ href: "/shows", label: "Compare shows" }, { href: "/tonight", label: "See tonight" }] },
  ]} />;
}
