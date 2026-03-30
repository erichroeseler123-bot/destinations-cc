import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Welcome to the Swamp",
  description: "Learn what Welcome to the Swamp is, what it is not, and how it relates to Destination Command Center.",
  alternates: { canonical: "https://welcometotheswamp.com/about" },
};

export default function AboutPage() {
  return (
    <main className="page-stack">
      <section className="hero-card hero-guide">
        <p className="eyebrow">About</p>
        <h1>This site exists to help visitors understand swamp tours before they book anything.</h1>
        <p className="lede">
          Welcome to the Swamp is an editorial-first New Orleans swamp-tour guide. It is designed to answer practical planning questions, explain tradeoffs honestly, and hand people into the shortlist only when they are ready.
        </p>
      </section>
    </main>
  );
}
