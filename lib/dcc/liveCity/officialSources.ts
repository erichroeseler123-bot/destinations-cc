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

type SourceInput = Omit<OfficialLiveSource, "realtime"> & { realtime?: boolean };
const source = (value: SourceInput): OfficialLiveSource => ({ realtime: true, ...value });

export const OFFICIAL_LIVE_SOURCES: Record<string, OfficialLiveSource[]> = {
  austin: [
    source({ kind: "transit", label: "CapMetro rider tools", provider: "CapMetro", href: "https://www.capmetro.org/" }),
    source({ kind: "traffic", label: "Austin-area road conditions", provider: "TxDOT DriveTexas", href: "https://drivetexas.org/" }),
  ],
  boston: [
    source({ kind: "transit", label: "MBTA real-time service", provider: "Massachusetts Bay Transportation Authority", href: "https://www.mbta.com/" }),
    source({ kind: "traffic", label: "Massachusetts road conditions", provider: "Massachusetts 511", href: "https://mass511.com/" }),
  ],
  branson: [
    source({ kind: "traffic", label: "Missouri road conditions", provider: "MoDOT Traveler Information", href: "https://traveler.modot.org/" }),
  ],
  chicago: [
    source({
      kind: "transit",
      label: "CTA Train Tracker",
      provider: "Chicago Transit Authority",
      href: "https://www.transitchicago.com/traintracker/",
      api: { available: true, keyRequired: true, env: "CTA_API_KEY", note: "CTA also publishes real-time service data." },
    }),
    source({
      kind: "transit",
      label: "CTA Bus Tracker",
      provider: "Chicago Transit Authority",
      href: "https://www.transitchicago.com/bus-tracker/",
      api: { available: true, keyRequired: true, env: "CTA_API_KEY" },
    }),
    source({ kind: "traffic", label: "Illinois traffic & road conditions", provider: "Illinois Department of Transportation", href: "https://www.gettingaroundillinois.com/" }),
  ],
  denver: [
    source({ kind: "transit", label: "RTD real-time rider tools", provider: "Regional Transportation District", href: "https://www.rtd-denver.com/" }),
    source({ kind: "traffic", label: "COtrip road conditions & cameras", provider: "Colorado Department of Transportation", href: "https://www.cotrip.org/" }),
  ],
  honolulu: [
    source({ kind: "transit", label: "TheBus rider tools & arrivals", provider: "Oahu Transit Services", href: "https://www.thebus.org/" }),
    source({ kind: "traffic", label: "Oahu traffic conditions", provider: "Hawaii Department of Transportation / GoAkamai", href: "https://www.goakamai.org/" }),
  ],
  juneau: [
    source({ kind: "transit", label: "Capital Transit rider information", provider: "City and Borough of Juneau", href: "https://juneaucapitaltransit.org/" }),
    source({ kind: "traffic", label: "Alaska road conditions & cameras", provider: "Alaska 511", href: "https://511.alaska.gov/" }),
    source({ kind: "cruise", label: "Juneau cruise ship calendar", provider: "City and Borough of Juneau", href: "https://juneau.org/harbors/cruise-ship-calendar", realtime: false }),
  ],
  "las-vegas": [
    source({ kind: "transit", label: "RTC real-time rider tools", provider: "Regional Transportation Commission of Southern Nevada", href: "https://www.rtcsnv.com/" }),
    source({ kind: "traffic", label: "Las Vegas live traffic cameras", provider: "RTC Southern Nevada / NDOT", href: "https://www.rtcsnv.com/traffic-cams/watch-live/" }),
    source({ kind: "live-view", label: "City of Las Vegas live stream", provider: "City of Las Vegas", href: "https://www.lasvegasnevada.gov/News/Watch-City-of-Las-Vegas-TV/Live/live" }),
  ],
  "los-angeles": [
    source({ kind: "transit", label: "LA Metro real-time arrivals", provider: "Los Angeles County Metropolitan Transportation Authority", href: "https://www.metro.net/riding/nextrip/" }),
    source({ kind: "traffic", label: "California traffic, incidents & cameras", provider: "Caltrans QuickMap", href: "https://quickmap.dot.ca.gov/" }),
  ],
  miami: [
    source({ kind: "transit", label: "Miami-Dade Transit rider tools", provider: "Miami-Dade County", href: "https://www.miamidade.gov/sites/global/transportation/home.page" }),
    source({ kind: "traffic", label: "Florida 511 traffic & cameras", provider: "Florida Department of Transportation", href: "https://fl511.com/" }),
    source({ kind: "cruise", label: "PortMiami cruise information", provider: "PortMiami", href: "https://www.miamidade.gov/global/portmiami/home.page", realtime: false }),
  ],
  nashville: [
    source({ kind: "transit", label: "WeGo rider tools", provider: "WeGo Public Transit", href: "https://www.wegotransit.com/" }),
    source({ kind: "traffic", label: "TDOT SmartWay traffic & live cameras", provider: "Tennessee Department of Transportation", href: "https://smartway.tn.gov/" }),
  ],
  "new-orleans": [
    source({ kind: "transit", label: "RTA rider tools", provider: "New Orleans Regional Transit Authority", href: "https://www.norta.com/rider-tools" }),
    source({
      kind: "traffic",
      label: "Louisiana 511 traffic & cameras",
      provider: "Louisiana Department of Transportation and Development",
      href: "https://www.511la.org/",
      api: { available: true, keyRequired: true, env: "LA511_API_KEY" },
    }),
    source({ kind: "cruise", label: "Port NOLA cruise schedules", provider: "Port of New Orleans", href: "https://portnola.com/cruise/cruise-lines-itineraries", realtime: false }),
  ],
  "new-york-city": [
    source({ kind: "transit", label: "MTA service status & trip planning", provider: "Metropolitan Transportation Authority", href: "https://new.mta.info/" }),
    source({ kind: "traffic", label: "NYC real-time traffic & cameras", provider: "New York City Department of Transportation", href: "https://www.nyc.gov/html/dot/html/motorist/atis.shtml" }),
    source({ kind: "traffic", label: "511NY traffic & transit map", provider: "New York State Department of Transportation", href: "https://www.511ny.org/Map/" }),
  ],
  orlando: [
    source({ kind: "transit", label: "LYNX trip tools & service alerts", provider: "Central Florida Regional Transportation Authority", href: "https://www.golynx.com/" }),
    source({ kind: "traffic", label: "Florida 511 traffic & cameras", provider: "Florida Department of Transportation", href: "https://fl511.com/" }),
  ],
  phoenix: [
    source({ kind: "transit", label: "Valley Metro rider tools", provider: "Valley Metro", href: "https://www.valleymetro.org/" }),
    source({ kind: "traffic", label: "Phoenix traffic, incidents & cameras", provider: "Arizona 511", href: "https://www.az511.gov/" }),
  ],
  "pigeon-forge": [
    source({ kind: "traffic", label: "TDOT SmartWay traffic & live cameras", provider: "Tennessee Department of Transportation", href: "https://smartway.tn.gov/" }),
  ],
  portland: [
    source({ kind: "transit", label: "TriMet real-time arrivals & alerts", provider: "TriMet", href: "https://trimet.org/" }),
    source({ kind: "traffic", label: "Oregon road conditions & cameras", provider: "ODOT TripCheck", href: "https://tripcheck.com/" }),
  ],
  "salt-lake-city": [
    source({ kind: "transit", label: "UTA rider tools", provider: "Utah Transit Authority", href: "https://www.rideuta.com/" }),
    source({ kind: "traffic", label: "Utah road conditions & cameras", provider: "UDOT Traffic", href: "https://www.udottraffic.utah.gov/" }),
  ],
  "san-antonio": [
    source({ kind: "transit", label: "VIA rider tools", provider: "VIA Metropolitan Transit", href: "https://www.viainfo.net/" }),
    source({ kind: "traffic", label: "San Antonio-area road conditions", provider: "TxDOT DriveTexas", href: "https://drivetexas.org/" }),
  ],
  "san-diego": [
    source({ kind: "transit", label: "MTS real-time rider tools", provider: "San Diego Metropolitan Transit System", href: "https://www.sdmts.com/" }),
    source({ kind: "traffic", label: "California traffic, incidents & cameras", provider: "Caltrans QuickMap", href: "https://quickmap.dot.ca.gov/" }),
    source({ kind: "cruise", label: "San Diego cruise information", provider: "Port of San Diego", href: "https://www.portofsandiego.org/experiences/cruise", realtime: false }),
  ],
  "san-francisco": [
    source({ kind: "transit", label: "Muni real-time rider tools", provider: "San Francisco Municipal Transportation Agency", href: "https://www.sfmta.com/" }),
    source({ kind: "traffic", label: "Bay Area traffic & transit conditions", provider: "511 Bay Area", href: "https://511.org/" }),
    source({ kind: "traffic", label: "California traffic, incidents & cameras", provider: "Caltrans QuickMap", href: "https://quickmap.dot.ca.gov/" }),
    source({ kind: "cruise", label: "Port of San Francisco cruise information", provider: "Port of San Francisco", href: "https://www.sfport.com/passenger-cruises", realtime: false }),
  ],
  scottsdale: [
    source({ kind: "transit", label: "Valley Metro rider tools", provider: "Valley Metro", href: "https://www.valleymetro.org/" }),
    source({ kind: "traffic", label: "Scottsdale/Phoenix traffic & cameras", provider: "Arizona 511", href: "https://www.az511.gov/" }),
  ],
  seattle: [
    source({ kind: "transit", label: "Sound Transit real-time rider tools", provider: "Sound Transit", href: "https://www.soundtransit.org/" }),
    source({
      kind: "traffic",
      label: "Washington real-time traffic & cameras",
      provider: "Washington State Department of Transportation",
      href: "https://wsdot.com/travel/real-time/traffic",
      api: { available: true, keyRequired: true, env: "WSDOT_API_KEY", note: "WSDOT publishes a Traveler Information API including highway cameras." },
    }),
    source({ kind: "cruise", label: "Seattle cruise schedules & terminals", provider: "Port of Seattle", href: "https://www.portseattle.org/page/cruise-ship-schedules", realtime: false }),
  ],
  tampa: [
    source({ kind: "transit", label: "HART rider tools", provider: "Hillsborough Transit Authority", href: "https://www.gohart.org/" }),
    source({ kind: "traffic", label: "Florida 511 traffic & cameras", provider: "Florida Department of Transportation", href: "https://fl511.com/" }),
    source({ kind: "cruise", label: "Port Tampa Bay cruise information", provider: "Port Tampa Bay", href: "https://www.porttb.com/cruise/", realtime: false }),
  ],
  "washington-dc": [
    source({ kind: "transit", label: "Metro real-time service & trip planning", provider: "Washington Metropolitan Area Transit Authority", href: "https://www.wmata.com/" }),
    source({ kind: "traffic", label: "District traffic cameras & road information", provider: "District Department of Transportation", href: "https://ddot.dc.gov/" }),
  ],
  "wisconsin-dells": [
    source({ kind: "traffic", label: "Wisconsin traffic, incidents & cameras", provider: "Wisconsin 511", href: "https://511wi.gov/" }),
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
      const matches = sources.filter((item) => item.kind === kind);
      const configuredApi = matches.some((item) => item.api?.env && Boolean(process.env[item.api.env]));
      return [
        kind === "live-view" ? "liveViews" : kind === "cruise" ? "cruises" : kind,
        {
          available: matches.length > 0,
          sourceCount: matches.length,
          realtime: matches.some((item) => item.realtime),
          apiConfigured: configuredApi,
          mode: configuredApi ? "api" : matches.length ? "official-link" : "unavailable",
        },
      ];
    })
  );
}
