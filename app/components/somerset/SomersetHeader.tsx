import Link from "next/link";
import { Phone, Calendar, ShieldCheck, MapPin } from "@/app/components/somerset/SomersetIcons";

export default function SomersetHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070d14]/95 backdrop-blur-md">
      {/* Top emergency dispatch / contact bar */}
      <div className="border-b border-white/5 bg-[#0e1724] px-4 py-1.5 text-xs text-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-400">2026 Concert Charters Open:</span>
            <span className="hidden sm:inline">Minneapolis · St. Paul · Stillwater · Hudson WI</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="tel:+17203696292"
              className="flex items-center gap-1.5 font-bold text-[#3df3ff] hover:text-[#62f6ff]"
            >
              <Phone className="h-3 w-3" />
              <span>(720) 369-6292</span>
            </a>
            <span className="hidden text-white/40 md:inline">|</span>
            <a
              href="sms:+17203696292"
              className="hidden text-white/70 hover:text-white md:inline font-semibold"
            >
              Text for Quick Quote
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#ff9e3b] font-black text-white shadow-md shadow-[#ff6b35]/30 text-lg">
            S
          </div>
          <div>
            <div className="text-base font-black tracking-tight text-white uppercase sm:text-lg">
              Somerset Amphitheater Shuttle
            </div>
            <p className="text-[11px] font-semibold text-white/60 tracking-wide">
              Private Twin Cities Concert Transportation
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex text-sm font-bold text-white/80">
          <Link
            href="/somerset-amphitheater-shuttle"
            className="transition hover:text-[#3df3ff]"
          >
            Amphitheater Shuttle
          </Link>
          <Link
            href="/somerset-concert-transportation"
            className="transition hover:text-[#3df3ff]"
          >
            Concert Logistics
          </Link>
          <Link
            href="/somerset-amphitheater-parking-and-transportation"
            className="transition hover:text-[#3df3ff]"
          >
            Parking vs Shuttle
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="tel:+17203696292"
            className="hidden items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/10 sm:inline-flex"
          >
            <Phone className="h-3.5 w-3.5 text-[#3df3ff]" />
            <span>Call/Text Dispatch</span>
          </a>
          <a
            href="#quote"
            className="flex items-center gap-1.5 rounded-xl bg-[#ff6b35] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#ff6b35]/30 transition hover:bg-[#ff8252]"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Get Quote</span>
          </a>
        </div>
      </div>
    </header>
  );
}
