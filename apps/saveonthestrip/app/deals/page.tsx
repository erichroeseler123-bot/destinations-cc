import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HelpRequestForm } from "@/app/components/HelpRequestForm";
import { getVegasPhotoLibrary } from "@/lib/vegasPhotos";

const DEAL_GROUPS = [
  {
    eyebrow: "Book direct",
    title: "Official resort offer pages",
    description:
      "Direct booking can beat OTAs when the property bundles dining credit, parking, or fee relief.",
    items: [
      {
        name: "Caesars Entertainment Offers",
        href: "https://www.caesars.com/deals",
        note: "Covers Caesars, Flamingo, LINQ, Harrah’s, Paris, and more.",
      },
      {
        name: "MGM Resorts Offers",
        href: "https://www.mgmresorts.com/en/offers.html",
        note: "Bellagio, MGM Grand, Luxor, Mandalay Bay, Aria, and the rest of the MGM lane.",
      },
      {
        name: "Treasure Island Deals",
        href: "https://treasureisland.com/offers",
        note: "Worth checking for room promos and easier parking/value plays.",
      },
      {
        name: "SAHARA Las Vegas Promos",
        href: "https://www.saharalasvegas.com/offers",
        note: "Often one of the better places to check for fee-light packages.",
      },
      {
        name: "The Venetian Offers",
        href: "https://www.venetianlasvegas.com/offers.html",
        note: "Good direct-book lane for dining-credit and premium-room bundles.",
      },
      {
        name: "Resorts World Specials",
        href: "https://www.rwlasvegas.com/offers/",
        note: "High-end rooms sometimes soften with credits or bundled extras.",
      },
      {
        name: "Station Casinos Offers",
        href: "https://www.stationcasinos.com/offers/",
        note: "Useful off-Strip value lane for locals-style stays.",
      },
    ],
  },
  {
    eyebrow: "Food and cheap thrills",
    title: "Food, vouchers, and weird Vegas value",
    description:
      "Use this bucket for dining vouchers, lower-cost activities, and solid cheap-eat research.",
    items: [
      {
        name: "Travelzoo Las Vegas",
        href: "https://www.travelzoo.com/local-deals/las-vegas/",
        note: "Good for dining vouchers and higher-end experiences at a discount.",
      },
      {
        name: "Groupon Las Vegas",
        href: "https://www.groupon.com/local/las-vegas",
        note: "Best for cheap thrills, unusual attractions, and lower-cost activity experiments.",
      },
      {
        name: "Fremont Street Experience Deals",
        href: "https://vegasexperience.com/",
        note: "Start here for downtown-friendly offers and old Vegas coupon-style value.",
      },
      {
        name: "Eater Vegas",
        href: "https://vegas.eater.com/",
        note: "Not a coupon site, but one of the best ways to find cheap meals that are actually worth it.",
      },
    ],
  },
  {
    eyebrow: "Travel bundles",
    title: "Flight and hotel bundle lanes",
    description:
      "If you are still booking the trip itself, package channels can sometimes beat piecing everything together separately.",
    items: [
      {
        name: "Southwest Vacations",
        href: "https://www.southwestvacations.com/",
        note: "Often worth checking first if Southwest flights are already in play.",
      },
      {
        name: "Costco Travel Las Vegas",
        href: "https://www.costcotravel.com/",
        note: "Strong when the extra perks matter as much as the room rate.",
      },
      {
        name: "Apple Vacations Las Vegas",
        href: "https://www.applevacations.com/",
        note: "Can be worth a look for last-minute package pricing.",
      },
    ],
  },
  {
    eyebrow: "Insider tools",
    title: "Local-ish Vegas savings tools",
    description:
      "These are the more niche sources people use when they care about offers, comps, codes, and grinder-style value.",
    items: [
      {
        name: "Las Vegas Advisor",
        href: "https://www.lasvegasadvisor.com/",
        note: "A longtime Vegas deal and comp source with both free and paid value.",
      },
      {
        name: "Plug In Vegas",
        href: "https://www.pluginvegas.com/",
        note: "Sometimes useful for promo code digging and local-style offers.",
      },
      {
        name: "myVEGAS Slots",
        href: "https://www.myvegas.com/",
        note: "Game-based loyalty lane for people willing to trade time for perks and freebies.",
      },
    ],
  },
] as const;

export const metadata: Metadata = {
  title: "Vegas Deals | Save On The Strip",
  description:
    "A curated Vegas deals hub for show discounts, hotel offer pages, cheap eats, travel bundles, and insider tools.",
  alternates: {
    canonical: "https://saveonthestrip.com/deals",
  },
  openGraph: {
    title: "Vegas Deals | Save On The Strip",
    description:
      "Find the best Vegas hotel deal lanes, cheap-thrill savings, bundle checks, and insider tools without opening twenty tabs.",
    url: "https://saveonthestrip.com/deals",
    type: "website",
    images: [
      {
        url: "https://saveonthestrip.com/SOTS_HEADER_ENHANCED.jpg",
        alt: "Las Vegas at night",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vegas Deals | Save On The Strip",
    description:
      "Best Vegas hotel deal lanes, food-and-value picks, bundle checks, and insider tools in one fast page.",
    images: ["https://saveonthestrip.com/SOTS_HEADER_ENHANCED.jpg"],
  },
};

export default async function DealsPage({
  searchParams,
}: {
  searchParams?: Promise<{ sent?: string; error?: string }>;
}) {
  const sp = (await searchParams) || {};
  const photos = await getVegasPhotoLibrary();
  const dealLanes = [
    {
      eyebrow: "Hotel deals",
      title: "Best Vegas hotel deal lanes",
      description: "Start with direct offer pages when credits, fee relief, or premium-room bundles matter more than random OTA pricing.",
      bullets: ["MGM and Caesars first", "Venetian and Resorts World for premium bundles", "Station Casinos for off-Strip value"],
      href: "#official-resort-offer-pages",
      cta: "Open hotel deal lanes",
      image: photos.luxuryHotel.src,
      imageAlt: photos.luxuryHotel.alt,
    },
    {
      eyebrow: "Fast savings",
      title: "Cheap thrills and food vouchers",
      description: "Use this lane when the goal is saving real cash on dining, oddball attractions, and lower-cost Vegas fillers.",
      bullets: ["Travelzoo for stronger dining wins", "Groupon for experiments and lower-cost attractions", "Eater for cheap meals that are still worth it"],
      href: "#food-vouchers-and-weird-vegas-value",
      cta: "Open food and value picks",
      image: photos.fremont.src,
      imageAlt: photos.fremont.alt,
    },
    {
      eyebrow: "Trip bundles",
      title: "Flight and hotel package checks",
      description: "Check packages only when you are still building the whole trip and want one cleaner price instead of piecing together everything yourself.",
      bullets: ["Southwest first if flights are already in play", "Costco when perks matter as much as price", "Apple for last-minute package checks"],
      href: "#flight-and-hotel-bundle-lanes",
      cta: "Open bundle lanes",
      image: photos.sphere.src,
      imageAlt: photos.sphere.alt,
    },
    {
      eyebrow: "Insider tools",
      title: "Grinder-style Vegas savings",
      description: "This is the niche lane for comps, codes, and loyalty-style value when you are willing to do a little more work for better savings.",
      bullets: ["Las Vegas Advisor for long-running value intel", "Plug In Vegas for promo-code digging", "myVEGAS if you trade time for freebies"],
      href: "#local-ish-vegas-savings-tools",
      cta: "Open insider tools",
      image: photos.area15.src,
      imageAlt: photos.area15.alt,
    },
  ] as const;
  const quickStartLanes = [
    {
      title: "Check hotel offers first",
      copy: "Start with direct resort offer pages when the room still matters more than anything else on the trip.",
      href: "#official-resort-offer-pages",
      cta: "Open hotel lanes",
    },
    {
      title: "Save on filler",
      copy: "Use food vouchers and cheap-thrill lanes when the goal is lowering spend between bigger Vegas nights.",
      href: "#food-vouchers-and-weird-vegas-value",
      cta: "Open cheap wins",
    },
    {
      title: "Only bundle when it helps",
      copy: "Package channels matter when flights and hotel are both still open questions, not after the trip is already mostly booked.",
      href: "#flight-and-hotel-bundle-lanes",
      cta: "Open bundle checks",
    },
  ] as const;

  const dealVisuals = [
    {
      title: "Hotel offers first",
      copy: "Start with direct resort pages before you trust random coupon noise.",
      href: "#official-resort-offer-pages",
      image: photos.luxuryHotel.src,
      alt: photos.luxuryHotel.alt,
    },
    {
      title: "Cheap thrills",
      copy: "Use Fremont, food vouchers, and lower-cost fillers to save without killing the trip.",
      href: "#food-vouchers-and-weird-vegas-value",
      image: photos.fremont.src,
      alt: photos.fremont.alt,
    },
    {
      title: "Bundle check",
      copy: "Packages matter when you are still building the whole trip, not just one night.",
      href: "#flight-and-hotel-bundle-lanes",
      image: photos.sphere.src,
      alt: photos.sphere.alt,
    },
    {
      title: "Insider tools",
      copy: "Comps, codes, and loyalty moves only make sense if you use the right lane.",
      href: "#local-ish-vegas-savings-tools",
      image: photos.area15.src,
      alt: photos.area15.alt,
    },
  ] as const;

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <section className="panel panel-tight quick-start-panel">
        <div className="eyebrow">Use this page right</div>
        <div style={{ height: 10 }} />
        <h2 className="detail-title">Use deals to protect the trip, not cheapen it.</h2>
        <p className="lead quick-start-lead">
          The best Vegas savings usually come from the right lane, not the most tabs. Start with hotel offers, cheap fillers, or bundle checks based on what is still unsolved.
        </p>
        <div className="quick-start-grid">
          {quickStartLanes.map((lane) => (
            <a href={lane.href} key={lane.title} className="quick-start-card">
              <div className="eyebrow">{lane.title}</div>
              <h3>{lane.title}</h3>
              <p>{lane.copy}</p>
              <span className="quick-start-cta">{lane.cta}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="eyebrow">Vegas deals</div>
        <div style={{ height: 10 }} />
        <h1 className="detail-title">Where to find real Las Vegas deals without digging forever</h1>
        <p className="lead">
          This page is the savings hub: show-ticket deal sites, official hotel offer pages, cheap
          food/value lanes, package tools, and a few insider resources that are actually worth
          checking.
        </p>
        <div style={{ height: 18 }} />
        <div className="cta-row">
          <a href="#best-vegas-deal-lanes-right-now" className="button button-primary">
            Start with the best lanes
          </a>
          <Link href="/hotels" className="button button-secondary">
            Check hotel guides
          </Link>
          <Link href="/shows" className="button button-secondary">
            Pair with a show night
          </Link>
        </div>
        <div style={{ height: 14 }} />
        <div className="filter-pills">
          <div className="pill">Hotel bundles</div>
          <div className="pill">Dining credits</div>
          <div className="pill">Cheap thrills</div>
          <div className="pill">Package checks</div>
          <div className="pill">Comp tools</div>
        </div>
      </section>

      <section className="panel">
        <div className="eyebrow">See the savings lanes fast</div>
        <div style={{ height: 10 }} />
        <h2>Vegas deal visuals that match the main money moves</h2>
        <div style={{ height: 18 }} />
        <div className="grid">
          {dealVisuals.map((item) => (
            <a href={item.href} className="card media-card" key={item.title}>
              <div className="media-frame">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="media-image"
                />
              </div>
              <div className="media-copy">
                <div className="eyebrow">Quick visual</div>
                <h2>{item.title}</h2>
                <p>{item.copy}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="panel" id="best-vegas-deal-lanes-right-now">
        <div className="eyebrow">Best Vegas deal lanes</div>
        <div style={{ height: 10 }} />
        <h2 className="detail-title">BEST VEGAS DEAL LANES RIGHT NOW</h2>
        <div style={{ height: 18 }} />
        <div className="feature-grid">
          {dealLanes.map((lane) => (
            <article className="card category-card" key={lane.title}>
              <div className="inline-media-frame category-card-image">
                <Image
                  src={lane.image}
                  alt={lane.imageAlt}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="media-image"
                />
              </div>
              <div className="eyebrow">{lane.eyebrow}</div>
              <h2>{lane.title.toUpperCase()}</h2>
              <p>{lane.description}</p>
              <ul className="quick-picks">
                {lane.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <a href={lane.href} className="button button-primary">
                {lane.cta}
              </a>
            </article>
          ))}
        </div>
      </section>

      {DEAL_GROUPS.map((group) => (
        <section
          className="panel"
          key={group.title}
          id={group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}
        >
          <div className="eyebrow">{group.eyebrow}</div>
          <div style={{ height: 10 }} />
          <h2>{group.title}</h2>
          <p>{group.description}</p>
          <div style={{ height: 18 }} />
          <div className="grid">
            {group.items.map((item) => (
              <article className="card" key={item.name}>
                <div className="eyebrow">Deal source</div>
                <h2 style={{ marginTop: 10 }}>{item.name}</h2>
                <p>{item.note}</p>
                <div style={{ height: 12 }} />
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-secondary"
                >
                  Open site
                </a>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="grid">
        <article className="card">
          <div className="eyebrow">Need help fast?</div>
          <h2>Ask about free ticket pickup or better-value options</h2>
          <p>
            If you want a faster answer instead of checking ten tabs yourself, use the form below
            and say what kind of Vegas deal you are trying to find.
          </p>
        </article>
        <article className="card">
          <div className="eyebrow">Related pages</div>
          <div className="footer-links">
            <Link href="/hotels">Vegas hotel guides</Link>
            <Link href="/hotels/rio-las-vegas-renovation-update">Rio renovation guide</Link>
            <Link href="/shows/sphere">Sphere guide</Link>
            <Link href="/shows">All Vegas shows</Link>
            <Link href="/tours">Vegas tours</Link>
            <Link href="/timeshares">Vegas timeshares</Link>
          </div>
        </article>
      </section>

      <HelpRequestForm sourcePath="/deals" sent={sp.sent === "1"} error={sp.error === "contact"} />
    </main>
  );
}
