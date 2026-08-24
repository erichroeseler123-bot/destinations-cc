export const SITE_URL = "https://420friendlyairportpickup.com";

export type SitePage = {
  slug: string;
  title: string;
  headline: string;
  description: string;
  body: string;
  bullets?: string[];
  ctaLabel: string;
  ctaHref: string;
};

export const sitePages: SitePage[] = [
  {
    slug: "about",
    title: "About",
    headline: "This site exists to get your arrival plan locked fast.",
    description: "420 Friendly Airport Pickup is a direct Denver arrival booking surface, not a directory.",
    body: "We keep the packages clear, keep the arrival logic tight, and move you into the right booking lane without making you decode a giant service menu.",
    bullets: ["Direct arrival booking", "Private airport rides", "Denver dispensary-stop option"],
    ctaLabel: "Book your pickup",
    ctaHref: "/",
  },
  {
    slug: "faq",
    title: "FAQ",
    headline: "The short answers first.",
    description: "This lane is built to make the arrival decision simple.",
    body: "Pick the route that fits your landing plan, then book direct. If you need help before booking, use the contact page.",
    bullets: ["Private ride only", "Packages stay narrow", "Booking stays on-site"],
    ctaLabel: "See the pickup options",
    ctaHref: "/",
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    headline: "Lightweight site, limited tracking.",
    description: "We track enough to understand booking intent and route fit, not to turn this into a bloated platform.",
    body: "Basic analytics and booking-intent events may be used to understand which airport pickup packages are working. Fulfillment details still belong to the booked service.",
    ctaLabel: "Back to pickup options",
    ctaHref: "/",
  },
  {
    slug: "terms",
    title: "Terms",
    headline: "Use the site to book the arrival plan that fits.",
    description: "Trip timing, routing, and service details should always be checked on the final booking surface.",
    body: "This site presents booking options and route-fit guidance for Denver airport arrival service. Final service conditions, timing, and fulfillment still matter before purchase.",
    ctaLabel: "Return to booking",
    ctaHref: "/",
  },
  {
    slug: "how-it-works",
    title: "How It Works",
    headline: "Pick the arrival shape, then book direct.",
    description: "This site narrows the airport arrival down to the package that fits your landing plan.",
    body: "Choose between the standard private airport ride and the dispensary-stop lane, then move directly into booking without reopening the whole market.",
    bullets: ["Clear package split", "Fast booking path", "No giant transport grid"],
    ctaLabel: "Start with the main pickup page",
    ctaHref: "/",
  },
  {
    slug: "denver-airport-pickup",
    title: "Denver Airport Pickup",
    headline: "Support route for direct airport-pickup links.",
    description: "This page stays live to preserve older direct-pickup links and continue into the operator flow.",
    body: "If you arrived from an older airport-pickup link, continue into the main booking surface. DCC owns the broader planning and comparison layer.",
    bullets: ["Private ride", "Direct from DEN", "Best if you want the clean default"],
    ctaLabel: "Book the direct airport pickup",
    ctaHref: "/",
  },
  {
    slug: "420-friendly-airport-pickup",
    title: "420-Friendly Airport Pickup",
    headline: "Support route for dispensary-stop links.",
    description: "This page remains live for older 420-specific links and continues into the main operator surface.",
    body: "Use this only as a continuity page for existing links. The actual operator choice and booking flow still begins on the main 420 pickup surface.",
    bullets: ["Private ride", "Dispensary-stop route", "Best if that stop is part of the trip"],
    ctaLabel: "Book the 420-friendly pickup",
    ctaHref: "/",
  },
  {
    slug: "airport-pickup-with-dispensary-stop",
    title: "Airport Pickup With Dispensary Stop",
    headline: "Support route for stop-included arrival links.",
    description: "This continuity page remains live for older stop-included links and routes into the main operator surface.",
    body: "If you reached this page from an older link, continue into the main booking surface and keep the arrival plan moving without reopening a broad transport search.",
    bullets: ["Arrival-first planning", "Private vehicle", "Best if you want one continuous route"],
    ctaLabel: "See the stop-included package",
    ctaHref: "/",
  },
];

export const sitePageMap = new Map(sitePages.map((page) => [page.slug, page]));
