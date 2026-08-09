import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/privacy",
  "Privacy Policy | New Orleans Concierge Desk",
  "How New Orleans Concierge Desk handles analytics, contact requests, referral tracking, logs, and third-party booking tools.",
);

export default function PrivacyPage() {
  return (
    <SupportPageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      updated="August 9, 2026"
      intro="This policy explains how New Orleans Concierge Desk may collect and use information when you browse our visitor-help and tour recommendation site, contact us, reserve the orientation, or continue to a participating operator booking path."
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
            "Phone clicks, recommendation actions, and booking-button interactions may be measured so we can understand whether the site is helping travelers find the right path.",
          ],
        },
        {
          title: "FareHarbor and operator bookings",
          body: [
            "Third-party tour bookings are completed through FareHarbor booking links or lightframes and through the participating operator. FareHarbor and the operator may collect booking details, traveler details, payment information, and related records under their own privacy practices.",
            "New Orleans Concierge Desk does not claim to store payment-card data for FareHarbor bookings.",
          ],
        },
        {
          title: "How information is used",
          body: [
            "We use information to operate the site, respond to inquiries, manage direct orientation reservations, measure referral and booking-path performance, troubleshoot errors, improve recommendations, and protect the site from abuse.",
            "We may receive affiliate or referral reporting connected to bookings made after clicking from this site.",
          ],
        },
      ]}
    />
  );
}
