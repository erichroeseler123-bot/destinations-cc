"use client";

import Image from "next/image";
import Link from "next/link";
import { RIVER_OPS_TERMINAL, FEASTLY_DELLS_URL } from "@/lib/content";
import { LandingTracker } from "./LandingTracker";
import DellsLiveNow from "./DellsLiveNow";
import { trackDellsEvent } from "@/lib/telemetry";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=82";

const BROWSE_BY_INTENT = [
  { title: "Things to do", body: "Start with the kind of day you want instead of a giant attraction directory.", href: "/things-to-do" },
  { title: "Boat tours & Ducks", body: "Compare the signature river experiences and go straight to current operator ticket paths.", href: "/boat-tours" },
  { title: "Waterparks", body: "Indoor, outdoor, resort, and day-use planning without turning the whole trip into one long pool day.", href: "/waterparks" },
  { title: "Rainy-day activities", body: "Keep the trip useful with indoor waterparks, shows, arcades, and low-weather-risk backups.", href: "/rainy-day" },
  { title: "Adults & couples", body: "River scenery, dinner, nightlife, downtown, and a slower Dells weekend.", href: "/adults" },
  { title: "Tonight", body: "Dinner, Ghost Boat, downtown, neon, and same-day after-dark ideas.", href: "/tonight" },
] as const;

const QUICK_DECISIONS = [
  { title: "First time here", body: "Start with the river, one signature attraction, and a simple downtown reset.", href: "/first-time" },
  { title: "Rainy day", body: "Indoor waterparks, shows, arcades, and low-weather-risk backups.", href: "/rainy-day" },
  { title: "With kids", body: "Pick fewer, better stops without turning the day into parking-lot logistics.", href: "/families" },
  { title: "Adults only", body: "River time, dinner, nightlife, scenic stops, and a slower Dells weekend.", href: "/adults" },
  { title: "What should we do tonight?", body: "Use the evening lane for dinner, Ghost Boat, downtown, and after-dark options.", href: "/tonight" },
  { title: "Big group", body: "Keep meals, transportation, and one anchor activity from becoming group-chat chaos.", href: "/large-groups" },
] as const;

export default function DellsHomeClient() {
  return (
    <main>
      <LandingTracker source="homepage" />

      <section className="hero-section">
        <div className="hero-media" aria-hidden="true">
          <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" />
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Wisconsin Dells trip shortcut</p>
          <h1>Do the Dells without doing everything.</h1>
          <p>
            Waterparks, Ducks, boat tours, downtown, shows, giant attractions, and too many choices. Start with the kind of day you actually want, then make one good decision at a time.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/things-to-do">Find things to do</Link>
            <Link className="secondary-button" href="/boat-tours">Compare boat tours</Link>
          </div>
        </div>
      </section>

      <DellsLiveNow />

      <section className="section-shell">
        <div className="section-heading">
          <p className="eyebrow">Browse the Dells</p>
          <h2>Start with what you actually came here for.</h2>
          <p>These are the fastest paths into the parts of Wisconsin Dells people most often need to decide between.</p>
        </div>
        <div className="action-grid">
          {BROWSE_BY_INTENT.map((item) => (
            <Link className="action-card" href={item.href} key={item.href}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <span className="text-button">Explore this</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <div className="section-heading">
          <p className="eyebrow">Pick your situation</p>
          <h2>What kind of Dells day are you trying to solve?</h2>
          <p>Already know the problem? Jump straight into the plan that matches it.</p>
        </div>
        <div className="action-grid">
          {QUICK_DECISIONS.map((item) => (
            <Link className="action-card" href={item.href} key={item.href}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <span className="text-button">Open this plan</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-shell river-terminal" id="signature">
        <div className="section-heading">
          <p className="eyebrow">Book the signature Dells experiences</p>
          <h2>If it is your first trip, start with the river.</h2>
          <p>
            Wisconsin Dells existed before the waterparks. The sandstone river scenery, Ducks, boat tours, and after-dark canyon experiences are what make the destination different from every other family-entertainment town.
          </p>
          <Link className="text-button" href="/boat-tours">Compare all river experiences</Link>
        </div>
        <div className="river-grid">
          {RIVER_OPS_TERMINAL.map((card) => (
            <a
              className="river-card"
              href={card.href}
              key={card.slug}
              onClick={() => trackDellsEvent("product_opened", {
                corridor: "wisconsin-dells-signature",
                card_id: card.slug,
                clicked_product_slug: card.slug,
                decision_product: card.slug,
                decision_option: card.category,
                decision_action: "operator",
                decision_cta: card.ctaLabel,
                target_path: card.href,
              })}
            >
              <div className="river-image" aria-hidden="true">
                <Image src={card.imageUrl} alt={card.imageAlt} fill placeholder="blur" blurDataURL={card.blurDataURL} sizes="(max-width: 820px) 100vw, 280px" />
              </div>
              <div>
                <p className="river-category">{card.category.replace("-", " ")}</p>
                <h3>{card.title}</h3>
                <p>{card.loungeIntel}</p>
              </div>
              <strong>{card.ctaLabel}</strong>
            </a>
          ))}
        </div>
      </section>

      <section className="mission-strip" aria-label="Simple Dells planning rules">
        <div><strong>Choose one anchor.</strong><span>Waterpark, river, or major attraction first.</span></div>
        <div><strong>Stay in one area.</strong><span>Do not spend the day crossing Hwy 12 for every new idea.</span></div>
        <div><strong>Keep a weather backup.</strong><span>The best Dells plan survives a storm.</span></div>
      </section>

      <section className="section-shell">
        <div className="section-heading">
          <p className="eyebrow">Three easy zones</p>
          <h2>Plan by area instead of bouncing all over town.</h2>
        </div>
        <div className="action-grid">
          <article className="action-card"><h3>Downtown & Broadway</h3><p>Walkable food, Riverwalk, classic kitsch, boat-tour staging, and easy short stops.</p><Link className="text-button" href="/downtown">Explore downtown</Link></article>
          <article className="action-card"><h3>Wisconsin Dells Parkway</h3><p>The big attractions, waterparks, signs, mini golf, and high-energy family entertainment corridor.</p><Link className="text-button" href="/parkway">Explore the Parkway</Link></article>
          <article className="action-card"><h3>Lake Delton & resort zone</h3><p>Resorts, rentals, larger groups, calmer resets, and places where staying put can be the better plan.</p><Link className="text-button" href="/lake-delton">Explore Lake Delton</Link></article>
        </div>
      </section>

      <section className="section-shell support-band">
        <div>
          <p className="eyebrow">Large rental house?</p>
          <h2>Solve the group meal before everyone gets hungry.</h2>
          <p>For a large group, the hardest Dells decision is often not the attraction. It is getting everyone fed without splitting into cars and waiting for a giant table.</p>
        </div>
        <div className="support-actions">
          <a href={`${FEASTLY_DELLS_URL}?utm_source=welcometothedells&utm_medium=referral&utm_campaign=dells-large-groups`}>See group food options</a>
          <Link href="/large-groups">Plan a large-group Dells day</Link>
        </div>
      </section>
    </main>
  );
}
