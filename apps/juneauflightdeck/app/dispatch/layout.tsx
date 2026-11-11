import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Internal Dispatch Console | Juneau Flight Deck",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://juneauflightdeck.com/dispatch" },
};

export default function DispatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
