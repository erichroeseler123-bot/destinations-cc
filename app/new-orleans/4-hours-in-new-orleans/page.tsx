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
  />;
}
