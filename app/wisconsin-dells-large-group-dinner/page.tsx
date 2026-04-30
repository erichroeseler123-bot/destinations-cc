import type { Metadata } from "next";
import FeastlyGroupDiningDecisionPage from "@/app/components/dcc/FeastlyGroupDiningDecisionPage";

const PAGE_PATH = "/wisconsin-dells-large-group-dinner";
const FEASTLY_HREF =
  "https://feastlyspread.com/private-chef-dinner-experience?experience_type=dinner_experience&source_page=%2Fwisconsin-dells-large-group-dinner&cta=pick_team";

export const metadata: Metadata = {
  title: "Wisconsin Dells Large Group Dinner | Best Option for Rental Groups",
  description:
    "Feeding a large Wisconsin Dells group is hard when everyone is tired and the rental kitchen becomes the bottleneck. Here is the cleanest dinner-night answer.",
  alternates: { canonical: PAGE_PATH },
};

export default function WisconsinDellsLargeGroupDinnerPage() {
  return (
    <FeastlyGroupDiningDecisionPage
      pagePath={PAGE_PATH}
      eyebrow="Wisconsin Dells group dinner decision"
      title="Feeding a large Wisconsin Dells group is usually the hardest part of the night."
      problem="After waterparks, check-in, groceries, and different appetites, dinner becomes a logistics problem. Restaurants are hard with big groups, delivery turns messy, and cooking at the rental often leaves one person stuck managing the kitchen."
      quickAnswer="For most vacation rental groups, the best dinner move is a Feastly kitchen team that comes to the rental and handles one dinner night."
      recommendation="Feastly Spread is built for the vacation-rental version of dinner: guests provide or order groceries separately, and a Feastly kitchen team helps unload, prep easy food, cook one hot dinner, make simple next-day food, put things away, and reset the kitchen before leaving."
      feastlyHref={FEASTLY_HREF}
      ctaLabel="Pick your Feastly team"
      comparisons={[
        {
          label: "Restaurant",
          tradeoff: "Hard to seat, hard to move, and usually turns the night into transportation and timing coordination.",
        },
        {
          label: "Delivery",
          tradeoff: "Simple for small groups, but large orders get cold, fragmented, and hard to clean up.",
        },
        {
          label: "Cook yourself",
          tradeoff: "Cheaper on paper, but one guest becomes the unpaid kitchen manager for everyone.",
        },
      ]}
      fitPoints={[
        "One clear dinner plan at the rental.",
        "Groceries stay separate from the service.",
        "A Feastly kitchen team handles prep, cooking support, and cleanup.",
        "The group gets a reset instead of another coordination problem.",
      ]}
    />
  );
}
