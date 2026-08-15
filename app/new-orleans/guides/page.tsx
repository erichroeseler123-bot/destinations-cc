import Link from "next/link";
import DailyBriefSignup from "../components/DailyBriefSignup";

export const metadata = {
  title: "New Orleans Planning Guides | Welcome to New Orleans Tours",
  description:
    "Plan New Orleans by time, group, transportation, weather, cruise timing, and experience type with practical local decision guides.",
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "New Orleans Planning Guides | Welcome to New Orleans Tours",
    description:
      "Start with the question that matches your trip: what to do today, tonight, with kids, before a cruise, in bad weather, or when time is tight.",
    url: "/guides",
    type: "website",
  },
};

type GuideLink = {
  href: string;
  title: string;
  description: string;
};

type GuideSection = {
  eyebrow: string;
  title: string;
  intro: string;
  links: GuideLink[];
};

const sections: GuideSection[] = [
  {
    eyebrow: "Right now",
    title: "You are already here",
    intro: "Use current timing first when the decision is for today, tonight, or this weekend.",
    links: [
      { href: "/guides/things-to-do-in-new-orleans-today", title: "Things to do in New Orleans today", description: "Same-day ideas built around what can still fit into the day." },
      { href: "/guides/tonight", title: "What to do tonight", description: "Build the evening around live context, dinner, music, cruises, cocktails, and after-dark options." },
      { href: "/guides/this-weekend", title: "This weekend in New Orleans", description: "A wider view when you have more than one day to work with." },
      { href: "/guides/whats-happening", title: "What is happening around town", description: "Use the live city layer before choosing a fixed itinerary." },
    ],
  },
  {
    eyebrow: "Time first",
    title: "How much time do you actually have?",
    intro: "A good New Orleans plan changes completely when you have four hours instead of a full day.",
    links: [
      { href: "/guides/4-hours-in-new-orleans", title: "Only have about four hours", description: "Choose something realistic without turning the whole visit into transit time." },
      { href: "/guides/one-day-in-new-orleans-tours", title: "One day in New Orleans", description: "Structure a full day without trying to cram in every category." },
      { href: "/guides/new-orleans-morning-tours", title: "Morning tour options", description: "Good fits when you want to use the first half of the day well." },
      { href: "/guides/new-orleans-afternoon-tours", title: "Afternoon tour options", description: "Use the hours between lunch and dinner without overcommitting." },
      { href: "/guides/new-orleans-tours-that-fit-before-dinner", title: "What fits before dinner", description: "Plan backward from an evening reservation or show." },
      { href: "/guides/best-new-orleans-tours-if-you-arrive-at-noon", title: "Arriving around noon", description: "Make arrival day useful without pretending it is a full sightseeing day." },
    ],
  },
  {
    eyebrow: "Who is with you?",
    title: "Plan for the people, not an average tourist",
    intro: "Age mix, mobility, pace, and group type usually matter more than a generic top-ten list.",
    links: [
      { href: "/guides/first-time-new-orleans-tours", title: "First-time visitors", description: "Start with orientation and the experiences that make the city easier to understand." },
      { href: "/guides/new-orleans-tours-for-families", title: "Families", description: "Balance interest, walking, heat, timing, and mixed ages." },
      { href: "/guides/new-orleans-tours-for-grandparents-and-kids", title: "Grandparents and kids together", description: "Find formats that work across generations without exhausting anyone." },
      { href: "/guides/new-orleans-tours-for-couples", title: "Couples", description: "River cruises, cocktails, music, history, and easy ways to build a date-night plan." },
      { href: "/guides/new-orleans-tours-for-solo-travelers", title: "Solo travelers", description: "Choose experiences where going alone still feels natural and worthwhile." },
      { href: "/guides/new-orleans-bachelorette-party-tours", title: "Bachelorette groups", description: "Group-friendly ideas without forcing everyone into the same kind of night." },
    ],
  },
  {
    eyebrow: "Comfort & logistics",
    title: "Transportation, walking, weather, and mobility",
    intro: "These are often the constraints that determine whether an experience is actually a good fit.",
    links: [
      { href: "/guides/new-orleans-tours-with-transportation", title: "Tours where transportation matters", description: "Know when pickup or included transportation changes the decision." },
      { href: "/guides/best-swamp-tour-with-transportation", title: "Swamp tours with transportation", description: "Compare swamp options when you do not want to arrange your own ride." },
      { href: "/guides/new-orleans-swamp-tour-without-a-car", title: "Swamp tours without a car", description: "Plan the full commitment, not just the time on the boat." },
      { href: "/guides/new-orleans-tours-with-minimal-walking", title: "Minimal-walking options", description: "Favor riding, cruising, and lower-footprint formats." },
      { href: "/guides/new-orleans-tours-limited-mobility", title: "Limited-mobility planning", description: "Use format and logistics as the first filter before booking." },
      { href: "/guides/best-new-orleans-tours-for-a-rainy-day", title: "Rainy-day options", description: "Shift the plan when outdoor exposure stops being the best move." },
    ],
  },
  {
    eyebrow: "Choose the experience",
    title: "Compare the big New Orleans decisions",
    intro: "When two experiences both sound good, compare the tradeoff instead of opening twenty tabs.",
    links: [
      { href: "/guides/city-tour-vs-swamp-tour-new-orleans", title: "City tour vs swamp tour", description: "Choose between understanding New Orleans itself and getting out into the wetlands." },
      { href: "/compare/covered-swamp-boat-vs-airboat", title: "Covered swamp boat vs airboat", description: "Compare pace, exposure, ride style, and group fit." },
      { href: "/compare/small-vs-large-airboat", title: "Small vs large airboat", description: "Understand what the boat size changes before you pick a ticket." },
      { href: "/compare/whitney-vs-oak-alley", title: "Whitney Plantation vs Oak Alley", description: "Compare historical focus, setting, and what kind of visit you want." },
      { href: "/guides/daytime-vs-evening-jazz-cruise-new-orleans", title: "Daytime vs evening jazz cruise", description: "Choose based on your schedule, atmosphere, meal plan, and what you want the river experience to feel like." },
      { href: "/compare/natchez-vs-city-of-new-orleans-riverboat", title: "NATCHEZ vs CITY of NEW ORLEANS", description: "Compare the two riverboat choices without treating them as interchangeable." },
    ],
  },
  {
    eyebrow: "Cruise visitors",
    title: "Fit New Orleans around your ship",
    intro: "Embarkation and disembarkation days need different planning from a normal hotel stay.",
    links: [
      { href: "/guides/things-to-do-before-a-cruise-new-orleans", title: "What to do before a cruise", description: "Use the hours before boarding without creating a luggage or timing problem." },
      { href: "/guides/things-to-do-after-a-cruise-new-orleans", title: "What to do after a cruise", description: "Turn disembarkation day into useful New Orleans time before a flight or hotel check-in." },
    ],
  },
];

const quickStarts = [
  ["/help-me-choose", "Help Me Choose", "Answer a few questions and narrow the tour list."],
  ["/tours", "Browse Experiences", "See the current bookable collection by experience type."],
  ["/compare", "Compare Tours", "Go straight to side-by-side decision pages."],
  ["/french-quarter-welcome-stop", "Ask the Concierge Desk", "Call, text, or get in-person planning help."],
] as const;

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-[var(--nola-bg-charcoal)] text-[var(--nola-ivory)]">
      <section className="border-b border-[var(--nola-border)] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--nola-gold)]">New Orleans planning guides</p>
          <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">Start with the question that matches your trip</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--nola-text-muted)]">You do not need another giant list of attractions. Start with how much time you have, who is traveling, what the weather is doing, whether transportation matters, and what kind of experience sounds right.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/guides/things-to-do-in-new-orleans-today" className="bg-[var(--nola-gold)] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black">What should we do today?</Link>
            <Link href="/help-me-choose" className="border border-[var(--nola-gold)] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--nola-gold)]">Help Me Choose</Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickStarts.map(([href, title, description]) => (
            <Link key={href} href={href} className="border border-[var(--nola-border)] bg-[var(--nola-surface-strong)] p-5 hover:border-[var(--nola-gold)]">
              <div className="font-serif text-xl text-[var(--nola-gold)]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[var(--nola-text-muted)]">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <DailyBriefSignup source="guides" />

      <div className="px-6 pb-20 pt-14">
        <div className="mx-auto max-w-6xl space-y-14">
          {sections.map((section) => (
            <section key={section.title}>
              <div className="max-w-3xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--nola-gold)]">{section.eyebrow}</p>
                <h2 className="mt-2 font-serif text-3xl md:text-4xl">{section.title}</h2>
                <p className="mt-3 leading-7 text-[var(--nola-text-muted)]">{section.intro}</p>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {section.links.map((link) => (
                  <Link key={link.href} href={link.href} className="group border border-[var(--nola-border)] bg-[var(--nola-surface-subtle)] p-5 transition hover:border-[var(--nola-gold)] hover:bg-[var(--nola-surface-strong)]">
                    <h3 className="font-serif text-xl text-[var(--nola-ivory)] group-hover:text-[var(--nola-gold)]">{link.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--nola-text-muted)]">{link.description}</p>
                    <span className="mt-4 inline-block text-xs font-bold uppercase tracking-[0.14em] text-[var(--nola-gold)]">Read guide →</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <section className="border border-[var(--nola-gold)]/40 bg-[var(--nola-surface-strong)] p-7 md:p-9">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--nola-gold)]">Still not sure?</p>
            <h2 className="mt-2 font-serif text-3xl">Tell us what kind of day you want.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--nola-text-muted)]">The guide library is here when you want to research. If you would rather answer a few questions and get a shorter list, use Help Me Choose.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/help-me-choose" className="bg-[var(--nola-gold)] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black">Start Help Me Choose</Link>
              <Link href="/french-quarter-welcome-stop" className="border border-[var(--nola-border)] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--nola-ivory)]">Talk to a person</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
