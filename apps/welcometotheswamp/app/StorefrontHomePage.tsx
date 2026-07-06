import type {
  CategoryGridConfig,
  CommercialCardConfig,
  NetworkCommercialPageConfig,
  ProviderDisclosureConfig,
  TrustStripConfig,
} from "@/app/components/network/types";

function StorefrontLink({
  href,
  label,
  className,
  external = false,
}: {
  href: string;
  label: string;
  className: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      className={className}
      target={external ? "_blank" : undefined}
      rel={external ? "sponsored noopener noreferrer" : undefined}
    >
      {label}
    </a>
  );
}

function TrustBadges({ config }: { config?: TrustStripConfig }) {
  if (!config?.items.length) return null;

  return (
    <section className="wts-trust-strip" aria-label="Why book with Welcome to the Swamp">
      {config.items.map((item) => (
        <article className="wts-trust-badge" key={item.id}>
          <strong>{item.label}</strong>
          <span>{item.body}</span>
        </article>
      ))}
    </section>
  );
}

function TourCard({ card }: { card: CommercialCardConfig }) {
  return (
    <article className="wts-tour-card">
      {card.image ? (
        <div className="wts-tour-image">
          <img src={card.image.src} alt={card.image.alt} loading="lazy" />
        </div>
      ) : null}
      <div className="wts-tour-copy">
        <div className="wts-card-topline">{card.category}</div>
        <h3>{card.title}</h3>
        {card.subtitle ? <p>{card.subtitle}</p> : null}
        {card.decisionReason ? <div className="wts-best-for">{card.decisionReason}</div> : null}
        {card.tags?.length ? (
          <div className="wts-chip-row">
            {card.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
        <p className="wts-provider-note">{card.disclosure}</p>
        <StorefrontLink
          href={card.cta.href}
          label={card.cta.label}
          external={card.cta.external}
          className="wts-button wts-button-card"
        />
      </div>
    </article>
  );
}

function CategoryLinks({ config }: { config?: CategoryGridConfig }) {
  if (!config?.items.length) return null;

  return (
    <section className="wts-section wts-lanes" aria-labelledby="wts-lanes-title">
      <div className="wts-section-head">
        <p className="wts-eyebrow">{config.eyebrow}</p>
        <h2 id="wts-lanes-title">{config.title}</h2>
        {config.body ? <p>{config.body}</p> : null}
      </div>
      <div className="wts-lane-grid">
        {config.items.map((item) => (
          <article className="wts-lane-card" key={item.id}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            <StorefrontLink href={item.cta.href} label={item.cta.label} className="wts-text-link" />
          </article>
        ))}
      </div>
    </section>
  );
}

function ProviderDisclosure({ config }: { config?: ProviderDisclosureConfig }) {
  if (!config) return null;

  return (
    <section className="wts-disclosure" aria-labelledby="wts-disclosure-title">
      <div>
        <p className="wts-eyebrow">Booking clarity</p>
        <h2 id="wts-disclosure-title">{config.label}</h2>
        <p>{config.body}</p>
      </div>
      <div className="wts-disclosure-grid">
        <div>
          <strong>What we help with</strong>
          <ul>
            {config.allowedClaims.map((claim) => (
              <li key={claim}>{claim}</li>
            ))}
          </ul>
        </div>
        <div>
          <strong>What continues on booking pages</strong>
          <ul>
            {config.notClaimed.map((claim) => (
              <li key={claim}>{claim}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function SwampStorefrontPage({ page }: { page: NetworkCommercialPageConfig }) {
  const heroImage = page.hero.media?.image;

  return (
    <main className="wts-storefront" data-page-intent="wts_storefront_home">
      <section className="wts-hero">
        <div className="wts-hero-media">
          {heroImage ? <img src={heroImage.src} alt={heroImage.alt} loading="eager" /> : null}
          <div className="wts-hero-overlay">
            <span>{page.hero.media?.eyebrow}</span>
            <strong>{page.hero.media?.title}</strong>
          </div>
        </div>
        <div className="wts-hero-copy">
          <p className="wts-eyebrow">{page.hero.eyebrow}</p>
          <h1>{page.hero.title}</h1>
          <p className="wts-hero-summary">{page.hero.summary}</p>
          <div className="wts-cta-row">
            <StorefrontLink
              href={page.hero.primaryCta.href}
              label={page.hero.primaryCta.label}
              external={page.hero.primaryCta.external}
              className="wts-button wts-button-primary"
            />
            {page.hero.secondaryCta ? (
              <StorefrontLink
                href={page.hero.secondaryCta.href}
                label={page.hero.secondaryCta.label}
                className="wts-button wts-button-secondary"
              />
            ) : null}
          </div>
          {page.hero.trustChips?.length ? (
            <div className="wts-chip-row">
              {page.hero.trustChips.map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <TrustBadges config={page.trustStrip} />

      {page.decisionBlock ? (
        <section className="wts-section wts-chooser" id="what-to-book">
          <div className="wts-section-head">
            <p className="wts-eyebrow">{page.decisionBlock.eyebrow}</p>
            <h2>{page.decisionBlock.title}</h2>
            <p>{page.decisionBlock.body}</p>
          </div>
          <div className="wts-recommendation">
            <strong>{page.decisionBlock.recommendation}</strong>
            {page.decisionBlock.supportPoints?.length ? (
              <div className="wts-chip-row">
                {page.decisionBlock.supportPoints.map((point) => (
                  <span key={point}>{point}</span>
                ))}
              </div>
            ) : null}
            {page.decisionBlock.cta ? (
              <StorefrontLink
                href={page.decisionBlock.cta.href}
                label={page.decisionBlock.cta.label}
                className="wts-text-link"
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {page.featuredCards?.length ? (
        <section className="wts-section" aria-labelledby="wts-popular-title">
          <div className="wts-section-head">
            <p className="wts-eyebrow">Popular swamp tour picks</p>
            <h2 id="wts-popular-title">Book the tour style that matches the group.</h2>
          </div>
          <div className="wts-tour-grid">
            {page.featuredCards.map((card) => (
              <TourCard key={card.id} card={card} />
            ))}
          </div>
          <div className="wts-secondary-section" style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(36, 86, 69, 0.12)" }}>
            <article className="wts-tour-card" style={{ maxWidth: "480px", margin: "0 auto" }}>
              <div className="wts-tour-copy">
                <div className="wts-card-topline">Also available</div>
                <h3>Also available: New Orleans City Tour</h3>
                <p>Want a city overview before or after the swamp? Southern Style also offers a New Orleans city tour through FareHarbor.</p>
                <div style={{ marginTop: "16px" }}>
                  <a
                    href="https://fareharbor.com/embeds/book/southernstyletours/items/51942/calendar/?asn=aktourcenter&flow=4344&ref=wts-city-tour"
                    className="wts-button wts-button-card fh-book"
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                  >
                    View City Tour
                  </a>
                </div>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <CategoryLinks config={page.categoryGrid} />
      <ProviderDisclosure config={page.providerDisclosure} />

      {page.stickyMobileCta?.enabled ? (
        <div className="wts-mobile-cta">
          <StorefrontLink
            href={page.stickyMobileCta.href}
            label={page.stickyMobileCta.label}
            external={page.stickyMobileCta.external}
            className="wts-button wts-button-primary"
          />
          {page.stickyMobileCta.disclosureLabel ? <span>{page.stickyMobileCta.disclosureLabel}</span> : null}
        </div>
      ) : null}
    </main>
  );
}
