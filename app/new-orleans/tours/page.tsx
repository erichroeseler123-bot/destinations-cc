import type { Metadata } from "next";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildSwampPlanHref } from "@/lib/dcc/warmTransfer";

const PAGE_PATH = "/new-orleans/tours";

export const metadata: Metadata = {
  title: "Welcome to New Orleans Tours | City, Swamp, Food, Music",
  description:
    "A photo-led New Orleans tour storefront for French Quarter days, swamp and bayou rides, food, music, ghost stories, river cruises, history, and rainy-day backups.",
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: "Welcome to New Orleans Tours",
    description:
      "Pick the right New Orleans tour vibe before opening a partner or fallback booking path.",
    url: PAGE_PATH,
    type: "website",
  },
};

const swampDecisionHref = buildSwampPlanHref({
  intent: "compare",
  topic: "swamp-tours",
  subtype: "comfort",
  context: "first-time",
  sourcePage: PAGE_PATH,
});

const swampPickupHref = buildSwampPlanHref({
  intent: "compare",
  topic: "swamp-tours",
  subtype: "pickup",
  context: "no-car",
  sourcePage: PAGE_PATH,
});

const airboatDecisionHref = buildSwampPlanHref({
  intent: "compare",
  topic: "swamp-tours",
  subtype: "airboat",
  context: "first-time",
  sourcePage: PAGE_PATH,
});

const images = {
  hero: {
    src: "/images/wno/storefront/hero-jackson-square.jpg",
    alt: "Sunset river view of Jackson Square and St. Louis Cathedral in New Orleans",
  },
  quarter: {
    src: "/images/wno/storefront/french-quarter-balcony.jpg",
    alt: "French Quarter wrought iron balconies with hanging greenery",
  },
  garden: {
    src: "/images/wno/storefront/garden-district-house.jpg",
    alt: "Victorian-style New Orleans house surrounded by greenery",
  },
  drinks: {
    src: "/images/wno/storefront/cocktails-table.jpg",
    alt: "Cocktails and small snacks on a table for a New Orleans food and drinks plan",
  },
  steamboat: {
    src: "/images/wno/storefront/steamboat-river.jpg",
    alt: "Red and white New Orleans steamboat on the river",
  },
  cemetery: {
    src: "/images/wno/storefront/cemetery-tombs.jpg",
    alt: "Historic New Orleans above-ground cemetery tombs under blue sky",
  },
  swamp: {
    src: "/images/wno/storefront/louisiana-swamp.jpg",
    alt: "Louisiana swamp water with cypress trees and Spanish moss",
  },
  oaks: {
    src: "/images/wno/storefront/oak-alley-history.jpg",
    alt: "Louisiana oak-lined pathway for a history day trip",
  },
  architecture: {
    src: "/images/wno/storefront/architecture-backup.jpg",
    alt: "Historic French Quarter architecture with ironwork and shutters",
  },
};

const cityTours = [
  {
    title: "French Quarter first",
    image: images.quarter,
    copy: "Balconies, courtyards, street texture, and the first layer of city context.",
    cta: { label: "Walk the Quarter", href: "/new-orleans/neighborhoods" },
  },
  {
    title: "Garden District slow burn",
    image: images.garden,
    copy: "Architecture, shade, houses, cemeteries, and a calmer visual reset.",
    cta: { label: "See neighborhoods", href: "/new-orleans/neighborhoods" },
  },
  {
    title: "Food and cocktail crawl",
    image: images.drinks,
    copy: "A low-stress city tour when the group wants taste, story, and air conditioning nearby.",
    cta: { label: "Open food guide", href: "/new-orleans/food" },
  },
  {
    title: "Music and night energy",
    image: images.architecture,
    copy: "Keep it close to the Quarter and Frenchmen Street when the night is the headline.",
    cta: { label: "Find the music lane", href: "/new-orleans/music" },
  },
  {
    title: "Riverfront rhythm",
    image: images.steamboat,
    copy: "A river cruise or riverfront walk gives the city a big, cinematic middle chapter.",
    cta: { label: "Browse river ideas", href: "#attractions" },
  },
  {
    title: "Ghosts, cemeteries, and old stories",
    image: images.cemetery,
    copy: "Night walks and cemetery context work best when timing, heat, and access rules are clear.",
    cta: { label: "Choose a story route", href: "#narrow" },
  },
];

const attractions = [
  {
    title: "Swamp / bayou",
    image: images.swamp,
    forWho: "First-timers, no-car groups, bachelor and family groups.",
    note: "Decide pickup and boat style before you open inventory.",
    href: swampDecisionHref,
    cta: "Go to swamp decision",
    mode: "partner_handoff",
  },
  {
    title: "Airboat energy",
    image: images.swamp,
    forWho: "Groups that want the ride to be part of the story.",
    note: "Not the best fit for every age, noise tolerance, or comfort need.",
    href: airboatDecisionHref,
    cta: "Compare airboats",
    mode: "partner_handoff",
  },
  {
    title: "National WWII Museum / indoor history day",
    image: images.architecture,
    forWho: "Rainy days, history people, families, and mixed groups.",
    note: "Use it as the anchor when storms make outdoor plans fragile.",
    href: "/tours?city=new-orleans&q=national%20wwii%20museum%20new%20orleans&source_section=wtono-attractions",
    cta: "See fallback options",
    mode: "affiliate_fallback",
  },
  {
    title: "Steamboat / river cruise",
    image: images.steamboat,
    forWho: "Couples, relaxed groups, first-timers, and sunset planners.",
    note: "Check meal, jazz, boarding, and weather details before committing.",
    href: "/tours?city=new-orleans&q=new%20orleans%20river%20cruise&source_section=wtono-attractions",
    cta: "Browse river cruises",
    mode: "affiliate_fallback",
  },
  {
    title: "Ghost / cemetery",
    image: images.cemetery,
    forWho: "Night groups, story people, and visitors who want atmosphere.",
    note: "Cemetery access, walking distance, heat, and time of day matter.",
    href: "/tours?city=new-orleans&q=new%20orleans%20ghost%20cemetery%20tour&source_section=wtono-attractions",
    cta: "Browse story walks",
    mode: "affiliate_fallback",
  },
  {
    title: "Plantation / history day trip",
    image: images.oaks,
    forWho: "Visitors with a full day and room for a drive outside the city.",
    note: "Confirm transportation, timing, interpretation, and weather exposure.",
    href: "/tours?city=new-orleans&q=louisiana%20plantation%20history%20day%20trip&source_section=wtono-attractions",
    cta: "See day trips",
    mode: "affiliate_fallback",
  },
];

const narrowing = [
  ["Classic first-timer", "Quarter walk + swamp pickup + food or music after dark."],
  ["Swamp / airboat", "Use Welcome to the Swamp to pick pickup, boat style, and comfort."],
  ["Food and drinks", "Stay city-first. Let the meal be the tour."],
  ["History / WWII Museum", "Best when heat, rain, or mixed interests make outdoor plans shaky."],
  ["Ghost / cemetery", "A night move with story, atmosphere, and walking-distance tradeoffs."],
  ["Music / nightlife", "Keep it flexible and close. Do not over-schedule the night."],
  ["Rainy-day backup", "Museum, food, covered city tour, or short Quarter route."],
  ["Family / mixed group", "Choose shade, bathrooms, travel time, and clear pickup over hype."],
];

const handoffs = [
  {
    title: "Welcome to the Swamp",
    reason: "The narrow surface for swamp pickup, boat style, and comfort decisions.",
    mode: "partner_handoff",
    href: swampPickupHref,
    cta: "Book swamp pickup",
  },
  {
    title: "Airboat comparison",
    reason: "Use only when the group actually wants louder, faster swamp energy.",
    mode: "partner_handoff",
    href: airboatDecisionHref,
    cta: "Compare airboats",
  },
  {
    title: "Food and cocktail options",
    reason: "Good fallback when the city day should stay walkable and low-transfer.",
    mode: "affiliate_fallback",
    href: "/tours?city=new-orleans&q=new%20orleans%20food%20cocktail%20tour&source_section=wtono-handoff",
    cta: "Browse food tours",
  },
  {
    title: "River cruise options",
    reason: "A relaxed visual route when a swamp ride is too much movement.",
    mode: "affiliate_fallback",
    href: "/tours?city=new-orleans&q=new%20orleans%20steamboat%20river%20cruise&source_section=wtono-handoff",
    cta: "Browse cruises",
  },
  {
    title: "Rainy-day history backup",
    reason: "Museum and indoor history options when storms break the outdoor plan.",
    mode: "affiliate_fallback",
    href: "/tours?city=new-orleans&q=new%20orleans%20museum%20history%20tour&source_section=wtono-handoff",
    cta: "Find backups",
  },
];

function PageJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Welcome to New Orleans Tours",
        url: "https://www.destinationcommandcenter.com/new-orleans/tours",
        description:
          "Photo-led New Orleans tour storefront that routes visitors to city tours, swamp decisions, attraction options, and honest provider handoffs.",
        isPartOf: {
          "@type": "WebSite",
          name: "Destination Command Center",
          url: "https://www.destinationcommandcenter.com",
        },
      }}
    />
  );
}

function PhotoCard({
  title,
  image,
  copy,
  cta,
}: {
  title: string;
  image: { src: string; alt: string };
  copy: string;
  cta: { label: string; href: string };
}) {
  return (
    <article className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/20">
      <div className="aspect-[4/5] overflow-hidden sm:aspect-[4/3]">
        <img
          src={image.src}
          alt={image.alt}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-5">
        <h3 className="text-2xl font-black leading-none text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-white/72">{copy}</p>
        <a className="mt-5 inline-flex text-sm font-black text-[#ffcf5a] hover:text-white" href={cta.href}>
          {cta.label}
        </a>
      </div>
    </article>
  );
}

export default function NewOrleansToursPage() {
  return (
    <>
      <PageJsonLd />
      <main className="bg-[#100d0c] text-white">
        <section className="relative min-h-[92vh] overflow-hidden">
          <img
            src={images.hero.src}
            alt={images.hero.alt}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,6,5,0.18),rgba(9,6,5,0.76)_54%,#100d0c_100%)]" />
          <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-4 pb-10 pt-28 sm:px-6 lg:pb-16">
            <div className="max-w-5xl">
              <p className="w-fit rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#ffcf5a] backdrop-blur">
                Welcome to New Orleans Tours
              </p>
              <h1 className="mt-5 max-w-5xl text-6xl font-black leading-[0.82] tracking-normal text-white sm:text-8xl lg:text-[9.5rem]">
                Find your New Orleans.
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/82 sm:text-2xl sm:leading-9">
                Start broad: Quarter, food, music, river, ghosts, swamp. Then narrow to the move that actually fits your group.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#narrow"
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#ffcf5a] px-7 text-sm font-black uppercase tracking-[0.14em] text-[#16100b] shadow-2xl shadow-black/30"
                >
                  Pick the right vibe
                </a>
                <a
                  href="#city"
                  className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 text-sm font-black uppercase tracking-[0.14em] text-white backdrop-blur"
                >
                  Browse by vibe
                </a>
              </div>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {["Broad city storefront", "Swamp stays separate", "Provider modes labeled"].map((chip) => (
                <div key={chip} className="rounded-2xl border border-white/12 bg-black/28 p-4 text-sm font-bold text-white/78 backdrop-blur">
                  {chip}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="city" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ffcf5a]">About the city</p>
            <h2 className="mt-4 text-4xl font-black leading-[0.92] sm:text-6xl">
              The city is the first tour.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/70 sm:text-lg">
              New Orleans is not one inventory list. It is a set of moods: old balconies, river air, food, brass, ghost stories, heat, rain, and nights that should not feel over-planned.
            </p>
          </div>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cityTours.map((item) => (
              <PhotoCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <section id="attractions" className="bg-[#f3e7cf] text-[#1b130f]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8d2b1f]">Attractions</p>
              <h2 className="mt-4 text-4xl font-black leading-[0.92] sm:text-6xl">
                Attractions are different from city tours.
              </h2>
              <p className="mt-5 text-base font-semibold leading-8 text-[#60473d] sm:text-lg">
                These are the bigger anchors. They need pickup, timing, weather, access, or provider-mode clarity before somebody clicks out.
              </p>
            </div>
            <div className="mt-9 grid gap-5 lg:grid-cols-3">
              {attractions.map((item) => (
                <article key={item.title} className="overflow-hidden rounded-[1.35rem] border border-black/10 bg-white shadow-xl shadow-black/10">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={item.image.src} alt={item.image.alt} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#1b130f] px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white">
                        {item.mode}
                      </span>
                    </div>
                    <h3 className="mt-4 text-2xl font-black leading-none">{item.title}</h3>
                    <p className="mt-3 text-sm font-bold leading-6 text-[#60473d]">For: {item.forWho}</p>
                    <p className="mt-3 text-sm leading-6 text-[#60473d]">Practical note: {item.note}</p>
                    <a href={item.href} className="mt-5 inline-flex text-sm font-black text-[#8d2b1f] hover:text-black">
                      {item.cta}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="narrow" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ffcf5a]">Narrow without killing the mood</p>
              <h2 className="mt-4 text-4xl font-black leading-[0.92] sm:text-6xl">
                Eight lanes. No junk drawer.
              </h2>
              <p className="mt-5 text-base leading-8 text-white/70">
                The storefront stays broad at the top, then turns into a practical chooser. Pick the lane that matches the group, weather, and amount of transfer pain you can tolerate.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {narrowing.map(([title, body]) => (
                <article key={title} className="rounded-2xl border border-white/12 bg-white/[0.06] p-5">
                  <h3 className="text-xl font-black leading-tight">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/68">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#19110f]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ffcf5a]">Curated handoff</p>
              <h2 className="mt-4 text-4xl font-black leading-[0.92] sm:text-6xl">
                Only the exits that earn the click.
              </h2>
            </div>
            <div className="mt-9 grid gap-4 lg:grid-cols-5">
              {handoffs.map((item) => (
                <article key={item.title} className="flex min-h-[260px] flex-col rounded-3xl border border-white/12 bg-white/[0.07] p-5">
                  <span className="w-fit rounded-full bg-[#ffcf5a] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#1b130f]">
                    {item.mode}
                  </span>
                  <h3 className="mt-4 text-2xl font-black leading-none">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/68">{item.reason}</p>
                  <a href={item.href} className="mt-auto pt-5 text-sm font-black text-[#ffcf5a] hover:text-white">
                    {item.cta}
                  </a>
                </article>
              ))}
            </div>
            <p className="mt-8 max-w-3xl text-xs leading-6 text-white/52">
              Some photography provided via Pexels. Images are used as editorial storefront context and are not sold as standalone assets. Provider-mode labels distinguish partner handoffs from fallback marketplace inventory.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
