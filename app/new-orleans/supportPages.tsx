import type { Metadata } from "next";
import Link from "next/link";

export const WTONOT_SITE_NAME = "New Orleans Concierge Desk";
export const WTONOT_ORIGIN = "https://welcometoneworleanstours.com";
export const WTONOT_SUPPORT_EMAIL = "help@welcometoneworleanstours.com";
export const WTONOT_SUPPORT_PHONE = "504-484-9687";
export const WTONOT_SUPPORT_PHONE_HREF = "tel:+15044849687";

type Section = {
  title: string;
  body: string[];
};

type SupportPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Section[];
  updated?: string;
};

export function buildSupportMetadata(pathname: string, title: string, description: string): Metadata {
  return {
    metadataBase: new URL(WTONOT_ORIGIN),
    applicationName: WTONOT_SITE_NAME,
    title,
    description,
    alternates: { canonical: pathname },
    openGraph: {
      siteName: WTONOT_SITE_NAME,
      title,
      description,
      url: pathname,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export function SupportPageShell({ eyebrow, title, intro, sections, updated }: SupportPageProps) {
  return (
    <div className="bg-[var(--nola-bg-charcoal)] text-[var(--nola-ivory)] font-sans min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <header className="border border-[var(--nola-border)] bg-[var(--nola-surface-strong)] p-8 md:p-10 mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--nola-gold)] mb-4">
            {eyebrow}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-[var(--nola-gold)] mb-5">
            {title}
          </h1>
          <p className="text-lg text-[var(--nola-ivory)]/80 font-light leading-relaxed">
            {intro}
          </p>
          <p className="mt-4 text-sm text-[var(--nola-ivory)]/60">
            {WTONOT_SITE_NAME} is an independent visitor-help, tour recommendation, and affiliate site.
          </p>
          {updated ? (
            <p className="mt-5 text-xs text-[var(--nola-ivory)]/55">Last updated: {updated}</p>
          ) : null}
        </header>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="border border-[var(--nola-border)] bg-[var(--nola-surface-subtle)] p-7">
              <h2 className="font-serif text-2xl text-[var(--nola-ivory)] mb-4">{section.title}</h2>
              <div className="space-y-4 text-[var(--nola-ivory)]/75 font-light leading-relaxed">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 border border-[var(--nola-border)] bg-[var(--nola-bg-black)] p-7">
          <h2 className="font-serif text-2xl text-[var(--nola-gold)] mb-4">Need help?</h2>
          <p className="text-[var(--nola-ivory)]/75 font-light leading-relaxed">
            Email{" "}
            <a href={`mailto:${WTONOT_SUPPORT_EMAIL}`} className="text-[var(--nola-gold)] underline underline-offset-4">
              {WTONOT_SUPPORT_EMAIL}
            </a>{" "}
            or call/text{" "}
            <a href={WTONOT_SUPPORT_PHONE_HREF} className="text-[var(--nola-gold)] underline underline-offset-4">
              {WTONOT_SUPPORT_PHONE}
            </a>
            . After booking, also use the operator contact details in your FareHarbor confirmation.
          </p>
          <p className="mt-4 text-sm text-[var(--nola-ivory)]/60">
            For tour selection help, visit <Link href="/booking-help" className="text-[var(--nola-gold)] underline underline-offset-4">Booking Help</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
