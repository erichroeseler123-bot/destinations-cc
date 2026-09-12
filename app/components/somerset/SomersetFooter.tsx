import Link from "next/link";
import { Phone, Mail, MapPin, ShieldAlert, CheckCircle2 } from "@/app/components/somerset/SomersetIcons";

export default function SomersetFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#05090f] text-white/70 text-xs">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#ff9e3b] font-black text-white text-sm">
                S
              </div>
              <span className="text-base font-black tracking-tight text-white uppercase">
                Somerset Amphitheater Shuttle
              </span>
            </div>
            <p className="mt-3 text-white/60 leading-6 max-w-md">
              Private prearranged group concert transportation and charter van service connecting the Minneapolis / St. Paul Twin Cities metro with Somerset Amphitheater in Somerset, Wisconsin.
            </p>
            <div className="mt-4 flex flex-col gap-2 font-medium text-white/80">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#3df3ff]" />
                <span>Dispatch / Text: <a href="tel:+17203696292" className="text-white hover:underline font-bold">(720) 369-6292</a></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#3df3ff]" />
                <span>Pickups: Minneapolis · St. Paul · Stillwater · Hudson WI · East Metro</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#ff6b35]" />
                <span>Destination: Somerset Amphitheater (715 Spring St, Somerset, WI 54025)</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white">Shuttle Routes</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Homepage & Quote
                </Link>
              </li>
              <li>
                <Link href="/somerset-amphitheater-shuttle" className="hover:text-white transition">
                  Amphitheater Shuttle Guide
                </Link>
              </li>
              <li>
                <Link href="/somerset-concert-transportation" className="hover:text-white transition">
                  Concert Logistics & Timing
                </Link>
              </li>
              <li>
                <Link href="/somerset-amphitheater-parking-and-transportation" className="hover:text-white transition">
                  Parking vs Shuttle Comparison
                </Link>
              </li>
            </ul>
          </div>

          {/* Operating Policy & Tubing */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white">Service Standards</h4>
            <ul className="mt-3 space-y-2 text-white/65 leading-5">
              <li>• 100% Private Charters for Your Group</li>
              <li>• Driver Remains On-Site Through Show</li>
              <li>• Guaranteed Immediate Post-Show Return</li>
              <li>• Severe Weather Reschedule Transfer</li>
              <li>• Cooler & Tailgate Storage Included</li>
            </ul>
          </div>
        </div>

        {/* Clear Affiliation & Tubing Disclaimer */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-[#ffb07c] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-5 text-white/60 space-y-2">
              <p>
                <strong className="text-white">Independent Transportation Disclosure:</strong> Somerset Amphitheater Shuttle is an independent private transportation charter service operated to provide reliable group rides between the Twin Cities metro and Somerset, WI. We are not affiliated with, sponsored by, endorsed by, or associated with Somerset Amphitheater, Live Nation, Ticketmaster, River’s Edge Campground, or Float Rite Park. All trademarks and venue names are used solely for factual destination reference.
              </p>
              <p>
                <strong className="text-white">Apple River Tubing Notice:</strong> Transportation for Apple River tubing is provided directly by local tubing outfitters and campgrounds (such as River’s Edge Campground and Float Rite Park) as part of their tube rental and river operations. We do not provide public tubing shuttles; our service is exclusively dedicated private concert and event charters to Somerset Amphitheater.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-[11px] text-white/50 sm:flex-row">
          <div>
            © {new Date().getFullYear()} Somerset Amphitheater Shuttle. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Twin Cities ↔ Somerset, WI</span>
            <span>•</span>
            <a href="tel:+17203696292" className="hover:text-white transition">(720) 369-6292</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
