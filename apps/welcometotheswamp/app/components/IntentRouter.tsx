import Link from "next/link";
import { INTENT_LABELS, type PageIntent, type RouteOption } from "@/lib/routing";

export function IntentRouter({
  intent,
  eyebrow = "Next step",
  title,
  summary,
  options,
}: {
  intent: PageIntent;
  eyebrow?: string;
  title: string;
  summary: string;
  options: readonly RouteOption[];
}) {
  return (
    <section className="panel router-panel" data-router-intent={intent}>
      <div className="router-head">
        <p className="eyebrow">{eyebrow}</p>
        <div className="intent-pill">Intent: {INTENT_LABELS[intent]}</div>
      </div>
      <h2>{title}</h2>
      <p className="muted">{summary}</p>
      <div className="router-grid">
        {options.map((option) => {
          const className = option.emphasis === "primary" ? "router-card router-card-primary" : "router-card";
          const content = (
            <>
              <strong>{option.title}</strong>
              <span>{option.description}</span>
            </>
          );

          const trackingProps = option.trackingId ? { "data-warm-transfer-click": option.trackingId } : {};

          return option.kind === "external" ? (
            <a key={option.title} href={option.href} className={className} {...trackingProps}>
              {content}
            </a>
          ) : (
            <Link key={option.title} href={option.href} className={className} {...trackingProps}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
