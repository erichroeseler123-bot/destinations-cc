import { Rye, Pinyon_Script } from 'next/font/google';
import type { Metadata } from "next";
import { HeaderNav, FooterNav } from "./components/MarketplaceNavigation";

const newOrleansDisplayFont = Rye({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-new-orleans-display',
});

const newOrleansScriptFont = Pinyon_Script({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-new-orleans-script',
});

export const metadata: Metadata = {
  metadataBase: new URL("https://welcometoneworleanstours.com"),
  applicationName: "Welcome to New Orleans Tours",
  openGraph: {
    siteName: "Welcome to New Orleans Tours",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Welcome to New Orleans Tours",
    description: "Compare New Orleans tours, find participating experiences, and get help choosing the right fit for your trip.",
  },
  verification: {
    google: process.env.WTONOT_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function NewOrleansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col min-h-screen bg-[#151515] text-[#fdfbf7] ${newOrleansDisplayFont.variable} ${newOrleansScriptFont.variable}`}>
      <HeaderNav />
      <main className="flex-1 w-full relative">
        {children}
      </main>
      <FooterNav />
    </div>
  );
}
