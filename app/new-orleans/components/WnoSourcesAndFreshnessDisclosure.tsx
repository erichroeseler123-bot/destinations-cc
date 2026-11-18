import React from "react";

export interface WnoSourceLinkItem {
  label: string;
  url: string;
  checkedAt?: string | null;
}

export interface WnoSourcesAndFreshnessDisclosureProps {
  verifiedAt?: string | null;
  sources?: readonly WnoSourceLinkItem[];
  showIntegrationStatus?: boolean;
  liveAvailabilityConnected?: boolean;
  directCheckoutConnected?: boolean;
  extraNotes?: string | null;
}

export default function WnoSourcesAndFreshnessDisclosure({
  verifiedAt,
  sources = [],
  showIntegrationStatus = false,
  liveAvailabilityConnected = false,
  directCheckoutConnected = false,
  extraNotes,
}: WnoSourcesAndFreshnessDisclosureProps) {
  return (
    <details
      data-testid="sources-and-freshness-disclosure"
      className="wno-dir-sources-details mt-12 rounded-2xl border border-[#1e1915]/15 bg-[#fffdf9] p-5 md:p-6 text-[#1e1915]"
    >
      <summary className="wno-dir-sources-summary flex cursor-pointer flex-wrap items-center justify-between gap-3 font-serif text-lg font-bold text-[#163828]">
        <span>Sources and freshness</span>
        <span className="rounded-full border border-[#b8893a]/40 bg-[#faf6ee] px-3 py-1 font-sans text-xs font-semibold text-[#6b5a45]">
          {verifiedAt ? `Verified ${verifiedAt}` : "Source-backed record"}
        </span>
      </summary>

      <div className="mt-4 space-y-4 border-t border-[#1e1915]/10 pt-4 text-xs leading-relaxed text-[#4a4138]">
        <p>
          <strong className="text-[#1e1915]">
            Regional facts verified via Destination Command Center
          </strong>{" "}
          {verifiedAt ? `(last checked ${verifiedAt})` : ""}. Welcome to New Orleans Tours publishes
          independent traveler planning profiles separating docks, vessels, transportation carriers,
          and historic sites.
        </p>

        {showIntegrationStatus && (
          <div className="grid gap-3 rounded-xl border border-[#1e1915]/10 bg-[#faf6ee] p-4 md:grid-cols-2">
            <div>
              <strong className="block text-[#1e1915]">Live Availability</strong>
              <span>
                {liveAvailabilityConnected ? "Connected" : "Not connected"}
              </span>
            </div>
            <div>
              <strong className="block text-[#1e1915]">Direct Checkout</strong>
              <span>
                {directCheckoutConnected
                  ? "Connected"
                  : "Not connected — book via official operator or verified partner calendar"}
              </span>
            </div>
          </div>
        )}

        {extraNotes ? <p>{extraNotes}</p> : null}

        {sources.length > 0 && (
          <div>
            <p className="font-bold uppercase tracking-wider text-[#8a6220]">
              Primary &amp; Civic Sources
            </p>
            <ul className="mt-2 space-y-1.5 pl-4 list-disc">
              {sources.map((src) => (
                <li key={`${src.url}-${src.label}`}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#163828] underline decoration-[#b8893a] underline-offset-2 hover:text-[#6b2737]"
                  >
                    {src.label}
                  </a>
                  {src.checkedAt ? (
                    <span className="text-[#6b5a45]"> (checked {src.checkedAt})</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
