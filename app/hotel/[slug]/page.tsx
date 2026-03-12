import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AuthorityMediaStrip from "@/app/components/dcc/AuthorityMediaStrip";
import PageActionBar from "@/app/components/dcc/PageActionBar";
import { getCityRegistryNode } from "@/src/data/cities-registry";
import {
  getEntityRegistryNode,
  getEntityRegistryNodesByCityAndType,
} from "@/src/data/entities-registry";
import { getVegasHotelBySlug, VEGAS_HOTELS_CONFIG, type VegasHotelTag } from "@/src/data/vegas-hotels-config";
import { buildMapsSearchUrl, buildOfficialSearchUrl, type PageAction } from "@/src/lib/page-actions";

type Params = { slug: string };

function formatTag(tag: VegasHotelTag) {
  return tag
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function tagLink(tag: VegasHotelTag) {
  switch (tag) {
    case "pet-friendly":
      return { href: "/pet-friendly/las-vegas", label: "Pet-friendly Las Vegas" };
    case "kid-friendly":
      return { href: "/kid-friendly/las-vegas", label: "Kid-friendly Las Vegas" };
    case "strip":
      return { href: "/las-vegas-strip", label: "Las Vegas Strip" };
    case "downtown":
      return { href: "/vegas#fremont", label: "Downtown and Fremont" };
    default:
      return { href: "/las-vegas/hotels", label: "Las Vegas hotels" };
  }
}

function getHotelRelationshipLinks(slug: string) {
  switch (slug) {
    case "bellagio":
      return [
        {
          href: "/attractions-near/bellagio",
          title: "Attractions near Bellagio",
          body: "Use the Bellagio relationship page when the trip starts from the hotel and branches into fountains, nearby attractions, and walkable Strip planning.",
        },
        {
          href: "/casinos-near/bellagio",
          title: "Casinos near Bellagio",
          body: "Compare nearby casino options when Bellagio is the anchor but the gaming decision is still open.",
        },
      ];
    case "wynn":
      return [
        {
          href: "/hotels-near/wynn-casino",
          title: "Hotels near Wynn Casino",
          body: "See nearby hotel alternatives when the north Strip, nightlife, and Wynn-adjacent luxury zone are more important than one specific property.",
        },
      ];
    case "caesars-palace":
      return [
        {
          href: "/accessible-hotels-near/caesars-palace-casino",
          title: "Accessible hotels near Caesars Palace Casino",
          body: "Compare easier-access nearby stays when central Strip positioning matters but you do not want the whole trip riding on one giant casino property.",
        },
        {
          href: "/hotels-near/caesars-palace-casino",
          title: "Hotels near Caesars Palace Casino",
          body: "Compare nearby mid-Strip hotel options when Caesars is the anchor but the stay decision is still flexible.",
        },
        {
          href: "/attractions-near/caesars-palace-casino",
          title: "Attractions near Caesars Palace Casino",
          body: "Jump into nearby attraction planning when the trip starts from Caesars and expands into the surrounding Strip cluster.",
        },
      ];
    default:
      return [];
  }
}

export async function generateStaticParams() {
  const registryHotelSlugs = getEntityRegistryNodesByCityAndType("miami", "hotel")
    .concat(getEntityRegistryNodesByCityAndType("orlando", "hotel"))
    .map((hotel) => ({ slug: hotel.slug }));
  return [...VEGAS_HOTELS_CONFIG.map((hotel) => ({ slug: hotel.slug })), ...registryHotelSlugs];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const hotel = getVegasHotelBySlug(slug);
  if (!hotel) {
    const genericHotel = getEntityRegistryNode(slug, "hotel");
    const city = genericHotel ? getCityRegistryNode(genericHotel.citySlug) : null;
    if (!genericHotel || !city) return {};

    return {
      title: `${genericHotel.title} Hotel Guide | Destination Command Center`,
      description: `${genericHotel.title} in ${city.name}: trip fit, area context, tags, and DCC routing into nearby planning layers.`,
      alternates: { canonical: `/hotel/${genericHotel.slug}` },
      openGraph: {
        title: `${genericHotel.title} Hotel Guide`,
        description: `${genericHotel.title} in ${city.name} with DCC routing across nearby planning layers and category hubs.`,
        url: `https://destinationcommandcenter.com/hotel/${genericHotel.slug}`,
        type: "website",
      },
    };
  }

  return {
    title: `${hotel.name} Hotel Guide | Destination Command Center`,
    description: `${hotel.name} in Las Vegas: area, trip fit, tags, nearby hooks, and DCC routing into shows, Strip planning, and overlay pages.`,
    alternates: { canonical: `/hotel/${hotel.slug}` },
    openGraph: {
      title: `${hotel.name} Hotel Guide`,
      description: `${hotel.name} in Las Vegas with DCC routing across hotels, overlays, nearby hooks, and city planning.`,
      url: `https://destinationcommandcenter.com/hotel/${hotel.slug}`,
      type: "website",
    },
  };
}

function JsonLd({ slug }: { slug: string }) {
  const hotel = getVegasHotelBySlug(slug);
  if (!hotel) {
    const genericHotel = getEntityRegistryNode(slug, "hotel");
    const city = genericHotel ? getCityRegistryNode(genericHotel.citySlug) : null;
    if (!genericHotel || !city) return null;

    const data = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["WebPage", "LodgingBusiness"],
          "@id": `https://destinationcommandcenter.com/hotel/${genericHotel.slug}`,
          url: `https://destinationcommandcenter.com/hotel/${genericHotel.slug}`,
          name: genericHotel.title,
          description: genericHotel.summary,
          dateModified: "2026-03-12",
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
            { "@type": "ListItem", position: 2, name: city.name, item: `https://destinationcommandcenter.com${city.canonicalPath}` },
            { "@type": "ListItem", position: 3, name: "Hotels", item: `https://destinationcommandcenter.com${city.canonicalPath}` },
            { "@type": "ListItem", position: 4, name: genericHotel.title, item: `https://destinationcommandcenter.com/hotel/${genericHotel.slug}` },
          ],
        },
      ],
    };

    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
  }

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "LodgingBusiness"],
        "@id": `https://destinationcommandcenter.com/hotel/${hotel.slug}`,
        url: `https://destinationcommandcenter.com/hotel/${hotel.slug}`,
        name: hotel.name,
        description: hotel.summary,
        dateModified: "2026-03-12",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
          { "@type": "ListItem", position: 2, name: "Las Vegas", item: "https://destinationcommandcenter.com/vegas" },
          { "@type": "ListItem", position: 3, name: "Hotels", item: "https://destinationcommandcenter.com/las-vegas/hotels" },
          { "@type": "ListItem", position: 4, name: hotel.name, item: `https://destinationcommandcenter.com/hotel/${hotel.slug}` },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function VegasHotelNodePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const hotel = getVegasHotelBySlug(slug);
  if (!hotel) {
    const genericHotel = getEntityRegistryNode(slug, "hotel");
    const city = genericHotel ? getCityRegistryNode(genericHotel.citySlug) : null;
    if (!genericHotel || !city) notFound();

    const siblingHotels = getEntityRegistryNodesByCityAndType(genericHotel.citySlug, "hotel")
      .filter((candidate) => candidate.slug !== genericHotel.slug)
      .slice(0, 6);
    const actionBarActions: PageAction[] = [
      { href: buildMapsSearchUrl(`${genericHotel.title}, ${city.name}`), label: "Open in Maps", kind: "external" },
      { href: buildOfficialSearchUrl(`${genericHotel.title} ${city.name}`), label: "Find official site", kind: "external" },
      { href: city.canonicalPath, label: `${city.name} hub`, kind: "internal" },
    ];

    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.16),_transparent_28%),radial-gradient(circle_at_85%_20%,_rgba(34,211,238,0.12),_transparent_22%),linear-gradient(180deg,_#111217_0%,_#0a0b0e_100%)] text-white">
        <JsonLd slug={slug} />
        <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
          <header className="space-y-5">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Hotel Node</p>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">{genericHotel.title}</h1>
            <p className="max-w-3xl text-lg text-zinc-200">{genericHotel.summary}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              {city.name} · {genericHotel.tags.slice(0, 3).map((tag) => tag.replace(/-/g, " ")).join(" · ")} · Last updated: March 2026
            </p>
          </header>

          {genericHotel.imageSet?.hero && genericHotel.imageSet.gallery?.length ? (
            <AuthorityMediaStrip hero={genericHotel.imageSet.hero} gallery={genericHotel.imageSet.gallery} />
          ) : null}

          <PageActionBar title={`Useful actions for ${genericHotel.title}`} actions={actionBarActions} />

          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
              <h2 className="text-lg font-semibold">Who it fits</h2>
              <p className="mt-2 text-sm text-zinc-300">
                {genericHotel.title} works best for travelers who want a {city.name} base aligned with {genericHotel.tags
                  .slice(0, 2)
                  .map((tag) => tag.replace(/-/g, " "))
                  .join(" and ")} routing.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
              <h2 className="text-lg font-semibold">Key tags</h2>
              <p className="mt-2 text-sm text-zinc-300">{genericHotel.tags.map((tag) => tag.replace(/-/g, " ")).join(" · ")}</p>
            </article>
            <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
              <h2 className="text-lg font-semibold">Use it for</h2>
              <p className="mt-2 text-sm text-zinc-300">
                Use this hotel node when the stay decision is the anchor and the rest of the city plan should branch outward from the property.
              </p>
            </article>
          </section>

          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <h2 className="text-2xl font-bold">Tags and overlays</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {genericHotel.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-100">
                  {tag.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Link href={city.canonicalPath} className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
              <h2 className="text-xl font-bold">Back to {city.name}</h2>
              <p className="mt-2 text-zinc-300">Return to the city hub when the trip decision expands beyond one hotel and one stay style.</p>
            </Link>
            <Link href={city.canonicalPath} className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
              <h2 className="text-xl font-bold">More {city.name} planning</h2>
              <p className="mt-2 text-zinc-300">Use the main city authority page for beaches, attractions, tours, shows, and broader neighborhood routing.</p>
            </Link>
          </section>

          {siblingHotels.length ? (
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
              <h2 className="text-2xl font-bold">Related hotel nodes</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {siblingHotels.map((candidate) => (
                  <Link key={candidate.slug} href={candidate.canonicalPath} className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
                    <h3 className="font-semibold">{candidate.title}</h3>
                    <p className="mt-2 text-sm text-zinc-300">{candidate.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    );
  }

  const relationshipLinks = getHotelRelationshipLinks(hotel.slug);
  const siblingHotels = VEGAS_HOTELS_CONFIG.filter(
    (candidate) => candidate.slug !== hotel.slug && (candidate.area === hotel.area || candidate.tags.some((tag) => hotel.tags.includes(tag)))
  ).slice(0, 6);
  const actionBarActions: PageAction[] = [
    { href: buildMapsSearchUrl(`${hotel.name}, Las Vegas`), label: "Open in Maps", kind: "external" },
    { href: buildOfficialSearchUrl(`${hotel.name} Las Vegas`), label: "Find official site", kind: "external" },
    { href: "/las-vegas/shows", label: "Nearby shows", kind: "internal" },
    ...(relationshipLinks[0] ? [{ href: relationshipLinks[0].href, label: relationshipLinks[0].title, kind: "internal" as const }] : []),
    { href: "/las-vegas/hotels", label: "Compare nearby hotels", kind: "internal" },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.16),_transparent_28%),radial-gradient(circle_at_85%_20%,_rgba(34,211,238,0.12),_transparent_22%),linear-gradient(180deg,_#111217_0%,_#0a0b0e_100%)] text-white">
      <JsonLd slug={slug} />
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="space-y-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Hotel Node</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{hotel.name}</h1>
          <p className="max-w-3xl text-lg text-zinc-200">{hotel.summary}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            {hotel.area.replace("-", " ")} · {hotel.tier.replace("-", " ")} · Last updated: March 2026
          </p>
        </header>

        {hotel.heroImage && hotel.gallery?.length ? (
          <AuthorityMediaStrip hero={hotel.heroImage} gallery={hotel.gallery} />
        ) : null}

        <PageActionBar title={`Useful actions for ${hotel.name}`} actions={actionBarActions} />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Who it fits</h2>
            <p className="mt-2 text-sm text-zinc-300">
              {hotel.name} works best for travelers who want a {hotel.area.replace("-", " ")} base and then branch into shows, restaurants, and nearby planning from the room outward.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">What it connects to</h2>
            <p className="mt-2 text-sm text-zinc-300">{hotel.nearbyHooks.join(" · ")}</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Known for</h2>
            <p className="mt-2 text-sm text-zinc-300">{hotel.famousFor.join(" · ")}</p>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">Tags and overlays</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {hotel.tags.map((tag) => {
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

        {hotel.premiumStayInfo?.suiteTypes?.length ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <h2 className="text-2xl font-bold">Suites and premium rooms</h2>
            <p className="mt-2 max-w-3xl text-zinc-300">
              Use this section as a planning guide for premium room categories, not a live inventory claim. Check the official hotel site for current availability and exact room names.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {hotel.premiumStayInfo.suiteTypes.map((type) => (
                <span key={`${hotel.slug}-${type}`} className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-100">
                  {type.replace(/-/g, " ")}
                </span>
              ))}
              {hotel.premiumStayInfo.multiBedroom ? <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-100">multi bedroom options</span> : null}
              {hotel.premiumStayInfo.stripView ? <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-100">strip view potential</span> : null}
              {hotel.premiumStayInfo.eventFriendly ? <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-100">group celebration fit</span> : null}
              {hotel.premiumStayInfo.butlerService ? <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-100">higher-touch service</span> : null}
            </div>
            {hotel.premiumStayInfo.notes ? <p className="mt-4 text-sm text-zinc-300">{hotel.premiumStayInfo.notes}</p> : null}
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Link href="/suites/las-vegas" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
                Compare Vegas suites
              </Link>
              <Link href="/penthouses/las-vegas" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
                Explore penthouse-style stays
              </Link>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          <Link href="/las-vegas/hotels" className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Back to Las Vegas hotels</h2>
            <p className="mt-2 text-zinc-300">Return to the hotel mesh hub and compare this property against Strip, downtown, luxury, and family overlays.</p>
          </Link>
          <Link href="/vegas" className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Back to Vegas hub</h2>
            <p className="mt-2 text-zinc-300">Return to the main city authority page for shows, sports, attractions, and day-trip routing.</p>
          </Link>
          <Link href="/las-vegas-strip" className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Las Vegas Strip pillar</h2>
            <p className="mt-2 text-zinc-300">Use the Strip authority page when the hotel choice is really a corridor and routing question.</p>
          </Link>
          <Link href="/las-vegas/shows" className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Las Vegas shows</h2>
            <p className="mt-2 text-zinc-300">Jump into the live-performance lane for residencies, comedy, magic, and other show-night planning.</p>
          </Link>
        </section>

        {relationshipLinks.length ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <h2 className="text-2xl font-bold">Relationship pages from this hotel</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {relationshipLinks.map((link) => (
                <Link key={`${hotel.slug}-${link.href}`} href={link.href} className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-white/10">
                  <h3 className="text-lg font-semibold">{link.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{link.body}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">Related hotel nodes</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {siblingHotels.map((candidate) => (
              <Link key={candidate.slug} href={`/hotel/${candidate.slug}`} className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
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
