import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0a0e14] text-[#f8fafc] font-mono px-6">
      <div className="max-w-md w-full border border-red-500/30 bg-[#0c0c0e] p-8 rounded-3xl shadow-[0_18px_60px_rgba(0,0,0,0.7)] text-center space-y-6">
        
        <div className="text-4xl animate-pulse">⚠️</div>
        
        <div className="space-y-2">
          <h1 className="text-lg font-black tracking-widest text-red-500 uppercase">
            Route Not Registered
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
            Error Status: 404 // Target Coordinate Invalid
          </p>
        </div>
        
        <p className="text-xs text-zinc-300 leading-relaxed">
          The destination node or search query you entered does not match any coordinates registered in the Destination Command Center.
        </p>
        
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block w-full rounded-2xl border border-slate-800 bg-[#111625] px-5 py-3 text-xs font-bold text-cyan-300 hover:bg-[#1a233b] hover:border-cyan-800 transition-all"
          >
            [ Return to Command Center ]
          </Link>
        </div>
        
      </div>
    </main>
  );
}
