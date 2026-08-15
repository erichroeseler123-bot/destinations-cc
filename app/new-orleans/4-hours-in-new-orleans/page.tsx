import IntentTourPage from "../components/IntentTourPage";

export const metadata = {
  title: "4 Hours in New Orleans | Tours That Fit a Short Visit",
  description: "Only have about four hours in New Orleans? Compare shorter city, river and evening tour formats before checking live schedules.",
};

export default function Page() {
  return <IntentTourPage
    eyebrow="Short visit"
    title="Only have about four hours in New Orleans?"
    intro="A short visit rewards focus. Choose one primary experience with enough buffer for transportation, check-in and getting back where you need to be instead of stacking a schedule that only works on paper."
    decisionTitle="Protect your time buffer"
    decisionPoints={[
      "A city overview can deliver the broadest context when you only have part of a day.",
      "A daytime river cruise can work when its departure time lines up cleanly with your available window.",
      "Avoid long plantation and full-day combination tours when your total free time is only a few hours.",
      "Always check the operator's current duration, departure time and meeting or pickup details before booking."
    ]}
    productSlugs={["city-tour-of-new-orleans", "daytime-jazz-cruise", "craft-cocktail-walking-tour", "ghosts-spirits-walking-tour"]}
    relatedLinks={[
      { href: "/things-to-do-in-new-orleans-today", label: "Things to do today" },
      { href: "/new-orleans-tours-tonight", label: "Tours tonight" },
      { href: "/help-me-choose", label: "Help me choose" }
    ]}
    faq={[
      { question: "What is the best thing to do with four hours in New Orleans?", answer: "Pick one anchor experience rather than stacking several timed activities. A city overview, a river cruise that fits your window, or an evening walking experience can work well when the departure and return timing leave a real buffer." },
      { question: "Can I do a swamp tour with only four hours?", answer: "Usually that is a tight choice once transportation outside the city, check-in and return time are included. Use the operator's total published commitment rather than only the time spent on the boat." },
      { question: "How much buffer should I leave after a short New Orleans tour?", answer: "Leave enough time for traffic, walking to the meeting point, check-in and any fixed flight, cruise, dinner or hotel deadline. A plan that only works if every segment runs exactly on time is too tight." },
    ]}
  />;
}
