import type { Metadata } from "next";
import { VegasDecisionPage } from "../components/VegasDecisionPage";

export const metadata: Metadata = {
  title: "What to Do in Las Vegas Before a Late Flight | Save On The Strip",
  description: "Use your last Vegas hours without creating an airport-timing problem.",
  alternates: { canonical: "https://saveonthestrip.com/before-a-late-flight" },
};

export default function Page() {
  return <VegasDecisionPage eyebrow="Before a late flight" title="Use the last hours. Protect the airport clock." lead="The goal is not to squeeze in one more giant Vegas mission. It is to finish strong without making the airport stressful." verdict="Stay on the Strip or near your bags, choose something easy to leave, and build backward from the airport." sections={[
    { title: "Best fit", body: "A meal, free attraction, short hotel walk, compact attraction, or early show can work if the timing is clean.", links: [{ href: "/free-things", label: "Free Vegas options" }, { href: "/shows", label: "Compare shows" }] },
    { title: "Bad fit", body: "Do not schedule a long Grand Canyon or Hoover Dam outing on a flight day unless the provider timing clearly leaves a conservative airport margin." },
    { title: "Bag problem first", body: "Know where your luggage is and how you are getting it before adding another attraction. Logistics beats one more photo stop." },
  ]} />;
}
