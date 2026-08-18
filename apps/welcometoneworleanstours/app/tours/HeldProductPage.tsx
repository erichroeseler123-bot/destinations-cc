import Link from "next/link";
import { HELD_COMBO_BANNER, HELD_COMBO_REASON } from "@/app/new-orleans/data/truthPolicy";

export default function HeldProductPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#0d0b0d] px-6 py-14 text-[#fdfbf7] md:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="border border-[#d4af37]/45 bg-[#171217] p-7 md:p-9">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Operator verification pending</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">Covered Boat + Plantation</h1>
          <p className="mt-5 text-lg leading-8 text-white/80">{HELD_COMBO_BANNER}</p>
        </div>

        <section className="mt-8 border border-white/10 bg-white/[0.025] p-7 md:p-9">
          <h2 className="font-serif text-2xl">Why this is held</h2>
          <p className="mt-4 leading-7 text-white/70">{HELD_COMBO_REASON} We do not currently have enough authoritative current data to present duration, transportation, pickup, eligibility or included plantation details as verified facts.</p>
          <p className="mt-4 leading-7 text-white/70">We are intentionally not showing a self-service booking button until the participating operator configuration is verified.</p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href="tel:+15044849687"
            className="flex min-h-14 items-center justify-center bg-[#d4af37] px-5 py-4 text-center text-sm font-black uppercase tracking-[0.08em] text-[#151515]"
          >
            Call 504-484-9687 to confirm
          </a>
          <Link
            href="/swamp-tours"
            className="flex min-h-14 items-center justify-center border border-[#d4af37]/60 px-5 py-4 text-center text-sm font-bold uppercase tracking-[0.08em] text-[#d4af37]"
          >
            See verified swamp options
          </Link>
        </section>

        <p className="mt-8 text-xs leading-6 text-white/45">Current operator checkout remains controlling once this product is re-verified. Unknown facts are intentionally not guessed.</p>
      </div>
    </main>
  );
}
