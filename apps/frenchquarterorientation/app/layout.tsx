import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://frenchquarterorientation.com"),
  title: "French Quarter Orientation | Understand New Orleans Before You Wander",
  description: "A practical first-hour guide to the French Quarter: layout, street choice, meeting points, walking strategy, and what to do next.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "French Quarter Orientation",
    description: "Understand the Quarter before you start wandering it.",
    url: "https://frenchquarterorientation.com",
    siteName: "French Quarter Orientation",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en"><body>
      {children}
      <footer><div className="shell">
        <p>French Quarter Orientation — Independent New Orleans orientation resource. The orientation is 30 minutes. Live prices, availability, and final terms come from the relevant provider.</p>
        <nav aria-label="Contact and policies" style={{ display: "flex", flexWrap: "wrap", gap: "12px 24px" }}>
          <Link href="/">Home</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link>
        </nav>
      </div></footer>
    </body></html>
  );
}
