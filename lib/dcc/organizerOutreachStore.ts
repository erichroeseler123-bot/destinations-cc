import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { resolveDatabaseUrl } from "@/lib/db/client";
import { isServerlessRuntimeEnvironment } from "@/lib/dcc/storage/transactionalSubmissions";
import { listRecentProductionCorridorEvents } from "@/lib/dcc/telemetry/corridorEvents";
import {
  CRUISE_PROMENADE_LAUNCH_EPOCH_ISO,
  type CorridorEventInput,
} from "@/lib/dcc/telemetry/cruisePromenadeFunnel";
import { resolveEarthosEnvironmentScope } from "@/lib/dcc/travelReference";

export const ORGANIZER_OUTREACH_OWNER = "dcc:organizer-outreach";

export const HOSTED_ORGANIZER_CORE_PITCH =
  "We built a free shared cruise page for hosted groups. Your travelers can meet before sailing, see which excursions everyone is joining, book the exact same departure, and keep the entire schedule together—including an offline Cruise Pack. It does not interfere with your cabin sales, travel advisor, conference programming or onboard events.";

export const REQUESTED_CALL_ACTION =
  "Open the sailing page while we are on the phone and decide whether you would be comfortable sharing it with your group.";

export const VALID_QUALIFICATION_STATUSES = [
  "qualified_page_live",
  "held_schedule_conflict",
  "needs_sailing_qualification",
] as const;

export type OrganizerQualificationStatus =
  (typeof VALID_QUALIFICATION_STATUSES)[number];

export const VALID_OUTREACH_STATUSES = [
  "ready_to_call",
  "needs_qualification_call",
  "draft_ready",
  "held_pending_schedule_check",
  "call_attempted",
  "called_left_vm",
  "called_spoke",
  "follow_up_requested",
  "texted",
  "emailed",
  "replied",
  "interested",
  "board_live",
  "first_traveler_joined",
  "bounced_failed",
  "wrong_contact",
  "not_a_fit",
  "on_hold",
] as const;

export type OrganizerOutreachStatus = (typeof VALID_OUTREACH_STATUSES)[number];

export const CONTACTED_OUTREACH_STATUSES: ReadonlySet<OrganizerOutreachStatus> =
  new Set<OrganizerOutreachStatus>([
    "call_attempted",
    "called_left_vm",
    "called_spoke",
    "follow_up_requested",
    "texted",
    "emailed",
    "replied",
    "interested",
    "board_live",
    "first_traveler_joined",
  ]);

export const REPLIED_OUTREACH_STATUSES: ReadonlySet<OrganizerOutreachStatus> =
  new Set<OrganizerOutreachStatus>([
    "replied",
    "interested",
    "follow_up_requested",
    "board_live",
    "first_traveler_joined",
  ]);

export interface OrganizerTelemetryAttribution {
  utmSource: string;
  sessionsCount: number;
  sailingViewsCount: number;
  startBoardCount: number;
  boardsCreatedCount: number;
  guestJoinEventsCount: number;
  detectedShareCodes: string[];
  lastActivityAt: string | null;
}

export interface OrganizerOutreachLead {
  leadId: string;
  isSeeded: boolean;
  priorityRank: number;
  leadName: string;
  contactName: string | null;
  organizerRole: string | null;
  phone: string | null;
  phoneDial: string | null;
  phoneInvitesText: boolean;
  email: string | null;
  altEmails: string[];
  contactPageUrl: string | null;
  officialUrl: string | null;
  eventPageUrl: string | null;
  contactTimezone: string;
  bestCallingWindow: string;
  cohortDescription: string;
  cruiseLine: string;
  hostedCruiseAndSailing: string;
  shipName: string;
  shipSlug: string | null;
  sailDate: string | null;
  returnDate: string | null;
  portWindowsSummary: string;
  qualificationStatus: OrganizerQualificationStatus;
  qualificationLabel: string;
  qualificationDetail: string;
  utmSource: string;
  /** Non-null ONLY when `qualificationStatus === "qualified_page_live"`. */
  sailingPageUrl: string | null;
  groupsSetupUrl: string;
  valueToPitchSummary: string;
  corePitchVerbatim: string;
  requestedCallAction: string;
  phoneOpeningScript: string;
  voicemailScript: string;
  phoneOrTextScript: string;
  likelyObjection: string;
  objectionResponse: string;
  emailSubject: string;
  emailBody: string;
  recommendedNextAction: string;
  outreachStatus: OrganizerOutreachStatus;
  outreachStatusLabel: string;
  hasSentOutreach: boolean;
  outreachCount: number;
  lastContactedAt: string | null;
  lastContactChannel: "call" | "text" | "email" | "portal" | null;
  followUpDate: string | null;
  notes: string;
  boardCreated: boolean;
  boardShareCode: string | null;
  boardUrl: string | null;
  /** Group participants on the Cruise Promenade board (never supplier inventory). */
  travelersJoined: number;
  telemetry: OrganizerTelemetryAttribution;
  updatedAt: string;
  updatedBy: string;
}

export interface OrganizerOutreachKpis {
  totalLeadsCount: number;
  phoneLeadsCount: number;
  phoneQualifiedReadyCount: number;
  qualifiedReadyCount: number;
  heldOrNeedsQualificationCount: number;
  outreachSentLeadsCount: number;
  totalOutreachTouchesCount: number;
  repliedCount: number;
  followUpsDueCount: number;
  boardsCreatedCount: number;
  travelersJoinedCount: number;
}

export interface OrganizerOutreachDashboardSnapshot {
  ok: true;
  generatedAt: string;
  environmentScope: "production" | "nonprod";
  storageBackend: "postgres" | "local_dev_file" | "seed_only";
  corePitchVerbatim: string;
  requestedCallAction: string;
  kpis: OrganizerOutreachKpis;
  leads: OrganizerOutreachLead[];
}

export interface StoredOrganizerLeadOverlay {
  leadId: string;
  isCustomLead?: boolean;
  priorityRank?: number;
  leadName?: string;
  contactName?: string | null;
  organizerRole?: string | null;
  phone?: string | null;
  phoneInvitesText?: boolean;
  email?: string | null;
  altEmails?: string[];
  contactPageUrl?: string | null;
  officialUrl?: string | null;
  eventPageUrl?: string | null;
  contactTimezone?: string;
  bestCallingWindow?: string;
  cohortDescription?: string;
  cruiseLine?: string;
  hostedCruiseAndSailing?: string;
  shipName?: string;
  shipSlug?: string | null;
  sailDate?: string | null;
  returnDate?: string | null;
  portWindowsSummary?: string;
  qualificationStatus?: OrganizerQualificationStatus;
  qualificationDetail?: string;
  utmSource?: string;
  sailingPageUrl?: string | null;
  valueToPitchSummary?: string;
  phoneOpeningScript?: string;
  voicemailScript?: string;
  phoneOrTextScript?: string;
  likelyObjection?: string;
  objectionResponse?: string;
  emailSubject?: string;
  emailBody?: string;
  recommendedNextAction?: string;
  outreachStatus?: OrganizerOutreachStatus;
  outreachCount?: number;
  lastContactedAt?: string | null;
  lastContactChannel?: "call" | "text" | "email" | "portal" | null;
  followUpDate?: string | null;
  notes?: string;
  boardCreated?: boolean;
  boardShareCode?: string | null;
  boardUrl?: string | null;
  travelersJoined?: number;
  deleted?: boolean;
  updatedAt: string;
  updatedBy: string;
}

const QUALIFICATION_STATUS_LABELS: Record<
  OrganizerQualificationStatus,
  string
> = {
  qualified_page_live: "Qualified — Sailing Page Live",
  held_schedule_conflict: "Held (noindex) — Confirm Schedule First",
  needs_sailing_qualification: "Needs Ship & Sailing Qualification",
};

export const OUTREACH_STATUS_LABELS: Record<OrganizerOutreachStatus, string> = {
  ready_to_call: "Ready to Call (0 Sent)",
  needs_qualification_call: "Call to Qualify First (0 Sent)",
  draft_ready: "Draft Ready (0 Sent)",
  held_pending_schedule_check: "Held — Confirm Schedule First (0 Sent)",
  call_attempted: "Call Attempted",
  called_left_vm: "Voicemail Left",
  called_spoke: "Connected — Spoke Live",
  follow_up_requested: "Follow-Up Requested",
  texted: "Text Sent",
  emailed: "Email / Portal Sent",
  replied: "Replied",
  interested: "Interested — Follow-Up Active",
  board_live: "Board Created",
  first_traveler_joined: "First Traveler Joined",
  bounced_failed: "Bounced / Delivery Failed",
  wrong_contact: "Wrong Contact",
  not_a_fit: "Not Interested / Not a Fit",
  on_hold: "Paused / On Hold",
};

const SEEDED_TIMESTAMP_ISO = "2026-11-14T16:45:00.000Z";

function normalizePhoneDial(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/\D+/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits.length >= 7 ? `+${digits}` : null;
}

function sanitizeUtmSource(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

function buildSailingUtmUrl(shipSlug: string, sailDate: string, utmSource: string): string {
  const src = sanitizeUtmSource(utmSource) || "organizer_outreach";
  return `https://cruisepromenade.com/sailings/${shipSlug}/${sailDate}?utm_source=${encodeURIComponent(src)}&utm_medium=hosted_organizer&utm_campaign=launch_2026_11`;
}

function buildGroupsSetupUrl(utmSource: string): string {
  const src = sanitizeUtmSource(utmSource) || "organizer_outreach";
  return `https://cruisepromenade.com/groups?utm_source=${encodeURIComponent(src)}&utm_medium=hosted_organizer&utm_campaign=launch_2026_11`;
}

function buildFollowUpEmailBody(params: {
  greeting: string;
  introLine: string;
  sailingUrl: string | null;
  utmSource: string;
  scheduleNote: string;
}): string {
  if (!params.sailingUrl) {
    return `${params.greeting}\n\n${params.introLine}\n\n${HOSTED_ORGANIZER_CORE_PITCH}\n\n${params.scheduleNote}\n\nBest,\nErich\nCruise Promenade`;
  }
  return `${params.greeting}\n\n${params.introLine}\n\n${HOSTED_ORGANIZER_CORE_PITCH}\n\n- Exact sailing page: ${params.sailingUrl}\n- Start a private group board: ${buildGroupsSetupUrl(params.utmSource)}\n\n${params.scheduleNote}\n\nBest,\nErich\nCruise Promenade`;
}

function sanitizeQualifiedSailingUrl(
  rawUrl: string | null | undefined,
  qualificationStatus: OrganizerQualificationStatus,
): string | null {
  if (qualificationStatus !== "qualified_page_live") {
    return null;
  }
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "cruisepromenade.com" ||
      !parsed.pathname.startsWith("/sailings/")
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeShareCodeAndBoardUrl(input: {
  boardShareCode?: string | null;
  boardUrl?: string | null;
}): { boardShareCode: string | null; boardUrl: string | null } {
  let code = (input.boardShareCode || "").trim();
  let url = (input.boardUrl || "").trim();

  if (url && !code) {
    const match = url.match(/\/p\/([A-Za-z0-9_-]{6,64})/);
    if (match?.[1]) {
      code = match[1];
    }
  }
  const cleanCode = code
    ? code.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64)
    : null;

  if (cleanCode && !url) {
    url = `https://cruisepromenade.com/p/${cleanCode}`;
  } else if (url) {
    try {
      const parsed = new URL(url);
      if (
        parsed.protocol === "https:" &&
        parsed.hostname === "cruisepromenade.com"
      ) {
        url = parsed.toString();
      } else {
        url = cleanCode ? `https://cruisepromenade.com/p/${cleanCode}` : "";
      }
    } catch {
      url = cleanCode ? `https://cruisepromenade.com/p/${cleanCode}` : "";
    }
  }

  return {
    boardShareCode: cleanCode || null,
    boardUrl: url || null,
  };
}

interface SeedLeadDefinition {
  leadId: string;
  priorityRank: number;
  leadName: string;
  contactName: string | null;
  organizerRole: string | null;
  phone: string | null;
  phoneInvitesText: boolean;
  email: string | null;
  altEmails: string[];
  contactPageUrl: string | null;
  officialUrl: string | null;
  eventPageUrl: string | null;
  contactTimezone: string;
  bestCallingWindow: string;
  cohortDescription: string;
  cruiseLine: string;
  hostedCruiseAndSailing: string;
  shipName: string;
  shipSlug: string | null;
  sailDate: string | null;
  returnDate: string | null;
  portWindowsSummary: string;
  qualificationStatus: OrganizerQualificationStatus;
  qualificationDetail: string;
  utmSource: string;
  sailingPageUrl: string | null;
  valueToPitchSummary: string;
  phoneOpeningScript: string;
  voicemailScript: string;
  phoneOrTextScript: string;
  likelyObjection: string;
  objectionResponse: string;
  emailSubject: string;
  emailBody: string;
  recommendedNextAction: string;
  outreachStatus: OrganizerOutreachStatus;
  lastContactedAt?: string | null;
  lastContactChannel?: "call" | "text" | "email" | "portal" | null;
  notes: string;
}

export const SEEDED_ORGANIZER_LEAD_DEFINITIONS: readonly SeedLeadDefinition[] = [
  // ============================================================================
  // TOP 10 "CALL NOW" QUEUE (Phone-Verified + Sailing Page Live)
  // ============================================================================
  {
    leadId: "bond_and_beyond",
    priorityRank: 1,
    leadName: "Bond & Beyond Networking Cruise",
    contactName: "Bond & Beyond Organizing Team",
    organizerRole: "Inaugural Networking Cruise Organizer",
    phone: "(904) 295-1212",
    phoneInvitesText: true,
    email: "bondandbeyondnetwork@gmail.com",
    altEmails: [],
    contactPageUrl: "https://bondandbeyondnetwork.com/connect/",
    officialUrl: "https://bondandbeyondnetwork.com/connect/",
    eventPageUrl: "https://bondandbeyondnetwork.com/events/",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "9:30 AM – 12:00 PM ET or 1:30 PM – 4:30 PM ET (7:30–10:00 AM / 11:30 AM–2:30 PM MT)",
    cohortDescription:
      "Northeast Florida entrepreneurs & small-business owners (final payment Dec 17, 2026)",
    cruiseLine: "Norwegian Cruise Line",
    hostedCruiseAndSailing:
      "Norwegian Escape · Apr 16–19, 2027 (3N RT Port Canaveral)",
    shipName: "Norwegian Escape",
    shipSlug: "norwegian-escape",
    sailDate: "2027-04-16",
    returnDate: "2027-04-19",
    portWindowsSummary:
      "Fri Apr 16 Dep Port Canaveral 16:00 · Sat Apr 17 Nassau 10:00–18:00 · Sun Apr 18 Great Stirrup Cay 07:00–17:00 · Mon Apr 19 Port Canaveral 07:00",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against NCL 3-Day Bahamas schedule & bondandbeyondnetwork.com/events/. Live Cruise Promenade page tested.",
    utmSource: "bond_and_beyond",
    sailingPageUrl: buildSailingUtmUrl("norwegian-escape", "2027-04-16", "bond_and_beyond"),
    valueToPitchSummary:
      "Inaugural entrepreneur networking cruise heading into Dec 17 final payment; gives members one shared link to see who is going ashore together in Nassau and Great Stirrup Cay without login walls or cabin numbers.",
    phoneOpeningScript:
      "Hi — this is Erich with Cruise Promenade calling about your April 16 Bond & Beyond Networking Cruise on Norwegian Escape. We built a free shared page for that exact sailing so your entrepreneurs can meet before boarding, see which Nassau or Great Stirrup Cay outings everyone is joining, and save an offline schedule without touching your cabin sales or onboard events. Could you open the link for 30 seconds while we're on the phone and see if you'd be comfortable sharing it with your group?",
    voicemailScript:
      "Hi Bond & Beyond team, this is Erich at Cruise Promenade. Calling about your April 16 Norwegian Escape networking cruise—we put together a free shared page for that exact sailing so attendees can coordinate Nassau and Great Stirrup Cay outings and keep an offline schedule, with zero interference with your bookings or events. I can text you the link only if you'd like to inspect it—my number is on caller ID. Thanks!",
    phoneOrTextScript: `Hi Bond & Beyond team — calling about your April 16–19 Norwegian Escape networking cruise out of Port Canaveral. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("norwegian-escape", "2027-04-16", "bond_and_beyond")}`,
    likelyObjection:
      "We already have a travel agent handling cabin bookings and our own networking sessions.",
    objectionResponse:
      "That stays 100% yours—Cruise Promenade never sells cabins, collects cabin numbers, or alters your networking sessions. You can drop your own onboard meetups onto the board and let members coordinate open port hours in Nassau and Great Stirrup Cay.",
    emailSubject:
      "Free shared cruise page for the Apr 16 Bond & Beyond Cruise (Norwegian Escape)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Bond & Beyond Team,",
      introLine:
        "Following up regarding the Inaugural Bond & Beyond Networking Cruise aboard Norwegian Escape out of Port Canaveral on April 16–19, 2027.",
      sailingUrl: buildSailingUtmUrl("norwegian-escape", "2027-04-16", "bond_and_beyond"),
      utmSource: "bond_and_beyond",
      scheduleNote:
        "It maps the published Port Canaveral departure (16:00), Saturday in Nassau (10:00–18:00), and Sunday at Great Stirrup Cay (07:00–17:00), requires no app download or cabin numbers, and lets you start a private board in one click if you like how it looks.",
    }),
    recommendedNextAction:
      "Call (904) 295-1212 first (single highest-probability call). Walk through /sailings/norwegian-escape/2027-04-16 live on the phone and invite them to click 'Start a private group board'.",
    outreachStatus: "ready_to_call",
    notes:
      "Rank #1 highest-probability first call. Official contact page invites calls & texts at (904) 295-1212; final payment Dec 17, 2026. 0 outreach messages sent.",
  },
  {
    leadId: "hr_conference_cruise",
    priorityRank: 2,
    leadName: "2027 HR Conference Cruise® (SHRM State Councils)",
    contactName: "Mike Medoro",
    organizerRole: "Owner & President, Aspect Marketing & Communications",
    phone: "(440) 899-2242",
    phoneInvitesText: false,
    email: "mgmedoro@aspect-marketing.com",
    altEmails: [],
    contactPageUrl: "https://aspect-marketing.com/contact.htm",
    officialUrl: "https://hrcruise.com/2027/cruise2/schedule.cfm",
    eventPageUrl: "https://hrcruise.com/2027/cruise2/schedule.cfm",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "9:30 AM – 11:45 AM ET or 1:30 PM – 4:30 PM ET (7:30–9:45 AM / 11:30 AM–2:30 PM MT)",
    cohortDescription:
      "HR executives & SHRM/HRCI attendees (AL, IN, MI & WI SHRM State Councils; Aspect runs 3 HR cruises in 2027)",
    cruiseLine: "Royal Caribbean International",
    hostedCruiseAndSailing:
      "Oasis of the Seas · Apr 23–28, 2027 (5N RT Fort Lauderdale)",
    shipName: "Oasis of the Seas",
    shipSlug: "oasis-of-the-seas",
    sailDate: "2027-04-23",
    returnDate: "2027-04-28",
    portWindowsSummary:
      "Fri Apr 23 Dep Fort Lauderdale 16:00 · Sat Apr 24 Sea (SHRM sessions) · Sun Apr 25 Cozumel 07:00–17:00 (open port day) · Mon Apr 26 Sea (SHRM sessions) · Tue Apr 27 CocoCay 07:00–17:00 (open port day)",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Royal Caribbean Oasis of the Seas 5N schedule & hrcruise.com/2027/cruise2/schedule.cfm (also runs Mar 13 Harmony & May 14 Voyager).",
    utmSource: "hr_conference_cruise",
    sailingPageUrl: buildSailingUtmUrl("oasis-of-the-seas", "2027-04-23", "hr_conference_cruise"),
    valueToPitchSummary:
      "SHRM recertification sessions fill both sea days while Sunday in Cozumel and Tuesday at CocoCay are completely unprogrammed—attendees travelling solo or in small HR teams need an easy way to join the same excursion departure.",
    phoneOpeningScript:
      "Hi Mike — this is Erich with Cruise Promenade calling about your April 23 HR Conference Cruise on Oasis of the Seas. Since your SHRM sessions run on the sea days and Cozumel and CocoCay are open port days, we built a free shared page for that exact sailing so HR attendees can see which excursions others are joining and keep an offline schedule without touching your cabin desk or sessions. Could you open the page while we're on the phone to see if it's worth sharing?",
    voicemailScript:
      "Hi Mike, Erich with Cruise Promenade calling at (440) 899-2242 about your April 23 HR Conference Cruise on Oasis of the Seas. We built a free shared cruise page for that exact sailing so attendees can coordinate Cozumel and CocoCay excursions around your sea-day SHRM sessions, with zero interference with your travel desk. Happy to email mgmedoro@aspect-marketing.com the link if you'd like a look.",
    phoneOrTextScript: `Hi Mike — calling about the April 23–28, 2027 HR Conference Cruise on Oasis of the Seas. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("oasis-of-the-seas", "2027-04-23", "hr_conference_cruise")}`,
    likelyObjection:
      "Attendees must book through our official cruise desk to attend conference sessions.",
    objectionResponse:
      "We reinforce that—Cruise Promenade does not book cabins or conference badges at all. It is strictly a post-registration coordination board for your open port days in Cozumel and CocoCay plus your welcome reception times.",
    emailSubject:
      "Free Cozumel & CocoCay attendee board for the Apr 23 HR Conference Cruise (Oasis of the Seas)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Mike,",
      introLine:
        "Following up on the April 23–28, 2027 HR Conference Cruise aboard Oasis of the Seas out of Fort Lauderdale.",
      sailingUrl: buildSailingUtmUrl("oasis-of-the-seas", "2027-04-23", "hr_conference_cruise"),
      utmSource: "hr_conference_cruise",
      scheduleNote:
        "It keeps Saturday and Monday clear for your sea-day SHRM sessions while letting attendees coordinate Sunday in Cozumel (07:00–17:00) and Tuesday at Perfect Day at CocoCay (07:00–17:00). Note: we also verified your March 13 Harmony of the Seas and May 14 Voyager of the Seas sailings if useful.",
    }),
    recommendedNextAction:
      "Call Mike Medoro at (440) 899-2242 during Ohio morning/early-afternoon hours and walk through the Apr 23 Oasis of the Seas page live.",
    outreachStatus: "ready_to_call",
    notes:
      "Aspect Marketing produces 3 SHRM HR Conference Cruises in 2027 (Mar 13 Harmony, Apr 23 Oasis, May 14 Voyager)—one organizer win can unlock 3 cohorts. 0 outreach messages sent.",
  },
  {
    leadId: "national_reia_cruise",
    priorityRank: 3,
    leadName: "National REIA 2027 Winter Cruise Conference",
    contactName: "Lori Hudson",
    organizerRole: "Winter Cruise Conference Coordinator, National REIA",
    phone: "(513) 827-9563",
    phoneInvitesText: false,
    email: "Lori@nationalreia.org",
    altEmails: [],
    contactPageUrl: "https://nationalreiacruise.com/faq/",
    officialUrl: "https://nationalreiacruise.com/schedule/",
    eventPageUrl: "https://nationalreiacruise.com/schedule/",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "9:30 AM – 12:00 PM ET or 1:30 PM – 4:15 PM ET (7:30–10:00 AM / 11:30 AM–2:15 PM MT)",
    cohortDescription:
      "Real estate investors, chapter leaders & guests across National REIA chapters nationwide",
    cruiseLine: "Royal Caribbean International",
    hostedCruiseAndSailing:
      "Icon of the Seas · Feb 20–27, 2027 (7N RT Miami)",
    shipName: "Icon of the Seas",
    shipSlug: "icon-of-the-seas",
    sailDate: "2027-02-20",
    returnDate: "2027-02-27",
    portWindowsSummary:
      "Sat Feb 20 Dep Miami 16:30 · Sun Sea (9AM–4PM sessions) · Mon Costa Maya 08:00–17:00 · Tue Roatan 07:00–16:00 · Wed Cozumel 08:00–18:00 · Thu Sea (9AM–4PM sessions) · Fri CocoCay 07:00–17:00",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Royal Caribbean Icon of the Seas 7N Western Caribbean schedule & nationalreiacruise.com/schedule/.",
    utmSource: "national_reia_cruise",
    sailingPageUrl: buildSailingUtmUrl("icon-of-the-seas", "2027-02-20", "national_reia_cruise"),
    valueToPitchSummary:
      "National REIA's FAQ explicitly states shore excursions are excluded from registration while Mon/Tue/Wed/Fri daytime ports are open—ideal for investors from different state chapters wanting to book the same excursion departure together.",
    phoneOpeningScript:
      "Hi Lori — this is Erich with Cruise Promenade calling about National REIA's February 20 Winter Cruise Conference on Icon of the Seas. Since your seminars run on Sunday and Thursday at sea and investors book their own excursions in Costa Maya, Roatan, Cozumel, and CocoCay, we built a free shared page for that exact sailing so attendees can join the same departures and save an offline schedule. Could you open the page while we're on the phone and see if you'd share it with registered guests?",
    voicemailScript:
      "Hi Lori, Erich with Cruise Promenade calling about the February 20 National REIA Cruise on Icon of the Seas. We built a free shared page for that exact sailing so your attendees can see who is joining which excursions in Costa Maya, Roatan, Cozumel, and CocoCay without interfering with your group cabin block or seminars. Let me know if I can send the link to Lori@nationalreia.org.",
    phoneOrTextScript: `Hi Lori — calling about the Feb 20–27, 2027 National REIA Winter Cruise Conference on Icon of the Seas. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("icon-of-the-seas", "2027-02-20", "national_reia_cruise")}`,
    likelyObjection:
      "Does this require sharing attendee email lists or cabin numbers with a third party?",
    objectionResponse:
      "Never—you keep your attendee list private. You simply share one private board link with registered cruisers, and anyone who joins only types a first name or display name—no cabin numbers or emails required.",
    emailSubject:
      "Free port-day coordination page for National REIA's Feb 20 Icon of the Seas Cruise",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Lori,",
      introLine:
        "Following up regarding the National REIA 2027 Winter Cruise Conference aboard Icon of the Seas out of Miami (February 20–27, 2027).",
      sailingUrl: buildSailingUtmUrl("icon-of-the-seas", "2027-02-20", "national_reia_cruise"),
      utmSource: "national_reia_cruise",
      scheduleNote:
        "It reflects your open port windows in Costa Maya (Mon), Roatan (Tue), Cozumel (Wed), and CocoCay (Fri) alongside your Sunday/Thursday sea days, with zero attendee email or cabin data required.",
    }),
    recommendedNextAction:
      "Call Lori Hudson at (513) 827-9563 and walk through /sailings/icon-of-the-seas/2027-02-20 live while on the call.",
    outreachStatus: "ready_to_call",
    notes:
      "Direct named conference coordinator phone & email on nationalreiacruise.com/faq/. 4 open Caribbean port days. 0 outreach messages sent.",
  },
  {
    leadId: "sea_day_cle_alaska",
    priorityRank: 4,
    leadName: "2027 Sea Day CLE Alaska Cruise (Kirton McConkie)",
    contactName: "Christopher S. Hill",
    organizerRole: "CLE Coordinator, Kirton McConkie Law Firm",
    phone: "(801) 323-5945",
    phoneInvitesText: false,
    email: "chill@kmclaw.com",
    altEmails: ["sheila@adventuresintraveland.com"],
    contactPageUrl: "https://clecruise.com/contact",
    officialUrl: "https://clecruise.com/cruises/summer-2027",
    eventPageUrl: "https://clecruise.com/cruises/summer-2027",
    contactTimezone: "America/Denver (MT)",
    bestCallingWindow: "9:30 AM – 11:45 AM MT or 1:30 PM – 4:30 PM MT (same timezone as Denver)",
    cohortDescription:
      "Attorneys & spouses/families earning 10 hours of sea-day CLE on a 7N Alaska southbound voyage",
    cruiseLine: "Celebrity Cruises",
    hostedCruiseAndSailing:
      "Celebrity Solstice · Jul 23–30, 2027 (7N Seward to Vancouver)",
    shipName: "Celebrity Solstice",
    shipSlug: "celebrity-solstice",
    sailDate: "2027-07-23",
    returnDate: "2027-07-30",
    portWindowsSummary:
      "Fri Jul 23 Dep Seward 20:00 · Sat Hubbard Glacier (CLE) · Sun Jul 25 Juneau 09:00–21:00 · Mon Skagway 07:00–20:00 · Tue Icy Strait Point 06:30–15:00 · Wed Ketchikan 09:00–18:00 · Thu Inside Passage (CLE)",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Celebrity Solstice 7N Southbound Alaska schedule & clecruise.com/cruises/summer-2027.",
    utmSource: "sea_day_cle_alaska",
    sailingPageUrl: buildSailingUtmUrl("celebrity-solstice", "2027-07-23", "sea_day_cle_alaska"),
    valueToPitchSummary:
      "CLE classes are strictly on Hubbard Glacier and Inside Passage cruising days, leaving 12-hour Juneau and 13-hour Skagway calls completely open—attorneys and families can join the exact same Juneau whale-watch or helicopter departure (including direct Rezgo Juneau options).",
    phoneOpeningScript:
      "Hi Christopher — this is Erich with Cruise Promenade calling about your July 23 Sea Day CLE Alaska Cruise on Celebrity Solstice. Because your 10 CLE hours run on the glacier and Inside Passage days, your attorneys and spouses have huge open days in Juneau, Skagway, Icy Strait Point, and Ketchikan—we built a free shared page for that exact sailing so guests can book the exact same excursion departures and save an offline schedule. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Christopher, Erich with Cruise Promenade calling about the July 23 Sea Day CLE Alaska Cruise on Celebrity Solstice. We built a free shared cruise page for that exact sailing so attorneys and families can coordinate Juneau, Skagway, Icy Strait, and Ketchikan excursions around your sea-day CLE schedule without touching Sheila's cabin bookings. Happy to email chill@kmclaw.com the link if you'd like to review it.",
    phoneOrTextScript: `Hi Christopher — calling about the July 23–30, 2027 Sea Day CLE Alaska Cruise on Celebrity Solstice. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("celebrity-solstice", "2027-07-23", "sea_day_cle_alaska")}`,
    likelyObjection:
      "Sheila Lambie at Adventures in Travel handles all our group cruise arrangements.",
    objectionResponse:
      "It never touches Sheila's cabin bookings or commission—you can even include Sheila on the board. It simply gives attorneys and spouses a shared schedule for Juneau, Skagway, Icy Strait Point, and Ketchikan alongside your CLE sessions.",
    emailSubject:
      "Free Alaska port-day board for the Jul 23 Sea Day CLE Cruise (Celebrity Solstice)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Christopher,",
      introLine:
        "Following up regarding the July 23–30, 2027 Sea Day CLE Alaska Cruise aboard Celebrity Solstice from Seward to Vancouver.",
      sailingUrl: buildSailingUtmUrl("celebrity-solstice", "2027-07-23", "sea_day_cle_alaska"),
      utmSource: "sea_day_cle_alaska",
      scheduleNote:
        "It keeps Hubbard Glacier and Inside Passage cruising days clear for your 10 hours of CLE while mapping the exact port windows in Juneau (09:00–21:00), Skagway (07:00–20:00), Icy Strait Point (06:30–15:00), and Ketchikan (09:00–18:00), with zero interference with Adventures in Travel's cabin bookings.",
    }),
    recommendedNextAction:
      "Call Christopher S. Hill at (801) 323-5945 (Salt Lake City — Mountain Time) and review the July 23 Celebrity Solstice Alaska page live.",
    outreachStatus: "ready_to_call",
    notes:
      "Mountain Time prospect with direct Juneau/Alaska excursion fit! Alt travel advisor contact: Sheila Lambie (651) 216-6206. 0 outreach messages sent.",
  },
  {
    leadId: "debusk_world_america",
    priorityRank: 5,
    leadName: "DeBusk Travels — World America Friends & Family Cruise",
    contactName: "Terry & Denise DeBusk",
    organizerRole: "Franchise Owners & Group Hosts, DeBusk Travels (Cruise Planners)",
    phone: "(407) 378-4067",
    phoneInvitesText: false,
    email: "terry.debusk@cruiseplanners.com",
    altEmails: ["denise.debusk@cruiseplanners.com"],
    contactPageUrl: "https://www.debusktravels.com/ContactUs",
    officialUrl: "https://www.debusktravels.com/GroupRegistrations/view/142382",
    eventPageUrl: "https://www.debusktravels.com/GroupRegistrations/view/142382",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "10:00 AM – 12:30 PM ET or 2:00 PM – 5:00 PM ET (8:00–10:30 AM / 12:00–3:00 PM MT)",
    cohortDescription:
      "Hosted friends, family & repeat agency clients (16+ cabins reserved out of Miami)",
    cruiseLine: "MSC Cruises",
    hostedCruiseAndSailing:
      "MSC World America · Jul 10–17, 2027 (7N RT Miami)",
    shipName: "MSC World America",
    shipSlug: "msc-world-america",
    sailDate: "2027-07-10",
    returnDate: "2027-07-17",
    portWindowsSummary:
      "Sat Jul 10 Dep Miami 17:00 · Sun Sea · Mon Puerto Plata 09:00–17:00 · Tue San Juan 09:00–23:00 · Wed–Thu Sea · Fri Ocean Cay 07:00–18:00",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against MSC World America 7N Eastern Caribbean schedule & debusktravels.com/GroupRegistrations/view/142382.",
    utmSource: "debusk_world_america",
    sailingPageUrl: buildSailingUtmUrl("msc-world-america", "2027-07-10", "debusk_world_america"),
    valueToPitchSummary:
      "Their registration page literally pitches 'A Week Together Without Having to Do Everything Together' and mentions using WhatsApp for spontaneous 'Who wants to come?' excursions—Cruise Promenade gives them a clean visual schedule + offline Cruise Pack instead of buried chat threads.",
    phoneOpeningScript:
      "Hi Terry or Denise — this is Erich with Cruise Promenade calling about your July 10 MSC World America Friends & Family group. I loved how your page describes 'a week together without having to do everything together'—we built a free shared page for that exact sailing so your 16-plus cabins can see which Puerto Plata, San Juan, or Ocean Cay outings others are joining without burying plans in WhatsApp, and it never touches your Cruise Planners bookings. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Terry and Denise, Erich at Cruise Promenade calling about your July 10, 2027 MSC World America Friends & Family group. We built a free shared page for that exact sailing that fits your 'week together without doing everything together' style—guests see who's joining each excursion and save an offline schedule, with zero interference with your Cruise Planners bookings. Happy to email terry.debusk@cruiseplanners.com if you'd like to take a look.",
    phoneOrTextScript: `Hi Terry & Denise — calling about your July 10–17, 2027 MSC World America Friends & Family Cruise. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("msc-world-america", "2027-07-10", "debusk_world_america")}`,
    likelyObjection:
      "Does Cruise Promenade compete with our Cruise Planners excursion or cabin links?",
    objectionResponse:
      "Not at all—as the organizer, you can paste your own preferred Cruise Planners excursion booking links directly onto any activity on the board, and Cruise Promenade never sells cabins.",
    emailSubject:
      "Free shared board for your Jul 10 MSC World America Friends & Family Group",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Terry & Denise,",
      introLine:
        "I loved reading your 'A Week Together Without Having to Do Everything Together' description for the July 10–17, 2027 MSC World America group out of Miami.",
      sailingUrl: buildSailingUtmUrl("msc-world-america", "2027-07-10", "debusk_world_america"),
      utmSource: "debusk_world_america",
      scheduleNote:
        "Instead of guests losing excursion times inside a scrolling group text, they can see Puerto Plata (Mon), San Juan until 11 PM (Tue), and Ocean Cay (Fri) on one board, paste your preferred booking links, and save an offline Cruise Pack before boarding.",
    }),
    recommendedNextAction:
      "Call Terry & Denise DeBusk at (407) 378-4067 and highlight how they can attach their own advisor excursion links on the July 10 MSC World America board.",
    outreachStatus: "ready_to_call",
    notes:
      "Exact philosophical match ('A Week Together Without Having to Do Everything Together'). Hosted Cruise Planners agency group. 0 outreach messages sent.",
  },
  {
    leadId: "pied_piper_alaska",
    priorityRank: 6,
    leadName: "Pied Piper Travel — 2027 Alaska LGBTQ+ Group Cruise",
    contactName: "Robert (ext. 306) & Ernesto (ext. 305)",
    organizerRole: "General Manager & Director of Sales/Marketing, Pied Piper Travel",
    phone: "(718) 261-4596",
    phoneInvitesText: false,
    email: "robert@piedpipercruises.com",
    altEmails: ["ernesto@piedpipercruises.com", "piedpipercruises@gmail.com"],
    contactPageUrl: "https://www.piedpipertravel.com/gaygroupcruises/contact-us.php",
    officialUrl: "https://www.piedpipertravel.com/gaygroupcruises/cruise-info.php?id=820",
    eventPageUrl: "https://www.piedpipertravel.com/gaygroupcruises/cruise-info.php?id=820",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "10:00 AM – 12:30 PM ET or 2:00 PM – 4:30 PM ET (8:00–10:30 AM / 12:00–2:30 PM MT)",
    cohortDescription:
      "Hosted LGBTQ+ & friends group sailing 9 nights to Alaska roundtrip from Seattle",
    cruiseLine: "Virgin Voyages",
    hostedCruiseAndSailing:
      "Brilliant Lady · Aug 24 – Sep 2, 2027 (9N RT Seattle)",
    shipName: "Brilliant Lady",
    shipSlug: "brilliant-lady",
    sailDate: "2027-08-24",
    returnDate: "2027-09-02",
    portWindowsSummary:
      "Tue Aug 24 Dep Seattle 17:00 · Thu Ketchikan 08:00–17:00 · Fri Icy Strait Point 09:00–18:00 · Sat Hubbard Glacier · Sun Sitka 08:00–17:00 · Wed Sep 1 Victoria 09:00–22:00",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Virgin Voyages Brilliant Lady 9N Alaska schedule & piedpipertravel.com/gaygroupcruises/cruise-info.php?id=820.",
    utmSource: "pied_piper_alaska",
    sailingPageUrl: buildSailingUtmUrl("brilliant-lady", "2027-08-24", "pied_piper_alaska"),
    valueToPitchSummary:
      "Virgin Voyages has no traditional assigned main-dining-room group tables, and Pied Piper's FAQ still mentions legacy online groups for pre-cruise chat—a private Cruise Promenade board makes pre-cruise meetups, restaurant clusters, and Alaska shore excursions effortless.",
    phoneOpeningScript:
      "Hi Robert or Ernesto — this is Erich with Cruise Promenade calling about Pied Piper's August 24, 2027 Alaska group cruise on Virgin's Brilliant Lady. Since Virgin doesn't use fixed group dining tables, we built a free shared page for that exact 9-night Seattle sailing so your travelers can meet before boarding, coordinate dining and excursions in Ketchikan, Icy Strait, Sitka, and Victoria, and save an offline pack without touching your cabin bookings. Could you open the page while we're on the phone?",
    voicemailScript:
      "Hi Robert, Erich with Cruise Promenade calling at ext. 306 about Pied Piper's August 24, 2027 Brilliant Lady Alaska group cruise. We built a free private-link cruise page for that exact sailing so your guests can meet beforehand and coordinate Alaska excursions and Virgin dining times without interfering with your agency bookings. Happy to send the link to robert@piedpipercruises.com if you'd like to inspect it.",
    phoneOrTextScript: `Hi Robert & Ernesto — calling about Pied Piper's Aug 24 – Sep 2, 2027 Brilliant Lady Alaska Group Cruise. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("brilliant-lady", "2027-08-24", "pied_piper_alaska")}`,
    likelyObjection:
      "Guest privacy is very important for our hosted LGBTQ+ groups.",
    objectionResponse:
      "100% agreed—private group boards are marked noindex so they never appear in search engines, require no account or real full name, never ask for cabin numbers, and can be unpublished or deleted by the host anytime.",
    emailSubject:
      "Free private group board for Pied Piper's Aug 24, 2027 Brilliant Lady Alaska Cruise",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Robert & Ernesto,",
      introLine:
        "Following up regarding Pied Piper Travel's hosted August 24 – September 2, 2027 Alaska group cruise aboard Virgin Voyages' Brilliant Lady out of Seattle.",
      sailingUrl: buildSailingUtmUrl("brilliant-lady", "2027-08-24", "pied_piper_alaska"),
      utmSource: "pied_piper_alaska",
      scheduleNote:
        "Every group board is private (noindex), requires no login or cabin numbers, and helps guests coordinate Ketchikan, Icy Strait Point, Sitka, Victoria, and Virgin dining meetups alongside your onboard host.",
    }),
    recommendedNextAction:
      "Call (718) 261-4596 (ext. 306 Robert or ext. 305 Ernesto; toll-free 800-874-7312) and walk through the Aug 24 Brilliant Lady page.",
    outreachStatus: "ready_to_call",
    notes:
      "Long-running hosted LGBTQ+ group agency (runs dozens of hosted sailings per year). Direct extensions published on contact page. 0 outreach messages sent.",
  },
  {
    leadId: "financial_connextion",
    priorityRank: 7,
    leadName: "13th Annual Financial ConNEXTion Educational Cruise",
    contactName: "Terri Getman, JD, CLU, ChFC, RICP, AEP",
    organizerRole: "Conference Organizer, Financial ConNEXTion Cruise",
    phone: "(952) 232-8095",
    phoneInvitesText: false,
    email: "tgclu@comcast.net",
    altEmails: [],
    contactPageUrl: "https://www.financialconnextioncruise.com/contact",
    officialUrl: "https://www.financialconnextioncruise.com/educational-sessions",
    eventPageUrl: "https://www.financialconnextioncruise.com/educational-sessions",
    contactTimezone: "America/Chicago (CT)",
    bestCallingWindow: "9:30 AM – 12:00 PM CT or 1:30 PM – 4:30 PM CT (8:30–11:00 AM / 12:30–3:30 PM MT)",
    cohortDescription:
      "Financial planners, NAIFA competition university students, faculty & spouses",
    cruiseLine: "Royal Caribbean International",
    hostedCruiseAndSailing:
      "Mariner of the Seas · Feb 13–20, 2027 (7N RT New Orleans)",
    shipName: "Mariner of the Seas",
    shipSlug: "mariner-of-the-seas",
    sailDate: "2027-02-13",
    returnDate: "2027-02-20",
    portWindowsSummary:
      "Sat Feb 13 Dep New Orleans 16:00 · Sun Sea (sessions) · Mon Cozumel 08:00–17:00 · Tue Grand Cayman 10:30–18:00 · Wed Montego Bay 09:00–17:00 · Thu–Fri Sea (sessions & NAIFA competition)",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Royal Caribbean Mariner of the Seas 7N Western Caribbean schedule & financialconnextioncruise.com.",
    utmSource: "financial_connextion",
    sailingPageUrl: buildSailingUtmUrl("mariner-of-the-seas", "2027-02-13", "financial_connextion"),
    valueToPitchSummary:
      "Their site explicitly promotes informal student-practitioner mentoring during port excursions in Cozumel, Grand Cayman, and Montego Bay while keeping all formal education on the 3 sea days—a shared board lets mentors and students actually join the same departures.",
    phoneOpeningScript:
      "Hi Terri — this is Erich with Cruise Promenade calling about the February 13 Financial ConNEXTion Cruise on Mariner of the Seas. I saw how your program pairs sea-day NAIFA sessions with informal mentoring on port days in Cozumel, Grand Cayman, and Montego Bay—we built a free shared page for that exact sailing so practitioners, faculty, and students can see which excursions others are joining and keep an offline schedule. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Terri, Erich with Cruise Promenade calling about the February 13 Financial ConNEXTion Cruise on Mariner of the Seas out of New Orleans. We built a free shared cruise page for that exact sailing so practitioners and NAIFA students can coordinate excursions in Cozumel, Grand Cayman, and Montego Bay around your sea-day sessions. Happy to send the link to tgclu@comcast.net if you'd like to review it.",
    phoneOrTextScript: `Hi Terri — calling about the Feb 13–20, 2027 Financial ConNEXTion Educational Cruise on Mariner of the Seas. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("mariner-of-the-seas", "2027-02-13", "financial_connextion")}`,
    likelyObjection:
      "We have both seasoned advisors and university students—we don't want anything complicated to download or set up.",
    objectionResponse:
      "There is zero app to download and zero account creation—one web link opens the exact Mariner of the Seas schedule, and before leaving New Orleans everyone can save a printable PDF or offline Cruise Pack.",
    emailSubject:
      "Free mentor/student port board for the Feb 13 Financial ConNEXTion Cruise (Mariner of the Seas)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Terri,",
      introLine:
        "Following up regarding the 13th Annual Financial ConNEXTion Educational Cruise aboard Mariner of the Seas out of New Orleans (February 13–20, 2027).",
      sailingUrl: buildSailingUtmUrl("mariner-of-the-seas", "2027-02-13", "financial_connextion"),
      utmSource: "financial_connextion",
      scheduleNote:
        "It keeps Sunday, Thursday, and Friday clear for your sea-day sessions and NAIFA student competition while helping practitioners, faculty, and students coordinate open port days in Cozumel (Mon), Grand Cayman (Tue, tender), and Montego Bay (Wed).",
    }),
    recommendedNextAction:
      "Call Terri Getman at (952) 232-8095 during Central Time business hours and walk through the Feb 13 Mariner of the Seas page.",
    outreachStatus: "ready_to_call",
    notes:
      "Direct named founder/organizer phone & email published on financialconnextioncruise.com/contact. 0 outreach messages sent.",
  },
  {
    leadId: "dance_fun_alaska",
    priorityRank: 8,
    leadName: "Dance Fun Cruises — WCS & Country Alaska Cruise 2027",
    contactName: "Brian Barakauskas",
    organizerRole: "Owner & Lead Dance Host, Dance Fun",
    phone: "(502) 738-1033",
    phoneInvitesText: false,
    email: "Brian@DanceFun.com",
    altEmails: ["Jenc@practicallyperfectvacations.com"],
    contactPageUrl: "https://dancefun.com/contact-us-2/",
    officialUrl: "https://dancefun.com/west-coast-swing-dance-cruise-alaska-2020/",
    eventPageUrl: "https://dancefun.com/west-coast-swing-dance-cruise-alaska-2020/",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "11:15 AM – 5:30 PM ET (9:15 AM – 3:30 PM MT; published office hours 11 AM–6 PM ET)",
    cohortDescription:
      "West Coast Swing & Country social dancers on a 10-night roundtrip San Francisco Alaska cruise",
    cruiseLine: "Princess Cruises",
    hostedCruiseAndSailing:
      "Ruby Princess · May 21–31, 2027 (10N RT San Francisco)",
    shipName: "Ruby Princess",
    shipSlug: "ruby-princess",
    sailDate: "2027-05-21",
    returnDate: "2027-05-31",
    portWindowsSummary:
      "Fri May 21 Dep San Francisco 15:00 · Sat–Sun Sea (dance workshops) · Mon Tracy Arm · Tue Skagway 07:00–20:00 · Wed Juneau 07:00–16:15 · Thu Ketchikan 11:00–19:00 · Fri Prince Rupert · Sat–Sun Sea",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Princess Cruises Ruby Princess 10N Inside Passage from San Francisco schedule & dancefun.com.",
    utmSource: "dance_fun_alaska",
    sailingPageUrl: buildSailingUtmUrl("ruby-princess", "2027-05-21", "dance_fun_alaska"),
    valueToPitchSummary:
      "Four full sea days hold the West Coast Swing & Country workshops while Skagway, Juneau, Ketchikan, and Prince Rupert are open—dancers love going ashore in groups, and an offline Cruise Pack prevents missed workshop times over weak ship Wi-Fi.",
    phoneOpeningScript:
      "Hi Brian — this is Erich with Cruise Promenade calling about your May 21 West Coast Swing & Country Alaska Cruise on Ruby Princess out of San Francisco. We built a free shared page for that exact 10-night sailing so your dancers can see which Skagway, Juneau, and Ketchikan excursions everyone is joining and keep your sea-day dance workshop times offline without touching Jen's cabin bookings. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Brian, Erich at Cruise Promenade calling about your May 21, 2027 Ruby Princess Alaska Dance Cruise. We built a free shared page for that exact 10-night sailing so dancers can coordinate Alaska shore excursions alongside your sea-day dance workshops and save an offline schedule, with zero interference with Practically Perfect Vacations. Happy to email Brian@DanceFun.com the link!",
    phoneOrTextScript: `Hi Brian — calling about your May 21–31, 2027 WCS & Country Alaska Cruise on Ruby Princess. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("ruby-princess", "2027-05-21", "dance_fun_alaska")}`,
    likelyObjection:
      "All dancers have to book cabins through Jen at Practically Perfect Vacations to get dance wristbands.",
    objectionResponse:
      "That rule stays completely intact—you only share the private board link with wristbanded dancers after they register through Jen, and Cruise Promenade never sells cruise cabins.",
    emailSubject:
      "Free dancer schedule & Alaska excursion board for May 21 Ruby Princess",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Brian,",
      introLine:
        "Following up regarding Dance Fun's May 21–31, 2027 West Coast Swing & Country Alaska Cruise aboard Ruby Princess roundtrip from San Francisco.",
      sailingUrl: buildSailingUtmUrl("ruby-princess", "2027-05-21", "dance_fun_alaska"),
      utmSource: "dance_fun_alaska",
      scheduleNote:
        "You can post your sea-day workshop blocks and evening social dances right alongside open port windows in Skagway, Juneau, Ketchikan, and Prince Rupert so dancers have one offline Cruise Pack onboard—with zero interference with Jen's cabin bookings.",
    }),
    recommendedNextAction:
      "Call Brian Barakauskas at (502) 738-1033 after 11:15 AM ET (published office window 11 AM–6 PM ET).",
    outreachStatus: "ready_to_call",
    notes:
      "Note: dancefun.com keeps legacy URL slug `-alaska-2020/` for its updated May 21–31, 2027 Ruby Princess sailing. Direct owner phone & hours published. 0 outreach messages sent.",
  },
  {
    leadId: "wine_masters_tipsy_canyon",
    priorityRank: 9,
    leadName: "Wine Masters Cruises — Tipsy Canyon Winery Cruise",
    contactName: "Brett Brown (Host Mark Garvin)",
    organizerRole: "Group Coordinator, Wine Masters Cruises / Expedia Cruises",
    phone: "(720) 320-2393",
    phoneInvitesText: false,
    email: "bbrown@expediacruises.com",
    altEmails: ["doar@expediacruises.com"],
    contactPageUrl: "https://www.winemasterscruises.com/contact",
    officialUrl: "https://www.winemasterscruises.com/2027-01-tipsy-ascent",
    eventPageUrl: "https://www.winemasterscruises.com/2027-01-tipsy-ascent",
    contactTimezone: "America/Los_Angeles (PT)",
    bestCallingWindow: "9:30 AM – 12:00 PM PT or 1:30 PM – 4:30 PM PT (10:30 AM–1:00 PM / 2:30–5:30 PM MT)",
    cohortDescription:
      "Tipsy Canyon Winery wine-club members & couples hosted by Winemaker Mark Garvin",
    cruiseLine: "Celebrity Cruises",
    hostedCruiseAndSailing:
      "Celebrity Ascent · Jan 25 – Feb 5, 2027 (11N RT Fort Lauderdale)",
    shipName: "Celebrity Ascent",
    shipSlug: "celebrity-ascent",
    sailDate: "2027-01-25",
    returnDate: "2027-02-05",
    portWindowsSummary:
      "Mon Jan 25 Dep Fort Lauderdale 16:00 · Tue–Wed Sea (wine events) · Thu St. Maarten · Fri Antigua · Sat St. Lucia · Sun Barbados · Mon Dominica · Tue St. Kitts · Wed–Thu Sea (wine dinners)",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Celebrity Ascent 11N Ultimate Southern Caribbean schedule & winemasterscruises.com/2027-01-tipsy-ascent.",
    utmSource: "wine_masters_tipsy_canyon",
    sailingPageUrl: buildSailingUtmUrl("celebrity-ascent", "2027-01-25", "wine_masters_tipsy_canyon"),
    valueToPitchSummary:
      "Private tastings and pairing dinners sit on the 4 sea days while 6 consecutive Southern Caribbean islands (St. Maarten through St. Kitts) are open—wine-club couples want to see which catamaran or island tours fellow club members are joining.",
    phoneOpeningScript:
      "Hi Brett — this is Erich with Cruise Promenade calling about your January 25 Tipsy Canyon Winery cruise on Celebrity Ascent. With 4 sea days for private pours and 6 straight Southern Caribbean islands in the middle, we built a free shared page for that exact 11-night sailing so wine-club couples can see which excursions others are joining and keep your private tasting times offline without touching your Expedia Cruises bookings. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Brett, Erich at Cruise Promenade calling about the January 25, 2027 Tipsy Canyon Winery group on Celebrity Ascent. We built a free shared cruise page for that exact 11-night sailing so wine-club guests can coordinate excursions across your six Caribbean port days and keep your tasting schedule offline, with zero interference with your Expedia Cruises bookings. Happy to email bbrown@expediacruises.com the link!",
    phoneOrTextScript: `Hi Brett — calling about the Jan 25 – Feb 5, 2027 Tipsy Canyon Winery Cruise on Celebrity Ascent. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("celebrity-ascent", "2027-01-25", "wine_masters_tipsy_canyon")}`,
    likelyObjection:
      "As an Expedia Cruises advisor, I don't want guests redirected away from our agency excursion links.",
    objectionResponse:
      "You control the board as the organizer—you can pin your own Expedia Cruises or private group shore excursions with your exact departure times and links, and Cruise Promenade never touches cabin sales.",
    emailSubject:
      "Free shared winery group board for Jan 25 Celebrity Ascent (Tipsy Canyon Winery)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Brett,",
      introLine:
        "Following up regarding Wine Masters Cruises' January 25 – February 5, 2027 Tipsy Canyon Winery voyage aboard Celebrity Ascent.",
      sailingUrl: buildSailingUtmUrl("celebrity-ascent", "2027-01-25", "wine_masters_tipsy_canyon"),
      utmSource: "wine_masters_tipsy_canyon",
      scheduleNote:
        "You can post Mark's welcome reception, sea-day seminars, and pairing dinners alongside all six Southern Caribbean port calls (St. Maarten, Antigua, St. Lucia, Barbados, Dominica, and St. Kitts) and attach your own preferred excursion links.",
    }),
    recommendedNextAction:
      "Call Brett Brown at (720) 320-2393 (or Expedia Cruises office 425-426-2775) during Pacific morning/afternoon hours.",
    outreachStatus: "ready_to_call",
    notes:
      "Wine Masters Cruises hosts multiple 2027 winery sailings—winning Brett Brown can unlock several Pacific NW winery cohorts. 0 outreach messages sent.",
  },
  {
    leadId: "stitchin_heaven_riley_blake",
    priorityRank: 10,
    leadName: "Stitchin' Heaven — 2027 Riley Blake Quilting Cruise",
    contactName: "Clay Luttrell & Deb Luttrell",
    organizerRole: "Co-Owner/President & Founder, Stitchin' Heaven Travel",
    phone: "(903) 760-7397",
    phoneInvitesText: false,
    email: "info@stitchinheaven.com",
    altEmails: [],
    contactPageUrl: "https://stitchinheaven.com/pages/contact-us",
    officialUrl: "https://stitchinheaven.com/products/2027-riley-blake-quilting-cruise",
    eventPageUrl: "https://stitchinheaven.com/products/2027-riley-blake-quilting-cruise",
    contactTimezone: "America/Chicago (CT)",
    bestCallingWindow: "10:15 AM – 12:30 PM CT or 1:30 PM – 4:30 PM CT Tue–Sat (9:15–11:30 AM / 12:30–3:30 PM MT)",
    cohortDescription:
      "Quilters & companions sailing with national Riley Blake educators (Stitchin' Heaven runs 6+ quilting cruises in 2027)",
    cruiseLine: "Royal Caribbean International",
    hostedCruiseAndSailing:
      "Independence of the Seas · Apr 11–18, 2027 (7N RT Miami)",
    shipName: "Independence of the Seas",
    shipSlug: "independence-of-the-seas",
    sailDate: "2027-04-11",
    returnDate: "2027-04-18",
    portWindowsSummary:
      "Sun Apr 11 Dep Miami 16:00 · Mon Nassau 08:00–17:00 · Tue CocoCay 07:00–17:00 · Wed Sea (sewing classes) · Thu Costa Maya 08:00–17:00 · Fri Cozumel 07:00–18:00 · Sat Sea (sewing classes)",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Royal Caribbean Independence of the Seas 7N schedule & stitchinheaven.com/products/2027-riley-blake-quilting-cruise.",
    utmSource: "stitchin_heaven_riley_blake",
    sailingPageUrl: buildSailingUtmUrl("independence-of-the-seas", "2027-04-11", "stitchin_heaven_riley_blake"),
    valueToPitchSummary:
      "Quilters are split into sewing classroom rotations on sea days while spouses/non-quilting companions and off-rotation quilters have four port days (Nassau, CocoCay, Costa Maya, Cozumel)—one shared board + printable PDF Cruise Pack fits both quilters and companions.",
    phoneOpeningScript:
      "Hi — this is Erich with Cruise Promenade calling for Clay Luttrell or the Cruise Travel team about your April 11 Riley Blake Quilting Cruise on Independence of the Seas. Because quilters have sea-day sewing rotations and spouses plus quilters are open in Nassau, CocoCay, Costa Maya, and Cozumel, we built a free shared page for that exact sailing—including a printable PDF Cruise Pack—without touching your package sales. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Stitchin' Heaven cruise team, Erich at Cruise Promenade calling about your April 11, 2027 Riley Blake Quilting Cruise on Independence of the Seas. We built a free shared cruise page and printable offline Cruise Pack for that exact sailing so quilters and spouses can coordinate port excursions around your sewing classroom rotations without touching your bookings. Happy to email info@stitchinheaven.com the link!",
    phoneOrTextScript: `Hi Clay & Stitchin' Heaven Cruise Team — calling about the Apr 11–18, 2027 Riley Blake Quilting Cruise on Independence of the Seas. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("independence-of-the-seas", "2027-04-11", "stitchin_heaven_riley_blake")}`,
    likelyObjection:
      "Many of our quilters prefer printed schedules rather than smartphone apps onboard.",
    objectionResponse:
      "That is one of our favorite parts—every traveler or host can click 'Save final plan offline' before leaving home to print a clean paper PDF Cruise Pack with exact meeting times, plus it works without ship Wi-Fi.",
    emailSubject:
      "Free printable & shared port board for the Apr 11 Riley Blake Quilting Cruise",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Clay & Stitchin' Heaven Travel Team,",
      introLine:
        "Following up regarding the April 11–18, 2027 Riley Blake Quilting Cruise aboard Independence of the Seas out of Miami.",
      sailingUrl: buildSailingUtmUrl("independence-of-the-seas", "2027-04-11", "stitchin_heaven_riley_blake"),
      utmSource: "stitchin_heaven_riley_blake",
      scheduleNote:
        "Quilters and non-quilting spouses can see who is joining excursions in Nassau, CocoCay, Costa Maya, and Cozumel alongside your Wednesday/Saturday sewing rotations—and print a clean paper PDF Cruise Pack before boarding. (We also verified your Jan 23, 2027 Icon of the Seas quilting sailing.)",
    }),
    recommendedNextAction:
      "Send approved new outreach to verified info@stitchinheaven.com (or call (903) 760-7397 Tue–Sat 10 AM–5 PM CT). Prior Sep 4, 2026 attempt to travel@stitchinheaven.com bounced immediately.",
    outreachStatus: "bounced_failed",
    notes:
      "Verified Gmail history: Attempted Sep 4, 2026 from erichroeseler123@gmail.com to travel@stitchinheaven.com; immediate delivery failure (bounced, not delivered). New info@stitchinheaven.com outreach has NOT been sent. 0 conversions/applications.",
  },

  // ============================================================================
  // RANKS 11–29: ADDITIONAL VERIFIED PHONE-QUALIFIED "READY TO CALL" PROSPECTS
  // ============================================================================
  {
    leadId: "cmmc_at_sea",
    priorityRank: 11,
    leadName: "CMMC at Sea",
    contactName: "CMMC at Sea Team (Edwards Performance Solutions / DRP International)",
    organizerRole: "Official Conference Pass Host (Edwards) & Event Planner (DRP)",
    phone: "(443) 561-1334",
    phoneInvitesText: false,
    email: "Info@CMMCatSea.com",
    altEmails: ["events@drpintl.com", "info@edwps.com"],
    contactPageUrl: "https://cmmcatsea.com/registration/",
    officialUrl: "https://cmmcatsea.com/registration/",
    eventPageUrl: "https://cmmcatsea.com/registration/",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "9:30 AM – 12:00 PM ET or 1:30 PM – 4:30 PM ET (7:30–10:00 AM / 11:30 AM–2:30 PM MT)",
    cohortDescription:
      "Cybersecurity & Defense Industrial Base conference ($295 pass; room block closed Oct 28, 2026 so attendees book cabins independently)",
    cruiseLine: "Celebrity Cruises",
    hostedCruiseAndSailing:
      "Celebrity Beyond · Jan 17–24, 2027 (7N RT Fort Lauderdale)",
    shipName: "Celebrity Beyond",
    shipSlug: "celebrity-beyond",
    sailDate: "2027-01-17",
    returnDate: "2027-01-24",
    portWindowsSummary:
      "3 sea days programmed · Open ports: Mon Jan 18 Nassau 07:30–17:00 · Wed Jan 20 Cozumel 07:00–20:00 · Fri Jan 22 Grand Cayman 08:00–18:00 (tender)",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Celebrity Beyond 7N schedule & cmmcatsea.com/registration/; public business phone verified via official pass checkout host Edwards Performance Solutions ((443) 561-1334; DRP planner (954) 417-3636).",
    utmSource: "cmmc_at_sea",
    sailingPageUrl: buildSailingUtmUrl("celebrity-beyond", "2027-01-17", "cmmc_at_sea"),
    valueToPitchSummary:
      "Group room block closed Oct 28 so late-registering CMMC practitioners book cabins independently across the ship—a shared board reunites the cohort for open port days in Nassau, Cozumel, and Grand Cayman (with tender timing highlighted).",
    phoneOpeningScript:
      "Hi — this is Erich calling to follow up briefly on the November 12 note I sent Info@cmmcatsea.com regarding your January 17 CMMC at Sea sailing on Celebrity Beyond. Since your room block closed and attendees are booking cabins independently, our free port-day page for that exact sailing is live so attendees can coordinate Nassau, Cozumel, and Grand Cayman outings together. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi CMMC at Sea team, Erich calling to follow up briefly on my November 12 email to Info@cmmcatsea.com about your January 17 Celebrity Beyond sailing. Your free port-day coordination page is live if you'd like to share it with attendees booking cabins independently.",
    phoneOrTextScript: `Hi CMMC at Sea Team — brief follow-up on my Nov 12 note regarding the Jan 17–24, 2027 Celebrity Beyond conference sailing. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("celebrity-beyond", "2027-01-17", "cmmc_at_sea")}`,
    likelyObjection:
      "Since we are a defense cybersecurity cohort, attendees won't want to enter personal or cabin details.",
    objectionResponse:
      "Good call—boards are private (noindex), never ask for cabin numbers, emails, or company credentials, and let attendees use just a first name or handle.",
    emailSubject:
      "Re: Quick follow-up — live port-day page for CMMC at Sea (Jan 17 Celebrity Beyond)",
    emailBody:
      "Hi CMMC at Sea Team,\n\nQuick follow-up on my November 12 note—the free ($0) port-day coordination page for your January 17–24, 2027 Celebrity Beyond sailing out of Fort Lauderdale is now live if you'd like to take a quick look:\n\nLive Sailing Page:\nhttps://cruisepromenade.com/hosted-cruises/cmmc-at-sea/celebrity-beyond-2027-01-17?utm_source=founder_outreach&utm_medium=email&utm_campaign=founding_pilot_wave1&utm_content=cmmc_at_sea_followup_sailing_page\n\nSince your room block closed and attendees are booking cabins independently, it gives attendees and spouses one simple place to coordinate Nassau, Cozumel, and Grand Cayman shore days around your three sea-day sessions—with no cabin numbers or work emails collected, and 100% of Conference Pass registrations routing straight to cmmcatsea.com/registration/ ($0 cost and 0% pass/cabin commission; Cruise Promenade earns commissions only on optional independent shore excursions).\n\nIf you'd ever like to add a quick welcome note or pin networking meetups, your free Organizer Hub is ready here:\nhttps://cruisepromenade.com/organizer/hosted/cmmc-at-sea?utm_source=founder_outreach&utm_medium=email&utm_campaign=founding_pilot_wave1&utm_content=cmmc_at_sea_followup_claim_hub\n\nNo rush at all—just wanted to share the live link in case it's helpful for your January cohort.\n\nBest,\nErich",
    recommendedNextAction:
      "DO NOT send another introductory email (sent Nov 12, 2026 from erich@rollcallusa.com to Info@cmmcatsea.com; no bounce, no reply). Preserve rewritten email above as a future brief follow-up draft only.",
    outreachStatus: "emailed",
    lastContactedAt: "2026-11-12T00:00:00.000Z",
    lastContactChannel: "email",
    notes:
      "Verified Gmail history: Successfully sent Nov 12, 2026 from erich@rollcallusa.com to Info@cmmcatsea.com; no bounce and no reply (recorded as sent, NOT delivery-confirmed). Do NOT send another introductory email; rewritten message preserved as future follow-up draft. 0 conversions/applications.",
  },
  {
    leadId: "vettechlife_mexico",
    priorityRank: 12,
    leadName: "Vet Tech Life — CE on the Sea Mexico 2027",
    contactName: "Julia Stewart & Kelly Lynn Cronin",
    organizerRole: "Dedicated Cruise Coordinator & Founder, Vet Tech Life",
    phone: "(630) 341-0451",
    phoneInvitesText: false,
    email: "kelly.lynn.cronin@gmail.com",
    altEmails: [],
    contactPageUrl: "https://vettechlife.com/reach-us%2Fsubmit-anything",
    officialUrl: "https://vettechlife.com/ce-on-the-sea-mexico-2027",
    eventPageUrl: "https://vettechlife.com/ce-on-the-sea-mexico-2027",
    contactTimezone: "America/Chicago (CT)",
    bestCallingWindow: "9:30 AM – 12:00 PM CT or 1:30 PM – 4:30 PM CT (8:30–11:00 AM / 12:30–3:30 PM MT)",
    cohortDescription:
      "Veterinary technicians & vet pros earning 14 hours RACE-approved CE at sea (also hosts Jun 6 Alaska CE cruise)",
    cruiseLine: "Royal Caribbean International",
    hostedCruiseAndSailing:
      "Voyager of the Seas · Jan 29 – Feb 3, 2027 (5N RT Los Angeles)",
    shipName: "Voyager of the Seas",
    shipSlug: "voyager-of-the-seas",
    sailDate: "2027-01-29",
    returnDate: "2027-02-03",
    portWindowsSummary:
      "Fri Jan 29 Dep Los Angeles 16:00 · Sat Catalina Island 07:00–17:00 (tender) · Sun–Mon Sea (14 hrs RACE CE) · Tue Ensenada 08:00–18:00",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Royal Caribbean Voyager of the Seas 5N Cabo/Catalina/Ensenada schedule & vettechlife.com/ce-on-the-sea-mexico-2027.",
    utmSource: "vettechlife_mexico",
    sailingPageUrl: buildSailingUtmUrl("voyager-of-the-seas", "2027-01-29", "vettechlife_mexico"),
    valueToPitchSummary:
      "Many vet techs attend solo from different clinics; Catalina Island (tender) and Ensenada are wide open while all 14 CE hours sit on the two sea days—gives solo attendees an instant buddy board for shore excursions.",
    phoneOpeningScript:
      "Hi Julia — this is Erich with Cruise Promenade calling about Vet Tech Life's January 29 CE on the Sea Mexico cruise on Voyager of the Seas. Since many vet techs travel solo or in pairs and Catalina and Ensenada are open around your sea-day CE, we built a free shared page for that exact sailing so attendees can join the same excursions and keep an offline schedule without touching your group bookings. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Julia, Erich at Cruise Promenade calling about Vet Tech Life's January 29 Voyager of the Seas CE cruise. We built a free shared cruise page for that exact sailing so vet techs can meet beforehand and coordinate Catalina and Ensenada excursions around your sea-day CE classes without interfering with your cabin block. Happy to send the link over!",
    phoneOrTextScript: `Hi Julia & Kelly — calling about Vet Tech Life's Jan 29 – Feb 3, 2027 CE on the Sea Mexico cruise on Voyager of the Seas. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("voyager-of-the-seas", "2027-01-29", "vettechlife_mexico")}`,
    likelyObjection:
      "Attendees already chat in our Vet Tech Life social community.",
    objectionResponse:
      "Social groups are great for hype, whereas this gives your registered cruisers a structured day-by-day schedule for Catalina tender times, Ensenada excursions, and an offline Cruise Pack once ship Wi-Fi drops.",
    emailSubject:
      "Free attendee excursion board for Vet Tech Life's Jan 29 Voyager of the Seas CE Cruise",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Julia & Kelly,",
      introLine:
        "Following up regarding Vet Tech Life's January 29 – February 3, 2027 CE on the Sea Mexico sailing aboard Voyager of the Seas out of Los Angeles.",
      sailingUrl: buildSailingUtmUrl("voyager-of-the-seas", "2027-01-29", "vettechlife_mexico"),
      utmSource: "vettechlife_mexico",
      scheduleNote:
        "It maps Saturday's Catalina Island tender window and Tuesday's Ensenada port day around your two sea days of RACE CE—and we also verified your June 6, 2027 Serenade of the Seas Alaska CE sailing if helpful.",
    }),
    recommendedNextAction:
      "Call Julia Stewart at (630) 341-0451 during Central Time hours; mention both Jan 29 Voyager and Jun 6 Serenade Alaska.",
    outreachStatus: "ready_to_call",
    notes:
      "Dedicated cruise coordinator Julia Stewart phone (630) 341-0451 published directly on CE on the Sea 2027 page. 0 outreach messages sent.",
  },
  {
    leadId: "mda_wda_dental_ce",
    priorityRank: 13,
    leadName: "Michigan & Wisconsin Dental Associations — 2027 Sun, Sand & CE Cruise",
    contactName: "Annie McIntosh",
    organizerRole: "Continuing Education Coordinator, Michigan Dental Association",
    phone: "(517) 372-9070",
    phoneInvitesText: false,
    email: "amcintosh@michigandental.org",
    altEmails: ["mda@michigandental.org"],
    contactPageUrl: "https://www.michigandental.org/contact/",
    officialUrl: "https://www.michigandental.org/events/2027-sun-sand-and-ce-cruise/",
    eventPageUrl: "https://www.michigandental.org/events/2027-sun-sand-and-ce-cruise/",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "9:30 AM – 12:00 PM ET or 1:30 PM – 4:15 PM ET (7:30–10:00 AM / 11:30 AM–2:15 PM MT)",
    cohortDescription:
      "Dentists, hygienists & families from the Michigan & Wisconsin Dental Associations",
    cruiseLine: "Royal Caribbean International",
    hostedCruiseAndSailing:
      "Harmony of the Seas · Jan 16–23, 2027 (7N RT Port Canaveral)",
    shipName: "Harmony of the Seas",
    shipSlug: "harmony-of-the-seas",
    sailDate: "2027-01-16",
    returnDate: "2027-01-23",
    portWindowsSummary:
      "Sat Jan 16 Dep Port Canaveral 16:00 · Sun–Mon Sea (12 CE credits) · Tue St. Maarten 08:00–17:00 · Wed San Juan 07:00–15:00 · Thu Sea (CE) · Fri CocoCay 07:30–17:00",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Royal Caribbean Harmony of the Seas 7N Eastern Caribbean schedule & michigandental.org/events/2027-sun-sand-and-ce-cruise/.",
    utmSource: "mda_wda_dental_ce",
    sailingPageUrl: buildSailingUtmUrl("harmony-of-the-seas", "2027-01-16", "mda_wda_dental_ce"),
    valueToPitchSummary:
      "Brings two state dental associations (MDA & WDA) plus spouses together—three sea days hold Dr.isky/clinical CE seminars while St. Maarten, early-departure San Juan (07:00–15:00), and CocoCay are open for families and colleagues.",
    phoneOpeningScript:
      "Hi Annie — this is Erich with Cruise Promenade calling about the January 16 Michigan and Wisconsin Dental Associations Sun, Sand & CE Cruise on Harmony of the Seas. Since your 12 CE hours run on the sea days and dentists and families from two states have St. Maarten, San Juan, and CocoCay open, we built a free shared page for that exact sailing so attendees can coordinate excursions and save an offline schedule. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Annie, Erich with Cruise Promenade calling about the January 16 MDA and WDA Sun, Sand & CE Cruise on Harmony of the Seas. We built a free shared cruise page for that exact sailing so Michigan and Wisconsin dental families can coordinate St. Maarten, San Juan, and CocoCay outings around your sea-day CE seminars without touching Travelink's cabin block. Happy to email amcintosh@michigandental.org!",
    phoneOrTextScript: `Hi Annie — calling about the Jan 16–23, 2027 MDA/WDA Sun, Sand & CE Cruise on Harmony of the Seas. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("harmony-of-the-seas", "2027-01-16", "mda_wda_dental_ce")}`,
    likelyObjection:
      "Travelink handles our group cruise reservations and room block.",
    objectionResponse:
      "Travelink keeps 100% of cabin sales—Cruise Promenade doesn't book cabins or collect passenger data. It simply gives registered MDA and WDA families one link for St. Maarten, the early 3 PM San Juan departure, and CocoCay.",
    emailSubject:
      "Free attendee excursion board for the Jan 16 MDA/WDA Sun, Sand & CE Cruise",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Annie,",
      introLine:
        "Following up regarding the Michigan & Wisconsin Dental Associations' January 16–23, 2027 Sun, Sand and CE Cruise aboard Harmony of the Seas.",
      sailingUrl: buildSailingUtmUrl("harmony-of-the-seas", "2027-01-16", "mda_wda_dental_ce"),
      utmSource: "mda_wda_dental_ce",
      scheduleNote:
        "It highlights the early 07:00–15:00 San Juan window alongside St. Maarten and CocoCay while keeping your three sea days dedicated to MDA/WDA CE seminars, with zero interference with Travelink.",
    }),
    recommendedNextAction:
      "Call Annie McIntosh at (517) 372-9070 (toll-free 800-589-2632) during Michigan morning/afternoon hours.",
    outreachStatus: "ready_to_call",
    notes:
      "Two-state professional association CE cruise with named CE coordinator direct phone & email. 0 outreach messages sent.",
  },
  {
    leadId: "cu_conferences_alaska",
    priorityRank: 14,
    leadName: "CU Conferences — 2027 Alaska Credit Union Educational Cruise",
    contactName: "Jill Donati",
    organizerRole: "Cruise Conference Coordinator, CU Conferences / Altair Travel",
    phone: "(630) 551-7290",
    phoneInvitesText: false,
    email: "jilldonati@altairtravel.com",
    altEmails: ["info@cuconferences.com"],
    contactPageUrl: "https://www.cuconferences.com/cruise-conferences",
    officialUrl: "https://www.cuconferences.com/alaskan-cruise",
    eventPageUrl: "https://www.cuconferences.com/alaskan-cruise",
    contactTimezone: "America/Chicago (CT)",
    bestCallingWindow: "9:30 AM – 12:00 PM CT or 1:30 PM – 4:30 PM CT (8:30–11:00 AM / 12:30–3:30 PM MT)",
    cohortDescription:
      "Credit union executives, board directors & spouses attending governance conferences at sea",
    cruiseLine: "Celebrity Cruises",
    hostedCruiseAndSailing:
      "Celebrity Edge · Jun 11–18, 2027 (7N RT Seattle)",
    shipName: "Celebrity Edge",
    shipSlug: "celebrity-edge",
    sailDate: "2027-06-11",
    returnDate: "2027-06-18",
    portWindowsSummary:
      "Fri Jun 11 Dep Seattle 17:00 · Sat Sea (CU sessions) · Sun Ketchikan 07:00–16:00 · Mon Endicott Arm & Juneau 13:30–22:00 · Tue Skagway 07:00–18:00 · Wed Sea (CU sessions) · Thu Victoria 17:30–23:59",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Celebrity Edge 7N Dawes Glacier Alaska schedule & cuconferences.com/alaskan-cruise.",
    utmSource: "cu_conferences_alaska",
    sailingPageUrl: buildSailingUtmUrl("celebrity-edge", "2027-06-11", "cu_conferences_alaska"),
    valueToPitchSummary:
      "Credit union board members and spouses have tricky afternoon/evening port windows in Juneau (1:30 PM–10:00 PM) and Victoria—a shared board lets directors from different credit unions join the exact same afternoon whale watch or glacier departure.",
    phoneOpeningScript:
      "Hi Jill — this is Erich with Cruise Promenade calling about the June 11, 2027 CU Conferences Alaska sailing on Celebrity Edge. Because Juneau is a 1:30 to 10:00 PM afternoon call and directors often travel with spouses, we built a free shared page for that exact sailing so your credit union attendees can coordinate excursions and keep your sea-day conference schedule offline without touching Altair Travel's cabin bookings. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Jill, Erich at Cruise Promenade calling about CU Conferences' June 11, 2027 Celebrity Edge Alaska sailing. We built a free shared cruise page for that exact voyage so credit union executives and spouses can coordinate Ketchikan, afternoon Juneau, and Skagway excursions around your sea-day sessions without interfering with Altair Travel. Happy to email jilldonati@altairtravel.com!",
    phoneOrTextScript: `Hi Jill — calling about CU Conferences' Jun 11–18, 2027 Celebrity Edge Alaska Educational Cruise. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("celebrity-edge", "2027-06-11", "cu_conferences_alaska")}`,
    likelyObjection:
      "Altair Travel is our in-house agency handling all group cruise arrangements.",
    objectionResponse:
      "You stay in complete control—Altair Travel can pin its own recommended shore excursions onto the board, and Cruise Promenade never sells cruise cabins.",
    emailSubject:
      "Free Alaska port board for CU Conferences' Jun 11, 2027 Celebrity Edge Cruise",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Jill,",
      introLine:
        "Following up regarding CU Conferences' June 11–18, 2027 Alaska Educational Cruise aboard Celebrity Edge out of Seattle.",
      sailingUrl: buildSailingUtmUrl("celebrity-edge", "2027-06-11", "cu_conferences_alaska"),
      utmSource: "cu_conferences_alaska",
      scheduleNote:
        "It maps Ketchikan (07:00–16:00), Endicott Arm + afternoon Juneau (13:30–22:00), Skagway (07:00–18:00), and evening Victoria around your Saturday/Wednesday conference sessions, and lets Altair Travel include its own preferred excursion links.",
    }),
    recommendedNextAction:
      "Call Jill Donati directly at (630) 551-7290 (toll-free 888-465-6010) during Central Time business hours.",
    outreachStatus: "ready_to_call",
    notes:
      "CU Conferences runs multiple credit union cruise conferences (Caribbean & Alaska). Direct coordinator line published. 0 outreach messages sent.",
  },
  {
    leadId: "buckeye_alaskan_wonders",
    priorityRank: 15,
    leadName: "Buckeye Cruise / Travel Partners in Dublin — 2027 Alaskan Wonders",
    contactName: "Lisa Cisco & Kim Davis",
    organizerRole: "Co-Founders, Travel Partners in Dublin (Buckeye Cruise Organizers)",
    phone: "(614) 792-0002",
    phoneInvitesText: false,
    email: null,
    altEmails: [],
    contactPageUrl: "https://www.travelpartnersindublin.com/contact/",
    officialUrl: "https://www.travelpartnersindublin.com/travel-with-us/alaskan-wonders/",
    eventPageUrl: "https://www.travelpartnersindublin.com/travel-with-us/alaskan-wonders/",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "9:30 AM – 12:00 PM ET or 1:30 PM – 4:30 PM ET (7:30–10:00 AM / 11:30 AM–2:30 PM MT)",
    cohortDescription:
      "Hosted Ohio community & alumni group sailing 7N southbound Alaska (plus optional Denali land tour)",
    cruiseLine: "Celebrity Cruises",
    hostedCruiseAndSailing:
      "Celebrity Solstice · Aug 6–13, 2027 (7N Seward to Vancouver)",
    shipName: "Celebrity Solstice",
    shipSlug: "celebrity-solstice",
    sailDate: "2027-08-06",
    returnDate: "2027-08-13",
    portWindowsSummary:
      "Fri Aug 6 Dep Seward 20:00 · Sat Hubbard Glacier · Sun Aug 8 Juneau 09:00–21:00 · Mon Skagway 07:00–20:00 · Tue Icy Strait Point 06:30–15:00 · Wed Ketchikan 09:00–18:00 · Thu Inside Passage",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Celebrity Solstice 7N Southbound Alaska schedule & travelpartnersindublin.com/travel-with-us/alaskan-wonders/.",
    utmSource: "buckeye_alaskan_wonders",
    sailingPageUrl: buildSailingUtmUrl("celebrity-solstice", "2027-08-06", "buckeye_alaskan_wonders"),
    valueToPitchSummary:
      "High-affinity Ohio hosted group across four long Alaska port calls (12h Juneau, 13h Skagway, Icy Strait Point, Ketchikan)—lets Travel Partners in Dublin post hosted group excursions alongside independent guest outings in one offline pack.",
    phoneOpeningScript:
      "Hi — this is Erich with Cruise Promenade calling for Lisa Cisco or Kim Davis's group desk about your August 6, 2027 Alaskan Wonders group on Celebrity Solstice. We built a free shared page for that exact Seward-to-Vancouver sailing so your travelers can see which Juneau, Skagway, Icy Strait, and Ketchikan excursions everyone is joining and carry an offline Cruise Pack without touching your agency bookings. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Lisa and Kim's team at Travel Partners in Dublin, Erich with Cruise Promenade calling about your August 6, 2027 Alaskan Wonders group on Celebrity Solstice. We built a free shared cruise page for that exact sailing so your group can coordinate Alaska excursions and carry an offline schedule, with zero interference with your cabin or land-tour sales. You can reach me back at the number on caller ID!",
    phoneOrTextScript: `Hi Travel Partners in Dublin team — calling about your Aug 6–13, 2027 Alaskan Wonders Hosted Group on Celebrity Solstice. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("celebrity-solstice", "2027-08-06", "buckeye_alaskan_wonders")}`,
    likelyObjection:
      "Some of our travelers are doing the pre-cruise Alaska land tour while others join at Seward.",
    objectionResponse:
      "That works cleanly—the board anchors everyone once they embark Celebrity Solstice in Seward on August 6, and you can add notes for pre-cruise land-tour arrivals right in the group welcome banner.",
    emailSubject:
      "Free shared group board for your Aug 6, 2027 Celebrity Solstice Alaskan Wonders Cruise",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Lisa, Kim & Travel Partners in Dublin Team,",
      introLine:
        "Following up regarding your hosted August 6–13, 2027 Alaskan Wonders voyage aboard Celebrity Solstice from Seward to Vancouver.",
      sailingUrl: buildSailingUtmUrl("celebrity-solstice", "2027-08-06", "buckeye_alaskan_wonders"),
      utmSource: "buckeye_alaskan_wonders",
      scheduleNote:
        "It maps Hubbard Glacier, Juneau (09:00–21:00), Skagway (07:00–20:00), Icy Strait Point (06:30–15:00), and Ketchikan (09:00–18:00), lets you attach your own preferred agency excursion links, and gives guests a printable offline Cruise Pack.",
    }),
    recommendedNextAction:
      "Call (614) 792-0002 (alt Buckeye Cruise line 614-792-6204) during Ohio business hours.",
    outreachStatus: "ready_to_call",
    notes:
      "Powerhouse Ohio group cruise agency (organizers behind Buckeye Cruise for Cancer & hosted luxury/Alaska groups). 0 outreach messages sent.",
  },
  {
    leadId: "singlescruise_valentines",
    priorityRank: 16,
    leadName: "SinglesCruise.com — 2027 Valentine's Day & Big Game Cruise",
    contactName: "Sharon Concepcion & Shelby Bergeron",
    organizerRole: "VP of Leisure Operations & Lead Cruise Director, SinglesCruise.com",
    phone: "(201) 210-7918",
    phoneInvitesText: false,
    email: "SinglesCruise@Vacation.com",
    altEmails: [],
    contactPageUrl: "https://www.singlescruise.com/your-experience/",
    officialUrl: "https://www.singlescruise.com/cruises/caribbean-valentines-day/",
    eventPageUrl: "https://www.singlescruise.com/cruises/caribbean-valentines-day/",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "10:00 AM – 12:30 PM ET or 2:00 PM – 4:30 PM ET (8:00–10:30 AM / 12:00–2:30 PM MT)",
    cohortDescription:
      "Hosted solo travelers & singles sailing roundtrip from New Orleans with onboard cruise directors",
    cruiseLine: "Norwegian Cruise Line",
    hostedCruiseAndSailing:
      "Norwegian Breakaway · Feb 14–21, 2027 (7N RT New Orleans)",
    shipName: "Norwegian Breakaway",
    shipSlug: "norwegian-breakaway",
    sailDate: "2027-02-14",
    returnDate: "2027-02-21",
    portWindowsSummary:
      "Sun Feb 14 Dep New Orleans 16:00 · Mon Sea · Tue Cozumel 08:00–17:00 · Wed Roatan 08:00–17:00 · Thu Harvest Caye 08:00–17:00 · Fri Costa Maya 08:00–14:00 · Sat Sea",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against NCL Norwegian Breakaway 7N Western Caribbean schedule & singlescruise.com/cruises/caribbean-valentines-day/.",
    utmSource: "singlescruise_valentines",
    sailingPageUrl: buildSailingUtmUrl("norwegian-breakaway", "2027-02-14", "singlescruise_valentines"),
    valueToPitchSummary:
      "Solo travelers sign up specifically to meet people before boarding and not go ashore alone across four consecutive port days (Cozumel, Roatan, Harvest Caye, Costa Maya)—and hosts can post cocktail mixers and theme nights in the offline pack.",
    phoneOpeningScript:
      "Hi — this is Erich with Cruise Promenade calling for Sharon Concepcion or Shelby Bergeron's team about your February 14 Valentine's & Big Game Singles Cruise on Norwegian Breakaway. Solo travelers hate going ashore alone—we built a free shared page for that exact sailing so your booked guests can see who is joining excursions in Cozumel, Roatan, Harvest Caye, and Costa Maya alongside your onboard mixers, without touching your cabin packages. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Sharon and Shelby's team at SinglesCruise.com, Erich with Cruise Promenade calling about your February 14, 2027 Norwegian Breakaway sailing out of New Orleans. We built a free private-link cruise page for that exact voyage so your booked solo travelers can coordinate shore excursions and carry your onboard event schedule offline. Happy to email SinglesCruise@Vacation.com!",
    phoneOrTextScript: `Hi Sharon & Shelby — calling about your Feb 14–21, 2027 Valentine's Singles Cruise on Norwegian Breakaway. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("norwegian-breakaway", "2027-02-14", "singlescruise_valentines")}`,
    likelyObjection:
      "We only allow guests who booked through SinglesCruise.com into our private events and pre-cruise community.",
    objectionResponse:
      "The board is private (noindex) and invite-only—you share the link strictly inside your booked-guest confirmation packet, and you can toggle self-join or manage the roster directly.",
    emailSubject:
      "Free private excursion & mixer board for Feb 14 Norwegian Breakaway (SinglesCruise.com)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Sharon, Shelby & SinglesCruise.com Team,",
      introLine:
        "Following up regarding your hosted February 14–21, 2027 Valentine's Day & Big Game Cruise aboard Norwegian Breakaway from New Orleans.",
      sailingUrl: buildSailingUtmUrl("norwegian-breakaway", "2027-02-14", "singlescruise_valentines"),
      utmSource: "singlescruise_valentines",
      scheduleNote:
        "You can keep the board private to your booked wristbanded guests, post Shelby's onboard mixers and Big Game watch party, and let solo travelers pair up on the exact same departures in Cozumel, Roatan, Harvest Caye, and Costa Maya.",
    }),
    recommendedNextAction:
      "Call (201) 210-7918 (or 800-393-5000) and ask for the SinglesCruise.com group operations desk.",
    outreachStatus: "ready_to_call",
    notes:
      "Major hosted solo-group brand with 15+ hosted departures/year. Direct NJ operations number published. 0 outreach messages sent.",
  },
  {
    leadId: "pickleball_at_sea",
    priorityRank: 17,
    leadName: "Pickleball At Sea — Feb 2027 Caribbean Pickleball Vacation",
    contactName: "Escape Group Cruises Pickleball Team",
    organizerRole: "Coaching & Group Cruise Coordination Desk, Escape Group Cruises",
    phone: "(239) 244-2209",
    phoneInvitesText: false,
    email: "Fun@EscapeGroupCruises.com",
    altEmails: [],
    contactPageUrl: "https://www.pickleballatseagroupcruise.com/pages/contact",
    officialUrl: "https://www.pickleballatseagroupcruise.com/pages/february-21st-27th-2027",
    eventPageUrl: "https://www.pickleballatseagroupcruise.com/pages/february-21st-27th-2027",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "9:30 AM – 12:00 PM ET or 1:30 PM – 4:30 PM ET (7:30–10:00 AM / 11:30 AM–2:30 PM MT)",
    cohortDescription:
      "Recreational pickleball players & spouses with PPR-certified pro clinics on sea days",
    cruiseLine: "Royal Caribbean International",
    hostedCruiseAndSailing:
      "Adventure of the Seas · Feb 21–27, 2027 (6N RT Fort Lauderdale)",
    shipName: "Adventure of the Seas",
    shipSlug: "adventure-of-the-seas",
    sailDate: "2027-02-21",
    returnDate: "2027-02-27",
    portWindowsSummary:
      "Sun Feb 21 Dep Fort Lauderdale 16:00 · Mon Sea (pickleball clinics) · Tue Falmouth 08:00–16:00 · Wed Grand Cayman 08:00–16:00 (tender) · Thu Sea (clinics) · Fri Nassau 09:00–17:00",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Royal Caribbean Adventure of the Seas 6N Western Caribbean schedule & pickleballatseagroupcruise.com.",
    utmSource: "pickleball_at_sea",
    sailingPageUrl: buildSailingUtmUrl("adventure-of-the-seas", "2027-02-21", "pickleball_at_sea"),
    valueToPitchSummary:
      "Pickleball players are hyper-social—court clinics run on Monday and Thursday sea days while Falmouth, Grand Cayman (tender), and Nassau are open for players and non-playing spouses to book excursions together.",
    phoneOpeningScript:
      "Hi — this is Erich with Cruise Promenade calling about your February 21 Pickleball At Sea group on Adventure of the Seas. Since your PPR court clinics run on the sea days and players plus spouses have Falmouth, Grand Cayman, and Nassau open, we built a free shared page for that exact 6-night sailing so players can join the same excursions and keep court clinic times offline without touching your group bookings. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Pickleball At Sea team, Erich with Cruise Promenade calling about your February 21, 2027 Adventure of the Seas cruise. We built a free shared cruise page for that exact sailing so your pickleball players and spouses can coordinate Falmouth, Grand Cayman, and Nassau excursions alongside your sea-day court clinics. Happy to email Fun@EscapeGroupCruises.com!",
    phoneOrTextScript: `Hi Pickleball At Sea Team — calling about your Feb 21–27, 2027 Adventure of the Seas Pickleball Cruise. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("adventure-of-the-seas", "2027-02-21", "pickleball_at_sea")}`,
    likelyObjection:
      "Players divide into skill-level court sessions—will that confuse the schedule?",
    objectionResponse:
      "You can list each skill-group court block right on Monday and Thursday sea days so players see their court window and port excursions in one offline Cruise Pack.",
    emailSubject:
      "Free player & spouse excursion board for Feb 21 Adventure of the Seas (Pickleball At Sea)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Pickleball At Sea & Escape Group Cruises Team,",
      introLine:
        "Following up regarding your February 21–27, 2027 Caribbean Pickleball Vacation aboard Adventure of the Seas out of Fort Lauderdale.",
      sailingUrl: buildSailingUtmUrl("adventure-of-the-seas", "2027-02-21", "pickleball_at_sea"),
      utmSource: "pickleball_at_sea",
      scheduleNote:
        "Players and non-playing companions can coordinate excursions in Falmouth, Grand Cayman (tender), and Nassau alongside your Monday/Thursday sea-day court clinics, with zero interference with Escape Group Cruises' bookings.",
    }),
    recommendedNextAction:
      "Call (239) 244-2209 (alt 812-827-8473) during Florida business hours and walk through the Feb 21 Adventure of the Seas page.",
    outreachStatus: "ready_to_call",
    notes:
      "Escape Group Cruises operates multiple Pickleball At Sea departures in 2027. Direct phone & email published. 0 outreach messages sent.",
  },
  {
    leadId: "cruise_and_crop_stampin",
    priorityRank: 18,
    leadName: "Cruise & Crop — Stampin' at Sea 2027",
    contactName: "Gail Pastor & Cheri Thomas",
    organizerRole: "Co-Founders & Dream Vacations Franchise Owners, Cruise & Crop",
    phone: "(352) 527-8473",
    phoneInvitesText: false,
    email: "info@cruiseandcrop.com",
    altEmails: ["cthomas@dreamvacations.com"],
    contactPageUrl: "https://www.cruiseandcrop.com/AboutUs.html",
    officialUrl: "https://www.cruiseandcrop.com/StampinAtSea2027.html",
    eventPageUrl: "https://www.cruiseandcrop.com/StampinAtSea2027.html",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "10:00 AM – 12:30 PM ET or 2:00 PM – 4:30 PM ET (8:00–10:30 AM / 12:00–2:30 PM MT)",
    cohortDescription:
      "Paper crafters, cardmakers, scrapbookers & spouses sailing 7 nights from Fort Lauderdale",
    cruiseLine: "Holland America Line",
    hostedCruiseAndSailing:
      "Nieuw Statendam · Feb 14–21, 2027 (7N RT Fort Lauderdale)",
    shipName: "Nieuw Statendam",
    shipSlug: "nieuw-statendam",
    sailDate: "2027-02-14",
    returnDate: "2027-02-21",
    portWindowsSummary:
      "Sun Feb 14 Dep Fort Lauderdale 15:00 · Mon Sea (crop room) · Tue Grand Turk 08:00–17:00 · Wed San Juan 13:00–22:00 · Thu St. Thomas 08:00–17:00 · Fri Sea (crop room) · Sat Half Moon Cay 08:00–15:00",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Holland America Nieuw Statendam 7N Eastern Caribbean schedule & cruiseandcrop.com/StampinAtSea2027.html.",
    utmSource: "cruise_and_crop_stampin",
    sailingPageUrl: buildSailingUtmUrl("nieuw-statendam", "2027-02-14", "cruise_and_crop_stampin"),
    valueToPitchSummary:
      "Crafters have sea-day crop-room classes while non-crafting husbands/companions and crafters have four Caribbean ports (Grand Turk, afternoon/evening San Juan, St. Thomas, Half Moon Cay)—plus Dream Vacations advisors can pin their own shore excursion links.",
    phoneOpeningScript:
      "Hi Gail or Cheri — this is Erich with Cruise Promenade calling about your February 14 Stampin' at Sea group on Nieuw Statendam. Because crafters are in the crop room on sea days and companions plus crafters have Grand Turk, San Juan, St. Thomas, and Half Moon Cay open, we built a free shared page and printable PDF pack for that exact sailing—and you can paste your own Dream Vacations excursion links. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Gail and Cheri, Erich with Cruise Promenade calling about your February 14, 2027 Stampin' at Sea cruise on Holland America's Nieuw Statendam. We built a free shared page and printable Cruise Pack for that exact sailing so crafters and companions can coordinate port excursions without interfering with your Dream Vacations bookings. Happy to email info@cruiseandcrop.com!",
    phoneOrTextScript: `Hi Gail & Cheri — calling about your Feb 14–21, 2027 Stampin' at Sea Cruise on Nieuw Statendam. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("nieuw-statendam", "2027-02-14", "cruise_and_crop_stampin")}`,
    likelyObjection:
      "As Dream Vacations franchise owners, we book shore excursions for our group.",
    objectionResponse:
      "Even better—you can attach your own Dream Vacations shore excursion links right on each activity card so every click goes through your agency.",
    emailSubject:
      "Free printable & shared port board for Stampin' at Sea 2027 (Feb 14 Nieuw Statendam)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Gail & Cheri,",
      introLine:
        "Following up regarding Cruise & Crop's February 14–21, 2027 Stampin' at Sea voyage aboard Holland America's Nieuw Statendam.",
      sailingUrl: buildSailingUtmUrl("nieuw-statendam", "2027-02-14", "cruise_and_crop_stampin"),
      utmSource: "cruise_and_crop_stampin",
      scheduleNote:
        "Crafters and spouses can see who is joining outings in Grand Turk, San Juan (13:00–22:00), St. Thomas, and Half Moon Cay alongside your crop-room hours, attach your Dream Vacations excursion links, and print a clean PDF Cruise Pack.",
    }),
    recommendedNextAction:
      "Call Gail Pastor & Cheri Thomas at (352) 527-8473 during Florida business hours.",
    outreachStatus: "ready_to_call",
    notes:
      "25+ year crafting cruise duo (Dream Vacations owners) running multiple hosted craft cruises per year. 0 outreach messages sent.",
  },
  {
    leadId: "krouse_bermuda_retirement",
    priorityRank: 19,
    leadName: "Krouse Travel — Tammy's 7-Night Bermuda Retirement Cruise",
    contactName: "Vickie Everhart",
    organizerRole: "President & Lead Group Advisor, Krouse Travel",
    phone: "(717) 244-6410",
    phoneInvitesText: false,
    email: "vseverhart@krousetravel.com",
    altEmails: [],
    contactPageUrl: "https://krousetravel.com/contact/",
    officialUrl: "https://krousetravel.com/groups/view/?groupid=190",
    eventPageUrl: "https://krousetravel.com/groups/view/?groupid=190",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "9:30 AM – 12:00 PM ET or 1:30 PM – 4:15 PM ET (7:30–10:00 AM / 11:30 AM–2:15 PM MT)",
    cohortDescription:
      "Milestone retirement celebration group (friends, extended family & colleagues from Pennsylvania)",
    cruiseLine: "Norwegian Cruise Line",
    hostedCruiseAndSailing:
      "Norwegian Luna · Jun 5–12, 2027 (7N RT New York to Bermuda)",
    shipName: "Norwegian Luna",
    shipSlug: "norwegian-luna",
    sailDate: "2027-06-05",
    returnDate: "2027-06-12",
    portWindowsSummary:
      "Sat Jun 5 Dep New York 16:00 · Sun Sea · Mon Jun 7 – Wed Jun 9 Docked 3 Days at Royal Naval Dockyard, Bermuda (arr Mon 08:00, dep Wed 15:00) · Thu–Fri Sea",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against NCL Norwegian Luna 7N Bermuda from New York schedule & krousetravel.com/groups/view/?groupid=190.",
    utmSource: "krouse_bermuda_retirement",
    sailingPageUrl: buildSailingUtmUrl("norwegian-luna", "2027-06-05", "krouse_bermuda_retirement"),
    valueToPitchSummary:
      "Three consecutive days docked overnight at Royal Naval Dockyard, Bermuda is the #1 multi-day milestone coordination challenge—guests split between golf, Horseshoe Bay beach, catamaran sails, and a retirement dinner, and Krouse Travel hosts 10+ group cruises.",
    phoneOpeningScript:
      "Hi Vickie — this is Erich with Cruise Promenade calling about Krouse Travel's June 5, 2027 Norwegian Luna Bermuda Retirement group. With three straight days docked in Bermuda, milestone groups always ask 'who is going to Horseshoe Bay or doing a catamaran when?'—we built a free shared page for that exact sailing so Tammy's group can coordinate all three Bermuda days and save an offline pack without touching your Krouse Travel bookings. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Vickie, Erich with Cruise Promenade calling about Krouse Travel's June 5, 2027 Norwegian Luna Bermuda Retirement group. We built a free shared cruise page for that exact sailing so Tammy's friends and family can coordinate across all three days docked in Bermuda without interfering with your agency bookings. Happy to email vseverhart@krousetravel.com!",
    phoneOrTextScript: `Hi Vickie — calling about Krouse Travel's Jun 5–12, 2027 Norwegian Luna Bermuda Retirement Group. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("norwegian-luna", "2027-06-05", "krouse_bermuda_retirement")}`,
    likelyObjection:
      "We also arrange private motorcoach transport from Pennsylvania to the Manhattan cruise pier.",
    objectionResponse:
      "You can post the Pennsylvania motorcoach departure and return details right on Embarkation and Disembarkation days so every guest has it in their offline Cruise Pack.",
    emailSubject:
      "Free 3-day Bermuda coordination board for your Jun 5 Norwegian Luna Group",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Vickie,",
      introLine:
        "Following up regarding Krouse Travel's hosted June 5–12, 2027 Bermuda Retirement Cruise aboard Norwegian Luna out of New York.",
      sailingUrl: buildSailingUtmUrl("norwegian-luna", "2027-06-05", "krouse_bermuda_retirement"),
      utmSource: "krouse_bermuda_retirement",
      scheduleNote:
        "It maps all three days docked at Royal Naval Dockyard (Mon Jun 7 08:00 through Wed Jun 9 15:00), lets you add your PA motorcoach transfer times and retirement celebration dinner, and never interferes with Krouse Travel's bookings.",
    }),
    recommendedNextAction:
      "Call Vickie Everhart at (717) 244-6410 during Pennsylvania business hours; note Krouse Travel's broader hosted-group roster.",
    outreachStatus: "ready_to_call",
    notes:
      "Established PA Brick-and-Mortar Group Travel Agency with a public `/groups/` directory of 10+ hosted departures. 0 outreach messages sent.",
  },
  {
    leadId: "bribeck_sowers_cruise",
    priorityRank: 20,
    leadName: "BriBeck Travel — SOWERS 2027 Western Caribbean Group Cruise",
    contactName: "Becki Bozart",
    organizerRole: "Master Cruise Counselor & Owner, BriBeck Travel (Cruise Planners)",
    phone: "(971) 340-8660",
    phoneInvitesText: false,
    email: "becki.bozart@cruiseplanners.com",
    altEmails: [],
    contactPageUrl: "https://www.bribecktravel.com/ContactUs",
    officialUrl: "https://www.bribecktravel.com/GroupRegistrations/view/139004",
    eventPageUrl: "https://www.bribecktravel.com/GroupRegistrations/view/139004",
    contactTimezone: "America/Los_Angeles (PT)",
    bestCallingWindow: "9:30 AM – 12:00 PM PT or 1:30 PM – 4:30 PM PT (10:30 AM–1:00 PM / 2:30–5:30 PM MT)",
    cohortDescription:
      "SOWERS RV ministry fellowship members & spouses gathering from across the US in Galveston",
    cruiseLine: "Royal Caribbean International",
    hostedCruiseAndSailing:
      "Symphony of the Seas · Mar 28 – Apr 4, 2027 (7N RT Galveston)",
    shipName: "Symphony of the Seas",
    shipSlug: "symphony-of-the-seas",
    sailDate: "2027-03-28",
    returnDate: "2027-04-04",
    portWindowsSummary:
      "Sun Mar 28 Dep Galveston 16:00 · Mon–Tue Sea · Wed Costa Maya 08:00–17:00 · Thu Roatan 07:00–16:00 · Fri Cozumel 07:00–17:00 · Sat Sea",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Royal Caribbean Symphony of the Seas 7N Western Caribbean schedule & bribecktravel.com/GroupRegistrations/view/139004.",
    utmSource: "bribeck_sowers_cruise",
    sailingPageUrl: buildSailingUtmUrl("symphony-of-the-seas", "2027-03-28", "bribeck_sowers_cruise"),
    valueToPitchSummary:
      "SOWERS members are retired RVers converging from dozens of states who value fellowship, simple no-password tools, and a printable paper schedule for devotions, group dinners, and excursions in Costa Maya, Roatan, and Cozumel.",
    phoneOpeningScript:
      "Hi Becki — this is Erich with Cruise Promenade calling about your March 28, 2027 SOWERS group cruise on Symphony of the Seas out of Galveston. Since SOWERS members are coming in from all over the country, we built a free shared page and printable PDF Cruise Pack for that exact sailing so couples can see which Costa Maya, Roatan, and Cozumel excursions friends are joining without logins or touching your Cruise Planners bookings. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Becki, Erich with Cruise Promenade calling about your March 28, 2027 SOWERS group cruise on Symphony of the Seas. We built a free shared page and printable Cruise Pack for that exact Galveston sailing so SOWERS couples can coordinate excursions and fellowship meetups with zero interference with your Cruise Planners bookings. Happy to email becki.bozart@cruiseplanners.com!",
    phoneOrTextScript: `Hi Becki — calling about your Mar 28 – Apr 4, 2027 SOWERS Group Cruise on Symphony of the Seas. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("symphony-of-the-seas", "2027-03-28", "bribeck_sowers_cruise")}`,
    likelyObjection:
      "Our SOWERS members won't want to create accounts or wrestle with a complicated app.",
    objectionResponse:
      "Zero accounts, zero passwords, and zero app install—plus one click prints a large, clear PDF Cruise Pack they can tuck into their lanyard folder.",
    emailSubject:
      "Free printable & shared group board for the Mar 28 SOWERS Symphony of the Seas Cruise",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Becki,",
      introLine:
        "Following up regarding the SOWERS March 28 – April 4, 2027 group cruise aboard Symphony of the Seas roundtrip from Galveston.",
      sailingUrl: buildSailingUtmUrl("symphony-of-the-seas", "2027-03-28", "bribeck_sowers_cruise"),
      utmSource: "bribeck_sowers_cruise",
      scheduleNote:
        "Couples can open one link (no password or app needed), see fellowship meetups and excursions in Costa Maya, Roatan, and Cozumel, attach your Cruise Planners excursion links, and print a clean PDF Cruise Pack.",
    }),
    recommendedNextAction:
      "Call Becki Bozart at (971) 340-8660 during Pacific morning/afternoon hours.",
    outreachStatus: "ready_to_call",
    notes:
      "Tightly knit national ministry fellowship group hosted by Master Cruise Counselor Becki Bozart. 0 outreach messages sent.",
  },
  {
    leadId: "welcome_home_kristi",
    priorityRank: 21,
    leadName: "Welcome Home Travel & Tours — Cruise with Kristi 2027",
    contactName: "Kristy Meyer",
    organizerRole: "Travel Manager & Group Host, Welcome Home Rio Grande Valley",
    phone: "(956) 687-5115",
    phoneInvitesText: false,
    email: "travel@welcomehomergv.com",
    altEmails: ["info@welcomehomergv.com"],
    contactPageUrl: "https://welcomehomergv.com/contact-travel-tours/",
    officialUrl: "https://welcomehomergv.com/tours-travel/cruise-vacations/cruisewithkristi/",
    eventPageUrl: "https://welcomehomergv.com/tours-travel/cruise-vacations/cruisewithkristi/",
    contactTimezone: "America/Chicago (CT)",
    bestCallingWindow: "9:30 AM – 12:00 PM CT or 1:30 PM – 4:15 PM CT (8:30–11:00 AM / 12:30–3:15 PM MT)",
    cohortDescription:
      "Rio Grande Valley Winter Texan & retiree community escorted motorcoach-to-ship group",
    cruiseLine: "Royal Caribbean International",
    hostedCruiseAndSailing:
      "Symphony of the Seas · Jan 31 – Feb 7, 2027 (7N RT Galveston)",
    shipName: "Symphony of the Seas",
    shipSlug: "symphony-of-the-seas",
    sailDate: "2027-01-31",
    returnDate: "2027-02-07",
    portWindowsSummary:
      "Sun Jan 31 Dep Galveston 16:00 · Mon Sea · Tue Roatan 10:00–18:00 · Wed Costa Maya 08:00–17:00 · Thu Cozumel 07:00–17:00 · Fri–Sat Sea",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Royal Caribbean Symphony of the Seas Jan 31, 2027 schedule & welcomehomergv.com/tours-travel/cruise-vacations/cruisewithkristi/.",
    utmSource: "welcome_home_kristi",
    sailingPageUrl: buildSailingUtmUrl("symphony-of-the-seas", "2027-01-31", "welcome_home_kristi"),
    valueToPitchSummary:
      "Annual escorted Winter Texan community cruise with motorcoach transport to Galveston—Kristy can publish bus pickup times, onboard cocktail parties, and optional shore excursions in Roatan, Costa Maya, and Cozumel in one printable pack.",
    phoneOpeningScript:
      "Hi Kristy — this is Erich with Cruise Promenade calling about your January 31, 2027 Cruise with Kristi group on Symphony of the Seas. For escorted community groups like Welcome Home RGV, we built a free shared page and printable PDF Cruise Pack for that exact Galveston sailing so your travelers can see Roatan, Costa Maya, and Cozumel excursions plus your bus and meetup times in one place without touching your package sales. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Kristy, Erich at Cruise Promenade calling about your January 31, 2027 Cruise with Kristi group on Symphony of the Seas. We built a free shared cruise page and printable offline schedule for that exact sailing so your Welcome Home RGV travelers can coordinate shore outings and group meetups easily. Happy to email travel@welcomehomergv.com!",
    phoneOrTextScript: `Hi Kristy — calling about your Jan 31 – Feb 7, 2027 Cruise with Kristi group on Symphony of the Seas. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("symphony-of-the-seas", "2027-01-31", "welcome_home_kristi")}`,
    likelyObjection:
      "We already hand out a printed itinerary letter on the motorcoach.",
    objectionResponse:
      "That's awesome—before the bus even rolls, this lets couples see which Roatan, Costa Maya, or Cozumel excursions their friends are booking so they can get on the same departure, then print the updated sheet.",
    emailSubject:
      "Free shared excursion & printable board for Cruise with Kristi (Jan 31 Symphony of the Seas)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Kristy,",
      introLine:
        "Following up regarding Welcome Home RGV's escorted January 31 – February 7, 2027 Cruise with Kristi aboard Symphony of the Seas from Galveston.",
      sailingUrl: buildSailingUtmUrl("symphony-of-the-seas", "2027-01-31", "welcome_home_kristi"),
      utmSource: "welcome_home_kristi",
      scheduleNote:
        "It lets Welcome Home RGV travelers see which Roatan, Costa Maya, and Cozumel departures friends are joining before sailing, keeps your escorted meetup and motorcoach notes in one place, and prints cleanly to PDF.",
    }),
    recommendedNextAction:
      "Call Kristy Meyer at (956) 687-5115 during Texas Central Time hours.",
    outreachStatus: "ready_to_call",
    notes:
      "High-trust escorted community group in South Texas; annual repeat hosted cruise series. 0 outreach messages sent.",
  },
  {
    leadId: "quick_quick_slow_med",
    priorityRank: 22,
    leadName: "Quick Quick Slow Travel — 2027 Mediterranean Dance Cruise",
    contactName: "Nino & Dawn DiGiulio",
    organizerRole: "Owners & Lead Dance Hosts, May I Have This Dance / Quick Quick Slow Travel",
    phone: "(773) 635-3000",
    phoneInvitesText: false,
    email: "QuickQuickSlowTravel@gmail.com",
    altEmails: ["info@mayihavethisdance.com"],
    contactPageUrl: "https://www.quickquickslowtravel.com/aboutus",
    officialUrl: "https://www.quickquickslowtravel.com/dancecruises",
    eventPageUrl: "https://www.quickquickslowtravel.com/dancecruises",
    contactTimezone: "America/Chicago (CT)",
    bestCallingWindow: "11:00 AM – 4:30 PM CT (10:00 AM – 3:30 PM MT; Chicago dance studio daytime office)",
    cohortDescription:
      "Ballroom, Latin & swing dancers from Chicago's largest dance studio sailing 7N Barcelona to Rome",
    cruiseLine: "Norwegian Cruise Line",
    hostedCruiseAndSailing:
      "Norwegian Epic · Oct 17–24, 2027 (7N Barcelona to Civitavecchia/Rome)",
    shipName: "Norwegian Epic",
    shipSlug: "norwegian-epic",
    sailDate: "2027-10-17",
    returnDate: "2027-10-24",
    portWindowsSummary:
      "Sun Oct 17 Dep Barcelona 17:00 · Mon Palma de Mallorca · Tue La Goulette (Tunis) · Wed Valletta (Malta) · Thu Messina/Palermo (Sicily) · Fri Naples · Sat Livorno (Florence/Pisa) · Sun Rome",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified match against NCL Norwegian Epic Oct 17, 2027 7N Western Mediterranean schedule & quickquickslowtravel.com/dancecruises.",
    utmSource: "quick_quick_slow_med",
    sailingPageUrl: buildSailingUtmUrl("norwegian-epic", "2027-10-17", "quick_quick_slow_med"),
    valueToPitchSummary:
      "Port-intensive Mediterranean itinerary (Barcelona, Palma, Malta, Sicily, Naples, Florence/Pisa, Rome) where dancers split into small van/train/excursion groups by day and reunite for private studio dance parties at night.",
    phoneOpeningScript:
      "Hi — this is Erich with Cruise Promenade calling for Nino or Dawn DiGiulio about your October 17, 2027 Mediterranean Dance Cruise on Norwegian Epic. On port-packed Med weeks from Barcelona to Rome, dancers are always trying to coordinate Naples, Sicily, and Florence excursions without missing evening dance sessions—we built a free shared page for that exact sailing that keeps everything offline without touching your group bookings. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Nino and Dawn, Erich with Cruise Promenade calling about Quick Quick Slow Travel's October 17, 2027 Norwegian Epic Mediterranean Dance Cruise. We built a free shared page for that exact sailing so your dancers can coordinate Mediterranean shore excursions around your evening dance events and carry an offline schedule. Happy to email QuickQuickSlowTravel@gmail.com!",
    phoneOrTextScript: `Hi Nino & Dawn — calling about your Oct 17–24, 2027 Mediterranean Dance Cruise on Norwegian Epic. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("norwegian-epic", "2027-10-17", "quick_quick_slow_med")}`,
    likelyObjection:
      "October 2027 is still a ways out for booking shore excursions.",
    objectionResponse:
      "Med excursions and private Rome/Florence vans sell out months ahead—sharing the board early builds excitement in your studio and helps dancers commit with friends.",
    emailSubject:
      "Free Mediterranean excursion & dance schedule board for Oct 17 Norwegian Epic",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Nino & Dawn,",
      introLine:
        "Following up regarding Quick Quick Slow Travel's October 17–24, 2027 Mediterranean Dance Cruise aboard Norwegian Epic from Barcelona to Rome.",
      sailingUrl: buildSailingUtmUrl("norwegian-epic", "2027-10-17", "quick_quick_slow_med"),
      utmSource: "quick_quick_slow_med",
      scheduleNote:
        "Dancers can see who is joining excursions in Palma, Malta, Sicily, Naples, and Florence/Pisa while keeping your private onboard dance parties locked into an offline Cruise Pack (avoiding European roaming or ship Wi-Fi surprises).",
    }),
    recommendedNextAction:
      "Call May I Have This Dance / Quick Quick Slow Travel at (773) 635-3000 mid-day CT.",
    outreachStatus: "ready_to_call",
    notes:
      "Backed by Chicago's May I Have This Dance studio; runs recurring hosted dance cruises. 0 outreach messages sent.",
  },
  {
    leadId: "alice_travel_bridge",
    priorityRank: 23,
    leadName: "Larry Cohen's Regional at Sea / Alice Travel Bridge Cruises",
    contactName: "Robert Todd & Larry Cohen (Alice Travel Bridge Desk)",
    organizerRole: "Bridge Cruise Hosts & Dedicated Bridge Desk, Alice Travel",
    phone: "(973) 439-1700",
    phoneInvitesText: false,
    email: "sales@alicetravel.com",
    altEmails: [],
    contactPageUrl: "https://alicetravelbridgecruises.com/contact",
    officialUrl: "https://alicetravelbridgecruises.com/bridge-cruises/cruise-the-caribbean-from-texas-play-bridge-all-week",
    eventPageUrl: "https://alicetravelbridgecruises.com/bridge-cruises/cruise-the-caribbean-from-texas-play-bridge-all-week",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "9:30 AM – 12:00 PM ET or 1:30 PM – 4:30 PM ET (7:30–10:00 AM / 11:30 AM–2:30 PM MT)",
    cohortDescription:
      "Duplicate bridge players & spouses earning ACBL Gold/Red Masterpoints on a 7N Galveston cruise",
    cruiseLine: "Royal Caribbean International",
    hostedCruiseAndSailing:
      "Symphony of the Seas · Apr 11–18, 2027 (7N RT Galveston)",
    shipName: "Symphony of the Seas",
    shipSlug: "symphony-of-the-seas",
    sailDate: "2027-04-11",
    returnDate: "2027-04-18",
    portWindowsSummary:
      "Sun Apr 11 Dep Galveston 16:00 · Mon–Tue Sea (ACBL tournament sessions) · Wed Costa Maya 08:00–17:00 · Thu Roatan 07:00–16:00 · Fri Cozumel 07:00–17:00 · Sat Sea (bridge sessions)",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Royal Caribbean Symphony of the Seas Apr 11, 2027 schedule & alicetravelbridgecruises.com.",
    utmSource: "alice_travel_bridge",
    sailingPageUrl: buildSailingUtmUrl("symphony-of-the-seas", "2027-04-11", "alice_travel_bridge"),
    valueToPitchSummary:
      "Bridge players live by exact tournament session times (morning lectures + afternoon/evening duplicate games) and love printable paper schedules—gives players and non-playing spouses one clean board for Costa Maya, Roatan, and Cozumel.",
    phoneOpeningScript:
      "Hi — this is Erich with Cruise Promenade calling for the Alice Travel Bridge Cruise desk about Larry Cohen and Robert Todd's April 11, 2027 Regional at Sea on Symphony of the Seas. Bridge players love knowing exact lecture, game, and excursion times—we built a free shared page and printable PDF Cruise Pack for that exact Galveston sailing without touching Alice Travel's bookings. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Alice Travel Bridge Desk, Erich with Cruise Promenade calling about your April 11, 2027 Symphony of the Seas Regional at Sea bridge cruise. We built a free shared page and printable PDF Cruise Pack for that exact sailing so bridge players and spouses can coordinate Costa Maya, Roatan, and Cozumel excursions around game times without touching your agency bookings. Happy to email sales@alicetravel.com!",
    phoneOrTextScript: `Hi Alice Travel Bridge Desk — calling about the Apr 11–18, 2027 Regional at Sea Bridge Cruise on Symphony of the Seas. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("symphony-of-the-seas", "2027-04-11", "alice_travel_bridge")}`,
    likelyObjection:
      "Alice Travel is a full-service Virtuoso agency managing all shore excursions and bookings.",
    objectionResponse:
      "Alice Travel can paste its own Virtuoso or private group excursion links directly onto each port day—Cruise Promenade never sells cabins or competes with your advisors.",
    emailSubject:
      "Free printable bridge & excursion board for Apr 11 Symphony of the Seas (Regional at Sea)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Alice Travel Bridge Cruises Desk,",
      introLine:
        "Following up regarding Larry Cohen & Robert Todd's April 11–18, 2027 Regional at Sea aboard Symphony of the Seas out of Galveston.",
      sailingUrl: buildSailingUtmUrl("symphony-of-the-seas", "2027-04-11", "alice_travel_bridge"),
      utmSource: "alice_travel_bridge",
      scheduleNote:
        "Players and spouses can view morning bridge lectures, Gold/Red point game sessions, and excursions in Costa Maya, Roatan, and Cozumel on one board—and print a clean paper PDF Cruise Pack before boarding.",
    }),
    recommendedNextAction:
      "Call (973) 439-1700 (toll-free 888-816-2457) during NJ business hours and ask for the Bridge Cruise Coordinator.",
    outreachStatus: "ready_to_call",
    notes:
      "Alice Travel operates dozens of Larry Cohen Regional at Sea bridge cruises annually. 0 outreach messages sent.",
  },
  {
    leadId: "travel_with_donna_baltic",
    priorityRank: 24,
    leadName: "Travel with Donna LLC — 2027 Scandinavian & Baltic Hosted Cruise",
    contactName: "Donna Peterson",
    organizerRole: "Owner & Certified Travel Advisor, Travel with Donna LLC",
    phone: "(609) 822-2244",
    phoneInvitesText: false,
    email: "donna@travelwithdonna.vip",
    altEmails: ["Info@TravelwithDonna.vip"],
    contactPageUrl: "https://www.travelwithdonna.vip/contact",
    officialUrl: "https://www.travelwithdonna.vip/hosted-cruises",
    eventPageUrl: "https://www.travelwithdonna.vip/hosted-cruises",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "10:00 AM – 12:30 PM ET or 2:00 PM – 4:30 PM ET (8:00–10:30 AM / 12:00–2:30 PM MT)",
    cohortDescription:
      "Advisor-escorted luxury & upper-premium repeat clients sailing 13 nights roundtrip from Southampton",
    cruiseLine: "Celebrity Cruises",
    hostedCruiseAndSailing:
      "Celebrity Apex · May 15–28, 2027 (13N RT Southampton — Best of Scandinavia)",
    shipName: "Celebrity Apex",
    shipSlug: "celebrity-apex",
    sailDate: "2027-05-15",
    returnDate: "2027-05-28",
    portWindowsSummary:
      "Sat May 15 Dep Southampton · Copenhagen (overnight) · Helsinki · Tallinn · Stockholm · Visby · Oslo · Kristiansand · Fri May 28 Southampton",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Celebrity Apex May 15, 2027 13N Best of Scandinavia schedule & travelwithdonna.vip/hosted-cruises.",
    utmSource: "travel_with_donna_baltic",
    sailingPageUrl: buildSailingUtmUrl("celebrity-apex", "2027-05-15", "travel_with_donna_baltic"),
    valueToPitchSummary:
      "13-night multi-country Baltic itinerary with an overnight in Copenhagen plus Helsinki, Tallinn, Stockholm, Visby, and Oslo—gives Donna's hosted group a white-glove shared schedule + offline pack across 6 European countries.",
    phoneOpeningScript:
      "Hi Donna — this is Erich with Cruise Promenade calling about your May 15, 2027 Hosted Scandinavia & Baltic group on Celebrity Apex. On a 13-night Southampton sailing with an overnight in Copenhagen plus Stockholm, Tallinn, and Oslo, we built a free shared page for that exact voyage so your hosted clients can see which excursions everyone is joining and keep an offline pack without touching your bookings. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Donna, Erich with Cruise Promenade calling about your May 15, 2027 Celebrity Apex Hosted Scandinavia cruise. We built a free shared cruise page for that exact 13-night sailing so your clients can coordinate Baltic excursions, paste your preferred booking links, and carry an offline Cruise Pack abroad. Happy to email donna@travelwithdonna.vip!",
    phoneOrTextScript: `Hi Donna — calling about your May 15–28, 2027 Hosted Scandinavia Cruise on Celebrity Apex. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("celebrity-apex", "2027-05-15", "travel_with_donna_baltic")}`,
    likelyObjection:
      "I curate private excursions for my hosted clients and want my own links used.",
    objectionResponse:
      "You own the board—add your private Tallinn or Stockholm guides and your own booking links right onto each port day so clients stay inside your hosted ecosystem.",
    emailSubject:
      "Free hosted-client schedule & excursion board for May 15 Celebrity Apex (Scandinavia)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Donna,",
      introLine:
        "Following up regarding your hosted May 15–28, 2027 Best of Scandinavia voyage aboard Celebrity Apex roundtrip from Southampton.",
      sailingUrl: buildSailingUtmUrl("celebrity-apex", "2027-05-15", "travel_with_donna_baltic"),
      utmSource: "travel_with_donna_baltic",
      scheduleNote:
        "It maps all 13 nights—including the Copenhagen overnight, Helsinki, Tallinn, Stockholm, Visby, and Oslo—lets you attach your own curated tour links, and gives your travelers an offline Cruise Pack across Northern Europe.",
    }),
    recommendedNextAction:
      "Call Donna Peterson at (609) 822-2244 (note: site also publishes SMS-enabled line 609-287-2870 for follow-up if requested).",
    outreachStatus: "ready_to_call",
    notes:
      "Hands-on hosted cruise specialist with multiple 2027 hosted sailings listed on travelwithdonna.vip/hosted-cruises. 0 outreach messages sent.",
  },
  {
    leadId: "moody_radio_alaska",
    priorityRank: 25,
    leadName: "Moody Radio — 2027 Alaska 100th Anniversary Cruise",
    contactName: "Wes Ward & Moody Radio Events Desk",
    organizerRole: "VP of Moody Global Media & Ministry Events Team",
    phone: "(312) 329-4300",
    phoneInvitesText: false,
    email: "moodyradio@moody.edu",
    altEmails: [],
    contactPageUrl: "https://www.moodyradio.org/landing-pages/cruise/",
    officialUrl: "https://www.moodyradio.org/landing-pages/cruise/",
    eventPageUrl: "https://www.moodyradio.org/landing-pages/cruise/",
    contactTimezone: "America/Chicago (CT)",
    bestCallingWindow: "9:30 AM – 12:00 PM CT or 1:30 PM – 4:00 PM CT (8:30–11:00 AM / 12:30–3:00 PM MT)",
    cohortDescription:
      "Moody Radio listeners, ministry supporters & families celebrating Moody Radio's 100th anniversary",
    cruiseLine: "Holland America Line",
    hostedCruiseAndSailing:
      "Eurodam · Jun 5–12, 2027 (7N RT Seattle — Glacier Bay Alaska)",
    shipName: "Eurodam",
    shipSlug: "eurodam",
    sailDate: "2027-06-05",
    returnDate: "2027-06-12",
    portWindowsSummary:
      "Sat Jun 5 Dep Seattle 15:00 · Sun Sea (teaching/worship) · Mon Juneau 12:30–22:00 · Tue Glacier Bay & Icy Strait Point 18:00–22:00 · Wed Sitka 08:00–16:00 · Thu Ketchikan 07:00–13:00 · Fri Victoria 20:00–23:59",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Holland America Eurodam 7N Alaska Explorer schedule & moodyradio.org/landing-pages/cruise/.",
    utmSource: "moody_radio_alaska",
    sailingPageUrl: buildSailingUtmUrl("eurodam", "2027-06-05", "moody_radio_alaska"),
    valueToPitchSummary:
      "Centennial listener cruise with morning/sea-day Bible teaching and worship concerts plus distinctive Alaska port hours (Juneau 12:30–22:00, Icy Strait evening, Ketchikan morning)—printable PDF + shared excursion board serves couples and multi-generational families.",
    phoneOpeningScript:
      "Hi — this is Erich with Cruise Promenade calling for the Moody Radio 100th Anniversary Cruise events desk about your June 5, 2027 Alaska sailing on Holland America's Eurodam. We built a free shared page and printable PDF Cruise Pack for that exact Seattle sailing so listeners can keep worship and teaching sessions alongside afternoon Juneau, Sitka, and Ketchikan excursions without touching Inspiration Cruises' bookings. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Moody Radio events team, Erich with Cruise Promenade calling about your June 5, 2027 100th Anniversary Alaska Cruise on Eurodam. We built a free shared page and printable Cruise Pack for that exact sailing so listeners can coordinate Alaska shore excursions around your onboard teaching and concerts without interfering with Inspiration Travel. Happy to email moodyradio@moody.edu!",
    phoneOrTextScript: `Hi Moody Radio Events Team — calling about the Jun 5–12, 2027 100th Anniversary Alaska Cruise on Eurodam. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("eurodam", "2027-06-05", "moody_radio_alaska")}`,
    likelyObjection:
      "Inspiration Cruises & Tours manages our registration and onboard ministry venues.",
    objectionResponse:
      "Inspiration keeps 100% of registrations and programming—this is simply an optional, free companion schedule and excursion buddy board if you or Inspiration want listeners connecting ashore.",
    emailSubject:
      "Free printable & shared listener board for Moody Radio's Jun 5, 2027 Eurodam Alaska Cruise",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Moody Radio Events Team,",
      introLine:
        "Congratulations on Moody Radio's upcoming 100th Anniversary Alaska Cruise aboard Holland America's Eurodam (June 5–12, 2027 from Seattle).",
      sailingUrl: buildSailingUtmUrl("eurodam", "2027-06-05", "moody_radio_alaska"),
      utmSource: "moody_radio_alaska",
      scheduleNote:
        "It maps afternoon/evening Juneau (12:30–22:00), Glacier Bay + evening Icy Strait Point, Sitka (08:00–16:00), and morning Ketchikan (07:00–13:00), prints cleanly to PDF, and never interferes with Inspiration Cruises & Tours.",
    }),
    recommendedNextAction:
      "Call Moody Radio headquarters at (312) 329-4300 (or cruise partner desk 855-466-2484) during Central Time hours.",
    outreachStatus: "ready_to_call",
    notes:
      "Major 100th-anniversary listener cruise with Pastor Karl Clauson & Wes Ward. 0 outreach messages sent.",
  },
  {
    leadId: "templeton_singing_at_sea",
    priorityRank: 26,
    leadName: "Templeton Tours — 2027 Singing at Sea Christian Gospel Cruise",
    contactName: "Jeff & Amy Templeton",
    organizerRole: "Owners, Templeton Tours, Inc.",
    phone: "(800) 334-2630",
    phoneInvitesText: false,
    email: "info@templetontours.com",
    altEmails: [],
    contactPageUrl: "https://templetontours.com/aboutus.shtml",
    officialUrl: "https://templetontours.com/singingatsea/",
    eventPageUrl: "https://templetontours.com/singingatsea/",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "9:30 AM – 12:00 PM ET or 1:30 PM – 4:30 PM ET Mon–Fri (7:30–10:00 AM / 11:30 AM–2:30 PM MT)",
    cohortDescription:
      "Southern Gospel church groups, choirs & families on the 53rd annual Singing at Sea charter/group",
    cruiseLine: "Carnival Cruise Line",
    hostedCruiseAndSailing:
      "Carnival Glory · Jan 25–30, 2027 (5N RT Port Canaveral)",
    shipName: "Carnival Glory",
    shipSlug: "carnival-glory",
    sailDate: "2027-01-25",
    returnDate: "2027-01-30",
    portWindowsSummary:
      "Mon Jan 25 Dep Port Canaveral 15:30 · Tue Princess Cays 09:00–17:00 · Wed Sea (Gospel concerts) · Thu Grand Turk 08:00–16:00 · Fri Sea (concerts) · Sat Port Canaveral",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Carnival Glory 5N Bahamas/Eastern Caribbean schedule & templetontours.com/singingatsea/.",
    utmSource: "templeton_singing_at_sea",
    sailingPageUrl: buildSailingUtmUrl("carnival-glory", "2027-01-25", "templeton_singing_at_sea"),
    valueToPitchSummary:
      "Dozens of individual church groups travel inside Singing at Sea—each church youth/senior leader or the Templeton team can spin up a free private printable board for Princess Cays, Grand Turk, and showcase concert times.",
    phoneOpeningScript:
      "Hi — this is Erich with Cruise Promenade calling for Jeff or Amy Templeton's team about the January 25, 2027 Singing at Sea cruise on Carnival Glory. Because church groups aboard love keeping concert times and shore outings in Princess Cays and Grand Turk organized on one printable sheet, we built a free shared page for that exact sailing that never interferes with Templeton Tours' cabin sales. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Jeff and Amy's team at Templeton Tours, Erich with Cruise Promenade calling about the January 25, 2027 Singing at Sea cruise on Carnival Glory. We built a free shared page and printable Cruise Pack for that exact Port Canaveral sailing so your church groups can coordinate Princess Cays and Grand Turk outings around your Gospel concerts. Happy to email info@templetontours.com!",
    phoneOrTextScript: `Hi Templeton Tours Team — calling about the Jan 25–30, 2027 Singing at Sea Cruise on Carnival Glory. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("carnival-glory", "2027-01-25", "templeton_singing_at_sea")}`,
    likelyObjection:
      "All bookings must be made directly through Templeton Tours—no outside cruise agencies allowed.",
    objectionResponse:
      "100% respected—Cruise Promenade is not a cruise agency and sells zero cabins. Both Templeton Tours and individual church group leaders aboard your sailing can use it purely as a free group schedule and printable Cruise Pack.",
    emailSubject:
      "Free printable church-group & port board for Singing at Sea (Jan 25 Carnival Glory)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Jeff, Amy & Templeton Tours Team,",
      introLine:
        "Following up regarding the January 25–30, 2027 Singing at Sea voyage aboard Carnival Glory out of Port Canaveral.",
      sailingUrl: buildSailingUtmUrl("carnival-glory", "2027-01-25", "templeton_singing_at_sea"),
      utmSource: "templeton_singing_at_sea",
      scheduleNote:
        "Individual church leaders or your team can keep Princess Cays (Tue), Grand Turk (Thu), and sea-day Gospel concert sessions on one shared link and printable PDF Cruise Pack, with zero interference with Templeton Tours' exclusive cabin bookings.",
    }),
    recommendedNextAction:
      "Call Templeton Tours at (800) 334-2630 during Eastern Time weekday hours.",
    outreachStatus: "ready_to_call",
    notes:
      "Family-owned Christian group operator since 1974; single relationship reaches dozens of sub-church group leaders. 0 outreach messages sent.",
  },
  {
    leadId: "craft_cruises_japan",
    priorityRank: 27,
    leadName: "Craft Cruises® — 14-Day Circle Japan Knitting Cruise 2027",
    contactName: "Melissa Gower",
    organizerRole: "Founder & Group Cruise Specialist, Craft Cruises®",
    phone: "(877) 972-7238",
    phoneInvitesText: false,
    email: "privacy@craftcruises.com",
    altEmails: [],
    contactPageUrl: "https://www.craftcruises.com/contact_us.php",
    officialUrl: "https://www.craftcruises.com/cruise.php?brand=Knitting%20Cruises&cruise_name=Circle%20Japan&cruise_line=Holland%20America%20Line&cruise_ship=ms%20Westerdam&dep_date=2027-04-11&cruise=231",
    eventPageUrl: "https://www.craftcruises.com/cruise.php?brand=Knitting%20Cruises&cruise_name=Circle%20Japan&cruise_line=Holland%20America%20Line&cruise_ship=ms%20Westerdam&dep_date=2027-04-11&cruise=231",
    contactTimezone: "America/Denver (MT)",
    bestCallingWindow: "9:30 AM – 12:00 PM MT or 1:30 PM – 4:30 PM MT (Colorado office — same timezone as Denver)",
    cohortDescription:
      "Knitters, fiber-arts travelers & spouses on an instructor-led 14-night Circle Japan voyage",
    cruiseLine: "Holland America Line",
    hostedCruiseAndSailing:
      "Westerdam · Apr 11–25, 2027 (14N RT Tokyo/Yokohama)",
    shipName: "Westerdam",
    shipSlug: "westerdam",
    sailDate: "2027-04-11",
    returnDate: "2027-04-25",
    portWindowsSummary:
      "Sun Apr 11 Dep Yokohama (Tokyo) · Sea-day knitting workshops + Osaka/Kyoto, Kochi, Kanazawa, Niigata, Hakodate, Aomori, Sokcho · Sun Apr 25 Yokohama",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Holland America Westerdam Apr 11, 2027 14N Circle Japan schedule & craftcruises.com.",
    utmSource: "craft_cruises_japan",
    sailingPageUrl: buildSailingUtmUrl("westerdam", "2027-04-11", "craft_cruises_japan"),
    valueToPitchSummary:
      "Colorado-based specialty operator running 15+ global knitting cruises a year—on a 14-night Japan voyage, knitters and non-knitting spouses juggle yarn-shop outings, sightseeing excursions, and sea-day classes across international cellular zones where offline packs shine.",
    phoneOpeningScript:
      "Hi Melissa — this is Erich with Cruise Promenade calling here in Colorado about Craft Cruises' April 11, 2027 Circle Japan Knitting Cruise on Westerdam. On a 14-night Japan itinerary where knitters and spouses split between yarn-shop outings, sightseeing excursions, and sea-day classes, we built a free shared page and offline Cruise Pack for that exact sailing without touching your package bookings. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Melissa, Erich with Cruise Promenade calling from Colorado about Craft Cruises' April 11, 2027 Westerdam Circle Japan Knitting Cruise. We built a free shared page and printable offline Cruise Pack for that exact 14-night sailing so your knitters and companions can coordinate shore excursions and class times without international roaming or touching your bookings. My number is on caller ID!",
    phoneOrTextScript: `Hi Melissa — calling about Craft Cruises' Apr 11–25, 2027 Circle Japan Knitting Cruise on Westerdam. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("westerdam", "2027-04-11", "craft_cruises_japan")}`,
    likelyObjection:
      "We already organize custom yarn-crawl excursions in select ports for our group.",
    objectionResponse:
      "You can list your private Craft Cruises yarn crawls right on the board as the organizer-designated group activity while letting spouses and guests coordinate open port hours.",
    emailSubject:
      "Free offline & shared schedule board for Craft Cruises' Apr 11 Westerdam Japan Sailing",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Melissa,",
      introLine:
        "Following up from here in Colorado regarding Craft Cruises' April 11–25, 2027 Circle Japan Knitting Cruise aboard Holland America's Westerdam.",
      sailingUrl: buildSailingUtmUrl("westerdam", "2027-04-11", "craft_cruises_japan"),
      utmSource: "craft_cruises_japan",
      scheduleNote:
        "You can post your sea-day knitting classes and private yarn-shop excursions right alongside open Japanese port days so knitters and spouses carry one offline Cruise Pack without international data headaches.",
    }),
    recommendedNextAction:
      "Call Melissa Gower at (877) 972-7238 during Mountain Time hours (Steamboat/Colorado-based).",
    outreachStatus: "ready_to_call",
    notes:
      "Mountain Time specialty cruise operator with 15+ hosted fiber-arts sailings per year. 0 outreach messages sent.",
  },
  {
    leadId: "aquafest_halloween_ta",
    priorityRank: 28,
    leadName: "Aquafest Cruises — 26th Annual Halloween Transatlantic",
    contactName: "Tom Baker & Lori Herzog",
    organizerRole: "President/Founder & Senior Cruise Consultant, Aquafest Cruises",
    phone: "(800) 592-9058",
    phoneInvitesText: false,
    email: null,
    altEmails: [],
    contactPageUrl: "https://aquafestcruises.com/contact/",
    officialUrl: "https://aquafestcruises.com/cruise/52/17-nights-halloween-constellation-transatlantic-cruise-",
    eventPageUrl: "https://aquafestcruises.com/cruise/52/17-nights-halloween-constellation-transatlantic-cruise-",
    contactTimezone: "America/Chicago (CT)",
    bestCallingWindow: "10:00 AM – 12:30 PM CT or 1:30 PM – 4:30 PM CT (9:00–11:30 AM / 12:30–3:30 PM MT)",
    cohortDescription:
      "Flagship annual hosted LGBTQ+ & friends Halloween group sailing Rome to Tampa",
    cruiseLine: "Celebrity Cruises",
    hostedCruiseAndSailing:
      "Celebrity Constellation · Oct 29 – Nov 14, 2027 (16N Civitavecchia/Rome to Tampa)",
    shipName: "Celebrity Constellation",
    shipSlug: "celebrity-constellation",
    sailDate: "2027-10-29",
    returnDate: "2027-11-14",
    portWindowsSummary:
      "Fri Oct 29 Dep Rome (Civitavecchia) · Alicante · Malaga · Gibraltar · Casablanca · Atlantic Crossing sea days (costume events, socials, games) · Sun Nov 14 Tampa",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified match against Celebrity Constellation Oct 29, 2027 Rome-to-Tampa Transatlantic schedule & aquafestcruises.com.",
    utmSource: "aquafest_halloween_ta",
    sailingPageUrl: buildSailingUtmUrl("celebrity-constellation", "2027-10-29", "aquafest_halloween_ta"),
    valueToPitchSummary:
      "Aquafest's signature 26th-annual Halloween group spans Spanish/Moroccan ports plus transatlantic sea days packed with private Aquafest cocktail parties, costume balls, and trivia—an offline Cruise Pack keeps every private onboard event and excursion in guests' pockets.",
    phoneOpeningScript:
      "Hi — this is Erich with Cruise Promenade calling for Tom Baker or Lori Herzog about Aquafest's October 29, 2027 Halloween Constellation Transatlantic group. Between Alicante, Malaga, Gibraltar, Casablanca, and all your private Halloween and sea-day socials across the Atlantic, we built a free private-link cruise page and offline pack for that exact sailing without touching Aquafest's bookings. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Tom and Lori at Aquafest Cruises, Erich with Cruise Promenade calling about your October 29, 2027 Celebrity Constellation Halloween Transatlantic group. We built a free private-link cruise page and offline Cruise Pack for that exact sailing so your guests can coordinate European/Moroccan excursions and keep all your onboard Aquafest events offline across the Atlantic. My number is on caller ID!",
    phoneOrTextScript: `Hi Tom & Lori — calling about Aquafest's Oct 29, 2027 Celebrity Constellation Halloween Transatlantic group. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("celebrity-constellation", "2027-10-29", "aquafest_halloween_ta")}`,
    likelyObjection:
      "Transatlantic Wi-Fi can be spotty or pricey for guests checking an online schedule.",
    objectionResponse:
      "That's why we built 'Save final plan offline'—guests lock the schedule to their phone, calendar (.ics), or PDF before leaving Rome so every Aquafest party time works in airplane mode.",
    emailSubject:
      "Free offline & shared group board for Aquafest's Oct 29, 2027 Constellation Transatlantic",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Tom & Lori,",
      introLine:
        "Following up regarding Aquafest Cruises' 26th Annual Halloween Transatlantic group aboard Celebrity Constellation (October 29 – November 14, 2027 from Rome to Tampa).",
      sailingUrl: buildSailingUtmUrl("celebrity-constellation", "2027-10-29", "aquafest_halloween_ta"),
      utmSource: "aquafest_halloween_ta",
      scheduleNote:
        "Boards are private (noindex), let guests coordinate excursions in Alicante, Malaga, Gibraltar, and Casablanca, and lock all of your sea-day Aquafest parties into an offline Cruise Pack for the crossing.",
    }),
    recommendedNextAction:
      "Call Aquafest Cruises at (800) 592-9058 during Central Time hours and ask for Lori Herzog or Tom Baker.",
    outreachStatus: "ready_to_call",
    notes:
      "One of North America's longest-running LGBTQ+ hosted group cruise operators (26th annual flagship Halloween group). 0 outreach messages sent.",
  },
  {
    leadId: "living_passages_paul",
    priorityRank: 29,
    leadName: "Living Passages — 2027 Footsteps of Paul Bible Study Cruise",
    contactName: "Living Passages Cruise Desk (Hosts Pastor Shane Holden & Joel Richardson)",
    organizerRole: "Christian Cruise Tour Operator & Study Group Coordinators",
    phone: "(888) 771-8717",
    phoneInvitesText: false,
    email: null,
    altEmails: [],
    contactPageUrl: "https://livingpassages.com/contact/",
    officialUrl: "https://livingpassages.com/cruise/malta-greece-turkey-italy-footsteps-of-paul-cruise/",
    eventPageUrl: "https://livingpassages.com/cruise/malta-greece-turkey-italy-footsteps-of-paul-cruise/",
    contactTimezone: "America/Los_Angeles (PT)",
    bestCallingWindow: "8:30 AM – 3:30 PM PT (9:30 AM – 4:30 PM MT; published office hours 6 AM–4 PM PT)",
    cohortDescription:
      "Bible study travelers & couples sailing 10 nights Barcelona to Rome with custom biblical shore tours",
    cruiseLine: "Celebrity Cruises",
    hostedCruiseAndSailing:
      "Celebrity Equinox · Oct 16–26, 2027 (10N Barcelona to Civitavecchia/Rome)",
    shipName: "Celebrity Equinox",
    shipSlug: "celebrity-equinox",
    sailDate: "2027-10-16",
    returnDate: "2027-10-26",
    portWindowsSummary:
      "Sat Oct 16 Dep Barcelona 17:00 · Sea · Valletta (Malta) · Sea · Athens (Piraeus) · Santorini · Kusadasi (Ephesus) · Mykonos · Katakolon (Olympia) · Tue Oct 26 Rome",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Verified 100% match against Celebrity Equinox Oct 16, 2027 10N Greek Isles, Turkey & Malta schedule & livingpassages.com.",
    utmSource: "living_passages_paul",
    sailingPageUrl: buildSailingUtmUrl("celebrity-equinox", "2027-10-16", "living_passages_paul"),
    valueToPitchSummary:
      "Living Passages runs private custom biblical shore excursions (Mars Hill, Ephesus, Malta) plus onboard lectures—an organizer board lets their team publish exact private motorcoach staging times alongside free-afternoon ports like Mykonos and Santorini in an offline pack.",
    phoneOpeningScript:
      "Hi — this is Erich with Cruise Promenade calling for the Living Passages coordinator handling your October 16, 2027 Footsteps of Paul cruise on Celebrity Equinox. Because your guests combine private biblical tours in Malta, Athens, and Ephesus with open time in Santorini and Mykonos plus sea-day teaching, we built a free shared page and printable offline Cruise Pack for that exact sailing without touching your tour packages. Could you open the link while we're on the phone?",
    voicemailScript:
      "Hi Living Passages team, Erich with Cruise Promenade calling about your October 16, 2027 Footsteps of Paul cruise on Celebrity Equinox. We built a free shared cruise page and printable offline Cruise Pack for that exact Barcelona-to-Rome sailing so your group can keep private tour staging times, lectures, and open Greek Isles ports in one offline place. My number is on caller ID!",
    phoneOrTextScript: `Hi Living Passages Team — calling about your Oct 16–26, 2027 Footsteps of Paul Cruise on Celebrity Equinox. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Link: ${buildSailingUtmUrl("celebrity-equinox", "2027-10-16", "living_passages_paul")}`,
    likelyObjection:
      "We operate our own private biblical shore excursions rather than retail cruise excursions.",
    objectionResponse:
      "That's a great fit—as the organizer you post your own private Ephesus, Athens, and Malta motorcoach departures right onto those days so nobody accidentally books a conflicting tour.",
    emailSubject:
      "Free offline & shared schedule board for Oct 16 Celebrity Equinox (Footsteps of Paul)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Living Passages Team,",
      introLine:
        "Following up regarding your October 16–26, 2027 Footsteps of Paul voyage aboard Celebrity Equinox from Barcelona to Rome.",
      sailingUrl: buildSailingUtmUrl("celebrity-equinox", "2027-10-16", "living_passages_paul"),
      utmSource: "living_passages_paul",
      scheduleNote:
        "You can lock your private biblical excursions in Malta, Athens, and Kusadasi (Ephesus) plus sea-day teaching sessions into a printable offline Cruise Pack while letting guests coordinate open afternoons in Santorini and Mykonos.",
    }),
    recommendedNextAction:
      "Call Living Passages (Coeur d'Alene/PT office) at (888) 771-8717 between 8:30 AM and 3:30 PM PT.",
    outreachStatus: "ready_to_call",
    notes:
      "High-touch Christian study cruise specialist operating multiple Mediterranean & Alaska study cruises annually. 0 outreach messages sent.",
  },

  // ============================================================================
  // RANKS 30–40: PHONE-VERIFIED HELD PROSPECTS (Strict Hold Rule: sailingPageUrl = null)
  // ============================================================================
  {
    leadId: "wsba_cruise",
    priorityRank: 30,
    leadName: "WSBA Reflect & Renew Cruise — Toi Johnson",
    contactName: "Toi Johnson",
    organizerRole: "Cruise Coordinator, Women's Small Business Association",
    phone: "(412) 606-0227",
    phoneInvitesText: false,
    email: "venturesbytoi@gmail.com",
    altEmails: ["info@yourwsba.org", "events@yourwsba.org"],
    contactPageUrl: "https://yourwsba.org/cruise2027",
    officialUrl: "https://yourwsba.org/cruise2027",
    eventPageUrl: "https://yourwsba.org/cruise2027",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "10:00 AM – 12:30 PM ET or 1:30 PM – 4:30 PM ET (8:00–10:30 AM / 11:30 AM–2:30 PM MT)",
    cohortDescription:
      "Women's Small Business Association retreat (4N Miami private/themed charter slot)",
    cruiseLine: "Virgin Voyages",
    hostedCruiseAndSailing:
      "Brilliant Lady · Feb 4–8, 2027 (4N RT Miami — HELD: confirm Bimini vs. Sea Day order)",
    shipName: "Brilliant Lady",
    shipSlug: "brilliant-lady",
    sailDate: "2027-02-04",
    returnDate: "2027-02-08",
    portWindowsSummary:
      "CONFLICT: yourwsba.org lists Sat Feb 6 Bimini / Sun Feb 7 Sea vs. Virgin standard loop Sat Sea / Sun Bimini",
    qualificationStatus: "held_schedule_conflict",
    qualificationDetail:
      "HELD (sailingPageUrl withheld): Day-order conflict between yourwsba.org/cruise2027 (Sat Feb 6 Bimini, Sun Feb 7 Sea) and Virgin Voyages' standard 4N Key West & Bimini rotation (Sat Sea, Sun Bimini), plus charter slot gap.",
    utmSource: "wsba_cruise",
    sailingPageUrl: null,
    valueToPitchSummary:
      "Strong women-entrepreneur retreat fit—call Toi Johnson first to verify whether Feb 4 charter calls at Bimini on Saturday Feb 6 or Sunday Feb 7 before publishing and sharing a live URL.",
    phoneOpeningScript:
      "Hi Toi — this is Erich with Cruise Promenade calling with a quick 20-second schedule check on your February 4 WSBA Reflect & Renew Cruise on Brilliant Lady: does your voyage call at Beach Club at Bimini on Saturday February 6 with Sunday at sea, or Sunday February 7? Once we confirm that exact day order so there's zero conflict, we can enable a free shared cruise page for WSBA.",
    voicemailScript:
      "Hi Toi, Erich at Cruise Promenade calling about the February 4 WSBA Reflect & Renew Cruise on Brilliant Lady. Quick schedule check before we publish a free group planning page for your sailing—is Bimini on Saturday Feb 6 or Sunday Feb 7? Happy to follow up at venturesbytoi@gmail.com!",
    phoneOrTextScript: `Hi Toi — quick schedule question on the Feb 4–8 WSBA Reflect & Renew Cruise on Brilliant Lady: does your voyage call at Bimini on Saturday Feb 6 or Sunday Feb 7? ${HOSTED_ORGANIZER_CORE_PITCH}`,
    likelyObjection:
      "Why are you asking about Saturday vs. Sunday before sending a link?",
    objectionResponse:
      "We never publish a group page unless the port days match your official itinerary 100%, so nobody schedules a meetup on the wrong day.",
    emailSubject:
      "Quick Bimini day check for WSBA Reflect & Renew (Feb 4 Brilliant Lady)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Toi,",
      introLine:
        "Quick schedule question before we enable a free planning page for the WSBA Reflect & Renew Cruise aboard Brilliant Lady (February 4–8, 2027):",
      sailingUrl: null,
      utmSource: "wsba_cruise",
      scheduleNote:
        "Does the February 4 sailing call at The Beach Club at Bimini on Saturday, February 6 (with Sunday at sea, as listed on yourwsba.org/cruise2027) or Sunday, February 7? Once confirmed, we can publish the exact matching page.",
    }),
    recommendedNextAction:
      "HELD — Do not pitch a live sailing URL yet. Call (412) 606-0227 to confirm Sat Feb 6 vs. Sun Feb 7 Bimini day order first.",
    outreachStatus: "needs_qualification_call",
    notes:
      "Held strictly due to Bimini/Sea-day conflict. 0 outreach messages sent.",
  },
  {
    leadId: "dancecation_at_sea",
    priorityRank: 31,
    leadName: "Dancecation at Sea / BK Travel",
    contactName: "BK Travel Group Cruise Desk",
    organizerRole: "Official Group Booking Agency for Dancecation at Sea",
    phone: "757-870-3709",
    phoneInvitesText: false,
    email: null,
    altEmails: [],
    contactPageUrl: "https://dancecation.net/book-now/",
    officialUrl: "https://dancecation.net/book-now/",
    eventPageUrl: "https://dancecation.net/book-now/",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "10:00 AM – 12:30 PM ET or 2:00 PM – 4:30 PM ET (8:00–10:30 AM / 12:00–2:30 PM MT)",
    cohortDescription:
      "~100-person hosted dance cruise group organized with BK Travel",
    cruiseLine: "Cruise Line TBD (Qualify on Call)",
    hostedCruiseAndSailing:
      "Hosted ~100-person group · HELD: Qualify exact 2027 ship & embarkation date first",
    shipName: "Ship TBD (Qualify on Call)",
    shipSlug: null,
    sailDate: null,
    returnDate: null,
    portWindowsSummary:
      "MISSING FACTS: Exact 2027 ship name, cruise line, embarkation date, and port schedule not published on public book-now page",
    qualificationStatus: "needs_sailing_qualification",
    qualificationDetail:
      "HELD (sailingPageUrl withheld): Missing exact 2027 ship name, cruise line, and embarkation date on dancecation.net/book-now/. Qualify with BK Travel before presenting any sailing URL.",
    utmSource: "dancecation_at_sea",
    sailingPageUrl: null,
    valueToPitchSummary:
      "~100-person hosted dance group—qualify exact ship and sail date with BK Travel first, then verify schedule in Cruise Promenade before sharing a link.",
    phoneOpeningScript:
      "Hi BK Travel team — this is Erich with Cruise Promenade calling about your ~100-person Dancecation at Sea group. Which ship and sail date is the upcoming group sailing on? Once we confirm the exact voyage matches our verified schedule, we'd love to offer a free shared excursion and meetup board that never touches BK Travel's bookings.",
    voicemailScript:
      "Hi BK Travel team, Erich with Cruise Promenade calling at 757-870-3709 about Dancecation at Sea. Quick question on which ship and sail date your upcoming group is sailing on so we can verify a free group excursion and meetup board for your dancers with zero interference with BK Travel's bookings.",
    phoneOrTextScript: `Hi BK Travel team — which ship and embarkation date is the upcoming ~100-person Dancecation at Sea group sailing on? ${HOSTED_ORGANIZER_CORE_PITCH}`,
    likelyObjection:
      "All Dancecation guests must book cabins through BK Travel.",
    objectionResponse:
      "100%—Cruise Promenade never sells cruise cabins, and BK Travel can include its own preferred excursion links on the board.",
    emailSubject:
      "Quick ship/date question + free group board for Dancecation at Sea",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Dancecation at Sea & BK Travel Team,",
      introLine:
        "Quick question regarding your upcoming ~100-person Dancecation at Sea group:",
      sailingUrl: null,
      utmSource: "dancecation_at_sea",
      scheduleNote:
        "Which ship and embarkation date is the upcoming group sailing on? Once we verify the exact port schedule, we can share a free dedicated board link.",
    }),
    recommendedNextAction:
      "HELD — Call 757-870-3709 solely to qualify exact 2027 ship and embarkation date before pitching a live page.",
    outreachStatus: "needs_qualification_call",
    notes:
      "Held strictly due to missing ship & embarkation date on public booking page. 0 outreach messages sent.",
  },
  {
    leadId: "cruisecon_2027",
    priorityRank: 32,
    leadName: "CruiseCon 2027 — Executive Cybersecurity & CISO Conference",
    contactName: "Ira Winkler",
    organizerRole: "Founder & Organizer, CruiseCon",
    phone: "(443) 994-0245",
    phoneInvitesText: false,
    email: "contact@cruisecon.com",
    altEmails: [],
    contactPageUrl: "https://cruisecon.com/events/cruisecon2027/",
    officialUrl: "https://cruisecon.com/events/cruisecon2027/",
    eventPageUrl: "https://cruisecon.com/events/cruisecon2027/",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "9:30 AM – 12:00 PM ET or 1:30 PM – 4:30 PM ET (7:30–10:00 AM / 11:30 AM–2:30 PM MT)",
    cohortDescription:
      "CISOs & cybersecurity leaders sailing 5 nights roundtrip from Port Canaveral",
    cruiseLine: "Royal Caribbean International",
    hostedCruiseAndSailing:
      "Explorer of the Seas · Feb 5–10, 2027 (5N RT Port Canaveral — HELD: Labadee vs. Grand Turk conflict)",
    shipName: "Explorer of the Seas",
    shipSlug: "explorer-of-the-seas",
    sailDate: "2027-02-05",
    returnDate: "2027-02-10",
    portWindowsSummary:
      "CONFLICT: cruisecon.com lists Sun Feb 7 Labadee, Haiti whereas Royal Caribbean rerouted Feb 5 Explorer of the Seas to Grand Turk (10:30–18:30) + Tue Feb 9 CocoCay",
    qualificationStatus: "held_schedule_conflict",
    qualificationDetail:
      "HELD (sailingPageUrl withheld): Port conflict on Sunday Feb 7, 2027 — cruisecon.com/events/cruisecon2027/ still displays Labadee, Haiti while Cruise Promenade's Royal Caribbean feed shows Grand Turk (rerouted from Labadee).",
    utmSource: "cruisecon_2027",
    sailingPageUrl: null,
    valueToPitchSummary:
      "Ideal CISO peer-networking cohort, but held until Ira Winkler confirms Royal Caribbean's Labadee-to-Grand-Turk port swap so we don't contradict his event page.",
    phoneOpeningScript:
      "Hi Ira — this is Erich with Cruise Promenade calling about CruiseCon 2027 on February 5 aboard Explorer of the Seas. Quick heads-up and schedule check: Royal Caribbean's feed shows Sunday February 7 rerouted from Labadee to Grand Turk—did RCI send that update for your group block? Once confirmed, we have a free private group board ready for your CISOs.",
    voicemailScript:
      "Hi Ira, Erich with Cruise Promenade calling about CruiseCon 2027 on February 5 Explorer of the Seas. Quick port check—Royal Caribbean's schedule shows Sunday Feb 7 swapped from Labadee to Grand Turk, so we held off sharing a group excursion link until confirming with you. Happy to email contact@cruisecon.com!",
    phoneOrTextScript: `Hi Ira — quick port check on CruiseCon 2027 (Feb 5 Explorer of the Seas): did Royal Caribbean confirm the Sunday Feb 7 swap from Labadee to Grand Turk for your block? ${HOSTED_ORGANIZER_CORE_PITCH}`,
    likelyObjection:
      "Why didn't you just send the page?",
    objectionResponse:
      "Because your site still lists Labadee while Royal Caribbean's feed lists Grand Turk—we never share a page with a port mismatch without checking with the organizer first.",
    emailSubject:
      "Quick Labadee vs. Grand Turk port check for CruiseCon 2027 (Feb 5 Explorer of the Seas)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Ira,",
      introLine:
        "Quick itinerary check regarding CruiseCon 2027 aboard Explorer of the Seas (February 5–10, 2027 from Port Canaveral):",
      sailingUrl: null,
      utmSource: "cruisecon_2027",
      scheduleNote:
        "Your event page currently lists Labadee on Sunday, February 7, while Royal Caribbean's updated schedule feed lists Grand Turk (10:30–18:30) alongside CocoCay on Tuesday, February 9. Once you confirm Grand Turk matches your group invoice, I can send over the verified link.",
    }),
    recommendedNextAction:
      "HELD — Confirm Labadee -> Grand Turk reroute with Ira Winkler at (443) 994-0245 before sharing the sailing URL.",
    outreachStatus: "held_pending_schedule_check",
    notes:
      "Held strictly due to Labadee vs. Grand Turk port discrepancy between cruisecon.com and RCI feed. 0 outreach messages sent.",
  },
  {
    leadId: "smiles_at_sea_spring",
    priorityRank: 33,
    leadName: "Smiles at Sea — 2027 Spring Dental CE Cruise",
    contactName: "Elijah Desmond & Dr. Devinn Geeson",
    organizerRole: "Founder & CEO, Smiles at Sea Dental Conferences",
    phone: "(954) 859-2960",
    phoneInvitesText: false,
    email: "admin@smilesatsea.com",
    altEmails: [],
    contactPageUrl: "https://events.smilesatsea.com/miami27welcome",
    officialUrl: "https://events.smilesatsea.com/miami27welcome",
    eventPageUrl: "https://events.smilesatsea.com/miami27welcome",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "9:30 AM – 12:00 PM ET or 1:30 PM – 4:30 PM ET (7:30–10:00 AM / 11:30 AM–2:30 PM MT)",
    cohortDescription:
      "Dentists, hygienists & entire dental office teams attending high-energy dental CE at sea",
    cruiseLine: "Virgin Voyages",
    hostedCruiseAndSailing:
      "Scarlet Lady · Mar 11–15, 2027 (4N RT Miami — HELD: Sat/Sun Bimini vs. Sea Day order)",
    shipName: "Scarlet Lady",
    shipSlug: "scarlet-lady",
    sailDate: "2027-03-11",
    returnDate: "2027-03-15",
    portWindowsSummary:
      "CONFLICT: events.smilesatsea.com lists Sat Mar 13 Bimini / Sun Mar 14 Sea (CE) vs. Virgin standard Sat Sea / Sun Bimini",
    qualificationStatus: "held_schedule_conflict",
    qualificationDetail:
      "HELD (sailingPageUrl withheld): Day-order conflict on Mar 13–14, 2027 — Smiles at Sea lists Bimini Beach Club Party on Saturday Mar 13 and CE at Sea on Sunday Mar 14, whereas Cruise Promenade's Virgin Voyages feed lists Saturday at Sea and Sunday in Bimini.",
    utmSource: "smiles_at_sea_spring",
    sailingPageUrl: null,
    valueToPitchSummary:
      "Dental practices bring 5–15 team members per office—high viral potential once Saturday vs. Sunday Bimini/CE order is confirmed with Smiles at Sea.",
    phoneOpeningScript:
      "Hi — this is Erich with Cruise Promenade calling for the Smiles at Sea team about your March 11, 2027 Scarlet Lady cruise. Quick schedule question before we share a free group page: on Virgin's sheet for March 11, is Beach Club at Bimini on Saturday March 13 or Sunday March 14?",
    voicemailScript:
      "Hi Smiles at Sea team, Erich with Cruise Promenade calling at (954) 859-2960 about your March 11, 2027 Scarlet Lady Dental CE cruise. Quick check on whether Bimini is Saturday March 13 or Sunday March 14 so we can align a free dental-team excursion board 100% with your CE sessions.",
    phoneOrTextScript: `Hi Smiles at Sea Team — quick schedule check on your Mar 11–15, 2027 Scarlet Lady cruise: is Bimini on Saturday Mar 13 or Sunday Mar 14? ${HOSTED_ORGANIZER_CORE_PITCH}`,
    likelyObjection:
      "All cabins must be booked through Smiles at Sea's block.",
    objectionResponse:
      "100% respected—we never sell cabins, and we held the link specifically so our schedule matches your CE hours first.",
    emailSubject:
      "Quick Bimini/CE day check for Smiles at Sea (Mar 11, 2027 Scarlet Lady)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Elijah, Dr. Geeson & Smiles at Sea Team,",
      introLine:
        "Quick schedule check before we enable a free team planning page for your March 11–15, 2027 Scarlet Lady Dental CE Cruise:",
      sailingUrl: null,
      utmSource: "smiles_at_sea_spring",
      scheduleNote:
        "Does the March 11 Scarlet Lady sailing call at Bimini on Saturday, March 13 (with CE at sea Sunday, March 14) or Sunday, March 14? Once confirmed, we'll make sure the page matches your CE schedule 100%.",
    }),
    recommendedNextAction:
      "HELD — Call (954) 859-2960 to verify Sat Mar 13 vs. Sun Mar 14 Bimini order before sharing any URL.",
    outreachStatus: "held_pending_schedule_check",
    notes:
      "Held strictly due to Sat/Sun Bimini vs. Sea-day discrepancy. 0 outreach messages sent.",
  },
  {
    leadId: "danny_stewart_bluegrass",
    priorityRank: 34,
    leadName: "Danny Stewart's 2027 Bahamas Bluegrass Cruise",
    contactName: "Danny & Christa Stewart",
    organizerRole: "Owners & Festival Producers, Danny Stewart Productions",
    phone: "(570) 721-2760",
    phoneInvitesText: false,
    email: "mandolindan2005@yahoo.com",
    altEmails: [],
    contactPageUrl: "https://dannystewartsbluegrasscruise.com/",
    officialUrl: "https://dannystewartsbluegrasscruise.com/",
    eventPageUrl: "https://dannystewartsbluegrasscruise.com/",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "10:00 AM – 12:30 PM ET or 1:30 PM – 4:30 PM ET (8:00–10:30 AM / 11:30 AM–2:30 PM MT)",
    cohortDescription:
      "Bluegrass musicians, pickers & fans sailing 4 nights from Port Canaveral with onboard jam sessions",
    cruiseLine: "Royal Caribbean International",
    hostedCruiseAndSailing:
      "Explorer of the Seas · Jan 18–22, 2027 (4N RT Port Canaveral — HELD: Tue/Thu CocoCay vs. Sea Day order)",
    shipName: "Explorer of the Seas",
    shipSlug: "explorer-of-the-seas",
    sailDate: "2027-01-18",
    returnDate: "2027-01-22",
    portWindowsSummary:
      "CONFLICT: Bluegrass site lists Tue Jan 19 CocoCay / Wed Nassau / Thu Jan 21 Sea vs. RCI feed Tue Sea / Wed Nassau / Thu CocoCay",
    qualificationStatus: "held_schedule_conflict",
    qualificationDetail:
      "HELD (sailingPageUrl withheld): Day-order conflict between dannystewartsbluegrasscruise.com (Tue Jan 19 CocoCay, Thu Jan 21 Sea) and Cruise Promenade's Royal Caribbean feed (Tue Jan 19 Sea, Thu Jan 21 CocoCay).",
    utmSource: "danny_stewart_bluegrass",
    sailingPageUrl: null,
    valueToPitchSummary:
      "Tight-knit bluegrass jam community—confirm Tuesday vs. Thursday CocoCay/Sea-day rotation with Danny Stewart first so jam sessions and shore outings never clash.",
    phoneOpeningScript:
      "Hi Danny — this is Erich with Cruise Promenade calling about your January 18, 2027 Bahamas Bluegrass Cruise on Explorer of the Seas. Quick schedule check: on Royal Caribbean's confirmation for January 18, is CocoCay on Tuesday January 19 with Thursday at sea, or Thursday January 21? Once we verify that order so your sea-day workshops line up, we can share a free printable schedule page for your pickers.",
    voicemailScript:
      "Hi Danny and Christa, Erich with Cruise Promenade calling about your January 18, 2027 Bahamas Bluegrass Cruise on Explorer of the Seas. Quick check on whether CocoCay is Tuesday Jan 19 or Thursday Jan 21 so we can match your sea-day jam workshops before offering a free printable group page.",
    phoneOrTextScript: `Hi Danny — quick schedule check on your Jan 18–22, 2027 Explorer of the Seas Bluegrass Cruise: is CocoCay on Tuesday Jan 19 or Thursday Jan 21? ${HOSTED_ORGANIZER_CORE_PITCH}`,
    likelyObjection:
      "Attendees must book through our Bluegrass Cruise group to get show badges.",
    objectionResponse:
      "Completely understood—we sell zero cabins and keep the link private for your badge holders once the CocoCay day is verified.",
    emailSubject:
      "Quick CocoCay day check for the Jan 18, 2027 Bahamas Bluegrass Cruise",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Danny & Christa,",
      introLine:
        "Quick schedule question regarding your January 18–22, 2027 Bahamas Bluegrass Cruise aboard Explorer of the Seas:",
      sailingUrl: null,
      utmSource: "danny_stewart_bluegrass",
      scheduleNote:
        "On Royal Caribbean's current voyage sheet for January 18, is Perfect Day at CocoCay on Tuesday, January 19 (with Thursday at sea) or Thursday, January 21? Once confirmed, we can align the page 100% with your sea-day bluegrass shows.",
    }),
    recommendedNextAction:
      "HELD — Call Danny Stewart at (570) 721-2760 to verify Tue Jan 19 vs. Thu Jan 21 CocoCay order first.",
    outreachStatus: "held_pending_schedule_check",
    notes:
      "Held strictly due to Tue/Thu CocoCay vs. Sea-day conflict. 0 outreach messages sent.",
  },
  {
    leadId: "lesbians_aboard_sisters",
    priorityRank: 35,
    leadName: "Lesbians Aboard — Sisters at Sea 2027",
    contactName: "Natasha DeJesus",
    organizerRole: "Co-Founder & First Mate, Lesbians Aboard",
    phone: "(727) 616-7682",
    phoneInvitesText: false,
    email: null,
    altEmails: [],
    contactPageUrl: "https://lesbiansaboard.com/contact-us",
    officialUrl: "https://lesbiansaboard.com/sisters-at-sea-2027",
    eventPageUrl: "https://lesbiansaboard.com/sisters-at-sea-2027",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "10:00 AM – 12:30 PM ET or 1:30 PM – 4:30 PM ET (8:00–10:30 AM / 11:30 AM–2:30 PM MT)",
    cohortDescription:
      "Hosted LGBTQ+ women's community group on Virgin Voyages' 4-ship meetup sailing",
    cruiseLine: "Virgin Voyages",
    hostedCruiseAndSailing:
      "Scarlet Lady · Feb 15–20, 2027 (5N RT Miami — HELD: Grand Bahama / 4-Ship Rendezvous port mismatch)",
    shipName: "Scarlet Lady",
    shipSlug: "scarlet-lady",
    sailDate: "2027-02-15",
    returnDate: "2027-02-20",
    portWindowsSummary:
      "CONFLICT: Sisters at Sea publishes Virgin's special 4-Ship Fleet Rendezvous + Grand Bahama Island + Bimini, whereas CP vendor feed still shows 3 sea days + Bimini only",
    qualificationStatus: "held_schedule_conflict",
    qualificationDetail:
      "HELD (sailingPageUrl withheld): Itinerary mismatch on Feb 15, 2027 Scarlet Lady — lesbiansaboard.com/sisters-at-sea-2027 reflects Virgin's special 4-Ship Fleet Rendezvous & Grand Bahama Island call, whereas Cruise Promenade's catalog currently shows 3 sea days + Bimini.",
    utmSource: "lesbians_aboard_sisters",
    sailingPageUrl: null,
    valueToPitchSummary:
      "Strong community group, held until Scarlet Lady's updated Feb 15, 2027 Grand Bahama / Fleet Rendezvous port call is confirmed and updated in our catalog.",
    phoneOpeningScript:
      "Hi Natasha — this is Erich with Cruise Promenade calling about Sisters at Sea on February 15, 2027 aboard Scarlet Lady. We noticed Virgin updated that sailing with the 4-Ship Rendezvous and Grand Bahama Island—could you confirm the exact Grand Bahama port hours on your group sheet so we can update our schedule before sharing a free private group board?",
    voicemailScript:
      "Hi Natasha, Erich with Cruise Promenade calling at (727) 616-7682 about Sisters at Sea 2027 on Scarlet Lady. Quick question on the updated Grand Bahama port hours for your Feb 15 group so we can match your itinerary 100% before offering a free private meetup board.",
    phoneOrTextScript: `Hi Natasha — quick schedule check on Sisters at Sea (Feb 15, 2027 Scarlet Lady): what are the exact Grand Bahama port hours on Virgin's updated sheet for your group? ${HOSTED_ORGANIZER_CORE_PITCH}`,
    likelyObjection:
      "We want a private space solely for registered Sisters at Sea guests.",
    objectionResponse:
      "Every board is private (noindex) and invite-only—and we held off sending a link until your Grand Bahama port hours are reflected accurately.",
    emailSubject:
      "Quick Grand Bahama port-hour check for Sisters at Sea (Feb 15 Scarlet Lady)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Natasha,",
      introLine:
        "Quick itinerary question regarding Sisters at Sea 2027 aboard Scarlet Lady (February 15–20, 2027 from Miami):",
      sailingUrl: null,
      utmSource: "lesbians_aboard_sisters",
      scheduleNote:
        "Could you confirm the exact Grand Bahama Island arrival/all-aboard times on Virgin's updated 4-Ship Rendezvous schedule so we can verify our sailing record before sharing a private board link?",
    }),
    recommendedNextAction:
      "HELD — Confirm exact Feb 15 Scarlet Lady Grand Bahama / Rendezvous hours with Natasha DeJesus at (727) 616-7682 before publishing URL.",
    outreachStatus: "held_pending_schedule_check",
    notes:
      "Held strictly due to Grand Bahama / 4-Ship Rendezvous port mismatch vs. catalog feed. 0 outreach messages sent.",
  },
  {
    leadId: "beekeeper_exchange_2027",
    priorityRank: 36,
    leadName: "The Beekeeper Exchange 2027 Hosted Cruise",
    contactName: "Michael Clark",
    organizerRole: "Host & Expedia Cruises Consultant, The Beekeeper Exchange",
    phone: "(905) 502-7447",
    phoneInvitesText: false,
    email: null,
    altEmails: [],
    contactPageUrl: "https://www.thebeekeeperexchange.com/contact",
    officialUrl: "https://www.thebeekeeperexchange.com/2027-itinerary",
    eventPageUrl: "https://www.thebeekeeperexchange.com/2027-itinerary",
    contactTimezone: "America/Toronto (ET)",
    bestCallingWindow: "9:30 AM – 12:00 PM ET or 1:30 PM – 4:30 PM ET (7:30–10:00 AM / 11:30 AM–2:30 PM MT)",
    cohortDescription:
      "Commercial & hobbyist beekeepers attending sea-day apiculture workshops out of Port Canaveral",
    cruiseLine: "Princess Cruises",
    hostedCruiseAndSailing:
      "Star Princess · Jan 16–23, 2027 (7N RT Port Canaveral — HELD: catalog stores 14N collector duration)",
    shipName: "Star Princess",
    shipSlug: "star-princess",
    sailDate: "2027-01-16",
    returnDate: "2027-01-23",
    portWindowsSummary:
      "CONFLICT: Group books 7N Jan 16–23 Western Caribbean leg (Cozumel, Roatan, Belize/Costa Maya), while CP catalog entry for star-princess/2027-01-16 spans the 14N Jan 16–30 collector voyage",
    qualificationStatus: "held_schedule_conflict",
    qualificationDetail:
      "HELD (sailingPageUrl withheld): Duration conflict — thebeekeeperexchange.com/2027-itinerary is the 7-night Jan 16–23, 2027 leg on Star Princess, whereas `/sailings/star-princess/2027-01-16` currently renders the 14-night Jan 16–30 collector voyage.",
    utmSource: "beekeeper_exchange_2027",
    sailingPageUrl: null,
    valueToPitchSummary:
      "Unique niche conference at sea hosted by an Expedia Cruises advisor—held until a clean 7-night Jan 16–23 Star Princess leg is separated from the 14-night collector record.",
    phoneOpeningScript:
      "Hi Michael — this is Erich with Cruise Promenade calling about The Beekeeper Exchange sailing January 16–23, 2027 on Star Princess. Quick check on your 7-night Port Canaveral port times before we set up a dedicated 7-night group page (since Princess also lists that date as a 14-night collector voyage).",
    voicemailScript:
      "Hi Michael, Erich with Cruise Promenade calling at (905) 502-7447 about The Beekeeper Exchange on January 16, 2027 aboard Star Princess. Quick question to verify your exact 7-night port hours out of Port Canaveral so we don't mix in the second week of Star Princess's 14-night collector voyage.",
    phoneOrTextScript: `Hi Michael — quick check on The Beekeeper Exchange (Jan 16–23, 2027 Star Princess 7N leg) before we enable a dedicated 7-night group board. ${HOSTED_ORGANIZER_CORE_PITCH}`,
    likelyObjection:
      "Why does Princess list both 7-night and 14-night versions?",
    objectionResponse:
      "Princess sells back-to-back collector voyages under the same Jan 16 start date—so we held the link to make sure your beekeepers only see their exact 7-night schedule.",
    emailSubject:
      "7-night schedule check for The Beekeeper Exchange (Jan 16 Star Princess)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Michael,",
      introLine:
        "Quick question regarding The Beekeeper Exchange 7-night voyage aboard Star Princess (January 16–23, 2027 from Port Canaveral):",
      sailingUrl: null,
      utmSource: "beekeeper_exchange_2027",
      scheduleNote:
        "Because Princess also files January 16 as a 14-night collector voyage, we held off sharing a sailing link until confirming your exact 7-night port hours so your attendees only see January 16–23.",
    }),
    recommendedNextAction:
      "HELD — Do not share `/sailings/star-princess/2027-01-16` while it renders 14 nights; confirm 7N leg details with Michael Clark at (905) 502-7447.",
    outreachStatus: "held_pending_schedule_check",
    notes:
      "Held strictly due to 7N vs. 14N collector voyage duration mismatch in catalog. 0 outreach messages sent.",
  },
  {
    leadId: "ficpa_cpe_at_sea",
    priorityRank: 37,
    leadName: "FICPA & LearnVoyage — CPE@Sea 2027",
    contactName: "Marc Hamilton, CPA & FICPA Member Services",
    organizerRole: "Founder, LearnVoyage & Florida Institute of CPAs Partner",
    phone: "(850) 224-2727",
    phoneInvitesText: false,
    email: "CPE@LearnVoyage.com",
    altEmails: ["msc@ficpa.org"],
    contactPageUrl: "https://www.ficpa.org/cpe@sea",
    officialUrl: "https://www.ficpa.org/cpe@sea",
    eventPageUrl: "https://www.ficpa.org/cpe@sea",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "9:30 AM – 12:00 PM ET or 1:30 PM – 4:30 PM ET (7:30–10:00 AM / 11:30 AM–2:30 PM MT)",
    cohortDescription:
      "Florida CPAs & spouses earning accounting CPE credits on a 7-night Western Caribbean cruise",
    cruiseLine: "Norwegian Cruise Line",
    hostedCruiseAndSailing:
      "Norwegian Luna · Sep 5–12, 2027 (7N RT Miami — HELD: schedule not yet verified in CP catalog)",
    shipName: "Norwegian Luna",
    shipSlug: "norwegian-luna",
    sailDate: "2027-09-05",
    returnDate: "2027-09-12",
    portWindowsSummary:
      "MISSING IN CATALOG: Sep 5, 2027 Norwegian Luna 7N Miami (Roatan, Harvest Caye, Costa Maya, Cozumel) is not yet loaded as a verified schedule in Cruise Promenade",
    qualificationStatus: "held_schedule_conflict",
    qualificationDetail:
      "HELD (sailingPageUrl withheld): `/sailings/norwegian-luna/2027-09-05` currently resolves `unverified` in Cruise Promenade's schedule catalog (`complete: false`). Verify/ingest official NCL Sep 5, 2027 port hours first.",
    utmSource: "ficpa_cpe_at_sea",
    sailingPageUrl: null,
    valueToPitchSummary:
      "High-value CPA continuing-education cohort—held until Norwegian Luna's September 5, 2027 port arrival/departure times are verified in Cruise Promenade.",
    phoneOpeningScript:
      "Hi — this is Erich with Cruise Promenade calling for the CPE@Sea / LearnVoyage coordinator about your September 5, 2027 Norwegian Luna CPA cruise. Quick question on the exact port arrival and departure hours on your NCL group contract so we can verify that sailing in our catalog before offering a free attendee excursion board.",
    voicemailScript:
      "Hi CPE@Sea team, Erich with Cruise Promenade calling about your September 5, 2027 Norwegian Luna CPA conference cruise. Quick check to verify your exact NCL port times before enabling a free attendee excursion board. Happy to email CPE@LearnVoyage.com!",
    phoneOrTextScript: `Hi Marc & FICPA CPE@Sea Team — quick check on your Sep 5–12, 2027 Norwegian Luna port hours so we can verify your sailing schedule. ${HOSTED_ORGANIZER_CORE_PITCH}`,
    likelyObjection:
      "Why isn't September 5 live yet?",
    objectionResponse:
      "We restrict one-click group boards strictly to verified cruise-line schedules—never guessed times—so we confirm the official NCL port hours first.",
    emailSubject:
      "Quick port-schedule check for CPE@Sea 2027 (Sep 5 Norwegian Luna)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Marc & CPE@Sea Team,",
      introLine:
        "Quick question regarding FICPA & LearnVoyage's September 5–12, 2027 CPE@Sea voyage aboard Norwegian Luna:",
      sailingUrl: null,
      utmSource: "ficpa_cpe_at_sea",
      scheduleNote:
        "We are verifying the official NCL arrival and departure times for September 5, 2027 (Roatan, Harvest Caye, Costa Maya, Cozumel) before publishing a live sailing link—happy to confirm against your group sheet.",
    }),
    recommendedNextAction:
      "HELD — Verify/ingest official NCL Sep 5, 2027 Norwegian Luna port hours before pitching a live sailing URL.",
    outreachStatus: "held_pending_schedule_check",
    notes:
      "Held strictly because `norwegian-luna` `2027-09-05` is not yet verified in CP schedule catalog. 0 outreach messages sent.",
  },
  {
    leadId: "journey_makers_hendricks",
    priorityRank: 38,
    leadName: "Journey Makers NC — Chris Hendricks Fan Cruise 2027",
    contactName: "Amy Karpinski",
    organizerRole: "Franchise Owner & Group Advisor, Journey Makers NC (Cruise Planners)",
    phone: "(919) 704-0080",
    phoneInvitesText: false,
    email: "amy.karpinski@cruiseplanners.com",
    altEmails: [],
    contactPageUrl: "https://www.journeymakersnc.com/ContactUs",
    officialUrl: "https://www.journeymakersnc.com/GroupRegistrations/view/142714",
    eventPageUrl: "https://www.journeymakersnc.com/GroupRegistrations/view/142714",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "10:00 AM – 12:30 PM ET or 2:00 PM – 4:30 PM ET (8:00–10:30 AM / 12:00–2:30 PM MT)",
    cohortDescription:
      "Creator/music fan cruise hosted with Cruise Planners advisor Amy Karpinski",
    cruiseLine: "Disney Cruise Line",
    hostedCruiseAndSailing:
      "Disney Destiny · Dec 3–7, 2027 (4N RT Fort Lauderdale — HELD: Dec 2027 DCL schedule not in catalog)",
    shipName: "Disney Destiny",
    shipSlug: "disney-destiny",
    sailDate: "2027-12-03",
    returnDate: "2027-12-07",
    portWindowsSummary:
      "MISSING IN CATALOG: Dec 3, 2027 Disney Destiny 4N Bahamas from Fort Lauderdale is not yet loaded in Cruise Promenade's verified schedule catalog",
    qualificationStatus: "held_schedule_conflict",
    qualificationDetail:
      "HELD (sailingPageUrl withheld): `/sailings/disney-destiny/2027-12-03` currently resolves `unverified` (`complete: false`) in Cruise Promenade because late-2027 Disney Destiny schedules are not yet ingested.",
    utmSource: "journey_makers_hendricks",
    sailingPageUrl: null,
    valueToPitchSummary:
      "Creator fan group + Cruise Planners advisor—held until official Disney Destiny Dec 3, 2027 port windows (Castaway Cay / Lookout Cay / Nassau) are verified in Cruise Promenade.",
    phoneOpeningScript:
      "Hi Amy — this is Erich with Cruise Promenade calling about your December 3, 2027 Chris Hendricks Fan Cruise on Disney Destiny. Could you confirm which Bahamas ports (Castaway Cay vs. Lookout Cay) are on your December 3 group contract so we can verify that schedule before sharing a free fan-group board?",
    voicemailScript:
      "Hi Amy, Erich with Cruise Promenade calling at (919) 704-0080 about your December 3, 2027 Disney Destiny group. Quick question to verify the exact Castaway/Lookout Cay port times on your group sheet so we can enable a free fan schedule board with zero interference with your Cruise Planners bookings.",
    phoneOrTextScript: `Hi Amy — quick schedule check on your Dec 3–7, 2027 Disney Destiny fan group: which exact Bahamas port windows are on your DCL group sheet? ${HOSTED_ORGANIZER_CORE_PITCH}`,
    likelyObjection:
      "Fans must book cabins through my Cruise Planners group link.",
    objectionResponse:
      "100%—we never sell cabins, and you can attach your own advisor links once December 3 is verified.",
    emailSubject:
      "Quick Disney Destiny port-window check for your Dec 3, 2027 Fan Group",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Amy,",
      introLine:
        "Quick itinerary check regarding your hosted December 3–7, 2027 Chris Hendricks Fan Cruise aboard Disney Destiny:",
      sailingUrl: null,
      utmSource: "journey_makers_hendricks",
      scheduleNote:
        "Could you share the exact Bahamas port call dates and hours on your DCL group confirmation so we can verify `/sailings/disney-destiny/2027-12-03` before sending a live link?",
    }),
    recommendedNextAction:
      "HELD — Confirm official DCL Dec 3, 2027 Disney Destiny port hours before pitching a live sailing URL.",
    outreachStatus: "held_pending_schedule_check",
    notes:
      "Held strictly because `disney-destiny` `2027-12-03` is not yet verified in CP schedule catalog. 0 outreach messages sent.",
  },
  {
    leadId: "line_dancing_groovy",
    priorityRank: 39,
    leadName: "The Line Dancing Groovy Cruise® 2027",
    contactName: "Avis G",
    organizerRole: "Owner & Lead Host, Avis G & Associates, LLC",
    phone: "(804) 447-0777",
    phoneInvitesText: false,
    email: "thelinedancinggroovycruise@gmail.com",
    altEmails: [],
    contactPageUrl: "https://www.thelinedancinggroovycruise.com/",
    officialUrl: "https://www.thelinedancinggroovycruise.com/",
    eventPageUrl: "https://www.thelinedancinggroovycruise.com/",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "10:00 AM – 12:30 PM ET or 2:00 PM – 4:30 PM ET (8:00–10:30 AM / 12:00–2:30 PM MT)",
    cohortDescription:
      "11th annual urban soul line-dancing group cruise out of Miami",
    cruiseLine: "Carnival Cruise Line",
    hostedCruiseAndSailing:
      "Carnival Conquest · Aug 9–13, 2027 (4N RT Miami — HELD: Aug 2027 Conquest schedule not in catalog)",
    shipName: "Carnival Conquest",
    shipSlug: "carnival-conquest",
    sailDate: "2027-08-09",
    returnDate: "2027-08-13",
    portWindowsSummary:
      "MISSING IN CATALOG: Aug 9, 2027 Carnival Conquest 4N Bahamas (Celebration Key & Princess Cays/Nassau) is not yet verified in Cruise Promenade",
    qualificationStatus: "held_schedule_conflict",
    qualificationDetail:
      "HELD (sailingPageUrl withheld): `/sailings/carnival-conquest/2027-08-09` currently resolves `unverified` (`complete: false`) in Cruise Promenade's schedule catalog.",
    utmSource: "line_dancing_groovy",
    sailingPageUrl: null,
    valueToPitchSummary:
      "Energetic 11th-annual line-dance community with themed dress nights and workshops—held until Carnival Conquest's Aug 9, 2027 port schedule is verified in Cruise Promenade.",
    phoneOpeningScript:
      "Hi Avis — this is Erich with Cruise Promenade calling about the August 9, 2027 Line Dancing Groovy Cruise on Carnival Conquest. Could we confirm your exact port times on Carnival's August 9 sheet so we can verify that sailing before offering a free line-dance schedule and excursion board?",
    voicemailScript:
      "Hi Avis, Erich with Cruise Promenade calling at (804) 447-0777 about your August 9, 2027 Line Dancing Groovy Cruise on Carnival Conquest. Quick call to verify your exact Bahamas port hours before enabling a free schedule and excursion board for your dancers.",
    phoneOrTextScript: `Hi Avis — quick port-schedule check on your Aug 9–13, 2027 Carnival Conquest Line Dancing Groovy Cruise before we enable a verified group page. ${HOSTED_ORGANIZER_CORE_PITCH}`,
    likelyObjection:
      "Dancers must register through our official Groovy Cruise package.",
    objectionResponse:
      "100%—we never sell cabins or packages, and the board stays private to your registered dancers once August 9 is verified.",
    emailSubject:
      "Quick port-schedule check for The Line Dancing Groovy Cruise (Aug 9 Carnival Conquest)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Avis,",
      introLine:
        "Quick itinerary check regarding the August 9–13, 2027 Line Dancing Groovy Cruise aboard Carnival Conquest out of Miami:",
      sailingUrl: null,
      utmSource: "line_dancing_groovy",
      scheduleNote:
        "Could you confirm the exact port arrival and departure hours on your Carnival group confirmation for August 9, 2027 so we can verify the sailing schedule before sharing a live link?",
    }),
    recommendedNextAction:
      "HELD — Verify Carnival Conquest Aug 9, 2027 port hours before sharing any live URL.",
    outreachStatus: "held_pending_schedule_check",
    notes:
      "Held strictly because `carnival-conquest` `2027-08-09` is not yet verified in CP schedule catalog. 0 outreach messages sent.",
  },
  {
    leadId: "lrbc_47_sea_of_cortez",
    priorityRank: 40,
    leadName: "Legendary Rhythm & Blues Cruise #47",
    contactName: "Roger Naber & Keven Naber",
    organizerRole: "Founder/CEO & Cruise Director, Legendary Rhythm & Blues Cruise",
    phone: "(816) 753-7979",
    phoneInvitesText: false,
    email: "bluesin@bluescruise.com",
    altEmails: [],
    contactPageUrl: "https://bluescruise.com/contact/",
    officialUrl: "https://bluescruise.com/47-oct-2027-sea-of-cortez/",
    eventPageUrl: "https://bluescruise.com/47-oct-2027-sea-of-cortez/",
    contactTimezone: "America/Chicago (CT)",
    bestCallingWindow: "9:30 AM – 12:00 PM CT or 1:30 PM – 4:30 PM CT (8:30–11:00 AM / 12:30–3:30 PM MT)",
    cohortDescription:
      "Full-ship blues music charter sailing 7 nights roundtrip San Diego to the Sea of Cortez",
    cruiseLine: "Holland America Line",
    hostedCruiseAndSailing:
      "Koningsdam · Oct 30 – Nov 6, 2027 (7N RT San Diego — HELD: custom full-ship charter itinerary)",
    shipName: "Koningsdam",
    shipSlug: "koningsdam",
    sailDate: "2027-10-30",
    returnDate: "2027-11-06",
    portWindowsSummary:
      "MISSING IN CATALOG: Full-ship private charter calling at Cabo San Lucas, La Paz & Guaymas (omitted from retail Holland America schedule feed)",
    qualificationStatus: "held_schedule_conflict",
    qualificationDetail:
      "HELD (sailingPageUrl withheld): Full-ship private charter (`koningsdam` `2027-10-30`) with custom Sea of Cortez ports (Cabo San Lucas, La Paz, Guaymas) not present in retail Holland America catalog (`complete: false`).",
    utmSource: "lrbc_47_sea_of_cortez",
    sailingPageUrl: null,
    valueToPitchSummary:
      "Iconic 2,600-guest full-ship charter—held until exact charter port arrival/all-aboard times for Cabo, La Paz, and Guaymas are obtained directly from LRBC.",
    phoneOpeningScript:
      "Hi — this is Erich with Cruise Promenade calling for Keven or Roger Naber's office about Legendary Rhythm & Blues Cruise #47 on October 30, 2027 aboard Koningsdam. Since it's a custom Sea of Cortez charter to Cabo, La Paz, and Guaymas, we held off publishing a page until confirming your exact port arrival and all-aboard hours.",
    voicemailScript:
      "Hi LRBC office, Erich with Cruise Promenade calling at (816) 753-7979 about LRBC #47 on October 30, 2027 Koningsdam. Since your Sea of Cortez charter has custom ports in Cabo, La Paz, and Guaymas, we wanted to verify exact port hours before showing you a free passenger excursion & stage-schedule companion.",
    phoneOrTextScript: `Hi LRBC Team — quick port-hour check on LRBC #47 (Oct 30, 2027 Koningsdam Sea of Cortez charter) before enabling a verified charter schedule page. ${HOSTED_ORGANIZER_CORE_PITCH}`,
    likelyObjection:
      "Full-ship charters aren't listed on public cruise-line schedules.",
    objectionResponse:
      "Exactly why we held the page rather than guessing—we only activate a charter page when the producer confirms exact port windows.",
    emailSubject:
      "Custom charter port-window check for LRBC #47 (Oct 30, 2027 Koningsdam)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Roger, Keven & LRBC Team,",
      introLine:
        "Quick question regarding Legendary Rhythm & Blues Cruise #47 aboard Holland America's Koningsdam (October 30 – November 6, 2027 from San Diego):",
      sailingUrl: null,
      utmSource: "lrbc_47_sea_of_cortez",
      scheduleNote:
        "Because full-ship charters aren't published in retail Holland America feeds, we held off creating a live page until confirming your exact arrival and all-aboard hours for Cabo San Lucas, La Paz, and Guaymas.",
    }),
    recommendedNextAction:
      "HELD — Confirm official charter port windows for Cabo, La Paz & Guaymas with LRBC ((816) 753-7979) before publishing any URL.",
    outreachStatus: "held_pending_schedule_check",
    notes:
      "Held strictly because full-ship private charter ports are omitted from retail HAL feeds. 0 outreach messages sent.",
  },

  // ============================================================================
  // RANKS 41–44: PRESERVED EXISTING EMAIL/PORTAL RECORDS (Deduplicated, 0 Padding)
  // ============================================================================
  {
    leadId: "fintalks",
    priorityRank: 41,
    leadName: "FinTalks Royal Icon Cruise",
    contactName: "Amberly Grant / FinTalks Travel Desk",
    organizerRole: "Creator Host & Dedicated Travel Desk, FinTalks",
    phone: null,
    phoneInvitesText: false,
    email: "travel@amberlygrant.com",
    altEmails: [],
    contactPageUrl: "https://www.amberlygrant.com/caribbean-cruise-icon",
    officialUrl: "https://www.amberlygrant.com/caribbean-cruise-icon",
    eventPageUrl: "https://www.amberlygrant.com/caribbean-cruise-icon",
    contactTimezone: "America/Chicago (CT)",
    bestCallingWindow: "Email-only record (no public business phone published)",
    cohortDescription:
      "Creator & personal finance community group sailing out of Miami",
    cruiseLine: "Royal Caribbean International",
    hostedCruiseAndSailing:
      "Icon of the Seas · Jan 16–23, 2027 (7N RT Miami)",
    shipName: "Icon of the Seas",
    shipSlug: "icon-of-the-seas",
    sailDate: "2027-01-16",
    returnDate: "2027-01-23",
    portWindowsSummary:
      "St. Maarten 08:00–18:00 · St. Thomas Crown Bay early window 07:00–14:30 · Perfect Day at CocoCay 08:30–17:00",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Preserved existing email-verified record; live page verified against Royal Caribbean Icon of the Seas 7N Eastern Caribbean schedule.",
    utmSource: "fintalks",
    sailingPageUrl: buildSailingUtmUrl("icon-of-the-seas", "2027-01-16", "fintalks"),
    valueToPitchSummary:
      "Early 07:00–14:30 St. Thomas port window makes group timing & excursion coordination practical without touching cabin bookings or advisor arrangements.",
    phoneOpeningScript: `${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION}`,
    voicemailScript: `${HOSTED_ORGANIZER_CORE_PITCH}`,
    phoneOrTextScript: `${HOSTED_ORGANIZER_CORE_PITCH} Exact Jan 16 Icon of the Seas page: ${buildSailingUtmUrl("icon-of-the-seas", "2027-01-16", "fintalks")}`,
    likelyObjection:
      "Does this interfere with our group travel advisor?",
    objectionResponse:
      "Never—cabin sales and advisor links stay completely untouched.",
    emailSubject:
      "Free port-day board for the Jan 16, 2027 Icon of the Seas group (no login / no app)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi FinTalks Travel Team,",
      introLine:
        "I saw your group is sailing on Icon of the Seas out of Miami on January 16–23, 2027.",
      sailingUrl: buildSailingUtmUrl("icon-of-the-seas", "2027-01-16", "fintalks"),
      utmSource: "fintalks",
      scheduleNote:
        "It maps the published port windows—including the early 07:00–14:30 St. Thomas call, St. Maarten (08:00–18:00), and CocoCay (08:30–17:00)—with no app download or cabin numbers collected.",
    }),
    recommendedNextAction:
      "Preserved secondary email lead (prioritize the 29 phone-verified Ready to Call leads first).",
    outreachStatus: "draft_ready",
    notes:
      "Preserved existing record; no public phone published (email travel@amberlygrant.com). Not counted toward phone-qualified total. 0 messages sent.",
  },
  {
    leadId: "acquire_it_summit",
    priorityRank: 42,
    leadName: "Acquire It Summit / Acquisition Lab",
    contactName: "Acquisition Lab Events Team",
    organizerRole: "Summit Producers, Acquisition Lab",
    phone: null,
    phoneInvitesText: false,
    email: "support@acquisitionlab.com",
    altEmails: [],
    contactPageUrl: "https://acquireit.com",
    officialUrl: "https://acquireit.com",
    eventPageUrl: "https://acquireit.com",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "Email-only record (no public business phone published)",
    cohortDescription:
      "Main Street M&A / Entrepreneurship-Through-Acquisition searchers, operators & spouses",
    cruiseLine: "Virgin Voyages",
    hostedCruiseAndSailing:
      "Brilliant Lady · Jan 21–25, 2027 (4N RT Miami)",
    shipName: "Brilliant Lady",
    shipSlug: "brilliant-lady",
    sailDate: "2027-01-21",
    returnDate: "2027-01-25",
    portWindowsSummary:
      "Dep Miami Terminal V 17:00 · Fri Jan 22 Key West Pier B 08:00–17:00 · Sat Sea · Sun Jan 24 Beach Club at Bimini 09:00–18:00",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Preserved existing email-verified record; 100% match with Virgin Voyages 4N Key West & Bimini schedule and acquireit.com agenda.",
    utmSource: "acquire_it_summit",
    sailingPageUrl: buildSailingUtmUrl("brilliant-lady", "2027-01-21", "acquire_it_summit"),
    valueToPitchSummary:
      "Published summit schedule encourages searchers, operators, and spouses to explore Key West and Bimini together during open afternoon windows.",
    phoneOpeningScript: `${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION}`,
    voicemailScript: `${HOSTED_ORGANIZER_CORE_PITCH}`,
    phoneOrTextScript: `${HOSTED_ORGANIZER_CORE_PITCH} Exact Jan 21 Brilliant Lady page: ${buildSailingUtmUrl("brilliant-lady", "2027-01-21", "acquire_it_summit")}`,
    likelyObjection:
      "Does this conflict with our morning summit workshops?",
    objectionResponse:
      "No—organizers can block off summit workshop hours and leave open afternoon Key West and Bimini windows for informal excursions.",
    emailSubject:
      "Optional Key West & Bimini port board for Acquire It Summit (Jan 21 Brilliant Lady)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Acquisition Lab Events Team,",
      introLine:
        "I saw that Acquire It Summit 2027 is gathering aboard Virgin Voyages' Brilliant Lady out of Miami on January 21–25, 2027.",
      sailingUrl: buildSailingUtmUrl("brilliant-lady", "2027-01-21", "acquire_it_summit"),
      utmSource: "acquire_it_summit",
      scheduleNote:
        "It reflects the published Miami departure (17:00), Friday's Key West call (08:00–17:00), Saturday at sea, and Sunday at The Beach Club at Bimini (09:00–18:00) with zero login wall or app download.",
    }),
    recommendedNextAction:
      "Preserved secondary email lead (prioritize the 29 phone-verified Ready to Call leads first).",
    outreachStatus: "draft_ready",
    notes:
      "Preserved existing record; no public phone published (email support@acquisitionlab.com). Not counted toward phone-qualified total. 0 messages sent.",
  },
  {
    leadId: "marketers_cruise",
    priorityRank: 43,
    leadName: "20th Annual Marketers Cruise",
    contactName: "Captain Lou Edwards & Mike Filsaime",
    organizerRole: "Producers, Special Events at Sea",
    phone: null,
    phoneInvitesText: false,
    email: null,
    altEmails: [],
    contactPageUrl: "https://marketerscruise.com",
    officialUrl: "https://marketerscruise.com",
    eventPageUrl: "https://facebook.com/groups/marketerscruisefriends",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "Portal-only record (no public phone or direct email published)",
    cohortDescription:
      "20th annual digital marketing mastermind cruise out of Port Canaveral",
    cruiseLine: "Carnival Cruise Line",
    hostedCruiseAndSailing:
      "Carnival Venezia · Jan 31 – Feb 7, 2027 (7N RT Port Canaveral)",
    shipName: "Carnival Venezia",
    shipSlug: "carnival-venezia",
    sailDate: "2027-01-31",
    returnDate: "2027-02-07",
    portWindowsSummary:
      "Dep Port Canaveral 15:30 · Mon Feb 1 Celebration Key 08:00–16:00 · Wed Feb 3 Cozumel 08:00–16:00 · Thu Feb 4 Roatan 08:00–17:00",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Preserved existing portal-only record; qualified against marketerscruise.com FAQ & Carnival Venezia 7N Jan 31 – Feb 7 schedule.",
    utmSource: "marketers_cruise",
    sailingPageUrl: buildSailingUtmUrl("carnival-venezia", "2027-01-31", "marketers_cruise"),
    valueToPitchSummary:
      "Optional self-organized port board for attendees choosing 'Option 1: go on your own' without touching Special Events at Sea VIP excursions.",
    phoneOpeningScript: `${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION}`,
    voicemailScript: `${HOSTED_ORGANIZER_CORE_PITCH}`,
    phoneOrTextScript: `${HOSTED_ORGANIZER_CORE_PITCH} Exact Jan 31 Carnival Venezia page: ${buildSailingUtmUrl("carnival-venezia", "2027-01-31", "marketers_cruise")}`,
    likelyObjection:
      "We sell our own VIP excursion packages.",
    objectionResponse:
      "It never competes with VIP packages—you can feature VIP excursions first or reserve it strictly for guests going ashore independently.",
    emailSubject:
      "Free attendee port-day board for the Jan 31, 2027 Marketers Cruise (Carnival Venezia)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Captain Lou & Marketers Cruise Team,",
      introLine:
        "Congrats on the 20th Annual Marketers Cruise sailing January 31 – February 7, 2027 aboard Carnival Venezia.",
      sailingUrl: buildSailingUtmUrl("carnival-venezia", "2027-01-31", "marketers_cruise"),
      utmSource: "marketers_cruise",
      scheduleNote:
        "It does not interfere with Special Events at Sea's cabin bookings or VIP packages and maps Celebration Key, Cozumel, and Roatan with zero login wall.",
    }),
    recommendedNextAction:
      "Preserved secondary portal lead (prioritize the 29 phone-verified Ready to Call leads first).",
    outreachStatus: "draft_ready",
    notes:
      "Preserved existing portal-only record; not counted toward phone-qualified total. 0 messages sent.",
  },
  {
    leadId: "momentum_at_sea",
    priorityRank: 44,
    leadName: "Momentum at Sea — Lou Mongello",
    contactName: "Lou Mongello",
    organizerRole: "Host & Founder, WDW Radio / Momentum Mastermind",
    phone: null,
    phoneInvitesText: false,
    email: "lou@loumongello.com",
    altEmails: ["Lou@wdwradio.com"],
    contactPageUrl: "https://www.loumongello.com/contact/",
    officialUrl: "https://www.loumongello.com/contact/",
    eventPageUrl: "https://www.loumongello.com/contact/",
    contactTimezone: "America/New_York (ET)",
    bestCallingWindow: "Email-only held record (no public phone published)",
    cohortDescription:
      "Creator & entrepreneur mastermind cruise out of Port Canaveral",
    cruiseLine: "Royal Caribbean International",
    hostedCruiseAndSailing:
      "Utopia of the Seas · Mar 15–19, 2027 (4N RT Port Canaveral — HELD: CocoCay vs. Deep Work Sea Day order)",
    shipName: "Utopia of the Seas",
    shipSlug: "utopia-of-the-seas",
    sailDate: "2027-03-15",
    returnDate: "2027-03-19",
    portWindowsSummary:
      "CONFLICT: loumongello.com schedules Wed Mar 17 'Deep Work Day' at sea & Thu Mar 18 CocoCay vs. RCI standard Wed CocoCay / Thu Sea",
    qualificationStatus: "held_schedule_conflict",
    qualificationDetail:
      "HELD (sailingPageUrl withheld): Preserved existing record held due to Wed Mar 17 Sea Day vs. Thu Mar 18 CocoCay rotation conflict.",
    utmSource: "momentum_at_sea",
    sailingPageUrl: null,
    valueToPitchSummary:
      "Held pending confirmation of Wed Mar 17 Sea Day vs. Thu Mar 18 CocoCay so nothing collides with Lou's Deep Work Day workshops.",
    phoneOpeningScript: `Quick schedule question on Momentum at Sea (March 15–19, 2027 on Utopia of the Seas): is Wednesday March 17 at sea with CocoCay on Thursday March 18? ${HOSTED_ORGANIZER_CORE_PITCH}`,
    voicemailScript: `${HOSTED_ORGANIZER_CORE_PITCH}`,
    phoneOrTextScript: `Hi Lou — quick schedule question on Momentum at Sea (March 15–19, 2027 on Utopia of the Seas): is Wednesday March 17 your Day at Sea with CocoCay on Thursday March 18? ${HOSTED_ORGANIZER_CORE_PITCH}`,
    likelyObjection:
      "We already have MEI-Travel handling cabins and mastermind sessions.",
    objectionResponse:
      "It never touches MEI-Travel's cabin block or your mastermind workshops.",
    emailSubject:
      "Quick CocoCay day check for Momentum at Sea (Mar 15 Utopia of the Seas)",
    emailBody: buildFollowUpEmailBody({
      greeting: "Hi Lou,",
      introLine:
        "Quick schedule question before we enable a planning page for Momentum at Sea aboard Utopia of the Seas (March 15–19, 2027):",
      sailingUrl: null,
      utmSource: "momentum_at_sea",
      scheduleNote:
        "On Royal Caribbean's voyage sheet for March 15, is Wednesday, March 17 at sea ('The Deep Work Day') with Perfect Day at CocoCay on Thursday, March 18? Once confirmed, we can align the page 100%.",
    }),
    recommendedNextAction:
      "HELD (email-only) — Confirm Wed Mar 17 vs. Thu Mar 18 CocoCay order before publishing any URL.",
    outreachStatus: "held_pending_schedule_check",
    notes:
      "Preserved existing email-only held record. 0 messages sent.",
  },
] as const;

const LOCAL_DEV_OUTREACH_PATH = path.join(
  process.cwd(),
  ".cache",
  "dcc-organizer-outreach-leads.json",
);

const inMemoryTestOutreachOverlays = new Map<
  string,
  StoredOrganizerLeadOverlay
>();

export function resetInMemoryOrganizerOutreachForTests(): void {
  inMemoryTestOutreachOverlays.clear();
}

export function isValidQualificationStatus(
  val: unknown,
): val is OrganizerQualificationStatus {
  return (
    typeof val === "string" &&
    (VALID_QUALIFICATION_STATUSES as readonly string[]).includes(val)
  );
}

export function isValidOutreachStatus(
  val: unknown,
): val is OrganizerOutreachStatus {
  return (
    typeof val === "string" &&
    (VALID_OUTREACH_STATUSES as readonly string[]).includes(val)
  );
}

export function sanitizeLeadId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

export function buildOrganizerOutreachFindingId(
  leadId: string,
  scope: "production" | "nonprod" = resolveEarthosEnvironmentScope(),
): string {
  return `organizer-outreach:${scope}:lead:${sanitizeLeadId(leadId)}`;
}

function resolveOutreachDatabaseUrls(): string[] {
  const scope = resolveEarthosEnvironmentScope();
  const candidates =
    scope === "nonprod"
      ? [
          process.env.DCC_NONPROD_DATABASE_URL,
          process.env.DCC_DATABASE_URL,
          process.env.DATABASE_URL,
          process.env.POSTGRES_URL,
        ]
      : [
          process.env.DCC_PRODUCTION_DATABASE_URL,
          process.env.DCC_DATABASE_URL,
          process.env.DATABASE_URL,
          process.env.POSTGRES_URL,
          process.env.DCC_NONPROD_DATABASE_URL,
        ];

  const urls: string[] = [];
  for (const candidate of candidates) {
    const trimmed = (candidate || "").trim();
    if (trimmed && /^postgres(ql)?:\/\//i.test(trimmed) && !urls.includes(trimmed)) {
      urls.push(trimmed);
      break;
    }
  }
  const drizzleResolved = resolveDatabaseUrl();
  if (drizzleResolved && !urls.includes(drizzleResolved)) {
    urls.push(drizzleResolved);
  }
  return urls;
}

function parseJsonObject(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

async function loadStoredOverlays(options?: {
  scope?: "production" | "nonprod";
  overlaysOverride?: StoredOrganizerLeadOverlay[];
}): Promise<{
  storageBackend: "postgres" | "local_dev_file" | "seed_only";
  overlaysByLeadId: Map<string, StoredOrganizerLeadOverlay>;
}> {
  const scope = options?.scope || resolveEarthosEnvironmentScope();
  const prefix = `organizer-outreach:${scope}:lead:`;
  const overlaysByLeadId = new Map<string, StoredOrganizerLeadOverlay>();

  if (options?.overlaysOverride) {
    for (const item of options.overlaysOverride) {
      if (item?.leadId) {
        overlaysByLeadId.set(sanitizeLeadId(item.leadId), item);
      }
    }
    return { storageBackend: "postgres", overlaysByLeadId };
  }

  const dbUrls =
    process.env.DCC_ISOLATED_TEST_DB === "1" ? [] : resolveOutreachDatabaseUrls();

  for (const dbUrl of dbUrls) {
    try {
      const sql = neon(dbUrl);
      const rows = (await sql`
        SELECT finding_id, status, metadata, updated_at
        FROM earthos_control_map_findings
        WHERE owner = ${ORGANIZER_OUTREACH_OWNER}
          AND finding_id LIKE ${`${prefix}%`}
        ORDER BY updated_at ASC
        LIMIT 500
      `) as Array<{
        finding_id?: string;
        status?: string;
        metadata?: unknown;
        updated_at?: string | Date;
      }>;

      for (const row of rows || []) {
        const fid = String(row.finding_id || "").trim();
        if (!fid.startsWith(prefix)) continue;
        const meta = parseJsonObject(row.metadata);
        const leadId = sanitizeLeadId(
          String(meta.leadId || fid.slice(prefix.length)),
        );
        if (!leadId) continue;
        const updatedAt =
          typeof meta.updatedAt === "string" && meta.updatedAt
            ? meta.updatedAt
            : row.updated_at instanceof Date
              ? row.updated_at.toISOString()
              : String(row.updated_at || SEEDED_TIMESTAMP_ISO);
        overlaysByLeadId.set(leadId, {
          ...(meta as unknown as StoredOrganizerLeadOverlay),
          leadId,
          updatedAt,
          updatedBy:
            typeof meta.updatedBy === "string" ? meta.updatedBy : "admin",
        });
      }
      return { storageBackend: "postgres", overlaysByLeadId };
    } catch {
      // try fallback URL or non-serverless local dev file
    }
  }

  if (!isServerlessRuntimeEnvironment()) {
    if (process.env.DCC_ISOLATED_TEST_DB !== "1") {
      try {
        if (fs.existsSync(LOCAL_DEV_OUTREACH_PATH)) {
          const parsed = JSON.parse(
            fs.readFileSync(LOCAL_DEV_OUTREACH_PATH, "utf8"),
          ) as Record<string, StoredOrganizerLeadOverlay>;
          for (const [key, val] of Object.entries(parsed || {})) {
            if (key.startsWith(`${scope}:`) && val?.leadId) {
              overlaysByLeadId.set(sanitizeLeadId(val.leadId), val);
            }
          }
        }
      } catch {
        // ignore local dev cache parse error
      }
    }
    for (const [key, val] of inMemoryTestOutreachOverlays.entries()) {
      if (key.startsWith(`${scope}:`)) {
        overlaysByLeadId.set(sanitizeLeadId(val.leadId), val);
      }
    }
    return { storageBackend: "local_dev_file", overlaysByLeadId };
  }

  return { storageBackend: "seed_only", overlaysByLeadId };
}

async function persistLeadOverlay(
  overlay: StoredOrganizerLeadOverlay,
  scope: "production" | "nonprod" = resolveEarthosEnvironmentScope(),
): Promise<{
  ok: boolean;
  backend: "postgres" | "local_dev_file" | "none";
  error?: string;
}> {
  const leadId = sanitizeLeadId(overlay.leadId);
  if (!leadId) {
    return { ok: false, backend: "none", error: "Valid leadId is required." };
  }

  const findingId = buildOrganizerOutreachFindingId(leadId, scope);
  const statusStr = overlay.deleted
    ? "deleted"
    : overlay.outreachStatus || "ready_to_call";
  const summaryNote = overlay.deleted
    ? `Deleted custom lead ${leadId}`
    : `${overlay.leadName || leadId}: ${statusStr}`;
  const payload: StoredOrganizerLeadOverlay = {
    ...overlay,
    leadId,
  };

  const dbUrls =
    process.env.DCC_ISOLATED_TEST_DB === "1" ? [] : resolveOutreachDatabaseUrls();

  if (dbUrls.length > 0) {
    try {
      const sql = neon(dbUrls[0]);
      const metadataJson = JSON.stringify(payload);
      await sql`
        INSERT INTO earthos_control_map_findings (
          finding_id,
          status,
          severity,
          owner,
          note,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          ${findingId},
          ${statusStr},
          ${"info"},
          ${ORGANIZER_OUTREACH_OWNER},
          ${summaryNote.slice(0, 480)},
          ${metadataJson}::jsonb,
          ${payload.updatedAt}::timestamptz,
          ${payload.updatedAt}::timestamptz
        )
        ON CONFLICT (finding_id) DO UPDATE SET
          status = EXCLUDED.status,
          owner = EXCLUDED.owner,
          note = EXCLUDED.note,
          metadata = EXCLUDED.metadata,
          updated_at = EXCLUDED.updated_at
      `;
      inMemoryTestOutreachOverlays.set(`${scope}:${leadId}`, payload);
      return { ok: true, backend: "postgres" };
    } catch (err) {
      if (isServerlessRuntimeEnvironment()) {
        return {
          ok: false,
          backend: "none",
          error:
            err instanceof Error
              ? err.message
              : "Failed to persist organizer outreach record in Postgres.",
        };
      }
    }
  }

  // Strict serverless durability rule: NEVER pretend in-memory writes succeeded on Vercel.
  if (isServerlessRuntimeEnvironment()) {
    return {
      ok: false,
      backend: "none",
      error:
        "Durable Postgres database connection unavailable for organizer outreach persistence.",
    };
  }

  inMemoryTestOutreachOverlays.set(`${scope}:${leadId}`, payload);
  if (process.env.DCC_ISOLATED_TEST_DB !== "1") {
    try {
      const dir = path.dirname(LOCAL_DEV_OUTREACH_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      let existing: Record<string, StoredOrganizerLeadOverlay> = {};
      if (fs.existsSync(LOCAL_DEV_OUTREACH_PATH)) {
        existing = JSON.parse(
          fs.readFileSync(LOCAL_DEV_OUTREACH_PATH, "utf8"),
        ) as Record<string, StoredOrganizerLeadOverlay>;
      }
      existing[`${scope}:${leadId}`] = payload;
      fs.writeFileSync(
        LOCAL_DEV_OUTREACH_PATH,
        JSON.stringify(existing, null, 2),
        "utf8",
      );
    } catch {
      // isolated test run keeps overlay in inMemoryTestOutreachOverlays
    }
  }

  return { ok: true, backend: "local_dev_file" };
}

function extractTelemetryByUtmSource(
  events: ReadonlyArray<CorridorEventInput>,
): Map<string, OrganizerTelemetryAttribution> {
  const bySource = new Map<
    string,
    {
      sessions: Set<string>;
      sailingViewsCount: number;
      startBoardCount: number;
      boardsCreatedCount: number;
      guestJoinEventsCount: number;
      shareCodes: Set<string>;
      lastActivityAt: string | null;
    }
  >();

  const sessionToSource = new Map<string, string>();
  const launchEpochMs = Date.parse(CRUISE_PROMENADE_LAUNCH_EPOCH_ISO);

  for (const event of events) {
    const meta = parseJsonObject(event.metadata);
    if (meta.site !== "cruise-promenade") continue;
    if (meta.test === true || meta.is_test === true || meta.synthetic === true) {
      continue;
    }
    const ctx = parseJsonObject(meta.context);
    if (ctx.isTest === true) continue;

    const sessionId =
      typeof event.sessionId === "string" ? event.sessionId.trim() : "";
    if (/^(smoke_|test_|qa_|e2e_|pw_)/i.test(sessionId)) continue;

    let rawSrc =
      (typeof ctx.utmSource === "string" && ctx.utmSource.trim()) ||
      (typeof ctx.utm_source === "string" && ctx.utm_source.trim()) ||
      "";
    if (!rawSrc) {
      const sp =
        (typeof event.sourcePage === "string" && event.sourcePage) ||
        (typeof event.landingPath === "string" && event.landingPath) ||
        "";
      const qIdx = sp.indexOf("?");
      if (qIdx >= 0) {
        try {
          const qs = new URLSearchParams(sp.slice(qIdx + 1));
          rawSrc = (qs.get("utm_source") || "").trim();
        } catch {
          // ignore
        }
      }
    }
    if (rawSrc && sessionId) {
      sessionToSource.set(sessionId, sanitizeUtmSource(rawSrc));
    }
  }

  for (const event of events) {
    const meta = parseJsonObject(event.metadata);
    if (meta.site !== "cruise-promenade") continue;
    if (meta.test === true || meta.is_test === true || meta.synthetic === true) {
      continue;
    }
    const ctx = parseJsonObject(meta.context);
    if (ctx.isTest === true) continue;

    const rawTime =
      event.occurredAt instanceof Date
        ? event.occurredAt.toISOString()
        : typeof event.occurredAt === "string"
          ? event.occurredAt
          : event.createdAt instanceof Date
            ? event.createdAt.toISOString()
            : typeof event.createdAt === "string"
              ? event.createdAt
              : null;
    if (rawTime) {
      const ms = Date.parse(rawTime);
      if (Number.isFinite(launchEpochMs) && Number.isFinite(ms) && ms < launchEpochMs) {
        continue;
      }
    }

    const sessionId =
      typeof event.sessionId === "string" ? event.sessionId.trim() : "";
    if (/^(smoke_|test_|qa_|e2e_|pw_)/i.test(sessionId)) continue;

    const shareCodeRaw =
      typeof ctx.shareCode === "string" ? ctx.shareCode.trim().toUpperCase() : "";
    if (/^(DEMO-|QA-|TEST-|E2E-|SMOKE-|PILOT-)/.test(shareCodeRaw)) continue;

    let src =
      (typeof ctx.utmSource === "string" && sanitizeUtmSource(ctx.utmSource)) ||
      (typeof ctx.utm_source === "string" && sanitizeUtmSource(ctx.utm_source)) ||
      (sessionId ? sessionToSource.get(sessionId) || "" : "");

    if (!src) {
      const sp =
        (typeof event.sourcePage === "string" && event.sourcePage) ||
        (typeof event.landingPath === "string" && event.landingPath) ||
        "";
      const qIdx = sp.indexOf("?");
      if (qIdx >= 0) {
        try {
          const qs = new URLSearchParams(sp.slice(qIdx + 1));
          const qUtm = qs.get("utm_source");
          if (qUtm) src = sanitizeUtmSource(qUtm);
        } catch {
          // ignore
        }
      }
    }

    if (!src) continue;

    const bucket = bySource.get(src) || {
      sessions: new Set<string>(),
      sailingViewsCount: 0,
      startBoardCount: 0,
      boardsCreatedCount: 0,
      guestJoinEventsCount: 0,
      shareCodes: new Set<string>(),
      lastActivityAt: null,
    };

    if (sessionId) bucket.sessions.add(sessionId);
    const evName = String(meta.original_event_name || event.eventName || "");
    if (evName === "sailing_page_viewed") bucket.sailingViewsCount += 1;
    if (evName === "start_board_selected") bucket.startBoardCount += 1;
    if (evName === "board_created" || evName === "cp_board_created") {
      bucket.boardsCreatedCount += 1;
      if (shareCodeRaw) bucket.shareCodes.add(shareCodeRaw);
    }
    if (evName === "first_guest_joined" || evName === "first_activity_response") {
      bucket.guestJoinEventsCount += 1;
      if (shareCodeRaw) bucket.shareCodes.add(shareCodeRaw);
    }
    if (
      rawTime &&
      (!bucket.lastActivityAt ||
        Date.parse(rawTime) > Date.parse(bucket.lastActivityAt))
    ) {
      bucket.lastActivityAt = rawTime;
    }

    bySource.set(src, bucket);
  }

  const out = new Map<string, OrganizerTelemetryAttribution>();
  for (const [utmSource, b] of bySource.entries()) {
    out.set(utmSource, {
      utmSource,
      sessionsCount: b.sessions.size,
      sailingViewsCount: b.sailingViewsCount,
      startBoardCount: b.startBoardCount,
      boardsCreatedCount: b.boardsCreatedCount,
      guestJoinEventsCount: b.guestJoinEventsCount,
      detectedShareCodes: Array.from(b.shareCodes),
      lastActivityAt: b.lastActivityAt,
    });
  }
  return out;
}

function emptyTelemetry(utmSource: string): OrganizerTelemetryAttribution {
  return {
    utmSource,
    sessionsCount: 0,
    sailingViewsCount: 0,
    startBoardCount: 0,
    boardsCreatedCount: 0,
    guestJoinEventsCount: 0,
    detectedShareCodes: [],
    lastActivityAt: null,
  };
}

function mergeSeedAndOverlay(
  seed: SeedLeadDefinition | null,
  overlay: StoredOrganizerLeadOverlay | undefined,
  telemetryMap: Map<string, OrganizerTelemetryAttribution>,
): OrganizerOutreachLead | null {
  if (overlay?.deleted && !seed) {
    return null;
  }

  const leadId = seed ? seed.leadId : sanitizeLeadId(overlay?.leadId || "");
  if (!leadId) return null;

  const qualificationStatus: OrganizerQualificationStatus =
    overlay?.qualificationStatus &&
    isValidQualificationStatus(overlay.qualificationStatus)
      ? overlay.qualificationStatus
      : seed?.qualificationStatus || "needs_sailing_qualification";

  const utmSource =
    sanitizeUtmSource(overlay?.utmSource || seed?.utmSource || leadId) ||
    leadId;

  const rawCandidateSailingUrl =
    overlay?.sailingPageUrl !== undefined
      ? overlay.sailingPageUrl
      : seed?.sailingPageUrl ?? null;

  const sailingPageUrl = sanitizeQualifiedSailingUrl(
    rawCandidateSailingUrl,
    qualificationStatus,
  );

  const phone =
    overlay?.phone !== undefined
      ? overlay.phone && overlay.phone.trim()
        ? overlay.phone.trim()
        : null
      : seed?.phone ?? null;

  const phoneInvitesText =
    overlay?.phoneInvitesText !== undefined
      ? Boolean(overlay.phoneInvitesText)
      : Boolean(seed?.phoneInvitesText);

  const email =
    overlay?.email !== undefined
      ? overlay.email && overlay.email.trim()
        ? overlay.email.trim()
        : null
      : seed?.email ?? null;

  const outreachStatus: OrganizerOutreachStatus =
    overlay?.outreachStatus && isValidOutreachStatus(overlay.outreachStatus)
      ? overlay.outreachStatus
      : seed?.outreachStatus ||
        (phone ? "ready_to_call" : "draft_ready");

  const hasSentOutreach =
    CONTACTED_OUTREACH_STATUSES.has(outreachStatus) ||
    (typeof overlay?.outreachCount === "number" && overlay.outreachCount > 0);

  const outreachCount =
    typeof overlay?.outreachCount === "number" && overlay.outreachCount >= 0
      ? overlay.outreachCount
      : hasSentOutreach
        ? 1
        : 0;

  const telemetry =
    telemetryMap.get(utmSource) || emptyTelemetry(utmSource);

  const manualBoard = normalizeShareCodeAndBoardUrl({
    boardShareCode: overlay?.boardShareCode,
    boardUrl: overlay?.boardUrl,
  });

  const detectedCode = telemetry.detectedShareCodes[0] || null;
  const effectiveShareCode = manualBoard.boardShareCode || detectedCode;
  const effectiveBoardUrl =
    manualBoard.boardUrl ||
    (effectiveShareCode
      ? `https://cruisepromenade.com/p/${effectiveShareCode}`
      : null);

  const boardCreated =
    Boolean(overlay?.boardCreated) ||
    outreachStatus === "board_live" ||
    outreachStatus === "first_traveler_joined" ||
    Boolean(effectiveShareCode) ||
    telemetry.boardsCreatedCount > 0;

  const manualTravelers =
    typeof overlay?.travelersJoined === "number" &&
    Number.isFinite(overlay.travelersJoined) &&
    overlay.travelersJoined >= 0
      ? Math.floor(overlay.travelersJoined)
      : 0;

  const travelersJoined = Math.max(
    manualTravelers,
    telemetry.guestJoinEventsCount,
    outreachStatus === "first_traveler_joined" ? 1 : 0,
  );

  const followUpDate =
    typeof overlay?.followUpDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(overlay.followUpDate.trim())
      ? overlay.followUpDate.trim()
      : null;

  const shipName =
    (overlay?.shipName && overlay.shipName.trim()) ||
    seed?.shipName ||
    "Ship TBD";
  const sailDate =
    overlay?.sailDate !== undefined
      ? overlay.sailDate && /^\d{4}-\d{2}-\d{2}$/.test(overlay.sailDate.trim())
        ? overlay.sailDate.trim()
        : null
      : seed?.sailDate ?? null;

  const hostedCruiseAndSailing =
    (overlay?.hostedCruiseAndSailing &&
      overlay.hostedCruiseAndSailing.trim()) ||
    seed?.hostedCruiseAndSailing ||
    `${shipName}${sailDate ? ` · ${sailDate}` : ""}`;

  const leadName =
    (overlay?.leadName && overlay.leadName.trim()) ||
    seed?.leadName ||
    leadId;

  const defaultOpening =
    qualificationStatus === "qualified_page_live" && sailingPageUrl
      ? `Hi ${leadName} team — this is Erich with Cruise Promenade. ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION}`
      : `Hi ${leadName} team — quick question to confirm your exact cruise ship and port day schedule before enabling a free shared group page. ${HOSTED_ORGANIZER_CORE_PITCH}`;

  const defaultScript =
    qualificationStatus === "qualified_page_live" && sailingPageUrl
      ? `Hi ${leadName} team — ${HOSTED_ORGANIZER_CORE_PITCH} ${REQUESTED_CALL_ACTION} Exact sailing page: ${sailingPageUrl}`
      : `Hi ${leadName} team — quick question to confirm your exact cruise ship and port day schedule! ${HOSTED_ORGANIZER_CORE_PITCH}`;

  const officialUrl =
    overlay?.officialUrl !== undefined
      ? overlay.officialUrl && overlay.officialUrl.trim()
        ? overlay.officialUrl.trim()
        : null
      : seed?.officialUrl ?? null;

  return {
    leadId,
    isSeeded: Boolean(seed),
    priorityRank:
      typeof overlay?.priorityRank === "number"
        ? overlay.priorityRank
        : seed?.priorityRank ?? 99,
    leadName,
    contactName:
      overlay?.contactName !== undefined
        ? overlay.contactName && overlay.contactName.trim()
          ? overlay.contactName.trim()
          : null
        : seed?.contactName ?? null,
    organizerRole:
      overlay?.organizerRole !== undefined
        ? overlay.organizerRole && overlay.organizerRole.trim()
          ? overlay.organizerRole.trim()
          : null
        : seed?.organizerRole ?? null,
    phone,
    phoneDial: normalizePhoneDial(phone),
    phoneInvitesText,
    email,
    altEmails: Array.isArray(overlay?.altEmails)
      ? overlay.altEmails
      : seed?.altEmails
        ? [...seed.altEmails]
        : [],
    contactPageUrl:
      overlay?.contactPageUrl !== undefined
        ? overlay.contactPageUrl && overlay.contactPageUrl.trim()
          ? overlay.contactPageUrl.trim()
          : null
        : seed?.contactPageUrl ?? officialUrl,
    officialUrl,
    eventPageUrl:
      overlay?.eventPageUrl !== undefined
        ? overlay.eventPageUrl && overlay.eventPageUrl.trim()
          ? overlay.eventPageUrl.trim()
          : null
        : seed?.eventPageUrl ?? officialUrl,
    contactTimezone:
      (overlay?.contactTimezone && overlay.contactTimezone.trim()) ||
      seed?.contactTimezone ||
      "America/New_York (ET)",
    bestCallingWindow:
      (overlay?.bestCallingWindow && overlay.bestCallingWindow.trim()) ||
      seed?.bestCallingWindow ||
      "9:30 AM – 4:30 PM local business hours",
    cohortDescription:
      (overlay?.cohortDescription && overlay.cohortDescription.trim()) ||
      seed?.cohortDescription ||
      "Hosted group cruise cohort",
    cruiseLine:
      (overlay?.cruiseLine && overlay.cruiseLine.trim()) ||
      seed?.cruiseLine ||
      "Cruise Line TBD",
    hostedCruiseAndSailing,
    shipName,
    shipSlug:
      overlay?.shipSlug !== undefined
        ? overlay.shipSlug
        : seed?.shipSlug ?? null,
    sailDate,
    returnDate:
      overlay?.returnDate !== undefined
        ? overlay.returnDate
        : seed?.returnDate ?? null,
    portWindowsSummary:
      (overlay?.portWindowsSummary && overlay.portWindowsSummary.trim()) ||
      seed?.portWindowsSummary ||
      "Confirm port arrival, all-aboard, and 2-hour return buffer before publishing.",
    qualificationStatus,
    qualificationLabel: QUALIFICATION_STATUS_LABELS[qualificationStatus],
    qualificationDetail:
      (overlay?.qualificationDetail && overlay.qualificationDetail.trim()) ||
      seed?.qualificationDetail ||
      QUALIFICATION_STATUS_LABELS[qualificationStatus],
    utmSource,
    sailingPageUrl,
    groupsSetupUrl: buildGroupsSetupUrl(utmSource),
    valueToPitchSummary:
      (overlay?.valueToPitchSummary && overlay.valueToPitchSummary.trim()) ||
      seed?.valueToPitchSummary ||
      HOSTED_ORGANIZER_CORE_PITCH,
    corePitchVerbatim: HOSTED_ORGANIZER_CORE_PITCH,
    requestedCallAction: REQUESTED_CALL_ACTION,
    phoneOpeningScript:
      (overlay?.phoneOpeningScript && overlay.phoneOpeningScript.trim()) ||
      seed?.phoneOpeningScript ||
      defaultOpening,
    voicemailScript:
      (overlay?.voicemailScript && overlay.voicemailScript.trim()) ||
      seed?.voicemailScript ||
      `Hi ${leadName} team, this is Erich at Cruise Promenade. ${HOSTED_ORGANIZER_CORE_PITCH} My number is on caller ID if you'd like the link for your sailing.`,
    phoneOrTextScript:
      (overlay?.phoneOrTextScript && overlay.phoneOrTextScript.trim()) ||
      seed?.phoneOrTextScript ||
      defaultScript,
    likelyObjection:
      (overlay?.likelyObjection && overlay.likelyObjection.trim()) ||
      seed?.likelyObjection ||
      "We already have a travel advisor handling cabins and our own group events.",
    objectionResponse:
      (overlay?.objectionResponse && overlay.objectionResponse.trim()) ||
      seed?.objectionResponse ||
      "It never interferes with your cabin sales, travel advisor, or onboard programming—you can attach your own preferred links and event times.",
    emailSubject:
      (overlay?.emailSubject && overlay.emailSubject.trim()) ||
      seed?.emailSubject ||
      `Free shared cruise page for ${leadName}`,
    emailBody:
      (overlay?.emailBody && overlay.emailBody.trim()) ||
      seed?.emailBody ||
      `Hi ${leadName} Team,\n\n${HOSTED_ORGANIZER_CORE_PITCH}\n\nBest,\nErich\nCruise Promenade`,
    recommendedNextAction:
      (overlay?.recommendedNextAction && overlay.recommendedNextAction.trim()) ||
      seed?.recommendedNextAction ||
      (qualificationStatus === "qualified_page_live"
        ? REQUESTED_CALL_ACTION
        : "Confirm exact ship and port schedule before sharing a live sailing URL."),
    outreachStatus,
    outreachStatusLabel: OUTREACH_STATUS_LABELS[outreachStatus],
    hasSentOutreach,
    outreachCount,
    lastContactedAt: overlay?.lastContactedAt ?? seed?.lastContactedAt ?? null,
    lastContactChannel: overlay?.lastContactChannel ?? seed?.lastContactChannel ?? null,
    followUpDate,
    notes:
      overlay?.notes !== undefined
        ? overlay.notes
        : seed?.notes || "",
    boardCreated,
    boardShareCode: effectiveShareCode,
    boardUrl: effectiveBoardUrl,
    travelersJoined,
    telemetry,
    updatedAt: overlay?.updatedAt || SEEDED_TIMESTAMP_ISO,
    updatedBy: overlay?.updatedBy || "system_seed",
  };
}

export async function getOrganizerOutreachDashboard(options?: {
  scope?: "production" | "nonprod";
  overlaysOverride?: StoredOrganizerLeadOverlay[];
  corridorEventsOverride?: ReadonlyArray<CorridorEventInput>;
  todayDateIso?: string;
}): Promise<OrganizerOutreachDashboardSnapshot> {
  const scope = options?.scope || resolveEarthosEnvironmentScope();
  const generatedAt = new Date().toISOString();
  const todayYmd = (options?.todayDateIso || generatedAt).slice(0, 10);

  const [{ storageBackend, overlaysByLeadId }, corridorEvents] =
    await Promise.all([
      loadStoredOverlays({
        scope,
        overlaysOverride: options?.overlaysOverride,
      }),
      options?.corridorEventsOverride !== undefined
        ? Promise.resolve(options.corridorEventsOverride)
        : process.env.DCC_DISABLE_NEON_COMMERCE === "1" ||
            process.env.DCC_ISOLATED_TEST_DB === "1"
          ? Promise.resolve([])
          : listRecentProductionCorridorEvents(3000).catch(() => []),
    ]);

  const telemetryMap = extractTelemetryByUtmSource(corridorEvents);
  const seededIds = new Set<string>();
  const leads: OrganizerOutreachLead[] = [];

  for (const seed of SEEDED_ORGANIZER_LEAD_DEFINITIONS) {
    seededIds.add(seed.leadId);
    const merged = mergeSeedAndOverlay(
      seed,
      overlaysByLeadId.get(seed.leadId),
      telemetryMap,
    );
    if (merged) leads.push(merged);
  }

  for (const [leadId, overlay] of overlaysByLeadId.entries()) {
    if (seededIds.has(leadId)) continue;
    const merged = mergeSeedAndOverlay(null, overlay, telemetryMap);
    if (merged) leads.push(merged);
  }

  leads.sort(
    (a, b) =>
      a.priorityRank - b.priorityRank || a.leadName.localeCompare(b.leadName),
  );

  const kpis: OrganizerOutreachKpis = {
    totalLeadsCount: leads.length,
    phoneLeadsCount: leads.filter((l) => Boolean(l.phone)).length,
    phoneQualifiedReadyCount: leads.filter(
      (l) => Boolean(l.phone) && l.qualificationStatus === "qualified_page_live",
    ).length,
    qualifiedReadyCount: leads.filter(
      (l) => l.qualificationStatus === "qualified_page_live",
    ).length,
    heldOrNeedsQualificationCount: leads.filter(
      (l) => l.qualificationStatus !== "qualified_page_live",
    ).length,
    outreachSentLeadsCount: leads.filter((l) => l.hasSentOutreach).length,
    totalOutreachTouchesCount: leads.reduce(
      (sum, l) => sum + l.outreachCount,
      0,
    ),
    repliedCount: leads.filter((l) =>
      REPLIED_OUTREACH_STATUSES.has(l.outreachStatus),
    ).length,
    followUpsDueCount: leads.filter(
      (l) => Boolean(l.followUpDate && l.followUpDate <= todayYmd),
    ).length,
    boardsCreatedCount: leads.filter((l) => l.boardCreated).length,
    travelersJoinedCount: leads.reduce((sum, l) => sum + l.travelersJoined, 0),
  };

  return {
    ok: true,
    generatedAt,
    environmentScope: scope,
    storageBackend,
    corePitchVerbatim: HOSTED_ORGANIZER_CORE_PITCH,
    requestedCallAction: REQUESTED_CALL_ACTION,
    kpis,
    leads,
  };
}

export interface UpdateOrganizerOutreachLeadInput {
  leadId: string;
  outreachStatus?: OrganizerOutreachStatus;
  qualificationStatus?: OrganizerQualificationStatus;
  qualificationDetail?: string;
  cruiseLine?: string;
  hostedCruiseAndSailing?: string;
  shipName?: string;
  sailDate?: string | null;
  sailingPageUrl?: string | null;
  phone?: string | null;
  phoneInvitesText?: boolean;
  email?: string | null;
  contactPageUrl?: string | null;
  officialUrl?: string | null;
  contactName?: string | null;
  organizerRole?: string | null;
  contactTimezone?: string;
  bestCallingWindow?: string;
  valueToPitchSummary?: string;
  phoneOpeningScript?: string;
  voicemailScript?: string;
  phoneOrTextScript?: string;
  likelyObjection?: string;
  objectionResponse?: string;
  emailSubject?: string;
  emailBody?: string;
  recommendedNextAction?: string;
  followUpDate?: string | null;
  notes?: string;
  boardCreated?: boolean;
  boardShareCode?: string | null;
  boardUrl?: string | null;
  travelersJoined?: number;
  /** Optional 1-click log action ("call" | "text" | "email" | "portal") */
  logTouchChannel?: "call" | "text" | "email" | "portal";
  logTouchSummary?: string;
  updatedBy?: string;
  scope?: "production" | "nonprod";
}

export async function updateOrganizerOutreachLead(
  input: UpdateOrganizerOutreachLeadInput,
): Promise<{
  ok: boolean;
  backend: "postgres" | "local_dev_file" | "none";
  lead?: OrganizerOutreachLead;
  error?: string;
}> {
  const scope = input.scope || resolveEarthosEnvironmentScope();
  const leadId = sanitizeLeadId(input.leadId || "");
  if (!leadId) {
    return { ok: false, backend: "none", error: "Valid leadId is required." };
  }

  const seed =
    SEEDED_ORGANIZER_LEAD_DEFINITIONS.find((s) => s.leadId === leadId) || null;
  const { overlaysByLeadId } = await loadStoredOverlays({ scope });
  const existing = overlaysByLeadId.get(leadId);

  if (!seed && (!existing || existing.deleted)) {
    return {
      ok: false,
      backend: "none",
      error: `Organizer lead '${leadId}' not found.`,
    };
  }

  if (
    input.outreachStatus !== undefined &&
    !isValidOutreachStatus(input.outreachStatus)
  ) {
    return {
      ok: false,
      backend: "none",
      error: `Invalid outreachStatus: ${String(input.outreachStatus)}`,
    };
  }

  if (
    input.qualificationStatus !== undefined &&
    !isValidQualificationStatus(input.qualificationStatus)
  ) {
    return {
      ok: false,
      backend: "none",
      error: `Invalid qualificationStatus: ${String(input.qualificationStatus)}`,
    };
  }

  const nowIso = new Date().toISOString();
  const actor = (input.updatedBy || "admin").trim().slice(0, 80) || "admin";

  const nextQualification: OrganizerQualificationStatus =
    input.qualificationStatus ??
    existing?.qualificationStatus ??
    seed?.qualificationStatus ??
    "needs_sailing_qualification";

  let nextSailingPageUrl =
    input.sailingPageUrl !== undefined
      ? input.sailingPageUrl
      : existing?.sailingPageUrl !== undefined
        ? existing.sailingPageUrl
        : seed?.sailingPageUrl ?? null;

  if (nextQualification !== "qualified_page_live") {
    nextSailingPageUrl = null;
  } else if (nextSailingPageUrl) {
    const validatedUrl = sanitizeQualifiedSailingUrl(
      nextSailingPageUrl,
      nextQualification,
    );
    if (!validatedUrl) {
      return {
        ok: false,
        backend: "none",
        error:
          "sailingPageUrl must be a valid https://cruisepromenade.com/sailings/... URL.",
      };
    }
    nextSailingPageUrl = validatedUrl;
  }

  let nextOutreachStatus: OrganizerOutreachStatus =
    input.outreachStatus ??
    existing?.outreachStatus ??
    seed?.outreachStatus ??
    "ready_to_call";

  let prevTouches =
    typeof existing?.outreachCount === "number" ? existing.outreachCount : 0;
  let lastContactedAt = existing?.lastContactedAt ?? null;
  let lastContactChannel = existing?.lastContactChannel ?? null;
  let nextNotes =
    input.notes !== undefined
      ? input.notes.slice(0, 4000)
      : existing?.notes !== undefined
        ? existing.notes
        : seed?.notes || "";

  if (input.logTouchChannel) {
    prevTouches += 1;
    lastContactedAt = nowIso;
    lastContactChannel = input.logTouchChannel;
    if (!input.outreachStatus) {
      if (input.logTouchChannel === "call") nextOutreachStatus = "called_spoke";
      else if (input.logTouchChannel === "text") nextOutreachStatus = "texted";
      else nextOutreachStatus = "emailed";
    }
    const stamp = nowIso.slice(0, 16).replace("T", " ") + " UTC";
    const summaryLine =
      (input.logTouchSummary || "").trim() ||
      `Logged ${input.logTouchChannel.toUpperCase()} (${OUTREACH_STATUS_LABELS[nextOutreachStatus]})`;
    nextNotes = `[${stamp}] ${summaryLine}${nextNotes ? `\n${nextNotes}` : ""}`.slice(
      0,
      4000,
    );
  } else if (
    CONTACTED_OUTREACH_STATUSES.has(nextOutreachStatus) &&
    prevTouches === 0
  ) {
    prevTouches = 1;
    lastContactedAt = lastContactedAt || nowIso;
  } else if (!CONTACTED_OUTREACH_STATUSES.has(nextOutreachStatus) && input.outreachStatus) {
    if (
      nextOutreachStatus === "ready_to_call" ||
      nextOutreachStatus === "needs_qualification_call" ||
      nextOutreachStatus === "draft_ready" ||
      nextOutreachStatus === "held_pending_schedule_check"
    ) {
      prevTouches = 0;
      lastContactedAt = null;
      lastContactChannel = null;
    }
  }

  let nextFollowUpDate: string | null =
    input.followUpDate !== undefined
      ? input.followUpDate && input.followUpDate.trim()
        ? input.followUpDate.trim()
        : null
      : existing?.followUpDate ?? null;

  if (nextFollowUpDate && !/^\d{4}-\d{2}-\d{2}$/.test(nextFollowUpDate)) {
    return {
      ok: false,
      backend: "none",
      error: "followUpDate must be YYYY-MM-DD or null.",
    };
  }

  if (
    input.logTouchChannel &&
    !nextFollowUpDate &&
    input.followUpDate === undefined &&
    nextOutreachStatus !== "not_a_fit" &&
    nextOutreachStatus !== "wrong_contact"
  ) {
    const d = new Date(Date.now() + 3 * 86_400_000);
    nextFollowUpDate = d.toISOString().slice(0, 10);
  }

  const normalizedBoard = normalizeShareCodeAndBoardUrl({
    boardShareCode:
      input.boardShareCode !== undefined
        ? input.boardShareCode
        : existing?.boardShareCode,
    boardUrl:
      input.boardUrl !== undefined ? input.boardUrl : existing?.boardUrl,
  });

  const nextBoardCreated =
    input.boardCreated !== undefined
      ? Boolean(input.boardCreated)
      : Boolean(normalizedBoard.boardShareCode) ||
        nextOutreachStatus === "board_live" ||
        nextOutreachStatus === "first_traveler_joined" ||
        Boolean(existing?.boardCreated);

  const nextTravelersJoined =
    input.travelersJoined !== undefined
      ? Math.max(0, Math.floor(Number(input.travelersJoined) || 0))
      : nextOutreachStatus === "first_traveler_joined"
        ? Math.max(1, existing?.travelersJoined ?? 0)
        : existing?.travelersJoined ?? 0;

  const nextOverlay: StoredOrganizerLeadOverlay = {
    ...existing,
    leadId,
    isCustomLead: !seed,
    qualificationStatus: nextQualification,
    ...(input.qualificationDetail !== undefined
      ? { qualificationDetail: input.qualificationDetail.slice(0, 1000) }
      : {}),
    ...(input.cruiseLine !== undefined
      ? { cruiseLine: input.cruiseLine.slice(0, 120) }
      : {}),
    ...(input.hostedCruiseAndSailing !== undefined
      ? { hostedCruiseAndSailing: input.hostedCruiseAndSailing.slice(0, 240) }
      : {}),
    ...(input.shipName !== undefined
      ? { shipName: input.shipName.slice(0, 120) }
      : {}),
    ...(input.sailDate !== undefined ? { sailDate: input.sailDate } : {}),
    sailingPageUrl: nextSailingPageUrl,
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.phoneInvitesText !== undefined
      ? { phoneInvitesText: Boolean(input.phoneInvitesText) }
      : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.contactPageUrl !== undefined
      ? { contactPageUrl: input.contactPageUrl }
      : {}),
    ...(input.officialUrl !== undefined
      ? { officialUrl: input.officialUrl }
      : {}),
    ...(input.contactName !== undefined
      ? { contactName: input.contactName }
      : {}),
    ...(input.organizerRole !== undefined
      ? { organizerRole: input.organizerRole }
      : {}),
    ...(input.contactTimezone !== undefined
      ? { contactTimezone: input.contactTimezone.slice(0, 80) }
      : {}),
    ...(input.bestCallingWindow !== undefined
      ? { bestCallingWindow: input.bestCallingWindow.slice(0, 180) }
      : {}),
    ...(input.valueToPitchSummary !== undefined
      ? { valueToPitchSummary: input.valueToPitchSummary.slice(0, 1000) }
      : {}),
    ...(input.phoneOpeningScript !== undefined
      ? { phoneOpeningScript: input.phoneOpeningScript.slice(0, 2500) }
      : {}),
    ...(input.voicemailScript !== undefined
      ? { voicemailScript: input.voicemailScript.slice(0, 2500) }
      : {}),
    ...(input.phoneOrTextScript !== undefined
      ? { phoneOrTextScript: input.phoneOrTextScript.slice(0, 2500) }
      : {}),
    ...(input.likelyObjection !== undefined
      ? { likelyObjection: input.likelyObjection.slice(0, 600) }
      : {}),
    ...(input.objectionResponse !== undefined
      ? { objectionResponse: input.objectionResponse.slice(0, 1200) }
      : {}),
    ...(input.emailSubject !== undefined
      ? { emailSubject: input.emailSubject.slice(0, 240) }
      : {}),
    ...(input.emailBody !== undefined
      ? { emailBody: input.emailBody.slice(0, 5000) }
      : {}),
    ...(input.recommendedNextAction !== undefined
      ? { recommendedNextAction: input.recommendedNextAction.slice(0, 600) }
      : {}),
    outreachStatus: nextOutreachStatus,
    outreachCount: prevTouches,
    lastContactedAt,
    lastContactChannel,
    followUpDate: nextFollowUpDate,
    notes: nextNotes,
    boardCreated: nextBoardCreated,
    boardShareCode: normalizedBoard.boardShareCode,
    boardUrl: normalizedBoard.boardUrl,
    travelersJoined: nextTravelersJoined,
    updatedAt: nowIso,
    updatedBy: actor,
  };

  const saved = await persistLeadOverlay(nextOverlay, scope);
  if (!saved.ok) {
    return { ok: false, backend: saved.backend, error: saved.error };
  }

  const dashboard = await getOrganizerOutreachDashboard({ scope });
  const updatedLead = dashboard.leads.find((l) => l.leadId === leadId);
  return {
    ok: true,
    backend: saved.backend,
    lead: updatedLead,
  };
}

export interface CreateOrganizerOutreachLeadInput {
  leadName: string;
  contactName?: string | null;
  organizerRole?: string | null;
  phone?: string | null;
  phoneInvitesText?: boolean;
  email?: string | null;
  contactPageUrl?: string | null;
  officialUrl?: string | null;
  contactTimezone?: string;
  bestCallingWindow?: string;
  cohortDescription?: string;
  cruiseLine?: string;
  hostedCruiseAndSailing: string;
  shipName?: string;
  sailDate?: string | null;
  portWindowsSummary?: string;
  qualificationStatus?: OrganizerQualificationStatus;
  qualificationDetail?: string;
  utmSource?: string;
  sailingPageUrl?: string | null;
  valueToPitchSummary?: string;
  recommendedNextAction?: string;
  outreachStatus?: OrganizerOutreachStatus;
  followUpDate?: string | null;
  notes?: string;
  updatedBy?: string;
  scope?: "production" | "nonprod";
}

export async function createOrganizerOutreachLead(
  input: CreateOrganizerOutreachLeadInput,
): Promise<{
  ok: boolean;
  backend: "postgres" | "local_dev_file" | "none";
  lead?: OrganizerOutreachLead;
  error?: string;
}> {
  const scope = input.scope || resolveEarthosEnvironmentScope();
  const leadName = (input.leadName || "").trim().slice(0, 140);
  if (!leadName) {
    return { ok: false, backend: "none", error: "leadName is required." };
  }
  const hostedCruiseAndSailing = (input.hostedCruiseAndSailing || "")
    .trim()
    .slice(0, 240);
  if (!hostedCruiseAndSailing) {
    return {
      ok: false,
      backend: "none",
      error: "hostedCruiseAndSailing is required.",
    };
  }

  const baseSlug = sanitizeLeadId(input.utmSource || leadName) || "custom_lead";
  const { overlaysByLeadId } = await loadStoredOverlays({ scope });
  const seededIds = new Set(
    SEEDED_ORGANIZER_LEAD_DEFINITIONS.map((s) => s.leadId),
  );

  let leadId = baseSlug;
  let suffix = 2;
  while (
    seededIds.has(leadId) ||
    (overlaysByLeadId.has(leadId) && !overlaysByLeadId.get(leadId)?.deleted)
  ) {
    leadId = `${baseSlug}_${suffix}`;
    suffix += 1;
  }

  const qualificationStatus: OrganizerQualificationStatus =
    input.qualificationStatus &&
    isValidQualificationStatus(input.qualificationStatus)
      ? input.qualificationStatus
      : "needs_sailing_qualification";

  const validatedSailingUrl = sanitizeQualifiedSailingUrl(
    input.sailingPageUrl,
    qualificationStatus,
  );
  if (
    qualificationStatus === "qualified_page_live" &&
    input.sailingPageUrl &&
    !validatedSailingUrl
  ) {
    return {
      ok: false,
      backend: "none",
      error:
        "sailingPageUrl must be a valid https://cruisepromenade.com/sailings/... URL.",
    };
  }

  const phone = input.phone?.trim() || null;
  const defaultStatus: OrganizerOutreachStatus =
    input.outreachStatus && isValidOutreachStatus(input.outreachStatus)
      ? input.outreachStatus
      : phone
        ? qualificationStatus === "qualified_page_live"
          ? "ready_to_call"
          : "needs_qualification_call"
        : qualificationStatus === "qualified_page_live"
          ? "draft_ready"
          : "held_pending_schedule_check";

  const nowIso = new Date().toISOString();
  const utmSource = sanitizeUtmSource(input.utmSource || leadId) || leadId;

  const overlay: StoredOrganizerLeadOverlay = {
    leadId,
    isCustomLead: true,
    priorityRank: phone ? 11 : 45,
    leadName,
    contactName: input.contactName?.trim() || null,
    organizerRole: input.organizerRole?.trim() || null,
    phone,
    phoneInvitesText: Boolean(input.phoneInvitesText),
    email: input.email?.trim() || null,
    altEmails: [],
    contactPageUrl:
      input.contactPageUrl?.trim() || input.officialUrl?.trim() || null,
    officialUrl: input.officialUrl?.trim() || null,
    eventPageUrl: input.officialUrl?.trim() || null,
    contactTimezone: input.contactTimezone?.trim() || "America/New_York (ET)",
    bestCallingWindow:
      input.bestCallingWindow?.trim() || "9:30 AM – 4:30 PM local business hours",
    cohortDescription:
      input.cohortDescription?.trim() || "Hosted group cruise prospect",
    cruiseLine: input.cruiseLine?.trim() || "Cruise Line TBD",
    hostedCruiseAndSailing,
    shipName: input.shipName?.trim() || hostedCruiseAndSailing,
    shipSlug: null,
    sailDate:
      input.sailDate && /^\d{4}-\d{2}-\d{2}$/.test(input.sailDate.trim())
        ? input.sailDate.trim()
        : null,
    returnDate: null,
    portWindowsSummary:
      input.portWindowsSummary?.trim() ||
      "Verify cruise-line schedule & 2-hour before all-aboard return buffer.",
    qualificationStatus,
    qualificationDetail:
      input.qualificationDetail?.trim() ||
      QUALIFICATION_STATUS_LABELS[qualificationStatus],
    utmSource,
    sailingPageUrl: validatedSailingUrl,
    valueToPitchSummary:
      input.valueToPitchSummary?.trim() || HOSTED_ORGANIZER_CORE_PITCH,
    recommendedNextAction: input.recommendedNextAction?.trim() || undefined,
    outreachStatus: defaultStatus,
    outreachCount: CONTACTED_OUTREACH_STATUSES.has(defaultStatus) ? 1 : 0,
    lastContactedAt: CONTACTED_OUTREACH_STATUSES.has(defaultStatus)
      ? nowIso
      : null,
    lastContactChannel: null,
    followUpDate:
      input.followUpDate && /^\d{4}-\d{2}-\d{2}$/.test(input.followUpDate.trim())
        ? input.followUpDate.trim()
        : null,
    notes: (input.notes || "").slice(0, 4000),
    boardCreated: false,
    boardShareCode: null,
    boardUrl: null,
    travelersJoined: 0,
    updatedAt: nowIso,
    updatedBy: (input.updatedBy || "admin").trim().slice(0, 80) || "admin",
  };

  const saved = await persistLeadOverlay(overlay, scope);
  if (!saved.ok) {
    return { ok: false, backend: saved.backend, error: saved.error };
  }

  const dashboard = await getOrganizerOutreachDashboard({ scope });
  const created = dashboard.leads.find((l) => l.leadId === leadId);
  return { ok: true, backend: saved.backend, lead: created };
}

export async function deleteOrResetOrganizerOutreachLead(input: {
  leadId: string;
  updatedBy?: string;
  scope?: "production" | "nonprod";
}): Promise<{
  ok: boolean;
  backend: "postgres" | "local_dev_file" | "none";
  actionTaken: "deleted_custom" | "reset_seeded";
  error?: string;
}> {
  const scope = input.scope || resolveEarthosEnvironmentScope();
  const leadId = sanitizeLeadId(input.leadId || "");
  if (!leadId) {
    return {
      ok: false,
      backend: "none",
      actionTaken: "deleted_custom",
      error: "Valid leadId is required.",
    };
  }

  const isSeeded = SEEDED_ORGANIZER_LEAD_DEFINITIONS.some(
    (s) => s.leadId === leadId,
  );
  const findingId = buildOrganizerOutreachFindingId(leadId, scope);

  const dbUrls =
    process.env.DCC_ISOLATED_TEST_DB === "1" ? [] : resolveOutreachDatabaseUrls();

  if (dbUrls.length > 0) {
    try {
      const sql = neon(dbUrls[0]);
      await sql`
        DELETE FROM earthos_control_map_findings
        WHERE finding_id = ${findingId}
          AND owner = ${ORGANIZER_OUTREACH_OWNER}
      `;
      inMemoryTestOutreachOverlays.delete(`${scope}:${leadId}`);
      return {
        ok: true,
        backend: "postgres",
        actionTaken: isSeeded ? "reset_seeded" : "deleted_custom",
      };
    } catch (err) {
      if (isServerlessRuntimeEnvironment()) {
        return {
          ok: false,
          backend: "none",
          actionTaken: isSeeded ? "reset_seeded" : "deleted_custom",
          error:
            err instanceof Error
              ? err.message
              : "Failed to delete organizer outreach overlay in Postgres.",
        };
      }
    }
  }

  if (isServerlessRuntimeEnvironment()) {
    return {
      ok: false,
      backend: "none",
      actionTaken: isSeeded ? "reset_seeded" : "deleted_custom",
      error: "Durable Postgres connection unavailable.",
    };
  }

  inMemoryTestOutreachOverlays.delete(`${scope}:${leadId}`);
  if (process.env.DCC_ISOLATED_TEST_DB !== "1") {
    try {
      if (fs.existsSync(LOCAL_DEV_OUTREACH_PATH)) {
        const existing = JSON.parse(
          fs.readFileSync(LOCAL_DEV_OUTREACH_PATH, "utf8"),
        ) as Record<string, StoredOrganizerLeadOverlay>;
        delete existing[`${scope}:${leadId}`];
        fs.writeFileSync(
          LOCAL_DEV_OUTREACH_PATH,
          JSON.stringify(existing, null, 2),
          "utf8",
        );
      }
    } catch {
      // ignore
    }
  }

  return {
    ok: true,
    backend: "local_dev_file",
    actionTaken: isSeeded ? "reset_seeded" : "deleted_custom",
  };
}
