import Link from "next/link";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";

type CruisePortHybridSectionProps = {
  portSlug: string;
  portTitle: string;
  isAlaskaPort: boolean;
};

function toIntentBase(portTitle: string, isAlaskaPort: boolean): string[] {
  if (isAlaskaPort) {
    return [
      `${portTitle} shore excursions`,
      `${portTitle} whale watching`,
      `${portTitle} glacier tours`,
      `${portTitle} wildlife tours`,
      `${portTitle} cruise transfer`,
      `${portTitle} cruise port transportation`,
    ];
  }
  return [
    `${portTitle} shore excursions`,
    `${portTitle} cruise tours`,
    `${portTitle} port transfers`,
    `${portTitle} top things to do`,
    `${portTitle} day tours`,
    `${portTitle} cruise terminal transportation`,
  ];
}

export default function CruisePortHybridSection({
  portSlug,
  portTitle,
  isAlaskaPort,
}: CruisePortHybridSectionProps) {
  const intents = toIntentBase(portTitle, isAlaskaPort);

  return (
    <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-6 space-y-5">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Cruise-Port Hybrid Template</p>
        <h2 className="text-2xl font-bold">{portTitle} Excursions + Transfers</h2>
        <p className="text-zinc-300">
          Use DCC to connect schedule context, shore excursion discovery, and transfer planning before you hand off to booking.
        </p>
      </header>

      <PoweredByViator
        compact
        disclosure
        body={`DCC helps you compare ${portTitle} shore excursions, transfers, and day-tour options faster. When you're ready to book, you can book with DCC via Viator, a trusted tours and activities partner.`}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/tours?q=${encodeURIComponent(`${portTitle} shore excursions`)}`}
          className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white hover:bg-cyan-500"
        >
          Browse Shore Excursions
        </Link>
        <Link
          href={`/tours?q=${encodeURIComponent(`${portTitle} cruise transfer`)}`}
          className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 font-semibold text-zinc-200 hover:bg-white/10"
        >
          Browse Port Transfers
        </Link>
        <Link
          href={`/ports/${portSlug}`}
          className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 font-semibold text-zinc-200 hover:bg-white/10"
        >
          Port Authority Node
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {intents.map((intent) => (
          <Link
            key={intent}
            href={`/tours?q=${encodeURIComponent(intent)}`}
            className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200 hover:bg-white/10"
          >
            {intent}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <h3 className="font-semibold">Operational Notes</h3>
        <p className="mt-2 text-sm text-zinc-300">
          Keep transfer windows buffer-first and avoid tight chains immediately after disembarkation.
          Use this port node as the handoff point into tours, transport, and downstream booking surfaces.
        </p>
      </div>
    </section>
  );
}
