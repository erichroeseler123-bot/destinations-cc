import Image from "next/image";
import Link from "next/link";
import { buildDccReturnUrl, emitDccEvent, getOrCreateHandoffId } from "@/lib/dcc";
import { getInventorySlot, usingDurableInventoryStore } from "@/lib/inventoryStore";

export const dynamic = "force-dynamic";

const BASE_URL = "https://redrocksfastpass.com";

function getSlotDate(slotId: string) {
  return slotId.split("-").slice(0, 3).join("-");
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    slot?: string;
    reserved?: string;
    soldout?: string;
    error?: string;
        quantity?: string;
        texted?: string;
        dcc_handoff_id?: string;
        dcc_return?: string;
  }>;
}) {
  const params = await searchParams;
  const slotId = params.slot ?? "";
  const slot = slotId ? await getInventorySlot(slotId) : null;
  const reserved = params.reserved === "1";
  const soldOut = params.soldout === "1";
  const error = params.error ?? "";
  const texted = params.texted === "1";
  const requestedQuantity = Number.parseInt(params.quantity || "1", 10);
  const quantity = Number.isInteger(requestedQuantity) && requestedQuantity > 0 ? requestedQuantity : 1;
  const handoffId = getOrCreateHandoffId(params.dcc_handoff_id);
  const dccReturn = params.dcc_return || buildDccReturnUrl("/red-rocks-shuttle", handoffId);
  const durableStore = usingDurableInventoryStore();
  const currentUrl = `${BASE_URL}/checkout${
    slotId
      ? `?slot=${encodeURIComponent(slotId)}&dcc_handoff_id=${encodeURIComponent(handoffId)}`
      : `?dcc_handoff_id=${encodeURIComponent(handoffId)}`
  }`;
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(currentUrl)}`;

  if (slot && !reserved && !soldOut && !error) {
    await emitDccEvent({
      handoffId,
      satelliteId: "redrocksfastpass",
      eventType: "booking_started",
      source: "redrocksfastpass",
      sourcePath: "/checkout",
      status: "in_progress",
      stage: "checkout",
      booking: {
        citySlug: "denver",
        venueSlug: "red-rocks-amphitheatre",
        productSlug: slot.id,
        eventDate: getSlotDate(slot.id),
        quantity,
        currency: "USD",
        amount: 25 * quantity,
      },
    });
  }

  return (
    <main>
      <section className="hero compact">
        <div className="hero-copy-wrap">
          <p className="eyebrow">Red Rocks Day Pass</p>
          <h1>Get your ticket.</h1>
          <p className="subhead">Easy downtown access to Red Rocks. We text the secure pay link to your phone.</p>
        </div>
      </section>

      <section className="desktop-handoff">
        <div className="desktop-copy">
          <p className="eyebrow">Mobile only</p>
          <h2>Scan and finish.</h2>
          <p>Open this on your phone and finish in one minute.</p>
        </div>
        <Image src={qrImage} alt="QR code for Red Rocks Fast Pass checkout" width={260} height={260} />
      </section>

      <div className="mobile-flow">
        {slot && !slot.soldOut ? (
          <>
            <section className="panel">
              <p className="eyebrow">Your day pass</p>
              <h2>{slot.departLabel}</h2>
              <div className="checkout-summary">
                <div className="summary-row">
                  <span>Day</span>
                  <strong>{slot.dateLabel}</strong>
                </div>
                <div className="summary-row">
                  <span>Pickup</span>
                  <strong>{slot.pickupLabel}</strong>
                </div>
                <div className="summary-row">
                  <span>Return</span>
                  <strong>Guaranteed ride back after 2:00 PM</strong>
                </div>
                <div className="summary-row">
                  <span>Price</span>
                  <strong>$25 each</strong>
                </div>
                <div className="summary-row">
                  <span>Seats</span>
                  <strong>{quantity}</strong>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <strong>${25 * quantity}</strong>
                </div>
              </div>
              <div className="summary-row total">
                <span>Availability</span>
                <strong>{slot.availabilityLabel === "limited" ? "Limited availability" : `${slot.seatsLeft} left`}</strong>
              </div>
              {texted ? <div className="success-box">Pay link sent by text.</div> : null}
              {error === "inventory" ? <div className="error-box">Inventory error. Try again.</div> : null}
              {error === "quantity" ? <div className="error-box">Choose a valid seat count.</div> : null}
              {error === "phone" ? <div className="error-box">Enter a mobile number.</div> : null}
              {!durableStore ? <div className="notice-box">Preview mode is on.</div> : null}
            </section>

            <section className="panel">
              <p className="eyebrow">Phone only</p>
              <h2>Text me the pay link</h2>
              <form className="checkout-form" action="/api/reserve" method="post">
                <input type="hidden" name="slot" value={slot.id} />
                <input type="hidden" name="dcc_handoff_id" value={handoffId} />
                <input type="hidden" name="dcc_return" value={dccReturn} />
                <label>
                  Seats
                  <select name="quantity" defaultValue={String(Math.min(quantity, Math.max(slot.seatsLeft, 1)))} required>
                    {Array.from({ length: Math.min(slot.seatsLeft, 10) }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Mobile number
                  <input type="tel" name="phone" autoComplete="tel" inputMode="tel" required />
                </label>
                <div className="notice-box">
                  We text your secure pay link instantly. No email. No account. Guaranteed return trip.
                </div>
                <button type="submit" className="button">
                  Send pay link
                </button>
              </form>
            </section>
          </>
        ) : (
          <section className="panel">
            <p className="eyebrow">Unavailable</p>
            <h2>{soldOut || slot?.soldOut ? "Sold out." : "Pick a time."}</h2>
            <Link href="/" className="button">
              Back
            </Link>
          </section>
        )}
      </div>

      <footer className="footer">
        <Link href={`/handoff/return?dcc_handoff_id=${encodeURIComponent(handoffId)}&dcc_return=${encodeURIComponent(dccReturn)}`}>
          Back to DCC
        </Link>
      </footer>
    </main>
  );
}
