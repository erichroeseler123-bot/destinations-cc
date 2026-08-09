"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Message = { role: "user" | "assistant"; content: string };
type Result = {
  answer: string;
  confidence: "high" | "medium" | "low";
  sources: Array<{ slug: string; title: string; href: string; category: string }>;
  handoff: null | { siteName: string; href: string; reason: string };
};

const STARTERS = [
  "Can we do whales and a helicopter in Juneau?",
  "How should 7 people get from DEN to Vail?",
  "What should we do with 8 hours in St. Thomas?",
  "Airboat or covered boat with kids?",
  "How do we get to Red Rocks without driving?",
];

export default function AskDccClient() {
  const params = useSearchParams();
  const initial = params.get("q")?.trim() || "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initial);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const sentInitial = useRef(false);

  async function ask(raw: string) {
    const question = raw.trim();
    if (!question || loading) return;
    const next = [...messages, { role: "user", content: question } as Message];
    setMessages(next); setInput(""); setResult(null); setLoading(true);
    try {
      const response = await fetch("/api/ask-dcc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Ask DCC could not answer that.");
      setResult(data);
      setMessages((current) => [...current, { role: "assistant", content: data.answer }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error instanceof Error ? error.message : "Ask DCC could not answer that." }]);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (initial && !sentInitial.current) { sentInitial.current = true; void ask(initial); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  function submit(event: FormEvent) { event.preventDefault(); void ask(input); }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-20 sm:px-8">
      <div className="rounded-[2rem] border border-cyan-900/70 bg-[#0d131d] p-4 sm:p-6">
        <div className="min-h-[280px] space-y-4 rounded-2xl border border-slate-800 bg-[#080c12] p-4 sm:p-6">
          {!messages.length ? (
            <div className="py-7 text-center">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">Ask a real trip question</p>
              <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-400">DCC searches its published decision graph first. AI explains the evidence; the network registry controls the commercial handoff.</p>
              <div className="mx-auto mt-7 flex max-w-3xl flex-wrap justify-center gap-2">
                {STARTERS.map((starter) => <button key={starter} onClick={() => void ask(starter)} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-600">{starter}</button>)}
              </div>
            </div>
          ) : messages.map((message, index) => (
            <div key={index} className={message.role === "user" ? "ml-auto max-w-3xl" : "mr-auto max-w-3xl"}>
              <div className={message.role === "user" ? "rounded-2xl bg-cyan-950/70 px-5 py-4 text-cyan-50" : "rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-slate-200"}>
                <p className="whitespace-pre-wrap leading-7">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && <p className="animate-pulse text-sm font-bold text-cyan-300">DCC is tracing the decision graph…</p>}
        </div>

        <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={2} placeholder="What are you trying to figure out?" className="min-h-[58px] flex-1 resize-none rounded-2xl border border-slate-700 bg-[#080c12] px-4 py-3 text-base text-white outline-none placeholder:text-slate-500 focus:border-cyan-500" />
          <button disabled={loading || input.trim().length < 3} className="rounded-2xl bg-cyan-300 px-7 py-3 text-sm font-black text-[#061017] disabled:opacity-40">Ask DCC</button>
        </form>
      </div>

      {result && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_.9fr]">
          <section className="rounded-3xl border border-slate-800 bg-[#0d131d] p-6">
            <div className="flex justify-between gap-3"><h2 className="font-black text-white">Research used</h2><span className="text-xs uppercase text-slate-500">{result.confidence} match</span></div>
            <div className="mt-4 space-y-3">
              {result.sources.length ? result.sources.map((source) => <Link key={source.slug} href={source.href} className="block rounded-2xl border border-slate-800 p-4 hover:border-cyan-700"><p className="text-xs font-black uppercase tracking-wider text-cyan-300">{source.category}</p><p className="mt-2 text-sm font-bold text-white">{source.title}</p></Link>) : <p className="text-sm text-slate-400">No strong published match yet. Add destination, timing, group size, or the tradeoff.</p>}
            </div>
          </section>
          <section className="rounded-3xl border border-amber-900/40 bg-amber-950/10 p-6">
            <p className="text-xs font-black uppercase tracking-wider text-amber-300">Next best action</p>
            {result.handoff ? <><h2 className="mt-3 text-2xl font-black text-white">{result.handoff.siteName}</h2><p className="mt-3 text-sm leading-6 text-slate-300">{result.handoff.reason}</p><a href={result.handoff.href} className="mt-5 inline-flex rounded-xl bg-amber-300 px-5 py-3 text-sm font-black text-[#17110a]">Continue with the decision resolved ↗</a></> : <><h2 className="mt-3 text-xl font-black text-white">Stay in research mode.</h2><p className="mt-3 text-sm text-slate-400">DCC has not justified a commercial handoff yet. Ask a follow-up instead.</p></>}
          </section>
        </div>
      )}
    </div>
  );
}
