import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";

export const metadata: Metadata = {
  title: "Denver Concert Shuttle Guide | Red Rocks Shuttle From Denver",
  description: "Denver concert shuttle guidance focused on the venue where transportation friction is highest: Red Rocks. Compare shuttle, driving, and ride-home options.",
  alternates: { canonical: "/denver-concert-shuttle" },
};

export default function DenverConcertShuttlePage() {
  return (
    <RedRocksAuthorityPage
      eyebrow="DCC Concert Shuttle Guide"
      title="Denver concert shuttle demand exists mostly because Red Rocks is a harder transportation problem than the rest of the market."
      intro="Most Denver venues do not force a transportation decision early. Red Rocks does. That is why this page should capture broad Denver concert shuttle intent, then route visitors into the Red Rocks-specific transport path when that is the actual trip they are planning."
      sourcePath="/denver-concert-shuttle"
      primaryCtaHref="/red-rocks-shuttle"
      primaryCtaLabel="Go To Red Rocks Shuttle"
      secondaryCtaHref="/denver/concert-transportation"
      secondaryCtaLabel="Open Denver Transport Guide"
      buyerIntentLabel="Denver concert shuttle"
      sections={[
        {
          title: "Why this lane matters",
          body: "Concert shuttle intent is strongest when the venue sits outside the city core and the ride-home problem becomes obvious. That is exactly why Red Rocks owns so much of the Denver shuttle demand pattern.",
        },
        {
          title: "How DCC should use this page",
          body: "This page should capture broad intent, explain why Red Rocks is different, and then hand the visitor into the best-fit execution layer. It should not trap them in generic concert content once the venue-specific answer is clear.",
          bullets: [
            "Broad query lands here.",
            "Venue-specific need becomes obvious.",
            "Red Rocks shuttle or private ride page becomes the next click.",
          ],
        },
      ]}
    />
  );
}
