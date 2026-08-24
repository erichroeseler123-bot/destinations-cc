import type { Metadata } from "next";
import DellsDecisionPage from "../components/DellsDecisionPage";

const URL = "https://welcometothedells.com/first-time";

export const metadata: Metadata = {
  title: "Wisconsin Dells First-Time Visitor Guide | What to Do First",
  description:
    "First time in Wisconsin Dells? Use a simple plan for river scenery, Ducks or boat tours, one major attraction, downtown, and a rainy-day backup.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Wisconsin Dells First-Time Visitor Guide",
    description:
      "A practical first-trip plan built around what makes Wisconsin Dells different instead of trying to do everything at once.",
    url: URL,
    type: "article",
  },
};

const faq = [
  {
    question: "What should a first-time visitor do first in Wisconsin Dells?",
    answer:
      "Start with the river and sandstone scenery that made the destination famous, then choose one major attraction and leave part of the day flexible for downtown or a weather backup.",
  },
  {
    question: "Do first-time visitors need to do both a Duck tour and a scenic boat tour?",
    answer:
      "No. Pick the format that fits your group and schedule rather than stacking similar sightseeing into one day. You can use the site's boat-comparison guide to choose between them.",
  },
  {
    question: "What if it rains in Wisconsin Dells?",
    answer:
      "Keep at least one indoor or weather-tolerant option ready before the trip. A backup works best when it is part of the plan instead of something you search for after the weather changes.",
  },
] as const;

export default function Page() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <DellsDecisionPage
        eyebrow="Wisconsin Dells first-time visitor guide"
        title="First time in Wisconsin Dells? Start with what makes the Dells different."
        intro="A first trip gets easier when you stop trying to sample every attraction. Start with the river and sandstone scenery, choose one major paid anchor, keep downtown flexible, and have a weather backup ready."
        sections={[
          {
            title: "1. Start with the Wisconsin River and sandstone scenery",
            body: "The landscape is the part of Wisconsin Dells you cannot copy in another resort town. Give the river, rock formations, or a classic land-and-water sightseeing experience a real place in the first trip.",
          },
          {
            title: "2. Choose Ducks or a scenic boat tour—do not automatically stack both",
            body: "Both can introduce the scenery, but they are different experiences. Pick the one that best fits your group, mobility, weather, and available time, then use the rest of the day for something different.",
          },
          {
            title: "3. Pick one major attraction as the day's anchor",
            body: "Waterpark, amusement park, show, or another high-commitment attraction can be the main paid block. One strong anchor usually produces a better first day than racing between several expensive stops.",
          },
          {
            title: "4. Use downtown and the Riverwalk as flexible time",
            body: "Downtown works well before, after, or between scheduled attractions because you can shorten or extend the stop without breaking the rest of the plan.",
          },
          {
            title: "5. Build the rainy-day backup before you arrive",
            body: "Wisconsin weather can change the order of the day. Keep an indoor or weather-tolerant choice ready so a wet afternoon becomes a pivot instead of a planning emergency.",
          },
          {
            title: "6. Use a simple first-day pattern",
            body: "A clean first-day pattern is scenery first, one major attraction second, then flexible downtown or free time. It leaves room for meals, traffic, parking, weather, and the fact that groups rarely move as fast as an itinerary says they will.",
          },
        ]}
        ctaHref="/boat-tours"
        ctaLabel="Compare Dells boat experiences"
      />
    </>
  );
}
