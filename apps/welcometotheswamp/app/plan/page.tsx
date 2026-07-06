import type { Metadata } from "next";
import Link from "next/link";
import ActivitiesWidget from "@/app/components/ActivitiesWidget";
import AvailabilityWidget from "@/app/components/AvailabilityWidget";
import FareHarborWidget from "@/app/components/FareHarborWidget";
import JsonLd from "@/app/components/JsonLd";
import WarmTransferTelemetry from "@/app/components/WarmTransferTelemetry";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@/lib/jsonld";
import {
  buildWtsGetYourGuideSearchHref,
  getWtsAvailabilityTourUrl,
} from "@/lib/getyourguide";
import { getWtsLiveProductLinks } from "@/lib/liveProductLinks";
import { inferLaneFromTransfer, parseWarmTransfer } from "@/lib/warmTransfer";
import { SITE_CONFIG } from "@/app/site-config";

export const pageIntent = "wts_storefront_plan";

export const metadata: Metadata = {
  title: "Book a New Orleans swamp tour | Welcome to the Swamp",
  description:
    "Check New Orleans swamp-tour availability, then choose airboat, covered boat, or hotel pickup based on the day you actually want.",
  alternates: { canonical: "https://welcometotheswamp.com/plan" },
};

const AIRBOAT_IMAGE = {
  src: "/images/boat-chooser/airboat.png",
  alt: "Airboat cutting across open Louisiana swamp water",
};

const COVERED_BOAT_IMAGE = {
  src: "/images/boat-chooser/covered-boat.png",
  alt: "Covered boat moving through a Louisiana bayou",
};

const SWAMP_IMAGE = {
  src: "/images/boat-chooser/generic-swamp.jpg",
  alt: "Still Louisiana swamp water under cypress trees",
};

const smallGroupAirboatImage = {
  src: "/images/boat-chooser/small-group-airboat.png",
  alt: "Passengers on a small-group airboat swamp tour",
};

const swampBoatImage = {
  src: "/images/boat-chooser/swamp-boat.png",
  alt: "A swamp tour boat navigating the Louisiana bayou",
};

const frenchQuarterStreetImage = {
  src: "/images/boat-chooser/french-quarter-street.jpg",
  alt: "Historic French Quarter street scene in New Orleans",
};

function PlanCard({
  eyebrow,
  title,
  body,
  image,
  href,
  cta,
  external = false,
  trackingId,
}: {
  eyebrow: string;
  title: string;
  body: string;
  image?: typeof AIRBOAT_IMAGE;
  href: string;
  cta: string;
  external?: boolean;
  trackingId: string;
}) {
  const isFareHarbor = href.includes("fareharbor.com/embeds/book/");
  const classes = isFareHarbor ? "wts-button wts-button-card fh-book" : "wts-button wts-button-card";

  return (
    <article className="wts-tour-card">
      {image ? (
        <div className="wts-tour-image">
          <img src={image.src} alt={image.alt} loading="lazy" />
        </div>
      ) : null}
      <div className="wts-tour-copy">
        <div className="wts-card-topline">{eyebrow}</div>
        <h3>{title}</h3>
        <p>{body}</p>
        <Link
          href={href}
          className={classes}
          target={external ? "_blank" : undefined}
          rel={external ? "sponsored noopener noreferrer" : undefined}
          data-warm-transfer-click={trackingId}
        >
          {cta}
        </Link>
      </div>
    </article>
  );
}

function AvailabilityWidgetCard({
  title,
  body,
  tourUrl,
  campaign,
  trackingId,
  companyShortname,
  refCode,
  itemId,
  flowId,
}: {
  title: string;
  body: string;
  tourUrl: string;
  campaign: string;
  trackingId: string;
  companyShortname?: string;
  refCode?: string;
  itemId?: string | number;
  flowId?: string | number;
}) {
  return (
    <article className="wts-tour-card">
      <div className="wts-tour-copy">
        <div className="wts-card-topline">
          {companyShortname ? "Live FareHarbor availability" : "Live GetYourGuide availability"}
        </div>
        <h3>{title}</h3>
        <p>{body}</p>
        <div data-warm-transfer-click={trackingId}>
          {companyShortname ? (
            <FareHarborWidget
              companyShortname={companyShortname}
              refCode={refCode}
              campaign={campaign}
              itemId={itemId}
              flowId={flowId}
              layout="calendar"
              className="wts-availability-widget"
            />
          ) : (
            <AvailabilityWidget
              tourUrl={tourUrl}
              campaign={campaign}
              currency="USD"
              layout="horizontal"
              className="wts-availability-widget"
            />
          )}
        </div>
      </div>
    </article>
  );
}

export default async function SwampPlanPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const packet = parseWarmTransfer(resolved);
  const lane = inferLaneFromTransfer(packet);
  
  const products = SITE_CONFIG.swampFareHarborProducts;
  const asn = SITE_CONFIG.fareharborSwampAsn;
  const hasFhConfig = products && products.length > 0 && asn;

  const fhAirboat = products?.find(p => p.type === "airboat");
  const fhBoat = products?.find(p => p.type === "boat");

  const links = await getWtsLiveProductLinks();

  const fhPickupProduct = products?.find(p => p.id === "southernstyle-swamp");

  const gygAirboatHref = fhAirboat && asn
    ? (fhAirboat.itemId
        ? `https://fareharbor.com/embeds/book/${fhAirboat.companyShortname}/items/${fhAirboat.itemId}/?asn=${asn}&flow=${fhAirboat.flowId || ""}&ref=wts-plan-airboat`
        : `https://fareharbor.com/embeds/book/${fhAirboat.companyShortname}/?asn=${asn}&flow=${fhAirboat.flowId || ""}&ref=wts-plan-airboat`)
    : buildWtsGetYourGuideSearchHref("airboat", "wts-plan-airboat");

  const gygBoatHref = fhBoat && asn
    ? (fhBoat.itemId
        ? `https://fareharbor.com/embeds/book/${fhBoat.companyShortname}/items/${fhBoat.itemId}/?asn=${asn}&flow=${fhBoat.flowId || ""}&ref=wts-plan-covered-boat`
        : `https://fareharbor.com/embeds/book/${fhBoat.companyShortname}/?asn=${asn}&flow=${fhBoat.flowId || ""}&ref=wts-plan-covered-boat`)
    : buildWtsGetYourGuideSearchHref("boat", "wts-plan-covered-boat");

  const heroBookingHref = fhAirboat && asn
    ? (fhAirboat.itemId
        ? `https://fareharbor.com/embeds/book/${fhAirboat.companyShortname}/items/${fhAirboat.itemId}/?asn=${asn}&flow=${fhAirboat.flowId || ""}&ref=wts-hero-booking`
        : `https://fareharbor.com/embeds/book/${fhAirboat.companyShortname}/?asn=${asn}&flow=${fhAirboat.flowId || ""}&ref=wts-hero-booking`)
    : buildWtsGetYourGuideSearchHref("airboat", "wts-plan-airboat");

  const pickupHref = fhPickupProduct && asn
    ? `https://fareharbor.com/embeds/book/${fhPickupProduct.companyShortname}/items/${fhPickupProduct.itemId}/?asn=${asn}&flow=${fhPickupProduct.flowId || ""}&ref=wts-plan-pickup`
    : links.pickupHref;

  const gygBrowseHref = fhBoat && asn
    ? (fhBoat.itemId
        ? `https://fareharbor.com/embeds/book/${fhBoat.companyShortname}/items/${fhBoat.itemId}/?asn=${asn}&flow=${fhBoat.flowId || ""}&ref=wts-plan-widget`
        : `https://fareharbor.com/embeds/book/${fhBoat.companyShortname}/?asn=${asn}&flow=${fhBoat.flowId || ""}&ref=wts-plan-widget`)
    : buildWtsGetYourGuideSearchHref("boat", "wts-plan-widget");

  const airboatAvailabilityTourUrl = getWtsAvailabilityTourUrl("airboat");
  const boatAvailabilityTourUrl = getWtsAvailabilityTourUrl("boat");
  const hasAvailabilityWidgets = Boolean(hasFhConfig || airboatAvailabilityTourUrl || boatAvailabilityTourUrl);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        path: "/plan",
        name: "Book a New Orleans swamp tour",
        description:
          "A booking-first New Orleans swamp-tour page for checking availability and choosing airboat, covered boat, or hotel pickup.",
      }),
      buildBreadcrumbJsonLd([
        { name: "Welcome to the Swamp", item: "/" },
        { name: "Book a New Orleans swamp tour", item: "/plan" },
      ]),
    ],
  };

  return (
    <main className="wts-storefront" data-page-intent={pageIntent}>
      <JsonLd data={jsonLd} />
      <WarmTransferTelemetry packet={packet} lane={lane} />

      <section className="wts-hero">
        <div className="wts-hero-media">
          <img src={SWAMP_IMAGE.src} alt={SWAMP_IMAGE.alt} loading="eager" />
          <div className="wts-hero-overlay">
            <span>New Orleans after the postcard</span>
            <strong>Book the bayou, then get back for dinner.</strong>
          </div>
        </div>
        <div className="wts-hero-copy">
          <p className="wts-eyebrow">Welcome to the Swamp</p>
          <h1>Book a New Orleans swamp tour.</h1>
            <div className="wts-hero-booking" aria-labelledby="wts-gyg-booking">
             <div className="wts-section-head">
               <p className="wts-eyebrow">{hasFhConfig ? "Book through FareHarbor" : "Book through GetYourGuide"}</p>
               <h2 id="wts-gyg-booking">Book a New Orleans swamp tour</h2>
               <p>
                 {hasFhConfig
                   ? "Check real-time slot calendar and finish reservation directly with the provider."
                   : "Check availability and book the tour style that fits first. Final price, live availability, pickup details, cancellation policy, and provider terms continue on GetYourGuide."}
               </p>
             </div>
             {hasFhConfig ? (
               <div className="wts-tour-grid">
                 {products.map((product) => (
                   <AvailabilityWidgetCard
                     key={product.id}
                     title={product.title}
                     body={product.description}
                     tourUrl=""
                     campaign={`wts-plan-${product.id}`}
                     trackingId={`fh_${product.id}`}
                     companyShortname={product.companyShortname}
                     refCode={asn}
                     itemId={product.itemId}
                     flowId={product.flowId}
                   />
                 ))}
               </div>
             ) : hasAvailabilityWidgets ? (
               <div className="wts-tour-grid">
                 {airboatAvailabilityTourUrl ? (
                   <AvailabilityWidgetCard
                     title="Airboat swamp tour"
                     body="Use this if speed, wind, and a louder ride are the point of the trip."
                     tourUrl={airboatAvailabilityTourUrl}
                     campaign="wts-plan-airboat-availability"
                     trackingId="gyg_airboat_availability"
                   />
                 ) : null}
                 {boatAvailabilityTourUrl ? (
                   <AvailabilityWidgetCard
                     title="Covered swamp boat"
                     body="Use this if shade, slower water, and a calmer ride are the better fit."
                     tourUrl={boatAvailabilityTourUrl}
                     campaign="wts-plan-boat-availability"
                     trackingId="gyg_boat_availability"
                   />
                 ) : null}
               </div>
             ) : (
               <article className="wts-tour-card">
                 <div className="wts-tour-copy">
                   <div className="wts-card-topline">GetYourGuide availability</div>
                   <h3>Exact tour widget slot</h3>
                   <p>GetYourGuide availability widget goes here once activity URLs are configured.</p>
                 </div>
               </article>
             )}
             {!hasFhConfig && (
               <article className="wts-tour-card">
                 <div className="wts-tour-copy">
                   <div className="wts-card-topline">GetYourGuide activity widget</div>
                   <h3>New Orleans swamp tour availability</h3>
                   <p>Use this widget to open current GetYourGuide swamp-tour options.</p>
                   <div data-warm-transfer-click="gyg_activity_widget">
                     <ActivitiesWidget
                       href={gygBrowseHref}
                       campaign="wts-plan-widget"
                       numberOfItems={3}
                       className="wts-activities-widget"
                     />
                   </div>
                 </div>
               </article>
             )}
            <div className="wts-tour-grid">
              <PlanCard
                eyebrow="GetYourGuide / airboat"
                title="Airboat swamp tours"
                body="Use this if speed, wind, and a louder ride are the point of the trip."
                image={undefined}
                href={gygAirboatHref}
                cta="Check availability"
                external
                trackingId="gyg_card_airboat"
              />
              <PlanCard
                eyebrow="GetYourGuide / covered boat"
                title="Covered swamp boat tours"
                body="Use this if shade, slower water, and a calmer ride are the better fit."
                image={undefined}
                href={gygBoatHref}
                cta="Book this tour"
                external
                trackingId="gyg_card_covered_boat"
              />
            </div>
          </div>
          <p className="wts-hero-summary">
            Check availability first, then choose the ride style: loud airboat,
            slow covered boat, or hotel pickup when you want the easy move.
          </p>
          <div className="wts-cta-row">
            <Link
              href={heroBookingHref}
              className={`wts-button wts-button-primary${heroBookingHref.includes("fareharbor") ? " fh-book" : ""}`}
              target="_blank"
              rel="sponsored noopener noreferrer"
              data-warm-transfer-click="gyg_hero_airboat"
            >
              Check availability
            </Link>
            <Link
              href="#boat-style"
              className="wts-button wts-button-secondary"
              data-warm-transfer-click="hero_compare"
            >
              Compare boat styles
            </Link>
          </div>
          <div className="wts-chip-row">
            <span>Airboat if you want noise</span>
            <span>Covered boat if you want atmosphere</span>
            <span>Pickup if you want it easy</span>
          </div>
        </div>
      </section>

      <section className="wts-section" aria-labelledby="wts-plan-picks">
        <div className="wts-section-head">
          <p className="wts-eyebrow">Viator fallback links</p>
          <h2 id="wts-plan-picks">Use these only if GetYourGuide does not fit.</h2>
          <p>
            These attributed Viator links keep the backup booking path open. They are not the
            primary WTS booking path.
          </p>
        </div>
        <div className="wts-tour-grid">
          <PlanCard
            eyebrow="Loud / fast"
            title="Airboat Swamp Tour"
            body="For the friend who wants the ride to feel like the point. Wind, engine, open water, quick hit."
            image={undefined}
            href={links.airboatHref}
            cta="Book this tour"
            external
            trackingId="card_airboat"
          />
          <PlanCard
            eyebrow="Slow / cinematic"
            title="Covered Boat Swamp Tour"
            body="For a moodier bayou pass: shade, slower pacing, and more time to actually look around."
            image={undefined}
            href={links.smallBoatHref}
            cta="Book this tour"
            external
            trackingId="card_covered_boat"
          />
          <PlanCard
            eyebrow="Easy move"
            title="Swamp Tour With Pickup"
            body="For the no-car plan. Get picked up, leave the city, see the swamp, come back clean."
            image={undefined}
            href={links.pickupHref}
            cta="Check availability"
            external
            trackingId="card_pickup"
          />
          <PlanCard
            eyebrow="Still deciding"
            title="Compare the styles"
            body="Use this if the only real question is fast airboat versus slower covered boat."
            image={undefined}
            href="/airboat-vs-boat"
            cta="Compare styles"
            trackingId="card_compare_styles"
          />
        </div>
      </section>

      <section className="wts-trust-strip" aria-label="Swamp trip notes">
        <article className="wts-trust-badge">
          <strong>Hotel pickup</strong>
          <span>Best when the Quarter is home base and you do not want to solve transport.</span>
        </article>
        <article className="wts-trust-badge">
          <strong>Boat style</strong>
          <span>Airboat is the loud, fast version. Covered boat is the slow cinematic version.</span>
        </article>
        <article className="wts-trust-badge">
          <strong>Weather mood</strong>
          <span>Heat, rain, shade, and wind change the right call more than the tour title does.</span>
        </article>
        <article className="wts-trust-badge">
          <strong>Night plan</strong>
          <span>Leave town, get the bayou scene, and make it back for dinner or the next bar.</span>
        </article>
      </section>

      <section className="wts-section wts-chooser" id="boat-style">
        <div className="wts-section-head">
          <p className="wts-eyebrow">Pick the feel</p>
          <h2>Airboat or covered boat?</h2>
          <p>
            This is the only choice that really changes the day. Speed and noise, or shade and
            slow water. Everything else is timing, pickup, and provider terms.
          </p>
        </div>
        <div className="wts-recommendation">
          <strong>Airboat if you want the loud, fast version.</strong>
          <div className="wts-chip-row">
            <span>open air</span>
            <span>higher energy</span>
            <span>more ride than reverie</span>
          </div>
          <strong>Covered boat if you want the slow cinematic version.</strong>
          <div className="wts-chip-row">
            <span>shade</span>
            <span>slower water</span>
            <span>better for looking around</span>
          </div>
        </div>
      </section>

      <section className="wts-disclosure" aria-labelledby="wts-plan-disclosure">
        <div>
          <p className="wts-eyebrow">Booking clarity</p>
          <h2 id="wts-plan-disclosure">Choose the vibe here. Confirm the terms there.</h2>
          <p>
            Welcome to the Swamp helps you pick the bayou lane. Final price, live availability,
            reviews, pickup details, cancellation policy, and provider terms continue on the
            booking page.
          </p>
        </div>
        <div className="wts-disclosure-grid">
          <div>
            <strong>Good reasons to click now</strong>
            <ul>
              <li>You want the loud airboat version.</li>
              <li>You want the slow covered-boat version.</li>
              <li>You want hotel pickup and less logistics.</li>
            </ul>
          </div>
          <div>
            <strong>Check before paying</strong>
            <ul>
              <li>Exact pickup point and return timing.</li>
              <li>Weather, cancellation, and age rules.</li>
              <li>Current price and provider-specific terms.</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="wts-mobile-cta">
        <Link
          href={heroBookingHref}
          className={`wts-button wts-button-primary${heroBookingHref.includes("fareharbor") ? " fh-book" : ""}`}
          target="_blank"
          rel="sponsored noopener noreferrer"
          data-warm-transfer-click="gyg_sticky_airboat"
        >
          Check availability
        </Link>
        <span>Final terms continue on booking page</span>
      </div>
    </main>
  );
}
