"use client";

import { useEffect, useState } from "react";
import { calculatePlan, clockLabel, parseSharedPlan, sharePlanUrl, validPlan, type DayPlan } from "../../../lib/tour-tools/planning";
import styles from "./TourPlanningKit.module.css";

export interface ToolkitConfig {
  brand: string;
  timezone: string;
  finderHref: string;
  waitlistHref: string;
  compareHref: string;
  weatherHref: string;
  weatherLabel: string;
  backupHref: string;
  fitGuideHref: string;
  fitQuestions: string[];
  comparisons: { name: string; description: string; href: string }[];
  backupOptions: { name: string; description: string; href: string }[];
}

export function TourFeatureLinks({ config }: { config: ToolkitConfig }) {
  return <nav aria-label="Tour planning features" className={styles.features}>
    {[{ href: config.finderHref, title: "Next departure", text: "Find the next tour start that fits your plans." }, { href: config.waitlistHref, title: "Waitlist & requests", text: "Save your date, group, and tour preferences." }, { href: config.compareHref, title: "Compare tours", text: "Choose the experience that suits your group." }, { href: "/tools#day-plan", title: "Timing & group tools", text: "Work out your day, save it, and share it." }, { href: config.backupHref, title: "Weather & backup plans", text: "Know where to check and what to do if plans change." }].map(item => <a key={item.title} href={item.href}><strong>{item.title}</strong><span>{item.text}</span></a>)}
  </nav>;
}

export default function TourPlanningKit({ config }: { config: ToolkitConfig }) {
  const [plan, setPlan] = useState<DayPlan>({ date: "", tourStart: "10:00", duration: 120, travelBefore: 45, travelAfter: 45, checkIn: 30, returnBy: "17:00" });
  const [status, setStatus] = useState("");
  const [sharedUrl, setSharedUrl] = useState("");
  const [checks, setChecks] = useState<boolean[]>(config.fitQuestions.map(() => false));
  const storageKey = `tour-day-plan:${config.brand}`;
  useEffect(() => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: config.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    let p: DayPlan | null = parseSharedPlan(new URLSearchParams(window.location.search));
    try { if (!p) { const saved = JSON.parse(localStorage.getItem(storageKey) || "null"); if (validPlan(saved)) p = saved; } } catch { /* Optional storage must not block planning. */ }
    setPlan(previous => p || { ...previous, date: today });
  }, [storageKey, config.timezone]);
  const result = calculatePlan(plan);
  function update<K extends keyof DayPlan>(key: K, value: DayPlan[K]) { setPlan(p => ({ ...p, [key]: value })); setStatus(""); setSharedUrl(""); }
  function save() { try { localStorage.setItem(storageKey, JSON.stringify(plan)); setStatus("Plan saved on this device. This does not book or reserve a tour."); } catch { setStatus("Your browser could not save the plan. Use the share link or print it instead."); } }
  async function share() { const url = sharePlanUrl(window.location.origin, plan); setSharedUrl(url); try { await navigator.clipboard.writeText(url); setStatus("Plan link copied. It includes timing choices only, not contact details or a booking."); } catch { setStatus("Copy the plan link below to share your timing choices."); } }
  return <div className={styles.kit}>
    <TourFeatureLinks config={config} />
    <section id="day-plan" className={styles.panel} aria-labelledby="day-plan-title">
      <p className={styles.eyebrow}>One plan for your whole party</p><h2 id="day-plan-title">Tour-day timing planner</h2>
      <p>Work backward from the time you need to be back. All times are local: {config.timezone}. The starting numbers are editable planning examples; replace them with your operator’s instructions and actual travel times.</p>
      <div className={styles.fields}>
        <label>Trip date<input type="date" value={plan.date} onChange={e => update("date", e.target.value)} /></label>
        <label>Tour start<input type="time" value={plan.tourStart} onChange={e => update("tourStart", e.target.value)} /></label>
        <label>Must be back by<input type="time" value={plan.returnBy} onChange={e => update("returnBy", e.target.value)} /></label>
        {([{ key: "duration", label: "Tour duration (minutes)" }, { key: "travelBefore", label: "Travel to tour (minutes)" }, { key: "checkIn", label: "Check-in lead time (minutes)" }, { key: "travelAfter", label: "Travel back (minutes)" }] as const).map(f => <label key={f.key}>{f.label}<input type="number" min={f.key === "duration" ? 1 : 0} max={720} step={1} value={Number.isFinite(plan[f.key]) ? plan[f.key] : ""} onChange={e => update(f.key, e.target.value === "" ? NaN : Number(e.target.value))} /></label>)}
      </div>
      <div className={styles.result} aria-live="polite">{result ? <>
        <dl><div><dt>Leave for your tour</dt><dd>{clockLabel(result.leaveAt)}</dd></div><div><dt>Check-in target</dt><dd>{clockLabel(result.checkInAt)}</dd></div><div><dt>Estimated return</dt><dd>{clockLabel(result.returnAt)}</dd></div><div><dt>Time before your deadline</dt><dd>{result.margin >= 0 ? `${result.margin} minutes` : `${Math.abs(result.margin)} minutes late`}</dd></div></dl>
        {result.crossesDay && <p>This plan crosses midnight. Check dates and overnight transport separately.</p>}
        <p>{result.margin <= 0 ? "This plan leaves no return buffer. Change the timing before booking." : "Leave extra time for delays. This calculation does not confirm pickup, cruise all-aboard time, or that a tour is safe to book."}</p>
      </> : <p>Enter a valid date, times, and whole-minute durations to calculate your day.</p>}</div>
      <div className={styles.actions}><button type="button" disabled={!result} onClick={save}>Save my plan</button><button type="button" disabled={!result} onClick={share}>Share plan link</button><button type="button" onClick={() => window.print()}>Print plan</button><button type="button" onClick={() => { try { localStorage.removeItem(storageKey); } catch {} setSharedUrl(""); setStatus("Saved plan removed from this device."); }}>Remove saved plan</button></div>
      {status && <p role="status">{status}</p>}{sharedUrl && <label>Shareable plan link<input readOnly value={sharedUrl} onFocus={e => e.target.select()} /></label>}
    </section>
    <section className={styles.panel} aria-labelledby="group-fit-title"><h2 id="group-fit-title">Make sure the tour fits everyone</h2><p>Check these with your group and the operator. This checklist is not an eligibility or safety clearance.</p><div className={styles.checks}>{config.fitQuestions.map((q, i) => <label key={q}><input type="checkbox" checked={checks[i] || false} onChange={e => setChecks(old => old.map((x, n) => n === i ? e.target.checked : x))} />{q}</label>)}</div><p aria-live="polite">{checks.filter(Boolean).length} of {checks.length} checks reviewed</p><a href={config.fitGuideHref}>Read the group-fit guide →</a></section>
    <section className={styles.panel} aria-labelledby="compare-tours-title"><h2 id="compare-tours-title">Compare your options</h2><div className={styles.cards}>{config.comparisons.map(option => <a href={option.href} key={option.name}><h3>{option.name}</h3><p>{option.description}</p><span>Compare details →</span></a>)}</div></section>
    <section className={styles.panel} aria-labelledby="weather-backup-title"><h2 id="weather-backup-title">Weather and a backup plan</h2><p>Check regional conditions, then get the operator’s decision. City forecasts do not confirm conditions at the tour location or whether a departure will operate.</p><a href={config.weatherHref} target="_blank" rel="noopener noreferrer">{config.weatherLabel} ↗</a><div className={styles.cards}>{config.backupOptions.map(option => <a href={option.href} key={option.name}><h3>{option.name}</h3><p>{option.description}</p><span>Explore option →</span></a>)}</div><p>Alternatives are booked separately and depend on availability. Refunds follow your original provider and booking-channel terms.</p><a href={config.backupHref}>Read the weather and cancellation guide →</a></section>
  </div>;
}
