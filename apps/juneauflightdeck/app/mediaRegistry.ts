export type JfdMediaRole = "hero" | "tour-card" | "support";

export type JfdMediaAsset = {
  id: string;
  src: string;
  alt: string;
  source: "dcc-authority-local";
  sourceNote: string;
  roles: JfdMediaRole[];
};

export const jfdMedia = {
  juneauPortHero: {
    id: "jfd-juneau-port-hero",
    src: "/images/authority/ports/juneau/hero.webp",
    alt: "Juneau harbor and mountain scenery for Alaska shore excursion planning",
    source: "dcc-authority-local",
    sourceNote: "Recovered DCC authority media copied into the JFD app public folder.",
    roles: ["hero"],
  },
  juneauHarbor: {
    id: "jfd-juneau-harbor",
    src: "/images/authority/ports/juneau/section-1.webp",
    alt: "Juneau waterfront and harbor scenery for cruise excursion planning",
    source: "dcc-authority-local",
    sourceNote: "Recovered DCC authority media copied into the JFD app public folder.",
    roles: ["support"],
  },
  juneauWaterBackup: {
    id: "jfd-juneau-water-backup",
    src: "/images/authority/ports/juneau/gallery-1.webp",
    alt: "Juneau harbor and coastal Alaska water scenery for whale watching backup plans",
    source: "dcc-authority-local",
    sourceNote: "Recovered DCC authority media copied into the JFD app public folder.",
    roles: ["tour-card"],
  },
  mendenhallHero: {
    id: "jfd-mendenhall-hero",
    src: "/images/authority/attractions/mendenhall-glacier/hero.webp",
    alt: "Mendenhall Glacier landscape near Juneau, Alaska",
    source: "dcc-authority-local",
    sourceNote: "Recovered DCC authority media copied into the JFD app public folder.",
    roles: ["tour-card"],
  },
  mendenhallSection: {
    id: "jfd-mendenhall-section",
    src: "/images/authority/attractions/mendenhall-glacier/section-1.webp",
    alt: "Mendenhall Glacier and mountain scenery near Juneau",
    source: "dcc-authority-local",
    sourceNote: "Recovered DCC authority media copied into the JFD app public folder.",
    roles: ["tour-card"],
  },
} satisfies Record<string, JfdMediaAsset>;

export const jfdMediaDoctrinePages = [
  {
    route: "/",
    surface: "juneauflightdeck-home",
    requiredRealImages: [
      jfdMedia.juneauPortHero.id,
      jfdMedia.mendenhallHero.id,
      jfdMedia.mendenhallSection.id,
      jfdMedia.juneauWaterBackup.id,
    ],
    allowedSupportBadges: ["weather-pivot"],
    forbiddenVisuals: ["abstract-placeholder", "dark-poster-tile", "giant-typography-tile"],
  },
];
