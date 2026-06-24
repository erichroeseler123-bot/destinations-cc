"use client";

import { useEffect, useState, type ReactNode } from "react";
import FeastlyTrackedCtaLink from "@/app/components/dcc/FeastlyTrackedCtaLink";
import type { ResortConfig } from "@/src/data/resorts-config";
import type { SatelliteHandoffContext, SatelliteTelemetryInput } from "@/lib/satellite-runtime/types";

interface ResortCommandDeckClientProps {
  resort: ResortConfig;
  emitTelemetryAction: (input: SatelliteTelemetryInput) => Promise<void>;
  checkoutAction10: (handoff: SatelliteHandoffContext) => Promise<void>;
  checkoutAction20: (handoff: SatelliteHandoffContext) => Promise<void>;
}

export default function ResortCommandDeckClient({
  resort,
  emitTelemetryAction,
  checkoutAction10,
  checkoutAction20,
}: ResortCommandDeckClientProps) {
  const [logs, setLogs] = useState<string[]>([
    "SYS_INIT // BOOTING RESORT OS NODE...",
    `STATUS: ACTIVE // TARGET RESORT: ${resort.name.toUpperCase()}`,
    "GRID RESOLUTION: OK // LATENCY: 14ms",
    "TELEMETRY CORRIDOR: [feastly-dinner-night]",
    "MONITOR: Waiting for coordinator package execution..."
  ]);

  const [gridCells, setGridCells] = useState<boolean[]>(
    Array.from({ length: 36 }, () => Math.random() > 0.4)
  );

  const [activeTab, setActiveTab] = useState<"10" | "20">("10");

  // Simulated live log ticker
  useEffect(() => {
    const logPool = [
      "NETWORK_PULSE: Telemetry packet transmitted.",
      "DIAGNOSTIC: Active connection established with Square Gateway.",
      "METRIC_POLL: Rideshare availability index: CRITICAL.",
      "INFRASTRUCTURE: Staging route cleared for dispatch.",
      "MONITOR: Handshake confirmed with cell delta-4.",
      "DIAGNOSTIC: Villa-staging payload validation: OK.",
      "SYSTEM: Auto-cleanup dispatch scheduled."
    ];

    const interval = setInterval(() => {
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev.slice(-8), `[${timestamp}] ${randomLog}`]);

      // Randomly toggle some grid cells to look dynamic
      setGridCells((prev) =>
        prev.map((cell) => (Math.random() > 0.85 ? !cell : cell))
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-screen bg-[#07080a] text-zinc-100 flex flex-col p-4 md:p-6 overflow-hidden select-none font-mono relative">
      <style jsx global>{`
        .crt-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
                      linear-gradient(90deg, rgba(0, 255, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 255, 0, 0.03));
          background-size: 100% 3.5px, 6px 100%;
          pointer-events: none;
          z-index: 50;
          opacity: 0.35;
        }

        .crt-flicker {
          animation: crt-flicker-anim 0.15s infinite;
          pointer-events: none;
          position: absolute;
          inset: 0;
          background: rgba(16, 22, 16, 0.02);
          z-index: 45;
        }

        @keyframes crt-flicker-anim {
          0% { opacity: 0.97; }
          50% { opacity: 0.99; }
          100% { opacity: 0.97; }
        }

        /* Glow effects */
        .glow-emerald {
          text-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }
        .glow-cyan {
          text-shadow: 0 0 8px rgba(61, 243, 255, 0.6);
        }
      `}</style>

      {/* CRT Scanline and Flicker Layers */}
      <div className="crt-overlay" />
      <div className="crt-flicker" />

      {/* HEADER BAR */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border border-zinc-800 bg-[#0c0d12] px-4 py-3 rounded-t-lg gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-black text-emerald-400 glow-emerald tracking-wider uppercase">
            ● NODE: {resort.eyebrow}
          </span>
        </div>
        <div className="text-xs text-zinc-500 tracking-widest font-bold">
          DCC // RESORT OPERATIONAL RELIEF SYSTEM v2.10
        </div>
        <div className="text-xs text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
          SECURE CONNECTION
        </div>
      </header>

      {/* MAIN SCREEN SPLIT */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 mt-4 min-h-0">
        
        {/* LEFT PANEL: SYSTEM STATUS & REALITY TELEMETRY */}
        <section className="flex-1 lg:max-w-md flex flex-col gap-4 border border-zinc-800 bg-[#090a0d]/90 p-4 rounded-b-lg lg:rounded-bl-lg lg:rounded-tr-none min-h-0">
          
          {/* Section Indicator */}
          <div className="flex justify-between items-center text-[10px] text-zinc-500 border-b border-zinc-900 pb-2">
            <span>DIAGNOSTICS & TELEMETRY MODULE</span>
            <span>CELL_REF: DELTA_4</span>
          </div>

          {/* Friction Metrics */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="border border-zinc-800/80 bg-[#0c0e14] p-3 rounded">
              <div className="text-[9px] text-zinc-500 tracking-wider">COORDINATE_COMPLEXITY</div>
              <div className="text-xl font-bold text-red-500 glow-red mt-1">HIGH [CRITICAL]</div>
            </div>
            <div className="border border-zinc-800/80 bg-[#0c0e14] p-3 rounded">
              <div className="text-[9px] text-zinc-500 tracking-wider">RIDESHARE_DELAY_EST</div>
              <div className="text-xl font-bold text-amber-500 mt-1">~42 MINS</div>
            </div>
            <div className="border border-zinc-800/80 bg-[#0c0e14] p-3 rounded">
              <div className="text-[9px] text-zinc-500 tracking-wider">RESORT_WAIT_INDEX</div>
              <div className="text-xl font-bold text-amber-500 mt-1">120 MINS+</div>
            </div>
            <div className="border border-zinc-800/80 bg-[#0c0e14] p-3 rounded">
              <div className="text-[9px] text-emerald-400 tracking-wider">STAGING_STATUS</div>
              <div className="text-xl font-bold text-emerald-400 glow-emerald mt-1">STANDBY</div>
            </div>
          </div>

          {/* Active Nodes Grid (visual telemetry map) */}
          <div className="flex-1 border border-zinc-900 bg-[#08090d] p-3 rounded flex flex-col min-h-0 justify-between">
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest border-b border-zinc-950 pb-1 mb-2">
              ACTIVE TELEMETRY CELLS (WISCONSIN REGION)
            </div>
            <div className="flex-1 grid grid-cols-6 gap-2 items-center justify-items-center p-2">
              {gridCells.map((active, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition duration-300 ${
                    active
                      ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400 glow-emerald"
                      : "border-zinc-900 bg-zinc-950/40 text-zinc-700"
                  }`}
                >
                  {active ? "+" : "·"}
                </div>
              ))}
            </div>
          </div>

          {/* Console Output Log */}
          <div className="h-44 border border-zinc-900 bg-[#06070a] p-3 rounded flex flex-col justify-end min-h-0">
            <div className="text-[9px] text-zinc-600 uppercase mb-2 border-b border-zinc-950 pb-1 font-black">
              LIVE SYSTEM TRANSMISSION FEED
            </div>
            <div className="space-y-1 overflow-hidden text-[10px] text-emerald-500/80 leading-relaxed font-mono">
              {logs.map((log, index) => (
                <div key={index} className="truncate">
                  {log}
                </div>
              ))}
              <div className="flex items-center gap-0.5">
                <span>&gt; SYSTEM_MONITORING_ACTIVE</span>
                <span className="h-3 w-1.5 bg-emerald-500 animate-pulse ml-1" />
              </div>
            </div>
          </div>

        </section>

        {/* RIGHT PANEL: TRANSACTION DECK & INFRASTRUCTURE CHOOSE */}
        <section className="flex-1 flex flex-col border border-zinc-800 bg-[#090a0d]/90 p-4 rounded-b-lg lg:rounded-br-lg lg:rounded-tr-lg min-h-0 justify-between">
          
          <div className="flex-1 flex flex-col min-h-0">
            {/* Section Indicator */}
            <div className="flex justify-between items-center text-[10px] text-zinc-500 border-b border-zinc-900 pb-2 mb-4 shrink-0">
              <span>FEASTLY DINING SPREAD TRANSACTION DECK</span>
              <span>GATEWAY: SQUARE_HOSTED</span>
            </div>

            {/* Target Header Info */}
            <div className="mb-4 shrink-0">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                {resort.title}
              </h1>
              <p className="mt-2 text-xs leading-5 text-zinc-400 max-w-2xl">
                {resort.problemStatement}
              </p>
            </div>

            {/* Strict Branding Banner */}
            <div className="border border-emerald-950 bg-emerald-950/20 p-3 rounded mb-4 shrink-0">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                System Integration Policy
              </div>
              <p className="text-[11px] text-emerald-300/90 leading-5 mt-1">
                {resort.description} This page coordinates a self-contained group food spread deployment. There is no custom kitchen staff management, scheduling complexity, or menu selection hassle.
              </p>
            </div>

            {/* Split packages representation */}
            <div className="flex-1 grid md:grid-cols-2 gap-4 items-stretch min-h-0 mb-4">
              
              {/* Package 1: 10 People */}
              <article className="border border-zinc-850 bg-[#0e1017] rounded-lg p-4 flex flex-col justify-between hover:border-emerald-500/20 transition duration-300">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                      PACKAGE 10
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold uppercase glow-emerald flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" /> READY
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-white mt-3 uppercase tracking-tight">
                    10-Person Staged Node
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                    Designed for single suites, villas, or cabin main rooms. Compresses dinner logistics into a single hot station setup.
                  </p>
                  <ul className="text-[10px] text-zinc-300 mt-4 space-y-2 font-bold">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> Villa hot staging & equipment setup
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> High-abundance hot spread dispatch
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> Full cleanup & gear retrieval post-dinner
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> Eco flatware & supplies pre-packaged
                    </li>
                  </ul>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-black text-emerald-400 glow-emerald mb-3">
                    $500.00 <span className="text-[10px] text-zinc-500 font-bold tracking-normal uppercase">USD (INCLUSIVE)</span>
                  </div>
                  <FeastlyTrackedCtaLink
                    href={resort.checkoutLink10}
                    sourcePage={`/resort/${resort.slug}`}
                    cta="deploy_spread_10"
                    emitTelemetryAction={emitTelemetryAction}
                    checkoutAction={checkoutAction10}
                    className="w-full inline-flex min-h-12 items-center justify-center rounded border border-emerald-500 bg-emerald-950/20 text-xs font-black uppercase tracking-[0.16em] text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition duration-200"
                  >
                    DEPLOY 10-PERSON SPREAD
                  </FeastlyTrackedCtaLink>
                </div>
              </article>

              {/* Package 2: 20 People */}
              <article className="border border-zinc-850 bg-[#0e1017] rounded-lg p-4 flex flex-col justify-between hover:border-cyan-500/20 transition duration-300">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                      PACKAGE 20
                    </span>
                    <span className="text-[9px] text-[#3df3ff] font-bold uppercase glow-cyan flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#3df3ff] inline-block" /> READY
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-white mt-3 uppercase tracking-tight">
                    20-Person Staged Node
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                    Designed for double villas, adjoining cabins, or tournament group hospitality layouts. Complete dining redundancy.
                  </p>
                  <ul className="text-[10px] text-zinc-300 mt-4 space-y-2 font-bold">
                    <li className="flex items-center gap-2">
                      <span className="text-[#3df3ff]">✓</span> High-capacity staging (handles up to 20)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#3df3ff]">✓</span> Double-capacity hot spread dispatch
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#3df3ff]">✓</span> Full cleanup & gear retrieval post-dinner
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#3df3ff]">✓</span> Custom layout adaptation for large spaces
                    </li>
                  </ul>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-black text-[#3df3ff] glow-cyan mb-3">
                    $850.00 <span className="text-[10px] text-zinc-500 font-bold tracking-normal uppercase">USD (INCLUSIVE)</span>
                  </div>
                  <FeastlyTrackedCtaLink
                    href={resort.checkoutLink20}
                    sourcePage={`/resort/${resort.slug}`}
                    cta="deploy_spread_20"
                    emitTelemetryAction={emitTelemetryAction}
                    checkoutAction={checkoutAction20}
                    className="w-full inline-flex min-h-12 items-center justify-center rounded border border-[#3df3ff] bg-[#3df3ff]/10 text-xs font-black uppercase tracking-[0.16em] text-[#3df3ff] hover:bg-[#3df3ff] hover:text-zinc-950 hover:shadow-[0_0_15px_rgba(61,243,255,0.3)] transition duration-200"
                  >
                    DEPLOY 20-PERSON SPREAD
                  </FeastlyTrackedCtaLink>
                </div>
              </article>

            </div>
          </div>

          {/* Lower system details */}
          <footer className="text-[9px] text-zinc-600 border-t border-zinc-900 pt-3 flex justify-between shrink-0">
            <span>SQUARE SECURE GATEWAY ENABLED // ALL DATA ENCRYPTED</span>
            <span>SYSTEM STATE: OPERATION_READY</span>
          </footer>

        </section>

      </div>
    </div>
  );
}
