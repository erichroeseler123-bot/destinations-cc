import type { Metadata } from "next";

const DCC = "https://www.destinationcommandcenter.com";

export const metadata: Metadata = {
  title: "Welcome to the Dells | Wisconsin Dells Trip Ideas for Groups",
  description:
    "A simple Wisconsin Dells starting point for families, adults trips, and groups: choose the shape of the trip first, then open the attraction or operator that fits.",
  alternates: { canonical: "https://welcometothedells.com/" },
  openGraph: {
    title: "Welcome to the Dells",
    description: "Wisconsin Dells trip ideas for families, adults trips, and groups without turning the weekend into a giant checklist.",
    url: "https://welcometothedells.com/",
    type: "website",
  },
};

export default function WisconsinDellsBrandPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#17221d]">
      <section className="border-b border-[#d8d0c1] bg-[linear-gradient(135deg,#e9f1e8,#f7f3ea_58%,#e7eef4)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#476451]">Welcome to the Dells · Wisconsin</p>
          <h1 className="mt-4 max-w-5xl text-5xl font-black tracking-[-0.045em] sm:text-6xl md:text-7xl">
            Pick the kind of Dells trip first. Then pick the attractions.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#516058]">
            Wisconsin Dells has more things to do than most groups need. Start with who is traveling, how much structure they want, and the one or two anchors that make the trip feel worth it.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Family trip", "Protect meal windows and downtime, then choose attractions that fit the ages actually traveling."],
            ["Adults trip", "Build around pace, scenery, dining, nightlife, and a few chosen attractions instead of assuming every day needs a waterpark schedule."],
            ["Large group", "Coordinate the hard reservations and shared meals. Let smaller groups split for the rest."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-3xl border border-[#d8d0c1] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#66736b]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#d8d0c1] bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#476451]">A classic starting point</p>
            <h2 className="mt-3 text-3xl font-black">Original Wisconsin Ducks</h2>
            <p className="mt-4 text-sm leading-7 text-[#66736b]">
              The Original Wisconsin Ducks combine land and water in a one-hour classic Dells experience. Current schedules, operating conditions, ticket offers, and terms belong to the operator.
            </p>
            <a href="https://www.originalwisconsinducks.com/" rel="noopener" className="mt-6 inline-flex rounded-xl bg-[#17221d] px-5 py-3 text-sm font-black text-white hover:bg-[#294033]">
              Open the official operator site ↗
            </a>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#476451]">Need to figure out the trip first?</p>
            <h2 className="mt-3 text-3xl font-black">Use DCC before you buy.</h2>
            <div className="mt-5 space-y-3">
              <a href={`${DCC}/guides/wisconsin-dells-adults-trip-vs-family-trip`} className="block rounded-2xl border border-[#d8d0c1] p-4 font-bold hover:bg-[#f7f3ea]">
                Adults trip vs family trip ↗
              </a>
              <a href={`${DCC}/guides/how-to-plan-wisconsin-dells-for-a-large-group`} className="block rounded-2xl border border-[#d8d0c1] p-4 font-bold hover:bg-[#f7f3ea]">
                Planning the Dells for a large group ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <p className="max-w-3xl text-sm leading-7 text-[#66736b]">
          Welcome to the Dells is a focused trip-planning and referral surface. It does not pretend to be the official Wisconsin Dells tourism bureau, and it does not control attraction pricing, schedules, availability, or operator policies.
        </p>
      </section>
    </main>
  );
}
