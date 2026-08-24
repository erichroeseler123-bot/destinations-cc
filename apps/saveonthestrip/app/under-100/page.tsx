import type { Metadata } from "next";
import { VegasDecisionPage } from "../components/VegasDecisionPage";

const URL = "https://saveonthestrip.com/under-100";

export const metadata: Metadata = {
  title: "Things to Do in Las Vegas Under $100 | Budget Vegas Guide",
  description:
    "Plan things to do in Las Vegas under $100 by choosing one paid anchor, using free Vegas around it, and accounting for fees, location, and transportation before you spend.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Things to Do in Las Vegas Under $100 | Save On The Strip",
    description:
      "A practical Vegas-under-$100 plan that spends on one thing that matters and uses free or low-friction choices around it.",
    url: URL,
    type: "article",
  },
};

export default function Page() {
  return (
    <VegasDecisionPage
      eyebrow="Las Vegas under $100"
      title="Things to do in Las Vegas under $100 without wasting the budget."
      lead="Treat $100 as a decision limit, not a challenge to buy the most small things. Pick one paid anchor you actually care about, then use free or low-cost Vegas to make the rest of the block feel full."
      verdict="Best default: spend once on the thing you would regret skipping, keep the rest flexible, and leave room for taxes, fees, transportation, and the distance between attractions."
      sections={[
        {
          title: "1. Pick one paid anchor",
          body: "Choose one show, attraction, meal, or experience that deserves the money. A single strong purchase gives the day a center and makes it easier to reject five smaller purchases you did not really want.",
          links: [
            { href: "/shows", label: "Compare Vegas shows" },
            { href: "/worth-it", label: "Use the worth-it filter" },
          ],
        },
        {
          title: "2. Build the free part of the plan first",
          body: "Free Vegas works best as intentional time, not filler after the budget is gone. Use fountains, hotel exploration, people-watching, downtown or another no-ticket block that fits where you already are. Check current access and schedules before relying on any one attraction.",
          links: [{ href: "/free-things", label: "Find free things to do in Vegas" }],
        },
        {
          title: "3. Count fees and transportation as part of the $100",
          body: "A headline ticket price is not the whole cost. Service fees, taxes, parking, rides, and crossing the city for a cheap attraction can turn an apparent bargain into the most expensive part of the plan.",
          links: [{ href: "/near-your-hotel", label: "Find things near your hotel" }],
        },
        {
          title: "4. Stay geographically tight",
          body: "Two good things near each other often beat three cheaper things spread across Las Vegas. Less transfer time means more of the budget buys experience instead of transportation and waiting.",
          links: [
            { href: "/near-your-hotel", label: "Plan near your hotel" },
            { href: "/four-hours-in-vegas", label: "Plan a four-hour Vegas block" },
          ],
        },
        {
          title: "5. Separate a budget day from a splurge night",
          body: "If the trip already has one premium night, let another block be intentionally inexpensive. Vegas does not have to be expensive every hour for the trip to feel like Vegas.",
          links: [{ href: "/tonight", label: "Build tonight's plan" }],
        },
        {
          title: "6. Do not confuse cheap with worth it",
          body: "A low price is still wasted money when the attraction is inconvenient, badly timed, or something nobody in the group wanted. The fastest way to stay under budget is to skip the purchases that only looked like deals.",
          links: [
            { href: "/what-to-skip-in-las-vegas", label: "See what to skip" },
            { href: "/worth-it", label: "Pressure-test the purchase" },
          ],
        },
        {
          title: "7. Use this as an activity budget, not a whole-trip promise",
          body: "The under-$100 lane is for a day or night activity plan. Lodging, gambling, airfare, major transportation, and personal shopping can change the trip budget dramatically and should be treated separately.",
        },
      ]}
    />
  );
}
