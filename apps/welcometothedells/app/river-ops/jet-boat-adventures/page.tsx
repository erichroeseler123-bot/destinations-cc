import type { Metadata } from "next";
import Image from "next/image";
import {
  JET_BOAT_OPERATOR_SURFACE,
  buildOperatorSurfaceUrl,
} from "@/lib/operatorSurfaces";
import { SITE_URL } from "@/lib/content";
import OperatorSurfaceClient from "./OperatorSurfaceClient";

export const dynamic = "force-static";

const surface = JET_BOAT_OPERATOR_SURFACE;
const canonicalUrl = buildOperatorSurfaceUrl(surface);

export const metadata: Metadata = {
  title: "Jet Boat Adventures Execution Confirmation | Welcome to the Dells",
  description:
    "Execution confirmation for the Wisconsin Dells River Ops jet boat decision. Welcome to the Dells narrows the choice; Jet Boat Adventures / Ticket Hub handles ticket timing and fulfillment.",
  alternates: {
    canonical: surface.routePath,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Jet Boat Adventures Execution Confirmation",
  url: canonicalUrl,
  description:
    "Execution-adjacent confirmation surface for the Wisconsin Dells River Ops jet boat corridor.",
  isPartOf: {
    "@type": "WebSite",
    name: "Welcome to the Dells",
    url: SITE_URL,
  },
  about: {
    "@type": "Thing",
    name: "Wisconsin Dells River Ops",
  },
  mainEntity: {
    "@type": "Action",
    name: "Route traveler intent to Jet Boat ticket timing",
    actionStatus: "PotentialActionStatus",
    agent: {
      "@type": "Organization",
      name: "Destination Command Center",
    },
    provider: {
      "@type": "Organization",
      name: "Jet Boat Adventures / Ticket Hub",
    },
    object: {
      "@type": "Service",
      name: "Jet Boat Adventures ticket timing and fulfillment",
      serviceType: "Wisconsin Dells jet boat ticketing",
      areaServed: {
        "@type": "Place",
        name: "Wisconsin Dells",
      },
    },
    target: surface.outboundHref,
  },
  potentialAction: {
    "@type": "ViewAction",
    name: surface.primaryCtaLabel,
    target: surface.outboundHref,
  },
};

export default function JetBoatOperatorSurfacePage() {
  return (
    <main className="operator-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="flow-context-ribbon" aria-label="You are here">
        <div>
          <span>Corridor</span>
          <strong>Wisconsin Dells River Ops</strong>
        </div>
        <div>
          <span>Verdict</span>
          <strong>{surface.upstreamVerdict}</strong>
        </div>
        <div>
          <span>Execution</span>
          <strong>{surface.executionEntity}</strong>
        </div>
      </section>

      <section className="operator-hero" aria-labelledby="jet-boat-title">
        <div className="operator-hero__media">
          <Image
            src={surface.media.imageUrl}
            alt={surface.media.imageAlt}
            fill
            priority
            sizes="(max-width: 820px) 100vw, 58vw"
            placeholder={surface.media.blurDataURL ? "blur" : "empty"}
            blurDataURL={surface.media.blurDataURL}
          />
        </div>

        <div className="operator-hero__copy">
          <p className="eyebrow">Welcome to the Dells / River Ops</p>
          <h1 id="jet-boat-title">Jet Boat Adventures</h1>
          <p className="operator-verdict">{surface.upstreamVerdict}</p>
          <p>
            DCC and Welcome to the Dells have narrowed the River Ops decision.
            Jet Boat Adventures / Ticket Hub handles ticket timing and
            fulfillment.
          </p>
          <OperatorSurfaceClient surface={surface} />
        </div>
      </section>

      <section className="operator-grid" aria-label="Jet boat confirmation details">
        <article className="operator-confirmation">
          <p className="eyebrow">Why this lane</p>
          <h2>The fast canyon move is already selected.</h2>
          <p>
            {surface.userIntentProblem} This page confirms the execution owner
            before the ticket handoff, so the decision does not reopen into a
            generic attraction list.
          </p>
        </article>

        <article className="operator-next">
          <p className="eyebrow">What happens next</p>
          <ol>
            <li>Continue to the ticket hub.</li>
            <li>Check available jet boat times.</li>
            <li>Finish timing and seats with the fulfillment operator.</li>
          </ol>
        </article>
      </section>
    </main>
  );
}
