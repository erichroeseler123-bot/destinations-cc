import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";

export const metadata: Metadata = {
  title: "Transportation To Red Rocks | Shuttle, Parking, Uber, and Private Ride Guide",
  description: "Compare driving, parking, rideshare, shuttle, and private ride options for transportation to Red Rocks from Denver.",
  alternates: { canonical: "/red-rocks-transportation" },
};

export default function RedRocksTransportationPage() {
  return (
    <RedRocksAuthorityPage
      eyebrow="DCC Transportation Guide"
      title="Transportation to Red Rocks is mostly a decision about how much uncertainty you want before and after the show."
      intro="The best ride to Red Rocks depends on arrival timing, group size, parking tolerance, and whether you want to solve the ride-home problem in advance. This page should help the visitor compare the real options quickly and then move into booking when the answer is obvious."
      sourcePath="/red-rocks-transportation"
      primaryCtaHref="/red-rocks-shuttle"
      primaryCtaLabel="Compare Shuttle Options"
      secondaryCtaHref="/red-rocks-parking"
      secondaryCtaLabel="Check Parking Strategy"
      buyerIntentLabel="Transportation to Red Rocks"
      sections={[
        {
          title: "Driving vs. shuttle vs. rideshare",
          body: "Driving gives autonomy, but only if parking and exit strategy are chosen early. Rideshare can work on ingress, but pickup zones get compressed fast after sold-out shows. Shuttles simplify the ride-home problem by removing the brittle pickup dependency that breaks many first-time Red Rocks plans.",
        },
        {
          title: "When shuttle becomes the cleaner answer",
          body: "Shuttle transport tends to outperform app-based rides when the group wants predictable pickup anchors, less parking overhead, and a cleaner ride home after the final set. That is especially true for visitors staying in Denver who do not want the night to end in a crowded pickup scramble.",
          bullets: [
            "Best for visitors staying in Denver hotels or rentals.",
            "Best for first-time Red Rocks trips.",
            "Best when the ride home matters more than total autonomy.",
          ],
        },
      ]}
    />
  );
}
