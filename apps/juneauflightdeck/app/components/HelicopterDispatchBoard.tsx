'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ViatorFeaturedTours from './ViatorFeaturedTours';

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

  const defaultHeadline = isSkagway
    ? 'Match Your Skagway Glacier Flight to Your Ship Schedule'
    : 'Compare Juneau Helicopter Tours';

  const defaultSubhead = isSkagway
    ? 'Compare Skagway glacier helicopter operators, review ship-safe return buffers, and plan your weather backup.'
    : 'Explore TEMSCO, Coastal, and NorthStar tours, plus cancellation guidance and planned backup options.';

  const defaultPrimaryCta = isSkagway ? 'Compare Skagway Flights' : 'Compare Helicopter Tours';

  const finalHeadline = headline || defaultHeadline;
  const finalSubhead = subhead || defaultSubhead;
  const finalPrimaryCta = primaryCtaLabel || defaultPrimaryCta;

  return (
    <div className="jfd-root">
      {/* Service Status Bar */}
      <div className="jfd-prototype-ribbon">
        <div className="jfd-prototype-ribbon-inner">
          <div>
            <span
              className="jfd-badge-prototype"
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#86efac',
                borderColor: 'rgba(34, 197, 94, 0.4)',
              }}
            >
              ACTIVE SERVICE
            </span>
            <span style={{ marginLeft: 8, marginRight: 16 }}>
              Availability watch &amp; waitlist seat monitoring are active and operating daily.
            </span>
            <span className="jfd-badge-planned">PLANNED FEATURE</span>
            <span style={{ marginLeft: 8 }}>
              Single-charge payment transfer for weather cancellations is currently in prototype testing.
            </span>
          </div>
        </div>
      </div>

      {/* 1. Concise Hero Section */}
      <section className="jfd-concise-hero">
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

        {/* Hybrid Trust & Viator Partnership Bar */}
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
            <span><strong>Official Viator Partner:</strong> Tripadvisor partner booking &amp; direct operator options</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: 'var(--ice)', fontWeight: 800 }}>✓</span>
            <span><strong>All 3 FAA Part 135 Operators:</strong> TEMSCO, Coastal &amp; NorthStar</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: '#86efac', fontWeight: 800 }}>✓</span>
            <span><strong>Local Coordination:</strong> Daily waitlist sweeps &amp; weather backups</span>
          </div>
        </div>
      </section>

      {/* Featured Flights & Real-Time Filter Toolbar */}
      <ViatorFeaturedTours
        showHeader={false}
        headline={isSkagway ? "Skagway Glacier Helicopter Options" : "Juneau Glacier Helicopter Flights & Landings"}
        subhead={
          isSkagway
            ? "Compare live helicopter tours in Skagway with Part 135 safety standards and free 24-hour cancellation."
            : "Explore Juneau glacier landings, dog sledding camps, and ice treks. Real-time availability confirmed in the official Viator calendar."
        }
      />

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
              <h2 className="jfd-compact-card-title">Weather Monitoring</h2>
              <p className="jfd-compact-card-body">
                Glacier microclimates cause cancellations during low ceiling or fog events. Our local ground team tracks flight clearances daily.
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
                Cruise-Safe Whale Backup
              </h2>
              <p className="jfd-compact-card-body">
                If weather grounds your flight, seamlessly pivot to available whale watching boats so you never miss your port day in Juneau.
              </p>
            </div>
            <Link
              href={isSkagway ? '/skagway/helicopter' : '/juneau-whale-watching-tours'}
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
                  <Link
                    href="/helicopter"
                    className="button button-card"
                    style={{ whiteSpace: 'nowrap' }}
                    aria-label="View Flights - TEMSCO Helicopters"
                  >
                    View Flights
                  </Link>
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
                        Icefield Landing &amp; Walkabout
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        Taku Glacier Lodge Combos
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text)' }}>Herbert, Taku Icefield</td>
                <td style={{ color: 'var(--muted)' }}>Juneau North Airport Ramp</td>
                <td>
                  <Link
                    href="/juneau/helicopter"
                    className="button button-card"
                    style={{ whiteSpace: 'nowrap' }}
                    aria-label="View Flights - Coastal Helicopters"
                  >
                    View Flights
                  </Link>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="jfd-op-name">NorthStar Trekking</span>
                  <span className="jfd-op-sub">Small-Group Glacier Hiking</span>
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
                        Glacier Ice Trek &amp; Climb
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        Level 1–3 Technical Glacier Hiking
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text)' }}>Mendenhall Glacier High Ice</td>
                <td style={{ color: 'var(--muted)' }}>Juneau Industrial Heliport</td>
                <td>
                  <Link
                    href="/juneau-dogsled-helicopter-tours"
                    className="button button-card"
                    style={{ whiteSpace: 'nowrap' }}
                    aria-label="View Treks - NorthStar Trekking"
                  >
                    View Treks
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3.5 The Local Advantage / Beyond Raw Inventory */}
      <section className="jfd-advantage-section" style={{ maxWidth: 'var(--content)', margin: '0 auto 40px', padding: '0 20px' }}>
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--line-strong)',
            borderRadius: 'var(--radius-lg)',
            padding: '36px 32px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              color: 'var(--accent)',
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            The Local Difference
          </div>
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 3.2vw, 2.3rem)',
              fontWeight: 900,
              margin: '0 0 16px',
              color: 'var(--text)',
              lineHeight: 1.25,
            }}
          >
            Juneau Flight Deck combines online booking with people who know how to work directly with the local operators.
          </h2>
          <p
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: 'var(--muted)',
              margin: '0 0 24px',
              maxWidth: '920px',
            }}
          >
            We help you compare and book flights with the same three helicopter companies everyone else uses. Whether booking through our official Viator partner checkout or directly with operators, you get real-time availability and standard operator cancellation terms—while avoiding the cruise ship’s marked-up excursion pricing.
          </p>

          <div
            style={{
              background: 'rgba(3, 14, 23, 0.7)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md)',
              padding: '24px 26px',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)', margin: '0 0 10px' }}>
              Our advantage is what we do beyond that inventory.
            </h3>
            <p style={{ fontSize: '0.98rem', lineHeight: 1.65, color: 'var(--text)', margin: '0 0 14px' }}>
              We live here, do this for a living, know the operators and local conditions, and know when a phone call might uncover an option the website doesn’t show—such as asking whether a sixth passenger seat can be released for a lighter group based on aircraft weight and balance.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginTop: '16px',
              }}
            >
              <div
                style={{
                  background: 'rgba(7, 24, 36, 0.6)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px 18px',
                }}
              >
                <div style={{ color: 'var(--ice)', fontWeight: 800, fontSize: '0.78rem', marginBottom: 6 }}>
                  SOLD-OUT DATES
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--muted)' }}>
                  Our automated scanner sweeps operator inventories every morning at 10:00 AM when cancellation desks process changes. When matching seats open up, we alert you immediately or place a hold where cancellation policies permit.
                </p>
              </div>

              <div
                style={{
                  background: 'rgba(7, 24, 36, 0.6)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px 18px',
                }}
              >
                <div style={{ color: 'var(--ice)', fontWeight: 800, fontSize: '0.78rem', marginBottom: 6 }}>
                  CANCELLATION &amp; WEATHER PIVOTS
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--muted)' }}>
                  For anyone booking through us, we provide honest advice beforehand and actively help find another available activity (such as whale watching) if mountain weather scrubs your flight.
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <span style={{ color: 'var(--accent-strong)', fontWeight: 700, fontSize: '1rem' }}>
              Customers are booking both the tour and our local expertise, relationships, and follow-through.
            </span>
            <Link
              href="/helicopter-waitlist"
              className="button button-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              Join the Availability Watch &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 4. How It Works (3 Short Steps) */}
      <section className="jfd-steps-section">
        <div className="jfd-section-head">
          <h2>How It Works</h2>
          <p>Streamlined coordination from initial reservation to dock return.</p>
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
            <h3 className="jfd-step-title">Monitor Glacier Operations</h3>
            <p className="jfd-step-desc">
              We track FAA airport observations and operator dispatch updates on tour day as coastal microclimates develop.
            </p>
          </div>

          <div className="jfd-step-card">
            <div className="jfd-step-number">STEP 03</div>
            <h3 className="jfd-step-title">Fly or Explore Backups</h3>
            <p className="jfd-step-desc">
              If the operator cancels due to weather, receive a standard full refund or explore backup whale-watching tours based on available capacity.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Expandable Deep-Dives: Weather, Payments, & FAQs */}
      <section className="jfd-details-section" id="details-accordion">
        <div className="jfd-section-head">
          <h2>Operational Realities &amp; Policies</h2>
          <p>Detailed technical explanations regarding Southeast Alaska weather, payment handling, and cruise timing.</p>
        </div>

        <div className="jfd-details-wrap">
          {/* Weather Realities */}
          <details className="jfd-details" id="weather-mechanics">
            <summary className="jfd-summary">
              <span>Airport Weather vs. Glacier Microclimates</span>
              <span>&darr;</span>
            </summary>
            <div className="jfd-details-content">
              <p>
                A sunny, clear forecast at Juneau International Airport (PAJN) does not ensure that helicopters can reach the icefield. Helicopter operations require Visual Flight Rules (VFR) through mountain passes.
              </p>
              <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                <li>
                  <strong>Terminal Aerodrome Forecasts (TAF):</strong> PAJN observations reflect sea-level conditions at the airport.
                </li>
                <li>
                  <strong>Mountain Microclimates:</strong> Passes leading to Mendenhall, Herbert, and Norris Glaciers can experience cloud ceilings below 1,000 feet, sudden downsloping wind shears, or dense fog while downtown Juneau remains pleasant.
                </li>
                <li>
                  <strong>Flight Safety Determinations:</strong> Only the operating chief pilot and dispatch make the final call on weather go/no-go decisions, usually finalized 45–90 minutes prior to lift.
                </li>
              </ul>
            </div>
          </details>

          {/* Payment Mechanics */}
          <details className="jfd-details" id="payment-mechanics">
            <summary className="jfd-summary">
              <span>
                Proposed Same-Charge Backup Mechanics <span className="jfd-badge-planned">PLANNED</span>
              </span>
              <span>&darr;</span>
            </summary>
            <div className="jfd-details-content">
              <p>
                When an operator cancels due to weather, their standard policy is to issue a 100% refund. Because credit card issuers typically take several business days to return those funds, we are designing a feature allowing guests to opt to apply their original payment directly toward an available water tour, with any difference credited back.
              </p>
              <div
                style={{
                  background: 'rgba(3, 14, 23, 0.6)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  marginTop: 8,
                }}
              >
                <strong style={{ color: 'var(--accent)' }}>Proposed Workflow (Under Evaluation):</strong>
                <p style={{ margin: '6px 0' }}>
                  Under this planned feature, rather than paying out-of-pocket for an alternate tour while waiting for an operator refund to clear, eligible guests would have the option to apply their initial payment toward an available water tour, with any difference credited back.
                </p>
                <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.78rem' }}>
                  Notice: Bank posting times vary by financial institution. Same-charge backup transfer is a proposed workflow currently in testing with merchant processors and is not yet active.
                </p>
              </div>
            </div>
          </details>

          {/* Frequently Asked Questions */}
          <details className="jfd-details">
            <summary className="jfd-summary">
              <span>Frequently Asked Questions</span>
              <span>&darr;</span>
            </summary>
            <div className="jfd-details-content">
              <div style={{ marginBottom: 14 }}>
                <h4 style={{ color: 'var(--text)', margin: '0 0 4px', fontSize: '0.9rem' }}>
                  What happens if my cruise ship misses Juneau or arrives late?
                </h4>
                <p style={{ margin: 0 }}>
                  If your ship bypasses Juneau or alters port hours so that your flight cannot proceed, standard operator policy provides a 100% refund.
                </p>
              </div>
              <div style={{ marginBottom: 14 }}>
                <h4 style={{ color: 'var(--text)', margin: '0 0 4px', fontSize: '0.9rem' }}>
                  Are whale-watching backup seats guaranteed?
                </h4>
                <p style={{ margin: 0 }}>
                  No. Backup options depend on daily boat capacity and availability. If morning flights are grounded, coordinators help identify open seats on local Auke Bay whale-watching charters.
                </p>
              </div>
              <div>
                <h4 style={{ color: 'var(--text)', margin: '0 0 4px', fontSize: '0.9rem' }}>
                  Can I request a full refund instead of the backup tour?
                </h4>
                <p style={{ margin: 0 }}>
                  Yes. If your helicopter excursion is cancelled by the operator for safety or weather reasons, you are entitled to a 100% refund back to your original payment method. The backup option is voluntary.
                </p>
              </div>
            </div>
          </details>
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
              Speak with a local flight coordinator or reserve your glacier seat today.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/helicopter" className="button button-primary">
              Browse Glacier Flights
            </Link>
            <Link href="/juneau/what-to-do-if-helicopter-tour-canceled" className="button button-secondary">
              Weather Cancellation Guide
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
