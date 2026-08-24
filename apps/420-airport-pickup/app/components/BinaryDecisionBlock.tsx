"use client";

import Link from "next/link";
import type { BinaryDecisionResult } from "@/lib/binaryDecision";

export default function BinaryDecisionBlock({
  decision,
  onChoiceClick,
}: {
  decision: BinaryDecisionResult;
  onChoiceClick?: (choiceId: string, href: string) => void;
}) {
  return (
    <section className="panel">
      <div className="eyebrow">{decision.eyebrow}</div>
      <h2 className="mt-3 text-2xl font-bold">{decision.title}</h2>
      <p className="muted">{decision.summary}</p>
      <div className="card-grid stack">
        {decision.choices.map((choice) => (
          <article key={choice.id} className="package-card">
            <div className="badge">Book now</div>
            <h3>{choice.title}</h3>
            <p className="muted">{choice.body}</p>
            {choice.bullets?.length ? (
              <ul className="stack">
                {choice.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
            ) : null}
            <Link
              href={choice.href}
              className="button"
              onClick={onChoiceClick ? () => onChoiceClick(choice.id, choice.href) : undefined}
            >
              {choice.ctaLabel}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
