export type OfficialLiveSource = {
  kind: "transit" | "traffic" | "cruise" | "live-view" | "sports";
  label: string;
  provider: string;
  href: string;
  realtime: boolean;
  api?: {
    available: boolean;
    keyRequired?: boolean;
    env?: string;
    note?: string;
  };
};

export const OFFICIAL_LIVE_SOURCES: Record<string, OfficialLiveSource[]> = {
  austin: [
    {
      kind: "transit",
      label: "CapMetro schedules, service alerts & maps",
      provider: "CapMetro",
      href: "https://www.capmetro.org/ride/plan/schedmap",
      realtime: true,
    },
    {
      kind: "traffic",
      label: "Austin-area road conditions",
      provider: "TxDOT DriveTexas",
      href: "https://drivetexas.org/",
      realtime: true,
    },
  ],
  chicago: [
    {
      kind: "transit",
      label: "CTA Train Tracker",
      provider: "Chicago Transit Authority",
      href: "https://www.transitchicago.com/traintracker/",
      realtime: true,
      api: {
        available: true,
        keyRequired: true,
        env: "CTA_API_KEY",
        note: "CTA also publishes GTFS-Realtime service alerts, trip updates and vehicle positions.",
      },
    },
    {
      kind: "transit",
      label: "CTA Bus Tracker",
      provider: "Chicago Transit Authority",
      href: "https://www.transitchicago.com/bus-tracker/",
      realtime: true,
      api: {
        available: true,
        keyRequired: true,
        env: "CTA_API_KEY",
      },
    },
    {
      kind: "traffic",
      label: "Illinois traffic & road conditions",
      provider: "Illinois Department of Transportation",
      href: "https://www.gettingaroundillinois.com/",
      realtime: true,
    },
  ],
  denver: [
    {
      kind: "transit",
      label: "RTD trip planner & service information",
      provider: "Regional Transportation District",
      href: "https://www.rtd-denver.com/",
      realtime: true,
    },
    {
      kind: "traffic",
      label: "COtrip road conditions & cameras",
      provider: "Colorado Department of Transportation",
      href: "https://www.cotrip.org/",
      realtime: true,
    },
  ],
  "las-vegas": [
    {
      kind: "transit",
      label: "RTC real-time ride tracker",
      provider: "Regional Transportation Commission of Southern Nevada",
      href: "https://www.rtcsnv.com/",
      realtime: true,
    },
    {
      kind: "traffic",
      label: "Las Vegas live traffic cameras",
      provider: "RTC Southern Nevada / NDOT",
      href: "https://www.rtcsnv.com/traffic-cams/watch-live/",
      realtime: true,
    },
    {
      kind: "live-view",
      label: "City of Las Vegas live stream",
      provider: "City of Las Vegas",
      href: "https://www.lasvegasnevada.gov/News/Watch-City-of-Las-Vegas-TV/Live/live",
      realtime: true,
    },
  ],
  miami: [
    {
      kind: "transit",
      label: "Miami-Dade Transit rider tools",
      provider: "Miami-Dade County",
      href: "https://www.miamidade.gov/sites/global/transportation/home.page",
      realtime: true,
    },
    {
      kind: "traffic",
      label: "Florida 511 traffic & cameras",
      provider: "Florida Department of Transportation",
      href: "https://fl511.com/",
      realtime: true,
    },
    {
      kind: "cruise",
      label: "PortMiami cruise information",
      provider: "PortMiami",
      href: "https://www.miamidade.gov/global/portmiami/home.page",
      realtime: false,
    },
  ],
  nashville: [
    {
      kind: "transit",
      label: "WeGo trip planner",
      provider: "WeGo Public Transit",
      href: "https://www.wegotransit.com/",
      realtime: true,
    },
    {
      kind: "traffic",
      label: "TDOT SmartWay traffic & live cameras",
      provider: "Tennessee Department of Transportation",
      href: "https://smartway.tn.gov/",
      realtime: true,
    },
  ],
  "new-orleans": [
    {
      kind: "transit",
      label: "RTA rider tools",
      provider: "New Orleans Regional Transit Authority",
      href: "https://www.norta.com/rider-tools",
      realtime: true,
    },
    {
      kind: "traffic",
      label: "Louisiana 511 traffic & cameras",
      provider: "Louisiana Department of Transportation and Development",
      href: "https://www.511la.org/",
      realtime: true,
      api: {
        available: true,
        keyRequired: true,
        env: "LA511_API_KEY",
      },
    },
    {
      kind: "cruise",
      label: "Port NOLA cruise schedules",
      provider: "Port of New Orleans",
      href: "https://portnola.com/cruise/cruise-lines-itineraries",
      realtime: false,
    },
  ],
  "new-york-city": [
    {
      kind: "transit",
      label: "MTA service status & trip planning",
      provider: "Metropolitan Transportation Authority",
      href: "https://new.mta.info/",
      realtime: true,
    },
    {
      kind: "traffic",
      label: "NYC real-time traffic & cameras",
      provider: "New York City Department of Transportation",
      href: "https://www.nyc.gov/html/dot/html/motorist/atis.shtml",
      realtime: true,
    },
    {
      kind: "traffic",
      label: "511NY traffic & transit map",
      provider: "New York State Department of Transportation",
      href: "https://www.511ny.org/Map/",
      realtime: true,
    },
  ],
};

export function getOfficialLiveSources(citySlug: string) {
  return OFFICIAL_LIVE_SOURCES[citySlug] || [];
}

export function getProviderSlotStatus(citySlug: string) {
  const sources = getOfficialLiveSources(citySlug);
  const kinds = ["traffic", "transit", "cruise", "live-view", "sports"] as const;
  return Object.fromEntries(
    kinds.map((kind) => {
      const matches = sources.filter((source) => source.kind === kind);
      const configuredApi = matches.some((source) => source.api?.env && Boolean(process.env[source.api.env]));
      return [
        kind === "live-view" ? "liveViews" : kind === "cruise" ? "cruises" : kind,
        {
          available: matches.length > 0,
          sourceCount: matches.length,
          realtime: matches.some((source) => source.realtime),
          apiConfigured: configuredApi,
          mode: configuredApi ? "api" : matches.length ? "official-link" : "unavailable",
        },
      ];
    })
  );
}
