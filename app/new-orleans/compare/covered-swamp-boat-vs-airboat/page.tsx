import type { Metadata } from "next";
import Link from "next/link";
import DecisionComparison from "../DecisionComparison";

export const metadata: Metadata = {
  title: "Covered Swamp Boat vs Airboat in New Orleans: Which Is Better for You?",
  description: "Compare a covered pontoon swamp tour with New Orleans airboat tours by age rules, speed, noise, weather exposure, boat size, transportation and mobility before booking.",
  alternates: { canonical: "/compare/covered-swamp-boat-vs-airboat" },
  openGraph: {
    title: "Covered Swamp Boat vs Airboat in New Orleans",
    description: "A practical side-by-side comparison of covered pontoon and airboat swamp tours from New Orleans.",
    url: "/compare/covered-swamp-boat-vs-airboat",
    type: "article",
  },
};

export default function CoveredBoatVsAirboatPage() {
  return (
    <>
      <DecisionComparison
        eyebrow="New Orleans swamp tour comparison"
        title="Covered swamp boat vs airboat: which New Orleans swamp tour fits you?"
        intro="Both formats get you into South Louisiana wetlands, but the ride itself is very different. The covered pontoon option is a slower, all-ages wildlife and bayou tour with round-trip transportation. The airboats are faster, louder, open-air rides with a minimum age of 5 and more physical restrictions."
        verdict="Choose the covered pontoon if you want the calmer, all-ages option with more shelter from the weather. Choose an airboat if speed and open-air adventure are the point of the outing and everyone in your group meets the age and health restrictions."
        left={{ heading: "Covered pontoon", href: "/tours/swamp-bayou-tour", cta: "View covered swamp tour" }}
        right={{ heading: "Airboat", href: "/tours/small-airboat-swamp-adventure", cta: "View small airboat" }}
        rows={[
          { label: "Published duration", left: "3 hours 45 minutes with round-trip transportation", right: "3 hours 45 minutes with round-trip transportation for both small and large airboat options" },
          { label: "Age rule", left: "All ages", right: "Ages 5+; children cannot sit on a lap" },
          { label: "Ride style", left: "Relaxing custom-built pontoon boat through cypress swamp and bayous", right: "High-speed airboat ride, advertised at speeds up to 40 mph, with slower wildlife-viewing segments" },
          { label: "Weather exposure", left: "Covered boat offers more shelter while remaining an outdoor activity", right: "Open-air; operator says the ride may be shortened, postponed or replaced by a covered boat in inclement weather" },
          { label: "Noise", left: "Lower-intensity boat experience", right: "High-noise airboat experience; follow operator safety procedures" },
          { label: "Small vs large", left: "Pontoon format rather than an airboat-size choice", right: "Small airboat: 6–12 passengers. Large airboat: 15–27 passengers" },
          { label: "Mobility", left: "Confirm current boarding/accessibility details before booking", right: "Not wheelchair accessible or stroller accessible; passengers must board without staff assistance" },
          { label: "Health cautions", left: "Standard outdoor-tour considerations", right: "Operator does not recommend airboats for pregnancy, neck/back problems or heart conditions" },
          { label: "Best fit", left: "Families, mixed-age groups, photographers and travelers who prefer a calmer ride", right: "Travelers who specifically want speed, open-air marsh access and a more adventurous ride" },
        ]}
        bestFit={{
          left: ["Your group includes young children or a wide range of ages.", "You want a slower ride with more cover from sun or rain.", "Wildlife, Cajun culture and wetlands interpretation matter more than speed."],
          right: ["Everyone is at least 5 and meets the operator's health/boarding requirements.", "You want the faster, louder, more adventurous swamp experience.", "You care about boat size: choose small for 6–12 passengers or large for 15–27."],
        }}
        cautions={[
          "Wildlife sightings are never guaranteed on either format.",
          "Airboats are not recommended by the operator for pregnant travelers or people with neck, back or heart conditions.",
          "Weather can affect airboat operation; the operator may shorten, postpone or substitute a covered boat.",
          "The included-transportation versions leave from 400 Toulouse Street; separate self-drive swamp products have different meeting points and shorter published activity durations.",
        ]}
        faq={[
          { question: "Is a covered swamp boat better than an airboat for families?", answer: "Usually for mixed-age groups or younger children. The covered pontoon is the calmer all-ages format, while the checked airboat options require riders to be at least 5 and have additional health and boarding restrictions." },
          { question: "Will I see more wildlife on an airboat?", answer: "No format can guarantee wildlife. Airboats cover the wetlands differently and add speed, while covered boats emphasize a slower ride. Choose by ride style and group fit rather than assuming one guarantees better sightings." },
          { question: "Which swamp tour is better if rain is possible?", answer: "A covered boat gives you more shelter and is the safer planning default in unsettled weather. Airboat operation can be shortened, postponed or substituted when conditions are poor, so confirm the current operator status before leaving." },
        ]}
        sources={[
          { label: "Gray Line: Swamp & Bayou pontoon tour", href: "https://www.graylineneworleans.com/swamp-tours/swamp-bayou-tour/" },
          { label: "Gray Line: Small airboat", href: "https://www.graylineneworleans.com/swamp-tours/small-airboat-swamp-adventure-tour/" },
          { label: "Gray Line: Large airboat", href: "https://www.graylineneworleans.com/swamp-tours/large-airboat-swamp-adventure/" },
        ]}
        verifiedDate="August 9, 2026"
      />
      <section className="mx-auto -mt-6 max-w-5xl px-6 pb-16 text-sm text-[#aaa]">
        <p>Want the larger airboat instead? <Link href="/tours/large-airboat-swamp-adventure" className="text-[#d4af37] underline underline-offset-4">See the large-airboat option</Link>.</p>
      </section>
    </>
  );
}
