import Link from "next/link";

export default function RestaurantOrientationAd() {
  return (
    <aside
      className="border border-[#d4af37]/60 bg-[#1a1a1a] p-6 md:p-8"
      aria-label="$5 French Quarter Orientation"
    >
      <p className="text-[#d4af37] text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
        Start your day with us
      </p>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="font-[var(--font-accent)] text-2xl md:text-3xl font-bold mb-3">
            French Quarter Morning Orientation — $5
          </h2>
          <p className="text-[#cccccc] leading-relaxed">
            Get your bearings before breakfast, brunch, tours, and sightseeing. The 30-minute orientation includes a Welcome Packet, maps, practical local tips, and help planning the rest of your New Orleans day.
          </p>
          <p className="text-sm text-[#aaaaaa] mt-3">
            Daily at 8:00 AM and 9:30 AM · Moonwalk beside Café Du Monde · $5 per person
          </p>
        </div>
        <div className="flex flex-col gap-3 shrink-0">
          <Link
            href="/guides/french-quarter-orientation"
            className="inline-flex justify-center bg-[#d4af37] text-[#151515] font-bold px-6 py-4 uppercase tracking-wider text-sm"
          >
            See the $5 Orientation
          </Link>
          <a
            href="sms:+15044849687?body=Hi%20New%20Orleans%20Concierge%20Desk%20%E2%80%94%20I%20want%20to%20reserve%20the%20%245%20French%20Quarter%20Orientation."
            className="inline-flex justify-center border border-[#d4af37] text-[#d4af37] font-bold px-6 py-3 uppercase tracking-wider text-xs"
          >
            Text to Reserve
          </a>
        </div>
      </div>
    </aside>
  );
}
