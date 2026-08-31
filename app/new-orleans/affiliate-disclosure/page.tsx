import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/affiliate-disclosure",
  "Affiliate Disclosure | Welcome to New Orleans Tours",
  "Disclosure of affiliate compensation and recommendation standards for Welcome to New Orleans Tours.",
);

export default function AffiliateDisclosurePage() {
  return (
    <SupportPageShell
      eyebrow="Disclosure"
      title="Affiliate Disclosure"
      updated="August 9, 2026"
      intro="Welcome to New Orleans Tours may receive compensation or commission when a traveler books through participating links or booking tools on this site."
      sections={[
        {
          title: "How compensation works",
          body: [
            "Some links and FareHarbor booking paths on this site may include affiliate, referral, or tracking parameters. If you complete a booking after using those links, we may earn compensation.",
            "This compensation helps support Welcome to New Orleans Tours, recommendation tools, comparison guides, and planning content.",
          ],
        },
        {
          title: "Operator independence",
          body: [
            "The participating tour operators listed on this site are independent businesses. They provide their tours, set booking terms, and manage the customer experience after purchase.",
            "Affiliate compensation does not mean Welcome to New Orleans Tours operates a partner tour or controls every operator policy. Our $5 French Quarter Morning Orientation is separately identified as a Welcome to New Orleans Tours offering.",
          ],
        },
        {
          title: "Recommendation standards",
          body: [
            "We aim to organize tour options clearly by traveler fit, category, operator, and practical considerations. Travelers should still review live checkout details before booking.",
            "If a page mentions third-party availability, inclusions, restrictions, cancellation details, or timing, the operator checkout and confirmation should be treated as the controlling source.",
          ],
        },
      ]}
    />
  );
}
