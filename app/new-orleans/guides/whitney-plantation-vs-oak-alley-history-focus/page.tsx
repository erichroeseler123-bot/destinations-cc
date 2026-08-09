import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Whitney vs Oak Alley: Which Plantation Tour for History?",
  description:
    "Compare Whitney Plantation and Oak Alley for slavery history, house and grounds, walking, accessibility, food and current tour timing before choosing a New Orleans plantation tour.",
  alternates: { canonical: "/guides/whitney-plantation-vs-oak-alley-history-focus" },
};

export default function PlantationHistoryFocusGuide() {
  return (
    <article className="min-h-screen bg-[#151515] text-[#fdfbf7]">
      <header className="border-b border-[#2a2a2a] bg-[#101010] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">History-focus decision guide</p>
          <h1 className="mt-4 max-w-4xl font-[var(--font-accent)] text-4xl font-bold leading-tight md:text-6xl">Whitney Plantation vs Oak Alley: which should you choose for history?</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#ccc]">If your main priority is understanding slavery through the lives and testimony of enslaved people, <strong className="text-white">Whitney is the stronger fit</strong>. If you want a broader historic-site visit that combines a guided Big House experience, grounds, exhibits and additional visitor amenities, <strong className="text-white">Oak Alley is the broader site experience</strong>.</p>
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-[#888]">Operator facts last checked August 9, 2026</p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-14 px-6 py-12 md:py-16">
        <section className="grid gap-6 md:grid-cols-2">
          <div className="border border-[#333] bg-[#1a1a1a] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">Choose Whitney if...</p>
            <h2 className="mt-3 font-[var(--font-accent)] text-3xl font-bold">The slavery narrative is your first priority</h2>
            <p className="mt-5 leading-relaxed text-[#ccc]">The current tour description centers first-person narratives, memorials, restored buildings and the history of slavery in Louisiana. The visit uses a self-paced audio experience rather than presenting the property primarily through the owner's house.</p>
            <Link href="/tours/whitney-plantation-tour" className="mt-6 inline-block text-sm font-bold text-[#d4af37] underline underline-offset-4">View Whitney tour →</Link>
          </div>
          <div className="border border-[#333] bg-[#1a1a1a] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">Choose Oak Alley if...</p>
            <h2 className="mt-3 font-[var(--font-accent)] text-3xl font-bold">You want a broader historic-property visit</h2>
            <p className="mt-5 leading-relaxed text-[#ccc]">The current visit includes a guided Big House tour plus the Sugarcane Theater, reconstructed slave cabins and slavery exhibit, owners exhibit, gardens and blacksmith area. Food and drink options are also available on site.</p>
            <Link href="/tours/oak-alley-plantation-tour-grey-line" className="mt-6 inline-block text-sm font-bold text-[#d4af37] underline underline-offset-4">View Oak Alley tour →</Link>
          </div>
        </section>

        <section className="overflow-x-auto">
          <h2 className="font-[var(--font-accent)] text-3xl font-bold">The differences that actually change the decision</h2>
          <table className="mt-6 w-full min-w-[760px] border-collapse text-left text-sm">
            <thead><tr className="border-b border-[#444] text-[#d4af37]"><th className="p-3">Question</th><th className="p-3">Whitney Plantation</th><th className="p-3">Oak Alley Plantation</th></tr></thead>
            <tbody className="text-[#ccc]">
              <tr className="border-b border-[#333]"><td className="p-3 font-bold text-white">Primary historical emphasis</td><td className="p-3">Slavery, enslaved people's lives and first-person narratives</td><td className="p-3">Broader plantation-property history with slavery exhibits included</td></tr>
              <tr className="border-b border-[#333]"><td className="p-3 font-bold text-white">Tour format</td><td className="p-3">Self-paced audio experience</td><td className="p-3">Guided Big House plus self-guided grounds/exhibits</td></tr>
              <tr className="border-b border-[#333]"><td className="p-3 font-bold text-white">Listed total outing</td><td className="p-3">5 hours 25 minutes</td><td className="p-3">5 hours 25 minutes</td></tr>
              <tr className="border-b border-[#333]"><td className="p-3 font-bold text-white">New Orleans meeting point</td><td className="p-3">400 Toulouse Street</td><td className="p-3">400 Toulouse Street</td></tr>
              <tr className="border-b border-[#333]"><td className="p-3 font-bold text-white">Walking surface</td><td className="p-3">Uneven gravel on grounds</td><td className="p-3">Mostly paved grounds; walking remains integral</td></tr>
              <tr className="border-b border-[#333]"><td className="p-3 font-bold text-white">Major accessibility caveat</td><td className="p-3">Grounds can be difficult because of gravel</td><td className="p-3">Second floor of Big House requires 22 stairs; video alternative listed</td></tr>
              <tr><td className="p-3 font-bold text-white">Food on site</td><td className="p-3">Food/drink not included in current listing</td><td className="p-3">Restaurant, café and bar options listed</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="font-[var(--font-accent)] text-3xl font-bold">What each site includes</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="border border-[#333] p-6">
              <h3 className="text-xl font-bold">Whitney</h3>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[#ccc]">
                <li>Self-paced audio tour</li>
                <li>Memorials and museum material</li>
                <li>Restored historic buildings</li>
                <li>First-person narratives and slavery-focused interpretation</li>
                <li>Slave quarters viewable, but the checked tour says they are not enterable</li>
              </ul>
            </div>
            <div className="border border-[#333] p-6">
              <h3 className="text-xl font-bold">Oak Alley</h3>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[#ccc]">
                <li>Guided Big House tour</li>
                <li>Sugarcane Theater</li>
                <li>Reconstructed slave cabins and slavery exhibit</li>
                <li>Owners exhibit, gardens and blacksmith area</li>
                <li>Restaurant, café and bar options</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="border-l-4 border-[#d4af37] bg-[#1b1b1b] p-6 md:p-8">
          <h2 className="font-[var(--font-accent)] text-2xl font-bold">For grandparents or limited mobility</h2>
          <p className="mt-4 leading-relaxed text-[#ccc]">Neither site should be reduced to a simple “accessible / not accessible” label. Whitney lists accessible gift shop, restroom and museum areas, but the grounds include uneven gravel. Oak Alley is more paved, but the second floor of the Big House requires 22 stairs; the operator lists a video alternative for guests who cannot go upstairs. Call the operator before booking when mobility is a deciding factor.</p>
        </section>

        <section className="border border-[#333] bg-[#181818] p-6 md:p-8">
          <h2 className="font-[var(--font-accent)] text-2xl font-bold">A note on the word “plantation”</h2>
          <p className="mt-4 leading-relaxed text-[#ccc]">These are historic sites connected to slavery. We recommend choosing based on what history you want to understand, the interpretation format, physical accessibility and the amount of time your group can devote — not simply which property looks prettier in photographs.</p>
        </section>

        <section className="border-t border-[#333] pt-8">
          <h2 className="text-lg font-bold">Official sources checked</h2>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a className="text-[#d4af37] underline underline-offset-4" target="_blank" rel="noopener noreferrer" href="https://www.graylineneworleans.com/all/swamp-and-bayou-tour/whitney-plantation-tour/">Whitney Plantation tour</a>
            <a className="text-[#d4af37] underline underline-offset-4" target="_blank" rel="noopener noreferrer" href="https://www.graylineneworleans.com/plantation-tours/oak-alley-plantation-tour/">Oak Alley Plantation tour</a>
          </div>
        </section>

        <nav className="border-t border-[#2a2a2a] pt-8 text-sm flex flex-wrap gap-5">
          <Link href="/compare/whitney-vs-oak-alley" className="text-[#d4af37] underline underline-offset-4">Full Whitney vs Oak Alley comparison</Link>
          <Link href="/plantation-tours" className="text-[#d4af37] underline underline-offset-4">Browse plantation tours</Link>
          <Link href="/help-me-choose" className="text-[#d4af37] underline underline-offset-4">Use Help Me Choose</Link>
        </nav>
      </div>
    </article>
  );
}
