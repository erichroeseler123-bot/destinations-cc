import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | Welcome to the Dells",
  description: "Contact and information for visitors to Welcome to the Dells.",
  alternates: { canonical: "https://www.welcometothedells.com/contact" },
};

export default function InformationPage() {
  return (
    <main style={{ maxWidth: 850, margin: "0 auto", padding: "48px 24px 64px", lineHeight: 1.75 }}>
      <h1>Contact</h1>
      <p>Welcome to the Dells</p>
        <section><h2>Website help</h2><p>Send questions about this guide, suggestions, or corrections to the team using the email address below.</p></section>
        <section><h2>Tickets and reservations</h2><p>For an existing booking, contact the operator or ticket seller shown on your confirmation. Prices, availability, changes, refunds, and meeting instructions are controlled by that provider.</p></section>
      <section>
        <h2>Contact the team</h2>
        <p>Email <a href="mailto:erich@rollcallusa.com">erich@rollcallusa.com</a> for website questions, corrections, or privacy requests. Include the page address so we can identify the issue. Keep payment details, identity documents, and private booking references out of your message.</p>
      </section>
      <p><Link href="/">Return to Welcome to the Dells</Link></p>
    </main>
  );
}
