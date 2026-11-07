import type { Metadata } from "next";
import CategoryDecisionEngineExperience from "@/app/components/dcc/CategoryDecisionEngineExperience";
import JsonLd from "@/app/components/dcc/JsonLd";
import { NOLA_CITY_TOURS_DECISION_ENGINE } from "@/lib/dcc/decisionEngines/newOrleansCityToursEngine";
import type { DecisionResult } from "@/lib/dcc/decisionEngines/types";
import ProductCard from "../components/ProductCard";
import CinematicPageHero from "../components/CinematicPageHero";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import {
  buildWnoBreadcrumbJsonLd,
  buildWnoWebPageJsonLd,
} from "../lib/structuredData";
import { NEW_ORLEANS_TOURS_PATH, METADATA, STOREFRONT_PRODUCTS } from "./pageConfig";
import DailyBriefSignup from "../components/DailyBriefSignup";
import { headers } from "next/headers";
import { generateCategorySchemaGraph } from "../lib/schema";
import { isHeldProduct } from "../data/truthPolicy";
import { FAREHARBOR_SOURCES } from "../lib/fareHarborAttribution";
import DccConciergeWidget from "@/app/components/dcc/DccConciergeWidget";

const BOOKABLE_PRODUCT_COUNT = STOREFRONT_PRODUCTS.filter((product) => !isHeldProduct(product.slug)).length;
const CURRENT_TOURS_DESCRIPTION =
  `Compare ${BOOKABLE_PRODUCT_COUNT} bookable New Orleans tours across river cruises, city tours, swamps, airboats, plantation history, walking tours, and full-day combinations. Check live dates and prices without leaving WNO.`;
const DCC_AUTHORITY_TOURS_DESCRIPTION =
  `DCC New Orleans Tours & Swamp Decision Authority: verify hotel pickup vs. self-drive dock rules, covered pontoon (all ages) vs. airboat (age 5+) limits, 2026–2028 NPS Barataria closures, and plantation context before moving to Welcome to New Orleans Tours.`;

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const hostHeader = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const origin = isWto ? "https://www.welcometoneworleanstours.com" : "https://destinationcommandcenter.com";
  const canonical = isWto ? "/tours" : NEW_ORLEANS_TOURS_PATH;
  const siteName = isWto ? "Welcome to New Orleans Tours" : "Destination Command Center";
  const pageTitle = isWto
    ? METADATA.title
    : "New Orleans Tours & Swamp Decision Authority | Verified Pickup, Age Rules & Evidence | DCC";
  const pageDescription = isWto ? CURRENT_TOURS_DESCRIPTION : DCC_AUTHORITY_TOURS_DESCRIPTION;

  return {
    applicationName: siteName,
    title: pageTitle,
    description: pageDescription,
    keywords: METADATA.keywords,
    metadataBase: new URL(origin),
    alternates: { canonical },
    openGraph: { siteName, title: pageTitle, description: pageDescription, url: canonical, type: "website" },
    twitter: { card: "summary_large_image", title: pageTitle, description: pageDescription },
  };
}

const sections = [
  { id: "River Cruises", title: "River Cruises", note: "Jazz, brunch, dinner and Mississippi views." },
  { id: "Swamp Tours", title: "Swamp Adventures", note: "Covered boats and bayou country." },
  { id: "Airboat Rides", title: "Airboat Adventures", note: "A faster way into the wetlands." },
  { id: "Plantation Tours", title: "Plantation History", note: "River Road sites and historical context." },
  { id: "Combo Tours", title: "Combination Tours", note: "Build more of Louisiana into one day." },
  { id: "City Tours", title: "City Highlights", note: "Neighborhoods, architecture and local landmarks." },
  { id: "Walking Tours", title: "Food, Cocktails & Ghosts", note: "Experience the Quarter on foot." },
];

export const dynamic = "force-dynamic";

export default async function NewOrleansToursPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearch = searchParams ? await searchParams : {};
  const firstStr = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const defaultFutureDate = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .slice(0, 10);
  const selectedDate =
    firstStr(resolvedSearch.date) ||
    firstStr(resolvedSearch.arrivalDate) ||
    defaultFutureDate;
  const selectedPartySize =
    firstStr(resolvedSearch.party_size) ||
    firstStr(resolvedSearch.travelers) ||
    firstStr(resolvedSearch.passengerCount) ||
    firstStr(resolvedSearch.passengers) ||
    firstStr(resolvedSearch.qty) ||
    "2";

  const requestHeaders = await headers();
  const hostHeader = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const basePath = isWto ? "" : NEW_ORLEANS_TOURS_PATH;

  const productItems = STOREFRONT_PRODUCTS.map((item) => ({ name: item.title, description: item.description, url: `${basePath}/tours/${item.slug}`, slug: item.slug, providerName: item.operatorName }));
  const pageSchema = isWto
    ? buildWnoWebPageJsonLd({ path: "/tours", name: "Welcome To New Orleans Tours", description: CURRENT_TOURS_DESCRIPTION })
    : buildWebPageJsonLd({ path: NEW_ORLEANS_TOURS_PATH, name: "New Orleans Tours & Swamp Decision Authority | DCC", description: DCC_AUTHORITY_TOURS_DESCRIPTION, isPartOfPath: "/new-orleans" });
  const breadcrumbSchema = isWto
    ? buildWnoBreadcrumbJsonLd([{ name: "New Orleans Tours", path: "/tours" }])
    : buildBreadcrumbJsonLd([{ name: "New Orleans", item: "/new-orleans" }, { name: "Tours", item: NEW_ORLEANS_TOURS_PATH }]);

  const wnoSwampNextStepHref = `https://www.welcometoneworleanstours.com/swamp-tours?src=dcc-authority-nola-tours&from=dcc-new-orleans-tours&date=${encodeURIComponent(selectedDate)}&party_size=${encodeURIComponent(selectedPartySize)}`;
  const wnoAllToursNextStepHref = `https://www.welcometoneworleanstours.com/tours?src=dcc-authority-nola-tours&from=dcc-new-orleans-tours&date=${encodeURIComponent(selectedDate)}&party_size=${encodeURIComponent(selectedPartySize)}`;
  const directViator15200P6Href = `/api/v1/ads/click?offer=15200P6&option=TG10&placementId=fp-dcc-authority-nola-tours&property=hotel-monteleone-nola&src=dcc-authority-nola-tours&date=${encodeURIComponent(selectedDate)}&adults=${encodeURIComponent(selectedPartySize)}&departureTime=08%3A00`;

  const nwsFlagParam = firstStr(resolvedSearch.nws_flood_warning);
  const gaugeFeetParam = firstStr(resolvedSearch.water_level_ft);
  const allAboardParam = firstStr(resolvedSearch.all_aboard);
  const berthParam = firstStr(resolvedSearch.berth);

  const bayouFlagged =
    nwsFlagParam === "1" ||
    nwsFlagParam === "true" ||
    (gaugeFeetParam !== undefined && Number(gaugeFeetParam) >= 3.2);

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          pageSchema,
          breadcrumbSchema,
          ...generateCategorySchemaGraph({ urlPath: isWto ? "/tours" : NEW_ORLEANS_TOURS_PATH, name: isWto ? "Welcome To New Orleans Tours" : "New Orleans Tours & Swamp Decision Authority | DCC", description: isWto ? CURRENT_TOURS_DESCRIPTION : DCC_AUTHORITY_TOURS_DESCRIPTION, items: productItems.map((p: any) => ({ slug: p.slug, name: p.name, description: p.description, providerName: p.providerName })) })["@graph"],
        ],
      }} />

      <main className="w-full min-h-screen bg-[#080708] text-[#fdfbf7] font-[var(--font-sans)]">
        <CinematicPageHero
          eyebrow={isWto ? "The complete collection" : "Destination Command Center · Public Authority"}
          title={isWto ? "New Orleans Tours" : "New Orleans Tours & Bayou Decision Authority"}
          script={isWto ? "find your kind of New Orleans" : "answer the constraint first, then book with confidence"}
          intro={
            isWto
              ? "Compare bookable experiences by type, or tell us what kind of day you want. When you are ready, check live operator dates and prices directly from the tour card."
              : "Before you book a New Orleans swamp, airboat, plantation, or riverboat tour, check the four physical rules that make or break the day: rural dock return transportation, child age & medical limits, plantation focus, and 2026–2028 NPS trail closures."
          }
          image="/images/travel-markets/new-orleans/french-quarter-street.jpg"
          actions={
            isWto
              ? [
                  { href: "#tour-collection", label: "Browse Tours", detail: `${BOOKABLE_PRODUCT_COUNT} bookable experiences`, primary: true },
                  { href: "/help-me-choose", label: "Help Me Choose", detail: "Narrow it down for me" },
                  { href: "tel:+15044849687", label: "Ask Us", detail: "504-484-9687" },
                ]
              : [
                  { href: wnoSwampNextStepHref, label: "Open WNO Swamp Storefront", detail: "Verified pickup & boat comparison", primary: true },
                  { href: wnoAllToursNextStepHref, label: "Open Full WNO Storefront", detail: `${BOOKABLE_PRODUCT_COUNT} verified New Orleans tours` },
                  { href: "/new-orleans/swamp-tours", label: "Swamp Decision Matrix", detail: "Covered boat vs. airboat rules" },
                ]
          }
        />

        {!isWto ? (
          <section
            data-testid="dcc-nola-authority-brief"
            data-dcc-authority-market="new-orleans"
            className="max-w-7xl mx-auto px-6 pt-10"
          >
            <div className="rounded-3xl border border-cyan-400/30 bg-[#0d141d] p-6 md:p-8 space-y-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                    DCC Public Authority · Direct Decision Answer &amp; Verified Evidence
                  </p>
                  <h2 className="mt-1 text-2xl md:text-3xl font-black text-white">
                    Which New Orleans tour fits your group, transport, and schedule?
                  </h2>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-200">
                  23 Catalog Tours · Gray Line, Ragin Cajun &amp; Southern Style Live on WNO
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-sm">
                <article className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                    1. No Car or Kids Under 5 → Covered Swamp Boat + Pickup
                  </p>
                  <p className="text-white/85 leading-6">
                    Swamp docks in Slidell, Manchac, and Jean Lafitte sit <strong>30–45 min outside New Orleans with no return Uber/Lyft coverage</strong>. Choose a pickup-included covered pontoon boat (<strong>Gray Line Swamp &amp; Bayou Tour</strong> $65 w/ coach from 400 Toulouse St.; <strong>Ragin Cajun Covered Tour Boat</strong> $35; <strong>15200P6 Option TG10</strong> $60 w/ 8:00–8:30 AM FQ hotel pickup; or <strong>6953SWAMPTRANS</strong> $75.52). All ages welcome.
                  </p>
                </article>
                <article className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                    2. Thrill-First (Age 5+ Only) → Small or Large Airboat
                  </p>
                  <p className="text-white/85 leading-6">
                    High-speed marsh airboats (<strong>Ragin Cajun Airboat Options</strong> from $65; <strong>Gray Line Large Airboat</strong> $90 &amp; <strong>Small Airboat</strong> $119; <strong>Ragin Cajun 6363P15</strong>) enforce a <strong>strict minimum age of 5 years</strong>, prohibit pregnancy and neck/back injuries, require unassisted boarding, and have no roof shade.
                  </p>
                </article>
                <article className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
                    3. River Road Plantations &amp; City → Gray Line &amp; Southern Style
                  </p>
                  <p className="text-white/85 leading-6">
                    <strong>Gray Line Whitney Plantation ($89)</strong> focuses exclusively on the history of slavery; <strong>Gray Line Oak Alley ($89)</strong> centers on the 28-oak avenue; <strong>Southern Style Tours</strong> runs the <strong>City Tour ($50)</strong>, <strong>Oak Alley or Laura Plantation ($67)</strong>, and <strong>All-Day City + Plantation ($99)</strong>.
                  </p>
                </article>
                <article className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-wider text-rose-300">
                    4. Public / Free &amp; No-Purchase Reality Check
                  </p>
                  <p className="text-white/85 leading-6">
                    Effective <strong>Feb 2, 2026 for ~2 years</strong>, the <strong>NPS Barataria Preserve Visitor Center and most trails are closed</strong> (only Twin Canals trail/canoe launch is free with no restrooms; relocated Wetland Trace Boardwalk at 4917 City Park Dr charges $10/adult and requires a car). Without a car, ride the <strong>$1.25 RTA streetcar</strong> to City Park.
                  </p>
                </article>
              </div>

              {/* Exact WNO Offers: Gray Line, Ragin Cajun, and Southern Style */}
              <div
                data-testid="dcc-nola-exact-wno-offers"
                className="rounded-2xl border border-white/15 bg-black/45 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">
                      Bookable Today on WNO · Exact Gray Line, Ragin Cajun &amp; Southern Style Offers
                    </p>
                    <p className="text-xs text-white/75 mt-0.5">
                      Each link routes from DCC directly to the exact offer on Welcome to New Orleans Tours (<code>welcometoneworleanstours.com</code>) with its preserved FareHarbor checkout link and partner tracking intact.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80">
                    Seat counts shown only when provider-confirmed
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-3 text-xs">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2.5">
                    <p className="font-black uppercase tracking-wider text-cyan-300">
                      Gray Line / New Orleans Steamboat Co.
                    </p>
                    <p className="text-[11px] text-white/65">
                      Preserved tracking: <code>asn=welcometoneworleanstours&amp;ref=WelcomeToNewOrleansTours</code>
                    </p>
                    <ul className="space-y-1.5 text-white/90">
                      <li>
                        <a
                          href={`https://www.welcometoneworleanstours.com/tours/swamp-bayou-tour?src=dcc-authority-nola-tours&date=${encodeURIComponent(selectedDate)}&party_size=${encodeURIComponent(selectedPartySize)}`}
                          data-testid="dcc-wno-offer-grayline-swamp"
                          className="text-emerald-300 hover:underline font-semibold"
                        >
                          Swamp &amp; Bayou Tour ($65 · Item 561484) →
                        </a>
                      </li>
                      <li>
                        <a
                          href={`https://www.welcometoneworleanstours.com/tours/small-airboat-swamp-adventure?src=dcc-authority-nola-tours&date=${encodeURIComponent(selectedDate)}&party_size=${encodeURIComponent(selectedPartySize)}`}
                          data-testid="dcc-wno-offer-grayline-small-airboat"
                          className="text-emerald-300 hover:underline font-semibold"
                        >
                          Small Airboat Swamp Adventure ($119 · Item 561547) →
                        </a>
                      </li>
                      <li>
                        <a
                          href={`https://www.welcometoneworleanstours.com/tours/large-airboat-swamp-adventure?src=dcc-authority-nola-tours&date=${encodeURIComponent(selectedDate)}&party_size=${encodeURIComponent(selectedPartySize)}`}
                          data-testid="dcc-wno-offer-grayline-large-airboat"
                          className="text-emerald-300 hover:underline font-semibold"
                        >
                          Large Airboat Swamp Adventure ($90 · Item 562175) →
                        </a>
                      </li>
                      <li>
                        <a
                          href={`https://www.welcometoneworleanstours.com/tours/oak-alley-plantation-tour-grey-line?src=dcc-authority-nola-tours&date=${encodeURIComponent(selectedDate)}&party_size=${encodeURIComponent(selectedPartySize)}`}
                          data-testid="dcc-wno-offer-grayline-oak-alley"
                          className="text-emerald-300 hover:underline font-semibold"
                        >
                          Oak Alley Plantation Tour ($89 · Item 561477) →
                        </a>
                      </li>
                      <li>
                        <a
                          href={`https://www.welcometoneworleanstours.com/tours/whitney-plantation-tour?src=dcc-authority-nola-tours&date=${encodeURIComponent(selectedDate)}&party_size=${encodeURIComponent(selectedPartySize)}`}
                          data-testid="dcc-wno-offer-grayline-whitney"
                          className="text-emerald-300 hover:underline font-semibold"
                        >
                          Whitney Plantation Tour ($89 · Item 561539) →
                        </a>
                      </li>
                      <li>
                        <a
                          href={`https://www.welcometoneworleanstours.com/tours/evening-jazz-cruise?src=dcc-authority-nola-tours&date=${encodeURIComponent(selectedDate)}&party_size=${encodeURIComponent(selectedPartySize)}`}
                          data-testid="dcc-wno-offer-grayline-evening-jazz"
                          className="text-emerald-300 hover:underline font-semibold"
                        >
                          Evening Jazz Cruise ($58 · Item 560825) →
                        </a>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2.5">
                    <p className="font-black uppercase tracking-wider text-amber-300">
                      Ragin Cajun Tours
                    </p>
                    <p className="text-[11px] text-white/65">
                      Preserved tracking: <code>company=ragincajuntours&amp;asn=aktourcenter</code>
                    </p>
                    <ul className="space-y-1.5 text-white/90">
                      <li>
                        <a
                          href={`https://www.welcometoneworleanstours.com/tours/covered-tour-boat?src=dcc-authority-nola-tours&date=${encodeURIComponent(selectedDate)}&party_size=${encodeURIComponent(selectedPartySize)}`}
                          data-testid="dcc-wno-offer-ragincajun-covered-boat"
                          className="text-emerald-300 hover:underline font-semibold"
                        >
                          Covered Tour Boat ($35 · Item 590176 / Flow 392449) →
                        </a>
                      </li>
                      <li>
                        <a
                          href={`https://www.welcometoneworleanstours.com/tours/ragin-cajun-airboat-options?src=dcc-authority-nola-tours&date=${encodeURIComponent(selectedDate)}&party_size=${encodeURIComponent(selectedPartySize)}`}
                          data-testid="dcc-wno-offer-ragincajun-airboat"
                          className="text-emerald-300 hover:underline font-semibold"
                        >
                          Ragin Cajun Airboat Options ($65 · Flow 940162) →
                        </a>
                      </li>
                      <li>
                        <a
                          href={`https://www.welcometoneworleanstours.com/tours/covered-boat-plantation-combo?src=dcc-authority-nola-tours&date=${encodeURIComponent(selectedDate)}&party_size=${encodeURIComponent(selectedPartySize)}`}
                          data-testid="dcc-wno-offer-ragincajun-combo"
                          className="text-emerald-300 hover:underline font-semibold"
                        >
                          Covered Boat + Plantation Combo ($130 · Item 603090) →
                        </a>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2.5">
                    <p className="font-black uppercase tracking-wider text-purple-300">
                      Southern Style Tours
                    </p>
                    <p className="text-[11px] text-white/65">
                      Preserved tracking: <code>company=southernstyletours&amp;asn=aktourcenter&amp;flow=4344</code>
                    </p>
                    <ul className="space-y-1.5 text-white/90">
                      <li>
                        <a
                          href={`https://www.welcometoneworleanstours.com/tours/city-tour-of-new-orleans?src=dcc-authority-nola-tours&date=${encodeURIComponent(selectedDate)}&party_size=${encodeURIComponent(selectedPartySize)}`}
                          data-testid="dcc-wno-offer-southernstyle-city"
                          className="text-emerald-300 hover:underline font-semibold"
                        >
                          City Tour Of New Orleans ($50 · Item 51942) →
                        </a>
                      </li>
                      <li>
                        <a
                          href={`https://www.welcometoneworleanstours.com/tours/oak-alley-or-laura-plantation-tour?src=dcc-authority-nola-tours&date=${encodeURIComponent(selectedDate)}&party_size=${encodeURIComponent(selectedPartySize)}`}
                          data-testid="dcc-wno-offer-southernstyle-plantation"
                          className="text-emerald-300 hover:underline font-semibold"
                        >
                          Oak Alley Or Laura Plantation Tour ($67 · Item 83002) →
                        </a>
                      </li>
                      <li>
                        <a
                          href={`https://www.welcometoneworleanstours.com/tours/all-day-city-plantation-combo?src=dcc-authority-nola-tours&date=${encodeURIComponent(selectedDate)}&party_size=${encodeURIComponent(selectedPartySize)}`}
                          data-testid="dcc-wno-offer-southernstyle-combo"
                          className="text-emerald-300 hover:underline font-semibold"
                        >
                          All-Day City + Plantation Combo ($99 · Item 51953) →
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Cruise Timing & April 24 Dock Rollout NWS Flood / Bayou Water-Level Monitor */}
              <div className="grid gap-4 md:grid-cols-2 text-xs">
                <div
                  data-testid="dcc-nola-cruise-timing-gate"
                  className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black uppercase tracking-wider text-amber-200">
                      Port of New Orleans Cruise Timing Gate (60–90 Min DCC Buffer)
                    </span>
                    <span className="rounded-full border border-amber-300/40 bg-black/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-200">
                      {allAboardParam && berthParam ? "Fits cruise window" : "Confirm ship timing"}
                    </span>
                  </div>
                  <p className="text-white/85 leading-5">
                    Passengers disembarking at Erato Street or Julia Street Cruise Terminals must complete berth-to-check-in transfer, the full excursion, and return to the gangway <strong>60–90 minutes before confirmed ship all-aboard</strong>. When your ship’s confirmed all-aboard cutoff or terminal transfer is not provided, DCC shows <strong>Confirm ship timing</strong>.
                  </p>
                </div>

                <div
                  data-testid="dcc-nola-nws-water-level-monitor"
                  className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black uppercase tracking-wider text-cyan-200">
                      April 24 Dock Rollout · NWS Flood &amp; Bayou Water-Level Flag
                    </span>
                    <span className="rounded-full border border-cyan-300/40 bg-black/40 px-2.5 py-0.5 text-[11px] font-bold text-cyan-100">
                      {bayouFlagged
                        ? "Operator check required — NWS flood / water-level advisory"
                        : "USGS 07380335 & 02492620 Monitored"}
                    </span>
                  </div>
                  <p className="text-white/85 leading-5">
                    DCC monitors <strong>NWS New Orleans/Baton Rouge (LIX) flood warnings</strong> and <strong>USGS water-level gauges</strong> at Bayou Barataria at Lafitte (<code>07380335</code>, action stage 3.2 ft) and West Pearl River (<code>02492620</code>, action stage 12.0 ft) to flag affected bayou trips for an <strong>operator check</strong> prior to dispatch.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                <table className="w-full text-left text-xs text-white/85">
                  <thead className="border-b border-white/10 bg-white/[0.04] text-[11px] uppercase tracking-wider text-cyan-200">
                    <tr>
                      <th className="px-4 py-3">Lane &amp; Operator</th>
                      <th className="px-4 py-3">Verified Code</th>
                      <th className="px-4 py-3">Pickup / Meeting Evidence</th>
                      <th className="px-4 py-3">Age &amp; Physical Rules</th>
                      <th className="px-4 py-3">Verified Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-white">Louisiana Tour Co. Covered Swamp Boat</td>
                      <td className="px-4 py-3"><code>15200P6 · TG10</code></td>
                      <td className="px-4 py-3">8:00–8:30 AM FQ &amp; Downtown hotel pickup (214 Royal St verified) for 9:40 AM tour</td>
                      <td className="px-4 py-3">All ages · Shaded flat-bottom boat w/ restroom at dock</td>
                      <td className="px-4 py-3 font-bold text-emerald-300">$60 / adult</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-white">Cajun Encounters Honey Island Swamp</td>
                      <td className="px-4 py-3"><code>6953SWAMPTRANS</code></td>
                      <td className="px-4 py-3">Round-trip FQ/Downtown hotel shuttle to Slidell (~45 min each way; 4–5 hrs total)</td>
                      <td className="px-4 py-3">All ages on Original Tour (VIP Small-Boat requires age 13+ unless private)</td>
                      <td className="px-4 py-3 font-bold text-emerald-300">$75.52 / adult</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-white">Gray Line Swamp &amp; Bayou Boat</td>
                      <td className="px-4 py-3"><code>FH #561484 / Flow 1220421</code></td>
                      <td className="px-4 py-3">Included motorcoach from Steamboat NATCHEZ Dock (400 Toulouse St.; 3.75 hrs total)</td>
                      <td className="px-4 py-3">All ages ($32 ages 6–12; infants 2–5 free)</td>
                      <td className="px-4 py-3 font-bold text-emerald-300">$65 / adult</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-white">Ragin Cajun Covered Boat &amp; Airboats</td>
                      <td className="px-4 py-3"><code>FH #590176 / Flow 940162 / 6363P15</code></td>
                      <td className="px-4 py-3">Self-drive or FQ hotel pickup package on WNO</td>
                      <td className="px-4 py-3 text-amber-200">Covered boat all ages ($35) · Airboat min age 5+ ($65–$120)</td>
                      <td className="px-4 py-3 font-bold text-emerald-300">$35–$130 / person</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-white">Southern Style City &amp; Plantation Tours</td>
                      <td className="px-4 py-3"><code>FH #51942 / #83002 / #51953</code></td>
                      <td className="px-4 py-3">Minibus transportation w/ 8:00–8:30 AM morning pickup window on full-day combo</td>
                      <td className="px-4 py-3">Ages 4+ on 8-hr City + Plantation combo · Calmer minibus format</td>
                      <td className="px-4 py-3 font-bold text-emerald-300">$50–$99 / person</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-400/30 bg-emerald-950/30 p-4">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    Next Step · Move From DCC Authority to Verified Storefront or Checkout
                  </p>
                  <p className="text-xs text-white/80">
                    Welcome to New Orleans Tours (WNO) carries your date (<strong>{selectedDate}</strong>) and party size (<strong>{selectedPartySize}</strong>) directly into live availability with preserved FareHarbor and Viator checkout tracking.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <a
                    href={wnoSwampNextStepHref}
                    data-testid="dcc-authority-to-wno-swamp"
                    data-dcc-next-step="welcometoneworleanstours"
                    className="rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#04120a] hover:bg-emerald-300 transition"
                  >
                    Compare Swamp Tours on WNO →
                  </a>
                  <a
                    href={wnoAllToursNextStepHref}
                    data-testid="dcc-authority-to-wno-tours"
                    data-dcc-next-step="welcometoneworleanstours"
                    className="rounded-xl border border-cyan-300/40 bg-cyan-500/15 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-cyan-100 hover:bg-cyan-500/25 transition"
                  >
                    Open Full WNO Storefront →
                  </a>
                  <a
                    href={directViator15200P6Href}
                    data-testid="dcc-authority-direct-viator-15200p6"
                    data-dcc-next-step="viator"
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/15 transition"
                  >
                    Book 15200P6 w/ Hotel Pickup ($60) ↗
                  </a>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <div id="tour-collection" className="max-w-7xl mx-auto px-6 py-14 md:py-20 space-y-20 scroll-mt-24">
          <form
            method="get"
            action={isWto ? "/tours" : NEW_ORLEANS_TOURS_PATH}
            className="rounded-2xl border border-[#d4af37]/30 bg-[#141210] p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
                Active Tour Date &amp; Party Size
              </span>
              <span className="text-xs text-[#9f9588]">
                Prefilled from your New Orleans trip context
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 items-end">
              <div>
                <label
                  htmlFor="booking-context-date"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-[#e5dec9] mb-1"
                >
                  Preferred Tour Date
                </label>
                <input
                  id="booking-context-date"
                  type="date"
                  name="date"
                  defaultValue={selectedDate}
                  className="w-full rounded-lg border border-[#d4af37]/30 bg-[#080708] px-3 py-2 text-xs md:text-sm text-[#fdfbf7]"
                />
              </div>
              <div>
                <label
                  htmlFor="booking-context-party-size"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-[#e5dec9] mb-1"
                >
                  Travelers / Party Size
                </label>
                <select
                  id="booking-context-party-size"
                  name="party_size"
                  defaultValue={selectedPartySize}
                  className="w-full rounded-lg border border-[#d4af37]/30 bg-[#080708] px-3 py-2 text-xs md:text-sm text-[#fdfbf7]"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                    <option key={num} value={String(num)}>
                      {num} {num === 1 ? "Guest" : "Guests"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full rounded-lg border border-[#d4af37] bg-[#d4af37]/15 px-4 py-2 text-xs md:text-sm font-bold text-[#f7efe2] hover:bg-[#d4af37]/25"
                >
                  Update Availability Context
                </button>
              </div>
            </div>
          </form>

          <section id="nola-shared-trip-matcher" className="space-y-4">
            <DccConciergeWidget
              initialDestination="new-orleans"
              initialPropertySlug="hotel-monteleone-nola"
              initialSurface={isWto ? "welcometoneworleanstours" : "dcc"}
              embedMode={false}
            />
          </section>

          {sections.map((section, sectionIndex) => {
            const sectionProducts = STOREFRONT_PRODUCTS.filter((p) => p.category === section.id).sort((a, b) => {
              const priority = (slug: string) =>
                slug === "louisiana-tour-company-swamp-tour-hotel-pickup"
                  ? 0
                  : slug === "jeanlafitte-swamp-tour-with-hotel-pickup"
                    ? 1
                    : 2;
              return priority(a.slug) - priority(b.slug);
            });
            if (sectionProducts.length === 0) return null;
            return (
              <section id={section.id.toLowerCase().replace(/\s+/g, "-")} key={section.id} className="space-y-8 scroll-mt-28">
                <div className="grid md:grid-cols-[auto_1fr] md:items-end gap-4 border-b border-[#d4af37]/22 pb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d4af37]">Collection {String(sectionIndex + 1).padStart(2, "0")}</p>
                    <h2 className="mt-2 text-3xl md:text-4xl font-[var(--font-accent)] font-bold text-[#f7efe2]">{section.title}</h2>
                  </div>
                  <p className="md:text-right text-sm text-[#9f9588]">{section.note}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sectionProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      attributionSource={FAREHARBOR_SOURCES.tours}
                      product={{
                        ...product,
                        operatorAttribution: product.operatorName,
                        isBookable: !isHeldProduct(product.slug),
                        ctaLabel: isHeldProduct(product.slug) ? "View details · call to confirm" : undefined,
                      } as any}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {!isWto ? (
          <div className="max-w-7xl mx-auto px-6 pb-14">
            <CategoryDecisionEngineExperience
              engineId="new-orleans-city-tours"
              initialResult={
                NOLA_CITY_TOURS_DECISION_ENGINE.evaluate(
                  NOLA_CITY_TOURS_DECISION_ENGINE.defaultExampleInput,
                ) as unknown as DecisionResult<Record<string, unknown>>
              }
            />
          </div>
        ) : null}

        <DailyBriefSignup source="tour-catalog" />
      </main>
    </>
  );
}
