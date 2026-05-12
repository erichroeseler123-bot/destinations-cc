import type { Metadata } from "next";

const PAGE_PATH = "/airbnb-food-large-group-wisconsin-dells";
const FEASTLY_HREF =
  "https://feastlyspread.com/private-chef-for-vacation-rental?experience_type=vacation_rental&source_page=%2Fairbnb-food-large-group-wisconsin-dells&cta=pick_team";

export const metadata: Metadata = {
  title: "Airbnb Food for a Large Group in Wisconsin Dells | Rental Dinner Help",
  description:
    "If your Wisconsin Dells Airbnb group needs dinner without restaurant logistics, use a Feastly kitchen team model for one handled rental night.",
  alternates: { canonical: PAGE_PATH },
};

export default function AirbnbFoodLargeGroupWisconsinDellsPage() {
  return (
    <main className="min-h-screen bg-[#fff8ef] text-slate-950">
      <section className="border-b border-orange-900/10 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-700">
            Wisconsin Dells Airbnb food decision
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
            For one big rental dinner, put a Feastly team in the kitchen.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
            A big Airbnb can sleep the group, but it does not automatically solve dinner.
            Choose Feastly when the group wants to stay at the rental and stop assigning
            one guest to shop, cook, coordinate, and clean.
          </p>
          <div className="mt-8">
            <a
              href={FEASTLY_HREF}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-orange-700 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-orange-800"
            >
              Pick your Feastly team
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-6 py-12 md:grid-cols-3">
        <article className="rounded-[1.5rem] border border-orange-900/10 bg-white p-5 shadow-[0_18px_55px_rgba(85,43,12,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
            Verdict
          </p>
          <h2 className="mt-3 text-2xl font-black">Use Feastly for the handled night.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            This is the cleanest move when the group wants dinner where they already are
            without turning one person into the unpaid kitchen manager.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-orange-900/10 bg-white p-5 shadow-[0_18px_55px_rgba(85,43,12,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
            Expectation
          </p>
          <h2 className="mt-3 text-2xl font-black">Guests provide the groceries.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Feastly Spread is not catering and does not sell prepared food. The team helps
            turn the groceries into one organized rental dinner and resets the kitchen.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-orange-900/10 bg-white p-5 shadow-[0_18px_55px_rgba(85,43,12,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
            What happens next
          </p>
          <h2 className="mt-3 text-2xl font-black">Pick the team, then plan the meal.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Use this for the dinner night where leaving the house creates more friction
            than solving the kitchen inside the rental.
          </p>
        </article>
      </section>
    </main>
  );
}
