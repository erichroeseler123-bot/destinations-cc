import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import { LfseFishingLodgesDirectoryClient } from "@/components/LfseFishingLodgesDirectoryClient";
import {
  DCC_ALASKA_FISHING_LODGES_API_URL,
  SEAK_FISHING_LODGES_CANONICAL_URL,
  SEAK_FISHING_LODGES_RELEASE_READY,
  buildFishingLodgesDirectoryJsonLd,
} from "@/lib/fishingLodgesConfig";
import { LFSE_SITE_URL } from "@/lib/structuredData";
import { getPublicSoutheastAlaskaFishingLodgesSnapshot } from "../../../../../lib/dcc/shared/southeastAlaskaFishingLodgesData";
import styles from "./fishing-lodges.module.css";

export const metadata: Metadata = {
  title:
    "Southeast Alaska Fishing Lodges, Basecamps & Private Stays — Independent Directory",
  description:
    "Compare 16 source-backed Southeast Alaska fishing lodges, DIY boat-and-lodging basecamps, and whole-lodge private stays across Juneau, Sitka, Elfin Cove, Gustavus, Petersburg, Ketchikan, and Prince of Wales Island.",
  alternates: { canonical: SEAK_FISHING_LODGES_CANONICAL_URL },
  robots: {
    index: SEAK_FISHING_LODGES_RELEASE_READY,
    follow: SEAK_FISHING_LODGES_RELEASE_READY,
  },
  openGraph: {
    title:
      "Southeast Alaska Fishing Lodges Directory | Whole-Trip Access, Scoped Rates & Sources",
    description:
      "Independent $0-inclusion directory comparing Southeast Alaska fishing lodges, gateway floatplane/ferry connections, scoped package inclusions, and non-fishing companion options.",
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
  searchParams?: Promise<{ compare?: string | string[] }>;
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

  const snapshot = getPublicSoutheastAlaskaFishingLodgesSnapshot();
  const lodges = snapshot.lodges;
  const jsonLd = buildFishingLodgesDirectoryJsonLd(lodges);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Independent Directory Hero */}
      <section className={`hero ${styles.noPrint}`}>
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
            Independent Southeast Alaska Directory · $0 Free Operator Inclusion
          </p>
          <h1>
            Southeast Alaska Fishing Lodges, Basecamps &amp; Whole-Lodge Stays
          </h1>
          <p className="lead" style={{ color: "#e4f1f4", maxWidth: 880 }}>
            Built for travelers comparing the <strong>entire trip</strong>—not just
            a list of business names. Whether four of you want five nights in July
            with two dedicated anglers and two companions looking for wildlife and
            kayaking, compare physical properties, operating companies, gateway
            floatplane or boat connections, scoped package rates, and non-fishing
            options side by side.
          </p>

          <div className={styles.heroMetaStrip}>
            <span className={styles.heroPill}>
              {snapshot.counts.totalPublishedProperties} Source-Backed Properties
            </span>
            <span className={styles.heroPill}>
              {snapshot.counts.individualRoomOrCabinProperties} Individual Room / Cabin
              Stays
            </span>
            <span className={styles.heroPill}>
              {snapshot.counts.wholeLodgePrivateProperties} Whole-Lodge Private Stay
            </span>
            <span className={styles.heroPill}>
              Compare up to 4 Side by Side + Printable PDF
            </span>
          </div>
        </div>
      </section>

      {/* 2. Four-Pillar Editorial & Truthfulness Standard */}
      <section className={`${styles.trustBanner} ${styles.noPrint}`}>
        <div className="shell">
          <div className={styles.trustGrid}>
            <div className={styles.trustItem}>
              <strong>1. Free Basic Inclusion ($0 Forever)</strong>
              Properties are listed on verified public facts whether or not the
              operator participates, with direct links to official booking and
              inquiry channels.
            </div>
            <div className={styles.trustItem}>
              <strong>2. Separate Property, Operator &amp; Seller Roles</strong>
              We distinguish physical lodging from package sellers, boat rentals,
              and separately arranged guides or catering (such as Fish Baranof +
              Longliner Lodge, or Boardwalk&apos;s whole-property model).
            </div>
            <div className={styles.trustItem}>
              <strong>3. Scoped Rates Only — Zero Synthetic Totals</strong>
              Package prices appear strictly with their published season, nights,
              and occupancy basis alongside excluded charges requiring a quote.
            </div>
            <div className={styles.trustItem}>
              <strong>4. Identity Claim ≠ Automatic Fact Approval</strong>
              Claiming a page verifies company contact control only; every factual
              update requires primary-source review before publication.
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
          />
        </div>
      </section>

      {/* 4. Contextual Alaska Ecosystem Connections (LFSE, JFD, Cruise Promenade) */}
      <section
        className={`section ${styles.noPrint}`}
        id="ecosystem-connections"
        style={{
          background: "#ffffff",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Connect Your Lodge Stay to the Rest of Your Trip
          </p>
          <h2>
            Gateway Overnight Buffers, Flight Weather &amp; Ferry Connections
          </h2>
          <p className="lead" style={{ color: "var(--muted)", maxWidth: 840 }}>
            Coordinates locate a property; gateway air, harbor, and weather buffers
            determine whether your trip actually works. Connect lodge logistics with
            our companion Southeast Alaska planning guides:
          </p>

          <div className="lfse-cards-grid" style={{ marginTop: 22 }}>
            <div className="card">
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Juneau Gateway Stays (LFSE)
              </span>
              <h3 style={{ marginTop: 10 }}>
                Weekend in Juneau: Pre- &amp; Post-Lodge Buffer Nights
              </h3>
              <p>
                Fly-in lodges on Admiralty Island, Shelter Island, and Chichagof
                Island frequently recommend arriving in Juneau a day early. Compare
                Downtown vs. Mendenhall Valley stays, glacier treks, and evening
                dining.
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
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Air Access &amp; Flightseeing (Juneau Flight Deck)
              </span>
              <h3 style={{ marginTop: 10 }}>
                Floatplane Ceilings, Weight Rules &amp; Helicopter Add-Ons
              </h3>
              <p>
                Review Southeast Alaska VFR cloud-ceiling weather holds, passenger +
                baggage weight rules, and pre/post-trip Juneau Icefield helicopter
                options before locking tight commercial airline connections.
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
                  Juneau Flight Weather Guide ↗
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
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Independent Ferry &amp; Multi-Town Routing (Cruise Promenade)
              </span>
              <h3 style={{ marginTop: 10 }}>
                Cruise Alaska Without a Cruise Ship
              </h3>
              <p>
                Pair a Sitka, Gustavus, Juneau, Petersburg, or Ketchikan fishing
                stay with Alaska Marine Highway System ferries, Goldbelt fast
                catamarans, and commuter flights across the Inside Passage.
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
                  Printable 9-Night Example Journey ↗
                </a>
              </div>
            </div>
          </div>

          <div
            className="chips"
            style={{ marginTop: 20, alignItems: "center" }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
              Gateway Port &amp; Community Guides:
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
        </div>
      </section>

      {/* 5. Market Context, Methodology & Sources */}
      <section className={`section ${styles.noPrint}`} id="methodology-and-sources">
        <div className="shell">
          <details
            className="lfse-sources-details"
            open
            data-testid="fishing-lodges-methodology-and-sources"
          >
            <summary>Methodology, Market Context &amp; Primary Sources</summary>
            <div className="lfse-sources-body">
              <p style={{ margin: "0 0 10px" }}>
                <strong>How this directory fits the market:</strong> Several
                established directories already serve Alaska angling travelers—including{" "}
                <a
                  href="https://www.fishlodges.com/lodges"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "underline" }}
                >
                  Fishlodges
                </a>{" "}
                (advertising 246 lodges across Alaska, BC, and other regions),{" "}
                <a
                  href="https://alaskafishingmatch.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "underline" }}
                >
                  Alaska Fishing Match
                </a>
                , and{" "}
                <a
                  href="https://www.alaskafieldguide.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "underline" }}
                >
                  The Alaska Field Guide
                </a>{" "}
                (advertising 226 Alaska wilderness lodges). Those counts are
                published directory claims rather than an independently verified
                census of active Alaska lodges. Our focus in Southeast Alaska is
                claim-by-claim primary-source citations, clear separation between
                physical lodging and package sellers, honest handling of unknowns,
                and direct connection to gateway flight, harbor, and ferry planning.
              </p>
              <p style={{ margin: "0 0 10px" }}>
                <strong>Primary-source retrieval date:</strong> 2026-11-19. Every
                published lodge in this Preview passed fail-closed publication
                checks requiring at least 3 page-level claim citations across at
                least 2 distinct official URLs (a reachable homepage alone never
                verifies rates, transfers, ownership, or inclusions). Candidate
                properties with anti-bot gates, unreachable subpages, or unresolved
                domain collisions remain held out of public listings and public API
                responses pending direct verification.
              </p>
              <p style={{ margin: "0 0 10px" }}>
                <strong>Visual imagery disclosure:</strong> Until operators opt in
                to supply licensed property photography, cards display public-domain
                and Creative Commons Southeast Alaska waterway photography documented
                in <code>public/images/SOURCES.md</code>, explicitly labeled{" "}
                <em>&ldquo;Regional Waterway Context · Not a Property Photo.&rdquo;</em>
              </p>
              <p style={{ margin: "0 0 10px" }}>
                <strong>Canonical DCC snapshot endpoint:</strong>{" "}
                <a
                  href={DCC_ALASKA_FISHING_LODGES_API_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Destination Command Center Southeast Alaska Fishing Lodges API ↗
                </a>
              </p>
              <TrustDisclosure compact />
            </div>
          </details>
        </div>
      </section>
    </main>
  );
}
