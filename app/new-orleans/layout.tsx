import { Rye, Pinyon_Script } from 'next/font/google';
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
