import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageActionBar from "@/app/components/dcc/PageActionBar";
import SocialProfileSection from "@/app/components/dcc/SocialProfileSection";
import { getEntityRegistryNode } from "@/src/data/entities-registry";
import {
  getVegasCasinoBySlug,
  VEGAS_CASINOS_CONFIG,
  type VegasCasinoTag,
} from "@/src/data/vegas-casinos-config";
import { buildMapsSearchUrl, buildOfficialSearchUrl, type PageAction } from "@/src/lib/page-actions";

type Params = { slug: string };

function formatTag(tag: VegasCasinoTag) {
  return tag
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function districtLink(district: "las-vegas-strip" | "fremont-street" | "summerlin") {
  switch (district) {
    case "las-vegas-strip":
      return { href: "/las-vegas-strip", label: "Las Vegas Strip" };
    case "fremont-street":
      return { href: "/fremont-street", label: "Fremont Street" };
    case "summerlin":
      return { href: "/summerlin", label: "Summerlin" };
  }
}

function tagLink(tag: VegasCasinoTag) {
  switch (tag) {
    case "strip":
      return { href: "/las-vegas-strip", label: "Strip casinos" };
    case "downtown":
      return { href: "/fremont-street", label: "Downtown casinos" };
    case "luxury":
      return { href: "/luxury-hotels-las-vegas", label: "Luxury Vegas" };
    case "sportsbook":
      return { href: "/sports", label: "Sports" };
    case "nightlife":
      return { href: "/vegas", label: "Vegas nightlife" };
    case "show-adjacent":
      return { href: "/las-vegas/shows", label: "Las Vegas shows" };
    case "classic":
      return { href: "/fremont-street", label: "Classic Vegas" };
  }
}

function getCasinoRelationshipLinks(slug: string) {
  switch (slug) {
    case "bellagio-casino":
      return [
        {
          href: "/casinos-near/bellagio",
          title: "Casinos near Bellagio",
          body: "Compare nearby Strip casino options when Bellagio is the starting point but the gaming plan is still open.",
        },
      ];
    case "caesars-palace-casino":
      return [
        {
          href: "/accessible-hotels-near/caesars-palace-casino",
          title: "Accessible hotels near Caesars Palace Casino",
          body: "Compare nearby hotels when Caesars is the anchor but easier entrances, smoother movement, or simpler arrival matters before the room is chosen.",
        },
        {
          href: "/hotels-near/caesars-palace-casino",
          title: "Hotels near Caesars Palace Casino",
          body: "See nearby hotel options when Caesars is the anchor and you want the best nearby stay, not just the flagship resort itself.",
        },
        {
          href: "/attractions-near/caesars-palace-casino",
          title: "Attractions near Caesars Palace Casino",
          body: "Branch into nearby Strip attractions when Caesars is the anchor for the trip and the rest of the night is still being planned.",
        },
      ];
    case "wynn-casino":
      return [
        {
          href: "/hotels-near/wynn-casino",
          title: "Hotels near Wynn Casino",
          body: "Compare nearby north Strip hotels when Wynn is the main reference point for luxury or nightlife-led Vegas planning.",
        },
      ];
    default:
      return [];
  }
}

export async function generateStaticParams() {
  return VEGAS_CASINOS_CONFIG.map((casino) => ({ slug: casino.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const casino = getVegasCasinoBySlug(slug);
  if (!casino) return {};

  return {
    title: `${casino.name} Casino Guide | Destination Command Center`,
    description: `${casino.name} in Las Vegas: nearby hotels, sportsbook and nightlife context, and helpful links into shows, hotels, and city planning.`,
    alternates: { canonical: `/casino/${casino.slug}` },
    openGraph: {
      title: `${casino.name} Casino Guide`,
      description: `${casino.name} in Las Vegas with nearby hotel context, shows, nightlife, and sportsbook-related planning.`,
      url: `https://destinationcommandcenter.com/casino/${casino.slug}`,
      type: "website",
    },
  };
}

function JsonLd({ slug }: { slug: string }) {
  const casino = getVegasCasinoBySlug(slug);
  if (!casino) return null;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "Casino"],
        "@id": `https://destinationcommandcenter.com/casino/${casino.slug}`,
        url: `https://destinationcommandcenter.com/casino/${casino.slug}`,
        name: casino.name,
        description: casino.summary,
        dateModified: "2026-03-12",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
          { "@type": "ListItem", position: 2, name: "Las Vegas", item: "https://destinationcommandcenter.com/vegas" },
          { "@type": "ListItem", position: 3, name: "Casinos", item: "https://destinationcommandcenter.com/las-vegas/casinos" },
          { "@type": "ListItem", position: 4, name: casino.name, item: `https://destinationcommandcenter.com/casino/${casino.slug}` },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function VegasCasinoNodePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const casino = getVegasCasinoBySlug(slug);
  if (!casino) notFound();
  const casinoSocialProfile = getEntityRegistryNode(slug, "casino")?.socialProfile;

  const relationshipLinks = getCasinoRelationshipLinks(casino.slug);
  const districtTarget = districtLink(casino.district);
  const siblingCasinos = VEGAS_CASINOS_CONFIG.filter(
    (candidate) =>
      candidate.slug !== casino.slug &&
      (candidate.district === casino.district || candidate.tags.some((tag) => casino.tags.includes(tag)))
  ).slice(0, 6);
  const actionBarActions: PageAction[] = [
    { href: buildMapsSearchUrl(`${casino.name}, Las Vegas`), label: "Open in Maps", kind: "external" },
    { href: buildOfficialSearchUrl(`${casino.name} Las Vegas`), label: "Find official site", kind: "external" },
    ...(casino.hotelSlug ? [{ href: `/hotel/${casino.hotelSlug}`, label: "Linked hotel", kind: "internal" as const }] : []),
    { href: "/las-vegas/shows", label: "Nearby shows", kind: "internal" },
    ...(relationshipLinks[0] ? [{ href: relationshipLinks[0].href, label: relationshipLinks[0].title, kind: "internal" as const }] : []),
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.14),_transparent_24%),radial-gradient(circle_at_88%_18%,_rgba(34,211,238,0.12),_transparent_18%),linear-gradient(180deg,_#111217_0%,_#090a0d_100%)] text-white">
      <JsonLd slug={slug} />
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Casino Guide</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{casino.name}</h1>
          <p className="max-w-3xl text-lg text-zinc-200">{casino.summary}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            {casino.district.replace("-", " ")} · Last updated: March 2026
          </p>
        </header>

        {casino.image ? (
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <img src={casino.image.src} alt={casino.image.alt} className="h-72 w-full object-cover" />
          </section>
        ) : null}

        <PageActionBar title={`Useful actions for ${casino.name}`} actions={actionBarActions} />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">District context</h2>
            <p className="mt-2 text-sm text-zinc-300">
              {casino.name} works best when you think in district terms first: where the casino sits, what it connects to, and what a night around it actually looks like.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Anchors</h2>
            <p className="mt-2 text-sm text-zinc-300">{casino.anchors.join(" · ")}</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Best fit</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Use this page when the buyer starts from gaming, sportsbook, nightlife, or a specific resort casino rather than from general hotel search.
              Use this page when the trip starts from a specific casino, sportsbook plan, or nightlife-heavy resort area.
            </p>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">Helpful tags</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {casino.tags.map((tag) => {
              const target = tagLink(tag);
              return (
                <Link
                  key={tag}
                  href={target.href}
                  className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-100 hover:bg-white/10"
                >
                  {formatTag(tag)}
                </Link>
              );
            })}
          </div>
        </section>

        {casinoSocialProfile ? <SocialProfileSection profile={casinoSocialProfile} /> : null}

        <section className="grid gap-4 md:grid-cols-2">
          <Link href="/las-vegas/casinos" className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Back to Las Vegas casinos</h2>
            <p className="mt-2 text-zinc-300">Return to the main casino guide and compare this property with Strip, Fremont, sportsbook, and nightlife-oriented picks.</p>
          </Link>
          <Link href={districtTarget.href} className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">{districtTarget.label}</h2>
            <p className="mt-2 text-zinc-300">Open the area guide if your choice depends more on location and nearby plans than the casino itself.</p>
          </Link>
          {casino.hotelSlug ? (
            <Link href={`/hotel/${casino.hotelSlug}`} className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
              <h2 className="text-xl font-bold">Linked hotel</h2>
              <p className="mt-2 text-zinc-300">Open the hotel page if the trip starts shifting from gaming into rooms, pools, dining, and overall stay quality.</p>
            </Link>
          ) : (
            <Link href="/vegas" className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
              <h2 className="text-xl font-bold">Back to Vegas guide</h2>
              <p className="mt-2 text-zinc-300">Return to the main city guide for shows, sports, attractions, and broader trip planning.</p>
            </Link>
          )}
          <Link href="/las-vegas/shows" className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Las Vegas shows</h2>
            <p className="mt-2 text-zinc-300">Open the shows guide if this casino choice is tied to residencies, magic, comedy, or theater plans.</p>
          </Link>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">Related places</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {casino.nearbyLinks.map((link) => (
              <Link
                key={`${casino.slug}-${link.href}`}
                href={link.href}
                className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-100 hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        {relationshipLinks.length ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <h2 className="text-2xl font-bold">Relationship pages from this casino</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {relationshipLinks.map((link) => (
                <Link key={`${casino.slug}-${link.href}`} href={link.href} className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-white/10">
                  <h3 className="text-lg font-semibold">{link.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{link.body}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">Related casinos</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {siblingCasinos.map((candidate) => (
              <Link key={candidate.slug} href={`/casino/${candidate.slug}`} className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
                <h3 className="font-semibold">{candidate.name}</h3>
                <p className="mt-2 text-sm text-zinc-300">{candidate.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
