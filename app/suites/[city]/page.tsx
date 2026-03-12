import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AuthorityMediaStrip from "@/app/components/dcc/AuthorityMediaStrip";
import PageActionBar from "@/app/components/dcc/PageActionBar";
import { getVegasHotelsByPremiumStayType } from "@/src/data/vegas-hotels-config";
import { buildMapsSearchUrl, type PageAction } from "@/src/lib/page-actions";

type Params = { city: string };

export function generateStaticParams() {
  return [{ city: "las-vegas" }];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city } = await params;
  if (city !== "las-vegas") return {};

  return {
    title: "Las Vegas Suites Guide | Destination Command Center",
    description:
      "Suite-focused Las Vegas guide for premium room categories, larger layouts, group stays, and hotel nodes where upgraded room types matter more than generic hotel sorting.",
    alternates: { canonical: "/suites/las-vegas" },
    openGraph: {
      title: "Las Vegas Suites Guide",
      description: "Premium-room planning for Las Vegas stays with suite-heavy hotel nodes, group-fit guidance, and connected nightlife and district routing.",
      url: "https://destinationcommandcenter.com/suites/las-vegas",
      type: "website",
    },
  };
}

export default async function SuitesVegasPage({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  if (city !== "las-vegas") notFound();

  const hotels = getVegasHotelsByPremiumStayType("suite");
  const hero = hotels[0]?.heroImage;
  const gallery = hotels.flatMap((hotel) => hotel.gallery?.slice(0, 1) ?? []).slice(0, 4);
  const actions: PageAction[] = [
    { href: "/vegas", label: "Vegas hub", kind: "internal" },
    { href: "/las-vegas/hotels", label: "Las Vegas hotels", kind: "internal" },
    { href: "/penthouses/las-vegas", label: "Penthouse-style stays", kind: "internal" },
    { href: buildMapsSearchUrl("Las Vegas Strip luxury hotels"), label: "Open Strip luxury hotels in Maps", kind: "external" },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.18),_transparent_24%),radial-gradient(circle_at_86%_18%,_rgba(34,211,238,0.12),_transparent_18%),linear-gradient(180deg,_#111217_0%,_#090a0d_100%)] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Luxury Lodging</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Las Vegas suites</h1>
          <p className="max-w-3xl text-lg text-zinc-200">
            Use this guide when the hotel decision is really a room-category decision: more space, stronger views, better group fit, or a premium suite category that changes the whole shape of the stay.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        {hero && gallery.length ? <AuthorityMediaStrip hero={hero} gallery={gallery} /> : null}

        <PageActionBar title="Useful actions for Las Vegas suites" actions={actions} />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Best for first-time luxury buyers</h2>
            <p className="mt-2 text-sm text-zinc-300">Start here when the trip needs a larger or more polished room without jumping straight to penthouse or villa-level assumptions.</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Best for groups and milestone stays</h2>
            <p className="mt-2 text-sm text-zinc-300">These hotels are the strongest first pass for multi-bedroom, entertaining, or celebration-led Vegas routing.</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Inventory note</h2>
            <p className="mt-2 text-sm text-zinc-300">This page describes premium room categories and trip fit, not live inventory. Use official hotel pages for current suite names and availability.</p>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">Featured suite-forward hotels</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {hotels.map((hotel) => (
              <Link key={hotel.slug} href={`/hotel/${hotel.slug}`} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 hover:bg-white/10">
                {hotel.image ? <img src={hotel.image.src} alt={hotel.image.alt} className="h-44 w-full object-cover" /> : null}
                <div className="p-5">
                  <h3 className="text-lg font-semibold">{hotel.name}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{hotel.premiumStayInfo?.notes ?? hotel.summary}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-400">
                    {(hotel.premiumStayInfo?.suiteTypes ?? []).map((type) => type.replace(/-/g, " ")).join(" · ")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
