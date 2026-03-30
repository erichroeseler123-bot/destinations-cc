import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy | Welcome to the Swamp",
  description: "Privacy information for Welcome to the Swamp.",
  alternates: { canonical: "https://welcometotheswamp.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="page-stack">
      <section className="panel prose-panel">
        <p className="eyebrow">Privacy</p>
        <h1>Privacy</h1>
        <p>
          Welcome to the Swamp is a lightweight editorial site. Basic analytics, server logs, and referral data may be used to understand how people use the site and where they hand off into external discovery or booking surfaces.
        </p>
        <p>
          If you click through to external providers or Destination Command Center, those services may apply their own cookies, logging, and privacy policies.
        </p>
      </section>
    </main>
  );
}
