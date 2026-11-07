import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import PartnerSharePlanningBar from "@/app/components/dcc/PartnerSharePlanningBar";
import {
  CLAA_JUNEAU_PORT_SCHEDULE,
  evaluateCruiseTimingWindow,
} from "@/lib/dcc/cruiseTimingGate";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";

export const metadata: Metadata = {
  title:
    "Which Juneau Tours Fit a Short Port Call? | CLAA Port-Call Windows & 60–90 Min All-Aboard Buffer | DCC",
  description:
    "Direct DCC answer for short Juneau cruise port calls (5.5–6.5 hours): compare 3.5h Auke Bay whale watching (331813P1), 3.0h Mendenhall Express (5857SHUTTLE), and 5.5h Whale + Glacier Combo (466119P3) against your ship's confirmed all-aboard cutoff.",
  alternates: { canonical: "/juneau/cruise-excursions-what-to-do" },
};

export const dynamic = "force-dynamic";

export default async function JuneauShortPortCallGuidePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const firstStr = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const arrivalParam = firstStr(sp.claa_arrival) || "07:00";
  const allAboardParam = firstStr(sp.all_aboard) || "13:00";
  const berthParam = firstStr(sp.berth) || "AJ";

  const whale35Check = evaluateCruiseTimingWindow({
    claaArrivalLocal: arrivalParam,
    confirmedAllAboardLocal: allAboardParam,
    berthCode: berthParam,
    tourDurationMinutes: 210, // 3.5h
  });
  const mendenhall30Check = evaluateCruiseTimingWindow({
    claaArrivalLocal: arrivalParam,
    confirmedAllAboardLocal: allAboardParam,
    berthCode: berthParam,
    tourDurationMinutes: 180, // 3.0h
  });
  const combo55Check = evaluateCruiseTimingWindow({
    claaArrivalLocal: arrivalParam,
    confirmedAllAboardLocal: allAboardParam,
    berthCode: berthParam,
    tourDurationMinutes: 330, // 5.5h
  });

  const partnerSuffix = firstStr(sp.partner)
    ? `&partner=${encodeURIComponent(firstStr(sp.partner)!)}&partner_role=${encodeURIComponent(firstStr(sp.partner_role) || "cruise_planner")}`
    : "";

  return (
    <main className="min-h-screen bg-[#05080f] px-6 py-10 text-white md:py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildWebPageJsonLd({
              path: "/juneau/cruise-excursions-what-to-do",
              name: "Which Juneau Tours Fit a Short Port Call? | DCC Authority",
              description:
                "Verify which Juneau excursions fit a short 5.5–6.5 hour CLAA port call with a 60–90 minute gangway return buffer before confirmed all-aboard.",
              dateModified: "2026-11-07",
              isPartOfPath: "/juneau",
            }),
            buildBreadcrumbJsonLd([
              { name: "Juneau", item: "/juneau" },
              {
                name: "Short Port-Call Excursion Fit",
                item: "/juneau/cruise-excursions-what-to-do",
              },
            ]),
          ],
        }}
      />

      <div className="mx-auto max-w-5xl space-y-7">
        <header className="rounded-[2.2rem] border border-amber-400/30 bg-[#0c121d] p-8 md:p-10 space-y-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#f5b34b]">
              DCC Juneau Cruise Timing Authority · Short Port-Call Guide
            </p>
            <span
              data-testid="dcc-short-port-call-badge"
              className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-200"
            >
              Active Check: Arrival {arrivalParam} · All-Aboard {allAboardParam} · Berth {berthParam}
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            Which Juneau Tours Fit a Short Cruise Port Call?
          </h1>

          <p className="max-w-3xl text-base leading-7 text-white/80">
            On a short <strong>5.5 to 6.5 hour Juneau port call</strong> (such as{" "}
            <strong>Norwegian Bliss 07:00–13:30</strong> at AJ Dock or{" "}
            <strong>Norwegian Encore 14:30–21:00</strong>), you cannot safely stack a
            5.5-hour Whale + Glacier combo once you account for berth-to-check-in
            shuttle transfers and the <strong>60–90 minute DCC gangway buffer</strong>.
            Choose a single-activity <strong>3.0–3.5 hour excursion</strong> so you
            return to the gangway well before confirmed all-aboard.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={`https://www.lastfrontiershoreexcursions.com/juneau/whale-watching?src=dcc-juneau-short-port-call&offer=331813P1${partnerSuffix}`}
              data-testid="dcc-short-port-to-lfse-whale"
              data-dcc-next-step="lastfrontiershoreexcursions"
              className="rounded-full bg-[#f5b34b] px-5 py-3 text-xs font-black uppercase tracking-[0.15em] text-[#07111d] hover:bg-[#f7bf6a] transition"
            >
              Book 3.5h Small-Group Whale Watch (331813P1) on Alaska Storefront ↗
            </a>
            <a
              href={`https://juneauflightdeck.com/juneau-whale-watching-tours?src=dcc-juneau-short-port-call${partnerSuffix}`}
              data-testid="dcc-short-port-to-jfd-whale-deck"
              data-dcc-next-step="juneauflightdeck"
              className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/25 transition"
            >
              Open Juneau Flight Deck · Whale Deck ↗
            </a>
            <Link
              href="/juneau/what-to-do-if-helicopter-tour-canceled"
              className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-bold text-white hover:bg-white/15 transition"
            >
              What If My Helicopter Flight Is Canceled? →
            </Link>
          </div>
        </header>

        {/* Direct Comparison Matrix for Short Port Calls */}
        <section
          data-testid="dcc-short-port-call-matrix"
          className="rounded-3xl border border-white/10 bg-[#0b1018] p-6 md:p-8 space-y-5"
        >
          <h2 className="text-2xl font-black text-white">
            Short Port Call Fit Matrix (Evaluated for {arrivalParam} Arrival → {allAboardParam} Confirmed All-Aboard at Berth {berthParam})
          </h2>

          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <article className="rounded-2xl border border-emerald-400/35 bg-emerald-950/20 p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  1. 3.5h Whale Watch (331813P1)
                </span>
                <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
                  {whale35Check.statusBadgeLabel}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Small-Group Auke Bay Whale Watching ($189)
              </h3>
              <p className="text-xs leading-6 text-white/80">
                210 min dock-to-dock + berth transfer leaves{" "}
                <strong>{whale35Check.marginBeforeAllAboardMinutes ?? 90} min</strong> before
                confirmed all-aboard (required buffer:{" "}
                {whale35Check.dccBufferMinutes} min). Best wildlife choice for
                short port calls.
              </p>
              <a
                href={`https://www.lastfrontiershoreexcursions.com/juneau/whale-watching?src=dcc-juneau-short-port-call&offer=331813P1${partnerSuffix}`}
                className="inline-block rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#04120a]"
              >
                Select 3.5h Whale Tour (331813P1) ↗
              </a>
            </article>

            <article className="rounded-2xl border border-cyan-400/35 bg-cyan-950/20 p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                  2. 3.0h Glacier Express (5857SHUTTLE)
                </span>
                <span className="rounded-full bg-cyan-400/20 px-2.5 py-0.5 text-[11px] font-bold text-cyan-200">
                  {mendenhall30Check.statusBadgeLabel}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Mendenhall Glacier Express Shuttle ($80)
              </h3>
              <p className="text-xs leading-6 text-white/80">
                180 min round-trip leaves{" "}
                <strong>{mendenhall30Check.marginBeforeAllAboardMinutes ?? 120} min</strong>{" "}
                before confirmed all-aboard. Ideal when you want Nugget Falls &amp;
                Visitor Center on a tight morning or afternoon call.
              </p>
              <a
                href={`https://www.lastfrontiershoreexcursions.com/juneau/mendenhall-glacier?src=dcc-juneau-short-port-call&offer=5857SHUTTLE${partnerSuffix}`}
                className="inline-block rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#041018]"
              >
                Select 3.0h Glacier Express (5857SHUTTLE) ↗
              </a>
            </article>

            <article className="rounded-2xl border border-rose-400/35 bg-rose-950/20 p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                  3. 5.5h Whale + Glacier Combo (466119P3)
                </span>
                <span className="rounded-full bg-rose-400/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-200">
                  {combo55Check.statusBadgeLabel}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Whale Watching + Mendenhall Combo ($225)
              </h3>
              <p className="text-xs leading-6 text-white/80">
                330 min duration requires a <strong>7.5+ hour port call</strong> (such as
                Royal Princess 08:00–21:00 or Celebrity Edge 07:30–19:00). Do not book
                on a 6-hour morning call.
              </p>
              <a
                href={`https://www.lastfrontiershoreexcursions.com/juneau/whale-watching?src=dcc-juneau-short-port-call&offer=466119P3${partnerSuffix}`}
                className="inline-block rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white"
              >
                For 7.5h+ Port Calls Only (466119P3) ↗
              </a>
            </article>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
            <table className="w-full text-left text-xs text-white/85">
              <thead className="border-b border-white/10 bg-white/[0.04] text-[11px] uppercase tracking-wider text-[#f5b34b]">
                <tr>
                  <th className="px-4 py-3">Ship &amp; CLAA Date</th>
                  <th className="px-4 py-3">Berth</th>
                  <th className="px-4 py-3">Port Window</th>
                  <th className="px-4 py-3">Confirmed All-Aboard</th>
                  <th className="px-4 py-3">3.5h Whale (331813P1)</th>
                  <th className="px-4 py-3">5.5h Combo (466119P3)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {CLAA_JUNEAU_PORT_SCHEDULE.map((row) => {
                  const fit35 = evaluateCruiseTimingWindow({
                    claaArrivalLocal: row.claaArrivalLocal,
                    claaDepartureLocal: row.claaDepartureLocal,
                    confirmedAllAboardLocal: row.confirmedAllAboardLocal,
                    berthCode: row.berthCode,
                    tourDurationMinutes: 210,
                  });
                  const fit55 = evaluateCruiseTimingWindow({
                    claaArrivalLocal: row.claaArrivalLocal,
                    claaDepartureLocal: row.claaDepartureLocal,
                    confirmedAllAboardLocal: row.confirmedAllAboardLocal,
                    berthCode: row.berthCode,
                    tourDurationMinutes: 330,
                  });
                  return (
                    <tr key={row.scheduleId}>
                      <td className="px-4 py-3 font-semibold text-white">
                        {row.shipName} ({row.serviceDate})
                      </td>
                      <td className="px-4 py-3">{row.berthLabel}</td>
                      <td className="px-4 py-3">
                        {row.claaArrivalLocal}–{row.claaDepartureLocal}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {row.confirmedAllAboardLocal || "Unknown"}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-300">
                        {fit35.statusBadgeLabel}
                      </td>
                      <td className="px-4 py-3 font-bold text-amber-200">
                        {fit55.statusBadgeLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <PartnerSharePlanningBar
          market="juneau"
          activePartnerParam={firstStr(sp.partner)}
          activePartnerRoleParam={firstStr(sp.partner_role)}
          activeCancelRefParam={firstStr(sp.cancel_ref)}
          activeTrafficSourceParam={firstStr(sp.src)}
        />
      </div>
    </main>
  );
}
