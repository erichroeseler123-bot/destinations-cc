import { buildRobotsTxt } from "@/app/robots.txt/handler";
import {
  getDccAuthorityScorecard,
  getDccNetworkDemandToRevenueReport,
} from "@/lib/dcc/commerce/opaqueAttributionLedger";

export interface DccGuideCitationAuditEntry {
  guidePath: string;
  canonicalUrl: string;
  market: "juneau" | "new-orleans" | "red-rocks" | "colorado-mountain";
  robotsDirective: "index, follow";
  allowedCrawlers: string[];
  regionalLlmsTxtUrl: string;
  directAnswerSummary: string;
  sourcedCitations: Array<{
    organization: string;
    title: string;
    url: string;
    checkedAt: string;
  }>;
  nextStepStorefrontUrl: string;
}

export interface DccAiCrawlerAndCitationAuditReport {
  generatedAt: string;
  measurementPolicy: {
    googleLlmsTxtGuidance: string;
    primarySuccessMetrics: string[];
    identifiableAiReferralHosts: string[];
  };
  crawlerReachability: {
    robotsTxtUrl: string;
    rootLlmsTxtUrl: string;
    regionalLlmsTxtUrls: string[];
    explicitlyAllowedBotsInRobotsTxt: string[];
    robotsTxtAllowsAllPublicGuides: boolean;
  };
  indexingAndReferralBaseline: {
    searchConsoleTotalImpressions: number;
    searchConsoleTotalClicks: number;
    observedAiReferralsCount: number;
    observedStorefrontReferralsCount: number;
    confirmedBookingsCount: number;
  };
  auditedGuides: DccGuideCitationAuditEntry[];
}

export const AUDITED_DCC_GUIDES: DccGuideCitationAuditEntry[] = [
  {
    guidePath: "/juneau",
    canonicalUrl: "https://destinationcommandcenter.com/juneau",
    market: "juneau",
    robotsDirective: "index, follow",
    allowedCrawlers: [
      "OAI-SearchBot",
      "GPTBot",
      "PerplexityBot",
      "Claude-SearchBot",
      "Googlebot",
    ],
    regionalLlmsTxtUrl: "https://destinationcommandcenter.com/juneau/llms.txt",
    directAnswerSummary:
      "Check your ship's CLAA port-call window and confirmed all-aboard cutoff against a mandatory 60-minute (CT/FKL/AS downtown walk-off) or 90-minute (AJ/ACT/Tender) gangway return buffer before choosing between a Part 135 glacier helicopter landing (195–240m dock-to-dock), Auke Bay whale watching (210m dock-to-dock), or Mendenhall shuttle (180m dock-to-dock).",
    sourcedCitations: [
      {
        organization: "Cruise Line Agencies of Alaska (CLAA) & CBJ Docks & Harbors",
        title: "2026 Juneau Cruise Ship Berthing & Transfer Schedule",
        url: "https://juneau.org/harbors/cruise-ship-calendar",
        checkedAt: "2026-11-07",
      },
      {
        organization: "U.S. Forest Service — Tongass National Forest",
        title: "Mendenhall Glacier Recreation Area Commercial Visitor Permits",
        url: "https://www.fs.usda.gov/detail/tongass/about-forest/offices/?cid=fseprd1093566",
        checkedAt: "2026-11-07",
      },
      {
        organization: "FAA / NWS Aviation Weather Center (PAJN)",
        title: "Juneau International Airport (PAJN) METAR & VFR Ceiling Context",
        url: "https://aviationweather.gov/data/metar/?id=PAJN",
        checkedAt: "2026-11-07",
      },
    ],
    nextStepStorefrontUrl:
      "https://destinationcommandcenter.com/go/dcc-to-juneau-flight-deck?interest=helicopter",
  },
  {
    guidePath: "/juneau/replan",
    canonicalUrl: "https://destinationcommandcenter.com/juneau/replan",
    market: "juneau",
    robotsDirective: "index, follow",
    allowedCrawlers: [
      "OAI-SearchBot",
      "GPTBot",
      "PerplexityBot",
      "Claude-SearchBot",
      "Googlebot",
    ],
    regionalLlmsTxtUrl: "https://destinationcommandcenter.com/juneau/llms.txt",
    directAnswerSummary:
      "Text-first weak Wi-Fi Juneau replanner (<= 50 KB compressed target): update your ship's arrival or all-aboard time or mark 'My flight was canceled' to see which Auke Bay whale-watching, Mendenhall shuttle, or helicopter options still clear your 60–90 minute gangway buffer, then continue to Juneau Flight Deck with your trip details.",
    sourcedCitations: [
      {
        organization: "Cruise Line Agencies of Alaska (CLAA)",
        title: "Juneau Berth & All-Aboard Buffer Rules",
        url: "https://juneau.org/harbors/cruise-ship-calendar",
        checkedAt: "2026-11-07",
      },
    ],
    nextStepStorefrontUrl:
      "https://destinationcommandcenter.com/go/dcc-to-juneau-flight-deck?low_bw=1&interest=weather-backup",
  },
  {
    guidePath: "/juneau/whale-watching-tours",
    canonicalUrl:
      "https://destinationcommandcenter.com/juneau/whale-watching-tours",
    market: "juneau",
    robotsDirective: "index, follow",
    allowedCrawlers: [
      "OAI-SearchBot",
      "GPTBot",
      "PerplexityBot",
      "Claude-SearchBot",
      "Googlebot",
    ],
    regionalLlmsTxtUrl: "https://destinationcommandcenter.com/juneau/llms.txt",
    directAnswerSummary:
      "Single-activity Auke Bay whale watching requires ~3.5 hours dock-to-dock plus a 60–90 minute gangway return buffer and continues operating under marine visibility rules when low cloud ceilings ground glacier helicopters.",
    sourcedCitations: [
      {
        organization: "NOAA Fisheries Alaska Region",
        title: "Humpback Whale Approach Regulations (50 CFR 224.103 — 100-Yard Rule)",
        url: "https://www.fisheries.noaa.gov/alaska/marine-mammal-protection/humpback-whale-approach-regulations-alaska",
        checkedAt: "2026-11-07",
      },
    ],
    nextStepStorefrontUrl:
      "https://juneauflightdeck.com/juneau-whale-watching-tours?src=dcc-juneau-whale-deck",
  },
  {
    guidePath: "/new-orleans/tours",
    canonicalUrl: "https://destinationcommandcenter.com/new-orleans/tours",
    market: "new-orleans",
    robotsDirective: "index, follow",
    allowedCrawlers: [
      "OAI-SearchBot",
      "GPTBot",
      "PerplexityBot",
      "Claude-SearchBot",
      "Googlebot",
    ],
    regionalLlmsTxtUrl:
      "https://destinationcommandcenter.com/new-orleans/llms.txt",
    directAnswerSummary:
      "With no rental car or a 4–5 hour half-day window from the French Quarter/CBD, book a round-trip hotel-pickup swamp boat or airboat tour (3.75–4.5h door-to-door; airboats enforce a strict minimum age of 5 years while covered pontoon boats welcome all ages 0+).",
    sourcedCitations: [
      {
        organization: "City of New Orleans Ground Transportation Bureau",
        title: "City Code Sec. 162-609 MSY Taxi Flat Rate ($36) & Vieux Carré 32-ft Coach Rule",
        url: "https://nola.gov/next/taxicab-and-for-hire-vehicle-bureau/",
        checkedAt: "2026-11-07",
      },
      {
        organization: "USGS / NWS New Orleans-Baton Rouge (LIX)",
        title: "Bayou Barataria at Lafitte (USGS 07380335) & West Pearl River (USGS 02492620) Gauges",
        url: "https://waterdata.usgs.gov/monitoring-location/07380335/",
        checkedAt: "2026-11-07",
      },
    ],
    nextStepStorefrontUrl:
      "https://www.welcometoneworleanstours.com/swamp-tours?src=dcc-authority-nola-tours",
  },
  {
    guidePath: "/red-rocks",
    canonicalUrl: "https://destinationcommandcenter.com/red-rocks",
    market: "red-rocks",
    robotsDirective: "index, follow",
    allowedCrawlers: [
      "OAI-SearchBot",
      "GPTBot",
      "PerplexityBot",
      "Claude-SearchBot",
      "Googlebot",
    ],
    regionalLlmsTxtUrl:
      "https://destinationcommandcenter.com/red-rocks/llms.txt",
    directAnswerSummary:
      "At Red Rocks Amphitheatre, the venue puts general post-show pickup at Jurassic Lot by Entrance 2 (Upper North and Top Circle are closed to Uber/Lyft pickups, with typical 60–90+ min post-encore queues) and says overnight vehicles should be moved before 10:00 a.m. the next day; Party at Red Rocks currently offers private rides and publishes $399 for a Suburban up to 6 and $599 for a van up to 10, subject to availability.",
    sourcedCitations: [
      {
        organization: "City and County of Denver Arts & Venues — Red Rocks Park",
        title: "Official Parking, Post-Show Pickup at Jurassic Lot by Entrance 2, and Overnight Vehicle Rule (Before 10:00 a.m. Next Day)",
        url: "https://www.redrocksonline.com/plan-your-visit/getting-here/",
        checkedAt: "2026-11-10",
      },
    ],
    nextStepStorefrontUrl:
      "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private?src=dcc-red-rocks-guide",
  },
  {
    guidePath: "/transportation/colorado",
    canonicalUrl: "https://destinationcommandcenter.com/transportation/colorado",
    market: "colorado-mountain",
    robotsDirective: "index, follow",
    allowedCrawlers: [
      "OAI-SearchBot",
      "GPTBot",
      "PerplexityBot",
      "Claude-SearchBot",
      "Googlebot",
    ],
    regionalLlmsTxtUrl:
      "https://destinationcommandcenter.com/routes/denver-breckenridge/llms.txt",
    directAnswerSummary:
      "Compare DEN-to-mountain options on 6 concrete traveler facts: pickup wait, rental collection, overnight resort parking ($15–$65+/night), vehicle & ski-gear fit (GoSno SUV up to 6 pax; GoSno Van up to 10 pax subject to gear fit; 11+ pax require multi-vehicle quote), confirmed pricing ($399/$599 Breck, $499/$599 Vail), and availability—using identical verified I-70 road conditions (CDOT EJMT metering stops traffic entering the affected tunnel for all vehicles; Code 15 passenger noncompliance fine is $100 + $33 surcharge = $133, or $500 + $156 surcharge = $656 if blocking a lane).",
    sourcedCitations: [
      {
        organization: "Colorado Department of Transportation (CDOT)",
        title: "Eisenhower-Johnson Memorial Tunnel (EJMT) Metering Operations",
        url: "https://www.codot.gov/travel/ejmt/metering",
        checkedAt: "2026-11-07",
      },
      {
        organization: "Colorado Department of Transportation (CDOT)",
        title: "Passenger Vehicle Traction & Chain Laws (C.R.S. § 42-4-106 — $100 Fine + $33 Surcharge)",
        url: "https://www.codot.gov/travel/winter-driving/tractionlaw",
        checkedAt: "2026-11-07",
      },
      {
        organization: "GoSno LLC (CO PUC LL-03577)",
        title: "GoSno Public Route Feed Snapshot v1.0",
        url: "https://gosno.co/api/public/route-feed",
        checkedAt: "2026-11-07",
      },
    ],
    nextStepStorefrontUrl:
      "https://gosno.co/vail?origin=DEN&destination=Vail&passengers=7&passengerCount=7&vehicleClass=van&src=dcc-authority-colorado",
  },
];

export function buildDccAiCrawlerAndCitationAuditReport(): DccAiCrawlerAndCitationAuditReport {
  const dccRobots = buildRobotsTxt("destinationcommandcenter.com");
  const scorecard = getDccAuthorityScorecard();
  const networkReport = getDccNetworkDemandToRevenueReport();

  const totalGscImpressions = networkReport.byMarket.reduce(
    (sum, m) => sum + m.gscImpressions28d,
    0,
  );
  const totalGscClicks = networkReport.byMarket.reduce(
    (sum, m) => sum + m.gscClicks28d,
    0,
  );
  const totalStorefrontReferrals = networkReport.byMarket.reduce(
    (sum, m) => sum + m.storefrontReferrals,
    0,
  );
  const totalConfirmedBookings = networkReport.byMarket.reduce(
    (sum, m) => sum + m.confirmedBookings,
    0,
  );

  const requiredBots = [
    "OAI-SearchBot",
    "GPTBot",
    "ChatGPT-User",
    "PerplexityBot",
    "Perplexity-User",
    "Claude-SearchBot",
    "Claude-User",
    "Googlebot",
  ];

  const botsPresent = requiredBots.filter((bot) =>
    dccRobots.includes(`User-agent: ${bot}`),
  );

  return {
    generatedAt: new Date().toISOString(),
    measurementPolicy: {
      googleLlmsTxtGuidance:
        "Google states that /llms.txt has no effect on Google Search visibility, including AI Overviews and AI Mode. DCC treats actual citations, Search Console query/page performance, and verified AI referrals as the result to measure.",
      primarySuccessMetrics: [
        "Verified AI referral sessions (utm_source / Referer from chatgpt.com, perplexity.ai, claude.ai, gemini.google.com)",
        "Google Search Console impressions and clicks on public DCC authority guides",
        "Travelers who found a DCC guide, used its sourced answer to choose a next step, and completed a verified storefront click or booking",
      ],
      identifiableAiReferralHosts: [
        "chatgpt.com",
        "search.chatgpt.com",
        "perplexity.ai",
        "claude.ai",
        "gemini.google.com",
      ],
    },
    crawlerReachability: {
      robotsTxtUrl: "https://destinationcommandcenter.com/robots.txt",
      rootLlmsTxtUrl: "https://destinationcommandcenter.com/llms.txt",
      regionalLlmsTxtUrls: [
        "https://destinationcommandcenter.com/juneau/llms.txt",
        "https://destinationcommandcenter.com/new-orleans/llms.txt",
        "https://destinationcommandcenter.com/red-rocks/llms.txt",
        "https://destinationcommandcenter.com/routes/denver-breckenridge/llms.txt",
        "https://destinationcommandcenter.com/destinations/alaska/llms.txt",
        "https://destinationcommandcenter.com/destinations/colorado/llms.txt",
        "https://destinationcommandcenter.com/destinations/louisiana/llms.txt",
      ],
      explicitlyAllowedBotsInRobotsTxt: botsPresent,
      robotsTxtAllowsAllPublicGuides:
        botsPresent.length === requiredBots.length &&
        dccRobots.includes("Allow: /") &&
        dccRobots.includes("Allow: /llms.txt"),
    },
    indexingAndReferralBaseline: {
      searchConsoleTotalImpressions: totalGscImpressions,
      searchConsoleTotalClicks: totalGscClicks,
      observedAiReferralsCount:
        scorecard.production.foundDcc.byAcquisitionChannel.aiReferral,
      observedStorefrontReferralsCount: totalStorefrontReferrals,
      confirmedBookingsCount: totalConfirmedBookings,
    },
    auditedGuides: AUDITED_DCC_GUIDES,
  };
}
