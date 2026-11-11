import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Component Verification Harness | Juneau Flight Deck",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://juneauflightdeck.com/preview-cards" },
};

export default function PreviewCardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
