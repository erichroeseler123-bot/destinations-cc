import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { getOrCreateCheckoutSession } from "../../lib/dccContext";

interface BookPageProps {
  searchParams: Promise<{ ctx?: string }> | { ctx?: string };
}

export const dynamic = "force-dynamic";

export default async function BookPage(props: BookPageProps) {
  const searchParams = await Promise.resolve(props.searchParams);
  const contextId = searchParams.ctx?.trim();

  let contextData: any = null;
  let contextError: { code: string; message: string; status?: number } | null = null;

  if (contextId) {
    const sessionResult = await getOrCreateCheckoutSession(contextId);
    if (sessionResult.success && sessionResult.data) {
      contextData = sessionResult.data;
    } else {
      contextError = {
        code: sessionResult.errorCode || "REDEEM_ERROR",
        message: sessionResult.message || "Failed to redeem travel context.",
        status: sessionResult.statusCode,
      };
    }
  }

  return (
    <div className="site-shell-wrapper">
      <SiteHeader />
      <main className="site-main py-10">
        <div className="site-shell max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <span className="text-xs font-bold tracking-widest text-sky-600 uppercase">
              Direct Merchant Booking • Juneau Flight Deck
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
              Confirm Your Glacier Helicopter Flight
            </h1>
            <p className="text-slate-600 mt-2">
              All flights are timeline-locked with guaranteed return to the cruise dock prior to departure.
            </p>
          </div>

          {contextError && (
            <div className="p-4 mb-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
              <div className="font-bold">
                {contextError.status === 410
                  ? "Booking Context Expired (15-minute TTL)"
                  : contextError.status === 409
                  ? "Booking Session Already Active"
                  : "Context Notice"}
              </div>
              <p className="text-sm mt-1">{contextError.message}</p>
              <div className="mt-3">
                <Link
                  href="/helicopter"
                  className="inline-block text-xs font-semibold px-3 py-1.5 bg-amber-800 text-white rounded hover:bg-amber-900"
                >
                  Select Date & Times Manually
                </Link>
              </div>
            </div>
          )}

          {contextData && (
            <div className="p-6 mb-8 rounded-xl bg-sky-50 border border-sky-200 text-slate-900 shadow-sm">
              <div className="flex items-center justify-between border-b border-sky-200 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-sky-950 text-sm tracking-wide uppercase">
                    Port Timeline Verified
                  </span>
                </div>
                <span className="text-xs font-mono text-sky-800">
                  Ref: {contextData.contextId.slice(0, 16)}...
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase">Port Date</span>
                  <div className="text-base font-bold text-slate-900">{contextData.schedule.date}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase">Party Size</span>
                  <div className="text-base font-bold text-slate-900">
                    {contextData.schedule.travelers} {contextData.schedule.travelers === 1 ? "Traveler" : "Travelers"}
                  </div>
                </div>
                {contextData.schedule.shipOrVenue && (
                  <div>
                    <span className="text-slate-500 text-xs font-semibold uppercase">Cruise Ship</span>
                    <div className="text-base font-bold text-slate-900">{contextData.schedule.shipOrVenue}</div>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase">Guaranteed Dock Return</span>
                  <div className="text-base font-bold text-emerald-800">
                    Latest Safe Return: {contextData.safetyConstraint.latestSafeReturnTime || "TBD"} (
                    {contextData.safetyConstraint.bufferMinutes}m Alaska Buffer)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Direct Checkout Form */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Passenger Details</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Traveler Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone (Port Day SMS)</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Flight Departure</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option>09:30 AM (Morning Glacier)</option>
                    <option>11:45 AM (Midday Sun)</option>
                    <option>02:15 PM (Afternoon Flight)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Total Price (No Booking Fees)</span>
                  <div className="text-2xl font-black text-slate-900">
                    ${389 * (contextData?.schedule?.travelers || 1)} USD
                  </div>
                </div>
                <button
                  type="button"
                  className="px-6 py-3 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg shadow transition"
                >
                  Complete Direct Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
