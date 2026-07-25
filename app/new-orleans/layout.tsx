import { HeaderNav, FooterNav } from "./components/MarketplaceNavigation";

export default function NewOrleansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#151515] text-[#fdfbf7]">
      <HeaderNav />
      <main className="flex-1 w-full relative">
        {children}
      </main>
      <FooterNav />
    </div>
  );
}
