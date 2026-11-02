import React from "react";
import {
  resolveTransportModeComparison,
  type TransportModeGuide,
} from "@/lib/dcc/travelReferenceCore";
import { IntegrationBadge } from "@/app/components/dcc/TravelReferenceClientInteractive";

export type TransitComparisonTableProps = {
  modes: TransportModeGuide[];
  transportModeQualificationById?: Record<string, string>;
  compact?: boolean;
  title?: string;
  subtitle?: string;
};

export default function TransitComparisonTable({
  modes,
  transportModeQualificationById = {},
  compact = false,
  title,
  subtitle,
}: TransitComparisonTableProps) {
  if (!modes || modes.length === 0) return null;

  return (
    <div
      data-testid="transit-comparison-table"
      className="rounded-2xl border border-white/10 bg-zinc-950/90 overflow-hidden shadow-lg"
    >
      {(title || subtitle) && (
        <div className="border-b border-white/10 bg-zinc-900/70 px-4 py-3.5 md:px-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            {title && (
              <h3 className="text-sm md:text-base font-black text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
            Side-by-Side Transit Matrix ({modes.length} Modes)
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900/90 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <th scope="col" className="p-3.5 md:p-4 min-w-[220px]">
                Transit Mode &amp; Authority
              </th>
              <th scope="col" className="p-3.5 md:p-4 min-w-[190px]">
                Pricing &amp; Fare Model
              </th>
              <th scope="col" className="p-3.5 md:p-4 min-w-[210px]">
                Egress / Transit Time &amp; Bottlenecks
              </th>
              <th scope="col" className="p-3.5 md:p-4 min-w-[230px]">
                Statutory Laws &amp; Lot / Dock Rules
              </th>
              {!compact && (
                <th scope="col" className="p-3.5 md:p-4 min-w-[260px]">
                  Practical Reality &amp; Official Source
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {modes.map((mode) => {
              const qualification = transportModeQualificationById[mode.id];
              const comparison = resolveTransportModeComparison(mode);

              return (
                <tr
                  key={mode.id}
                  data-transport-mode-id={mode.id}
                  className="align-top hover:bg-zinc-900/40 transition-colors"
                >
                  {/* Column 1: Mode & Operator */}
                  <td className="p-3.5 md:p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                        {mode.category.replaceAll("_", " ")}
                      </span>
                      <IntegrationBadge
                        status={
                          mode.scheduleAndStatusIntegration === "live_integrated"
                            ? "live_integrated"
                            : "linked_official_resource"
                        }
                      />
                    </div>
                    <div className="font-bold text-white text-sm leading-snug">
                      {mode.modeName}
                    </div>
                    {qualification && (
                      <div
                        role="note"
                        className="rounded-xl border border-amber-400/40 bg-amber-950/40 p-2.5 text-xs text-amber-100"
                      >
                        <strong className="text-amber-300">
                          Evidence Qualification:
                        </strong>{" "}
                        {qualification}
                      </div>
                    )}
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      <strong className="text-zinc-200">Authority:</strong>{" "}
                      {mode.operatorOrAuthority}
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      <strong className="text-zinc-200">Route / Coverage:</strong>{" "}
                      {mode.routeOrCoverage}
                    </p>
                    {compact && (
                      <div className="pt-1">
                        <a
                          href={mode.officialResourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:underline"
                        >
                          <span>{mode.officialResourceLabel}</span>
                          <span aria-hidden="true">↗</span>
                        </a>
                      </div>
                    )}
                  </td>

                  {/* Column 2: Pricing Model */}
                  <td className="p-3.5 md:p-4 text-zinc-200 leading-relaxed">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-3 text-xs text-emerald-100 leading-relaxed">
                      {comparison.pricingModel}
                    </div>
                  </td>

                  {/* Column 3: Egress / Transit Timing */}
                  <td className="p-3.5 md:p-4 text-zinc-200 leading-relaxed">
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3 text-xs text-indigo-100 leading-relaxed">
                      {comparison.egressOrTransitTiming}
                    </div>
                  </td>

                  {/* Column 4: Statutory / Operational Rules */}
                  <td className="p-3.5 md:p-4 text-zinc-200 leading-relaxed">
                    <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-3 text-xs text-amber-100 leading-relaxed">
                      {comparison.statutoryOrOperationalRule}
                    </div>
                  </td>

                  {/* Column 5: Practical Reality, Constraints & Verification */}
                  {!compact && (
                    <td className="p-3.5 md:p-4 space-y-2.5 text-xs text-zinc-300 leading-relaxed">
                      <p className="text-zinc-200 font-medium leading-relaxed">
                        {mode.whatWorksInPractice}
                      </p>
                      <ul className="space-y-1 text-[11px] text-zinc-400 list-disc pl-4">
                        {mode.practicalConstraints.map((constraint, idx) => (
                          <li key={idx}>{constraint}</li>
                        ))}
                      </ul>
                      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                        <a
                          href={mode.officialResourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:underline"
                        >
                          <span>{mode.officialResourceLabel}</span>
                          <span aria-hidden="true">↗</span>
                        </a>
                        <div className="flex flex-wrap items-center gap-1">
                          {mode.citationIds.map((cid) => (
                            <a
                              key={cid}
                              href={`#cite-${cid}`}
                              className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-200 hover:bg-cyan-500/20"
                            >
                              [{cid}]
                            </a>
                          ))}
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
