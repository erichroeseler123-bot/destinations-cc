import { Rye, Pinyon_Script } from 'next/font/google';
import type { Metadata } from "next";
import { HeaderNav, FooterNav } from "./components/MarketplaceNavigation";
import WnoFunnelTracker from "./components/WnoFunnelTracker";

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

const socialDescription = "Welcome to New Orleans Tours helps visitors compare local tours, get concierge help, and choose experiences that fit their group.";

export const metadata: Metadata = {
  metadataBase: new URL("https://welcometoneworleanstours.com"),
  applicationName: "Welcome to New Orleans Tours",
  title: {
    default: "Welcome to New Orleans Tours | New Orleans Concierge Desk",
    template: "%s | Welcome to New Orleans Tours",
  },
  openGraph: {
    title: "Welcome to New Orleans Tours | New Orleans Concierge Desk",
    description: socialDescription,
    url: "https://welcometoneworleanstours.com",
    siteName: "Welcome to New Orleans Tours",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Welcome to New Orleans Tours | New Orleans Concierge Desk",
    description: socialDescription,
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
      <WnoFunnelTracker />
      <HeaderNav />
      <main className="flex-1 w-full relative">
        {children}
      </main>
      <FooterNav />
    </div>
  );
}
