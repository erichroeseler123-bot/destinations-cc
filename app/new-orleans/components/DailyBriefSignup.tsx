"use client";

import { FormEvent, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { getWnoFunnelContext } from "./WnoFunnelTracker";

const TELEMETRY_URL = "https://www.destinationcommandcenter.com/api/wno/telemetry";

export default function DailyBriefSignup({ source }: { source: "today" | "tonight" | "guides" }) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    if (company) {
      setState("done");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setState("error");
      return;
    }

    setState("sending");
    const context = getWnoFunnelContext();
    const payload = {
      eventName: "lead_captured",
      sessionId: context?.sessionId,
      landingPath: context?.landingPath,
      sourcePage: typeof window !== "undefined" ? window.location.pathname : undefined,
      targetPath: "/guides/things-to-do-in-new-orleans-today",
      email: normalizedEmail,
      consent: "daily_brief_email",
      briefType: "wno_48_hour_brief",
      signupSource: source,
    };

    try {
      await fetch(TELEMETRY_URL, {
        method: "POST",
        mode: "no-cors",
        keepalive: true,
        headers: { "content-type": "text/plain;charset=UTF-8" },
        body: JSON.stringify(payload),
      });
      trackEvent("daily_brief_signup", {
        surface: "wno_daily_brief",
        signup_source: source,
        entry_source: context?.source,
        entry_path: context?.landingPath,
      });
      setState("done");
      setEmail("");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="border-y border-[#d4af37]/25 bg-[#171219] px-6 py-12 text-[#fdfbf7]">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1.05fr_.95fr] md:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#d4af37]">New Orleans, without the homework</p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl">Get the 48-hour brief</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">
            Join the list for a short New Orleans planning brief built around what matters now: tonight, tomorrow, weather, river and swamp conditions, plus one concierge pick.
          </p>
          <p className="mt-3 text-xs leading-5 text-white/45">Email only. Unsubscribe anytime. We do not sell your email address.</p>
        </div>

        {state === "done" ? (
          <div className="border border-[#d4af37]/35 bg-black/20 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">You’re on the list</p>
            <p className="mt-3 text-sm leading-6 text-white/70">We saved your preference for the New Orleans 48-hour brief.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="border border-[#d4af37]/35 bg-black/20 p-6" noValidate>
            <label htmlFor={`daily-brief-email-${source}`} className="text-xs font-bold uppercase tracking-[0.16em] text-[#d4af37]">Email address</label>
            <input
              id={`daily-brief-email-${source}`}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-3 w-full border border-white/15 bg-[#0b090c] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#d4af37]"
            />
            <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
              <label htmlFor={`daily-brief-company-${source}`}>Company</label>
              <input id={`daily-brief-company-${source}`} type="text" tabIndex={-1} autoComplete="off" value={company} onChange={(event) => setCompany(event.target.value)} />
            </div>
            <button
              type="submit"
              disabled={state === "sending"}
              className="mt-3 w-full bg-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#171717] disabled:opacity-60"
            >
              {state === "sending" ? "Saving…" : "Join the 48-hour brief"}
            </button>
            {state === "error" && <p className="mt-3 text-xs text-[#f1c27d]">Enter a valid email and try again.</p>}
            <p className="mt-3 text-[11px] leading-5 text-white/40">By joining, you agree to receive the New Orleans planning brief. See our Privacy Policy for how contact information is handled.</p>
          </form>
        )}
      </div>
    </section>
  );
}
