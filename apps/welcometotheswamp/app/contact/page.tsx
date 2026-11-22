import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | Welcome to the Swamp",
  description: "Contact and information for visitors to Welcome to the Swamp.",
  alternates: { canonical: "https://welcometotheswamp.com/contact" },
};

export default function InformationPage() {
  return (
    <main className="page-stack" style={{ maxWidth: 850, margin: "0 auto", padding: "48px 24px 64px", lineHeight: 1.75 }}>
      <h1>Contact</h1>
      <p>Welcome to the Swamp</p>
        <section><h2>Questions and corrections</h2><p>Tell us which page you are using and what needs clarification. We can help with information on this website.</p></section>
        <section><h2>Existing reservations</h2><p>For tickets, availability, changes, cancellations, refunds, or meeting instructions, contact the operator or booking provider shown on your confirmation. This website does not manage their reservations.</p></section>
      <section>
        <h2>Contact the team</h2>
        <p>Email <a href="mailto:hello@welcometotheswamp.com">hello@welcometotheswamp.com</a> for website questions, corrections, or privacy requests. Include the page address so we can identify the issue. Keep payment details, identity documents, and private booking references out of your message.</p>
      </section>
      <p><Link href="/">Return to Welcome to the Swamp</Link></p>
    </main>
  );
}
