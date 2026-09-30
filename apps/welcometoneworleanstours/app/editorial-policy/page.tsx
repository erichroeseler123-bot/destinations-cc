import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Editorial policy | Welcome to New Orleans Tours",
  description: "How Welcome to New Orleans Tours attributes articles, uses AI assistance and separates facts from recommendations.",
  alternates: { canonical: "https://www.welcometoneworleanstours.com/editorial-policy" },
};

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "url": "https://www.welcometoneworleanstours.com/editorial-policy",
  "name": "Editorial policy | Welcome to New Orleans Tours",
  "publisher": {
    "@type": "Organization",
    "@id": "https://www.welcometoneworleanstours.com/#organization",
    "name": "Welcome to New Orleans Tours",
    "url": "https://www.welcometoneworleanstours.com"
  }
};
const sections = [
  [
    "Who writes our content",
    "Articles reflecting Erich’s own views or experience can carry his name when he has shaped and approved them. Company-maintained guides and service information are credited to Welcome to New Orleans Tours. Guest contributors are named only when they actually contribute and agree to the attribution."
  ],
  [
    "How we use AI",
    "We use AI to help draft and edit content. It does not supply personal experience, professional credentials or evidence for factual claims. Our publishing standard is to check facts against relevant sources and have the responsible person approve a personal byline."
  ],
  [
    "Facts and recommendations",
    "An opinion should explain the reason behind a recommendation. Prices, availability, pickup instructions, restrictions and cancellation terms can change; check the current booking information and the responsible operator’s terms before reserving. A planning estimate is not a guarantee."
  ],
  [
    "Corrections",
    "If you spot a factual error or outdated detail, contact us through the site’s contact information and include the page and the detail that needs checking. Publication and modification dates should reflect actual publication and substantive edits."
  ]
];

export default function EditorialPolicyPage() {
  return (
    <main style={{ maxWidth: 850, margin: "0 auto", padding: "48px 24px", background: "#faf7ef", color: "#241e18", lineHeight: 1.75 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema).replace(/</g, "\\u003c") }} />
      <h1 style={{ color: "#241e18", fontSize: "2rem", lineHeight: 1.2, marginBottom: 24 }}>Our editorial policy</h1>
      <p>Our goal is to help you make a practical travel decision with clear information and honest tradeoffs.</p>
      {sections.map(([title, body]) => <section key={title} style={{ marginTop: 32 }}><h2 style={{ color: "#241e18", fontSize: "1.4rem" }}>{title}</h2><p>{body}</p></section>)}
      <p style={{ marginTop: 32 }}><Link href="/authors/erich" style={{ color: "#563078", textDecoration: "underline" }}>About Erich</Link> · <Link href="/about" style={{ color: "#563078", textDecoration: "underline" }}>About Welcome to New Orleans Tours</Link></p>
    </main>
  );
}
