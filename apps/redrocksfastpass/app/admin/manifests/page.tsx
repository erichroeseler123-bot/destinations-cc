import { getDepartureKey, getServiceDateFromSlotId, listBookingsByDate, type DayPassBooking } from "@/lib/bookings";
import { listInventory } from "@/lib/inventoryStore";

export const dynamic = "force-dynamic";

type Search = {
  date?: string;
  departure?: string;
  token?: string;
  refunded?: string;
  error?: string;
};

function read(name: string) {
  return String(process.env[name] || "").trim();
}

function getTodayDenver() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

function getAdminToken() {
  return read("REDROCKSFASTPASS_ADMIN_TOKEN");
}

function getDisplayDate(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(value);
}

function getStatusLabel(status: DayPassBooking["status"]) {
  if (status === "pending_payment") return "Pending";
  if (status === "paid") return "Paid";
  if (status === "needs_review") return "Needs review";
  if (status === "cancelled") return "Cancelled";
  if (status === "refunded") return "Refunded";
  if (status === "expired") return "Expired";
  return status;
}

function getResolutionLabel(booking: DayPassBooking) {
  if (booking.status === "needs_review") return "Refund required";
  return "—";
}

function getDepartureStats(bookings: DayPassBooking[], targetCapacity: number, maxCapacity: number) {
  const paidSeats = bookings
    .filter((booking) => booking.status === "paid")
    .reduce((sum, booking) => sum + booking.quantity, 0);
  const pendingSeats = bookings
    .filter((booking) => booking.status === "pending_payment")
    .reduce((sum, booking) => sum + booking.quantity, 0);
  const reviewSeats = bookings
    .filter((booking) => booking.status === "needs_review")
    .reduce((sum, booking) => sum + booking.quantity, 0);
  const soldSeats = paidSeats + pendingSeats;
  const remainingSeats = Math.max(0, maxCapacity - soldSeats);
  const loadStatus =
    soldSeats >= maxCapacity ? "Sold out" : soldSeats >= targetCapacity ? "Above target" : "Available";
  return { paidSeats, pendingSeats, reviewSeats, soldSeats, remainingSeats, loadStatus };
}

export default async function AdminManifestsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const expectedToken = getAdminToken();
  const providedToken = String(params.token || "").trim();

  if (expectedToken && providedToken !== expectedToken) {
    return (
      <main className="shell">
        <section className="panel">
          <p className="eyebrow">Admin only</p>
          <h2>Token required.</h2>
          <p className="subhead">Open this page with the admin token in the query string.</p>
        </section>
      </main>
    );
  }

  const date = params.date || getTodayDenver();
  const selectedDeparture = String(params.departure || "").trim();
  const [bookings, inventory] = await Promise.all([listBookingsByDate(date), listInventory()]);

  const inventoryForDate = inventory.filter((slot) => getServiceDateFromSlotId(slot.id) === date);
  const bookingsBySlot = new Map<string, DayPassBooking[]>();
  for (const booking of bookings) {
    const list = bookingsBySlot.get(booking.slotId);
    if (list) list.push(booking);
    else bookingsBySlot.set(booking.slotId, [booking]);
  }

  const slotMap = new Map(
    inventoryForDate.map((slot) => [
      slot.id,
      {
        slotId: slot.id,
        departLabel: slot.departLabel,
        dateLabel: slot.dateLabel,
        pickupLabel: slot.pickupLabel,
        targetCapacity: slot.targetCapacity,
        maxSeats: slot.maxSeats,
      },
    ])
  );

  for (const booking of bookings) {
    if (slotMap.has(booking.slotId)) continue;
    slotMap.set(booking.slotId, {
      slotId: booking.slotId,
      departLabel: booking.departLabel,
      dateLabel: booking.dateLabel,
      pickupLabel: "Union Station / Downtown Denver",
      targetCapacity: 8,
      maxSeats: 12,
    });
  }

  const departures = Array.from(slotMap.values())
    .sort((a, b) => a.slotId.localeCompare(b.slotId))
    .map((slot) => {
      const departureBookings = bookingsBySlot.get(slot.slotId) || [];
      return {
        ...slot,
        departureKey: getDepartureKey(slot.slotId, slot.departLabel),
        bookings: departureBookings,
        stats: getDepartureStats(departureBookings, slot.targetCapacity, slot.maxSeats),
      };
    });

  const visibleDepartures = selectedDeparture
    ? departures.filter((departure) => departure.departureKey === selectedDeparture)
    : departures;

  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Operator manifest</p>
        <h2>{getDisplayDate(date)}</h2>
        <p className="subhead">Runs grouped by departure. Track seats, not bookings.</p>
        {params.refunded ? <div className="success-box">Refund completed for {params.refunded}.</div> : null}
        {params.error ? <div className="error-box">Refund error: {params.error}</div> : null}

        <form method="get" style={{ display: "grid", gap: "12px", marginTop: "18px", maxWidth: "24rem" }}>
          {expectedToken ? <input type="hidden" name="token" value={providedToken} /> : null}
          <label style={{ display: "grid", gap: "6px" }}>
            <span className="detail-label">Service date</span>
            <input type="date" name="date" defaultValue={date} />
          </label>
          <button type="submit" className="button">
            Load manifest
          </button>
        </form>
      </section>

      <div className="mobile-flow" style={{ marginTop: "16px" }}>
        {visibleDepartures.length ? (
          visibleDepartures.map((departure) => (
            <section key={departure.departureKey} className="panel">
              <p className="eyebrow">Departure</p>
              <h2>{departure.departLabel}</h2>
              <div className="rule-box" style={{ marginTop: "16px" }}>
                {departure.stats.soldSeats} seats sold • {departure.stats.paidSeats} paid • {departure.stats.pendingSeats} pending •{" "}
                {departure.stats.reviewSeats} review • {departure.stats.remainingSeats} left • {departure.stats.loadStatus}
              </div>

              <div className="detail-grid">
                <div>
                  <div className="detail-label">Pickup</div>
                  <div className="detail-value">{departure.pickupLabel}</div>
                </div>
                <div>
                  <div className="detail-label">Capacity</div>
                  <div className="detail-value">
                    target {departure.targetCapacity} • max {departure.maxSeats}
                  </div>
                </div>
                <div>
                  <div className="detail-label">Run key</div>
                  <div className="detail-value small">{departure.departureKey}</div>
                </div>
              </div>

              {!selectedDeparture ? (
                <div style={{ marginTop: "18px" }}>
                  <a
                    href={`/admin/manifests?date=${encodeURIComponent(date)}&departure=${encodeURIComponent(departure.departureKey)}${
                      expectedToken ? `&token=${encodeURIComponent(providedToken)}` : ""
                    }`}
                    className="button"
                    style={{ minHeight: "56px" }}
                  >
                    Open passenger list
                  </a>
                </div>
              ) : null}

              {selectedDeparture ? (
                departure.bookings.length ? (
                  <div style={{ overflowX: "auto", marginTop: "18px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.98rem" }}>
                      <thead>
                        <tr style={{ textAlign: "left", color: "#f4c08e" }}>
                          <th style={{ padding: "10px 8px" }}>Seats</th>
                          <th style={{ padding: "10px 8px" }}>Phone</th>
                          <th style={{ padding: "10px 8px" }}>Status</th>
                          <th style={{ padding: "10px 8px" }}>Reason</th>
                          <th style={{ padding: "10px 8px" }}>Payment</th>
                          <th style={{ padding: "10px 8px" }}>Resolution</th>
                          <th style={{ padding: "10px 8px" }}>Action</th>
                          <th style={{ padding: "10px 8px" }}>Token</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departure.bookings.map((booking) => (
                          <tr key={booking.token} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                            <td style={{ padding: "12px 8px" }}>{booking.quantity}</td>
                            <td style={{ padding: "12px 8px" }}>{booking.phone}</td>
                            <td style={{ padding: "12px 8px" }}>{getStatusLabel(booking.status)}</td>
                            <td style={{ padding: "12px 8px" }}>{booking.reviewReason || "—"}</td>
                            <td style={{ padding: "12px 8px", fontFamily: "monospace" }}>
                              {booking.squareTransactionId || booking.squareOrderId || "—"}
                            </td>
                            <td style={{ padding: "12px 8px" }}>{getResolutionLabel(booking)}</td>
                            <td style={{ padding: "12px 8px" }}>
                              {booking.status === "needs_review" && booking.squareTransactionId ? (
                                <form method="post" action="/api/admin/refund">
                                  {expectedToken ? <input type="hidden" name="admin_token" value={providedToken} /> : null}
                                  <input type="hidden" name="booking_token" value={booking.token} />
                                  <input type="hidden" name="date" value={date} />
                                  <input type="hidden" name="departure" value={departure.departureKey} />
                                  <button type="submit" className="button" style={{ minHeight: "44px", fontSize: "0.9rem" }}>
                                    Refund
                                  </button>
                                </form>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td style={{ padding: "12px 8px", fontFamily: "monospace" }}>{booking.token}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="notice-box">No bookings for this departure yet.</div>
                )
              ) : null}
            </section>
          ))
        ) : (
          <section className="panel">
            <p className="eyebrow">No runs</p>
            <h2>No manifest rows for this day.</h2>
          </section>
        )}
      </div>
    </main>
  );
}
