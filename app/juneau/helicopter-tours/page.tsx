import type { Metadata } from "next";
import Link from "next/link";

const PAGE_URL = "https://destinationcommandcenter.com/juneau/helicopter-tours";
const SATELLITE_URL = "https://juneauflightdeck.com";

type SearchParams = {
  date?: string;
};

const EXPERIENCE_LANES = [
  {
    title: "Glacier landing flights",
    body: "Best for cruise visitors who want the cleanest Juneau helicopter category and a strong one-day premium memory.",
    query: "glacier landing",
  },
  {
    title: "Icefield explorer flights",
    body: "A good lane when the buyer wants broad scenic value without overcomplicating the decision with operator research.",
    query: "icefield explorer",
  },
  {
    title: "Dog sled + helicopter",
    body: "The higher-intensity premium lane for buyers who already know they want a signature Alaska-style add-on.",
    query: "dog sled helicopter",
  },
];

export const metadata: Metadata = {
  title: "DCC Fast Pass | Juneau Helicopter Tours | Date-First Direct Bookings",
  description:
    "DCC Fast Pass for Juneau helicopter tours. DCC explains the buying lane, then routes visitors into a date-first booking surface built for cruise-day planning and direct bookings.",
  alternates: { canonical: "/juneau/helicopter-tours" },
  keywords: [
    "juneau helicopter tours",
    "juneau glacier helicopter tours",
    "juneau cruise helicopter excursion",
    "juneau helicopter tour availability",
  ],
  openGraph: {
    title: "DCC Fast Pass | Juneau Helicopter Tours",
    description:
      "A DCC Fast Pass routing page for Juneau helicopter-tour intent, built around date-first cruise-day booking behavior.",
    url: PAGE_URL,
    type: "website",
  },
};

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": PAGE_URL,
        url: PAGE_URL,
        name: "Juneau Helicopter Tours",
        description:
          "Decision-first DCC page for Juneau helicopter-tour buyers who need a date-first handoff into live availability.",
        dateModified: "2026-03-23",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Alaska", item: "https://destinationcommandcenter.com/alaska" },
          { "@type": "ListItem", position: 2, name: "Juneau Helicopter Tours", item: PAGE_URL },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

function isValidDate(value?: string): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export default async function JuneauHelicopterToursPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const selectedDate = isValidDate(sp.date) ? sp.date : null;
  const satelliteHref = selectedDate ? `${SATELLITE_URL}?date=${encodeURIComponent(selectedDate)}` : SATELLITE_URL;
  const mobileHandoffQr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(PAGE_URL)}`;

  return (
    <main className="min-h-screen bg-[#07131d] text-white">
      <JsonLd />
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-16">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.10),transparent_24%),linear-gradient(180deg,rgba(9,17,24,0.97),rgba(5,8,22,0.99))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">DCC Juneau flight lane</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Juneau helicopter tours</h1>
          <p className="mt-4 text-base font-bold uppercase tracking-[0.18em] text-[#8df0cc]">
            DCC Fast Pass - Real-time availability to direct bookings
          </p>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">
            Juneau helicopter-tour buyers behave differently from same-day activity buyers. Most cruise visitors only have one day in port, so the cleanest booking path starts with the date they will actually be in Juneau and shows only that day&apos;s helicopter inventory.
          </p>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/68">
            DCC explains the category and routes the buyer into a dedicated date-first booking surface. From there, the visitor sees live helicopter availability for the chosen day and completes the reservation directly with the provider through FareHarbor.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={satelliteHref}
              className="rounded-2xl border border-[#67e8f9]/30 bg-[linear-gradient(180deg,#67e8f9,#60a5fa)] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071018] shadow-[0_18px_38px_rgba(96,165,250,0.12)] transition hover:scale-[1.02]"
            >
              {selectedDate ? `Get DCC Fast Pass for ${selectedDate}` : "Get DCC Fast Pass"}
            </a>
            <Link href="/alaska" className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
              Back to Alaska planning
            </Link>
          </div>
        </header>

        <section className="hidden items-center justify-between gap-8 rounded-3xl border border-[#8df0cc]/20 bg-[linear-gradient(135deg,rgba(17,29,31,0.96),rgba(7,14,22,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] lg:flex">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.24em] text-[#8df0cc]">Desktop handoff</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">This site is designed for mobile.</h2>
            <p className="mt-3 text-base leading-7 text-white/76">
              The dedicated Juneau helicopter site is optimized for fast cruise-day booking. Pick the exact date you will be in port and move straight into live availability.
            </p>
            <a
              href={satelliteHref}
              className="mt-5 inline-flex rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm font-medium text-white/88 hover:bg-white/10"
            >
              Open the Juneau booking surface
            </a>
          </div>
          <div className="shrink-0 rounded-[2rem] border border-white/10 bg-white p-4 text-center shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <img
              src={mobileHandoffQr}
              alt="QR code to open the Juneau helicopter tours page on your phone"
              width={220}
              height={220}
              className="h-[220px] w-[220px] rounded-2xl"
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">Scan on your phone</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <h2 className="text-2xl font-bold">Why Juneau is different</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-white/78">
              <p>
                Helicopter tours in Juneau are usually not impulse same-day purchases in the way swamp or nightlife products can be. Cruise visitors tend to know their exact port day and only care about what is open on that one date.
              </p>
              <p>
                That is why the satellite flow starts with the date instead of a generic list. The DCC page exists to capture search intent, explain the structure, and route the visitor into a cleaner booking surface that only shows relevant helicopter slots.
              </p>
            </div>
          </article>
          <article className="rounded-3xl border border-white/10 bg-black/20 p-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Booking notice</div>
            <p className="mt-4 text-sm leading-7 text-white/76">
              DCC Fast Pass keeps this lane date-first and helicopter-only. When you choose a slot there, the reservation is completed directly with the operator through FareHarbor. DCC may earn a commission from the operator.
            </p>
            <p className="mt-4 text-sm leading-7 text-white/62">
              {selectedDate
                ? `Current handoff date: ${selectedDate}.`
                : "If you already know your port date, add it to the URL or pick it on the satellite site first."}
            </p>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {EXPERIENCE_LANES.map((lane) => (
            <article key={lane.title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-xl font-semibold text-white">{lane.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/74">{lane.body}</p>
              <a
                href={`${satelliteHref}${selectedDate ? "&" : "?"}q=${encodeURIComponent(lane.query)}`}
                className="mt-5 inline-flex text-sm font-medium text-cyan-200 hover:text-cyan-100"
              >
                Hand off to this helicopter lane →
              </a>
            </article>
          ))}
        </section>

        <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-white/46">
          DCC Fast Pass - To Direct Bookings
        </p>
      </div>
    </main>
  );
}
