import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/accessibility",
  "Accessibility Statement | New Orleans Concierge Desk",
  "Accessibility commitment and support contact information for New Orleans Concierge Desk.",
);

export default function AccessibilityPage() {
  return (
    <SupportPageShell
      eyebrow="Accessibility"
      title="Accessibility Statement"
      updated="August 9, 2026"
      intro="New Orleans Concierge Desk aims to make its visitor-help and tour recommendation site usable for as many travelers as practical and to provide clear ways to ask for help."
      sections={[
        {
          title: "Our commitment",
          body: [
            "We work to keep the site readable, navigable, and usable with common assistive technologies. We do not claim formal WCAG certification or full ADA compliance without a dedicated audit.",
            "The site includes skip-link support and uses standard links and buttons for key navigation and booking paths.",
          ],
        },
        {
          title: "Tour accessibility varies",
          body: [
            "Tour accessibility, boarding requirements, walking distance, vehicle access, restroom access, and mobility accommodations vary by operator and tour format.",
            "Before booking, review the tour details and contact the operator through the checkout or confirmation path if you need a specific accommodation.",
          ],
        },
        {
          title: "Report an accessibility issue",
          body: [
            "If you have trouble using this site or need help finding a booking path, contact us with the page URL, the issue you encountered, and the assistive technology or browser you are using if relevant.",
            "We will use the information to respond and improve the site where practical.",
          ],
        },
      ]}
    />
  );
}
