import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import { LfseFishingLodgesDirectoryClient } from "@/components/LfseFishingLodgesDirectoryClient";
import {
  SEAK_FISHING_LODGES_CANONICAL_URL,
  SEAK_FISHING_LODGES_RELEASE_READY,
  buildFishingLodgesDirectoryJsonLd,
} from "@/lib/fishingLodgesConfig";
import { LFSE_SITE_URL } from "@/lib/structuredData";
import { getPublicSoutheastAlaskaFishingLodgesSnapshot } from "../../../../../lib/dcc/shared/southeastAlaskaFishingLodgesData";
import styles from "./fishing-lodges.module.css";

export const metadata: Metadata = {
  title:
    "Southeast Alaska Fishing Lodges, Basecamps & Private Stays — Independent Guide",
  description:
    "Compare 16 Southeast Alaska fishing lodges, self-guided boat-and-hotel stays, and whole-lodge private rentals across Juneau, Sitka, Elfin Cove, Gustavus, Petersburg, Ketchikan, and Prince of Wales Island.",
  alternates: { canonical: SEAK_FISHING_LODGES_CANONICAL_URL },
  robots: {
    index: SEAK_FISHING_LODGES_RELEASE_READY,
    follow: SEAK_FISHING_LODGES_RELEASE_READY,
  },
  openGraph: {
    title:
      "Southeast Alaska Fishing Lodges | Compare Rates, Inclusions, Access & Companion Fit",
    description:
      "Independent guide comparing Southeast Alaska fishing lodges, floatplane and boat transfers, package inclusions, and non-fishing options for companions.",
    url: SEAK_FISHING_LODGES_CANONICAL_URL,
    siteName: "Last Frontier Shore Excursions",
    type: "website",
    images: [
      {
        url: `${LFSE_SITE_URL}/images/alaska/inside-passage-hero.jpg`,
        width: 1440,
        height: 900,
        alt: "Glaciated coastal peaks and calm Inside Passage waters in Southeast Alaska",
      },
    ],
  },
};

interface FishingLodgesDirectoryPageProps {
  searchParams?: Promise<{
    compare?: string | string[];
    print?: string | string[];
  }>;
}

export default async function SoutheastAlaskaFishingLodgesPage({
  searchParams,
}: FishingLodgesDirectoryPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const rawCompare = Array.isArray(resolvedParams?.compare)
    ? resolvedParams.compare.join(",")
    : resolvedParams?.compare || "";
  const initialCompareSlugs = rawCompare
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const rawPrint = Array.isArray(resolvedParams?.print)
    ? resolvedParams.print[0]
    : resolvedParams?.print;
  const initialPrintMode = rawPrint === "1" || rawPrint === "true";
  const hideChromeForPrintSheet =
    initialPrintMode && initialCompareSlugs.length > 0;

  const snapshot = getPublicSoutheastAlaskaFishingLodgesSnapshot();
  const lodges = snapshot.lodges;
  const jsonLd = buildFishingLodgesDirectoryJsonLd(lodges);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Traveler-Focused Hero */}
      <section
        className={`hero ${styles.noPrint}`}
        style={hideChromeForPrintSheet ? { display: "none" } : undefined}
      >
        <div className="shell">
          <nav
            className="breadcrumbs"
            aria-label="Breadcrumbs"
            style={{ color: "#cfe5ea" }}
          >
            <Link href="/" style={{ color: "#ffffff" }}>
              Home
            </Link>
            <span>›</span>
            <Link href="/southeast-alaska" style={{ color: "#ffffff" }}>
              Southeast Alaska
            </Link>
            <span>›</span>
            <span style={{ color: "#cfe5ea" }}>Fishing Lodges</span>
          </nav>

          <p className="eyebrow">
            Independent Southeast Alaska Guide · Free Listings
          </p>
          <h1>
            Southeast Alaska Fishing Lodges, Basecamps &amp; Whole-Lodge Stays
          </h1>
          <p className="lead" style={{ color: "#e4f1f4", maxWidth: 880 }}>
            Planning five nights in July where two of you want serious fishing
            and two want wildlife and kayaking? Compare prices, stay lengths,
            what&apos;s included, boat setups, companion activities, and how you
            actually reach each property—then connect directly with the lodge.
          </p>

          <div className={styles.heroMetaStrip}>
            <span className={styles.heroPill}>
              {snapshot.counts.totalPublishedProperties} Southeast Alaska
              Properties
            </span>
            <span className={styles.heroPill}>
              {snapshot.counts.individualRoomOrCabinProperties} Room &amp; Cabin
              Stays
            </span>
            <span className={styles.heroPill}>
              {snapshot.counts.wholeLodgePrivateProperties} Whole-Lodge Private
              Stay
            </span>
            <span className={styles.heroPill}>
              Compare up to 4 + Printable PDF
            </span>
          </div>
        </div>
      </section>

      {/* 2. Plain-Language Comparison Guide Strip */}
      <section
        className={`${styles.trustBanner} ${styles.noPrint}`}
        style={hideChromeForPrintSheet ? { display: "none" } : undefined}
      >
        <div className="shell">
          <div className={styles.trustGrid}>
            <div className={styles.trustItem}>
              <strong>Rates &amp; Extra Costs Up Front</strong>
              Published rates appear with their dates, nights, and occupancy—plus
              transfers, taxes, licenses, and fish shipping to budget separately.
            </div>
            <div className={styles.trustItem}>
              <strong>Anglers &amp; Non-Anglers Together</strong>
              See which lodges run guided wildlife or glacier outings alongside
              fishing, and which focus strictly on time on the water.
            </div>
            <div className={styles.trustItem}>
              <strong>Real Transfer &amp; Baggage Details</strong>
              Check floatplane, commuter plane, ferry, and shuttle connections
              plus soft-sided luggage and fish-box weight rules.
            </div>
            <div className={styles.trustItem}>
              <strong>Free, Independent Listings</strong>
              Every listing is free for lodges to appear in and links straight
              to the official website or reservation contact.
            </div>
          </div>
        </div>
      </section>

      {/* 3. Filterable Directory + Side-by-Side Comparison Workspace */}
      <section className="section" id="directory-workspace">
        <div className="shell">
          <LfseFishingLodgesDirectoryClient
            lodges={lodges}
            initialCompareSlugs={initialCompareSlugs}
            initialPrintMode={initialPrintMode}
          />
        </div>
      </section>

      {/* 4. Choosing a Lodge Style & Connecting Your Trip */}
      <section
        className={`section ${styles.noPrint}`}
        id="choosing-a-stay-style"
        style={{
          background: "#ffffff",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
          ...(hideChromeForPrintSheet ? { display: "none" } : {}),
        }}
      >
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Choosing the Right Setup
          </p>
          <h2>Four Ways Fishing Stays Work in Southeast Alaska</h2>
          <p
            className="lead"
            style={{ color: "var(--muted)", maxWidth: 840 }}
          >
            Lodges in Southeast Alaska don&apos;t all bundle trips the same way.
            Matching the stay format to your group avoids surprises when you ask
            for a quote:
          </p>

          <div className="lfse-two-col" style={{ marginTop: 22 }}>
            <div className="card">
              <span
                className="badge badge-safety"
                style={{ alignSelf: "flex-start" }}
              >
                All-Inclusive Guided Lodges
              </span>
              <h3 style={{ marginTop: 10 }}>
                Bundled Meals, Boats &amp; Fish Processing
              </h3>
              <p>
                Remote fly-in and boat-in resorts (such as Admiralty Island,
                Elfin Cove, Yes Bay, and Prince of Wales lodges) typically
                bundle meals, guided boats, tackle, rain gear, and vacuum-packed
                fish boxes—though gateway floatplane flights, taxes, and daily
                halibut stamps vary by property.
              </p>
            </div>

            <div className="card">
              <span
                className="badge badge-safety"
                style={{ alignSelf: "flex-start" }}
              >
                Self-Guided Skiffs &amp; Boat-Plus-Hotel Stays
              </span>
              <h3 style={{ marginTop: 10 }}>
                Run Your Own Boat on Protected Waters
              </h3>
              <p>
                Experienced boaters can choose cabin resorts with skiffs (such
                as Rocky Point Resort or Clover Pass Resort) or pair a dedicated
                boat-rental operator with a waterfront hotel—such as{" "}
                <Link
                  href="/southeast-alaska/fishing-lodges/fish-baranof-sitka"
                  style={{
                    color: "var(--forest)",
                    fontWeight: 700,
                    textDecoration: "underline",
                  }}
                >
                  Fish Baranof with Longliner Lodge &amp; Suites
                </Link>{" "}
                in Sitka, where unguided sport halibut rules apply.
              </p>
            </div>

            <div className="card">
              <span
                className="badge badge-safety"
                style={{ alignSelf: "flex-start" }}
              >
                Gateway Inns + Local Day Charters
              </span>
              <h3 style={{ marginTop: 10 }}>
                Easy Splitting for Mixed-Interest Groups
              </h3>
              <p>
                Full-service inns in gateway communities like Gustavus (Bear
                Track Inn and Glacier Bay Country Inn) let two travelers book
                halibut or salmon charters while companions spend the day on a
                Glacier Bay National Park boat tour or guided sea kayak paddle.
              </p>
            </div>

            <div
              className="card"
              style={{
                background: "#fffdf8",
                borderColor: "var(--safety-border)",
              }}
            >
              <span
                className="badge badge-warning"
                style={{ alignSelf: "flex-start" }}
              >
                Whole-Lodge Private Rentals
              </span>
              <h3 style={{ marginTop: 10 }}>
                One Private Group, Services Arranged Separately
              </h3>
              <p>
                At{" "}
                <Link
                  href="/southeast-alaska/fishing-lodges/boardwalk-lodge"
                  style={{
                    color: "var(--forest)",
                    fontWeight: 700,
                    textDecoration: "underline",
                  }}
                >
                  Alaska&apos;s Boardwalk Lodge
                </Link>{" "}
                on Prince of Wales Island, one group books the entire
                waterfront property directly with the owners, while private
                chefs, independent guides, housekeeping, and boat access are
                arranged separately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Contextual Alaska Ecosystem Connections (LFSE, JFD, Cruise Promenade) */}
      <section
        className={`section ${styles.noPrint}`}
        id="ecosystem-connections"
        style={hideChromeForPrintSheet ? { display: "none" } : undefined}
      >
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Plan the Rest of Your Trip
          </p>
          <h2>
            Gateway Overnight Stays, Flight Weather &amp; Ferry Connections
          </h2>
          <p
            className="lead"
            style={{ color: "var(--muted)", maxWidth: 840 }}
          >
            Remote floatplanes and island ferries run on Southeast Alaska
            weather and tide windows. Use these companion guides to plan buffer
            nights and onward travel:
          </p>

          <div className="lfse-cards-grid" style={{ marginTop: 22 }}>
            <div className="card">
              <span
                className="badge badge-safety"
                style={{ alignSelf: "flex-start" }}
              >
                Juneau Stays &amp; Activities
              </span>
              <h3 style={{ marginTop: 10 }}>
                Weekend in Juneau: Pre- &amp; Post-Lodge Buffer Nights
              </h3>
              <p>
                Fly-in lodges out of Juneau often recommend arriving a day
                early. Compare Downtown vs. Mendenhall Valley hotels, glacier
                outings, and evening dining.
              </p>
              <div style={{ marginTop: "auto", paddingTop: 10 }}>
                <Link
                  href="/guides/weekend-in-juneau"
                  style={{ color: "var(--forest)", fontWeight: 800 }}
                >
                  Open Weekend in Juneau Guide →
                </Link>
              </div>
            </div>

            <div className="card">
              <span
                className="badge badge-safety"
                style={{ alignSelf: "flex-start" }}
              >
                Juneau Flight Deck
              </span>
              <h3 style={{ marginTop: 10 }}>
                Floatplane Weather Holds &amp; Helicopter Add-Ons
              </h3>
              <p>
                Check cloud-ceiling weather patterns, aircraft weight rules, and
                Juneau Icefield helicopter options before booking tight airline
                connections home.
              </p>
              <div
                className="chips"
                style={{ marginTop: "auto", paddingTop: 10 }}
              >
                <a
                  href="https://juneauflightdeck.com/juneau-glacier-flight-weather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chip lfse-chip-link"
                >
                  Juneau Flight Weather ↗
                </a>
                <a
                  href="https://juneauflightdeck.com/guides/uncruise-juneau-helicopter-tours"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chip lfse-chip-link"
                >
                  Pre/Post-Trip Helicopter Guide ↗
                </a>
                <a
                  href="https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chip lfse-chip-link"
                >
                  Compare Juneau Operators ↗
                </a>
              </div>
            </div>

            <div className="card">
              <span
                className="badge badge-safety"
                style={{ alignSelf: "flex-start" }}
              >
                Cruise Promenade
              </span>
              <h3 style={{ marginTop: 10 }}>
                Cruise Alaska Without a Cruise Ship
              </h3>
              <p>
                Connect a Sitka, Gustavus, Juneau, Petersburg, or Ketchikan
                fishing stay with state ferries, fast catamarans, and small-plane
                hops between Inside Passage towns.
              </p>
              <div
                className="chips"
                style={{ marginTop: "auto", paddingTop: 10 }}
              >
                <a
                  href="https://cruisepromenade.com/guides/cruise-alaska-without-a-cruise-ship"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chip lfse-chip-link"
                >
                  Independent Ferry &amp; Air Guide ↗
                </a>
                <a
                  href="https://cruisepromenade.com/guides/cruise-alaska-without-a-cruise-ship/example-journey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chip lfse-chip-link"
                >
                  Printable 9-Night Journey ↗
                </a>
              </div>
            </div>
          </div>

          <div
            className="chips"
            style={{ marginTop: 20, alignItems: "center" }}
          >
            <span
              style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}
            >
              Gateway Town &amp; Harbor Guides:
            </span>
            <Link className="chip lfse-chip-link" href="/ports/juneau">
              Juneau (JNU) →
            </Link>
            <Link className="chip lfse-chip-link" href="/ports/sitka">
              Sitka (SIT) →
            </Link>
            <Link className="chip lfse-chip-link" href="/ports/ketchikan">
              Ketchikan (KTN) →
            </Link>
            <Link className="chip lfse-chip-link" href="/ports/gustavus">
              Gustavus (GST) →
            </Link>
            <Link className="chip lfse-chip-link" href="/ports/petersburg">
              Petersburg (PSG) →
            </Link>
            <Link className="chip lfse-chip-link" href="/ports/wrangell">
              Wrangell →
            </Link>
          </div>

          {/* Expandable Sources & Check Dates */}
          <div style={{ marginTop: 28 }}>
            <details
              className="lfse-sources-details"
              data-testid="fishing-lodges-methodology-and-sources"
            >
              <summary>Sources, check dates &amp; how listings work</summary>
              <div className="lfse-sources-body">
                <p style={{ margin: "0 0 10px" }}>
                  <strong>Last checked:</strong> November 19, 2026. Rates,
                  inclusions, transfer notes, and fishing details are compiled
                  from each lodge&apos;s published official pages, with
                  page-by-page source links available inside every lodge page.
                  Because seasonal schedules, aircraft baggage limits, and
                  Alaska Department of Fish &amp; Game sportfishing rules can
                  change, confirm current details directly with the lodge before
                  paying a deposit.
                </p>
                <p style={{ margin: "0 0 10px" }}>
                  <strong>Photos:</strong> Cards show licensed Southeast Alaska
                  regional scenery documented in{" "}
                  <code>public/images/SOURCES.md</code>; follow each lodge&apos;s
                  official website link to see cabin, dining room, and boat
                  photos.
                </p>
                <p style={{ margin: "0 0 10px" }}>
                  <strong>Free listings &amp; updates:</strong> Businesses are
                  listed free of charge whether or not they participate. Lodge
                  owners and travelers can suggest updates or claim a listing on
                  any lodge page.
                </p>
                <TrustDisclosure compact />
              </div>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}
