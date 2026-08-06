import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/cancellation-policy",
  "Cancellation and Refund Policy | Welcome to New Orleans Tours",
  "How cancellations, refunds, no-shows, late arrivals, and weather changes are generally handled for operator-provided New Orleans tours.",
);

export default function CancellationPolicyPage() {
  return (
    <SupportPageShell
      eyebrow="Booking Policies"
      title="Cancellation and Refund Policy"
      updated="August 5, 2026"
      intro="Cancellation and refund rules vary by tour and operator. The policy shown during checkout and in your booking confirmation controls your booking."
      sections={[
        {
          title: "Which policy controls",
          body: [
            "Each tour may have its own cancellation window, refund rules, change rules, weather policy, and participation requirements. Review the FareHarbor checkout before purchase and the confirmation email after purchase.",
            "The operator generally manages booking changes, cancellations, and refunds because the operator provides the tour and controls the confirmed service details.",
          ],
        },
        {
          title: "How to request help after booking",
          body: [
            "Use the operating company and FareHarbor details in your confirmation email first. Include your booking number, tour date, traveler name, and the change or cancellation you are requesting.",
            "If you cannot identify the right operator contact, we can help point you back to the appropriate confirmation details, but we cannot override the operator's policy.",
          ],
        },
        {
          title: "No-shows, late arrivals, and missed pickups",
          body: [
            "No-show and late-arrival outcomes depend on the operator's policy and day-of-tour logistics. Some tours may depart on time and may not be able to hold the group for late guests.",
            "If transportation or pickup is included, confirm the exact pickup instructions, pickup window, and meeting location before the tour date.",
          ],
        },
        {
          title: "Weather and operator cancellations",
          body: [
            "Outdoor tours, swamp tours, river cruises, and walking tours may be affected by weather, water conditions, safety decisions, mechanical issues, or operator schedule changes.",
            "If the operator cancels or changes a tour, refund timing and rebooking options are handled according to the operator and FareHarbor process shown in your confirmation. We do not invent or guarantee a universal refund deadline.",
          ],
        },
      ]}
    />
  );
}
