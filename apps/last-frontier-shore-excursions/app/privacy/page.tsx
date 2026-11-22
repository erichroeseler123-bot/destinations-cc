import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy | Last Frontier Shore Excursions",
  description: "Privacy and information for visitors to Last Frontier Shore Excursions.",
  alternates: { canonical: "https://www.lastfrontiershoreexcursions.com/privacy" },
};

export default function InformationPage() {
  return (
    <main style={{ maxWidth: 850, margin: "0 auto", padding: "48px 24px 64px", lineHeight: 1.75 }}>
      <h1>Privacy</h1>
      <p>Last Frontier Shore Excursions</p>
        <section><h2>Website visits</h2><p>Our hosting providers process technical request information, such as IP addresses and browser information, to deliver pages and maintain the service. Public-page analytics and referral measurements help us understand which information and booking links visitors use.</p></section>
        <section><h2>Messages you send</h2><p>If you contact us, we receive the information you choose to include and use it to respond to your question or request.</p></section>
        <section><h2>Planning inquiries</h2><p>If you submit a planning inquiry, we receive the contact and trip details you provide so the team can review and respond. An inquiry does not reserve a tour or collect payment.</p></section>
        <section><h2>External providers</h2><p>Links may lead to Destination Command Center, local operators, or booking partners. Those services handle their own websites, reservations, payments, cookies, and privacy practices. Review the destination website before submitting personal information or payment.</p></section>
      <section>
        <h2>Contact the team</h2>
        <p>Email <a href="mailto:concierge@cruisepromenade.com">concierge@cruisepromenade.com</a> for website questions, corrections, or privacy requests. Include the page address so we can identify the issue. Keep payment details, identity documents, and private booking references out of your message.</p>
      </section>
      <p><Link href="/">Return to Last Frontier Shore Excursions</Link></p>
    </main>
  );
}
