import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DCC Special Pages",
  description: "Dedicated destination authority pages for shuttle, Vegas, Alaska, cruises, and national parks.",
  metadataBase: new URL("https://destinationcommandcenter.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
