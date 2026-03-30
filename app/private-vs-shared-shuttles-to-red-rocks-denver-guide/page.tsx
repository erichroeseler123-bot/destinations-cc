import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";
import { buildParrPrivateRedRocksUrl } from "@/lib/dcc/contracts/dccParrBridge";

export const metadata: Metadata = {
  title: "Private vs Shared Shuttles to Red Rocks: Denver Guide",
  description:
    "Compare private vs shared shuttles to Red Rocks from Denver. See who should book an SUV, van, Sprinter, or shared seat and when the premium is worth it.",
  alternates: { canonical: "/private-vs-shared-shuttles-to-red-rocks-denver-guide" },
  openGraph: {
    title: "Private vs Shared Shuttles to Red Rocks: Denver Guide",
    description:
      "A decision-first guide for Denver visitors comparing shared shuttle seats and private Red Rocks transportation.",
    url: "/private-vs-shared-shuttles-to-red-rocks-denver-guide",
    type: "article",
  },
};

export default function PrivateVsSharedGuidePage() {
  return (
    <RedRocksAuthorityPage
      eyebrow="DCC Comparison Guide"
      title="Private vs shared shuttles to Red Rocks from Denver"
      intro="This is the comparison page visitors usually want after they realize a car is not the answer. The real question is not whether a shuttle exists. It is whether your night fits shared seats or a private vehicle."
      sourcePath="/private-vs-shared-shuttles-to-red-rocks-denver-guide"
      primaryCtaHref="/red-rocks-transportation"
      primaryCtaLabel="Open Transport Decision Hub"
      secondaryCtaHref={buildParrPrivateRedRocksUrl({ product: "parr-suburban" })}
      secondaryCtaLabel="Book Private If You Are Sure"
      buyerIntentLabel="Private vs shared Red Rocks guide"
      notice={
        <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Pricing ladder</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              ["Shared seats", "$59+"],
              ["Private SUV", "$499"],
              ["10-Pass Van", "$599"],
              ["14-Pass Sprinter", "$799"],
            ].map(([label, price]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-bold text-white">{label}</div>
                <div className="mt-2 text-2xl font-black text-cyan-300">{price}</div>
              </div>
            ))}
          </div>
        </section>
      }
      sections={[
        {
          title: "Shared shuttle wins when the traveler wants the cleanest value",
          body: "Shared shuttle seats are usually the best fit when the group does not need the vehicle to itself, wants to spend less, and mostly cares about replacing the car-and-Uber problem with one clean round trip. It is the value lane. For many first-time visitors, that is enough. They do not need a premium vehicle. They need certainty, less friction, and a ride back to Denver that does not rely on a crowded pickup zone.",
        },
        {
          title: "Private shuttle wins when the whole night has to move together",
          body: "Private shuttle from Denver to Red Rocks becomes the better choice when the group needs one vehicle, one pickup plan, and one return strategy. That is why private demand is strongest for birthdays, bachelor and bachelorette groups, tailgate-focused nights, or groups that want to stop before the venue. The premium is not really about luxury. It is about control.",
          bullets: [
            "One vehicle for the full night.",
            "Less waiting on other groups.",
            "Better fit for liquor stop or tailgate planning.",
          ],
        },
        {
          title: "When shared is enough",
          body: "Shared transport is enough when the group is small, flexible, and price-sensitive. It is also enough when the travelers are staying in the main Denver pickup lane and do not need custom timing. For that traveler, buying a private SUV can be overkill. The honest comparison matters because DCC should not tell every user to buy the most expensive option. It should tell them which lane matches the actual night they are building.",
        },
        {
          title: "When private transportation Golden to Red Rocks is worth the premium",
          body: "Golden to Red Rocks transportation gets more complicated when the group wants door-to-door handling, tighter pickup timing, or a cleaner post-show regroup. Private service is stronger there because the group does not have to back into a public seat plan that was built for general pickup anchors. If the group is already spending on the night, the private premium often buys back more convenience than the price gap suggests.",
        },
        {
          title: "The simplest rule",
          body: "If the night is mostly about cutting parking hassle at a reasonable price, shared shuttle is usually the answer. If the night is about keeping the group together, shaping the timeline, and locking the return plan before the show starts, private is the answer. That is the real private-vs-shared split, and it is why both lanes can coexist honestly on the same site.",
        },
      ]}
    />
  );
}
