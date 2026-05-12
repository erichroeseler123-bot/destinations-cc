import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";
import { buildDecisionContinuationUrl } from "@/lib/dcc/contracts/decisionContinuation";

export const metadata: Metadata = {
  title: "Shared Shuttle vs Private Ride to Red Rocks",
  description:
    "Most groups should take the shared shuttle. Use this page only to settle when a private ride is worth paying for instead.",
  alternates: { canonical: "/private-vs-shared-shuttles-to-red-rocks-denver-guide" },
  openGraph: {
    title: "Shared Shuttle vs Private Ride to Red Rocks",
    description:
      "Shared shuttle is the clean default for most Red Rocks nights. Private wins only when group control matters more than price.",
    url: "/private-vs-shared-shuttles-to-red-rocks-denver-guide",
    type: "article",
  },
};

export default function PrivateVsSharedGuidePage() {
  const sharedRideHref = buildDecisionContinuationUrl("https://www.destinationcommandcenter.com/red-rocks-transportation", {
    sourcePage: "/private-vs-shared-shuttles-to-red-rocks-denver-guide",
    corridor: "red-rocks-transport",
    cta: "continue-shared-in-hub",
    action: "continue_shared_in_red_rocks_transport_hub",
    option: "shared",
    product: "shared-vs-private-decision",
    entryMode: "dcc-first",
    state: "chosen",
    destinationSurface: "dcc",
  });
  const privateRideHref = buildDecisionContinuationUrl("https://www.destinationcommandcenter.com/red-rocks-transportation", {
    sourcePage: "/private-vs-shared-shuttles-to-red-rocks-denver-guide",
    corridor: "red-rocks-transport",
    cta: "continue-private-in-hub",
    action: "continue_private_in_red_rocks_transport_hub",
    option: "private-ride",
    product: "shared-vs-private-decision",
    entryMode: "dcc-first",
    state: "chosen",
    destinationSurface: "dcc",
  });
  return (
    <RedRocksAuthorityPage
      eyebrow="DCC Ride Split Guide"
      title="Shared shuttle is the move unless your group needs private control."
      intro="For most concert nights, shared is enough. Choose private only when one vehicle, one pickup plan, and tighter return control are worth the premium."
      sourcePath="/private-vs-shared-shuttles-to-red-rocks-denver-guide"
      primaryCtaHref={sharedRideHref}
      primaryCtaLabel="Choose Shared Shuttle"
      secondaryCtaHref={privateRideHref}
      secondaryCtaLabel="Choose Private Ride"
      buyerIntentLabel="Private vs shared Red Rocks guide"
      heroTrustBadges={[
        "Shared is the default",
        "Private is for control",
        "Decision continues into DCC hub",
      ]}
      heroSummaryCards={[
        {
          label: "Verdict",
          body: "Shared shuttle for most groups; private only when control matters more than price.",
        },
        {
          label: "Use shared when",
          body: "You want parking, rideshare, and the return plan handled without overbuying.",
        },
        {
          label: "Use private when",
          body: "Your group needs one exact vehicle and a tighter schedule.",
        },
      ]}
      notice={
        <section className="rounded-[1.9rem] border border-cyan-300/20 bg-cyan-500/10 p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Verdict</p>
          <h2 className="mt-3 text-2xl font-bold text-white">Shared is the default. Private is the control upgrade.</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-200">
            Choose shared when you want parking and the return handled. Choose private
            only when your group needs its own vehicle and tighter timing.
          </p>
        </section>
      }
      sections={[
        {
          title: "Shared shuttle is the default when the job is solving the ride home",
          body: "Shared shuttle is usually the right answer when the group does not need one vehicle to itself and mostly wants the cleanest way in and out. It removes the parking-and-rideshare problem before the show starts. For most visitors, that is the whole job.",
        },
        {
          title: "Private ride only wins when control matters more than price",
          body: "Private becomes the better move when the group needs one vehicle, one pickup plan, and one return plan without shared timing. The premium is not about lifestyle. It is about control.",
          bullets: [
            "One vehicle for the full night.",
            "Tighter pickup and regroup timing.",
            "Worth paying for only when that control actually matters.",
          ],
        },
        {
          title: "When shared is enough",
          body: "Shared is enough when the group is small, flexible, and mostly trying to avoid parking, exit friction, and post-show pickup chaos. If that is the job, private is usually overkill.",
        },
        {
          title: "When private is worth the premium",
          body: "Private is worth paying for when the group wants tighter pickup control, one exact vehicle, or a cleaner post-show regroup than a shared lane can give. That is a narrower use case than most people think.",
        },
        {
          title: "The cleanest rule",
          body: "If the night is mostly about cutting parking hassle and leaving cleanly, shared shuttle is usually the answer. If the night is about keeping the group together under one exact plan, private is the answer. That is the real split.",
        },
      ]}
    />
  );
}
