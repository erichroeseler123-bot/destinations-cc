"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const EXAMPLES = [
  "Can we do whales and a helicopter in Juneau?",
  "How should 7 people get from DEN to Vail?",
  "Airboat or covered boat with kids?",
];

export default function AskDccEntry() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  function go(value: string) { const clean = value.trim(); if (clean) router.push(`/ask?q=${encodeURIComponent(clean)}`); }
  function submit(event: FormEvent) { event.preventDefault(); go(question); }

  return (
    <div>
      <form onSubmit={submit} className="rounded-3xl border border-cyan-900/70 bg-[#0d131d] p-3 shadow-[0_24px_70px_rgba(0,0,0,.3)] sm:flex sm:items-center sm:gap-3">
        <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What are you trying to figure out?" className="h-14 w-full flex-1 bg-transparent px-3 text-base text-white outline-none placeholder:text-slate-500 sm:text-lg" />
        <button className="mt-2 h-12 w-full rounded-2xl bg-cyan-300 px-6 text-sm font-black text-[#061017] transition hover:bg-cyan-200 sm:mt-0 sm:w-auto">Ask DCC</button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => <button key={example} type="button" onClick={() => go(example)} className="rounded-full border border-slate-800 px-3 py-2 text-left text-xs text-slate-400 transition hover:border-cyan-800 hover:text-slate-200">{example}</button>)}
      </div>
    </div>
  );
}
