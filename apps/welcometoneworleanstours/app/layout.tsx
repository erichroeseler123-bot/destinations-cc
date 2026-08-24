import type { Metadata } from "next";
import "../../../app/globals.css";
import "./wno-recovery.css";
import "@/app/new-orleans/data/truthLayerRuntime";
import CanonicalNewOrleansLayout from "@/app/new-orleans/layout";

export const metadata: Metadata = {
  metadataBase: new URL("https://welcometoneworleanstours.com"),
  title: {
    default: "Welcome to New Orleans Tours | Find the Right Experience",
    template: "%s",
  },
  description: "Compare curated New Orleans tours and experiences by group fit, time, transportation, and practical constraints before checking live operator availability.",
  openGraph: {
    siteName: "Welcome to New Orleans Tours",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fareharbor.com" />
        <link rel="dns-prefetch" href="//fareharbor.com" />
      </head>
      <body>
        <CanonicalNewOrleansLayout>{children}</CanonicalNewOrleansLayout>
      </body>
    </html>
  );
}
