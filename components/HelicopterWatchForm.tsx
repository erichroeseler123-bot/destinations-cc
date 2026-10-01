"use client";
import { useEffect, useState, type FormEvent } from "react";
const API = "https://destinationcommandcenter.com/api/public/helicopter-watch";
type Product = { code: string; title: string; supplier: string | null };
const field = { display: "grid", gap: 6, marginBottom: 16 }, input = { padding: 12, border: "1px solid #8193a5", borderRadius: 6, background: "white", color: "#152334", width: "100%", boxSizing: "border-box" as const };
export default function HelicopterWatchForm() {
  const [port, setPort] = useState("juneau"), [products, setProducts] = useState<Product[]>([]), [chosen, setChosen] = useState<string[]>([]);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(""), [saved, setSaved] = useState(""), [minimum, setMinimum] = useState("");
  useEffect(() => { const c = new AbortController(); setLoading(true); setError(""); setProducts([]); setChosen([]); fetch(`${API}?port=${port}`, { signal: c.signal }).then(async (r) => { const v = await r.json(); if (!r.ok) throw new Error(v.error); setProducts(v.products); setMinimum(v.minimumDate); }).catch((e) => { if (e.name !== "AbortError") setError(e.message); }).finally(() => { if (!c.signal.aborted) setLoading(false); }); return () => c.abort(); }, [port]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); const f = new FormData(e.currentTarget), agesText = String(f.get("ages") || ""), ages = agesText.split(",").map((s) => Number(s.trim()));
    if (!agesText.split(",").every((s) => /^\d+$/.test(s.trim())) || ages.length > 12 || ages.some((a) => a > 120)) { setBusy(false); setError("Enter one age per traveler, separated by commas."); return; }
    try { const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.get("name"), email: f.get("email"), phone: f.get("phone"), ship: f.get("ship"), date: f.get("date"), port, productCodes: chosen, travelerAges: ages, earliestStart: f.get("earliestStart"), latestStart: f.get("latestStart"), notes: f.get("notes"), website: f.get("website") }) }); const v = await r.json(); if (!r.ok) throw new Error(v.error); setSaved(v.requestId); } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); } finally { setBusy(false); }
  }
  if (saved) return <section role="status"><h2>Your request is saved</h2><p>Reference: {saved}</p><p>Our team reviews matching availability before contacting you. No seats are reserved by this request.</p></section>;
  return <form onSubmit={submit} style={{ maxWidth: 700 }}>
    <label style={field}>Port<select value={port} onChange={(e) => setPort(e.target.value)} style={input}><option value="juneau">Juneau</option><option value="skagway">Skagway</option></select></label>
    <label style={field}>Port date<input name="date" type="date" min={minimum || undefined} required style={input}/></label>
    <label style={field}>Cruise ship<input name="ship" required minLength={2} maxLength={120} style={input}/></label>
    <fieldset style={{ padding: 16, border: "1px solid #8193a5", borderRadius: 6, marginBottom: 16 }}><legend>Tours you would accept (up to 6)</legend>{loading && <p role="status">Loading current tours…</p>}{products.map((p) => <label key={p.code} style={{ display: "flex", gap: 10, margin: "12px 0" }}><input type="checkbox" checked={chosen.includes(p.code)} disabled={!chosen.includes(p.code) && chosen.length >= 6} onChange={(e) => setChosen((old) => e.target.checked ? [...old, p.code] : old.filter((v) => v !== p.code))}/><span>{p.title}{p.supplier && <small style={{ display: "block" }}>{p.supplier}</small>}</span></label>)}</fieldset>
    <label style={field}>Traveler ages on the tour date<input name="ages" placeholder="For example: 42, 39, 12, 8" required maxLength={80} style={input}/><small>Include every traveler so we check the correct ticket categories.</small></label>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}><label style={field}>Earliest departure (optional)<input name="earliestStart" type="time" style={input}/></label><label style={field}>Latest departure (optional)<input name="latestStart" type="time" style={input}/></label></div><p>Use Alaska local time. Allow for pickup, tour duration and returning to your ship.</p>
    <label style={field}>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={120} style={input}/></label>
    <label style={field}>Contact email<input name="email" type="email" autoComplete="email" required maxLength={254} style={input}/></label>
    <label style={field}>Phone (optional)<input name="phone" type="tel" autoComplete="tel" maxLength={40} style={input}/></label>
    <label style={field}>Ship timing or other requirements<textarea name="notes" rows={3} maxLength={1000} style={input}/></label>
    <div aria-hidden="true" style={{ display: "none" }}><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <p>Submitting lets Juneau Flight Deck store this request and use your details to follow up. Automated opening alerts go to our team for review.</p>
    {error && <p role="alert" style={{ color: "#b72525" }}>{error}</p>}
    <button disabled={busy || loading || !chosen.length} type="submit" style={{ padding: "14px 24px", background: "#176f88", color: "white", border: 0, borderRadius: 6, fontWeight: 700 }}>{busy ? "Saving…" : "Request an availability watch"}</button>
  </form>;
}
