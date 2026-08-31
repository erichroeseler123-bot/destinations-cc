import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/privacy",
  "Privacy Policy | Welcome to New Orleans Tours",
  "How Welcome to New Orleans Tours handles analytics, contact requests, email opt-ins, referral tracking, logs, and third-party booking tools.",
);

export default function PrivacyPage() {
  return (
    <SupportPageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      updated="August 15, 2026"
      intro="This policy explains how Welcome to New Orleans Tours may collect and use information when you browse our visitor-help and tour recommendation site, contact us, join the New Orleans planning brief, reserve the orientation, or continue to an operator booking path."
      sections={[
        {
          title: "What this site collects",
          body: [
            "The site may collect standard technical data such as browser type, device information, pages viewed, referring pages, approximate location derived from network data, and server logs. This helps us maintain the site and understand which planning pages are useful.",
            "If you call, text, email, submit a request, or join the New Orleans planning brief, we may receive the contact details and preferences you choose to provide so we can respond or deliver the requested planning communication.",
          ],
        },
        {
          title: "Email planning brief",
          body: [
            "If you explicitly join the New Orleans 48-hour planning brief, we store the email address you provide together with the signup source and consent purpose. We use that information for the requested New Orleans planning communication and related service notices.",
            "You may unsubscribe from planning emails at any time. We do not sell email addresses collected for the New Orleans planning brief.",
          ],
        },
        {
          title: "Analytics, cookies, and local storage",
          body: [
            "The codebase uses Google Analytics, event tracking, dataLayer events, and limited browser storage for site analytics and booking-path measurement. You can control cookies and site storage through your browser settings.",
            "Phone clicks, recommendation actions, brief signups, and booking-button interactions may be measured so we can understand whether the site is helping travelers find the right path.",
          ],
        },
        {
          title: "FareHarbor and operator bookings",
          body: [
            "Third-party tour bookings are completed through FareHarbor booking links or lightframes and through the operator. FareHarbor and the operator may collect booking details, traveler details, payment information, and related records under their own privacy practices.",
            "Welcome to New Orleans Tours does not claim to store payment-card data for FareHarbor bookings.",
          ],
        },
        {
          title: "How information is used",
          body: [
            "We use information to operate the site, respond to inquiries, deliver requested planning communications, manage direct orientation reservations, measure referral and booking-path performance, troubleshoot errors, improve recommendations, and protect the site from abuse.",
            "We may receive affiliate or referral reporting connected to bookings made after clicking from this site.",
          ],
        },
      ]}
    />
  );
}
