"use client";

import { useState } from "react";
import type { QaTour } from "./ConciergeQaChecklist";

type AuditResult = {
  slug: string;
  status: number | null;
  routeOk: boolean;
  bookingLinkPresent: boolean;
  bookingLinkCount: number;
  mappingPresent: boolean;
  error?: string;
};

export default function LiveRouteAudit({ tours }: { tours: QaTour[] }) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, AuditResult>>({});

  const runAudit = async () => {
    setRunning(true);
    const entries = await Promise.all(
      tours.map(async (tour): Promise<[string, AuditResult]> => {
        try {
          const response = await fetch(`/tours/${tour.slug}?qa=${Date.now()}`, {
            cache: "no-store",
            headers: { "x-wno-qa": "route-audit" },
          });
          const html = await response.text();
          const bookingLinkCount = (html.match(/fareharbor\.com\/embeds\/book\//g) ?? []).length;
          const bookingLinkPresent = bookingLinkCount > 0;
          const mappingPresent = tour.itemId
            ? html.includes(`/items/${tour.itemId}/`)
            : tour.flowId
              ? html.includes(`flow=${tour.flowId}`) || html.includes(`flow%3D${tour.flowId}`)
              : tour.variantCount > 0
                ? bookingLinkCount >= tour.variantCount
                : false;
          return [tour.slug, {
            slug: tour.slug,
            status: response.status,
            routeOk: response.ok,
            bookingLinkPresent,
            bookingLinkCount,
            mappingPresent,
          }];
        } catch (error) {
          return [tour.slug, {
            slug: tour.slug,
            status: null,
            routeOk: false,
            bookingLinkPresent: false,
            bookingLinkCount: 0,
            mappingPresent: false,
            error: error instanceof Error ? error.message : "Fetch failed",
          }];
        }
      }),
    );
    setResults(Object.fromEntries(entries));
    setRunning(false);
  };

  const completed = Object.values(results);
  const passed = completed.filter((result) => result.routeOk && result.bookingLinkPresent && result.mappingPresent).length;

  return (
    <section className="mx-auto mb-12 w-[min(1180px,calc(100%-2rem))] border border-[#4a3d26] bg-[#0f0e0b] p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9a86a]">Automated production probe</p>
          <h2 className="mt-2 font-serif text-2xl text-[#f3dfb3]">Live 21-route booking audit</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#9d9587]">Checks each live detail route, confirms direct FareHarbor links are rendered in HTML without requiring JavaScript, and verifies the configured item, flow, or variant mapping appears on the page.</p>
        </div>
        <button type="button" disabled={running} onClick={runAudit} className="border border-[#c9a86a] bg-[#c9a86a] px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#17130c] disabled:opacity-50">
          {running ? "Running 21 checks…" : "Run live audit"}
        </button>
      </div>

      {completed.length > 0 && (
        <div className="mt-5">
          <p className="mb-4 text-sm font-semibold text-[#e8d8b4]">{passed} / {tours.length} routes fully passed</p>
          <div className="grid gap-2 md:grid-cols-2">
            {tours.map((tour) => {
              const result = results[tour.slug];
              const ok = result?.routeOk && result?.bookingLinkPresent && result?.mappingPresent;
              return (
                <div key={tour.slug} className="grid grid-cols-[1fr_auto] gap-3 border border-[#252119] bg-[#12110e] p-3">
                  <div>
                    <p className="text-sm font-semibold text-[#eee3cc]">{tour.title}</p>
                    <p className="mt-1 text-[10px] text-[#81796d]">/tours/{tour.slug}</p>
                    {result && result.bookingLinkCount > 0 && <p className="mt-1 text-[10px] text-[#81796d]">{result.bookingLinkCount} FareHarbor link{result.bookingLinkCount === 1 ? "" : "s"} rendered</p>}
                  </div>
                  <div className="text-right text-[10px] uppercase tracking-[0.12em]">
                    {!result ? <span className="text-[#81796d]">Not run</span> : ok ? (
                      <span className="text-[#9dbb91]">PASS · {result.status}</span>
                    ) : (
                      <div className="text-[#d78b8b]">
                        <div>FAIL · {result.status ?? "ERR"}</div>
                        {!result.routeOk && <div>route</div>}
                        {!result.bookingLinkPresent && <div>booking link</div>}
                        {!result.mappingPresent && <div>mapping</div>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}