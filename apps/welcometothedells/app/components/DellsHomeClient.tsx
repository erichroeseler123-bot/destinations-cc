"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ACTION_CARDS,
  DCC_DELLS_MASTER_PLAN_URL,
  FEASTLY_DELLS_URL,
  getActionsForHub,
  HUBS,
  RIVER_OPS_TERMINAL,
  type ActionCard,
  type HubId,
  type RiverOpsCard,
} from "@/lib/content";
import { trackDellsEvent } from "@/lib/telemetry";
import { LandingTracker } from "./LandingTracker";

const HUB_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=82";
const ROAD_IMAGE =
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=82";

function ActionCardView({ card, selectedHub }: { card: ActionCard; selectedHub: HubId }) {
  const isExecution = card.handoffType === "controlled_execution" || card.handoffType === "marketplace_fallback";
  const eventName = isExecution ? "product_opened" : card.handoffType === "owned_execution" ? "support_opened" : "next_stop_viewed";

  return (
    <a
      className="action-card"
      href={card.href}
      onClick={() => {
        trackDellsEvent(eventName, {
          corridor: "wisconsin-dells-next-stop",
          hub_id: selectedHub,
          card_id: card.id,
          clicked_product_slug: card.id,
          decision_product: card.id,
          decision_option: selectedHub,
          decision_action: card.handoffType,
          decision_cta: card.ctaLabel,
          target_path: card.href,
          route_target: card.handoffType,
          fit_signal: card.label,
        });
      }}
    >
      <span className={`card-chip card-chip--${card.handoffType}`}>{card.label}</span>
      <h3>{card.title}</h3>
      <p>{card.body}</p>
      <dl className="logistics-list">
        <div>
          <dt>Parking</dt>
          <dd>{card.parkingFriction}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{card.timeCommitment}</dd>
        </div>
      </dl>
      <p className="escape-route">{card.escapeRoute}</p>
      <span className="text-button">{card.ctaLabel}</span>
    </a>
  );
}

function RiverOpsCardView({ card }: { card: RiverOpsCard }) {
  return (
    <a
      className="river-card"
      href={card.href}
      onClick={() => {
        trackDellsEvent("product_opened", {
          corridor: "wisconsin-dells-river-ops",
          card_id: card.slug,
          clicked_product_slug: card.slug,
          decision_product: card.slug,
          decision_option: card.category,
          decision_action: "controlled_execution",
          execution_tier: "controlled_partner_execution",
          decision_cta: card.ctaLabel,
          target_path: card.href,
          route_target: "river_ops_terminal",
          fit_signal: card.intensity,
        });
      }}
    >
      <span className="river-rank">{card.rank}</span>
      <div className="river-image" aria-hidden="true">
        <Image
          src={card.imageUrl}
          alt={card.imageAlt}
          fill
          placeholder="blur"
          blurDataURL={card.blurDataURL}
          sizes="(max-width: 820px) 100vw, 280px"
        />
      </div>
      <div>
        <p className="river-category">{card.category.replace("-", " ")}</p>
        <h3>{card.title}</h3>
        <p>{card.loungeIntel}</p>
      </div>
      <dl>
        <div>
          <dt>Signal</dt>
          <dd>{card.intensity}</dd>
        </div>
        <div>
          <dt>Path</dt>
          <dd>{card.commissionPath}</dd>
        </div>
      </dl>
      <strong>{card.ctaLabel}</strong>
    </a>
  );
}

export default function DellsHomeClient() {
  const [selectedHub, setSelectedHub] = useState<HubId>("downtown-broadway");
  const hub = HUBS.find((candidate) => candidate.id === selectedHub) || HUBS[0];
  const actions = getActionsForHub(selectedHub);

  return (
    <main>
      <LandingTracker source="homepage" />
      <section className="hero-section">
        <div className="hero-media" aria-hidden="true">
          <Image src={HUB_IMAGE} alt="" fill priority sizes="100vw" />
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Welcome to the Dells</p>
          <h1>Start with the river. Solve group food before restaurant chaos.</h1>
          <p>
            Welcome to the Dells narrows the messy Wisconsin Dells choice set: controlled River Ops first, Feastly food
            drops for rental-house groups, and fallback inventory only when the primary path does not fit.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#river-ops">
              Open River Ops
            </a>
            <a className="secondary-button" href="/lounge">
              Read The Lounge
            </a>
          </div>
        </div>
      </section>

      <section className="section-shell river-terminal" id="river-ops">
        <div className="section-heading">
          <p className="eyebrow">River Ops Terminal</p>
          <h2>The deterministic river path is the canyon.</h2>
          <p>
            These cards are not broad search links. Each one routes to a specific operator ticket hub or product endpoint.
            The Viator lane stays below as fallback coverage when controlled execution does not fit.
          </p>
        </div>
        <div className="river-grid">
          {RIVER_OPS_TERMINAL.map((card) => (
            <RiverOpsCardView card={card} key={card.slug} />
          ))}
        </div>
        <div className="group-trigger">
          <div>
            <p className="eyebrow">Group multiplier</p>
            <h3>Eight or more people changes the play.</h3>
            <p>
              Large rental-house groups should not split into three cars to solve breakfast or dinner. Route them to Feastly
              owned execution before the group turns into restaurant traffic.
            </p>
          </div>
          <div className="group-actions">
            <a
              href={`${FEASTLY_DELLS_URL}?utm_source=welcometothedells&utm_medium=satellite&utm_campaign=dells-river-ops-group-trigger`}
              onClick={() => {
                trackDellsEvent("support_opened", {
                  corridor: "wisconsin-dells-group-trigger",
                  clicked_product_slug: "feastly-dells-food-drop",
                  decision_product: "feastly-dells-food-drop",
                  decision_action: "owned_execution",
                  decision_cta: "Bring food to the rental",
                  target_path: FEASTLY_DELLS_URL,
                  execution_tier: "owned_execution",
                });
              }}
            >
              Bring food to the rental
            </a>
            <a
              href={DCC_DELLS_MASTER_PLAN_URL}
              onClick={() => {
                trackDellsEvent("support_opened", {
                  corridor: "wisconsin-dells-master-plan",
                  clicked_product_slug: "dcc-dells-master-plan",
                  decision_product: "dcc-dells-master-plan",
                  decision_action: "dcc",
                  decision_cta: "Build a 72-hour ops plan",
                  target_path: DCC_DELLS_MASTER_PLAN_URL,
                });
              }}
            >
              Build a 72-hour ops plan
            </a>
          </div>
        </div>
      </section>

      <section className="mission-strip" id="roadside-rules" aria-label="Operating rules">
        <div>
          <strong>One decision.</strong>
          <span>Choose the hub before choosing the attraction.</span>
        </div>
        <div>
          <strong>One parking move.</strong>
          <span>Avoid repeatedly crossing Hwy 12 or circling Broadway.</span>
        </div>
        <div>
          <strong>One escape route.</strong>
          <span>Every stop needs a cleaner backup when crowds spike.</span>
        </div>
      </section>

      <section className="section-shell" id="next-stop">
        <div className="section-heading">
          <p className="eyebrow">Hub navigator</p>
          <h2>Where are you right now?</h2>
          <p>
            Use geography only after the river decision is handled. Select the hub that matches your current location or mood.
          </p>
        </div>
        <div className="hub-grid">
          {HUBS.map((candidate) => {
            const selected = candidate.id === selectedHub;
            return (
              <button
                className={`hub-button ${selected ? "hub-button--selected" : ""}`}
                key={candidate.id}
                type="button"
                onClick={() => {
                  setSelectedHub(candidate.id);
                  trackDellsEvent("hub_selected", {
                    corridor: "wisconsin-dells-next-stop",
                    hub_id: candidate.id,
                    decision_option: candidate.id,
                    decision_state: "hub_selected",
                    fit_signal: candidate.role,
                  });
                }}
              >
                <span>{candidate.shortName}</span>
                <strong>{candidate.role}</strong>
                <small>{candidate.oneLine}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="split-section">
        <div className="hub-brief">
          <p className="eyebrow">Current hub</p>
          <h2>{hub.name}</h2>
          <p className="lead">{hub.defaultMove}</p>
          <div className="hub-facts">
            <div>
              <span>Parking move</span>
              <strong>{hub.parking}</strong>
            </div>
            <div>
              <span>Usual time</span>
              <strong>{hub.timeCommitment}</strong>
            </div>
            <div>
              <span>Known friction</span>
              <strong>{hub.friction}</strong>
            </div>
          </div>
        </div>
        <div className="hub-map">
          <Image src={ROAD_IMAGE} alt="Roadside pull-off with forest and open road" fill sizes="(max-width: 820px) 100vw, 40vw" />
          <div className="map-label">{hub.nextStopPrompt}</div>
        </div>
      </section>

      <section className="section-shell">
        <div className="section-heading section-heading--tight">
          <p className="eyebrow">Next Stop cards</p>
          <h2>Choose one move. No browsing spiral.</h2>
        </div>
        <div className="action-grid">
          {actions.map((card) => (
            <ActionCardView card={card} key={card.id} selectedHub={selectedHub} />
          ))}
        </div>
      </section>

      <section className="section-shell support-band">
        <div>
          <p className="eyebrow">DCC support layer</p>
          <h2>Built for the messy middle of the Dells.</h2>
          <p>
            This satellite stays focused on the moment someone is in the car or on the sidewalk asking what to do next.
            Heavier planning stays in Destination Command Center; large-group rental-house food logistics route into Feastly
            as owned execution.
          </p>
        </div>
        <div className="support-actions">
          {ACTION_CARDS.filter((card) => card.handoffType === "dcc" || card.handoffType === "owned_execution")
            .slice(0, 3)
            .map((card) => (
              <a
                href={card.href}
                key={card.id}
                onClick={() => {
                  trackDellsEvent(card.handoffType === "owned_execution" ? "support_opened" : "next_stop_viewed", {
                    corridor: "wisconsin-dells-next-stop",
                    card_id: card.id,
                    clicked_product_slug: card.id,
                    decision_product: card.id,
                    decision_action: card.handoffType,
                    decision_cta: card.ctaLabel,
                    target_path: card.href,
                  });
                }}
              >
                {card.ctaLabel}
              </a>
            ))}
        </div>
      </section>
    </main>
  );
}
