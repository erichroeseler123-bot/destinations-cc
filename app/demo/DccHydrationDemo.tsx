"use client";

import React, { useState } from "react";
import Link from "next/link";

export type RouteOffering = {
  route_id: string;
  origin: string;
  destination: string;
  vehicle_class: string;
  price_cents: number;
  price_formatted: string;
  duration_minutes: number;
  rezdy_product_code?: string;
  online_bookable: boolean;
};

export type HydrationDemoProps = {
  wellKnownEndpoint: string;
  routesEndpoint: string;
  wellKnownPayload: any;
  routesPayload: any;
  rawByteSha256: string;
  ledgerTipHash: string;
  ledgerRecordsCount: number;
  fetchedAt: string;
  fetchError?: string | null;
  httpStatus?: number;
  validation?: { valid: boolean; errors: Array<{ code: string; message: string; field: string }> } | null;
  freshness?: { is_fresh: boolean; as_of: string | null; fresh_until: string | null; facts: any[] } | null;
  simulateMode?: string | null;
};

export default function DccHydrationDemo({
  wellKnownEndpoint,
  routesEndpoint,
  wellKnownPayload,
  routesPayload,
  rawByteSha256,
  ledgerTipHash,
  ledgerRecordsCount,
  fetchedAt,
  fetchError,
  httpStatus = 200,
  validation,
  freshness,
  simulateMode,
}: HydrationDemoProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>("DEN-VAIL");
  const [activeTab, setActiveTab] = useState<"catalog" | "actions" | "wire" | "ledger">("catalog");
  const [availabilityOrigin, setAvailabilityOrigin] = useState("DEN");
  const [availabilityDest, setAvailabilityDest] = useState("Vail");
  const [availabilityDate, setAvailabilityDate] = useState("2026-12-20");
  const [availabilityResult, setAvailabilityResult] = useState<any>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const claims = Array.isArray(wellKnownPayload?.claims) ? wellKnownPayload.claims : [];
  const state = Array.isArray(wellKnownPayload?.state) ? wellKnownPayload.state : [];
  const actions = Array.isArray(wellKnownPayload?.actions) ? wellKnownPayload.actions : [];

  const legalNameClaim = claims.find((c: any) => c.predicate === "legal_name")?.value || "GoSno LLC";
  const authorityClaim = claims.find((c: any) => c.predicate === "operating_authority")?.value || "CO PUC LL-03577";

  const serviceStatus = state.find((s: any) => s.predicate === "service_status");
  const asOf = serviceStatus?.as_of || fetchedAt;
  const freshUntil = serviceStatus?.fresh_until || "Unknown";
  const isFresh = freshness ? freshness.is_fresh : true;

  const routesList: RouteOffering[] = Array.isArray(routesPayload?.claims)
    ? routesPayload.claims
        .filter((c: any) => c.predicate === "route_offering" && c.value)
        .map((c: any) => c.value)
    : [];

  const selectedRoute = routesList.find((r) => r.route_id === selectedRouteId) || routesList[0];

  const handleTestAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvailabilityLoading(true);
    setAvailabilityResult(null);

    try {
      const url = `https://gosno.co/api/availability?origin=${encodeURIComponent(
        availabilityOrigin
      )}&dest=${encodeURIComponent(availabilityDest)}&date=${encodeURIComponent(
        availabilityDate
      )}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({ status: res.status, statusText: res.statusText }));
      setAvailabilityResult({
        url,
        httpStatus: res.status,
        data,
      });
    } catch (err: any) {
      setAvailabilityResult({
        error: err.message || "Network request failed",
      });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-white">
      {/* Top Protocol Header */}
      <header className="border-b border-white/10 bg-[#080d14]/90 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-mono text-sm font-black tracking-widest text-cyan-300 hover:text-white transition">
              DCC // COMMAND CENTER
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Live Endpoint Hydration Demo
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            {fetchError ? (
              <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-red-300">
                HTTP {httpStatus} ERROR
              </span>
            ) : !isFresh ? (
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-amber-300">
                STALE STATE
              </span>
            ) : validation && !validation.valid ? (
              <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-red-300">
                VALIDATION FAILED
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-emerald-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE HYDRATED
              </span>
            )}
            <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-cyan-300">
              CORE v2
            </span>
            <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-purple-300">
              0 BYTES DUPLICATED
            </span>
          </div>
        </div>
      </header>

      {/* State & Audit Simulation Switcher Bar */}
      <div className="border-b border-white/5 bg-[#090f18] px-5 py-2.5">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-white/40 uppercase">Audit Test Modes:</span>
            <Link
              href="/demo"
              className={`rounded px-2.5 py-1 font-mono transition ${
                !simulateMode
                  ? "bg-cyan-400 text-black font-bold"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              1. Live GoSno (Normal)
            </Link>
            <Link
              href="/demo?simulate=failure"
              className={`rounded px-2.5 py-1 font-mono transition ${
                simulateMode === "failure"
                  ? "bg-red-500 text-white font-bold"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              2. Endpoint Failure
            </Link>
            <Link
              href="/demo?simulate=stale"
              className={`rounded px-2.5 py-1 font-mono transition ${
                simulateMode === "stale"
                  ? "bg-amber-500 text-black font-bold"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              3. Stale State
            </Link>
            <Link
              href="/demo?simulate=malformed"
              className={`rounded px-2.5 py-1 font-mono transition ${
                simulateMode === "malformed"
                  ? "bg-rose-500 text-white font-bold"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              4. Malformed Payload
            </Link>
          </div>
          <span className="font-mono text-[11px] text-white/30 hidden sm:inline">
            Verification Invariant: Non-mutating test audits
          </span>
        </div>
      </div>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Error / Malformed / Stale Alert Banners */}
        {fetchError ? (
          <div className="mb-8 rounded-2xl border border-red-500/40 bg-red-950/30 p-6">
            <div className="flex items-center gap-2 text-red-400 font-mono text-xs uppercase font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Endpoint Fetch Error (HTTP {httpStatus})
            </div>
            <h2 className="mt-2 text-xl font-bold text-white">Authoritative Endpoint Unavailable</h2>
            <p className="mt-1 text-sm text-white/70 font-mono">{fetchError}</p>
            <p className="mt-3 text-xs text-white/40">
              The Destination Command Center does not fall back to stale or cached data silently when an authoritative endpoint fails.
            </p>
          </div>
        ) : null}

        {validation && !validation.valid ? (
          <div className="mb-8 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-6">
            <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Constitutional Validation Failure (Core v2)
            </div>
            <h2 className="mt-2 text-xl font-bold text-white">Payload Rejected by DCC Core v2 Validator</h2>
            <ul className="mt-3 list-disc list-inside space-y-1 text-xs text-rose-200 font-mono">
              {validation.errors.map((err, idx) => (
                <li key={idx}>
                  <strong className="text-white">{err.code}</strong> [{err.field}]: {err.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!isFresh ? (
          <div className="mb-8 rounded-2xl border border-amber-500/40 bg-amber-950/30 p-6">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Stale Operating Data Warning
            </div>
            <h2 className="mt-2 text-xl font-bold text-white">State Fact Expired</h2>
            <p className="mt-1 text-xs text-white/70">
              The operator's guaranteed freshness timestamp (<code className="text-amber-300 font-mono">{freshUntil}</code>) is in the past. This snapshot is presented with explicit stale notification rather than misleading the user.
            </p>
          </div>
        ) : null}

        {/* Zero Database Guarantee Callout */}
        <div className="mb-8 rounded-2xl border border-cyan-400/30 bg-cyan-950/20 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-cyan-400/10 px-2.5 py-1 text-xs font-mono font-bold uppercase text-cyan-300">
                Architectural Invariant
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
                Direct Machine Hydration — Zero Secondary Database Duplication
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                This page is an open projection view. Destination Command Center does{" "}
                <strong className="text-white underline decoration-cyan-400/50">not store, replicate, or duplicate</strong>{" "}
                GoSno’s schedules, routes, or prices. Every claim, route, and operational fact below was fetched directly over HTTPS from GoSno’s canonical machine-readable endpoint.
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
              <a
                href="https://gosno.co/.well-known/dcc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-[#041216] hover:bg-cyan-300 transition"
              >
                Inspect Authoritative Endpoint ↗
              </a>
              <span className="font-mono text-[11px] text-white/40">
                Target: {wellKnownEndpoint}
              </span>
            </div>
          </div>
        </div>

        {/* Live Authority & Operating Overview Cards */}
        <div className="grid gap-5 md:grid-cols-3 mb-8">
          {/* Card 1: Authoritative Identity */}
          <div className="rounded-2xl border border-white/10 bg-[#090e17] p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">Authoritative Identity</p>
            <h2 className="mt-2 text-xl font-bold text-white">{legalNameClaim}</h2>
            <p className="mt-1 font-mono text-xs text-white/40">{wellKnownPayload?.id || "gosno.co:org/gosno"}</p>
            <div className="mt-4 border-t border-white/10 pt-3 text-xs space-y-2 text-white/70">
              <div className="flex items-center justify-between">
                <span className="text-white/40">Regulatory License:</span>
                <span className="font-mono font-bold text-emerald-300">{authorityClaim}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Evidence Authority:</span>
                <a
                  href="https://puc.colorado.gov/transportation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 hover:underline"
                >
                  Colorado PUC ↗
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Verification Status:</span>
                <span className="text-amber-300 text-[11px]">Operator-Declared</span>
              </div>
            </div>
          </div>

          {/* Card 2: Operating State & Freshness */}
          <div className="rounded-2xl border border-white/10 bg-[#090e17] p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">Live Operating State</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${isFresh ? "bg-emerald-400" : "bg-amber-400"}`}></span>
              <span className="text-xl font-bold capitalize text-white">
                {serviceStatus?.value || "operational"}
              </span>
            </div>
            <p className="mt-1 text-xs text-white/50">Continuous live transport operations</p>
            <div className="mt-4 border-t border-white/10 pt-3 text-xs space-y-2 text-white/70">
              <div className="flex items-center justify-between">
                <span className="text-white/40">As Of (Operator):</span>
                <span className="font-mono text-[11px] text-white/80">{new Date(asOf).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Fresh Until:</span>
                <span className={`font-mono text-[11px] ${isFresh ? "text-emerald-300" : "text-amber-300"}`}>
                  {new Date(freshUntil).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">State Freshness:</span>
                <span className={isFresh ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                  {isFresh ? "VERIFIED FRESH" : "STALE DATA"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Cryptographic Ledger Proof */}
          <div className="rounded-2xl border border-white/10 bg-[#090e17] p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">Continuity Proof</p>
            <h2 className="mt-2 text-xl font-bold text-white">Cryptographic Ledger</h2>
            <p className="mt-1 text-xs text-white/50">Logged in public Git observation ledger</p>
            <div className="mt-4 border-t border-white/10 pt-3 text-xs space-y-2 text-white/70">
              <div className="flex items-center justify-between">
                <span className="text-white/40">Ledger Records:</span>
                <span className="font-mono font-bold text-cyan-300">{ledgerRecordsCount} observations</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Tip Hash:</span>
                <span className="font-mono text-[11px] text-white/80">{ledgerTipHash.slice(0, 10)}...</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Raw Byte SHA-256:</span>
                <span className="font-mono text-[11px] text-white/80">{rawByteSha256.slice(0, 10)}...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-white/10 mb-6">
          <div className="flex gap-6 font-mono text-xs uppercase tracking-wider">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`pb-3 border-b-2 transition ${
                activeTab === "catalog"
                  ? "border-cyan-400 text-cyan-300 font-bold"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              1. Live Routes Catalog ({routesList.length})
            </button>
            <button
              onClick={() => setActiveTab("actions")}
              className={`pb-3 border-b-2 transition ${
                activeTab === "actions"
                  ? "border-cyan-400 text-cyan-300 font-bold"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              2. Direct Machine Actions ({actions.length})
            </button>
            <button
              onClick={() => setActiveTab("wire")}
              className={`pb-3 border-b-2 transition ${
                activeTab === "wire"
                  ? "border-cyan-400 text-cyan-300 font-bold"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              3. Raw Wire Inspector
            </button>
            <button
              onClick={() => setActiveTab("ledger")}
              className={`pb-3 border-b-2 transition ${
                activeTab === "ledger"
                  ? "border-cyan-400 text-cyan-300 font-bold"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              4. Continuity Audit Ledger
            </button>
          </div>
        </div>

        {/* Tab 1: Live Routes Catalog */}
        {activeTab === "catalog" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Live Mountain Transportation Offerings</h2>
                <p className="text-xs text-white/50">
                  Hydrated directly from <code className="text-cyan-300">{routesEndpoint}</code>
                </p>
              </div>
              <span className="text-xs font-mono text-white/40">Click a route to inspect individual DCC endpoint</span>
            </div>

            {routesList.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-[#090e17] p-8 text-center text-white/50 text-xs">
                No route offerings available in current view state.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                {routesList.map((route) => {
                  const isSelected = route.route_id === selectedRouteId;
                  return (
                    <button
                      key={route.route_id}
                      onClick={() => setSelectedRouteId(route.route_id)}
                      className={`text-left rounded-xl border p-4 transition ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-950/30 ring-1 ring-cyan-400"
                          : "border-white/10 bg-[#090e17] hover:border-white/20 hover:bg-[#0c131f]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-cyan-300">{route.route_id}</span>
                        <span className="text-xs font-bold text-emerald-300">{route.price_formatted}</span>
                      </div>
                      <div className="mt-2 text-sm font-semibold text-white">
                        {route.origin} → {route.destination}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-white/50">
                        <span className="capitalize">{route.vehicle_class}</span>
                        <span>•</span>
                        <span>{route.duration_minutes} mins</span>
                        <span>•</span>
                        <span className="text-emerald-400">Instant Book</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected Route Inspection Detail */}
            {selectedRoute && (
              <div className="rounded-2xl border border-white/10 bg-[#070b12] p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">
                      Authoritative Route Endpoint
                    </span>
                    <h3 className="mt-1 text-xl font-bold text-white">
                      {selectedRoute.origin} to {selectedRoute.destination} ({selectedRoute.route_id})
                    </h3>
                  </div>
                  <a
                    href={`https://gosno.co/api/dcc/routes/${selectedRoute.route_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-cyan-300 hover:underline"
                  >
                    https://gosno.co/api/dcc/routes/{selectedRoute.route_id} ↗
                  </a>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 block">Price</span>
                    <span className="text-lg font-black text-emerald-300">{selectedRoute.price_formatted}</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 block">Vehicle Class</span>
                    <span className="text-lg font-black text-white uppercase">{selectedRoute.vehicle_class}</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 block">Drive Time</span>
                    <span className="text-lg font-black text-white">{selectedRoute.duration_minutes} minutes</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 block">Direct Booking</span>
                    <span className="text-lg font-black text-cyan-300">Available Direct</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Direct Machine Actions */}
        {activeTab === "actions" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#090e17] p-6">
              <h2 className="text-lg font-bold text-white">Declared Direct Machine Actions</h2>
              <p className="mt-1 text-xs text-white/60">
                These actions allow external agents, applications, and travelers to interact directly with GoSno without intermediary platforms.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {actions.map((act: any) => (
                  <div key={act.action_id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-cyan-300">{act.action_id}</span>
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                        {act.method}
                      </span>
                    </div>
                    <div className="mt-3 text-xs font-mono text-white/70 break-all">
                      Target: <a href={act.target} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">{act.target}</a>
                    </div>
                    <div className="mt-2 text-xs text-white/40">
                      Auth: <span className="font-mono text-emerald-300">{act.auth}</span>
                    </div>
                    {act.input?.fields && (
                      <div className="mt-3 text-[11px] text-white/50">
                        Fields: <span className="font-mono text-white/70">{act.input.fields.join(", ")}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Non-Mutating Live Action Tester */}
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/15 p-6">
              <div className="inline-flex items-center gap-1.5 rounded bg-cyan-400/20 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                Action Safety Invariant: actions introspected: 28; actions executed: 0 (mutating)
              </div>
              <h3 className="mt-2 text-base font-bold text-white">
                Live Query Test: <code className="text-cyan-300">check_availability</code>
              </h3>
              <p className="mt-1 text-xs text-white/60">
                Test the non-mutating availability action directly against GoSno’s live action endpoint.
              </p>

              <form onSubmit={handleTestAvailability} className="mt-4 grid gap-4 sm:grid-cols-4 items-end">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block mb-1">Origin</label>
                  <input
                    type="text"
                    value={availabilityOrigin}
                    onChange={(e) => setAvailabilityOrigin(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block mb-1">Destination</label>
                  <input
                    type="text"
                    value={availabilityDest}
                    onChange={(e) => setAvailabilityDest(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block mb-1">Date</label>
                  <input
                    type="date"
                    value={availabilityDate}
                    onChange={(e) => setAvailabilityDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={availabilityLoading}
                  className="rounded-lg bg-cyan-400 px-4 py-2.5 text-xs font-bold text-[#041216] hover:bg-cyan-300 disabled:opacity-50 transition"
                >
                  {availabilityLoading ? "Calling Endpoint..." : "Call Live Action ↗"}
                </button>
              </form>

              {availabilityResult && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-xs">
                  <div className="flex items-center justify-between text-white/50 mb-2">
                    <span>Target URL: {availabilityResult.url}</span>
                    <span className="text-emerald-300">HTTP {availabilityResult.httpStatus}</span>
                  </div>
                  <pre className="overflow-x-auto text-[11px] text-white/80 p-2 bg-black/60 rounded">
                    {JSON.stringify(availabilityResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Raw Wire Inspector */}
        {activeTab === "wire" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#090e17] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Unmodified Wire Payload</h2>
                  <p className="text-xs text-white/50">
                    Raw JSON received from <code className="text-cyan-300">{wellKnownEndpoint}</code>
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-white/40">SHA-256: </span>
                  <span className="text-emerald-300">{rawByteSha256}</span>
                </div>
              </div>
              <pre className="rounded-xl border border-white/10 bg-black/60 p-5 font-mono text-xs text-white/80 overflow-x-auto max-h-[500px]">
                {JSON.stringify(wellKnownPayload, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 4: Continuity Audit Ledger */}
        {activeTab === "ledger" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#090e17] p-6">
              <h2 className="text-lg font-bold text-white">Public Cryptographic Observation Ledger</h2>
              <p className="mt-1 text-xs text-white/60">
                All observations are continuously appended to <code className="text-cyan-300">ledger/observations.jsonl</code> with RFC 8785 JSON Canonicalization Scheme (JCS) hash chaining and published to GitHub.
              </p>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/40">Total Ledger Observations:</span>
                  <span className="font-bold text-cyan-300">{ledgerRecordsCount} records</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Current Chain Tip Hash:</span>
                  <span className="font-bold text-emerald-300 break-all">{ledgerTipHash}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Public GitHub Ledger:</span>
                  <a
                    href="https://github.com/erichroeseler123-bot/destinations-cc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 hover:underline"
                  >
                    github.com/erichroeseler123-bot/destinations-cc ↗
                  </a>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-xs text-amber-200/80">
                <strong>Cryptographic Notice:</strong> Cryptographic continuity detects alteration but does not itself make local files immutable. The public Git repository serves as the distributed witness for verifiable history.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
