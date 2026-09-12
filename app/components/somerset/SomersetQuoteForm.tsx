"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Phone, Calendar, Users, MapPin, Clock } from "@/app/components/somerset/SomersetIcons";

export default function SomersetQuoteForm({
  defaultArtist = "",
  defaultDate = "",
}: {
  defaultArtist?: string;
  defaultDate?: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [concertDate, setConcertDate] = useState(defaultDate);
  const [artistOrEvent, setArtistOrEvent] = useState(defaultArtist);
  const [pickupCity, setPickupCity] = useState("Minneapolis");
  const [pickupAddress, setPickupAddress] = useState("");
  const [groupSize, setGroupSize] = useState("8");
  const [vehiclePreference, setVehiclePreference] = useState("van");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!phone.trim() && !email.trim()) {
      setErrorMessage("Please provide a phone number or email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/somerset/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          concertDate,
          artistOrEvent,
          pickupCity,
          pickupAddress,
          groupSize,
          vehiclePreference,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to submit quote request");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-emerald-400/30 bg-[#0c1815] p-8 text-center text-white shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-2xl font-black uppercase tracking-tight text-white">
          Quote Request Received!
        </h3>
        <p className="mt-2 text-sm text-white/80 max-w-md mx-auto leading-6">
          Thank you, <strong className="text-white">{name}</strong>! Dispatch has logged your inquiry for {artistOrEvent || "your Somerset concert"} on {concertDate || "your requested date"}.
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70 max-w-md mx-auto text-left space-y-2">
          <p>• <strong>Pickup Metro:</strong> {pickupCity} {pickupAddress ? `(${pickupAddress})` : ""}</p>
          <p>• <strong>Group Size:</strong> {groupSize} Passengers ({vehiclePreference === "van" ? "14-Pax Van" : "Luxury SUV"})</p>
          <p>• <strong>Contact:</strong> {phone || email}</p>
        </div>
        <p className="mt-5 text-xs font-semibold text-emerald-400">
          ⚡ Expect a direct text or call within 15–30 minutes with vehicle availability and guaranteed flat pricing.
        </p>
        <div className="mt-6 pt-4 border-t border-white/10">
          <a
            href="tel:+17203696292"
            className="inline-flex items-center gap-2 rounded-xl bg-[#ff6b35] px-5 py-2.5 text-xs font-black uppercase text-white hover:bg-[#ff8252] transition"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Need Instant Confirmation? Call (720) 369-6292</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      id="quote"
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/12 bg-[#0a121c] p-6 sm:p-8 text-white shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#ff6b35]">
            Instant Event Inquiry
          </span>
          <h3 className="text-2xl font-black uppercase tracking-tight text-white mt-0.5">
            Request Private Shuttle Quote
          </h3>
        </div>
        <div className="hidden sm:block text-right">
          <span className="text-[11px] font-bold text-white/50 block">Direct Text/Call</span>
          <a href="tel:+17203696292" className="text-xs font-black text-[#3df3ff] hover:underline">
            (720) 369-6292
          </a>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Concert Date */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
            Concert Date
          </label>
          <div className="mt-1.5 relative">
            <input
              type="text"
              placeholder="e.g. July 18, 2026 or MM/DD"
              value={concertDate}
              onChange={(e) => setConcertDate(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#3df3ff] focus:outline-none focus:ring-1 focus:ring-[#3df3ff]"
            />
          </div>
        </div>

        {/* Artist / Event */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
            Concert Artist or Event
          </label>
          <div className="mt-1.5">
            <input
              type="text"
              placeholder="e.g. Summer Festival / Headliner"
              value={artistOrEvent}
              onChange={(e) => setArtistOrEvent(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#3df3ff] focus:outline-none focus:ring-1 focus:ring-[#3df3ff]"
            />
          </div>
        </div>

        {/* Pickup City / Metro */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
            Pickup City / Metro Area
          </label>
          <div className="mt-1.5">
            <select
              value={pickupCity}
              onChange={(e) => setPickupCity(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#0e1724] px-3.5 py-2.5 text-sm text-white focus:border-[#3df3ff] focus:outline-none focus:ring-1 focus:ring-[#3df3ff]"
            >
              <option value="Minneapolis">Minneapolis (Downtown / Uptown / North Loop)</option>
              <option value="St. Paul">St. Paul (Downtown / Grand Ave / Midway)</option>
              <option value="Stillwater">Stillwater, MN</option>
              <option value="Hudson">Hudson, WI</option>
              <option value="Woodbury / East Metro">Woodbury / Oakdale / Maplewood</option>
              <option value="Bloomington / Airport">Bloomington / MSP Airport</option>
              <option value="Other Twin Cities">Other Twin Cities Suburb</option>
            </select>
          </div>
        </div>

        {/* Specific Address or Hotel */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
            Pickup Address / Hotel (Optional)
          </label>
          <div className="mt-1.5">
            <input
              type="text"
              placeholder="e.g. Canopy Minneapolis or Home address"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#3df3ff] focus:outline-none focus:ring-1 focus:ring-[#3df3ff]"
            />
          </div>
        </div>

        {/* Group Size */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
            Group Size (Number of Guests)
          </label>
          <div className="mt-1.5">
            <select
              value={groupSize}
              onChange={(e) => {
                setGroupSize(e.target.value);
                const count = Number(e.target.value);
                if (count > 6) setVehiclePreference("van");
              }}
              className="w-full rounded-xl border border-white/15 bg-[#0e1724] px-3.5 py-2.5 text-sm text-white focus:border-[#3df3ff] focus:outline-none focus:ring-1 focus:ring-[#3df3ff]"
            >
              <option value="4">1 to 4 Guests</option>
              <option value="6">5 to 6 Guests (SUV or Van)</option>
              <option value="8">7 to 8 Guests (High-Roof Van)</option>
              <option value="10">9 to 10 Guests (High-Roof Van)</option>
              <option value="14">11 to 14 Guests (High-Roof Van)</option>
            </select>
          </div>
        </div>

        {/* Vehicle Choice */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
            Vehicle Preference
          </label>
          <div className="mt-1.5">
            <select
              value={vehiclePreference}
              onChange={(e) => setVehiclePreference(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#0e1724] px-3.5 py-2.5 text-sm text-white focus:border-[#3df3ff] focus:outline-none focus:ring-1 focus:ring-[#3df3ff]"
            >
              <option value="van">Private High-Roof Passenger Van (Up to 14 Pax) — Est. $500 RT</option>
              <option value="suv">Private Luxury SUV (Up to 6 Pax) — Est. $375–$425 RT</option>
            </select>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
            Your Name *
          </label>
          <div className="mt-1.5">
            <input
              type="text"
              required
              placeholder="First and Last Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#3df3ff] focus:outline-none focus:ring-1 focus:ring-[#3df3ff]"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
            Mobile Phone (For Text Quote) *
          </label>
          <div className="mt-1.5">
            <input
              type="tel"
              required
              placeholder="(612) 555-0199"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#3df3ff] focus:outline-none focus:ring-1 focus:ring-[#3df3ff]"
            />
          </div>
        </div>

        {/* Email */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
            Email Address
          </label>
          <div className="mt-1.5">
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#3df3ff] focus:outline-none focus:ring-1 focus:ring-[#3df3ff]"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
            Special Requests / Timing Notes
          </label>
          <div className="mt-1.5">
            <textarea
              rows={2}
              placeholder="e.g. Want early arrival for tailgating, bringing coolers, multi-stop pickup in St. Paul..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#3df3ff] focus:outline-none focus:ring-1 focus:ring-[#3df3ff]"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
        <div className="text-[11px] text-white/60">
          🔒 Private group charter · Driver waits on-site · Zero cancellation penalty for rescheduled concerts
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-[#ff6b35] px-8 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-[#ff6b35]/25 hover:bg-[#ff8252] transition disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Sending Quote...</span>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Request Flat Charter Quote</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
