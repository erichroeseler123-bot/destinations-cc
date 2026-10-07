'use client';

import React from 'react';
import { SITE_DESCRIPTION, BOOKING_ROLES, BOOKING_BENEFITS, BOOKING_FAQS } from '@/lib/sitePositioning';
import Link from 'next/link';
import Image from 'next/image';
import ViatorFeaturedTours from './ViatorFeaturedTours';
import HelicopterArrival from './HelicopterArrival';
import arrivalStyles from './HelicopterArrival.module.css';

type PortSlug = 'juneau' | 'skagway';

export interface HelicopterDispatchBoardProps {
  portSlug?: PortSlug;
  sourcePage?: string;
  headline?: string;
  subhead?: string;
  primaryCtaLabel?: string;
}

export default function HelicopterDispatchBoard({
  portSlug = 'juneau',
  sourcePage = '/',
  headline,
  subhead,
  primaryCtaLabel,
}: HelicopterDispatchBoardProps) {
  const isSkagway = portSlug === 'skagway';
  const showArrivalHero = sourcePage === '/' && !isSkagway;

  const defaultHeadline = isSkagway
    ? 'Match Your Skagway Glacier Flight to Your Ship Schedule'
    : 'Compare & Book Juneau Helicopter & Glacier Excursions';

  const defaultSubhead = isSkagway
    ? 'Compare Skagway glacier helicopter operators, review ship-safe return buffers, and plan your weather backup.'
    : SITE_DESCRIPTION;

  const defaultPrimaryCta = isSkagway ? 'Compare Skagway Flights' : 'Find Your Tour';

  const finalHeadline = headline || defaultHeadline;
  const finalSubhead = subhead || defaultSubhead;
  const finalPrimaryCta = primaryCtaLabel || defaultPrimaryCta;

  return (
    <div className="jfd-root">
      {/* 1. Concise Hero Section */}
      <section className={`jfd-concise-hero ${showArrivalHero ? arrivalStyles.hero : ''}`}>
        {showArrivalHero && <>
          <Image src="/images/tours/temsco-mendenhall-glacier-walk.jpg" alt="A helicopter on the glacier beneath snow-covered Alaska mountains" fill priority sizes="100vw" className={arrivalStyles.photo} />
          <div className={arrivalStyles.scrim} />
          <HelicopterArrival />
          <a className={arrivalStyles.credit} href="https://commons.wikimedia.org/wiki/File:Helicopter,_Mendenhall_Glacier,_Alaska.jpg" target="_blank" rel="noopener noreferrer">Photo: Robert Raines · CC BY-SA 2.0</a>
        </>}
        <div className={showArrivalHero ? arrivalStyles.copy : undefined}>
        <div
          style={{
            display: 'inline-block',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: 10,
          }}
        >
          {isSkagway ? 'Skagway Glacier Flight Coordination' : 'Juneau Glacier Flight Coordination'}
        </div>
        <h1>{finalHeadline}</h1>
        <p className="jfd-concise-hero-subhead">{finalSubhead}</p>

        {/* Clear Action Buttons */}
        <div className="jfd-hero-actions-responsive">
          <a
            href="#tours"
            className="jfd-hero-btn-primary"
          >
            {finalPrimaryCta} →
          </a>
          <Link
            href="/helicopter-waitlist"
            className="jfd-hero-btn-secondary"
          >
            Sold-Out Availability Alerts
          </Link>
        </div>

        <p style={{ fontSize: '0.85rem', lineHeight: 1.55, marginTop: 20 }}>{BOOKING_ROLES}</p>

        {/* Booking benefits and channel choices */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--line)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px 24px',
            fontSize: '0.82rem',
            color: 'var(--muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: 'var(--accent)', fontWeight: 800 }}>✓</span>
            <span><strong>Booking choices:</strong> Direct operator pages &amp; Viator links</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: 'var(--ice)', fontWeight: 800 }}>✓</span>
            <span><strong>Operator comparisons:</strong> TEMSCO, Coastal &amp; NorthStar</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: '#86efac', fontWeight: 800 }}>✓</span>
            <span><strong>Cruise planning help:</strong> Pickup, port timing &amp; weather alternatives</span>
          </div>
        </div>
        </div>
      </section>

      {/* Featured Flights & Real-Time Filter Toolbar */}
      <div id="tours">
        <ViatorFeaturedTours
          showHeader={false}
          headline={isSkagway ? "Skagway Glacier Helicopter Options" : "Juneau Glacier Helicopter Flights & Landings"}
          subhead={
            isSkagway
              ? "Compare live helicopter tours in Skagway with Part 135 safety standards and free 24-hour cancellation."
              : "Explore Juneau glacier landings, dog sledding camps, and ice treks. Check current dates, prices, and terms on the selected booking page."
          }
        />
      </div>

      {/* 2. Core Service Protections */}
      <section className="jfd-cards-section" aria-label="Core Services">
        <div className="jfd-cards-grid">
          <div className="jfd-compact-card">
            <div>
              <div style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 800, marginBottom: 4 }}>
                01 · SELECTION
              </div>
              <h2 className="jfd-compact-card-title">Compare All 3 Operators</h2>
              <p className="jfd-compact-card-body">
                Direct access to TEMSCO, Coastal, and NorthStar. Compare glacier walkabouts, dog sledding, and ice treks side-by-side.
              </p>
            </div>
            <Link
              href="#operators"
              className="jfd-compact-card-action"
              aria-label="View operator specs for Juneau helicopter companies"
            >
              View operator specs &rarr;
            </Link>
          </div>

          <div className="jfd-compact-card">
            <div>
              <div style={{ color: 'var(--ice)', fontSize: '0.75rem', fontWeight: 800, marginBottom: 4 }}>
                02 · OPERATIONS
              </div>
              <h2 className="jfd-compact-card-title">Check Pickup &amp; Port Timing</h2>
              <p className="jfd-compact-card-body">
                Mountain ridge cams and pass weather signal groundings hours early. We track conditions so you aren&apos;t surprised at lift time.
              </p>
            </div>
            <Link
              href="#weather-mechanics"
              className="jfd-compact-card-action"
              aria-label="Weather realities for Southeast Alaska glacier flights"
            >
              Weather realities &rarr;
            </Link>
          </div>

          <div className="jfd-compact-card">
            <div>
              <div style={{ color: '#86efac', fontSize: '0.75rem', fontWeight: 800, marginBottom: 4 }}>
                03 · CONTINGENCY
              </div>
              <h2 className="jfd-compact-card-title">
                Proactive Alternative Backup
              </h2>
              <p className="jfd-compact-card-body">
                If weather deteriorates, we start securing alternative activities before your tour is even canceled, beating the dock rush.
              </p>
            </div>
            <Link
              href={isSkagway ? '/skagway/helicopter' : '/juneau/what-to-do-if-helicopter-tour-canceled'}
              className="jfd-compact-card-action"
              aria-label="Backup options"
            >
              Explore backup options &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Operator Comparison Table */}
      <section id="operators" className="jfd-table-section">
        <div className="jfd-section-head">
          <h2>{isSkagway ? 'Skagway Flight Operators' : 'Juneau Operator Overview'}</h2>
          <p>
            {isSkagway
              ? 'Licensed FAA Part 135 glacier helicopter flight operators serving Skagway cruise passengers.'
              : 'All 3 licensed FAA Part 135 glacier helicopter operators serving Juneau cruise passengers.'}
          </p>
        </div>

        <div className="jfd-table-wrap">
          <table className="jfd-table">
            <thead>
              <tr>
                <th scope="col">Operator</th>
                <th scope="col">Signature Excursions</th>
                <th scope="col">Glacier Locations</th>
                <th scope="col">Base Location</th>
                <th scope="col">Booking Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="jfd-op-name">TEMSCO Helicopters</span>
                  <span className="jfd-op-sub">Pioneer Juneau Operator</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        position: 'relative',
                        width: 72,
                        height: 48,
                        borderRadius: 8,
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid var(--line)',
                        backgroundColor: '#061521',
                      }}
                    >
                      <Image
                        src="https://cdn.filestackcontent.com/GyqI6elSXKklaQiP9ULd"
                        alt="TEMSCO Mendenhall Glacier landing helicopter tour in Juneau, Alaska"
                        fill
                        sizes="72px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.88rem' }}>
                        Mendenhall Glacier Landing
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        Dog Sledding on Herbert Glacier
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text)' }}>Mendenhall, Herbert</td>
                <td style={{ color: 'var(--muted)' }}>Near JNU Airport (Shuttle provided)</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                    <a
                      href="#tours"
                      className="button button-primary"
                      style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', padding: '6px 12px' }}
                      aria-label="View TEMSCO Helicopter Flights"
                    >
                      View Flights &darr;
                    </a>
                    <a
                      href="https://fareharbor.com/embeds/book/temscoair-juneau/items/214803/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-card"
                      style={{ whiteSpace: 'nowrap', fontSize: '0.76rem', padding: '4px 8px' }}
                      aria-label="Book TEMSCO Direct on FareHarbor"
                    >
                      TEMSCO Direct ↗
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="jfd-op-name">Coastal Helicopters</span>
                  <span className="jfd-op-sub">Icefield Specialist</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        position: 'relative',
                        width: 72,
                        height: 48,
                        borderRadius: 8,
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid var(--line)',
                        backgroundColor: '#061521',
                      }}
                    >
                      <Image
                        src="https://cdn.filestackcontent.com/NPg1gKoCQu6ewj2mnmsQ"
                        alt="Coastal Helicopters Juneau icefield landing excursion in Alaska"
                        fill
                        sizes="72px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.88rem' }}>
                        Icefield Landing &amp; Dog Sledding
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        Herbert Glacier Landing ($429) &amp; Dog Sled ($709)
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text)' }}>Herbert Glacier</td>
                <td style={{ color: 'var(--muted)' }}>Juneau North Airport Ramp</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                    <a
                      href="#tours"
                      className="button button-primary"
                      style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', padding: '6px 12px' }}
                      aria-label="View Coastal Helicopter Flights"
                    >
                      View Flights &darr;
                    </a>
                    <a
                      href="https://fareharbor.com/embeds/book/coastalhelicopters/items/413056/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-card"
                      style={{ whiteSpace: 'nowrap', fontSize: '0.76rem', padding: '4px 8px' }}
                      aria-label="Book Coastal Direct on FareHarbor"
                    >
                      Coastal Direct ↗
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="jfd-op-name">NorthStar Trekking</span>
                  <span className="jfd-op-sub">Glacier Walk &amp; Treks</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        position: 'relative',
                        width: 72,
                        height: 48,
                        borderRadius: 8,
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid var(--line)',
                        backgroundColor: '#061521',
                      }}
                    >
                      <Image
                        src="https://cdn.filestackcontent.com/cOhoNqnERLmiIhpPY4bu"
                        alt="NorthStar Trekking glacier ice trek and climb in Juneau, Alaska"
                        fill
                        sizes="72px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.88rem' }}>
                        Glacier Walkabout, Treks &amp; Dog Sled
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        Walkabout ($499), Trek ($549), Dogsled ($739)
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text)' }}>Mendenhall &amp; Norris Glaciers</td>
                <td style={{ color: 'var(--muted)' }}>Airport (treks); Douglas Island (dog sledding)</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                    <a
                      href="#tours"
                      className="button button-primary"
                      style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', padding: '6px 12px' }}
                      aria-label="View NorthStar Glacier Treks"
                    >
                      View Treks &darr;
                    </a>
                    <a
                      href="https://fareharbor.com/embeds/book/northstartrekking/items/116035/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-card"
                      style={{ whiteSpace: 'nowrap', fontSize: '0.76rem', padding: '4px 8px' }}
                      aria-label="Book NorthStar Direct on FareHarbor"
                    >
                      NorthStar Direct ↗
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="jfd-advantage-section" style={{ maxWidth: 'var(--content)', margin: '0 auto 40px', padding: '0 20px' }}>
        <div className="jfd-section-head">
          <h2>Why book with Juneau Flight Deck?</h2>
          <p>Make the right choice before you reach checkout.</p>
        </div>
        <div className="jfd-steps-grid">
          {BOOKING_BENEFITS.map((benefit) => (
            <article className="jfd-step-card" key={benefit.title}>
              <h3 className="jfd-step-title">{benefit.title}</h3>
              <p className="jfd-step-desc">{benefit.description}</p>
              <Link href={benefit.href}>{benefit.label} →</Link>
            </article>
          ))}
        </div>
        <p style={{ lineHeight: 1.6, marginTop: 24 }}>{BOOKING_ROLES}</p>
        <Link href="/about">More about booking with us →</Link>
      </section>

      {/* 4. How It Works (3 Short Steps) */}
      <section className="jfd-steps-section">
        <div className="jfd-section-head">
          <h2>How It Works</h2>
          <p>Compare experiences, plan your port day, and choose your booking channel.</p>
        </div>

        <div className="jfd-steps-grid">
          <div className="jfd-step-card">
            <div className="jfd-step-number">STEP 01</div>
            <h3 className="jfd-step-title">Select Your Preferred Flight</h3>
            <p className="jfd-step-desc">
              Choose your ideal flight, landing style, or glacier dog sledding tour across operators with ship-safe return buffers.
            </p>
          </div>

          <div className="jfd-step-card">
            <div className="jfd-step-number">STEP 02</div>
            <h3 className="jfd-step-title">Check Pickup &amp; Port Timing</h3>
            <p className="jfd-step-desc">
              Check the tour’s meeting point and duration against your confirmed ship schedule. Allow time for transfers and return before all-aboard.
            </p>
          </div>

          <div className="jfd-step-card">
            <div className="jfd-step-number">STEP 03</div>
            <h3 className="jfd-step-title">Complete Your Reservation</h3>
            <p className="jfd-step-desc">
              Follow the operator or Viator link shown. Select your date and party size there, review the final price and terms, and keep the provider’s confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* 4b. Weather Contingency Summary */}
      <section
        style={{
          width: 'min(calc(100% - 32px), var(--content))',
          margin: '0 auto 48px',
        }}
      >
        <div
          style={{
            background: 'rgba(3, 14, 23, 0.75)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg, 16px)',
            padding: '24px 28px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ maxWidth: 740 }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--accent, #f0b35b)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Weather Contingency &amp; Port-Day Backup
            </span>
            <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.6, color: '#e2e8f0' }}>
              If weather cancels your helicopter flight, we help you explore available alternatives that fit your remaining port time. Backup tours are optional, booked separately, and subject to availability. Refunds follow your booking&apos;s cancellation terms.
            </p>
          </div>
          <Link
            href="/juneau/what-to-do-if-helicopter-tour-canceled"
            className="button button-secondary"
            style={{ fontSize: '0.85rem', padding: '10px 18px', whiteSpace: 'nowrap' }}
          >
            Weather Cancellation Guide &rarr;
          </Link>
        </div>
      </section>

      <section className="jfd-details-section" id="details-accordion">
        <div className="jfd-section-head"><h2>Booking with Juneau Flight Deck</h2></div>
        <div className="jfd-details-wrap">
          {BOOKING_FAQS.map(({ question, answer }) => (
            <details className="jfd-details" key={question}>
              <summary className="jfd-summary">{question}</summary>
              <div className="jfd-details-content"><p>{answer}</p></div>
            </details>
          ))}
        </div>
      </section>

      {/* 6. Primary Action Footer / Contact Callout */}
      <section
        style={{
          padding: '40px 20px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            width: 'min(calc(100% - 32px), var(--content))',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 6px', color: 'var(--text)' }}>
              Ready to plan your Juneau flight?
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>
              Compare tours or ask our team for help with your port-day plans.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/helicopter" className="button button-primary">
              Browse Glacier Flights
            </Link>
            <Link href="/contact" className="button button-secondary">
              Ask Our Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
