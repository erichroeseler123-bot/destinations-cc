import IntentTourPage from "../components/IntentTourPage";

export const metadata = {
  title: "Things to Do in New Orleans Before a Cruise | Tour Options",
  description: "Compare New Orleans tours for the day before or hours before a cruise, with an emphasis on timing, transportation and keeping a safe schedule buffer.",
};

export default function Page() {
  return <IntentTourPage
    eyebrow="Before your cruise"
    title="Things to do in New Orleans before a cruise"
    intro="New Orleans is a strong pre-cruise city because you can get a real sense of the destination without needing a full week. The key is choosing an experience that fits comfortably around hotel checkout, luggage, transportation and your cruise schedule."
    decisionTitle="Choose based on the time you truly have"
    decisionPoints={[
      "If you have only part of a day, favor city or river experiences over long regional day trips.",
      "If you arrive the day before sailing, a city tour plus an evening experience can give you two different views of New Orleans.",
      "Do not rely on a tight same-day return from a long out-of-town excursion before embarkation.",
      "Confirm current duration, departure point and transportation details with the operator before booking."
    ]}
    productSlugs={["city-tour-of-new-orleans", "daytime-jazz-cruise", "evening-jazz-cruise", "ghosts-spirits-walking-tour"]}
    relatedLinks={[
      { href: "/4-hours-in-new-orleans", label: "Only have four hours?" },
      { href: "/things-to-do-in-new-orleans-today", label: "Things to do today" },
      { href: "/tours", label: "Browse all tours" }
    ]}
    faq={[
      { question: "What is safe to do in New Orleans before boarding a cruise?", answer: "Favor an experience with a predictable return and enough buffer for luggage, transportation to the terminal and cruise check-in. A city or river experience is usually easier to fit than a long regional day trip on embarkation day." },
      { question: "Should I do a swamp or plantation tour on embarkation day?", answer: "Usually not if your schedule is tight. Both require travel outside central New Orleans, so traffic or a late return creates more risk than a city-based activity. They make more sense the day before sailing." },
      { question: "What can I do the night before a New Orleans cruise?", answer: "An evening jazz cruise, ghost walk, cocktail-focused outing or dinner-centered plan can work well because you are not racing the ship clock yet. Confirm the end time and leave enough margin for the next morning." },
    ]}
  />;
}
