"use client";

import { trackDellsEvent } from "@/lib/telemetry";
import { FEASTLY_DELLS_URL, riverOpsOutbound } from "@/lib/content";

type JetBoatPromo = {
  title: string;
  kicker: string;
  body: string;
  href: string;
  eventName: "product_opened" | "support_opened";
  productSlug: string;
  action: "controlled_execution" | "owned_execution";
};

const PROMOS: JetBoatPromo[] = [
  {
    title: "River Ops Bulletin",
    kicker: "High-action pick",
    body: "If the group wants the sandstone payoff without another slow browse, make the river the main event.",
    href: riverOpsOutbound("jet-boat-primary"),
    eventName: "product_opened",
    productSlug: "jet-boat-lounge-ad",
    action: "controlled_execution",
  },
  {
    title: "Classified: House Dinner",
    kicker: "Feastly owned execution",
    body: "Big rental group? Skip the split-car food problem and bring breakfast or dinner back to the house.",
    href: `${FEASTLY_DELLS_URL}?utm_source=welcometothedells&utm_medium=satellite&utm_campaign=dells-lounge-feastly-ad`,
    eventName: "support_opened",
    productSlug: "feastly-dells-lounge-ad",
    action: "owned_execution",
  },
];

export function JetBoatPromos() {
  return (
    <aside className="lounge-ads" aria-label="River Ops display ads">
      {PROMOS.map((promo) => (
        <a
          className="lounge-ad"
          href={promo.href}
          key={promo.title}
          onClick={() => {
            trackDellsEvent(promo.eventName, {
              corridor: "wisconsin-dells-lounge",
              card_id: promo.productSlug,
              clicked_product_slug: promo.productSlug,
              decision_product: promo.productSlug,
              decision_option: "lounge",
              decision_action: promo.action,
              decision_cta: promo.title,
              target_path: promo.href,
              route_target: promo.action === "controlled_execution" ? "river_ops_terminal" : "feastly_owned_execution",
              execution_tier:
                promo.action === "controlled_execution" ? "controlled_partner_execution" : "owned_execution",
              fit_signal: promo.kicker,
            });
          }}
        >
          <span>{promo.kicker}</span>
          <strong>{promo.title}</strong>
          <p>{promo.body}</p>
          <em>Check river options</em>
        </a>
      ))}
    </aside>
  );
}
