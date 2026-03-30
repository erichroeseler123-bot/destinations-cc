import Link from "next/link";
import { notFound } from "next/navigation";
import { getBooking, HOLD_WINDOW_MINUTES } from "@/lib/bookings";
import { canFinalizePaidBooking, finalizePaidBooking, markBookingNeedsReview } from "@/lib/finalizeBooking";
import { getSquareRedirectTransactionId, getSquareTransaction } from "@/lib/payments";

export const dynamic = "force-dynamic";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1400&q=80";

function buildQrImage(token: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(token)}`;
}

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ transactionId?: string; transaction_id?: string; referenceId?: string; orderId?: string; soldout?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  let booking = await getBooking(token);

  if (!booking) notFound();

  const transactionId = getSquareRedirectTransactionId(sp);
  if (transactionId && booking.status !== "paid") {
    const transaction = await getSquareTransaction(transactionId);
    const tender = transaction.transaction?.tenders?.[0];
    const paidAmountCents = Number(tender?.amount_money?.amount || 0);
    if (transaction.transaction?.id && paidAmountCents >= Math.round(booking.amountUsd * 100)) {
      try {
        booking = await finalizePaidBooking(booking, {
          payerName: tender?.card_details?.card?.cardholder_name || booking.payerName || null,
          squareTransactionId: transaction.transaction.id,
          squareReferenceId: sp.referenceId || null,
          squareOrderId: sp.orderId || transaction.transaction.order_id || booking.squareOrderId || null,
          sourcePath: `/t/${token}`,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "needs_review";
        booking = await markBookingNeedsReview(booking, {
          reason,
          payerName: tender?.card_details?.card?.cardholder_name || booking.payerName || null,
          squareTransactionId: transaction.transaction.id,
          squareReferenceId: sp.referenceId || null,
          squareOrderId: sp.orderId || transaction.transaction.order_id || booking.squareOrderId || null,
          sourcePath: `/t/${token}`,
        });
      }
    }
  }

  const isPaid = booking.status === "paid";
  const validation = !isPaid ? await canFinalizePaidBooking(booking) : { ok: true as const };
  const qrImage = buildQrImage(token);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backgroundImage: `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.78)), url('${BG_IMAGE}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          maxWidth: "34rem",
          width: "100%",
          background: "rgba(18, 13, 10, 0.9)",
          border: "1px solid rgba(255, 177, 100, 0.22)",
          borderRadius: "28px",
          padding: "32px",
          boxShadow: "0 28px 90px rgba(0, 0, 0, 0.36)",
        }}
      >
        <h1 style={{ margin: 0, textAlign: "center", fontSize: "2.8rem", lineHeight: 1 }}>Red Rocks Day Pass</h1>
        <p style={{ textAlign: "center", fontSize: "1.15rem", margin: "10px 0 0" }}>
          Daytime access to Red Rocks Park with transport included
        </p>

        {!isPaid ? (
          <div style={{ marginTop: "40px", display: "grid", gap: "24px" }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#f0b44f",
                  color: "#111",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  padding: "6px 16px",
                  borderRadius: "999px",
                }}
              >
                Payment Pending
              </div>
              <h2 style={{ fontSize: "4rem", margin: "20px 0 0", lineHeight: 1 }}>${booking.amountUsd}</h2>
              <p style={{ color: "rgba(248,241,230,0.74)", margin: "10px 0 0" }}>
                Visit: {booking.dateLabel} at {booking.departLabel}
              </p>
              <p style={{ color: "#f8f1e6", margin: "14px 0 0", fontSize: "1rem", fontWeight: 600 }}>
                Confirm your Day Pass
              </p>
              <p style={{ color: "rgba(248,241,230,0.6)", margin: "6px 0 0", fontSize: "0.82rem" }}>
                Limited seats per departure
              </p>
              <p style={{ color: "rgba(248,241,230,0.72)", margin: "12px 0 0", fontSize: "0.92rem" }}>
                Your spot is held for about {HOLD_WINDOW_MINUTES} minutes.
              </p>
              {sp.soldout === "1" || !validation.ok ? (
                <p style={{ color: "#ffb3a8", margin: "12px 0 0", fontSize: "0.92rem", fontWeight: 600 }}>
                  This departure is no longer available.
                </p>
              ) : null}
              {booking.status === "needs_review" ? (
                <p style={{ color: "#ffb3a8", margin: "12px 0 0", fontSize: "0.92rem", fontWeight: 600 }}>
                  Payment received but this booking needs operator review.
                </p>
              ) : null}
            </div>

            {validation.ok && booking.status !== "needs_review" ? (
              <Link
                href={`/api/create-checkout?token=${encodeURIComponent(token)}`}
                className="button"
                style={{ minHeight: "80px", fontSize: "1.4rem" }}
              >
                Pay Now
              </Link>
            ) : (
              <Link href="/" className="button" style={{ minHeight: "80px", fontSize: "1.2rem" }}>
                Pick another time
              </Link>
            )}

            <div style={{ textAlign: "center", fontSize: "0.85rem", color: "rgba(248,241,230,0.6)" }}>
              <p style={{ margin: 0 }}>Square secure checkout</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.72rem" }}>Card and wallet options show on the pay page</p>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "20px", fontSize: "0.95rem" }}>
              <p style={{ fontWeight: 700, margin: 0 }}>Pickup • Union Station</p>
              <p style={{ color: "rgba(248,241,230,0.74)", margin: "6px 0 0" }}>
                Wynkoop St light-rail plaza. Look for the GoSno sign. Your return ride is included.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: "32px", display: "grid", gap: "24px" }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#69d48a",
                  color: "#111",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  padding: "6px 16px",
                  borderRadius: "999px",
                }}
              >
                Confirmed
              </div>
              <p style={{ fontSize: "1.6rem", fontWeight: 600, margin: "14px 0 0" }}>{booking.payerName || "Guest"}</p>
              <p style={{ color: "rgba(248,241,230,0.74)", margin: "6px 0 0" }}>
                {booking.dateLabel} • {booking.departLabel}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ background: "#fff", padding: "16px", borderRadius: "20px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImage} alt="QR code ticket" width={240} height={240} />
              </div>
            </div>
            <p style={{ textAlign: "center", fontSize: "0.8rem", color: "rgba(248,241,230,0.6)", marginTop: "-8px" }}>
              Show QR to driver
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "0.95rem" }}>
              <div>
                <p style={{ margin: 0, color: "#69d48a", fontWeight: 700 }}>OUTBOUND</p>
                <p style={{ margin: "8px 0 0" }}>
                  Union Station
                  <br />
                  <span style={{ color: "rgba(248,241,230,0.74)" }}>
                    Wynkoop St light-rail plaza
                    <br />
                    GoSno sign • 10 min early
                  </span>
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: "#69d48a", fontWeight: 700 }}>RETURN</p>
                <p style={{ margin: "8px 0 0" }}>
                  Red Rocks Park
                  <br />
                  <span style={{ color: "rgba(248,241,230,0.74)" }}>
                    Visitor Center / Trading Post lot
                    <br />
                    Guaranteed return ride after 2 PM
                  </span>
                </p>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.12)",
                paddingTop: "18px",
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                fontSize: "0.8rem",
                color: "rgba(248,241,230,0.6)",
              }}
            >
              <div>Booking: {token}</div>
              <div>Phone: {booking.phone}</div>
            </div>

            <div
              className="button"
              style={{ background: "rgba(255,255,255,0.06)", color: "#f8f1e6" }}
            >
              Apple Wallet Soon
            </div>
          </div>
        )}
      </div>

      <footer style={{ marginTop: "20px", fontSize: "0.8rem", color: "rgba(248,241,230,0.5)", textAlign: "center" }}>
        Red Rocks Day Pass • Operated by GoSno LLC • Guaranteed return trip
      </footer>
    </main>
  );
}
