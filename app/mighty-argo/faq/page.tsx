import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mighty Argo Cable Car FAQ — What’s at the Top, Tickets, and Planning",
  description:
    "Planning FAQ for the Mighty Argo Cable Car: what’s at the top, who it fits, and what to sort out before visiting.",
  alternates: { canonical: "/mighty-argo/faq" },
};

const FAQ = [
  {
    q: "What’s at the top of Mighty Argo?",
    a: "Public descriptions point to scenic overlook and staging areas for visitors, hikers, and riders. DCC keeps this page conservative until the operator publishes a fuller operating layout.",
  },
  {
    q: "Is this mainly for mountain bikers?",
    a: "No. The project is interesting partly because it appears to serve both sightseeing visitors and riders. The biking use case matters, but it is not the only one.",
  },
  {
    q: "Should travelers just show up from Denver?",
    a: "Usually no. This works better as a planned Colorado outing with transport, timing, and weather context handled first.",
  },
  {
    q: "Why does DCC separate the shuttle page from the attraction guide?",
    a: "Because the attraction and the trip logistics are different decisions. The attraction page should stay authority-first; the shuttle page should stay execution-focused.",
  },
];

export default function MightyArgoFaqPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">Mighty Argo FAQ</h2>
        <p className="mt-3 max-w-3xl text-zinc-300">
          These are the planning questions that matter most before DCC sends someone deeper into transport or ride
          logistics.
        </p>
      </section>

      <section className="space-y-4">
        {FAQ.map((item) => (
          <article key={item.q} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-semibold text-white">{item.q}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{item.a}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
