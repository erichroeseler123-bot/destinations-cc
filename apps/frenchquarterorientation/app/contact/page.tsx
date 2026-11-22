import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | French Quarter Orientation",
  description: "Contact and information for visitors to French Quarter Orientation.",
  alternates: { canonical: "https://frenchquarterorientation.com/contact" },
};

export default function InformationPage() {
  return (
    <main style={{ maxWidth: 850, margin: "0 auto", padding: "48px 24px 64px", lineHeight: 1.75 }}>
      <h1>Contact</h1>
      <p>French Quarter Orientation</p>
        <section><h2>Website help</h2><p>Send questions about this guide, suggestions, or corrections to the team using the email address below.</p></section>
        <section><h2>Tickets and reservations</h2><p>For an existing booking, contact the operator or ticket seller shown on your confirmation. Prices, availability, changes, refunds, and meeting instructions are controlled by that provider.</p></section>
      <section>
        <h2>Contact the team</h2>
        <p>Email <a href="mailto:help@welcometoneworleanstours.com">help@welcometoneworleanstours.com</a> for website questions, corrections, or privacy requests. Include the page address so we can identify the issue. Keep payment details, identity documents, and private booking references out of your message.</p>
      </section>
      <p><Link href="/">Return to French Quarter Orientation</Link></p>
    </main>
  );
}
