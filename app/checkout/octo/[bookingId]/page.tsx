import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OctoBookingService } from "@/lib/octo/bookingService";
import CheckoutReview from "./CheckoutReview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Reservation | Destination Command Center",
  description: "Secure lead traveler verification and supplier checkout handoff.",
};

export default async function OctoCheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const booking = await OctoBookingService.getBooking(bookingId);

  if (!booking) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      <div className="border-b border-white/8 bg-black/40">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Destination Command Center · Secure Checkout
          </p>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
            Confirm Tour Reservation
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <CheckoutReview booking={booking} dccBookingId={bookingId} />
      </div>
    </main>
  );
}
