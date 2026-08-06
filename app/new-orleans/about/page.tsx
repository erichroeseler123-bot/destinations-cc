import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/about",
  "About | Welcome to New Orleans Tours",
  "About the Welcome to New Orleans Tours recommendation storefront and its independent-operator booking model.",
);

export default function AboutPage() {
  return (
    <SupportPageShell
      eyebrow="About"
      title="About Welcome to New Orleans Tours"
      intro="Welcome to New Orleans Tours helps travelers compare local tour options and continue to participating operator booking paths."
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
            "When a traveler chooses a tour, the booking path typically opens through FareHarbor for the participating operator. The operator provides the tour and controls the confirmed booking details.",
            "Welcome to New Orleans Tours may receive affiliate compensation when bookings are completed through site links.",
          ],
        },
        {
          title: "Local-tour focus",
          body: [
            "The storefront focuses on New Orleans experiences and practical planning questions: tour format, transportation, group fit, weather exposure, mobility, and what to verify before purchase.",
            "We do not claim to operate partner tours unless a page specifically says otherwise.",
          ],
        },
      ]}
    />
  );
}
