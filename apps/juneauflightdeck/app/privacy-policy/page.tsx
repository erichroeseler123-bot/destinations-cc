import type { Metadata } from "next";
import StaticPage from "../components/StaticPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy information for Juneau Flight Deck.",
  alternates: { canonical: "https://juneauflightdeck.com/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <StaticPage
      eyebrow="Privacy policy"
      title="Privacy, kept proportional to the service."
      intro="Juneau Flight Deck is designed primarily as a planning and referral surface. Information submitted directly to a third-party booking provider is governed by that provider's own privacy policy."
      bullets={[
        "We may use standard site analytics to understand page usage, referrals, and booking-handoff performance.",
        "Do not submit sensitive personal information through general planning inputs unless a page explicitly requires it.",
        "Third-party booking, payment, maps, analytics, or embedded services may receive information according to their own policies.",
        "Provider booking pages remain separate services and are responsible for the reservation information they collect.",
      ]}
      ctaLabel="Back to Juneau planning"
    />
  );
}
