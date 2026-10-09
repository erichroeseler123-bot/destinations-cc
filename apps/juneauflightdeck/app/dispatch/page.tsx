"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type WaitlistEntry } from "../../lib/waitlistStore";
import ViatorFeaturedTours from "../components/ViatorFeaturedTours";

interface AdminMetrics {
  totalWatches: number;
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
  const [sweeping, setSweeping] = useState(false);
  const [sweepMessage, setSweepMessage] = useState<string | null>(null);

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

  const handleRunSweep = async () => {
    try {
      setSweeping(true);
      setSweepMessage(null);
      const res = await fetch("/api/waitlist/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_sweep" }),
      });
      const data = await res.json();
      if (data.ok) {
        setSweepMessage(
          `✓ 10:00 AM Sweep Complete: Checked ${data.sweepResult.totalDatesSwept} active watch dates. Found ${data.sweepResult.openingsFound} open seats!`
        );
        fetchDashboardData();
      }
    } catch {
      setSweepMessage("Error executing sweep.");
    } finally {
      setSweeping(false);
    }
  };

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
    return e.status === filterStatus;
  });

  return (
    <main className="page-shell py-8">
      <div className="site-shell max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <p className="eyebrow m-0 text-amber-400">Juneau Flight Deck · Operations Command</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-1">
              Helicopter Seat Watch &amp; Waitlist Dispatch
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              FareHarbor Partner Pipe: <strong>Welcome to Alaska Tours</strong> · Monitoring TEMSCO, Coastal &amp; NorthStar
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunSweep}
              disabled={sweeping}
              className="button button-primary whitespace-nowrap shadow-lg"
            >
              {sweeping ? "Scanning 10:00 AM Fleet..." : "▶ Run 10:00 AM Sweep Now"}
            </button>
            <Link href="/" className="button button-secondary whitespace-nowrap">
              Public Site ↗
            </Link>
          </div>
        </div>

        {/* Sweep Notification Alert */}
        {sweepMessage && (
          <div className="p-4 mb-6 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-sm font-semibold flex items-center justify-between">
            <span>{sweepMessage}</span>
            <button onClick={() => setSweepMessage(null)} className="text-xs opacity-75 hover:opacity-100">
              Dismiss ✕
            </button>
          </div>
        )}

        {/* Top Metric Cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Active Date Watches
              </span>
              <div className="text-3xl font-extrabold text-white">{metrics.activeScanning}</div>
              <span className="text-xs text-amber-400 font-medium mt-1 block">
                Across {metrics.uniqueWatchDates} cruise port days
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Seats Claimed &amp; Alerted
              </span>
              <div className="text-3xl font-extrabold text-emerald-400">{metrics.seatsClaimed}</div>
              <span className="text-xs text-slate-400 mt-1 block">Held under 48h policy</span>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Pipeline Booking Value
              </span>
              <div className="text-3xl font-extrabold text-sky-400">
                ${metrics.totalPotentialValue.toLocaleString()}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">Total waitlist tickets</span>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Est. Commission (18%)
              </span>
              <div className="text-3xl font-extrabold text-amber-400">
                ${metrics.estimatedCommission.toLocaleString()}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">Via Welcome to Alaska split</span>
            </div>
          </div>
        )}

        {/* 10:00 AM Scanning Strategy Banner */}
        <div className="p-6 rounded-2xl bg-sky-950/40 border border-sky-400/30 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block mb-1">
              Targeted 10:00 AM Scan Strategy
            </span>
            <h3 className="text-lg font-bold text-white mb-1">
              Monitoring {activeDates.length} Specific Cruise Dates
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl">
              Dates currently queued for morning sweep:{" "}
              {activeDates.length > 0 ? (
                <span className="text-amber-300 font-mono font-bold">
                  {activeDates.join(" · ")}
                </span>
              ) : (
                "No active watch dates"
              )}
            </p>
          </div>
          <div className="text-xs text-slate-300 border-l border-sky-400/20 pl-4 py-1">
            <div>• Morning sweep: <strong>10:00 AM AKDT</strong></div>
            <div>• Free cancellation cutoff: <strong>48 hours</strong></div>
            <div>• Partner: <strong>Welcome to Alaska (FareHarbor)</strong></div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase mr-2">Filter:</span>
            {[
              { id: "all", label: "All Watches" },
              { id: "inquiry_received", label: "Availability Inquiries" },
              { id: "active_scanning", label: "Legacy Scanning" },
              { id: "claimed", label: "Seats Claimed" },
              { id: "alert_sent", label: "Alert Sent" },
              { id: "confirmed", label: "Confirmed" },
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
                        {entry.status.replace("_", " ")}
                      </span>
                      {entry.lastScannedAt && (
                        <small className="text-slate-400 block text-[10px] mt-1">
                          Scanned: 10:00 AM
                        </small>
                      )}
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
                        <span className="text-xs text-slate-500 italic">Scanning 10am</span>
                      )}
                    </td>

                    <td>
                      <div className="flex flex-col gap-1.5">
                        {(entry.status === "active_scanning" || entry.status === "inquiry_received") && (
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
          <h4 className="text-sm font-bold text-white mb-2">How This UI Connects to Welcome to Alaska Tours</h4>
          <p>
            When a seat is claimed at 10:00 AM, the passenger is sent a direct 15-minute booking link powered by Welcome to Alaska Tours’ FareHarbor merchant account. When the guest enters payment, Welcome to Alaska receives the reservation confirmation and commission credit, and the booking is fulfilled directly by TEMSCO, Coastal, or NorthStar.
          </p>
        </div>
      </div>
    </main>
  );
}
