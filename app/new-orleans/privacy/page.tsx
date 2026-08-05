import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/privacy",
  "Privacy Policy | Welcome to New Orleans Tours",
  "How Welcome to New Orleans Tours handles analytics, contact requests, referral tracking, logs, and FareHarbor booking tools.",
);

export default function PrivacyPage() {
  return (
    <SupportPageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      updated="August 5, 2026"
      intro="This policy explains how Welcome to New Orleans Tours may collect and use information when you browse our tour recommendation storefront, contact us, or continue to an operator booking path."
      sections={[
        {
          title: "What this site collects",
          body: [
            "The site may collect standard technical data such as browser type, device information, pages viewed, referring pages, approximate location derived from network data, and server logs. This helps us maintain the site and understand which planning pages are useful.",
            "If you call, text, email, or submit a request, we may receive the contact details and message content you choose to provide so we can respond to your question.",
          ],
        },
        {
          title: "Analytics, cookies, and local storage",
          body: [
            "The codebase uses Google Analytics, event tracking, dataLayer events, and limited browser storage for site analytics and booking-path measurement. You can control cookies and site storage through your browser settings.",
            "Phone clicks, recommendation actions, and FareHarbor booking-button interactions may be measured so we can understand whether the storefront is helping travelers find the right operator path.",
          ],
        },
        {
          title: "FareHarbor and operator bookings",
          body: [
            "Bookings are completed through FareHarbor booking links or lightframes and through the participating operator. FareHarbor and the operator may collect booking details, traveler details, payment information, and related records under their own privacy practices.",
            "Welcome to New Orleans Tours does not claim to store payment-card data for FareHarbor bookings.",
          ],
        },
        {
          title: "How information is used",
          body: [
            "We use information to operate the storefront, respond to inquiries, measure referral and booking-path performance, troubleshoot errors, improve recommendations, and protect the site from abuse.",
            "We may receive affiliate or referral reporting connected to bookings made after clicking from this site.",
          ],
        },
      ]}
    />
  );
}
