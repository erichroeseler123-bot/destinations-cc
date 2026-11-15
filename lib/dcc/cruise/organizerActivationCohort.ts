import { neon } from "@neondatabase/serverless";
import { resolveNeonMigrationDatabaseUrl } from "@/lib/dcc/machine/durableStorage";
import {
  DCC_CANONICAL_HOSTED_ORGANIZERS,
  DCC_CANONICAL_HOSTED_SAILINGS,
} from "./hostedCatalogRegistry";

export const ORGANIZER_ACTIVATION_TRACKING_STATES = [
  "not_contacted",
  "contacted",
  "replied",
  "claim_submitted",
  "verified",
  "workspace_activated",
  "page_shared",
] as const;

export type OrganizerActivationTrackingState =
  (typeof ORGANIZER_ACTIVATION_TRACKING_STATES)[number];

export interface AdditionalVerifiedOrganizerContact {
  label: string;
  role?: string;
  email?: string | null;
  phone?: string | null;
  sourceUrl: string;
}

export interface OrganizerActivationOfficialContact {
  contactPersonName: string | null;
  contactPersonRole: string;
  officialEmail: string | null;
  officialPhone: string | null;
  contactSourceUrl: string;
  additionalVerifiedContacts: ReadonlyArray<AdditionalVerifiedOrganizerContact>;
}

export interface OrganizerActivationSailingLink {
  hostedSailingId: string;
  sailingSlug: string;
  sailingTitle: string;
  sailDate: string;
  shipNameLabel: string;
  cruisePromenadeUrl: string;
  officialSailingPageUrl: string;
  officialReservationFormUrl: string;
  indexationHeld: boolean;
  scheduleHoldReason?: string;
}

export interface OrganizerActivationPackage {
  cohortRank: number;
  organizerId: string;
  organizerSlug: string;
  organizerName: string;
  categoryLabel: string;
  publicProfileUrl: string;
  freeClaimUrl: string;
  freeClaimInstructions: string;
  verifiedSailingUrls: ReadonlyArray<OrganizerActivationSailingLink>;
  officialContact: OrganizerActivationOfficialContact;
  telephoneScript: string;
  emailDraft: {
    subject: string;
    body: string;
  };
  valueExplanation: string;
  missingInfoToRequestOnClaim: ReadonlyArray<string>;
  trackingState: OrganizerActivationTrackingState;
  outreachSent: false | boolean;
  ownerNotes?: string;
  updatedAt: string;
}

interface SeedOrganizerActivationEntry {
  cohortRank: number;
  organizerSlug: string;
  officialContact: OrganizerActivationOfficialContact;
  telephoneScript: string;
  emailDraft: {
    subject: string;
    body: string;
  };
  valueExplanation: string;
  missingInfoToRequestOnClaim: ReadonlyArray<string>;
}

const CP_ORIGIN = "https://cruisepromenade.com";

const DEFAULT_CLAIM_INSTRUCTIONS = (slug: string, officialDomain: string) =>
  `1. Open ${CP_ORIGIN}/organizer/hosted/${slug} (or click "Claim free organizer hub" on ${CP_ORIGIN}/hosted-cruises/${slug}). ` +
  `2. Submit your name, role, and @${officialDomain} work email ($0 forever, no credit card). ` +
  `3. Once verified by our team, open your one-time Welcome Link to save your Organizer Passkey, review or customize your official cabin-booking links, pin featured sailings and onboard group activities, and choose how booked guests join your private RollCall planning group.`;

const SEED_PRIORITY_10_COHORT: ReadonlyArray<SeedOrganizerActivationEntry> = [
  {
    cohortRank: 1,
    organizerSlug: "arnos-bear-cruises",
    officialContact: {
      contactPersonName: "Arno",
      contactPersonRole: "Founder & Group Cruise Organizer",
      officialEmail: "arno@arnoscruises.com",
      officialPhone: "304-964-0568",
      contactSourceUrl: "https://www.arnoscruises.com/contact-us/",
      additionalVerifiedContacts: [],
    },
    telephoneScript:
      "Hi Arno — my name is [Owner Name] calling from Cruise Promenade. We built a dedicated Hosted Cruises directory and researched all four of your upcoming 2027 and 2028 Arno's Bear Cruises sailings—Symphony of the Seas, Rhapsody of the Seas, Navigator of the Seas, and Celebrity Edge. Every cabin button on your pages sends travelers straight to your arnoscruises.com and bearcruiseusa.com reservation forms at $0 cost and 0% commission. Once your guests book their cabin with you, they can use the page to see which shore excursions everyone booked and coordinate meetups without 50-person group texts. I wanted to send over your free claim link so you can customize your welcome note and pin any favorite port excursions whenever you'd like.",
    emailDraft: {
      subject:
        "Your 4 upcoming Arno's Bear Cruises sailings on Cruise Promenade ($0 organizer hub)",
      body:
        "Hi Arno,\n\n" +
        "We recently launched the Hosted Cruises directory on Cruise Promenade and published verified schedule pages for your four upcoming ocean sailings:\n" +
        "• Jan 31, 2027 — Symphony of the Seas\n" +
        "• Sep 3, 2027 — Rhapsody of the Seas\n" +
        "• Jan 28, 2028 — Navigator of the Seas\n" +
        "• Oct 17, 2028 — Celebrity Edge\n\n" +
        "Profile hub: https://cruisepromenade.com/hosted-cruises/arnos-bear-cruises\n\n" +
        "Cruise Promenade never sells cabins or charges commissions—every cabin CTA routes shoppers directly to arnoscruises.com and your official bearcruiseusa.com reservation forms so you keep 100% of cabin bookings. After your guests book with you, our free shared planner, RollCall private group chat, and downloadable offline Cruise Pack let your bears see which shore excursions shipmates booked without endless group texts.\n\n" +
        "If you'd like to claim your free organizer workspace ($0 forever) to add a welcome note, pin recommended excursions or group meetups, and choose who can join your private sailing boards, you can claim in 60 seconds here:\n" +
        "https://cruisepromenade.com/organizer/hosted/arnos-bear-cruises\n\n" +
        "Warm regards,\n[Owner Name]\nCruise Promenade & Destination Command Center",
    },
    valueExplanation:
      "Arno books group allotments via sailing-specific bearcruiseusa.com reservation forms and coordinates guests through a single general Facebook group. Claiming ($0 cost, 100% cabin sales retained by Arno) routes organic ship+date searchers straight to Arno's official forms while giving booked guests a private per-sailing planner, excursion tally, RollCall chat, and offline Cruise Pack.",
    missingInfoToRequestOnClaim: [
      "Confirm Arno's preferred full name and title if desired on the verified organizer header",
      "Confirm whether a standalone global Terms & Conditions / FAQ URL exists outside individual bearcruiseusa.com reservation forms",
      "Confirm minimum age requirement for private Arno's Bear Cruises onboard group events (18+ vs 21+)",
      "Confirm solo roommate-request cutoff timeline across the 2027–2028 sailings",
      "Optional: share any public review profile link (Google Business or Facebook Page reviews)",
    ],
  },
  {
    cohortRank: 2,
    organizerSlug: "atlantis-events",
    officialContact: {
      contactPersonName: null,
      contactPersonRole: "Guest Services, Reservations & Partnerships Team",
      officialEmail: "info@atlantisevents.com",
      officialPhone: "+1 310-859-8800",
      contactSourceUrl: "https://atlantisevents.com/contact",
      additionalVerifiedContacts: [],
    },
    telephoneScript:
      "Hello — I'm calling from Cruise Promenade for your marketing or partnerships team. We maintain verified port-by-port schedule pages for four of Atlantis Events' 2027 full-ship charters—Allure of the Seas, Valiant Lady, Resilient Lady, and Scarlet Lady—where every cabin CTA links directly to atlantisevents.com and res.atlantisevents.com at $0 cost and 0% commission. Once Atlantis guests book on your RezMagic portal, they can use Cruise Promenade to coordinate shore days with friends and download offline port schedules. Could I share the free organizer hub link with the right person on your marketing team?",
    emailDraft: {
      subject:
        "Atlantis Events 2027 charter pages & free organizer hub on Cruise Promenade",
      body:
        "Hello Atlantis Events Partnerships & Marketing Team,\n\n" +
        "We've published verified day-by-day schedule pages on Cruise Promenade for four 2027 Atlantis full-ship charters—Epic Allure Caribbean (Mar 7), Exotic Southern Caribbean on Valiant Lady (Mar 27), Barcelona to Rome on Resilient Lady (Aug 8), and Legendary Greek Isles on Scarlet Lady (Aug 22):\n" +
        "https://cruisepromenade.com/hosted-cruises/atlantis-events\n\n" +
        "Every cabin button routes directly to atlantisevents.com and res.atlantisevents.com ($0 listing fee, $0 lead fee, 0% cabin commission—you keep 100% of your charter bookings). Where Cruise Promenade helps after booking is shore-day coordination: booked guests and friend pods can compare port windows, see which excursions shipmates are doing, chat in RollCall, and save an offline Cruise Pack for ship Wi-Fi.\n\n" +
        "Your team can claim your free Organizer Workspace anytime at:\n" +
        "https://cruisepromenade.com/organizer/hosted/atlantis-events\n\n" +
        "Best regards,\n[Owner Name]\nCruise Promenade",
    },
    valueExplanation:
      "Atlantis operates full-ship charters of 2,700–5,400+ guests booked directly on res.atlantisevents.com. Claiming at $0 lets Atlantis control its official links, pin featured charters, and offer large friend groups a structured shore-day & excursion coordination tool after RezMagic checkout without Atlantis paying anything or sharing cabin revenue.",
    missingInfoToRequestOnClaim: [
      "Confirm designated marketing/partnerships contact person for ongoing hub updates",
      "Confirm canonical /vacation/ URLs as new late-2027 and 2028 charters are announced",
      "Confirm eligible stateroom categories for the complimentary Room Share Program on Virgin Voyages vs Royal Caribbean charters",
      "Optional: supply any authorized external review profile URL",
    ],
  },
  {
    cohortRank: 3,
    organizerSlug: "vacaya",
    officialContact: {
      contactPersonName: "Patrick Gunn",
      contactPersonRole: "Chief Marketing Officer (Marketing, Sponsorship, Press & Partnerships)",
      officialEmail: "patrick@myvacaya.com",
      officialPhone: "+1 718-504-0404",
      contactSourceUrl: "https://www.myvacaya.com/about-vacaya/our-team/",
      additionalVerifiedContacts: [
        {
          label: "V Team Vacation Planners",
          role: "General Guest Services",
          email: "info@myvacaya.com",
          phone: "+1 718-504-0404",
          sourceUrl: "https://www.myvacaya.com/contact/",
        },
        {
          label: "Randle Roper",
          role: "CEO & Co-Founder",
          email: "randle@myvacaya.com",
          phone: "+1 718-504-0404",
          sourceUrl: "https://www.myvacaya.com/about-vacaya/our-team/",
        },
      ],
    },
    telephoneScript:
      "Hi Patrick — this is [Owner Name] from Cruise Promenade. We built a verified Hosted Cruises hub featuring VACAYA and your February 14, 2027 Celebrity Beyond Caribbean Charter. Every booking link points straight to myvacaya.com and your RezMagic portal at $0 cost and 0% commission. Once V Team guests book with you, our platform gives solo travelers and friend groups a clean place to coordinate shore excursions, port windows, and offline Cruise Packs alongside your Solo Travelers Playground community. I'd love to send you your free Organizer Workspace claim link so you can customize your hub and pin upcoming charters.",
    emailDraft: {
      subject:
        "VACAYA on Cruise Promenade — $0 Organizer Workspace & 2027 Celebrity Beyond charter",
      body:
        "Hi Patrick,\n\n" +
        "We've built an independent, zero-commission Hosted Cruises marketplace on Cruise Promenade and published VACAYA's profile and verified schedule page for the Feb 14–21, 2027 Celebrity Beyond Caribbean Cruise:\n" +
        "• Organizer hub: https://cruisepromenade.com/hosted-cruises/vacaya\n" +
        "• 2027 Caribbean Cruise: https://cruisepromenade.com/hosted-cruises/vacaya/celebrity-beyond-2027-02-14\n\n" +
        "Our rule is simple: $0 cost to VACAYA forever, 0% cabin commission, and 100% direct handoff to myvacaya.com and myvacaya.rezmagic.com. After guests book their stateroom with VACAYA, Cruise Promenade helps them coordinate shore excursions by port clock window, chat in private RollCall rooms, and lock an offline Cruise Pack.\n\n" +
        "You can claim VACAYA's free Organizer Workspace using your @myvacaya.com email to customize your welcome copy, pin featured charters, and share any additional 2027–2028 voyages you'd like verified:\n" +
        "https://cruisepromenade.com/organizer/hosted/vacaya\n\n" +
        "Best regards,\n[Owner Name]\nCruise Promenade",
    },
    valueExplanation:
      "VACAYA sells full-ship charters directly on myvacaya.rezmagic.com and empowers solo guests to self-match via its Solo Travelers Playground. Claiming ($0 cost, 100% direct sales kept by VACAYA) turns Cruise Promenade into a zero-cost search funnel to myvacaya.com plus a post-booking port-excursion planner for VACAYA friend groups and solo travelers.",
    missingInfoToRequestOnClaim: [
      "Confirm current cabin availability status (available vs limited vs waitlist) on the Feb 14–21, 2027 Celebrity Beyond charter",
      "Share verified day-by-day port clock schedules for additional 2027–2028 VACAYA charters (e.g., 2027 Total Eclipse Med, Antarctica, river charters) to add to the hub",
      "Optional: provide any public review profile link VACAYA wishes linked",
    ],
  },
  {
    cohortRank: 4,
    organizerSlug: "olivia-travel",
    officialContact: {
      contactPersonName: "Judy Dlugacz",
      contactPersonRole:
        "President & Founder (Marketing team routed via marketing@olivia.com)",
      officialEmail: "marketing@olivia.com",
      officialPhone: "800-631-6277",
      contactSourceUrl: "https://www.olivia.com/contact",
      additionalVerifiedContacts: [
        {
          label: "Olivia Reservations",
          role: "Travel Consultants",
          email: "reservations@olivia.com",
          phone: "800-631-6277",
          sourceUrl: "https://www.olivia.com/contact",
        },
        {
          label: "Olivia Guest Services",
          role: "Booked Guest Support",
          email: "guestservices@olivia.com",
          phone: "+1 415-962-5700",
          sourceUrl: "https://www.olivia.com/contact",
        },
      ],
    },
    telephoneScript:
      "Hello — I'm calling from Cruise Promenade for Olivia Travel's marketing team. We've published verified day-by-day itinerary pages for Olivia's Feb 13, 2027 XOXO Caribbean Cruise and Jan 29, 2028 Vol. 55 Anniversary Cruise aboard Holland America's Eurodam. Every cabin button routes straight to olivia.com and olivia.rezmagic.com at $0 cost to Olivia. Because nearly a third of Olivia guests travel solo, our post-booking shared planner and RollCall community make it easy for booked guests to coordinate shore excursions together before embarkation. May I email marketing@olivia.com your free organizer claim link?",
    emailDraft: {
      subject:
        "Olivia Travel's 2027 XOXO & 2028 Vol. 55 Anniversary charters on Cruise Promenade ($0 hub)",
      body:
        "Hello Olivia Travel Marketing Team,\n\n" +
        "We've published verified schedule pages on Cruise Promenade for both of Olivia's upcoming Holland America Eurodam full-ship charters—the Feb 13, 2027 XOXO Caribbean Cruise and the Jan 29, 2028 Vol. 55 Anniversary Cruise:\n" +
        "https://cruisepromenade.com/hosted-cruises/olivia-travel\n\n" +
        "Cruise Promenade charges $0 to organizers and takes 0% commission: every cabin inquiry goes directly to olivia.com, olivia.rezmagic.com, and your Olivia Travel Consultants at 800-631-6277. Once guests book with Olivia, they can use Cruise Promenade to coordinate port excursions with fellow travelers and Solos, message privately in RollCall, and download an offline Cruise Pack.\n\n" +
        "You can claim Olivia's free Organizer Workspace with an @olivia.com email here:\n" +
        "https://cruisepromenade.com/organizer/hosted/olivia-travel\n\n" +
        "Warmly,\n[Owner Name]\nCruise Promenade",
    },
    valueExplanation:
      "With nearly one-third of Olivia guests sailing solo and high repeat community loyalty across full-ship charters on olivia.rezmagic.com, claiming ($0 cost, 100% of bookings retained by Olivia) gives Olivia control over official links, featured anniversary charters, and a structured post-booking excursion coordination space for solo and repeat travelers.",
    missingInfoToRequestOnClaim: [
      "Confirm Olivia's official numeric minimum guest age policy across ocean charters (e.g., 18+ or 21+)",
      "Confirm preferred marketing contact name at marketing@olivia.com",
      "Confirm Room Share Program eligible cabin categories on the 2027 XOXO and 2028 Vol. 55 Eurodam charters",
      "Optional: share any public review profile link",
    ],
  },
  {
    cohortRank: 5,
    organizerSlug: "pied-piper-travel",
    officialContact: {
      contactPersonName: "Ernesto",
      contactPersonRole: "Director of Sales and Marketing",
      officialEmail: "ernesto@piedpipercruises.com",
      officialPhone: "(800) 874-7312",
      contactSourceUrl: "https://www.piedpipertravel.com/gaygroupcruises/contact-us.php",
      additionalVerifiedContacts: [
        {
          label: "Robert",
          role: "General Manager",
          email: "robert@piedpipercruises.com",
          phone: "(718) 261-4596",
          sourceUrl: "https://www.piedpipertravel.com/gaygroupcruises/contact-us.php",
        },
      ],
    },
    telephoneScript:
      "Hi Ernesto — this is [Owner Name] calling from Cruise Promenade. We feature Pied Piper Travel in our LGBTQ+ Hosted Cruises directory, including your August 24, 2027 Alaska Gay Group Cruise aboard Virgin Voyages' Brilliant Lady. Because your onboard parties and group dining require booking through Pied Piper, our page makes that policy crystal clear and sends every cabin shopper straight to your piedpipertravel.com reservation form at $0 cost and 0% commission. Afterward, booked group members can coordinate Seattle pre-cruise plans and Alaska shore excursions together on one private board. Can I send you the free claim link?",
    emailDraft: {
      subject:
        "Pied Piper Travel's 2027 Brilliant Lady Alaska Group Cruise on Cruise Promenade ($0 hub)",
      body:
        "Hi Ernesto,\n\n" +
        "We've published Pied Piper Travel's organizer profile and verified port-window page for your Aug 24–Sep 2, 2027 Alaska LGBTQ+ Group Cruise aboard Virgin Voyages' Brilliant Lady:\n" +
        "• Organizer profile: https://cruisepromenade.com/hosted-cruises/pied-piper-travel\n" +
        "• 2027 Alaska sailing: https://cruisepromenade.com/hosted-cruises/pied-piper-travel/brilliant-lady-2027-08-24\n\n" +
        "We clearly explain that travelers must book through Pied Piper to join your private onboard parties and group dining, and every cabin CTA links directly to piedpipertravel.com ($0 cost, 0% commission—you keep 100% of cabin sales). Once your guests book, they can use Cruise Promenade's private group planner and RollCall chat to coordinate Ketchikan, Sitka, Prince Rupert, and Victoria excursions together.\n\n" +
        "You can claim Pied Piper's free Organizer Workspace in a minute here:\n" +
        "https://cruisepromenade.com/organizer/hosted/pied-piper-travel\n\n" +
        "Best regards,\n[Owner Name]\nCruise Promenade",
    },
    valueExplanation:
      "Pied Piper hosts LGBTQ+ groups on mainstream ships where outside bookings are barred from private parties and group dining. Claiming ($0 cost, 100% cabin sales retained by Pied Piper) reinforces Pied Piper's mandatory group-block rule, drives searchers to reservations.php, and lets Pied Piper gate private RollCall excursion planning strictly to verified group guests.",
    missingInfoToRequestOnClaim: [
      "Confirm full 2027–2028 hosted gay group cruise calendar (Post-Thanksgiving, QM2 crossings, Europe/Caribbean) to add to the hub",
      "Confirm cutoff window for 'Arrange Share' solo roommate matching before each departure",
      "Confirm any updated Instagram or Facebook page URLs",
    ],
  },
  {
    cohortRank: 6,
    organizerSlug: "aquafest-cruises",
    officialContact: {
      contactPersonName: "Tom Baker",
      contactPersonRole: "President & Founder (with Lori Herzog, Senior Cruise Consultant)",
      officialEmail: null,
      officialPhone: "(800) 592-9058",
      contactSourceUrl: "https://aquafestcruises.com/about/",
      additionalVerifiedContacts: [
        {
          label: "Lori Herzog",
          role: "Senior Cruise Consultant",
          email: null,
          phone: "(800) 592-9058",
          sourceUrl: "https://aquafestcruises.com/about/",
        },
        {
          label: "Kathy Holland",
          role: "Cruise Consultant",
          email: null,
          phone: "(800) 592-9058",
          sourceUrl: "https://aquafestcruises.com/about/",
        },
      ],
    },
    telephoneScript:
      "Hi Tom or Lori — my name is [Owner Name] calling from Cruise Promenade. We researched and published Aquafest Cruises' profile and your 17-night October 29, 2027 Celebrity Constellation Halloween Transatlantic sailing from Rome to Tampa. Our page highlights that Aquafest private events and hospitality require booking directly through an Aquafest Cruise Consultant at (800) 592-9058 or aquafestcruises.com/contact/, at $0 cost and 0% commission to Aquafest. Once guests book with your desk, our 17-night shared planner helps your group coordinate Mediterranean and transatlantic port days together. What is the best @aquafestcruises.com email to send your free Organizer Workspace link?",
    emailDraft: {
      subject:
        "Aquafest Cruises' 2027 Halloween Transatlantic on Cruise Promenade ($0 organizer hub)",
      body:
        "Hi Tom and Lori,\n\n" +
        "Thank you for speaking with us—here is Aquafest Cruises' verified organizer hub and 17-night Oct 29, 2027 Celebrity Constellation Halloween Transatlantic page on Cruise Promenade:\n" +
        "• Organizer hub: https://cruisepromenade.com/hosted-cruises/aquafest-cruises\n" +
        "• Oct 29, 2027 Transatlantic: https://cruisepromenade.com/hosted-cruises/aquafest-cruises/celebrity-constellation-2027-10-29\n\n" +
        "Every cabin CTA sends travelers directly to aquafestcruises.com/contact/ and your Cruise Consultants at (800) 592-9058, and clearly notes that private Aquafest parties, entertainment, and group dining require booking through Aquafest ($0 cost to you, 0% commission). After booking, your guests can coordinate Rome pre-cruise stays, Alicante, Málaga, Gibraltar, and transatlantic port excursions, and download an offline Cruise Pack.\n\n" +
        "Claim your free Organizer Workspace anytime at:\n" +
        "https://cruisepromenade.com/organizer/hosted/aquafest-cruises\n\n" +
        "Warm regards,\n[Owner Name]\nCruise Promenade",
    },
    valueExplanation:
      "Aquafest processes all cabin sales by phone/consultant desk rather than online credit-card checkout and restricts private entertainment and dining to Aquafest-booked cabins. Claiming ($0 cost, 100% of cabin sales kept by Aquafest) sends high-intent searchers straight to Aquafest's consultant desk while giving 17-night transatlantic guests a rich multi-port excursion coordination hub.",
    missingInfoToRequestOnClaim: [
      "Supply a direct @aquafestcruises.com work email for claim verification (public site exposes only phone (800) 592-9058 and web form)",
      "Confirm whether private Aquafest onboard cocktail events enforce an 18+ or 21+ guest age minimum",
      "Confirm clean canonical Facebook URL and any Instagram handle",
      "Confirm any additional 2027–2028 Aquafest hosted group departures",
    ],
  },
  {
    cohortRank: 7,
    organizerSlug: "lesbians-aboard",
    officialContact: {
      contactPersonName: "Natasha DeJesus & Heather Diver",
      contactPersonRole: "Co-Hosts (Natasha DeJesus, Virgin Voyages Top 100 First Mate)",
      officialEmail: null,
      officialPhone: "727-616-7682",
      contactSourceUrl: "https://lesbiansaboard.com/meet-your-hosts",
      additionalVerifiedContacts: [
        {
          label: "Lesbians Aboard Booking Inquiry Page",
          role: "First Mate Referral & Group Attachment",
          email: null,
          phone: "727-616-7682",
          sourceUrl: "https://lesbiansaboard.com/contact-us",
        },
      ],
    },
    telephoneScript:
      "Hi Natasha and Heather — this is [Owner Name] calling from Cruise Promenade. We love how Lesbians Aboard brings LGBTQ+ women together on Virgin Voyages at $0 extra group fee, and we just verified and published your February 15, 2027 Sisters at Sea sailing on Scarlet Lady—including the 4-ship Fleet Rendezvous, Freeport, and Bimini. Every cabin link on your Cruise Promenade page preserves your exact Virgin Voyages First Mate referral link so you keep 100% of your advisor credit at $0 cost to you. Once Sailors book through your link, they can use your private board to coordinate Freeport and Bimini excursions, dining nights, and RollCall chat. What's the best @lesbiansaboard.com email to send your free claim link?",
    emailDraft: {
      subject:
        "Lesbians Aboard — Sisters at Sea 2027 on Cruise Promenade ($0 hub preserving your First Mate link)",
      body:
        "Hi Natasha and Heather,\n\n" +
        "We've published Lesbians Aboard's organizer profile and verified day-by-day schedule page for Sisters at Sea 2027 aboard Scarlet Lady (Feb 15–20, 2027):\n" +
        "• Organizer hub: https://cruisepromenade.com/hosted-cruises/lesbians-aboard\n" +
        "• Sisters at Sea 2027: https://cruisepromenade.com/hosted-cruises/lesbians-aboard/scarlet-lady-2027-02-15\n\n" +
        "Cruise Promenade is 100% free ($0 forever, 0% commission) and routes every cabin click directly to lesbiansaboard.com and your official Virgin Voyages First Mate booking link (agencyId=477 / agentId=140537) so you retain 100% of your Virgin advisor credit. After Sailors book through you, they can join your private Cruise Promenade planner & RollCall group to coordinate dining reservations, Freeport & Bimini Beach Club plans, and offline schedules.\n\n" +
        "You can claim your free Organizer Workspace anytime at:\n" +
        "https://cruisepromenade.com/organizer/hosted/lesbians-aboard\n\n" +
        "Cheers,\n[Owner Name]\nCruise Promenade",
    },
    valueExplanation:
      "Lesbians Aboard monetizes through Natasha DeJesus's Virgin Voyages First Mate advisor commission ($0 extra fee to Sailors). Claiming ($0 cost, 100% First Mate attribution preserved) protects Natasha's exact referral link while giving solo Sailors and couples a dedicated place to coordinate Virgin dining, Bimini plans, and onboard meetups.",
    missingInfoToRequestOnClaim: [
      "Confirm preferred @lesbiansaboard.com email address for workspace verification",
      "Confirm additional 2027–2028 sailings from /upcoming-lesbian-cruises to publish on the hub",
      "Confirm policy for Sailors who already booked Scarlet Lady Feb 15, 2027 directly with Virgin and wish to transfer into Natasha's group",
    ],
  },
  {
    cohortRank: 8,
    organizerSlug: "cmmc-at-sea",
    officialContact: {
      contactPersonName: "Evan Neufeld",
      contactPersonRole:
        "Event Host, CMMC-RP / Partnerships (Edwards Performance Solutions)",
      officialEmail: "Info@CMMCatSea.com",
      officialPhone: null,
      contactSourceUrl: "https://cmmcatsea.com/cmmc-at-sea-101/",
      additionalVerifiedContacts: [
        {
          label: "Matt Hoeper",
          role: "Director, Commercial/Cybersecurity (Edwards Performance Solutions)",
          email: "Info@CMMCatSea.com",
          phone: null,
          sourceUrl: "https://cmmcatsea.com/",
        },
      ],
    },
    telephoneScript:
      "Hi Evan — this is [Owner Name] from Cruise Promenade. We published a verified conference-at-sea page for CMMC at Sea aboard Celebrity Beyond (January 17–24, 2027 out of Fort Lauderdale) that explains your exact two-step registration—purchasing the $295 Conference Pass or CCP course via Edwards Performance Solutions and booking the stateroom with Celebrity Cruises—at $0 cost and 0% commission. Once defense contractors and their families register, our private planner and offline Cruise Pack let attendees see sea-day CMMC workshops alongside Nassau, Cozumel, and Grand Cayman shore excursions so nobody double-books. Check Info@CMMCatSea.com for your free Organizer Workspace link whenever you have a minute.",
    emailDraft: {
      subject:
        "CMMC at Sea (Jan 17–24, 2027 Celebrity Beyond) — free Organizer Workspace on Cruise Promenade",
      body:
        "Hi Evan and the CMMC at Sea Team,\n\n" +
        "We've published a verified schedule and registration guide on Cruise Promenade for CMMC at Sea aboard Celebrity Beyond (Jan 17–24, 2027 round-trip from Fort Lauderdale):\n" +
        "• Organizer hub: https://cruisepromenade.com/hosted-cruises/cmmc-at-sea\n" +
        "• Jan 17, 2027 sailing page: https://cruisepromenade.com/hosted-cruises/cmmc-at-sea/celebrity-beyond-2027-01-17\n\n" +
        "Our page clearly outlines your two-step registration path—purchasing the $295 Defense Contractor Conference Pass (or CCP at Sea training) through Edwards Performance Solutions, booking the stateroom with Celebrity Cruises, and emailing confirmation to Info@CMMCatSea.com—at $0 cost and 0% commission.\n\n" +
        "Where Cruise Promenade helps your attendees right away: you can claim your free Organizer Workspace to pin sea-day CMMC sessions, networking receptions, and CCP classroom hours onto the exact Celebrity Beyond itinerary so attendees and their accompanying spouses/families can coordinate Nassau, Cozumel, and Grand Cayman excursions and download an offline Cruise Pack.\n\n" +
        "Claim your free workspace with Info@CMMCatSea.com here:\n" +
        "https://cruisepromenade.com/organizer/hosted/cmmc-at-sea\n\n" +
        "Best regards,\n[Owner Name]\nCruise Promenade",
    },
    valueExplanation:
      "Because CMMC at Sea uses an unbundled model (Edwards Performance Solutions sells the $295 Conference Pass / $1,350 CCP training while guests book cabins directly with Celebrity), attendees don't share a single travel-agency itinerary portal. Claiming ($0 cost) gives Evan's team a turnkey conference + port-excursion schedule board and verified-pass access gate.",
    missingInfoToRequestOnClaim: [
      "Confirm exact sea-day conference session hours and 4-day CCP at Sea classroom times to pin on the Celebrity Beyond schedule",
      "Optional: supply a phone number if Edwards Performance Solutions wants phone contact displayed alongside Info@CMMCatSea.com",
      "Confirm whether a 2028 CMMC at Sea edition is planned after the inaugural January 2027 voyage",
    ],
  },
  {
    cohortRank: 9,
    organizerSlug: "craft-cruises",
    officialContact: {
      contactPersonName: "Melissa Gower",
      contactPersonRole: "Founder, Craft Cruises, Inc.",
      officialEmail: null,
      officialPhone: "877-972-7238",
      contactSourceUrl: "https://www.craftcruises.com/about_us.php",
      additionalVerifiedContacts: [
        {
          label: "Craft Cruises Reservations Desk",
          role: "Custom Quote & Class Registration (877-97-CRAFT)",
          email: null,
          phone: "877-972-7238",
          sourceUrl: "https://www.craftcruises.com/contact_us.php",
        },
      ],
    },
    telephoneScript:
      "Hi Melissa — my name is [Owner Name] calling from Cruise Promenade. We feature Craft Cruises in our Crafting & Hobbies cruise directory, including your April 11, 2027 14-Day Circle Japan Knitting Cruise aboard Holland America's Westerdam. Every cabin and class button routes crafters straight to craftcruises.com and 877-97-CRAFT at $0 cost and 0% commission, and clearly notes that guests must book through Craft Cruises to join onboard classes and private yarn excursions. Once your knitters book with you, they can use your private planner to see sea-day class times alongside Japan port windows and non-crafting spouse excursions. What's the best @craftcruises.com email to send your free claim link?",
    emailDraft: {
      subject:
        "Craft Cruises' 2027 Circle Japan Knitting Cruise on Cruise Promenade ($0 organizer hub)",
      body:
        "Hi Melissa,\n\n" +
        "We've created Craft Cruises' organizer profile and sailing page for your Apr 11–25, 2027 14-Day Circle Japan Knitting Cruise aboard Holland America's Westerdam:\n" +
        "• Organizer hub: https://cruisepromenade.com/hosted-cruises/craft-cruises\n" +
        "• Circle Japan Knitting Cruise: https://cruisepromenade.com/hosted-cruises/craft-cruises/westerdam-2027-04-11\n\n" +
        "Every booking CTA directs travelers straight to craftcruises.com and 877-972-7238 ($0 cost, 0% commission—Craft Cruises keeps 100% of cabin and class package sales), and makes clear that onboard classes and private fiber tours require booking through Craft Cruises. After registration, your knitters and their traveling companions can use Cruise Promenade to coordinate port days across Japan, pin sea-day class blocks, and download an offline Cruise Pack.\n\n" +
        "You can claim Craft Cruises' free Organizer Workspace anytime at:\n" +
        "https://cruisepromenade.com/organizer/hosted/craft-cruises\n\n" +
        "Warm regards,\n[Owner Name]\nCruise Promenade",
    },
    valueExplanation:
      "Craft Cruises sells custom cabin + class packages and private yarn excursions exclusively through its in-house desk, often with non-knitting spouses sharing cabins. Claiming ($0 cost, 100% of cabin and class revenue retained by Craft Cruises) reinforces its mandatory group-booking rule and lets knitters + non-crafting companions coordinate 14 days of classes vs port excursions cleanly.",
    missingInfoToRequestOnClaim: [
      "Supply preferred @craftcruises.com email address for claim verification",
      "Confirm or verify day-by-day port arrival/departure clock times on the Apr 11, 2027 Westerdam Circle Japan itinerary if any custom group tour timings apply",
      "Supply official social media URLs (Facebook, Instagram, Ravelry) if desired on the profile",
      "Share additional 2027–2028 Knitting/Crocheting group departures to list",
    ],
  },
  {
    cohortRank: 10,
    organizerSlug: "singlescruise",
    officialContact: {
      contactPersonName: null,
      contactPersonRole:
        "SinglesCruise Group Department (The Vacation Group / Travel Leaders Leisure Group)",
      officialEmail: "SinglesCruise@Vacation.com",
      officialPhone: "800-393-5000",
      contactSourceUrl: "https://www.singlescruise.com/all-cruises/",
      additionalVerifiedContacts: [
        {
          label: "SinglesCruise Direct / International Line",
          role: "Reservations & Group Support",
          email: "SinglesCruise@Vacation.com",
          phone: "201-210-7918",
          sourceUrl: "https://www.singlescruise.com/all-cruises/",
        },
      ],
    },
    telephoneScript:
      "Hello — I'm calling from Cruise Promenade for the SinglesCruise.com program or marketing lead. We've published SinglesCruise.com's profile and verified port-window page for your February 14, 2027 Valentine's Day & Big Game Cruise aboard Norwegian Breakaway out of New Orleans. Every cabin button routes straight to singlescruise.com and your MyAgentMate group registration portal at $0 cost and 0% commission, and clearly explains that guests must be 21+ and book through SinglesCruise to attend private singles events. Once guests register with you, they can coordinate Cozumel, Roatan, and Costa Maya shore excursions together on a private board. Could I confirm the best contact at SinglesCruise@Vacation.com to send your free Organizer Workspace link?",
    emailDraft: {
      subject:
        "SinglesCruise.com's Feb 14, 2027 Norwegian Breakaway sailing on Cruise Promenade ($0 hub)",
      body:
        "Hello SinglesCruise.com Team,\n\n" +
        "We've published SinglesCruise.com's organizer profile and verified port schedule page for your Feb 14–21, 2027 Valentine's Day & Big Game Cruise aboard Norwegian Breakaway:\n" +
        "• Organizer hub: https://cruisepromenade.com/hosted-cruises/singlescruise\n" +
        "• Feb 14, 2027 sailing: https://cruisepromenade.com/hosted-cruises/singlescruise/norwegian-breakaway-2027-02-14\n\n" +
        "Cruise Promenade charges $0 forever and takes 0% commission—every cabin CTA sends travelers directly to singlescruise.com/all-cruises/ and your MyAgentMate portal, and clearly states that participants must be 21+ and booked inside the SinglesCruise group block. Once guests book with you, our private planner and RollCall chat let solo cruisers see which Costa Maya, Roatan, Harvest Caye, and Cozumel excursions fellow group members booked—plus download an offline Cruise Pack.\n\n" +
        "Note: during our verification pass we also noticed that singlescruise.com/terms/ and /contact/ currently return 404 while your site maintenance banner is up; once claimed, you can set your preferred policy and booking URLs directly in your free Organizer Workspace:\n" +
        "https://cruisepromenade.com/organizer/hosted/singlescruise\n\n" +
        "Best regards,\n[Owner Name]\nCruise Promenade",
    },
    valueExplanation:
      "SinglesCruise.com sells 21+ hosted group blocks via MyAgentMate with complimentary Roommate Matching and relies heavily on pre-cruise solo social connection. Claiming ($0 cost, 100% of cabin sales kept by SinglesCruise) routes solo cruise shoppers directly to SinglesCruise's booking portal while giving booked singles a structured port-excursion tally and RollCall room beyond a Facebook wall.",
    missingInfoToRequestOnClaim: [
      "Confirm named SinglesCruise Program Director or Marketing Lead (note: claim email SinglesCruise@Vacation.com uses parent domain vacation.com, which DCC owner can verify directly)",
      "Provide working URL for standalone Terms & Conditions / cancellation fee schedule once site maintenance on /terms/ is resolved",
      "Confirm guaranteed complimentary Roommate Matching cutoff deadline prior to sailing",
      "Confirm full 2027–2028 hosted singles cruise calendar (Halloween, New Year's, Alaska, Europe) to add to the hub",
    ],
  },
];

interface StoredActivationStateOverride {
  trackingState: OrganizerActivationTrackingState;
  outreachSent: boolean;
  ownerNotes?: string;
  updatedAt: string;
}

const memoryActivationOverrides = new Map<string, StoredActivationStateOverride>();
let neonTableEnsured = false;

async function ensureNeonActivationTable(sql: unknown): Promise<void> {
  if (neonTableEnsured) return;
  await (sql as any).query(`
    CREATE TABLE IF NOT EXISTS dcc_hosted_organizer_activation_cohort (
      organizer_slug TEXT PRIMARY KEY,
      tracking_state TEXT NOT NULL,
      outreach_sent BOOLEAN NOT NULL DEFAULT FALSE,
      owner_notes TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  neonTableEnsured = true;
}

async function loadActivationOverrides(): Promise<Map<string, StoredActivationStateOverride>> {
  const merged = new Map<string, StoredActivationStateOverride>(memoryActivationOverrides);
  let conn: string | undefined;
  try {
    conn = resolveNeonMigrationDatabaseUrl();
  } catch {
    conn = undefined;
  }
  if (!conn) return merged;

  try {
    const sql = neon(conn);
    await ensureNeonActivationTable(sql);
    const rows = (await (sql as any).query(
      `SELECT organizer_slug, tracking_state, outreach_sent, owner_notes, updated_at
       FROM dcc_hosted_organizer_activation_cohort`,
    )) as Array<{
      organizer_slug: string;
      tracking_state: string;
      outreach_sent: boolean;
      owner_notes: string | null;
      updated_at: string | Date;
    }>;
    for (const r of rows) {
      if (
        ORGANIZER_ACTIVATION_TRACKING_STATES.includes(
          r.tracking_state as OrganizerActivationTrackingState,
        )
      ) {
        merged.set(r.organizer_slug, {
          trackingState: r.tracking_state as OrganizerActivationTrackingState,
          outreachSent: Boolean(r.outreach_sent),
          ...(r.owner_notes ? { ownerNotes: r.owner_notes } : {}),
          updatedAt:
            r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
        });
      }
    }
  } catch {
    // Non-fatal fallback to baseline not_contacted + in-memory state
  }
  return merged;
}

export async function getOrganizerActivationCohort(): Promise<OrganizerActivationPackage[]> {
  const overrides = await loadActivationOverrides();
  return SEED_PRIORITY_10_COHORT.map((seed) => {
    const org = DCC_CANONICAL_HOSTED_ORGANIZERS.find(
      (o) => o.organizerSlug === seed.organizerSlug,
    );
    if (!org) {
      throw new Error(
        `Priority 10 activation cohort organizer "${seed.organizerSlug}" missing from DCC_CANONICAL_HOSTED_ORGANIZERS.`,
      );
    }
    const sailings = DCC_CANONICAL_HOSTED_SAILINGS.filter(
      (s) => s.organizerSlug === seed.organizerSlug,
    ).map((s) => ({
      hostedSailingId: s.hostedSailingId,
      sailingSlug: s.sailingSlug,
      sailingTitle: s.sailingTitle,
      sailDate: s.canonicalSailDate,
      shipNameLabel: s.canonicalShipSlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      cruisePromenadeUrl: `${CP_ORIGIN}/hosted-cruises/${org.organizerSlug}/${s.sailingSlug}`,
      officialSailingPageUrl: s.officialSailingPageUrl,
      officialReservationFormUrl: s.officialReservationFormUrl,
      indexationHeld: Boolean(s.scheduleHoldReason),
      ...(s.scheduleHoldReason ? { scheduleHoldReason: s.scheduleHoldReason } : {}),
    }));

    const ov = overrides.get(seed.organizerSlug);
    return {
      cohortRank: seed.cohortRank,
      organizerId: org.organizerId,
      organizerSlug: org.organizerSlug,
      organizerName: org.organizerName,
      categoryLabel: org.categoryLabel,
      publicProfileUrl: `${CP_ORIGIN}/hosted-cruises/${org.organizerSlug}`,
      freeClaimUrl: `${CP_ORIGIN}/organizer/hosted/${org.organizerSlug}`,
      freeClaimInstructions: DEFAULT_CLAIM_INSTRUCTIONS(org.organizerSlug, org.officialDomain),
      verifiedSailingUrls: sailings,
      officialContact: seed.officialContact,
      telephoneScript: seed.telephoneScript,
      emailDraft: seed.emailDraft,
      valueExplanation: seed.valueExplanation,
      missingInfoToRequestOnClaim: seed.missingInfoToRequestOnClaim,
      trackingState: ov?.trackingState ?? "not_contacted",
      outreachSent: ov?.outreachSent ?? false,
      ...(ov?.ownerNotes ? { ownerNotes: ov.ownerNotes } : {}),
      updatedAt: ov?.updatedAt ?? org.verifiedSourceCheckedAt,
    };
  });
}

export async function updateOrganizerActivationTrackingState(input: {
  organizerSlug: string;
  trackingState: OrganizerActivationTrackingState;
  ownerNotes?: string;
}): Promise<OrganizerActivationPackage> {
  const cleanSlug = input.organizerSlug.trim().toLowerCase();
  const exists = SEED_PRIORITY_10_COHORT.some((s) => s.organizerSlug === cleanSlug);
  if (!exists) {
    throw new TypeError(`Organizer "${cleanSlug}" is not in the Priority 10 activation cohort.`);
  }
  if (!ORGANIZER_ACTIVATION_TRACKING_STATES.includes(input.trackingState)) {
    throw new TypeError(`Invalid activation trackingState "${input.trackingState}".`);
  }

  const outreachSent = input.trackingState !== "not_contacted";
  const updatedAt = new Date().toISOString();
  const cleanNotes = input.ownerNotes?.trim() ? input.ownerNotes.trim().slice(0, 500) : undefined;

  const nextOverride: StoredActivationStateOverride = {
    trackingState: input.trackingState,
    outreachSent,
    ...(cleanNotes ? { ownerNotes: cleanNotes } : {}),
    updatedAt,
  };
  memoryActivationOverrides.set(cleanSlug, nextOverride);

  let conn: string | undefined;
  try {
    conn = resolveNeonMigrationDatabaseUrl();
  } catch {
    conn = undefined;
  }
  if (conn) {
    try {
      const sql = neon(conn);
      await ensureNeonActivationTable(sql);
      await (sql as any).query(
        `INSERT INTO dcc_hosted_organizer_activation_cohort (
          organizer_slug, tracking_state, outreach_sent, owner_notes, updated_at
        ) VALUES ($1, $2, $3, $4, $5::timestamptz)
        ON CONFLICT (organizer_slug) DO UPDATE SET
          tracking_state = EXCLUDED.tracking_state,
          outreach_sent = EXCLUDED.outreach_sent,
          owner_notes = EXCLUDED.owner_notes,
          updated_at = EXCLUDED.updated_at`,
        [cleanSlug, input.trackingState, outreachSent, cleanNotes ?? null, updatedAt],
      );
    } catch {
      // Non-fatal in local test environments
    }
  }

  const all = await getOrganizerActivationCohort();
  return all.find((p) => p.organizerSlug === cleanSlug)!;
}
