const EXAMPLES = [
  "Airboat or covered swamp boat with kids in New Orleans?",
  "Can we do whales and a helicopter in Juneau?",
  "How should 7 people get from DEN to Vail?",
];

export default function AskDccEntry() {
  return (
    <div>
      <form action="/ask" method="get" role="search" aria-label="Ask a travel question" className="rounded-3xl border border-cyan-900/70 bg-[#0d131d] p-3 shadow-[0_24px_70px_rgba(0,0,0,.3)] sm:flex sm:items-end sm:gap-3">
        <label className="block min-w-0 flex-1 px-3 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">Your destination and question</span>
          <input name="q" required minLength={3} maxLength={1800} placeholder="e.g. Which New Orleans swamp tour fits a family without a car?" className="h-14 w-full bg-transparent text-base text-white outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-cyan-300 sm:text-lg" />
        </label>
        <button type="submit" className="mt-2 h-14 w-full rounded-2xl bg-cyan-300 px-6 text-sm font-black text-[#061017] transition hover:bg-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:mt-0 sm:w-auto">Find an answer →</button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Example travel questions">
        {EXAMPLES.map((example) => (
          <a key={example} href={`/ask?q=${encodeURIComponent(example)}`} className="rounded-full border border-slate-700 bg-slate-900/50 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-cyan-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">{example}</a>
        ))}
      </div>
    </div>
  );
}

