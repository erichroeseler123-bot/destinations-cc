import type { NetworkCommercialPageConfig, NetworkThemeConfig } from "./types";
import { NetworkShell } from "./NetworkShell";
import { DestinationHero } from "./DestinationHero";
import { TrustStrip } from "./TrustStrip";
import { DecisionCard } from "./DecisionCard";
import { FeaturedCommercialCards } from "./FeaturedCommercialCards";
import { CategoryGrid } from "./CategoryGrid";
import { ProviderDisclosure } from "./ProviderDisclosure";
import { NetworkFooter } from "./NetworkFooter";

type NetworkCommercialPageProps = {
  theme: NetworkThemeConfig;
  page: NetworkCommercialPageConfig;
};

export function NetworkCommercialPage({ theme, page }: NetworkCommercialPageProps) {
  return (
    <NetworkShell theme={theme} stickyMobileCta={page.stickyMobileCta}>
      <DestinationHero theme={theme} hero={page.hero} />
      <TrustStrip config={page.trustStrip} />
      <DecisionCard config={page.decisionBlock} />
      <FeaturedCommercialCards cards={page.featuredCards} />
      <CategoryGrid config={page.categoryGrid} />
      <ProviderDisclosure config={page.providerDisclosure} />
      <NetworkFooter config={page.footer} theme={theme} />
    </NetworkShell>
  );
}
