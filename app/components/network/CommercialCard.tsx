import type { CommercialCardConfig } from "./types";
import { NetworkLink } from "./NetworkLink";

const providerLabels: Record<CommercialCardConfig["providerType"], string> = {
  owned_booking: "Book direct",
  partner_handoff: "Book with partner",
  affiliate_fallback: "Compare options",
  qualified_lead: "Qualified lead",
  sponsored_operator: "Sponsored operator",
  planning_fee: "Planning fee",
  marketing_service: "Marketing service",
  white_label_widget_later: "Widget later",
  mixed: "Multiple options",
};

export function CommercialCard({ card, featured = false }: { card: CommercialCardConfig; featured?: boolean }) {
  return (
    <article
      className={`flex min-h-[390px] flex-col overflow-hidden rounded-lg border p-4 shadow-[0_20px_55px_rgba(20,55,47,0.14)] ${
        featured
          ? "border-[var(--destination-accent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.74))]"
          : "border-[var(--network-border)] bg-[var(--network-surface)]"
        }`}
    >
      <div className="-mx-1 -mt-1 mb-4 aspect-[16/10] overflow-hidden rounded-lg border border-[var(--network-border)] bg-white/60">
        {card.image ? (
          <img
            src={card.image.src}
            alt={card.image.alt}
            className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col justify-between bg-[radial-gradient(circle_at_18%_18%,var(--destination-accent-soft),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4">
            <div className="h-8 w-20 rounded-full border border-white/20 bg-white/10" />
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--destination-accent-2)]">
                {card.category}
              </div>
              <div className="mt-1 text-base font-black leading-tight text-[var(--network-text)]">
                Image coming soon
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[var(--network-border)] bg-[var(--destination-accent-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--destination-accent)]">
          {card.category}
        </span>
        <span className="rounded-full border border-[var(--network-border)] bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--network-muted)]">
          {providerLabels[card.providerType]}
        </span>
      </div>
      <h3 className="mt-4 text-2xl font-black leading-[1.02] tracking-normal text-[var(--network-text)]">
        {card.title}
      </h3>
      {card.subtitle ? (
        <p className="mt-3 text-sm font-semibold leading-7 text-[var(--network-muted)]">{card.subtitle}</p>
      ) : null}
      {card.decisionReason ? (
        <p className="mt-4 rounded-lg border border-[var(--network-border)] bg-[var(--destination-accent-soft)] p-3 text-xs font-semibold leading-6 text-[var(--network-text)]">
          {card.decisionReason}
        </p>
      ) : null}
      {card.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--network-border)] bg-white/70 px-3 py-1 text-[11px] font-bold text-[var(--network-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-4 text-xs leading-6 text-[var(--network-muted)]">{card.disclosure}</p>
      <NetworkLink
        cta={card.cta}
        className="mt-auto inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--destination-accent-2)] px-5 text-center text-xs font-black uppercase tracking-[0.12em] text-[var(--destination-accent-text)] shadow-[0_14px_30px_rgba(143,91,24,0.16)] transition hover:bg-white"
      />
    </article>
  );
}
