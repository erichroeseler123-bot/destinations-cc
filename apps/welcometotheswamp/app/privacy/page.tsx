import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy | Welcome to the Swamp",
  description: "Privacy information for Welcome to the Swamp.",
  alternates: { canonical: "https://welcometotheswamp.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="page-stack">
      <section className="panel prose-panel">
        <p className="eyebrow">Privacy</p>
        <h1>Privacy</h1>
        <p>
          Welcome to the Swamp is a lightweight editorial site. Basic analytics, server logs, and referral data may be used to understand how people use the site and where they hand off into external discovery or booking surfaces.
        </p>
        <h2>Availability requests and saved plans</h2>
        <p>When you submit a waitlist request, we store your email, optional name and phone number, travel date, group size, children’s ages, and tour preferences in our request database. This records your request; it does not reserve seats. Automated seat-opening emails are currently inactive. Keep the private withdrawal link shown after submission to cancel that request. Canceling or expiry changes its status and does not automatically delete the stored record.</p>
        <p>The timing planner saves your timing choices in this browser only when you choose “Save my plan.” Use “Remove saved plan” to clear that saved copy. A shared plan link contains the timing choices in its address, so anyone you send it to can view those choices. Contact details from the waitlist form are not included in timing links or saved planner data.</p>
        <p>
          If you click through to external providers or Destination Command Center, those services may apply their own cookies, logging, and privacy policies.
        </p>
      </section>
    </main>
  );
}

