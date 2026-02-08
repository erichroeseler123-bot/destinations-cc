import Link from "next/link";

/* ============================================
   Homepage — Destination Gateway
   Optimized for Traffic → Cities → Monetization
============================================ */

export const dynamic = "force-static";

export default function HomePage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-24 space-y-28">

      {/* ==================================================
         HERO
      ================================================== */}

      <section className="text-center space-y-8">

        <h1 className="text-5xl md:text-7xl font-black tracking-tight">
          Destination Command Center
        </h1>

        <p className="max-w-3xl mx-auto text-xl text-zinc-400 leading-relaxed">
          Verified city guides, top-rated tours, and travel intelligence —
          built to help you book better and travel smarter.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">

          <PrimaryButton href="/las-vegas">
            Explore Las Vegas →
          </PrimaryButton>

          <SecondaryButton href="/authority">
            Browse Authority Layer
          </SecondaryButton>

        </div>

      </section>


      {/* ==================================================
         FEATURED DESTINATIONS
      ================================================== */}

      <section className="space-y-10">

        <header className="space-y-2 text-center">

          <h2 className="text-3xl font-bold">
            Popular Destinations
          </h2>

          <p className="text-zinc-400">
            Hand-curated guides with verified experiences
          </p>

        </header>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <CityCard
            href="/las-vegas"
            name="Las Vegas"
            tagline="Shows • Helicopters • Grand Canyon • Nightlife"
            badge="🔥 Most Popular"
          />

          <CityCard
            href="/alaska"
            name="Alaska"
            tagline="Cruise Ports • Glaciers • Wildlife"
          />

          <CityCard
            href="/miami"
            name="Miami"
            tagline="Beaches • Cruises • Nightlife"
          />

        </div>

      </section>


      {/* ==================================================
         WHY DCC
      ================================================== */}

      <section className="grid md:grid-cols-3 gap-8 text-center">

        <Feature
          title="Verified Data"
          desc="Real reviews, real providers, real availability."
        />

        <Feature
          title="Smarter Rankings"
          desc="We prioritize quality, reliability, and value."
        />

        <Feature
          title="No Hype"
          desc="Authority-layer intelligence — not paid placement."
        />

      </section>


      {/* ==================================================
         QUICK LINKS
      ================================================== */}

      <section className="space-y-8">

        <header className="text-center">

          <h2 className="text-2xl font-bold">
            Explore the Network
          </h2>

        </header>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <QuickLink
            href="/las-vegas/tours"
            title="Top Tours"
            desc="Best-rated activities"
          />

          <QuickLink
            href="/las-vegas/attractions"
            title="Attractions"
            desc="Must-see landmarks"
          />

          <QuickLink
            href="/authority"
            title="Authority Layer"
            desc="Ports & logistics"
          />

        </div>

      </section>


      {/* ==================================================
         FOOTER
      ================================================== */}

      <footer className="pt-16 border-t border-zinc-800 text-center text-sm text-zinc-500 space-y-2">

        <p>
          © {new Date().getFullYear()} Destination Command Center
        </p>

        <p>
          Travel Intelligence • Verified Networks • Optimized Booking
        </p>

      </footer>

    </main>
  );
}


/* ======================================================
   COMPONENTS
====================================================== */

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-7 py-4 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-500 transition shadow-lg shadow-cyan-600/25"
    >
      {children}
    </Link>
  );
}


function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-7 py-4 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-900 transition"
    >
      {children}
    </Link>
  );
}


function CityCard({
  href,
  name,
  tagline,
  badge,
}: {
  href: string;
  name: string;
  tagline: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="relative p-7 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/80 transition group"
    >

      {badge && (
        <div className="absolute -top-3 right-4 bg-cyan-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
          {badge}
        </div>
      )}

      <h3 className="text-xl font-bold group-hover:text-cyan-400 transition">
        {name}
      </h3>

      <p className="mt-2 text-sm text-zinc-400">
        {tagline}
      </p>

      <span className="inline-block mt-4 text-sm text-cyan-400 font-medium">
        View Guide →
      </span>

    </Link>
  );
}


function Feature({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40">

      <h3 className="font-semibold text-lg">
        {title}
      </h3>

      <p className="mt-2 text-sm text-zinc-400">
        {desc}
      </p>

    </div>
  );
}


function QuickLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="p-6 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition"
    >

      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm text-zinc-400">
        {desc}
      </p>

    </Link>
  );
}
