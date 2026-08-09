import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/about",
  "About | New Orleans Concierge Desk",
  "About New Orleans Concierge Desk, an independent New Orleans visitor-help and tour recommendation site.",
);

export default function AboutPage() {
  return (
    <SupportPageShell
      eyebrow="About"
      title="About New Orleans Concierge Desk"
      intro="New Orleans Concierge Desk helps visitors compare local tour options, plan their time, and continue to participating operator booking paths."
      sections={[
        {
          title: "What we do",
          body: [
            "We organize New Orleans tour options by traveler fit, category, neighborhood, format, and practical planning questions.",
            "The goal is to make it easier to compare swamp tours, river cruises, city tours, plantation tours, walking tours, and group-friendly options before booking.",
          ],
        },
        {
          title: "How booking works",
          body: [
            "When a traveler chooses a third-party tour, the booking path typically opens through FareHarbor for the participating operator. The operator provides the tour and controls the confirmed booking details.",
            "New Orleans Concierge Desk may receive affiliate compensation when bookings are completed through site links.",
          ],
        },
        {
          title: "Local visitor help",
          body: [
            "The Concierge Desk focuses on New Orleans experiences and practical planning questions: tour format, transportation, group fit, weather exposure, mobility, timing, and what to verify before purchase.",
            "We also offer our own $5 French Quarter Morning Orientation. We do not claim to operate partner tours unless a page specifically says otherwise.",
          ],
        },
      ]}
    />
  );
}
