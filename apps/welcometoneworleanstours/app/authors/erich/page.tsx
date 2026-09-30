import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Erich | Welcome to New Orleans Tours",
  description: "Erich has worked in independent tours and transportation for 30 years and has lived in New Orleans. His perspective combines that experience with practical comparisons of tour formats, transportation and group needs.",
  alternates: { canonical: "https://www.welcometoneworleanstours.com/authors/erich" },
};

const profile = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": "https://www.welcometoneworleanstours.com/authors/erich#profile",
  "url": "https://www.welcometoneworleanstours.com/authors/erich",
  "name": "Erich | Welcome to New Orleans Tours",
  "mainEntity": {
    "@type": "Person",
    "@id": "https://www.welcometoneworleanstours.com/authors/erich#person",
    "name": "Erich",
    "url": "https://www.welcometoneworleanstours.com/authors/erich",
    "description": "Erich has worked in independent tours and transportation for 30 years and has lived in New Orleans. His perspective combines that experience with practical comparisons of tour formats, transportation and group needs."
  }
};

export default function AuthorPage() {
  return (
    <main style={{ maxWidth: 850, margin: "0 auto", padding: "48px 24px", background: "#faf7ef", color: "#241e18", lineHeight: 1.75 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profile).replace(/</g, "\\u003c") }} />
      <p style={{ color: "#563078", fontWeight: 700 }}>AUTHOR · Welcome to New Orleans Tours</p>
      <h1 style={{ color: "#241e18", fontSize: "2rem", lineHeight: 1.2, marginBottom: 24 }}>Erich</h1>
      <p>Erich has worked in independent tours and transportation for 30 years and has lived in New Orleans. His perspective combines that experience with practical comparisons of tour formats, transportation and group needs.</p>
      <p>Erich has lived in Juneau, Skagway, Ketchikan, New Orleans, Los Angeles, Wellington in New Zealand, and Charleston.</p>
      <h2 style={{ color: "#241e18", fontSize: "1.4rem", marginTop: 32 }}>What a byline means</h2>
      <p>A byline identifies who is responsible for an article. This profile does not assign personal authorship to every guide on the site. Company-maintained information is credited to Welcome to New Orleans Tours.</p>
      <p style={{ marginTop: 24 }}><Link href="/editorial-policy" style={{ color: "#563078", textDecoration: "underline" }}>Read our editorial policy</Link> · <Link href="/about" style={{ color: "#563078", textDecoration: "underline" }}>About Welcome to New Orleans Tours</Link></p>
    </main>
  );
}
