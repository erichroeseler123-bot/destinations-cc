import type {
  CanonicalHostedFranchiseFactRecord,
  CanonicalHostedOrganizerFactRecord,
  CanonicalHostedSailingFactRecord,
} from "./canonicalHostedCruiseContract";
import {
  enqueueDccFactVerificationItem,
  type DccFactVerificationQueueItem,
} from "./canonicalLocationsAndRoutePatterns";

export interface VerifiedHistoricalOutreachRecord {
  attemptedAt: string;
  fromAddress: string;
  toAddress: string;
  status: "bounced_or_failed" | "sent_not_delivery_confirmed";
  bounceDetected: boolean;
  replyReceived: boolean;
  deliveryConfirmedByProvider: false;
  countedAsConversionOrApplication: false;
  note: string;
}

export interface FoundingPilotDraftInvitation {
  pilotNumber: 1 | 2 | 3 | 4 | 5;
  organizerId: string;
  organizerSlug: string;
  organizerName: string;
  franchiseSlugs: string[];
  primarySailingSlug: string;
  backupComparisonFixtureSlug?: string;
  outreachEligibility:
    | "safe_pilot_ready_hold_send"
    | "blocked_disputed_source_hold_noindex";
  outreachDispatchState:
    | "draft_do_not_send"
    | "future_follow_up_draft_do_not_send";
  draftKind?: "initial_intro_draft" | "future_brief_follow_up_draft";
  doNotSendAnotherIntroEmail?: boolean;
  verifiedHistoricalOutreach?: VerifiedHistoricalOutreachRecord | null;
  sentAt: null;
  zeroOutreachSentGuarantee: boolean;
  organizerFeeUsd: 0;
  cabinCommissionPercent: 0;
  downstreamAffiliateCommissionDisclosed: true;
  previewOrganizerWorkspacePath: string;
  previewPublicSailingPaths: string[];
  recipientEmail?: string;
  fromAddress?: string;
  replyToAddress?: string;
  sailingLinkWithUtm?: string;
  organizerClaimLinkWithUtm?: string;
  trackingParameters?: {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content_sailing: string;
    utm_content_claim: string;
  };
  subjectLine: string;
  draftMessageBody: string;
}

export const FOUNDING_PILOT_ORGANIZERS: readonly CanonicalHostedOrganizerFactRecord[] = [
  {
    organizerId: "hosted-organizer:the-online-itinerant",
    reputationEntityId: "rep:hosted-organizer:the-online-itinerant",
    organizerSlug: "the-online-itinerant",
    aliases: ["sailing-towards-success"],
    knownBrandAliases: [
      "The Online Itinerant",
      "Sailing Towards Success",
      "Sailing Towards Success Conference Cruise",
    ],
    organizerName: "The Online Itinerant (Sailing Towards Success)",
    shortName: "Online Itinerant",
    categoryLabel: "Deaf & Hard-of-Hearing Continuing Education Conference Cruises",
    organizerType: "hosted_group_organizer",
    primaryClassification: "hosted_group_sailing",
    supportedClassifications: ["hosted_group_sailing"],
    subBrands: [],
    primaryTheme: "business-and-networking",
    secondaryThemes: [],
    tagline:
      "Continuing-education conference and networking cruises for Teachers of the Deaf/Hard of Hearing, audiologists, SLPs, and ASL interpreters.",
    independentSummary:
      "Founded by Stefanie Kessen, M.Ed., The Online Itinerant hosts the Sailing Towards Success Deaf Education Conference and Networking Cruise—combining ASHA, AG Bell, RID, and state continuing-education workshops on sea days with an optional Deaf Pride Day hearing-aid service project in Cozumel.",
    organizerProvidedDescription: null,
    designedForAudience:
      "Teachers of the Deaf/Hard of Hearing (TOD/DHH), itinerant teachers, educational audiologists, speech-language pathologists (SLPs), ASL interpreters, and special-education administrators.",
    audienceFocusTags: [
      "Continuing education cruisers",
      "Educators & clinicians",
      "Solo cruisers",
    ],
    typicalHostedProgramming:
      "10–11 hours of sea-day professional development sessions, exhibit hall networking, keynote sessions, ASL comedy/entertainment, group dinners, and an optional Cozumel CAM School hearing-aid fitting service project.",
    generalAtmosphereSummary:
      "Supportive, ASL-accessible professional learning community balancing sea-day CEU sessions with relaxed Caribbean shore days.",
    typicalCharterModel: "hosted_group_block",
    vesselTypeSummary: "Hosted conference block aboard Carnival Valor (~2,980 guests)",
    approximateScaleSummary: "Hosted educational conference group block",
    publishedStartingPriceSummary:
      "Member conference + cabin rates from $775 pp double occupancy ($1,025 non-member); standalone conference pass $525 (2027 registration closed)",
    inclusionsSummary:
      "Carnival stateroom, main dining meals, taxes/port fees/gratuities (when booked in group block), and scheduled Sailing Towards Success PD workshops",
    soloSupportSummary:
      "Educators frequently attend solo or pair with fellow itinerant DHH colleagues; non-attendee family/friends may book cruise-only guest rates and join group dinners.",
    soloFriendly: true,
    familyPolicy: "mixed_group",
    accessibilitySummary:
      "ASL interpretation and DHH-accessible conference workshops provided across scheduled Sailing Towards Success sessions.",
    officialAccessibilityUrl: "https://www.theonlineitinerant.com/cruise-2027",
    departureAnnouncementStatus: "active_upcoming_departures",
    goodForTags: [
      "Continuing education (CEUs)",
      "Educators & SLPs",
      "Service-project shore days",
    ],
    heroVisualKey: "port-cozumel",
    officialWebsiteUrl: "https://www.theonlineitinerant.com/cruise-2027",
    officialDomain: "theonlineitinerant.com",
    publicContactPageUrl: "https://www.theonlineitinerant.com/ceus-credits",
    officialSocialLinks: {},
    cabinSellerIdentity: "The Online Itinerant conference group block on Carnival Cruise Line",
    officialReservationPathSummary:
      "Conference + cabin packages are managed directly through The Online Itinerant at theonlineitinerant.com/cruise-2027 (currently marked Registration Closed for Jan 2027).",
    cancellationAndParticipationPolicy:
      "Conference CEU attendance requires mandatory sign-in/sign-out (missing >10 minutes forfeits credit). Optional Cozumel CAM School Deaf Pride Day service project ($60) is ticketed separately.",
    officialPolicyUrl: "https://www.theonlineitinerant.com/ceus-credits",
    publicReviewProfileLinks: [],
    nonAffiliationNotice:
      "Cruise Promenade is an independent directory and shore-planning platform and is not affiliated with The Online Itinerant or Carnival Cruise Line.",
    cabinBookingPolicyNote:
      "All conference registrations and group cabins are handled directly by The Online Itinerant. Cruise Promenade never sells cabins or collects conference fees.",
    primarySourceUrl: "https://www.theonlineitinerant.com/cruise-2027",
    verifiedSourceCheckedAt: "2026-11-16T18:11:55Z",
    verificationState: "schedule_hold",
    comparableOrganizerSlugs: ["cmmc-at-sea", "acquisition-lab"],
  },
  {
    organizerId: "hosted-organizer:king-con-cruise",
    reputationEntityId: "rep:hosted-organizer:king-con-cruise",
    organizerSlug: "king-con-cruise",
    aliases: ["jon-st-john-king-con-cruise"],
    knownBrandAliases: ["King Con Cruise", "Jon St. John Presents: King Con Cruise"],
    organizerName: "King Con Cruise",
    shortName: "King Con",
    categoryLabel: "Tabletop Gaming, Video Game & Voice-Actor Fandom Convention Cruises",
    organizerType: "hosted_group_organizer",
    primaryClassification: "hosted_group_sailing",
    supportedClassifications: ["hosted_group_sailing"],
    subBrands: [],
    primaryTheme: "crafting-and-hobbies",
    secondaryThemes: ["weddings-and-celebrations"],
    tagline:
      "Tabletop TTRPG, video-game, cosplay, and voice-actor convention group cruise hosted by Jon St. John.",
    independentSummary:
      "Hosted by voice actor Jon St. John alongside affiliated group agency Academy Travel, King Con Cruise brings tabletop RPG players, video gamers, anime fans, and cosplayers together aboard Norwegian Joy out of Miami for custom Quest Guild TTRPG campaigns, Kigu Karaoke, improv comedy, tournaments, and group shore quests.",
    organizerProvidedDescription: null,
    designedForAudience:
      "Tabletop RPG players, video-game fans, anime/cosplay enthusiasts, and LGBTQ+-friendly nerd/fandom communities.",
    audienceFocusTags: [
      "Tabletop & RPG gamers",
      "Cosplay & fandom travelers",
      "Solo cruisers",
    ],
    typicalHostedProgramming:
      "Quest Guild custom TTRPG campaigns (including an island quest in Nassau), Kigu Karaoke hosted by Jon St. John, Improvageddon! interactive comedy, video-game & trivia tournaments, three themed pub crawls, and nightly group dinners.",
    generalAtmosphereSummary:
      "Inclusive, casual convention-at-sea community where badges unlock private onboard gaming and voice-actor social events.",
    typicalCharterModel: "hosted_group_block",
    vesselTypeSummary: "Hosted convention group block aboard Norwegian Joy (~3,804 guests)",
    approximateScaleSummary: "Hosted fandom convention group block",
    publishedStartingPriceSummary:
      "Convention badge $100 pp ($90 pp for groups of 6+; $50 teen pass) + NCL cabin booked through affiliated agency Academy Travel",
    inclusionsSummary:
      "King Con badge covers all private Quest Guild TTRPG sessions, tournaments, karaoke, improv shows, and pub crawls; NCL cabin booked separately via Academy Travel",
    soloSupportSummary:
      "Solo gamers welcome across open-table TTRPG campaigns, trivia teams, and hosted group dining tables.",
    soloFriendly: true,
    familyPolicy: "family_friendly",
    accessibilitySummary:
      "NCL vessel accessibility coordinated through Academy Travel upon cabin reservation.",
    officialAccessibilityUrl: "https://kingconcruise.com/faq/",
    departureAnnouncementStatus: "active_upcoming_departures",
    goodForTags: ["Tabletop & D&D gamers", "Cosplay & voice-actor fans", "Group cruisers"],
    heroVisualKey: "sail-away-deck-meetup",
    officialWebsiteUrl: "https://kingconcruise.com/",
    officialDomain: "kingconcruise.com",
    publicContactPageUrl: "https://kingconcruise.com/faq/",
    officialSocialLinks: {},
    cabinSellerIdentity:
      "King Con Cruise (badges via kingconcruise.com) + Academy Travel (mandatory group cabin booking)",
    officialReservationPathSummary:
      "Two-step official process: purchase a King Con Cruise badge at kingconcruise.com/registration/, then book your Norwegian Joy stateroom through affiliated agency Academy Travel.",
    cancellationAndParticipationPolicy:
      "King Con Cruise badges are non-refundable and close 30 days before sailing; group cabin block rates closed at the 120-day cutoff with prevailing NCL rates quoted upon inquiry.",
    officialPolicyUrl: "https://kingconcruise.com/terms/",
    publicReviewProfileLinks: [],
    nonAffiliationNotice:
      "Cruise Promenade is an independent directory and shore-planning platform and is not affiliated with King Con Cruise, Academy Travel, or Norwegian Cruise Line.",
    cabinBookingPolicyNote:
      "All convention badges and group staterooms must be purchased through King Con Cruise and Academy Travel. Cruise Promenade never sells badges or cabins.",
    primarySourceUrl: "https://kingconcruise.com/",
    verifiedSourceCheckedAt: "2026-11-16T18:20:08Z",
    verificationState: "schedule_hold",
    comparableOrganizerSlugs: ["the-fan-cruise", "stitchin-heaven"],
  },
  {
    organizerId: "hosted-organizer:the-fan-cruise",
    reputationEntityId: "rep:hosted-organizer:the-fan-cruise",
    organizerSlug: "the-fan-cruise",
    aliases: ["fan-cruise-vacations", "houston-fan-cruise", "the-astros-locker"],
    knownBrandAliases: [
      "The Fan Cruise",
      "Fan Cruise Vacations",
      "Houston Fan Cruise",
      "The Astros Locker",
    ],
    organizerName: "The Fan Cruise (Fan Cruise Vacations)",
    shortName: "The Fan Cruise",
    categoryLabel: "Pro-Sports Alumni & Enthusiast Community Group Cruises",
    organizerType: "hosted_group_organizer",
    primaryClassification: "hosted_group_sailing",
    supportedClassifications: ["hosted_group_sailing"],
    subBrands: [],
    primaryTheme: "crafting-and-hobbies",
    secondaryThemes: ["weddings-and-celebrations"],
    tagline:
      "Texas-based group cruise producer operating Astros Fan Cruise, Texans Sailgate Fan Cruise, and the FamAlly Alliance RV Owners Cruise.",
    independentSummary:
      "Led by travel agent and onboard host Daniel Meyer ('The Commissioner'), The Fan Cruise (fan-cruise.com, formerly The Astros Locker) produces recurring hosted group cruises from Galveston and New Orleans—including the Houston baseball alumni Astros Fan Cruise, the Texans Sailgate football fan cruise, and the FamAlly Cruise for Alliance RV owners ('Allies').",
    organizerProvidedDescription: null,
    designedForAudience:
      "Houston baseball and football fans, sports memorabilia/alumni enthusiasts, and Alliance RV owner community members ('Allies').",
    audienceFocusTags: [
      "Sports fan groups",
      "RV owner communities",
      "Gulf Coast drive-to cruisers",
    ],
    typicalHostedProgramming:
      "Alumni Q&A panels, autograph & photo sessions, game watch parties, Astros/Texans Feud & Jeopardy trivia, cabin gift exchanges, bar crawls, slot pulls, and private alumni shore excursions.",
    generalAtmosphereSummary:
      "High-spirit, family-friendly Texas fan and enthusiast group community with dedicated onboard hospitality desk.",
    typicalCharterModel: "hosted_group_block",
    vesselTypeSummary:
      "Hosted group blocks aboard Carnival Jubilee, Carnival Breeze, and Royal Caribbean Mariner of the Seas",
    approximateScaleSummary:
      "Hosted group blocks (75-guest capped FamAlly RV cohort up to multi-hundred-guest sports fan groups)",
    publishedStartingPriceSummary:
      "From $674–$810 pp double occupancy (taxes included; standard gratuities separate)",
    inclusionsSummary:
      "Cruise stateroom + taxes/port fees + Fan Cruise Experience Pass when booked directly through Fan Cruise (a la carte VIP alumni dinners/excursions optional)",
    soloSupportSummary:
      "Solo sports fans and RV owners welcome at group trivia, watch parties, hospitality desk meetups, and group shore excursions.",
    soloFriendly: true,
    familyPolicy: "family_friendly",
    accessibilitySummary:
      "Accessible stateroom requests coordinated with Carnival Cruise Line or Royal Caribbean through Fan Cruise Vacations.",
    officialAccessibilityUrl: "https://www.fan-cruise.com/terms",
    departureAnnouncementStatus: "active_upcoming_departures",
    goodForTags: [
      "Houston sports fans",
      "Alliance RV owners",
      "Galveston & New Orleans departures",
    ],
    heroVisualKey: "fleet-hero",
    officialWebsiteUrl: "https://www.fan-cruise.com/",
    officialDomain: "fan-cruise.com",
    publicContactPageUrl: "https://www.fan-cruise.com/about",
    officialSocialLinks: {},
    cabinSellerIdentity:
      "Fan Cruise Vacations (reservations managed by Fan Cruise; cruise-fare payments processed directly with the cruise line)",
    officialReservationPathSummary:
      "Book cabins directly via fan-cruise.com (/astros2027, /texans2027, /famally2027) so the Fan Cruise Experience Pass is included.",
    cancellationAndParticipationPolicy:
      "Deposits ($250–$400 per cabin) and final-payment deadlines follow group contract terms on fan-cruise.com/terms; independent cabin bookings require a separate Experience Pass fee ($50–$200 pp).",
    officialPolicyUrl: "https://www.fan-cruise.com/terms",
    publicReviewProfileLinks: [],
    nonAffiliationNotice:
      "Cruise Promenade is an independent directory and shore-planning platform and is not affiliated with The Fan Cruise, MLB/NFL franchises, Alliance RV, Carnival, or Royal Caribbean.",
    cabinBookingPolicyNote:
      "All group staterooms and Experience Passes are arranged directly through The Fan Cruise (fan-cruise.com). Cruise Promenade never sells cabins.",
    primarySourceUrl: "https://www.fan-cruise.com/",
    verifiedSourceCheckedAt: "2026-11-16T18:13:38Z",
    verificationState: "schedule_hold",
    comparableOrganizerSlugs: ["king-con-cruise", "stitchin-heaven"],
  },
];

export const FOUNDING_PILOT_FRANCHISES: readonly CanonicalHostedFranchiseFactRecord[] = [
  {
    franchiseId: "hosted-franchise:sailing-towards-success",
    reputationFranchiseEntityId: "rep:hosted-franchise:sailing-towards-success",
    franchiseSlug: "sailing-towards-success",
    aliases: ["the-online-itinerant-conference-cruise"],
    franchiseName: "Sailing Towards Success Conference Cruise",
    shortName: "Sailing Towards Success",
    producerOrganizerId: "hosted-organizer:the-online-itinerant",
    producerOrganizerSlug: "the-online-itinerant",
    relationshipToProducer: "flagship_one_to_one",
    primaryClassification: "hosted_group_sailing",
    primaryTheme: "business-and-networking",
    secondaryThemes: [],
    tagline:
      "Deaf and hard-of-hearing education conference cruise with sea-day CEU workshops and Cozumel hearing-aid service project.",
    independentSummary:
      "Recurring professional-development cruise series produced by The Online Itinerant for DHH teachers, educational audiologists, SLPs, and ASL interpreters.",
    intendedAudience:
      "Teachers of the Deaf/Hard of Hearing, educational audiologists, SLPs, and ASL interpreters.",
    programmingAndLineupModel:
      "10–11 hours of accredited sea-day PD trainings, exhibit hall, ASL entertainment, and optional Cozumel CAM School clinic day.",
    atmosphereSummary: "Collegial, ASL-inclusive continuing-education community at sea.",
    heroVisualKey: "port-new-orleans-jackson-square",
    officialWebsiteUrl: "https://www.theonlineitinerant.com/cruise-2027",
    officialDomain: "theonlineitinerant.com",
    departureAnnouncementStatus: "active_upcoming_departures",
    primarySourceUrl: "https://www.theonlineitinerant.com/cruise-2027",
    verifiedSourceCheckedAt: "2026-11-16T18:11:55Z",
    verificationState: "schedule_hold",
  },
  {
    franchiseId: "hosted-franchise:king-con-cruise",
    reputationFranchiseEntityId: "rep:hosted-franchise:king-con-cruise",
    franchiseSlug: "king-con-cruise",
    aliases: [],
    franchiseName: "King Con Cruise",
    shortName: "King Con",
    producerOrganizerId: "hosted-organizer:king-con-cruise",
    producerOrganizerSlug: "king-con-cruise",
    relationshipToProducer: "flagship_one_to_one",
    primaryClassification: "hosted_group_sailing",
    primaryTheme: "crafting-and-hobbies",
    secondaryThemes: ["weddings-and-celebrations"],
    tagline: "Jon St. John’s tabletop RPG, gaming, cosplay, and fandom convention cruise.",
    independentSummary:
      "Recurring tabletop gaming, video-game, and voice-actor convention cruise series hosted by Jon St. John.",
    intendedAudience: "Tabletop RPG gamers, video-game fans, cosplayers, and fandom groups.",
    programmingAndLineupModel:
      "Quest Guild custom TTRPG campaigns, Kigu Karaoke, Improvageddon!, tournaments, and themed pub crawls.",
    atmosphereSummary: "Welcoming convention-at-sea gaming community.",
    heroVisualKey: "ship-norwegian-joy",
    officialWebsiteUrl: "https://kingconcruise.com/",
    officialDomain: "kingconcruise.com",
    departureAnnouncementStatus: "active_upcoming_departures",
    primarySourceUrl: "https://kingconcruise.com/",
    verifiedSourceCheckedAt: "2026-11-16T18:20:08Z",
    verificationState: "schedule_hold",
  },
  {
    franchiseId: "hosted-franchise:astros-fan-cruise",
    reputationFranchiseEntityId: "rep:hosted-franchise:astros-fan-cruise",
    franchiseSlug: "astros-fan-cruise",
    aliases: ["houston-baseball-fan-cruise"],
    franchiseName: "Astros Fan Cruise (Houston Baseball Fan Cruise)",
    shortName: "Astros Fan Cruise",
    producerOrganizerId: "hosted-organizer:the-fan-cruise",
    producerOrganizerSlug: "the-fan-cruise",
    relationshipToProducer: "producer_owned_franchise",
    primaryClassification: "hosted_group_sailing",
    primaryTheme: "crafting-and-hobbies",
    secondaryThemes: [],
    tagline:
      "Recurring Galveston baseball fan cruise featuring Houston baseball legends, Q&As, trivia, and alumni shore excursions.",
    independentSummary:
      "Flagship baseball fan series produced by The Fan Cruise out of Galveston, pairing Western Caribbean port days with alumni legends such as Larry Dierker and Bill Brown.",
    intendedAudience: "Houston baseball fans, families, and sports alumni collectors.",
    programmingAndLineupModel:
      "First Pitch Welcome Show, Legend Q&As, autograph sessions, Astros Feud & Jeopardy, and alumni catamaran/beach excursions.",
    atmosphereSummary: "Festive orange-clad baseball fan reunion sailing from Galveston.",
    heroVisualKey: "port-galveston-pleasure-pier",
    officialWebsiteUrl: "https://www.fan-cruise.com/astros2027",
    officialDomain: "fan-cruise.com",
    departureAnnouncementStatus: "active_upcoming_departures",
    primarySourceUrl: "https://www.fan-cruise.com/astros2027",
    verifiedSourceCheckedAt: "2026-11-16T18:13:38Z",
    verificationState: "schedule_hold",
  },
  {
    franchiseId: "hosted-franchise:texans-fan-cruise",
    reputationFranchiseEntityId: "rep:hosted-franchise:texans-fan-cruise",
    franchiseSlug: "texans-fan-cruise",
    aliases: ["texans-sailgate", "houston-football-fan-cruise"],
    franchiseName: "Texans Sailgate Fan Cruise",
    shortName: "Texans Sailgate",
    producerOrganizerId: "hosted-organizer:the-fan-cruise",
    producerOrganizerSlug: "the-fan-cruise",
    relationshipToProducer: "producer_owned_franchise",
    primaryClassification: "hosted_group_sailing",
    primaryTheme: "crafting-and-hobbies",
    secondaryThemes: [],
    tagline:
      "Houston football fan cruise out of Galveston with Sunday Sailgate game watch parties, trivia, and group shore days.",
    independentSummary:
      "Produced by The Fan Cruise, Texans Sailgate gathers Houston pro-football fans aboard Carnival Breeze from Galveston for sea-day game watch parties, Texans Feud trivia, and Western Caribbean calls.",
    intendedAudience: "Houston football fans and Gulf Coast sports group cruisers.",
    programmingAndLineupModel:
      "Countdown to Kickoff Welcome Show, Sunday Sailgate Game Watch Party, Texans Feud, bar crawls, cabin gift exchange, and awards show.",
    atmosphereSummary: "Tailgate-at-sea football fan community departing Galveston.",
    heroVisualKey: "port-galveston-pleasure-pier",
    officialWebsiteUrl: "https://www.fan-cruise.com/texans2027",
    officialDomain: "fan-cruise.com",
    departureAnnouncementStatus: "active_upcoming_departures",
    primarySourceUrl: "https://www.fan-cruise.com/texans2027",
    verifiedSourceCheckedAt: "2026-11-16T18:13:38Z",
    verificationState: "schedule_hold",
  },
  {
    franchiseId: "hosted-franchise:famally-cruise",
    reputationFranchiseEntityId: "rep:hosted-franchise:famally-cruise",
    franchiseSlug: "famally-cruise",
    aliases: ["famally", "texas-allies-rv-cruise"],
    franchiseName: "FamAlly Cruise (Alliance RV Owners Community)",
    shortName: "FamAlly Cruise",
    producerOrganizerId: "hosted-organizer:the-fan-cruise",
    producerOrganizerSlug: "the-fan-cruise",
    relationshipToProducer: "producer_owned_franchise",
    primaryClassification: "hosted_group_sailing",
    primaryTheme: "crafting-and-hobbies",
    secondaryThemes: ["weddings-and-celebrations"],
    tagline:
      "Recurring community cruise for Alliance RV owners ('Allies'), presented by The Fan Cruise in partnership with Texas Allies.",
    independentSummary:
      "Now in its 3rd edition, FamAlly Cruise brings up to 75 Alliance RV owners ('Allies') together at sea—trading highway rallies for a weeklong Western Caribbean group voyage from New Orleans.",
    intendedAudience:
      "Alliance RV owners and enthusiasts ('Allies') and Texas Allies rally members.",
    programmingAndLineupModel:
      "Welcome Aboard Ally Meetup, cabin door-decorating contest, Bar Crawl Explorer, game night, ice-cream social, and Bamboo Room social hour.",
    atmosphereSummary:
      "Intimate 75-guest RV-rally-at-sea camaraderie among fellow Alliance RV owners.",
    heroVisualKey: "port-new-orleans",
    officialWebsiteUrl: "https://www.fan-cruise.com/famally2027",
    officialDomain: "fan-cruise.com",
    departureAnnouncementStatus: "active_upcoming_departures",
    primarySourceUrl: "https://www.fan-cruise.com/famally2027",
    verifiedSourceCheckedAt: "2026-11-16T18:13:38Z",
    verificationState: "schedule_hold",
  },
];

export const FOUNDING_PILOT_SAILINGS: readonly CanonicalHostedSailingFactRecord[] = [
  {
    hostedSailingId: "hosted-sailing:the-online-itinerant:ccl:carnival-valor:2027-01-14",
    reputationSailingEntityId:
      "rep:hosted-sailing:the-online-itinerant:carnival-valor-2027-01-14",
    organizerSlug: "the-online-itinerant",
    franchiseId: "hosted-franchise:sailing-towards-success",
    franchiseSlug: "sailing-towards-success",
    sailingSlug: "carnival-valor-2027-01-14",
    organizerType: "hosted_group_organizer",
    experienceClassification: "hosted_group_sailing",
    physicalSailingId: "sailing:ccl:carnival-valor:2027-01-14",
    canonicalLineCode: "ccl",
    canonicalShipSlug: "carnival-valor",
    canonicalSailDate: "2027-01-14",
    sailingTitle:
      "Sailing Towards Success 2027 — Deaf Education Conference Cruise (Carnival Valor)",
    shortHeadline:
      "4-Night New Orleans to Cozumel DHH Continuing-Education Conference & Optional CAM School Service Day",
    editionSubtitle: "January 14–18, 2027 · Registration Closed · Source Conflict Under Review",
    anticipationHook:
      "Coordinate Cozumel shore plans and group dinners around sea-day DHH continuing-education sessions.",
    primaryTheme: "business-and-networking",
    secondaryThemes: [],
    visualKey: "port-new-orleans-jackson-square",
    regionLabel: "Western Caribbean (from New Orleans)",
    vesselType: "Ocean ship (Carnival Valor, ~2,980 guests)",
    approximateVesselScale: "Hosted conference block on ~2,980-guest Conquest-class ship",
    officialSailingPageUrl: "https://www.theonlineitinerant.com/cruise-2027",
    officialReservationFormUrl: "https://www.theonlineitinerant.com/cruise-2027",
    cabinSellerLabel: "The Online Itinerant",
    cabinBookingCtaLabel: "View Official Conference Page (Registration Closed) ↗",
    cabinAvailabilityStatus: "sold_out",
    cabinAvailabilityNote:
      "Official page currently displays '*REGISTRATION IS NOW CLOSED*' for the Jan 14–18, 2027 sailing.",
    verifiedStartingPriceUsd: 775,
    publishedPriceDisplay:
      "$775 pp Member / $1,025 pp Non-Member double occupancy (includes $525 conference fee; registration closed)",
    verifiedPriceNote: "Published on official 2027 rate matrix PDF; registration currently closed.",
    inclusionsSummary:
      "Carnival Valor stateroom, meals, taxes/fees/gratuities, and 10–11 hours of scheduled DHH PD sessions (optional Cozumel CAM School service project $60 extra).",
    approximateGroupSizeLabel: "Hosted educational conference cohort",
    fullShipCharter: false,
    typicalAudience:
      "Teachers of the Deaf/Hard of Hearing (TOD/DHH), audiologists, SLPs, and ASL interpreters.",
    audienceFocusTags: ["Continuing education cruisers", "Educators & clinicians"],
    announcedHostedProgramming:
      "Keynote by Dr. Michelle 'Mama Hu Hears' Hu, sessions with Tina Childress Au.D. and Gabriella Holzman, ASL comedian Keith Wann, exhibit hall, and optional Cozumel Deaf Pride Day hearing-aid fitting clinic.",
    programmingSourceUrl: "https://www.theonlineitinerant.com/cruise-2027",
    soloSupport:
      "Educators traveling solo can coordinate shared transfers in New Orleans and group shore days in Cozumel.",
    soloFriendly: true,
    familyPolicy: "mixed_group",
    accessibilitySummary:
      "ASL-accessible conference sessions; verify shipboard cabin/listening accommodations with Carnival.",
    communityAtmosphereSummary:
      "Mission-driven DHH educators combining accredited sea-day learning with Cozumel community outreach.",
    officialReviewSources: [],
    goodForTags: ["Continuing education (CEUs)", "New Orleans departures"],
    lifecycleStatus: "upcoming",
    primarySourceUrl: "https://www.theonlineitinerant.com/cruise-2027",
    organizerSourceCheckedAt: "2026-11-16T18:11:55Z",
    verificationState: "schedule_hold",
    portScheduleVerificationMode: "clocked_port_windows",
    scheduleHoldReason:
      "Held on Preview (noindex) for explicit DCC source-conflict review: official /cruise-2027 page and PDF Page 1/3 specify Carnival Valor (Jan 14–18, 2027 from New Orleans), whereas PDF Page 3 FAQ ('What should I wear to dinner?') instructs attendees to 'Watch the Royal Caribbean app for info on themed nights.' Also registration is closed and /member-registration-conference-cruise returns 404.",
  },
  {
    hostedSailingId: "hosted-sailing:king-con-cruise:ncl:norwegian-joy:2027-02-22",
    reputationSailingEntityId: "rep:hosted-sailing:king-con-cruise:norwegian-joy-2027-02-22",
    organizerSlug: "king-con-cruise",
    franchiseId: "hosted-franchise:king-con-cruise",
    franchiseSlug: "king-con-cruise",
    sailingSlug: "norwegian-joy-2027-02-22",
    organizerType: "hosted_group_organizer",
    experienceClassification: "hosted_group_sailing",
    physicalSailingId: "sailing:ncl:norwegian-joy:2027-02-22",
    canonicalLineCode: "ncl",
    canonicalShipSlug: "norwegian-joy",
    canonicalSailDate: "2027-02-22",
    sailingTitle: "King Con Cruise 2027 — Jon St. John Gaming & Fandom Cruise (Norwegian Joy)",
    shortHeadline:
      "4-Night Miami, Great Stirrup Cay & Nassau Tabletop RPG, Gaming & Voice-Actor Convention Cruise",
    editionSubtitle: "February 22–26, 2027 · Hosted by Jon St. John",
    anticipationHook:
      "Coordinate Nassau Quest Guild shore adventures, tabletop sessions, and PortMiami group arrivals.",
    primaryTheme: "crafting-and-hobbies",
    secondaryThemes: [],
    visualKey: "ship-norwegian-joy",
    regionLabel: "Bahamas (from Miami)",
    vesselType: "Ocean ship (Norwegian Joy, ~3,804 guests)",
    approximateVesselScale: "Hosted convention group block on ~3,804-guest Breakaway Plus ship",
    officialSailingPageUrl: "https://kingconcruise.com/",
    officialReservationFormUrl: "https://kingconcruise.com/registration/",
    cabinSellerLabel: "King Con Cruise + Academy Travel",
    cabinBookingCtaLabel: "Visit Official King Con Registration ↗",
    cabinAvailabilityStatus: "limited",
    cabinAvailabilityNote:
      "Convention badges ($100 pp / $90 group of 6+) remain open until 30 days pre-sailing; 120-day group cabin rate block has closed, with prevailing NCL cabins quoted via Academy Travel.",
    verifiedStartingPriceUsd: null,
    publishedPriceDisplay:
      "$100 pp convention badge ($90 pp for 6+) + prevailing NCL cabin fare via Academy Travel",
    verifiedPriceNote:
      "Badge price published at kingconcruise.com/registration/; cabin fare quoted on inquiry past 120-day group cutoff.",
    inclusionsSummary:
      "Badge covers Quest Guild TTRPG sessions, Kigu Karaoke with Jon St. John, Improvageddon!, tournaments, and pub crawls; NCL cabin billed separately.",
    approximateGroupSizeLabel: "Hosted fandom convention cohort",
    fullShipCharter: false,
    typicalAudience: "Tabletop RPG gamers, video-game fans, cosplayers, and voice-actor fans.",
    audienceFocusTags: ["Tabletop & RPG gamers", "Cosplay & fandom travelers"],
    announcedHostedProgramming:
      "Quest Guild custom TTRPG scenario + Nassau island quest, Kigu Karaoke with Jon St. John, Improvageddon!, video-game/trivia/dodgeball tournaments, and 3 nightly pub crawls.",
    programmingSourceUrl: "https://kingconcruise.com/morestuff/",
    soloSupport:
      "Open-table RPG campaigns, group nightly dinners, and pub crawls make it easy for solo attendees to join a party.",
    soloFriendly: true,
    familyPolicy: "family_friendly",
    accessibilitySummary: "Coordinate NCL cabin accessibility via Academy Travel.",
    communityAtmosphereSummary: "Playful, inclusive tabletop and video-game convention community.",
    officialReviewSources: [],
    goodForTags: ["Tabletop & D&D gamers", "Bahamas getaways from Miami"],
    lifecycleStatus: "upcoming",
    primarySourceUrl: "https://kingconcruise.com/",
    organizerSourceCheckedAt: "2026-11-16T18:20:08Z",
    verificationState: "schedule_hold",
    portScheduleVerificationMode: "official_day_by_day_route",
    scheduleHoldReason:
      "Held on Preview (noindex) pending DCC schedule reconciliation: kingconcruise.com/morestuff/ lists Day 2 Great Stirrup Cay / Day 3 At Sea, whereas Academy Travel's Travefy itinerary lists Day 2 At Sea / Day 3 Great Stirrup Cay (with 7:00 AM–5:00 PM vs 8:00 AM–6:00 PM window discrepancy), and /faq/ retains stale Royal Caribbean / 5-night copy.",
  },
  {
    hostedSailingId: "hosted-sailing:the-fan-cruise:rccl:mariner-of-the-seas:2027-04-03",
    reputationSailingEntityId:
      "rep:hosted-sailing:the-fan-cruise:famally-mariner-of-the-seas-2027-04-03",
    organizerSlug: "the-fan-cruise",
    franchiseId: "hosted-franchise:famally-cruise",
    franchiseSlug: "famally-cruise",
    sailingSlug: "famally-mariner-of-the-seas-2027-04-03",
    organizerType: "hosted_group_organizer",
    experienceClassification: "hosted_group_sailing",
    physicalSailingId: "sailing:rccl:mariner-of-the-seas:2027-04-03",
    canonicalLineCode: "rccl",
    canonicalShipSlug: "mariner-of-the-seas",
    canonicalSailDate: "2027-04-03",
    sailingTitle:
      "FamAlly Cruise 2027 — 3rd Alliance RV Enthusiasts Cruise (Mariner of the Seas)",
    shortHeadline:
      "7-Night New Orleans to Cozumel, Grand Cayman & Falmouth Community Cruise for Alliance RV Owners ('Allies')",
    editionSubtitle: "April 3–10, 2027 · Capped at 75 Alliance RV Allies",
    anticipationHook:
      "Plan Cozumel, Grand Cayman, and Falmouth shore excursions together with fellow Alliance RV owners.",
    primaryTheme: "crafting-and-hobbies",
    secondaryThemes: ["weddings-and-celebrations"],
    visualKey: "port-new-orleans",
    regionLabel: "Western Caribbean (from New Orleans)",
    vesselType: "Ocean ship (Mariner of the Seas, ~3,344 guests)",
    approximateVesselScale: "Intimate 75-guest Alliance RV group block on ~3,344-guest Voyager-class ship",
    officialSailingPageUrl: "https://www.fan-cruise.com/famally2027",
    officialReservationFormUrl: "https://www.fan-cruise.com/famally2027/famallyquote",
    cabinSellerLabel: "The Fan Cruise (in partnership with Texas Allies)",
    cabinBookingCtaLabel: "Request Official FamAlly Cabin Quote ↗",
    cabinAvailabilityStatus: "limited",
    cabinAvailabilityNote: "Capped at 75 Alliance RV 'Allies' via fan-cruise.com/famally2027.",
    verifiedStartingPriceUsd: 810,
    publishedPriceDisplay:
      "From $810 pp Interior / $950 Ocean View / $1,340 Balcony double occupancy (taxes included; $129.50 gratuities excluded)",
    verifiedPriceNote: "Verified from fan-cruise.com/famally2027 on 2026-11-16.",
    inclusionsSummary:
      "Mariner of the Seas stateroom, taxes/port fees, and all private Texas Allies / FamAlly Ally Meetup, game night, and rally activities.",
    approximateGroupSizeLabel: "Capped at 75 Alliance RV enthusiasts ('Allies')",
    fullShipCharter: false,
    typicalAudience: "Alliance RV owners and Texas Allies rally community members.",
    audienceFocusTags: ["RV owner communities", "Group cruisers"],
    announcedHostedProgramming:
      "Welcome Aboard Meetup, Door Decorating Contest, Bar Crawl Explorer, $100 High Roller Slot Pull, Game Night, Signature Ice Cream Social, and Bamboo Room Social Hour.",
    programmingSourceUrl: "https://www.fan-cruise.com/famally2027/ally-event-schedule",
    soloSupport: "Welcoming small-cohort rally atmosphere for both couples and solo RV owners.",
    soloFriendly: true,
    familyPolicy: "family_friendly",
    accessibilitySummary: "Royal Caribbean accessible cabins requested via Fan Cruise quote form.",
    communityAtmosphereSummary: "Tight-knit 75-person Alliance RV owner community sailing from New Orleans.",
    officialReviewSources: [],
    goodForTags: ["Alliance RV owners", "New Orleans departures"],
    lifecycleStatus: "upcoming",
    primarySourceUrl: "https://www.fan-cruise.com/famally2027",
    organizerSourceCheckedAt: "2026-11-16T18:13:38Z",
    verificationState: "schedule_hold",
    portScheduleVerificationMode: "official_day_by_day_route",
    scheduleHoldReason:
      "Held on Preview (noindex) until exact New Orleans embarkation/debarkation clock times and reconciled Royal Caribbean port windows are verified.",
  },
  {
    hostedSailingId: "hosted-sailing:the-fan-cruise:ccl:carnival-jubilee:2027-04-11",
    reputationSailingEntityId:
      "rep:hosted-sailing:the-fan-cruise:astros-fan-cruise-carnival-jubilee-2027-04-11",
    organizerSlug: "the-fan-cruise",
    franchiseId: "hosted-franchise:astros-fan-cruise",
    franchiseSlug: "astros-fan-cruise",
    sailingSlug: "astros-fan-cruise-carnival-jubilee-2027-04-11",
    organizerType: "hosted_group_organizer",
    experienceClassification: "hosted_group_sailing",
    physicalSailingId: "sailing:ccl:carnival-jubilee:2027-04-11",
    canonicalLineCode: "ccl",
    canonicalShipSlug: "carnival-jubilee",
    canonicalSailDate: "2027-04-11",
    sailingTitle: "2027 Astros Fan Cruise — Houston Baseball Fan Cruise (Carnival Jubilee)",
    shortHeadline:
      "6-Night Galveston to Cozumel & Mahogany Bay Baseball Alumni Cruise with Larry Dierker & Bill Brown",
    editionSubtitle: "April 11–17, 2027 · Round-Trip Galveston, TX",
    anticipationHook:
      "Coordinate Cozumel and Roatán shore days alongside First Pitch shows, Legend Q&As, and Astros trivia.",
    primaryTheme: "crafting-and-hobbies",
    secondaryThemes: [],
    visualKey: "port-galveston-pleasure-pier",
    regionLabel: "Western Caribbean (from Galveston)",
    vesselType: "Ocean ship (Carnival Jubilee, ~5,362 guests)",
    approximateVesselScale: "Hosted fan group block on ~5,362-guest Excel-class flagship",
    officialSailingPageUrl: "https://www.fan-cruise.com/astros2027",
    officialReservationFormUrl: "https://www.fan-cruise.com/astros2027/2027-booking-page",
    cabinSellerLabel: "The Fan Cruise",
    cabinBookingCtaLabel: "Book Official Astros Fan Cruise Cabin ↗",
    cabinAvailabilityStatus: "available",
    cabinAvailabilityNote:
      "$400 per-cabin deposit via fan-cruise.com/astros2027 (final payment Jan 1, 2027); Experience Pass included with full-fare Fan Cruise cabins.",
    verifiedStartingPriceUsd: 747,
    publishedPriceDisplay:
      "From $747 pp Interior / $907–$932 Ocean View / $967–$1,007 Balcony double occupancy (taxes included; $102 gratuities excluded)",
    verifiedPriceNote:
      "Interior $747 pp consistent; minor OV/Balcony display delta between /astros2027 and /2027-booking-page noted.",
    inclusionsSummary:
      "Carnival Jubilee stateroom, taxes/port fees, and Fan Cruise Experience Pass (First Pitch Show, Legend Q&A, Astros Feud & Jeopardy, Awards Show).",
    approximateGroupSizeLabel: "Multi-hundred-guest Houston baseball fan group",
    fullShipCharter: false,
    typicalAudience: "Houston baseball fans, families, and alumni collectors.",
    audienceFocusTags: ["Sports fan groups", "Gulf Coast drive-to cruisers"],
    announcedHostedProgramming:
      "Appearances by Larry Dierker & Bill Brown, First Pitch Welcome Show, Legend Q&A, Astros Feud & Jeopardy, Cabin Gift Exchange, and optional Brownie's Sail Away Catamaran & Larry's Beach Break excursions.",
    programmingSourceUrl: "https://www.fan-cruise.com/astros2027/event-schedule",
    soloSupport: "Group hospitality desk, trivia teams, and group shore excursions welcome solo fans.",
    soloFriendly: true,
    familyPolicy: "family_friendly",
    accessibilitySummary: "Carnival Jubilee ADA cabins coordinated via Fan Cruise.",
    communityAtmosphereSummary: "Energetic Houston baseball fan celebration out of Galveston.",
    officialReviewSources: [],
    goodForTags: ["Baseball fans", "Galveston departures"],
    lifecycleStatus: "upcoming",
    primarySourceUrl: "https://www.fan-cruise.com/astros2027",
    organizerSourceCheckedAt: "2026-11-16T18:13:38Z",
    verificationState: "schedule_hold",
    portScheduleVerificationMode: "official_day_by_day_route",
    scheduleHoldReason:
      "Held on Preview (noindex) until exact ship arrival and departure clock times at Galveston, Cozumel, and Mahogany Bay are reconciled from official Carnival schedule.",
  },
  {
    hostedSailingId: "hosted-sailing:the-fan-cruise:ccl:carnival-breeze:2027-11-06",
    reputationSailingEntityId:
      "rep:hosted-sailing:the-fan-cruise:texans-fan-cruise-carnival-breeze-2027-11-06",
    organizerSlug: "the-fan-cruise",
    franchiseId: "hosted-franchise:texans-fan-cruise",
    franchiseSlug: "texans-fan-cruise",
    sailingSlug: "texans-fan-cruise-carnival-breeze-2027-11-06",
    organizerType: "hosted_group_organizer",
    experienceClassification: "hosted_group_sailing",
    physicalSailingId: "sailing:ccl:carnival-breeze:2027-11-06",
    canonicalLineCode: "ccl",
    canonicalShipSlug: "carnival-breeze",
    canonicalSailDate: "2027-11-06",
    sailingTitle:
      "Texans Sailgate 2027 — Inaugural Houston Football Fan Cruise (Carnival Breeze)",
    shortHeadline:
      "7-Night Galveston to Montego Bay, Grand Cayman & Cozumel Football Fan Cruise & Sunday Watch Party",
    editionSubtitle: "November 6–13, 2027 · Round-Trip Galveston, TX",
    anticipationHook:
      "Plan Montego Bay, Grand Cayman, and Cozumel shore days around Sunday Sailgate game watch parties.",
    primaryTheme: "crafting-and-hobbies",
    secondaryThemes: [],
    visualKey: "ship-carnival-breeze",
    regionLabel: "Western Caribbean (from Galveston)",
    vesselType: "Ocean ship (Carnival Breeze, ~3,690 guests)",
    approximateVesselScale: "Hosted football fan group block on ~3,690-guest Dream-class ship",
    officialSailingPageUrl: "https://www.fan-cruise.com/texans2027",
    officialReservationFormUrl: "https://www.fan-cruise.com/texans2027/book-now",
    cabinSellerLabel: "The Fan Cruise",
    cabinBookingCtaLabel: "Book Official Texans Sailgate Cabin ↗",
    cabinAvailabilityStatus: "available",
    cabinAvailabilityNote:
      "$250 per-cabin deposit via fan-cruise.com/texans2027 (final payment Aug 1, 2027).",
    verifiedStartingPriceUsd: 674,
    publishedPriceDisplay:
      "From $674 pp Interior / $854 Ocean View / $1,019 Balcony double occupancy (taxes included; $119 gratuities excluded)",
    verifiedPriceNote: "Verified from fan-cruise.com/texans2027 on 2026-11-16.",
    inclusionsSummary:
      "Carnival Breeze stateroom, taxes/port fees, and Texans Sailgate onboard game watch parties, trivia, and group events.",
    approximateGroupSizeLabel: "Hosted Houston football fan group",
    fullShipCharter: false,
    typicalAudience: "Houston pro-football fans and Gulf Coast sports travelers.",
    audienceFocusTags: ["Sports fan groups", "Gulf Coast drive-to cruisers"],
    announcedHostedProgramming:
      "Sail Away Party, Countdown to Kickoff Welcome Show, Texans Sailgate Game Watch Party, Texans Feud, Bar Crawl, Cabin Gift Exchange, and Cruise Awards Show.",
    programmingSourceUrl: "https://www.fan-cruise.com/texans2027/event-lineup-texans-2027",
    soloSupport: "Solo fans welcome at Sailgate watch parties, trivia, and group shore excursions.",
    soloFriendly: true,
    familyPolicy: "family_friendly",
    accessibilitySummary: "Carnival Breeze ADA cabins coordinated via Fan Cruise.",
    communityAtmosphereSummary: "Tailgate-style football fan camaraderie sailing from Galveston.",
    officialReviewSources: [],
    goodForTags: ["Football fans", "Galveston departures"],
    lifecycleStatus: "upcoming",
    primarySourceUrl: "https://www.fan-cruise.com/texans2027",
    organizerSourceCheckedAt: "2026-11-16T18:13:38Z",
    verificationState: "schedule_hold",
    portScheduleVerificationMode: "official_day_by_day_route",
    scheduleHoldReason:
      "Held on Preview (noindex) pending DCC verification of Galveston embark/debark clock times and internal prose typo on /texans2027 ('Saturday, November 7 – Saturday, November 14' in prose vs correct Saturday Nov 6 – Saturday Nov 13, 2027 in banner, booking form, and event lineup).",
  },
];

export const FOUNDING_PILOT_VERIFICATION_QUEUE_SEED: ReadonlyArray<
  Omit<
    DccFactVerificationQueueItem,
    "createdAt" | "reviewedAt" | "reviewedBy" | "resolutionNote" | "state"
  >
> = [
  {
    verificationId: "vreq_sts_carnival_valor_vs_rccl_app_2027",
    entityType: "hosted_sailing",
    entityId: "hosted-sailing:the-online-itinerant:ccl:carnival-valor:2027-01-14",
    fieldPath: "cruiseLineAndOnboardAppInstructions",
    currentVerifiedValue: {
      cruiseLine: "Carnival Cruise Line",
      shipName: "Carnival Valor",
      dates: "2027-01-14 to 2027-01-18",
      embarkPort: "New Orleans, LA",
      quote:
        "JOIN US ON CARNIVAL VALOR / January 14–18, 2027 / From New Orleans, LA. to Cozumel, Mexico",
    },
    proposedOrConflictingValue: {
      conflictingFaqReference: "Royal Caribbean app",
      location:
        "2027 Conference Information & FAQ PDF Page 3 ('What should I wear to dinner?') & embedded Canva FAQ",
      verbatimQuote:
        "Friday night is optional formal night - dress up in your formal if you want, but not required. Watch the Royal Caribbean app for info on themed nights.",
      additionalDiscrepancies:
        "Landing page states '10 hours' PD vs PDF Page 4 'up to 11 hours'; registration banner states '*REGISTRATION IS NOW CLOSED*' and /member-registration-conference-cruise returns HTTP 404.",
    },
    submittedByRole: "dcc_source_audit",
    submittedByActor: "dcc:founding-pilot-primary-source-audit",
    sourceUrl: "https://www.theonlineitinerant.com/cruise-2027",
    secondaryConflictSourceUrl:
      "https://s3.amazonaws.com/kajabi-storefronts-production/file-uploads/sites/17973/themes/2162021142/downloads/fdd5dd4-b2d4-e46e-e156-4bb30ceb564_Sailing_towards_Success_6_.pdf",
    conflictSummary:
      "Explicitly recorded primary-source conflict (not silently normalized): Sailing Towards Success 2027 sails aboard Carnival Valor from New Orleans, but its official 2027 FAQ PDF (Page 3) instructs attendees to 'Watch the Royal Caribbean app for info on themed nights.' Held in needs_review for organizer confirmation.",
    isSyntheticTest: false,
  },
  {
    verificationId: "vreq_kingcon_day_order_and_stale_rccl_faq_2027",
    entityType: "hosted_sailing",
    entityId: "hosted-sailing:king-con-cruise:ncl:norwegian-joy:2027-02-22",
    fieldPath: "itineraryDayOrderAndFaqPolicy",
    currentVerifiedValue: {
      cruiseLine: "Norwegian Cruise Line",
      shipName: "Norwegian Joy",
      travefySequence:
        "Day 1 Miami -> Day 2 At Sea -> Day 3 Great Stirrup Cay -> Day 4 Nassau -> Day 5 Miami",
    },
    proposedOrConflictingValue: {
      morestuffPageSequence:
        "Day 1 Miami -> Day 2 Great Stirrup Cay -> Day 3 Sailing -> Day 4 Nassau",
      staleFaqQuotes: [
        "per Royal Caribbean’s policy, you must be 21 or older",
        "duration of our 5 night cruise / SeaPass holder",
      ],
    },
    submittedByRole: "dcc_source_audit",
    submittedByActor: "dcc:founding-pilot-primary-source-audit",
    sourceUrl:
      "https://travefy.com/trip/itinerary/k5SSks4AaDEpBJLOAHPEBAXAwMDEEFU2ODf8gldCpWVnQy3Wdtwm",
    secondaryConflictSourceUrl: "https://kingconcruise.com/morestuff/",
    conflictSummary:
      "King Con Cruise /morestuff/ swaps Day 2 (Great Stirrup Cay) and Day 3 (Sailing) relative to Academy Travel's Travefy itinerary, and /faq/ + /registration/ retain stale Royal Caribbean / 5-night copy.",
    isSyntheticTest: false,
  },
  {
    verificationId: "vreq_texans_sailgate_nov6_vs_nov7_prose_2027",
    entityType: "hosted_sailing",
    entityId: "hosted-sailing:the-fan-cruise:ccl:carnival-breeze:2027-11-06",
    fieldPath: "dayByDayCalendarLabels",
    currentVerifiedValue:
      "Saturday, November 6 – Saturday, November 13, 2027 (banner, booking dropdown, and /event-lineup-texans-2027)",
    proposedOrConflictingValue:
      "'THE JOURNEY' prose on /texans2027 mislabels day headings as 'Saturday, November 7' through 'Saturday, November 14'",
    submittedByRole: "dcc_source_audit",
    submittedByActor: "dcc:founding-pilot-primary-source-audit",
    sourceUrl: "https://www.fan-cruise.com/texans2027/event-lineup-texans-2027",
    secondaryConflictSourceUrl: "https://www.fan-cruise.com/texans2027",
    conflictSummary:
      "Off-by-one calendar date typo in /texans2027 narrative prose vs verified Saturday Nov 6–13, 2027 Carnival Breeze schedule.",
    isSyntheticTest: false,
  },
];

let pilotVerificationSeeded = false;
export function ensureFoundingPilotVerificationQueueSeeded(): void {
  if (pilotVerificationSeeded) return;
  pilotVerificationSeeded = true;
  for (const item of FOUNDING_PILOT_VERIFICATION_QUEUE_SEED) {
    enqueueDccFactVerificationItem({
      ...item,
      createdAt: "2026-11-16T18:25:00Z",
    });
  }
}

export const FOUNDING_PILOT_DRAFT_INVITATIONS: readonly FoundingPilotDraftInvitation[] = [
  {
    pilotNumber: 1,
    organizerId: "hosted-organizer:the-online-itinerant",
    organizerSlug: "the-online-itinerant",
    organizerName: "The Online Itinerant (Sailing Towards Success)",
    franchiseSlugs: ["sailing-towards-success"],
    primarySailingSlug: "carnival-valor-2027-01-14",
    outreachEligibility: "blocked_disputed_source_hold_noindex",
    outreachDispatchState: "draft_do_not_send",
    sentAt: null,
    zeroOutreachSentGuarantee: true,
    organizerFeeUsd: 0,
    cabinCommissionPercent: 0,
    downstreamAffiliateCommissionDisclosed: true,
    previewOrganizerWorkspacePath: "/organizer/hosted/the-online-itinerant",
    previewPublicSailingPaths: [
      "/hosted-cruises/the-online-itinerant/carnival-valor-2027-01-14",
    ],
    subjectLine:
      "[DRAFT — DO NOT SEND] Free shore-day & group coordination workspace for Sailing Towards Success (Carnival Valor)",
    draftMessageBody:
      "Hi Stefanie,\n\nWe prepared a free ($0) Founding Organizer Pilot workspace on Cruise Promenade for Sailing Towards Success aboard Carnival Valor (Jan 14–18, 2027 from New Orleans) and future Online Itinerant conference cruises.\n\n• 100% of conference & cabin revenue stays with you: You owe Cruise Promenade $0 and 0% commission—every attendee books directly through The Online Itinerant.\n• Transparent downstream model: Cruise Promenade may earn disclosed commissions only when travelers voluntarily purchase eligible downstream shore excursions or travel services.\n• Helpful quick catch while reviewing your 2027 FAQ PDF: Page 3 ('What should I wear to dinner?') still mentions watching the 'Royal Caribbean app' rather than Carnival's HUB app—we flagged that privately for you rather than guessing.\n• Private Preview Workspace Demo: /organizer/hosted/the-online-itinerant\n\nWhenever you'd like to take a 5-minute look at the Preview workspace for Cozumel shore-day coordination or your 2028 conference sailing, let me know.\n\nBest,\nErich",
  },
  {
    pilotNumber: 2,
    organizerId: "hosted-organizer:king-con-cruise",
    organizerSlug: "king-con-cruise",
    organizerName: "King Con Cruise",
    franchiseSlugs: ["king-con-cruise"],
    primarySailingSlug: "norwegian-joy-2027-02-22",
    outreachEligibility: "blocked_disputed_source_hold_noindex",
    outreachDispatchState: "draft_do_not_send",
    sentAt: null,
    zeroOutreachSentGuarantee: true,
    organizerFeeUsd: 0,
    cabinCommissionPercent: 0,
    downstreamAffiliateCommissionDisclosed: true,
    previewOrganizerWorkspacePath: "/organizer/hosted/king-con-cruise",
    previewPublicSailingPaths: ["/hosted-cruises/king-con-cruise/norwegian-joy-2027-02-22"],
    subjectLine:
      "[DRAFT — DO NOT SEND] $0 Founding Organizer Workspace for King Con Cruise 2027 (Norwegian Joy)",
    draftMessageBody:
      "Hi Jon & King Con Team,\n\nWe staged a free ($0) Founding Organizer Pilot workspace on Cruise Promenade for King Con Cruise 2027 aboard Norwegian Joy (Feb 22–26, 2027 from PortMiami).\n\n• You keep 100% of badge and cabin revenue: All badge purchases stay on kingconcruise.com and all group cabins stay with Academy Travel—Cruise Promenade charges $0 and 0% cabin commission.\n• Transparent excursion disclosure: Cruise Promenade may earn disclosed commissions only if attendees voluntarily book eligible optional shore excursions or travel services in Nassau or Miami.\n• Built for party & table coordination: Attendees can coordinate Nassau shore plans around Quest Guild sessions with a 2-hour pier-return buffer and download an offline Cruise Pack.\n• Private Preview Workspace Demo: /organizer/hosted/king-con-cruise\n\nHappy to walk through the Preview page together anytime.\n\nBest,\nErich",
  },
  {
    pilotNumber: 3,
    organizerId: "hosted-organizer:the-fan-cruise",
    organizerSlug: "the-fan-cruise",
    organizerName: "The Fan Cruise (Astros, Texans & FamAlly)",
    franchiseSlugs: ["astros-fan-cruise", "texans-fan-cruise", "famally-cruise"],
    primarySailingSlug: "astros-fan-cruise-carnival-jubilee-2027-04-11",
    outreachEligibility: "blocked_disputed_source_hold_noindex",
    outreachDispatchState: "draft_do_not_send",
    sentAt: null,
    zeroOutreachSentGuarantee: true,
    organizerFeeUsd: 0,
    cabinCommissionPercent: 0,
    downstreamAffiliateCommissionDisclosed: true,
    previewOrganizerWorkspacePath: "/organizer/hosted/the-fan-cruise",
    previewPublicSailingPaths: [
      "/hosted-cruises/the-fan-cruise/astros-fan-cruise-carnival-jubilee-2027-04-11",
      "/hosted-cruises/the-fan-cruise/texans-fan-cruise-carnival-breeze-2027-11-06",
      "/hosted-cruises/the-fan-cruise/famally-mariner-of-the-seas-2027-04-03",
    ],
    subjectLine:
      "[DRAFT — DO NOT SEND] Free group shore-planning hub for Astros Fan Cruise, Texans Sailgate & FamAlly 2027",
    draftMessageBody:
      "Hi Daniel,\n\nWe built a free ($0) Founding Organizer Pilot workspace on Cruise Promenade supporting all three of your 2027 series—2027 Astros Fan Cruise (Carnival Jubilee), Texans Sailgate 2027 (Carnival Breeze), and the 3rd FamAlly Alliance RV Cruise (Mariner of the Seas).\n\n• 100% of cabin & Experience Pass revenue stays with Fan Cruise: Every cabin quote and booking link points straight to fan-cruise.com—you owe Cruise Promenade $0 and 0% cabin commission.\n• Transparent downstream model: Cruise Promenade may earn disclosed commissions only when guests voluntarily purchase eligible independent shore excursions or travel services on open port days (while keeping your official Larry's Beach Break & Brownie's Sail Away excursions pinned first!).\n• Private Preview Workspace Demo: /organizer/hosted/the-fan-cruise\n\nLet me know if you'd be open to reviewing the Preview pages together.\n\nBest,\nErich",
  },
  {
    pilotNumber: 4,
    organizerId: "hosted-organizer:stitchin-heaven",
    organizerSlug: "stitchin-heaven",
    organizerName: "Stitchin' Heaven",
    franchiseSlugs: ["stitchin-heaven"],
    primarySailingSlug: "independence-of-the-seas-2027-04-11",
    backupComparisonFixtureSlug: "craft-cruises",
    outreachEligibility: "safe_pilot_ready_hold_send",
    outreachDispatchState: "draft_do_not_send",
    draftKind: "initial_intro_draft",
    doNotSendAnotherIntroEmail: false,
    verifiedHistoricalOutreach: {
      attemptedAt: "2026-09-04T19:59:42Z",
      fromAddress: "erichroeseler123@gmail.com",
      toAddress: "travel@stitchinheaven.com",
      status: "bounced_or_failed",
      bounceDetected: true,
      replyReceived: false,
      deliveryConfirmedByProvider: false,
      countedAsConversionOrApplication: false,
      note:
        "Attempted Sep 4, 2026 from erichroeseler123@gmail.com to travel@stitchinheaven.com; immediate delivery failure (Google Group bounce). Recorded as bounced/failed, not delivered. New outreach to info@stitchinheaven.com has NOT been sent.",
    },
    sentAt: null,
    zeroOutreachSentGuarantee: true,
    organizerFeeUsd: 0,
    cabinCommissionPercent: 0,
    downstreamAffiliateCommissionDisclosed: true,
    previewOrganizerWorkspacePath: "/organizer/hosted/stitchin-heaven",
    previewPublicSailingPaths: [
      "/hosted-cruises/stitchin-heaven/independence-of-the-seas-2027-04-11",
    ],
    recipientEmail: "info@stitchinheaven.com",
    fromAddress: "Erich — Cruise Promenade <concierge@cruisepromenade.com>",
    replyToAddress: "erichroeseler123@gmail.com",
    sailingLinkWithUtm:
      "https://cruisepromenade.com/hosted-cruises/stitchin-heaven/independence-of-the-seas-2027-04-11?utm_source=founder_outreach&utm_medium=email&utm_campaign=founding_pilot_wave1&utm_content=stitchin_heaven_sailing_page",
    organizerClaimLinkWithUtm:
      "https://cruisepromenade.com/organizer/hosted/stitchin-heaven?utm_source=founder_outreach&utm_medium=email&utm_campaign=founding_pilot_wave1&utm_content=stitchin_heaven_claim_hub",
    trackingParameters: {
      utm_source: "founder_outreach",
      utm_medium: "email",
      utm_campaign: "founding_pilot_wave1",
      utm_content_sailing: "stitchin_heaven_sailing_page",
      utm_content_claim: "stitchin_heaven_claim_hub",
    },
    subjectLine:
      "Free shared shore-day planner & printable Cruise Pack for your Apr 11, 2027 Riley Blake Quilting Cruise",
    draftMessageBody:
      "Hi Clay, Deb & the Stitchin' Heaven Travel Team,\n\nWe put together a free ($0) group shore-day page for your April 11–18, 2027 Riley Blake Quilting Cruise aboard Independence of the Seas out of Miami so your quilters and non-sewing spouses can easily coordinate port days together:\n\nLive Sailing Page:\nhttps://cruisepromenade.com/hosted-cruises/stitchin-heaven/independence-of-the-seas-2027-04-11?utm_source=founder_outreach&utm_medium=email&utm_campaign=founding_pilot_wave1&utm_content=stitchin_heaven_sailing_page\n\nWhat this gives you and your guests for free:\n• 100% of cabin & quilting package bookings stay with Stitchin' Heaven: Every registration button sends travelers straight to stitchinheaven.com—there is $0 cost to you and 0% commission on cabins or class packages.\n• Built for quilters AND non-quilting companions: Guests can see which excursions fellow quilters and spouses are joining in Nassau, Perfect Day at CocoCay, Costa Maya, and Cozumel around your Wednesday and Saturday sewing rotations.\n• Printable paper Cruise Pack (no ship Wi-Fi or app needed): Guests can print a clean paper day-by-day schedule with pier-return buffers before leaving home, and you can pin group meetups or welcome notes in minutes.\n\nIf you'd like to customize your welcome note or pin group highlights for your cruisers, you can claim your free Organizer Hub here:\nhttps://cruisepromenade.com/organizer/hosted/stitchin-heaven?utm_source=founder_outreach&utm_medium=email&utm_campaign=founding_pilot_wave1&utm_content=stitchin_heaven_claim_hub\n\n(Plain-English note: Cruise Promenade earns commissions only if a traveler chooses to book an optional independent shore excursion or travel service—never from your cruise packages.)\n\nHappy to make any edits you'd like before you share it with your group.\n\nWarmly,\nErich\nCruise Promenade",
  },
  {
    pilotNumber: 5,
    organizerId: "hosted-organizer:cmmc-at-sea",
    organizerSlug: "cmmc-at-sea",
    organizerName: "CMMC at Sea",
    franchiseSlugs: ["cmmc-at-sea"],
    primarySailingSlug: "celebrity-beyond-2027-01-17",
    backupComparisonFixtureSlug: "acquisition-lab",
    outreachEligibility: "safe_pilot_ready_hold_send",
    outreachDispatchState: "future_follow_up_draft_do_not_send",
    draftKind: "future_brief_follow_up_draft",
    doNotSendAnotherIntroEmail: true,
    verifiedHistoricalOutreach: {
      attemptedAt: "2026-11-12",
      fromAddress: "erich@rollcallusa.com",
      toAddress: "Info@cmmcatsea.com",
      status: "sent_not_delivery_confirmed",
      bounceDetected: false,
      replyReceived: false,
      deliveryConfirmedByProvider: false,
      countedAsConversionOrApplication: false,
      note:
        "Successfully sent Nov 12, 2026 from erich@rollcallusa.com to Info@cmmcatsea.com; no bounce and no reply. Recorded as sent (NOT delivery-confirmed). Do NOT send another introductory email; preserve rewritten draft below as a brief future follow-up only.",
    },
    sentAt: null,
    zeroOutreachSentGuarantee: false,
    organizerFeeUsd: 0,
    cabinCommissionPercent: 0,
    downstreamAffiliateCommissionDisclosed: true,
    previewOrganizerWorkspacePath: "/organizer/hosted/cmmc-at-sea",
    previewPublicSailingPaths: ["/hosted-cruises/cmmc-at-sea/celebrity-beyond-2027-01-17"],
    recipientEmail: "Info@cmmcatsea.com",
    fromAddress: "erich@rollcallusa.com",
    replyToAddress: "erich@rollcallusa.com",
    sailingLinkWithUtm:
      "https://cruisepromenade.com/hosted-cruises/cmmc-at-sea/celebrity-beyond-2027-01-17?utm_source=founder_outreach&utm_medium=email&utm_campaign=founding_pilot_wave1&utm_content=cmmc_at_sea_followup_sailing_page",
    organizerClaimLinkWithUtm:
      "https://cruisepromenade.com/organizer/hosted/cmmc-at-sea?utm_source=founder_outreach&utm_medium=email&utm_campaign=founding_pilot_wave1&utm_content=cmmc_at_sea_followup_claim_hub",
    trackingParameters: {
      utm_source: "founder_outreach",
      utm_medium: "email",
      utm_campaign: "founding_pilot_wave1",
      utm_content_sailing: "cmmc_at_sea_followup_sailing_page",
      utm_content_claim: "cmmc_at_sea_followup_claim_hub",
    },
    subjectLine:
      "Re: Quick follow-up — live port-day page for CMMC at Sea (Jan 17 Celebrity Beyond)",
    draftMessageBody:
      "Hi CMMC at Sea Team,\n\nQuick follow-up on my November 12 note—the free ($0) port-day coordination page for your January 17–24, 2027 Celebrity Beyond sailing out of Fort Lauderdale is now live if you'd like to take a quick look:\n\nLive Sailing Page:\nhttps://cruisepromenade.com/hosted-cruises/cmmc-at-sea/celebrity-beyond-2027-01-17?utm_source=founder_outreach&utm_medium=email&utm_campaign=founding_pilot_wave1&utm_content=cmmc_at_sea_followup_sailing_page\n\nSince your room block closed and attendees are booking cabins independently, it gives attendees and spouses one simple place to coordinate Nassau, Cozumel, and Grand Cayman shore days around your three sea-day sessions—with no cabin numbers or work emails collected, and 100% of Conference Pass registrations routing straight to cmmcatsea.com/registration/ ($0 cost and 0% pass/cabin commission; Cruise Promenade earns commissions only on optional independent shore excursions).\n\nIf you'd ever like to add a quick welcome note or pin networking meetups, your free Organizer Hub is ready here:\nhttps://cruisepromenade.com/organizer/hosted/cmmc-at-sea?utm_source=founder_outreach&utm_medium=email&utm_campaign=founding_pilot_wave1&utm_content=cmmc_at_sea_followup_claim_hub\n\nNo rush at all—just wanted to share the live link in case it's helpful for your January cohort.\n\nBest,\nErich",
  },
];

export function getFoundingOrganizerPilotSummary() {
  ensureFoundingPilotVerificationQueueSeeded();
  const safePilotCandidates = FOUNDING_PILOT_DRAFT_INVITATIONS.filter(
    (d) => d.outreachEligibility === "safe_pilot_ready_hold_send",
  ).map((d) => d.organizerSlug);
  const heldDisputedProspects = FOUNDING_PILOT_DRAFT_INVITATIONS.filter(
    (d) => d.outreachEligibility === "blocked_disputed_source_hold_noindex",
  ).map((d) => d.organizerSlug);
  return {
    primaryPilotCount: FOUNDING_PILOT_DRAFT_INVITATIONS.length,
    safePilotCandidates,
    heldDisputedProspects,
    backupComparisonFixtures: [
      {
        category: "crafting-and-hobbies",
        organizerSlug: "craft-cruises",
        sailingSlug: "westerdam-2027-04-11",
      },
      {
        category: "business-and-networking",
        organizerSlug: "acquisition-lab",
        sailingSlug: "brilliant-lady-2027-01-21",
      },
    ],
    outreachSentCount: 1 as const,
    outreachBouncedOrFailedCount: 1 as const,
    outreachDeliveredConfirmedCount: 0 as const,
    newWave1DraftsSentCount: 0 as const,
    historicalMessagesCountedAsConversionsOrApplications: 0 as const,
    allInvitationsHeldInDraftDoNotSend: FOUNDING_PILOT_DRAFT_INVITATIONS.every(
      (d) =>
        (d.outreachDispatchState === "draft_do_not_send" ||
          d.outreachDispatchState === "future_follow_up_draft_do_not_send") &&
        d.sentAt === null,
    ),
    draftInvitations: FOUNDING_PILOT_DRAFT_INVITATIONS,
  };
}
