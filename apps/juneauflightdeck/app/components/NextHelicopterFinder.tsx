"use client";

import { useEffect, useRef, useState } from "react";
import { juneauClock, juneauDate, type DepartureResponse } from "@/lib/nextDepartures";
import { addPortDateListener, readSharedPortDate, sharePortDate } from "@/lib/portDate";
import styles from "./NextHelicopterFinder.module.css";

export default function NextHelicopterFinder() {
  const [date, setDate] = useState("");
  const [after, setAfter] = useState("00:00");
  const [travelers, setTravelers] = useState("2");
  const [result, setResult] = useState<DepartureResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<AbortController | null>(null);
  useEffect(() => {
    const ready = new Date(Date.now() + 60 * 60000);
    setDate(readSharedPortDate() || juneauDate(ready)); setAfter(juneauClock(ready));
    const removeDateListener = addPortDateListener(setDate);
    return () => { removeDateListener(); pending.current?.abort(); };
  }, []);
  function clearResult() { pending.current?.abort(); pending.current = null; setLoading(false); setResult(null); setError(""); }
  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); clearResult();
    const controller = new AbortController(); pending.current = controller;
    setLoading(true);
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`/api/next-departures?${new URLSearchParams({ date, after, travelers })}`, { signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not read the booking calendars.");
      if (pending.current === controller) setResult(data);
    } catch (e) {
      if (pending.current === controller) setError(e instanceof Error && e.name !== "AbortError" ? e.message : "The calendar check took too long. Try again or check an operator calendar below.");
    } finally { clearTimeout(timeout); if (pending.current === controller) { pending.current = null; setLoading(false); } }
  }
  return <section className={styles.finder} aria-labelledby="next-helicopter-title">
    <p className={styles.eyebrow}>Your next Juneau adventure</p>
    <h2 id="next-helicopter-title">Find the next helicopter tour out</h2>
    <p>Compare upcoming starts from TEMSCO, Coastal, and NorthStar booking calendars. All times are local to Juneau.</p>
    <form onSubmit={search} className={styles.form}>
      <label>Tour date<input required type="date" value={date} min={juneauDate()} onChange={e => { clearResult(); setDate(e.target.value); sharePortDate(e.target.value); }} /></label>
      <label>Travelers<select value={travelers} onChange={e => { clearResult(); setTravelers(e.target.value); }}>{Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></label>
      <label>Ready for pickup / check-in after<input required type="time" value={after} onChange={e => { clearResult(); setAfter(e.target.value); }} /></label>
      <button type="submit" disabled={loading || !date}>{loading ? "Checking calendars…" : "Find next departure"}</button>
    </form>
    <p className={styles.note}>Ready time starts one hour ahead as a planning estimate. Adjust it for your location and travel plans. Listed starts may be pickup times; check the operator’s meeting instructions, children’s ages, weight rules, and seats for your party before paying.</p>
    <p><a href="/helicopter-waitlist" style={{color:"#b9eaff"}}>Join the helicopter waitlist</a> · <a href="/tools#day-plan" style={{color:"#b9eaff"}}>Plan your pickup and return timing</a></p>
    <div aria-live="polite" aria-busy={loading}>
      {loading && <p role="status">Checking the operators’ departure calendars…</p>}
      {error && <p role="alert">{error}</p>}
      {result && <>
        {result.failedCalendars > 0 && <p className={styles.note}>{result.failedCalendars} operator calendar{result.failedCalendars === 1 ? "" : "s"} could not be checked. Results may be incomplete.</p>}
        {result.departures.length === 0 ? <div className={styles.empty}><h3>{result.checkedOperators === 0 ? "We couldn’t check departures right now" : "No matching departures returned"}</h3><p>{result.checkedOperators === 0 ? "Try again or open an operator calendar below." : "Try another date or an earlier ready time. This does not mean every Juneau tour is sold out; seasonal schedules may not be published yet."}</p><a href="#viator-featured-tours">Browse tours and operator calendars ↓</a></div> : <>
          <p className={styles.note}>For {result.date} · {travelers} traveler{travelers === "1" ? "" : "s"} · starts after {after} · checked {new Intl.DateTimeFormat("en-US", { timeZone: "America/Juneau", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(result.checkedAt))}</p>
          {result.departures.slice(0, 4).map((departure, i) => <article className={i === 0 ? styles.next : styles.later} key={departure.id}>
            <div><p className={styles.eyebrow}>{i === 0 ? "Typical operator departure window" : "Later departure window"}</p><h3>{departure.timeLabel}</h3><strong>{departure.title}</strong><p>{departure.operator}</p><p className={styles.note}>Confirm final price and availability in Viator</p></div>
            <a className={styles.book} href={departure.bookingUrl} target="_blank" rel="noopener noreferrer">Check on Viator ↗</a>
          </article>)}
        </>}
      </>}
    </div>
  </section>;
}
