import type { ReactNode } from "react";

export type NetworkDestinationId =
  | "dcc"
  | "wno"
  | "wts"
  | "wta"
  | "jfd"
  | "gosno"
  | "shuttleya"
  | "dells"
  | "vegas";

export type ProviderType =
  | "owned_booking"
  | "partner_handoff"
  | "affiliate_fallback"
  | "qualified_lead"
  | "sponsored_operator"
  | "planning_fee"
  | "marketing_service"
  | "white_label_widget_later"
  | "mixed";

export type NetworkImageConfig = {
  src: string;
  alt: string;
};

export type NetworkThemeConfig = {
  id: NetworkDestinationId;
  brandName: string;
  mode: "parent" | "satellite" | "operator";
  accentPalette: {
    primary: string;
    secondary: string;
    soft: string;
    textOnAccent: string;
  };
  background: {
    base: string;
    surface: string;
    surfaceSoft: string;
    border: string;
    text: string;
    muted: string;
    treatment: "dark-command" | "bayou" | "glacier" | "alpine" | "mountain" | "lake" | "vegas";
  };
  hero: {
    image?: NetworkImageConfig;
    mood: "cinematic" | "utility" | "dispatch" | "value";
  };
  ctaStyle: "solid" | "brass" | "glacier" | "neon" | "operator";
  footerMode: "network" | "satellite" | "operator" | "minimal";
  disclosureMode: "owned" | "partner" | "affiliate" | "mixed";
};

export type CtaConfig = {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "fallback" | "external";
  external?: boolean;
  ariaLabel?: string;
};

export type DestinationHeroConfig = {
  eyebrow: string;
  title: string;
  summary: string;
  primaryCta: CtaConfig;
  secondaryCta?: CtaConfig;
  trustChips?: string[];
  media?: {
    eyebrow: string;
    title: string;
    body: string;
    rows: Array<{ label: string; value: string }>;
  };
};

export type TrustStripConfig = {
  items: Array<{
    id: string;
    label: string;
    body: string;
  }>;
};

export type DecisionCardConfig = {
  eyebrow: string;
  title: string;
  body: string;
  recommendation: string;
  cta?: CtaConfig;
  supportPoints?: string[];
};

export type CommercialCardConfig = {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  destination: NetworkDestinationId;
  image?: NetworkImageConfig;
  tags?: string[];
  cta: CtaConfig;
  providerType: ProviderType;
  disclosure: string;
  decisionReason?: string;
};

export type CategoryGridConfig = {
  eyebrow: string;
  title: string;
  body?: string;
  items: Array<{
    id: string;
    title: string;
    body: string;
    cta: CtaConfig;
    providerType?: ProviderType;
  }>;
};

export type ProviderDisclosureConfig = {
  providerType: ProviderType;
  label: string;
  body: string;
  allowedClaims: string[];
  notClaimed: string[];
};

export type StickyMobileCtaConfig = CtaConfig & {
  enabled: boolean;
  disclosureLabel?: string;
  providerType?: ProviderType;
};

export type NetworkFooterConfig = {
  eyebrow: string;
  body: string;
  links: CtaConfig[];
};

export type NetworkCommercialPageConfig = {
  id: string;
  path: string;
  metadata: {
    title: string;
    description: string;
    keywords?: string[];
  };
  hero: DestinationHeroConfig;
  trustStrip?: TrustStripConfig;
  decisionBlock?: DecisionCardConfig;
  featuredCards?: CommercialCardConfig[];
  categoryGrid?: CategoryGridConfig;
  providerDisclosure?: ProviderDisclosureConfig;
  stickyMobileCta?: StickyMobileCtaConfig;
  footer?: NetworkFooterConfig;
};

export type NetworkSectionProps = {
  theme: NetworkThemeConfig;
};

export type SectionSlot = ReactNode;
