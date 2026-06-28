import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Shuttleya | Mighty Argo Cable Car Logistics',
  description: 'Direct 9AM shuttle relay from Denver to the Mighty Argo Cable Car.',
};

export default function ShuttleyaLogisticsNode() {
  return (
    <main className="h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col items-center justify-center p-4 font-mono">
      {/* Outer Industrial Frame */}
      <div className="w-full max-w-md bg-zinc-900 border-4 border-zinc-700 shadow-[12px_12px_0px_theme(colors.amber.500)] p-6 flex flex-col gap-8 relative">
        
        {/* Telemetry Header */}
        <div className="flex justify-between items-start border-b-2 border-zinc-700 pb-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-amber-400">
              Shuttleya
            </h1>
            <p className="text-xs tracking-widest text-zinc-400 mt-1">
              STATUS: ACTIVE // ROUTE: DENVER ⇄ ARGO
            </p>
          </div>
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse mt-2"></div>
        </div>

        {/* Tactical Decision Deck */}
        <div className="flex flex-col gap-2">
          <div className="bg-zinc-950 border-2 border-zinc-800 p-4 shadow-[4px_4px_0px_#000]">
            <h2 className="text-xl font-bold uppercase text-white">
              Mighty Argo Cable Car
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li className="flex justify-between">
                <span>DEPARTURE:</span>
                <span className="text-amber-400 font-bold">9:00 AM</span>
              </li>
              <li className="flex justify-between">
                <span>ORIGIN:</span>
                <span className="text-white">Denver, CO</span>
              </li>
              <li className="flex justify-between border-t border-zinc-800 pt-2 mt-2">
                <span>FARE (ROUND-TRIP):</span>
                <span className="text-emerald-400 font-black">$35.00</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Square Payment Gateway Trigger */}
        <Link 
          href={process.env.NEXT_PUBLIC_SQUARE_ARGO_LINK || "#"}
          className="block w-full text-center bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-lg py-4 border-2 border-amber-600 shadow-[6px_6px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all uppercase tracking-wide"
        >
          Initiate $35 Checkout
        </Link>

        {/* Operational Footer */}
        <div className="text-center">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
            Fast Checkout / Single-Tap Auth
          </p>
        </div>
      </div>
    </main>
  );
}
