import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/about",
  "About Welcome to New Orleans Tours | New Orleans Concierge Desk",
  "Who runs Welcome to New Orleans Tours, what the site does, how recommendations work, how booking works, and how to contact the Concierge Desk.",
);

export default function AboutPage() {
  return (
    <SupportPageShell
      eyebrow="About & transparency"
      title="About Welcome to New Orleans Tours"
      intro="Welcome to New Orleans Tours and the New Orleans Concierge Desk are an independent visitor-planning service built to help travelers compare New Orleans experiences, understand the tradeoffs, and continue to the correct participating operator when they are ready to book."
      sections={[
        {
          title: "Who runs this site",
          body: [
            "Welcome to New Orleans Tours is an independent New Orleans visitor-planning and tour-recommendation site. It is not the City of New Orleans, a tourism bureau, or a cruise line, and it does not present partner tours as its own operations.",
            "For visitor help, call or text the New Orleans Concierge Desk at 504-484-9687.",
          ],
        },
        {
          title: "What we do",
          body: [
            "We organize New Orleans tour options by traveler fit, category, neighborhood, format, timing, transportation, weather exposure, group needs, and practical planning questions.",
            "The Help Me Choose flow is designed to return a best-fit option, explain why it fits, surface cautions and tradeoffs, and show a secondary option when the supported inventory allows one.",
          ],
        },
        {
          title: "What we do not do",
          body: [
            "We do not control a participating operator's live inventory, final price, pickup details, restrictions, cancellation terms, or service delivery. Those details are controlled by the operator and are confirmed in the operator's booking path.",
            "We do not claim to operate partner swamp tours, river cruises, plantation tours, city tours, food tours, cocktail tours, or ghost tours unless a page specifically identifies an experience as our own service.",
          ],
        },
        {
          title: "How booking works",
          body: [
            "When a traveler chooses a participating third-party tour, the booking path typically continues through the participating operator's FareHarbor checkout or another clearly identified operator booking page.",
            "The participating operator provides the tour and controls live availability, payment, confirmed inclusions, restrictions, meeting or pickup instructions, cancellation terms, and other final booking details.",
          ],
        },
        {
          title: "How this site makes money",
          body: [
            "Welcome to New Orleans Tours may receive affiliate or referral compensation when a traveler completes a booking through participating links.",
            "That commercial relationship does not replace the operator's booking terms. Our job is to narrow the decision and clearly identify where the traveler is going next.",
          ],
        },
        {
          title: "Our own visitor service",
          body: [
            "The Concierge Desk also offers its own $5 French Quarter Morning Orientation. Pages for that service identify it separately from third-party tour recommendations.",
            "For questions about what fits your group, timing, transportation, weather exposure, mobility, or what to verify before purchase, call or text 504-484-9687.",
          ],
        },
        {
          title: "Relationship to Destination Command Center",
          body: [
            "Welcome to New Orleans Tours is affiliated with Destination Command Center, a location-intelligence and destination-research platform. The relationship is used to improve destination context and planning continuity; Welcome to New Orleans Tours remains the New Orleans-specific planning surface.",
          ],
        },
      ]}
    />
  );
}
