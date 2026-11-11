"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type WaitlistEntry } from "../../lib/waitlistStore";
import ViatorFeaturedTours from "../components/ViatorFeaturedTours";

interface AdminMetrics {
  totalWatches: number;
  conciergeReview?: number;
  activeScanning: number;
  seatsClaimed: number;
  confirmedBookings: number;
  uniqueWatchDates: number;
  totalPotentialValue: number;
  estimatedCommission: number;
}

export default function DispatchDashboardPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [activeDates, setActiveDates] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/waitlist/admin");
      const data = await res.json();
      if (data.ok) {
        setEntries(data.entries);
        setMetrics(data.metrics);
        setActiveDates(data.activeDates || []);
      }
    } catch (err) {
      console.error("Failed to load dispatch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: WaitlistEntry["status"]) => {
    try {
      const res = await fetch("/api/waitlist/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          id,
          status: newStatus,
          matchedOperator: newStatus === "held" || newStatus === "booking_confirmed" ? "TEMSCO Helicopters" : undefined,
          matchedSlotTime: newStatus === "held" || newStatus === "booking_confirmed" ? "2:00 PM Flight" : undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const filteredEntries = entries.filter((e) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "concierge_review") {
      return e.status === "concierge_review" || e.status === "active_scanning";
    }
    return e.status === filterStatus;
  });

  return (
    <main className="page-shell py-8">
      <div className="site-shell max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <p className="eyebrow m-0 text-amber-400">Juneau Flight Deck · Operations Command</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-1">
              Helicopter Availability Concierge Queue
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Human Concierge Review · Viator Partner Channel (<code>P00058396</code>) · TEMSCO, Coastal &amp; NorthStar
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="button button-secondary whitespace-nowrap">
              Public Site ↗
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Human Concierge Review
              </span>
              <div className="text-3xl font-extrabold text-white">
                {metrics.conciergeReview ?? metrics.activeScanning}
              </div>
              <span className="text-xs text-amber-400 font-medium mt-1 block">
                Across {metrics.uniqueWatchDates} cruise port days
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Contact Pending / Held
              </span>
              <div className="text-3xl font-extrabold text-emerald-400">{metrics.seatsClaimed}</div>
              <span className="text-xs text-slate-400 mt-1 block">Awaiting guest checkout</span>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Pipeline Booking Value
              </span>
              <div className="text-3xl font-extrabold text-sky-400">
                ${metrics.totalPotentialValue.toLocaleString()}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">Total inquiry requests</span>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Est. Partner Commission
              </span>
              <div className="text-3xl font-extrabold text-amber-400">
                ${metrics.estimatedCommission.toLocaleString()}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">Via Viator Partner Channel</span>
            </div>
          </div>
        )}

        {/* Human Concierge Review Status Banner */}
        <div className="p-6 rounded-2xl bg-sky-950/40 border border-sky-400/30 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest block mb-1">
              Human Concierge Review Mode (Automated Scanner Offline)
            </span>
            <h3 className="text-lg font-bold text-white mb-1">
              Reviewing {activeDates.length} Requested Cruise Port Dates
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl">
              Automated FareHarbor calendar polling is not currently active. Requests are reviewed manually against verified Part 135 operator schedules and Viator listings:{" "}
              {activeDates.length > 0 ? (
                <span className="text-amber-300 font-mono font-bold">
                  {activeDates.join(" · ")}
                </span>
              ) : (
                "No pending dates in queue"
              )}
            </p>
          </div>
          <div className="text-xs text-slate-300 border-l border-sky-400/20 pl-4 py-1">
            <div>• Queue mode: <strong>Human Concierge Review</strong></div>
            <div>• Operator terms: <strong>Published per provider</strong></div>
            <div>• Booking Channel: <strong>Viator Partner (P00058396)</strong></div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase mr-2">Filter:</span>
            {[
              { id: "all", label: "All Inquiries" },
              { id: "concierge_review", label: "Human Concierge Review" },
              { id: "contact_pending", label: "Contact Pending" },
              { id: "held", label: "Held" },
              { id: "booking_confirmed", label: "Confirmed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                  filterStatus === tab.id
                    ? "bg-amber-400 text-slate-950"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDashboardData}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            ↻ Refresh Queue
          </button>
        </div>

        {/* Master Queue Table */}
        <div className="seo-table-container">
          <table className="seo-matrix-table">
            <thead>
              <tr>
                <th>Passenger / Contact</th>
                <th>Cruise Line &amp; Ship</th>
                <th>Port Date &amp; City</th>
                <th>Tour &amp; Party</th>
                <th>Status</th>
                <th>Operator Match</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading live waitlist queue...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No waitlist requests found for this filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <strong className="text-white">{entry.name}</strong>
                      <span className="text-xs text-slate-400 block">{entry.email}</span>
                      {entry.phone && (
                        <a
                          href={`tel:${entry.phone}`}
                          className="text-xs text-sky-400 hover:underline font-mono block"
                        >
                          {entry.phone}
                        </a>
                      )}
                      <div className="mt-1.5">
                        {entry.bookingMode === "concierge_dispatch" || entry.bookingMode === "priority_hold" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-400/15 px-2 py-0.5 rounded border border-amber-400/40">
                            🛎️ Concierge Dispatch Alert
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-300 bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/20">
                            📱 Daily Seat Alert
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <strong className="text-amber-200">{entry.cruiseLine}</strong>
                      <span className="text-xs text-slate-400 block">{entry.shipName}</span>
                      {entry.notes && (
                        <small className="text-slate-400 italic block mt-1 line-clamp-2 max-w-xs">
                          &ldquo;{entry.notes}&rdquo;
                        </small>
                      )}
                    </td>

                    <td>
                      <strong className="text-white font-mono text-sm">{entry.portDate}</strong>
                      <span className="text-xs uppercase tracking-wider text-sky-400 font-bold block">
                        {entry.portCity}
                      </span>
                    </td>

                    <td>
                      <strong className="text-white capitalize">
                        {entry.tourType.replace("_", " ")}
                      </strong>
                      <span className="text-xs text-amber-400 font-bold block">
                        {entry.partySize} {entry.partySize === 1 ? "Passenger" : "Passengers"}
                      </span>
                      <small className="text-slate-400 block">
                        Est: ${(entry.estimatedValue || entry.partySize * 450).toLocaleString()}
                      </small>
                    </td>

                    <td>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          entry.status === "booking_confirmed" || (entry.status as any) === "confirmed"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : entry.status === "held"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                            : entry.status === "contact_pending" || (entry.status as any) === "alert_sent"
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                            : entry.status === "opening_detected" || (entry.status as any) === "claimed"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-white/10 text-slate-300 border border-white/10"
                        }`}
                      >
                        {entry.status === "active_scanning" || entry.status === "concierge_review"
                          ? "concierge review"
                          : entry.status.replace("_", " ")}
                      </span>
                    </td>

                    <td>
                      {entry.matchedOperator ? (
                        <div>
                          <strong className="text-emerald-300 text-xs">{entry.matchedOperator}</strong>
                          <span className="text-xs text-slate-300 block">{entry.matchedSlotTime}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Hold: {entry.operatorHoldStatus === "held" && entry.operatorHoldReference ? entry.operatorHoldReference : "None (Direct Link)"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Pending concierge review</span>
                      )}
                    </td>

                    <td>
                      <div className="flex flex-col gap-1.5">
                        {(entry.status === "concierge_review" || entry.status === "active_scanning") && (
                          <button
                            onClick={() => handleUpdateStatus(entry.id, "contact_pending")}
                            className="text-xs px-2.5 py-1 bg-amber-400 text-slate-950 font-bold rounded hover:bg-amber-300"
                          >
                            Dispatch Alert
                          </button>
                        )}

                        {entry.status === "opening_detected" && (
                          <button
                            onClick={() => handleUpdateStatus(entry.id, "contact_pending")}
                            className="text-xs px-2.5 py-1 bg-sky-500 text-white font-bold rounded hover:bg-sky-600"
                          >
                            Send Alert
                          </button>
                        )}

                        {entry.status === "contact_pending" && (
                          <button
                            onClick={() => handleUpdateStatus(entry.id, "held")}
                            className="text-xs px-2.5 py-1 bg-purple-600 text-white font-bold rounded hover:bg-purple-700"
                          >
                            Record Hold
                          </button>
                        )}

                        {(entry.status === "contact_pending" || entry.status === "held") && (
                          <button
                            onClick={() => handleUpdateStatus(entry.id, "booking_confirmed")}
                            className="text-xs px-2.5 py-1 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700"
                          >
                            Mark Booked
                          </button>
                        )}

                        <button
                          onClick={() => handleUpdateStatus(entry.id, "cancelled")}
                          className="text-[11px] text-slate-400 hover:text-red-400 text-left"
                        >
                          Cancel / Release
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Live Viator Partner Excursion Feed */}
        <div className="mt-12">
          <ViatorFeaturedTours
            headline="Live Fleet Availability & Viator Partner Excursions"
            subhead="Monitor real-time Juneau glacier helicopter options, supplier imagery, and verified departure windows."
          />
        </div>

        {/* Instructions & Help */}
        <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 leading-relaxed">
          <h4 className="text-sm font-bold text-white mb-2">How This UI Connects to Viator &amp; Local Operators</h4>
          <p>
            DCC evaluates tour suitability; Juneau Flight Deck explains the options; Viator handles the booking and applicable booking protections (such as Viator Terms of Use Section 20 for qualifying Worry-free Shore Excursions like <code>6251SHOREXICEWALK</code>). Fulfillment is operated directly by TEMSCO, Coastal, or NorthStar.
          </p>
        </div>
      </div>
    </main>
  );
}
