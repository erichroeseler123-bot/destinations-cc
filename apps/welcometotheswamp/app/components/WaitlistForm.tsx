"use client";
import { useEffect, useRef, useState } from "react";
import { FINDER_PLAN_KEY, readFinderPlan } from "@/lib/finderPlan";
import { getTodayNewOrleansDate } from "@/lib/timezone";
import styles from "./WaitlistForm.module.css";

export default function WaitlistForm() {
  const [date, setDate] = useState(""); const [adults, setAdults] = useState(2); const [ages, setAges] = useState<number[]>([]);
  const [transport, setTransport] = useState("either"); const [boat, setBoat] = useState("any");
  const [storageReady, setStorageReady] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [saved, setSaved] = useState<{ submissionId: string; unsubscribeUrl: string } | null>(null);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => { const today = getTodayNewOrleansDate(); setDate(today); try { const p = readFinderPlan(localStorage.getItem(FINDER_PLAN_KEY), today); if (p) { setDate(p.travelDate); setAdults(p.adults); setAges(p.childrenAges); setTransport(p.transportation); setBoat(p.boatType); } } catch {} return () => pending.current?.abort(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    fetch("/api/waitlist/enroll", { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(data => setStorageReady(data?.requestStorageReady === true)).catch(() => setStorageReady(false)).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || storageReady !== true) return;
    const form = event.currentTarget; const fields = new FormData(form);
    const controller = new AbortController(); pending.current = controller; const timeout = setTimeout(() => controller.abort(), 15000);
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/waitlist/enroll", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ name: fields.get("name"), email: fields.get("email"), phone: fields.get("phone"), travelDate: date, adults, childrenCount: ages.length, childrenAges: ages, transportation: transport, boatType: boat, timeWindow: fields.get("timeWindow"), consent: fields.get("consent") === "on", website: fields.get("website") }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "We couldn’t save your request. Please try again.");
      setSaved({ submissionId: data.submissionId, unsubscribeUrl: data.unsubscribeUrl });
    } catch (e) { if (pending.current === controller) setError(e instanceof Error && e.name !== "AbortError" ? e.message : "The request timed out. It may have reached us; avoid submitting again immediately."); }
    finally { clearTimeout(timeout); if (pending.current === controller) { setBusy(false); pending.current = null; } }
  }
  if (saved) return <section className={styles.form} role="status"><h2>Your tour request is saved</h2><p>Reference: <strong>{saved.submissionId}</strong></p><p>Automated opening alerts are not active. This is not a booking, seat hold, or promise of contact.</p><p><a href={saved.unsubscribeUrl}>Withdraw this request</a>. Keep this private link if you want to withdraw your request later.</p><p><a href="/#next-boat">Check departures now →</a> · <a href="/tools">Plan the rest of your day →</a></p></section>;
  return <form onSubmit={submit} className={styles.form} aria-label="Swamp tour availability request">
    {storageReady !== true && <p role="status">{storageReady === null ? "Checking request service…" : "Requests are temporarily unavailable. Please check departures directly and try again later."}</p>}
    <div className={styles.fields}>
      <label>Your name<input name="name" maxLength={120} autoComplete="name" /></label><label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label><label>Phone (optional)<input name="phone" type="tel" maxLength={40} autoComplete="tel" /></label>
      <label>Travel date<input type="date" required value={date} min={getTodayNewOrleansDate()} onChange={e => setDate(e.target.value)} /></label>
      <label>Adults (13+)<input type="number" min={1} max={50} step={1} value={Number.isFinite(adults) ? adults : ""} required onChange={e => setAdults(e.target.value === "" ? NaN : Number(e.target.value))} /></label>
      <label>Children (0–12)<select value={ages.length} onChange={e => setAges(old => Array.from({ length: Number(e.target.value) }, (_, i) => old[i] ?? 0))}>{Array.from({ length: 9 }, (_, i) => <option key={i} value={i}>{i}</option>)}</select></label>
      {ages.map((age, i) => <label key={i}>Child {i + 1} age<select value={age} onChange={e => setAges(old => old.map((a, n) => n === i ? Number(e.target.value) : a))}>{Array.from({ length: 13 }, (_, n) => <option key={n} value={n}>{n}</option>)}</select></label>)}
      <label>Transportation<select value={transport} onChange={e => setTransport(e.target.value)}><option value="either">Either / decide later</option><option value="self_drive">Drive to dock</option><option value="hotel_pickup">Hotel pickup</option></select></label>
      <label>Boat preference<select value={boat} onChange={e => setBoat(e.target.value)}><option value="any">Any airboat</option><option value="small_airboat">Small airboat</option><option value="large_airboat">Large airboat</option></select></label>
      <label>Preferred time<select name="timeWindow"><option value="any">Any time</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option></select></label>
    </div>
    <div hidden aria-hidden="true"><label>Leave blank<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <label className={styles.consent}><input name="consent" type="checkbox" required />I agree to save this availability request and understand automated alerts are inactive. See the <a href="/privacy">privacy policy</a>.</label>
    <button type="submit" disabled={busy || !date || storageReady !== true}>{busy ? "Saving request…" : "Save my waitlist request"}</button>
    {error && <p role="alert">{error}</p>}
  </form>;
}
