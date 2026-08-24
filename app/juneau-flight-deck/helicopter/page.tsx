import type { Metadata } from "next";

const DCC = "https://www.destinationcommandcenter.com";
const GO = "/go/juneau/helicopter-tours";
const URL = "https://juneauflightdeck.com/helicopter";

export const metadata: Metadata = {
  applicationName: "Juneau Flight Deck",
  title: "Juneau Glacier Landing vs Scenic Flight | Which Helicopter Tour?",
  description:
    "Compare a Juneau glacier landing vs a scenic helicopter flight by what you want to remember, how you want to spend the flight time, group fit, and cruise-day timing.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Juneau Glacier Landing vs Scenic Flight | Juneau Flight Deck",
    description:
      "Choose between stepping onto glacier terrain and keeping the experience focused on the aerial Juneau Icefield view.",
    url: URL,
    siteName: "Juneau Flight Deck",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juneau Glacier Landing vs Scenic Flight",
    description:
      "Compare glacier-landing, scenic-flight, and premium Juneau helicopter formats around your ship day.",
  },
};

const lanes = [
  {
    name: "Scenic icefield flight",
    fit: "Aerial-view first",
    body: "Choose this when the broad Juneau Icefield perspective is the main event and physically stepping onto glacier terrain is not essential.",
    q: "icefield explorer",
  },
  {
    name: "Glacier landing flight",
    fit: "Ice-under-your-feet first",
    body: "Choose this when physically landing on glacier terrain is part of the memory you are paying for and you are comfortable devoting part of the experience to the landing.",
    q: "glacier landing",
  },
  {
    name: "Premium combination",
    fit: "More elements, longer footprint",
    body: "Choose this only when your ship call and budget support a longer premium format with more than one major element.",
    q: "dog sled helicopter",
  },
] as const;

const faq = [
  {
    question: "Is a glacier landing better than a scenic helicopter flight in Juneau?",
    answer:
      "Choose a glacier landing when stepping onto glacier terrain is the point of the experience. Choose a scenic-flight emphasis when the aerial perspective and time in the air matter more than time on the ice.",
  },
  {
    question: "Which Juneau helicopter format is better for a cruise stop?",
    answer:
      "The better format is the one whose full operator duration, meeting point, weather policy, and return margin fit comfortably inside your ship call. Compare the complete excursion footprint, not only the minutes in the aircraft.",
  },
  {
    question: "Can weather change a glacier landing?",
    answer:
      "Yes. Flight and landing operations depend on current conditions and provider decisions. Review the operator's current weather, cancellation, and substitution terms before booking.",
  },
] as const;

export default function JuneauFlightComparisonPage() {
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
    <main className="min-h-screen bg-[#07111a] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="border-b border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,.13),transparent_35%),#07111a]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <a href="/" className="text-sm font-bold text-slate-400 hover:text-white">← Juneau Flight Deck</a>
          <p className="mt-10 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Juneau helicopter comparison</p>
          <h1 className="mt-4 max-w-5xl text-4xl font-black tracking-[-0.045em] sm:text-6xl">Juneau glacier landing vs scenic flight: which helicopter tour fits your day?</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            If stepping onto glacier terrain is the memory you want, start with a landing format. If the broad aerial icefield view is the point, start with a scenic-flight format. Then check the full excursion time, weather terms, and ship-return margin before choosing a provider.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {lanes.map((lane) => {
            const href = `${GO}?port=juneau&lane=premium-helicopter&q=${encodeURIComponent(lane.q)}&sourcePage=/helicopter&cta=${encodeURIComponent(lane.q)}`;
            return (
              <article key={lane.name} className="flex flex-col rounded-3xl border border-slate-800 bg-[#0b1621] p-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{lane.fit}</p>
                <h2 className="mt-3 text-2xl font-black">{lane.name}</h2>
                <p className="mt-4 flex-1 text-sm leading-6 text-slate-400">{lane.body}</p>
                <a href={href} className="mt-7 inline-flex justify-center rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-100">
                  Continue to current options →
                </a>
              </article>
            );
          })}
        </div>

        <section className="mt-12 rounded-3xl border border-cyan-900/60 bg-cyan-950/10 p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">The ownership boundary</p>
          <h2 className="mt-3 text-2xl font-black">Flight Deck owns the flight-format choice.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Use this site to decide glacier landing versus scenic flight and which flight format fits. Use Destination Command Center for the upstream questions: whether a helicopter tour is worth it for your group, how much ship-clock margin you need, and what to do if weather changes the plan.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`${DCC}/guides/is-a-juneau-helicopter-glacier-tour-worth-it`} className="rounded-xl border border-cyan-800 px-4 py-3 text-sm font-bold text-cyan-100 hover:border-cyan-500">
              Is a helicopter tour worth it? ↗
            </a>
            <a href={`${DCC}/guides/how-much-time-do-you-need-for-juneau-helicopter-tour`} className="rounded-xl border border-cyan-800 px-4 py-3 text-sm font-bold text-cyan-100 hover:border-cyan-500">
              Check the ship clock ↗
            </a>
            <a href={`${DCC}/guides/juneau-helicopter-tour-weather-backup-plan`} className="rounded-xl border border-cyan-800 px-4 py-3 text-sm font-bold text-cyan-100 hover:border-cyan-500">
              Build a weather backup ↗
            </a>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-slate-800 bg-[#0b1621] p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Quick answers</p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {faq.map((item) => (
              <article key={item.question}>
                <h2 className="text-lg font-black">{item.question}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <p className="mt-8 text-xs leading-5 text-slate-500">
          Provider pages control current price, availability, aircraft, pickup, safety requirements, weather decisions, cancellation policy, and final booking terms. Juneau Flight Deck narrows the flight format and sends the transaction to the appropriate provider path.
        </p>
      </section>
    </main>
  );
}
