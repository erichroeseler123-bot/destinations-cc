import type {
  CanonicalHeldHostedEvidenceRecord,
  CanonicalHostedFranchiseFactRecord,
  CanonicalHostedOrganizerFactRecord,
  CanonicalHostedSailingFactRecord,
  CanonicalCruiseLineCode,
  HostedVisualKey,
} from "./canonicalHostedCruiseContract";

const checkedAt = "2026-11-24T12:35:00Z";
const theme = "recovery-and-sober-cruises";

const programs = {
  "sober-celebrations": {
    name: "Sober Celebrations",
    aliases: ["Gratitude Cruises"],
    series: "Gratitude Cruises",
    website: "https://www.sobercelebrations.com/",
    summary: "Sober Celebrations, also known as Gratitude Cruises, organizes fellowship trips on ocean ships and riverboats. Its Sober Sisters weekend and annual Halloween cruise have separate registration materials.",
    audience: "Travelers in recovery. The Sober Sisters weekend is for sober women.",
    programming: "Fellowship with other group guests and meetings described in each departure’s flyer.",
    visual: "ship-oasis-of-the-seas-ft-lauderdale",
    classifications: ["hosted_group_sailing", "river_cruise"],
  },
  "the-sober-cruise": {
    name: "The Sober Cruise",
    aliases: ["Rock The Boat Travel"],
    series: "The Sober Cruise",
    website: "https://thesobercruise.co.uk/",
    contact: "https://thesobercruise.co.uk/get-in-touch",
    summary: "Rock The Boat Travel hosts small sober groups aboard Virgin Voyages. Guests join hosted meetups and share the ship with other passengers.",
    audience: "Adults who choose to travel sober and companions who wish to join them.",
    programming: "Hosted meetups and group support, with a maximum of 25 participants.",
    visual: "ship-resilient-lady-san-juan",
    classifications: ["hosted_group_sailing"],
  },
  "sober-vacations-international": {
    name: "Sober Vacations International",
    aliases: ["SVI"],
    series: "Sober Vacations International",
    website: "https://sobervacations.com/",
    summary: "Sober Vacations International organizes recovery trips for travelers and their companions. Its Seine river voyage includes 12-step meetings. The Sober Village program is a separate land vacation.",
    audience: "Travelers in recovery and their companions.",
    programming: "12-step fellowship meetings on the Seine river cruise.",
    visual: "port-rouen-seine-panorama",
    classifications: ["river_cruise"],
  },
  "fellow-ship-vacations": {
    name: "Fellow-Ship Vacations",
    aliases: ["Fellowship Vacations"],
    series: "Fellow-Ship Vacations",
    website: "https://www.fellowshipvacations.com/",
    summary: "Fellow-Ship Vacations organizes group trips for people in recovery and their friends and families. Its Barcelona Sober Sail and Egypt trip each have their own event and booking arrangements.",
    audience: "People in recovery and the friends and family traveling with them.",
    programming: "Departure-specific recovery programming, including meetings and workshops on the Barcelona Sober Sail.",
    visual: "port-ibiza-dalt-vila-harbor",
    classifications: ["hosted_group_sailing", "river_cruise"],
  },
} as const;

type ProgramSlug = keyof typeof programs;

export const soberOrganizers = (Object.keys(programs) as ProgramSlug[]).map(
  (slug): CanonicalHostedOrganizerFactRecord => {
    const program = programs[slug];
    return {
      organizerId: `hosted-organizer:${slug}`, reputationEntityId: `rep:hosted-organizer:${slug}`,
      organizerSlug: slug, organizerName: program.name, shortName: program.name,
      aliases: [], knownBrandAliases: [...program.aliases],
      primaryTheme: theme, secondaryThemes: [], categoryLabel: "Sober and recovery cruises",
      organizerType: "hosted_group_organizer", primaryClassification: program.classifications[0],
      supportedClassifications: [...program.classifications],
      tagline: program.programming, independentSummary: program.summary, organizerProvidedDescription: null,
      designedForAudience: program.audience, typicalHostedProgramming: program.programming,
      typicalCharterModel: program.classifications[0] === "river_cruise" ? "not_verified" : "hosted_group_block",
      soloSupportSummary: null, soloFriendly: null, familyPolicy: slug === "the-sober-cruise" ? "adults_only" : "not_verified",
      goodForTags: ["Sober travel", "Fellowship"], heroVisualKey: program.visual,
      officialWebsiteUrl: program.website, officialDomain: new URL(program.website).hostname.replace(/^www\./, ""),
      publicContactPageUrl: "contact" in program ? program.contact : program.website,
      officialSocialLinks: {}, publicReviewProfileLinks: [], cabinSellerIdentity: "See the organizer’s cabin booking instructions for each departure.",
      officialReservationPathSummary: "Check the organizer’s departure page for cabin and group registration details.",
      cabinBookingPolicyNote: "Contact the organizer to confirm cabin space and participation in the group.",
      cancellationAndParticipationPolicy: null, officialPolicyUrl: null,
      nonAffiliationNotice: "Cruise Promenade independently documents this program.",
      primarySourceUrl: program.website, verifiedSourceCheckedAt: checkedAt, verificationState: "verified",
      departureAnnouncementStatus: "active_upcoming_departures", comparableOrganizerSlugs: [],
    };
  },
);

export const soberFranchises = soberOrganizers.map((org): CanonicalHostedFranchiseFactRecord => {
  const series = programs[org.organizerSlug as ProgramSlug].series;
  return {
    franchiseId: `hosted-franchise:${org.organizerSlug}`, reputationFranchiseEntityId: `rep:hosted-franchise:${org.organizerSlug}`,
    franchiseSlug: org.organizerSlug, aliases: [], franchiseName: series, shortName: series,
    producerOrganizerId: org.organizerId, producerOrganizerSlug: org.organizerSlug,
    relationshipToProducer: ["sober-vacations-international", "fellow-ship-vacations"].includes(org.organizerSlug)
      ? "organizer_program_collection" : "flagship_one_to_one",
    primaryClassification: programs[org.organizerSlug as ProgramSlug].classifications[0],
    primaryTheme: theme, secondaryThemes: [], tagline: org.tagline,
    independentSummary: org.independentSummary, intendedAudience: org.designedForAudience,
    programmingAndLineupModel: org.typicalHostedProgramming, atmosphereSummary: null,
    heroVisualKey: org.heroVisualKey, officialWebsiteUrl: org.officialWebsiteUrl, officialDomain: org.officialDomain,
    departureAnnouncementStatus: "active_upcoming_departures", primarySourceUrl: org.officialWebsiteUrl,
    verifiedSourceCheckedAt: checkedAt, verificationState: "verified",
  };
});

interface ReviewedDeparture {
  organizer: ProgramSlug;
  title: string;
  line: CanonicalCruiseLineCode;
  ship: string;
  date: string;
  region: string;
  visual: HostedVisualKey;
  sailingPage: string;
  evidence: string;
  program: string;
  inclusions?: string;
  audience?: string;
  river?: boolean;
  waitlist?: boolean;
  cabinNote?: string;
}

const departures: ReviewedDeparture[] = [
  {
    organizer: "sober-celebrations", title: "19th Annual Sober Sisters Weekend to the Bahamas",
    line: "rccl", ship: "oasis-of-the-seas", date: "2027-01-15", region: "Bahamas", visual: "port-nassau",
    sailingPage: "https://www.sobercelebrations.com/Jan--2027--Bahamas.html",
    evidence: "https://www.sobercelebrations.com/files/142525072.pdf",
    audience: "Sober women attending the organizer’s three-night Sober Sisters weekend.",
    inclusions: "Admission to the group meetings is tied to Sober Sisters registration.",
    program: "This three-night Sober Sisters weekend sails from Fort Lauderdale to Nassau and CocoCay. Registration with Sober Celebrations is required to attend the group’s meetings. The organizer discloses that alcohol is served on the ship.",
  },
  {
    organizer: "sober-celebrations", title: "Gratitude Cruise to Australia & New Zealand",
    line: "viking", ship: "viking-venus", date: "2027-01-17", region: "Australia and New Zealand", visual: "region-asia-pacific",
    sailingPage: "https://www.sobercelebrations.com/jan--2027.html",
    evidence: "https://www.sobercelebrations.com/files/141074844.pdf",
    program: "Gratitude Cruises hosts a fellowship group on Viking Venus. Guests embark in Sydney on January 17 for an overnight stay and disembark in Auckland on January 31. The organizer advises guests that alcohol is served aboard.",
  },
  {
    organizer: "sober-celebrations", title: "26th Annual Halloween Gratitude Cruise",
    line: "ncl", ship: "norwegian-aura", date: "2027-10-30", region: "Caribbean", visual: "port-roatan",
    sailingPage: "https://www.sobercelebrations.com/26th-annual-halloween-gratitude-cruise-october-30-.html",
    evidence: "https://www.sobercelebrations.com/files/142608865.pdf",
    program: "Women and men can join the Halloween fellowship group on Norwegian Aura. The group flyer lists a 12-step meeting on this seven-night round trip from Miami, with calls including Roatán and Harvest Caye.",
  },
  {
    organizer: "sober-celebrations", title: "Gratitude Cruise to Christmas Markets, Swiss Alps & Rhine Castles",
    line: "amawaterways", ship: "amavenita", date: "2027-11-30", region: "Rhine River", river: true, visual: "port-cologne-rhine-panorama",
    sailingPage: "https://www.sobercelebrations.com/christmas-markets-2027.html",
    evidence: "https://www.sobercelebrations.com/files/141835429.pdf",
    inclusions: "The main program covers seven nights on the river. The four-night Italy land program is optional.",
    program: "The fellowship group boards AmaVenita in Basel on November 30 for seven nights on the Rhine to Amsterdam. Travelers can add a separate November 26–30 land stay in Italy. Check space for your cabin category with Sober Celebrations.",
  },
  {
    organizer: "sober-celebrations", title: "Gratitude Cruise to Japan",
    line: "cel", ship: "celebrity-solstice", date: "2028-03-28", region: "Japan and South Korea", visual: "port-yokohama-minato-mirai",
    sailingPage: "https://www.sobercelebrations.com/2028--gratitude-cruise-to-japan.html",
    evidence: "https://www.sobercelebrations.com/files/142614308.pdf",
    program: "Sober Celebrations takes its fellowship group on a 12-night Celebrity Solstice round trip from Yokohama. The voyage calls at Busan in South Korea and stays overnight in Kobe on April 6–7.",
  },
  {
    organizer: "the-sober-cruise", title: "The Sober Cruise Transatlantic May 2027",
    line: "vv", ship: "resilient-lady", date: "2027-05-02", region: "Transatlantic", visual: "port-miami",
    sailingPage: "https://thesobercruise.co.uk/transatlantic-may-2027",
    evidence: "https://thesobercruise.co.uk/",
    program: "Rock The Boat Travel hosts a group of up to 25 people traveling sober and their companions on the Miami–Barcelona crossing. The 14-night voyage includes sea days together and calls in Tenerife, Tangier and Málaga.",
  },
  {
    organizer: "the-sober-cruise", title: "The Sober Cruise May 2027",
    line: "vv", ship: "resilient-lady", date: "2027-05-16", region: "Western Mediterranean", visual: "port-ibiza-dalt-vila-harbor",
    sailingPage: "https://thesobercruise.co.uk/virgin-voyages-med-may-2027",
    evidence: "https://thesobercruise.co.uk/",
    program: "The hosted sober group sails from Barcelona and stays overnight in Ibiza. Virgin Voyages lists Cannes on May 17. The group itinerary calls that stop Nice/Villefranche, so confirm the meeting port with the organizer before making arrangements.",
  },
  {
    organizer: "the-sober-cruise", title: "The Sober Cruise October 2027",
    line: "vv", ship: "resilient-lady", date: "2027-10-17", region: "Western Mediterranean", visual: "port-barcelona-port-vell",
    sailingPage: "https://thesobercruise.co.uk/virgin-voyages-med-2027",
    evidence: "https://thesobercruise.co.uk/",
    program: "The Sober Cruise hosts meetups aboard a seven-night Virgin Voyages round trip from Barcelona. Participants visit the Italian coast and Corsica before Cannes and Marseille. Guests can inquire directly about joining the group.",
  },
  {
    organizer: "sober-vacations-international", title: "Impressions of the Seine River Cruise",
    line: "amawaterways", ship: "amadante", date: "2027-05-01", region: "Seine River, France", river: true,
    visual: "port-rouen-seine-panorama", waitlist: true,
    sailingPage: "https://sobervacations.com/impressions-of-the-seine/",
    evidence: "https://sobervacations.com/impressions-of-the-seine/",
    program: "SVI’s group follows the Seine from Le Havre to Paris aboard AmaDante, with 12-step meetings and stops in Rouen and Vernon. The trip FAQ welcomes companions who drink. SVI accepts waitlist inquiries for its group space.",
  },
  {
    organizer: "fellow-ship-vacations", title: "Barcelona Sober Sail: French Riviera and Ibiza",
    line: "vv", ship: "resilient-lady", date: "2027-05-30", region: "Western Mediterranean", visual: "port-barcelona-port-vell",
    sailingPage: "https://www.fellowshipvacations.com/2027-virgin-barcelona-to-ibiza/",
    evidence: "https://www.fellowshipvacations.com/2027-virgin-barcelona-to-ibiza/",
    program: "Fellow-Ship runs meetings and workshops for its Barcelona Sober Sail group on Resilient Lady. This French Riviera and Ibiza sailing has a separate pre-cruise Barcelona stay. Event registration and reserving a cabin are separate steps.",
    cabinNote: "The organizer accepts program registrations. Contact Fellow-Ship separately to check cabin availability.",
  },
  {
    organizer: "fellow-ship-vacations", title: "Experience of Egypt: Cairo, Luxor & Aswan with Nile Cruise and Sharm El Sheikh",
    line: "sonesta", ship: "sonesta-sun-goddess", date: "2028-09-18", region: "Nile River, Egypt", river: true,
    visual: "port-nile-aswan-feluccas", waitlist: true,
    sailingPage: "https://www.fellowshipvacations.com/experience-egypt-in-style-cairo-luxor-aswan-the-nile-with-a-sharm-el-sheikh-escape/",
    evidence: "https://www.fellowshipvacations.com/experience-egypt-in-style-cairo-luxor-aswan-the-nile-with-a-sharm-el-sheikh-escape/",
    inclusions: "The Egypt package combines four nights aboard Sonesta Sun Goddess with land stays in Cairo and Sharm El Sheikh.",
    program: "Fellow-Ship’s September 15–26 Egypt trip includes four nights aboard Sonesta Sun Goddess from Luxor to Aswan, September 18–22. Cairo and Sharm El Sheikh are land stays. The organizer offers a waitlist for the sold-out package.",
  },
];

export const soberSailings = departures.map((d): CanonicalHostedSailingFactRecord => {
  const org = programs[d.organizer];
  const sailingSlug = `${d.ship}-${d.date}`;
  const identity = `${d.line}:${d.ship}:${d.date}`;
  return {
    hostedSailingId: `hosted-sailing:${d.organizer}:${identity}`,
    reputationSailingEntityId: `rep:hosted-sailing:${d.organizer}:${sailingSlug}`,
    organizerSlug: d.organizer, franchiseId: `hosted-franchise:${d.organizer}`, franchiseSlug: d.organizer,
    sailingSlug, physicalSailingId: `sailing:${identity}`, canonicalLineCode: d.line,
    canonicalShipSlug: d.ship, canonicalSailDate: d.date,
    sailingTitle: d.title, shortHeadline: d.title, editionSubtitle: d.region, anticipationHook: org.programming,
    primaryTheme: theme, secondaryThemes: [], visualKey: d.visual, regionLabel: d.region,
    organizerType: "hosted_group_organizer", experienceClassification: d.river ? "river_cruise" : "hosted_group_sailing",
    vesselType: d.river ? "River cruise ship" : "Ocean cruise ship",
    inclusionsSummary: d.inclusions ?? null,
    alcoholPolicyScope: "hosted_group_only", alcoholPolicySourceUrl: d.evidence,
    officialSailingPageUrl: d.sailingPage, officialReservationFormUrl: d.sailingPage,
    cabinSellerLabel: org.name, cabinBookingCtaLabel: d.waitlist ? "Ask about the waitlist" : "View organizer details",
    cabinAvailabilityStatus: d.waitlist ? "waitlist" : "not_verified",
    cabinAvailabilityNote: d.cabinNote ?? (d.waitlist ? "The organizer reports its group space is sold out and accepts waitlist inquiries." : "Ask the organizer for current group cabin availability."),
    verifiedStartingPriceUsd: null, verifiedPriceNote: null,
    approximateGroupSizeLabel: d.organizer === "the-sober-cruise" ? "Up to 25 participants" : null,
    fullShipCharter: d.river ? null : false, typicalAudience: d.audience ?? org.audience,
    announcedHostedProgramming: d.program, programmingSourceUrl: d.sailingPage,
    soloSupport: null, soloFriendly: null, familyPolicy: d.line === "vv" ? "adults_only" : "not_verified",
    communityAtmosphereSummary: null, goodForTags: ["Sober travel", d.region],
    lifecycleStatus: "upcoming", primarySourceUrl: d.sailingPage, organizerSourceCheckedAt: checkedAt,
    verificationState: "verified", portScheduleVerificationMode: "official_day_by_day_route",
  };
});

export const soberEvidenceHolds: CanonicalHeldHostedEvidenceRecord[] = [
  {
    holdId: "dcc-hold-sober-cruise-september-2027", organizerSlug: "the-sober-cruise", organizerName: "The Sober Cruise",
    candidateTitle: "The Sober Cruise Mediterranean — September 2027", candidateDatesOrVessel: "September 12, 2027 · Resilient Lady",
    checkedSourceUrl: "https://thesobercruise.co.uk/future-sober-sailings", checkedAt,
    reasonCode: "CONFLICTING_OFFICIAL_ITINERARY_COPY",
    holdReason: "The September listing opens the October 17 event and cabin inquiry. A dedicated September group program needs organizer confirmation.",
  },
  {
    holdId: "dcc-hold-fellow-ship-mexican-riviera-2028", organizerSlug: "fellow-ship-vacations", organizerName: "Fellow-Ship Vacations",
    candidateTitle: "Mexican Riviera Sober Sail", candidateDatesOrVessel: "March 17, 2028 · Navigator of the Seas",
    checkedSourceUrl: "https://www.fellowshipvacations.com/2028-mexican-riviera-sober-sail/", checkedAt,
    reasonCode: "MISSING_FUNCTIONAL_SAILING_PATHWAY",
    holdReason: "The organizer’s event URL redirects to its homepage. Its current schedule and shop omit the group. Royal Caribbean’s published ship itinerary confirms only the underlying sailing.",
  },
  {
    holdId: "dcc-hold-sober-celebrations-christmas-markets-2028", organizerSlug: "sober-celebrations", organizerName: "Sober Celebrations",
    candidateTitle: "Christmas Markets 2028", candidateDatesOrVessel: "2028 · ship and sailing date unannounced",
    checkedSourceUrl: "https://www.sobercelebrations.com/files/142608865.pdf", checkedAt,
    reasonCode: "COMING_SOON_UNRELEASED",
    holdReason: "The Halloween flyer mentions a 2028 Christmas Markets trip without a dated departure or named vessel.",
  },
];

