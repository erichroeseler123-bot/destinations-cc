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
  "We built a free shared planner for your exact cruise. Your members can see who is joining each excursion or meetup, connect before and during the sailing, and keep the final schedule offline. It costs you and your members nothing, and it doesn’t interfere with your cruise bookings, events, or travel advisor.";

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
  "called_left_vm",
  "called_spoke",
  "texted",
  "emailed",
  "replied",
  "interested",
  "board_live",
  "not_a_fit",
  "on_hold",
] as const;

export type OrganizerOutreachStatus = (typeof VALID_OUTREACH_STATUSES)[number];

export const CONTACTED_OUTREACH_STATUSES: ReadonlySet<OrganizerOutreachStatus> =
  new Set<OrganizerOutreachStatus>([
    "called_left_vm",
    "called_spoke",
    "texted",
    "emailed",
    "replied",
    "interested",
    "board_live",
  ]);

export const REPLIED_OUTREACH_STATUSES: ReadonlySet<OrganizerOutreachStatus> =
  new Set<OrganizerOutreachStatus>(["replied", "interested", "board_live"]);

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
  phone: string | null;
  phoneDial: string | null;
  phoneInvitesText: boolean;
  email: string | null;
  altEmails: string[];
  officialUrl: string | null;
  eventPageUrl: string | null;
  cohortDescription: string;
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
  phoneOrTextScript: string;
  emailSubject: string;
  emailBody: string;
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
  kpis: OrganizerOutreachKpis;
  leads: OrganizerOutreachLead[];
}

export interface StoredOrganizerLeadOverlay {
  leadId: string;
  isCustomLead?: boolean;
  priorityRank?: number;
  leadName?: string;
  contactName?: string | null;
  phone?: string | null;
  phoneInvitesText?: boolean;
  email?: string | null;
  altEmails?: string[];
  officialUrl?: string | null;
  eventPageUrl?: string | null;
  cohortDescription?: string;
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
  phoneOrTextScript?: string;
  emailSubject?: string;
  emailBody?: string;
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
  called_left_vm: "Called — Left Voicemail",
  called_spoke: "Called — Spoke Live",
  texted: "Text Sent",
  emailed: "Email / Portal Sent",
  replied: "Replied",
  interested: "Interested — Follow-Up Active",
  board_live: "Board Created & Shared",
  not_a_fit: "Passed / Not a Fit",
  on_hold: "Paused / On Hold",
};

const SEEDED_TIMESTAMP_ISO = "2026-11-14T13:08:00.000Z";

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

function buildGroupsSetupUrl(utmSource: string): string {
  const src = sanitizeUtmSource(utmSource) || "organizer_outreach";
  return `https://cruisepromenade.com/groups?utm_source=${encodeURIComponent(src)}&utm_medium=hosted_organizer&utm_campaign=launch_2026_11`;
}

function sanitizeQualifiedSailingUrl(
  rawUrl: string | null | undefined,
  qualificationStatus: OrganizerQualificationStatus,
): string | null {
  // Strict truth guardrail: held or unqualified sailings NEVER expose a live sailing page URL to pitch.
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
  phone: string | null;
  phoneInvitesText: boolean;
  email: string | null;
  altEmails: string[];
  officialUrl: string | null;
  eventPageUrl: string | null;
  cohortDescription: string;
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
  phoneOrTextScript: string;
  emailSubject: string;
  emailBody: string;
  outreachStatus: OrganizerOutreachStatus;
  notes: string;
}

export const SEEDED_ORGANIZER_LEAD_DEFINITIONS: readonly SeedLeadDefinition[] = [
  {
    leadId: "bond_and_beyond",
    priorityRank: 1,
    leadName: "Bond & Beyond Networking Cruise",
    contactName: "Bond & Beyond Organizing Team",
    phone: "(904) 295-1212",
    phoneInvitesText: true,
    email: "bondandbeyondnetwork@gmail.com",
    altEmails: [],
    officialUrl: "https://bondandbeyondnetwork.com/connect/",
    eventPageUrl: "https://bondandbeyondnetwork.com/events/",
    cohortDescription:
      "Northeast Florida entrepreneurs & business owners (inaugural networking cruise; final payment due Dec 17, 2026)",
    hostedCruiseAndSailing:
      "Norwegian Escape · Apr 16–19, 2027 (3N RT Port Canaveral)",
    shipName: "Norwegian Escape",
    shipSlug: "norwegian-escape",
    sailDate: "2027-04-16",
    returnDate: "2027-04-19",
    portWindowsSummary:
      "Dep Port Canaveral CT10 16:00 · Sat Apr 17 Nassau 10:00–18:00 · Sun Apr 18 Great Stirrup Cay 07:00–17:00",
    qualificationStatus: "qualified_page_live",
    qualificationDetail:
      "Qualified against official NCL 3-Day Bahamas schedule & Port Canaveral CT10. Sailing page is live and indexable.",
    utmSource: "bond_and_beyond",
    sailingPageUrl:
      "https://cruisepromenade.com/sailings/norwegian-escape/2027-04-16?utm_source=bond_and_beyond&utm_medium=hosted_organizer&utm_campaign=launch_2026_11",
    valueToPitchSummary:
      "Best immediate call or text: sailing page is qualified and live, and their official contact page invites texts at (904) 295-1212. Pitch the free shared board for Nassau & Great Stirrup Cay ahead of Dec 17 final payment.",
    phoneOrTextScript: `Hi Bond & Beyond team — congrats on the April 16–19 Norwegian Escape networking cruise out of Port Canaveral! ${HOSTED_ORGANIZER_CORE_PITCH} Here is the page for your exact April 16 Norwegian Escape sailing if you'd like to take a look: https://cruisepromenade.com/sailings/norwegian-escape/2027-04-16?utm_source=bond_and_beyond&utm_medium=hosted_organizer&utm_campaign=launch_2026_11 — Erich (Cruise Promenade)`,
    emailSubject:
      "Free attendee itinerary link for the Apr 16 Bond & Beyond Cruise (Norwegian Escape)",
    emailBody: `Hi Bond & Beyond Team,

Congrats on launching the Inaugural Bond & Beyond Networking Cruise aboard Norwegian Escape out of Port Canaveral on April 16–19, 2027.

${HOSTED_ORGANIZER_CORE_PITCH}

- Exact sailing page: https://cruisepromenade.com/sailings/norwegian-escape/2027-04-16?utm_source=bond_and_beyond&utm_medium=hosted_organizer&utm_campaign=launch_2026_11
- Group organizer setup: https://cruisepromenade.com/groups?utm_source=bond_and_beyond&utm_medium=hosted_organizer&utm_campaign=launch_2026_11

It maps the published Port Canaveral departure (16:00), Saturday in Nassau (10:00–18:00), and Sunday at Great Stirrup Cay (07:00–17:00), with standard reminders to re-confirm final hours onboard, and requires no app download, no login wall, and no cabin numbers.

Let me know if you have any questions as you head toward final payment and spring planning.

Best,
Erich
Cruise Promenade`,
    outreachStatus: "ready_to_call",
    notes:
      "Best immediate call/text lead. Official site (bondandbeyondnetwork.com/connect/) invites texts at (904) 295-1212. Gmail draft r8554787524880842562 saved; 0 outreach messages sent.",
  },
  {
    leadId: "wsba_cruise",
    priorityRank: 2,
    leadName: "WSBA Reflect & Renew Cruise — Toi Johnson",
    contactName: "Toi Johnson (Cruise Coordinator)",
    phone: "(412) 606-0227",
    phoneInvitesText: false,
    email: "venturesbytoi@gmail.com",
    altEmails: ["info@yourwsba.org", "events@yourwsba.org"],
    officialUrl: "https://yourwsba.org/cruise2027",
    eventPageUrl: "https://yourwsba.org/cruise2027",
    cohortDescription:
      "Women's Small Business Association retreat (4N Miami private/themed charter slot)",
    hostedCruiseAndSailing:
      "Brilliant Lady · Feb 4–8, 2027 (4N RT Miami — confirm Bimini/sea-day order first)",
    shipName: "Brilliant Lady",
    shipSlug: "brilliant-lady",
    sailDate: "2027-02-04",
    returnDate: "2027-02-08",
    portWindowsSummary:
      "yourwsba.org lists Day 3 Sat Feb 6 Bimini / Day 4 Sun Feb 7 Sea vs. Virgin standard loop Day 3 Sea / Day 4 Bimini",
    qualificationStatus: "held_schedule_conflict",
    qualificationDetail:
      "HELD (noindex — CHARTER_GAP_AND_DAY_ORDER_CONFLICT). Call Toi Johnson first to confirm whether Feb 4 charter calls at Bimini on Saturday Feb 6 or Sunday Feb 7 before publishing and pitching a live sailing page.",
    utmSource: "wsba_cruise",
    sailingPageUrl: null,
    valueToPitchSummary:
      "Call Toi Johnson at (412) 606-0227 to confirm the Bimini vs. sea-day order first, then publish /sailings/brilliant-lady/2027-02-04 and pitch the free non-interfering WSBA planner.",
    phoneOrTextScript: `Hi Toi — quick schedule question on the Feb 4–8 WSBA Reflect & Renew Cruise on Brilliant Lady: does your charter call at Beach Club at Bimini on Saturday Feb 6 with Sunday at sea, or Sunday Feb 7? Reason I ask: ${HOSTED_ORGANIZER_CORE_PITCH} Once I confirm your exact Key West & Bimini day order, we can publish the verified page for your group and send you the free link.`,
    emailSubject:
      "Quick Bimini day check + free attendee planner for WSBA Reflect & Renew (Feb 4 Brilliant Lady)",
    emailBody: `Hi Toi,

I saw the WSBA Reflect & Renew Cruise is sailing aboard Virgin Voyages' Brilliant Lady out of Miami on February 4–8, 2027.

Quick schedule question before we publish a planning page for your sailing: does the February 4 charter call at The Beach Club at Bimini on Saturday, February 6 (with Sunday at sea, as listed on yourwsba.org/cruise2027) or Sunday, February 7?

${HOSTED_ORGANIZER_CORE_PITCH}

Once we confirm that day order so it matches your charter itinerary 100%, I'd be glad to share the verified link in case it's useful for WSBA members.

Best,
Erich
Cruise Promenade`,
    outreachStatus: "needs_qualification_call",
    notes:
      "Hold /sailings/brilliant-lady/2027-02-04 (noindex) until Toi Johnson confirms Sat Feb 6 vs. Sun Feb 7 Bimini order. 0 outreach messages sent.",
  },
  {
    leadId: "dancecation_at_sea",
    priorityRank: 3,
    leadName: "Dancecation at Sea / BK Travel",
    contactName: "BK Travel (Group Cruise Desk)",
    phone: "757-870-3709",
    phoneInvitesText: false,
    email: null,
    altEmails: [],
    officialUrl: "https://dancecation.net/book-now/",
    eventPageUrl: "https://dancecation.net/book-now/",
    cohortDescription:
      "~100-person hosted dance cruise group organized with BK Travel",
    hostedCruiseAndSailing:
      "Hosted ~100-person group · Qualify exact ship & sail date with BK Travel first",
    shipName: "Ship TBD (Qualify on Call)",
    shipSlug: null,
    sailDate: null,
    returnDate: null,
    portWindowsSummary:
      "Confirm exact vessel, embarkation date, and open port windows before presenting a dedicated sailing page",
    qualificationStatus: "needs_sailing_qualification",
    qualificationDetail:
      "Needs Ship & Sailing Qualification — 100-person hosted group prospect, but exact ship and sail date must be verified with BK Travel before presenting a dedicated sailing page.",
    utmSource: "dancecation_at_sea",
    sailingPageUrl: null,
    valueToPitchSummary:
      "High-value ~100-person hosted group. Call BK Travel at 757-870-3709 to qualify exact ship & sailing date first, then match/publish the verified page and offer the free shared group board (zero interference with BK Travel's bookings or commission).",
    phoneOrTextScript: `Hi BK Travel team — calling about your upcoming ~100-person Dancecation at Sea group! Which ship and sail date is the group sailing on? ${HOSTED_ORGANIZER_CORE_PITCH} Once I confirm your exact ship and sail date, I can send over the verified itinerary page for your dancers to coordinate port outings and meetups alongside your official events.`,
    emailSubject:
      "Free group port & meetup planner for Dancecation at Sea (zero interference with BK Travel)",
    emailBody: `Hi Dancecation at Sea & BK Travel Team,

Congrats on bringing ~100 guests together for Dancecation at Sea.

${HOSTED_ORGANIZER_CORE_PITCH}

Which ship and sail date is your upcoming group sailing on? Once we confirm the exact voyage, we can verify the port schedule and send over a dedicated board link for your group.

Best,
Erich
Cruise Promenade`,
    outreachStatus: "needs_qualification_call",
    notes:
      "New 100-person hosted group prospect via BK Travel (dancecation.net/book-now/). Qualify exact ship & sailing before presenting any dedicated page. 0 outreach messages sent.",
  },
  {
    leadId: "cmmc_at_sea",
    priorityRank: 4,
    leadName: "CMMC at Sea",
    contactName: "CMMC at Sea Team (Edwards Performance Solutions)",
    phone: null,
    phoneInvitesText: false,
    email: "Info@CMMCatSea.com",
    altEmails: ["events@drpintl.com"],
    officialUrl: "https://cmmcatsea.com/registration/",
    eventPageUrl: "https://cmmcatsea.com/registration/",
    cohortDescription:
      "Cybersecurity / Defense Industrial Base conference ($295 pass; room block closed Oct 28, 2026 so attendees book cabins independently)",
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
      "Qualified against official Celebrity Beyond BY07W678 schedule & Port Everglades Terminal 25. No verified direct organizer phone in pipeline; verified email ready.",
    utmSource: "cmmc_at_sea",
    sailingPageUrl:
      "https://cruisepromenade.com/sailings/celebrity-beyond/2027-01-17?utm_source=cmmc_at_sea&utm_medium=hosted_organizer&utm_campaign=launch_2026_11",
    valueToPitchSummary:
      "Strongest email-first structural fit: room block closed Oct 28, attendees book cabins independently, all 3 sea days have CMMC sessions, and all 3 Caribbean port days (including Grand Cayman tender) are open.",
    phoneOrTextScript: `${HOSTED_ORGANIZER_CORE_PITCH} Exact Jan 17 Celebrity Beyond page: https://cruisepromenade.com/sailings/celebrity-beyond/2027-01-17?utm_source=cmmc_at_sea&utm_medium=hosted_organizer&utm_campaign=launch_2026_11`,
    emailSubject:
      "Free port-day coordination board for CMMC at Sea (Jan 17 Celebrity Beyond)",
    emailBody: `Hi CMMC at Sea Team,

I saw that CMMC at Sea is sailing aboard Celebrity Beyond out of Fort Lauderdale on January 17–24, 2027, with conference sessions and CCP training on the three sea days and open schedules in Nassau, Cozumel, and Grand Cayman.

${HOSTED_ORGANIZER_CORE_PITCH}

- Exact sailing page: https://cruisepromenade.com/sailings/celebrity-beyond/2027-01-17?utm_source=cmmc_at_sea&utm_medium=hosted_organizer&utm_campaign=launch_2026_11
- Group organizer setup: https://cruisepromenade.com/groups?utm_source=cmmc_at_sea&utm_medium=hosted_organizer&utm_campaign=launch_2026_11

It maps the published port windows and return-buffer timing—including the offshore tender transfer in George Town, Grand Cayman (08:00–18:00) alongside Nassau (07:30–17:00) and Cozumel (07:00–20:00)—with no app download, no login wall, and no cabin numbers collected.

Happy to walk through how it works or help set up a clean CMMC at Sea board if useful for January.

Best,
Erich
Cruise Promenade`,
    outreachStatus: "draft_ready",
    notes:
      "No verified direct organizer phone number in pipeline. Verified email Info@CMMCatSea.com (agency events@drpintl.com); Gmail draft r-7382081488335016484 saved; 0 messages sent.",
  },
  {
    leadId: "fintalks",
    priorityRank: 5,
    leadName: "FinTalks Royal Icon Cruise",
    contactName: "Amberly Grant / FinTalks Travel Desk",
    phone: null,
    phoneInvitesText: false,
    email: "travel@amberlygrant.com",
    altEmails: [],
    officialUrl: "https://www.amberlygrant.com/caribbean-cruise-icon",
    eventPageUrl: "https://www.amberlygrant.com/caribbean-cruise-icon",
    cohortDescription:
      "Creator & personal finance community group sailing out of Miami",
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
      "Qualified against official Royal Caribbean Icon of the Seas 7N Eastern Caribbean schedule & PortMiami. Verified travel-desk email ready.",
    utmSource: "fintalks",
    sailingPageUrl:
      "https://cruisepromenade.com/sailings/icon-of-the-seas/2027-01-16?utm_source=fintalks&utm_medium=hosted_organizer&utm_campaign=launch_2026_11",
    valueToPitchSummary:
      "Early 07:00–14:30 St. Thomas port window makes group timing & excursion coordination immediately practical without touching cabin bookings or advisor arrangements.",
    phoneOrTextScript: `${HOSTED_ORGANIZER_CORE_PITCH} Exact Jan 16 Icon of the Seas page: https://cruisepromenade.com/sailings/icon-of-the-seas/2027-01-16?utm_source=fintalks&utm_medium=hosted_organizer&utm_campaign=launch_2026_11`,
    emailSubject:
      "Free port-day board for the Jan 16, 2027 Icon of the Seas group (no login / no app)",
    emailBody: `Hi FinTalks Travel Team,

I saw your group is sailing on Icon of the Seas out of Miami on January 16–23, 2027.

${HOSTED_ORGANIZER_CORE_PITCH}

- Exact sailing page: https://cruisepromenade.com/sailings/icon-of-the-seas/2027-01-16?utm_source=fintalks&utm_medium=hosted_organizer&utm_campaign=launch_2026_11
- Group organizer setup: https://cruisepromenade.com/groups?utm_source=fintalks&utm_medium=hosted_organizer&utm_campaign=launch_2026_11

It maps the published port windows for that week—including the early 07:00–14:30 St. Thomas call at Crown Bay, plus St. Maarten (08:00–18:00) and CocoCay (08:30–17:00)—with no app download, no login wall, and no cabin numbers collected.

Happy to answer any questions if you'd like to use it for January.

Best,
Erich
Cruise Promenade`,
    outreachStatus: "draft_ready",
    notes:
      "No verified direct organizer phone number in pipeline. Direct travel-desk inbox travel@amberlygrant.com verified; 0 messages sent.",
  },
  {
    leadId: "acquire_it_summit",
    priorityRank: 6,
    leadName: "Acquire It Summit / Acquisition Lab",
    contactName: "Acquisition Lab Events Team",
    phone: null,
    phoneInvitesText: false,
    email: "support@acquisitionlab.com",
    altEmails: [],
    officialUrl: "https://acquireit.com",
    eventPageUrl: "https://acquireit.com",
    cohortDescription:
      "Main Street M&A / Entrepreneurship-Through-Acquisition searchers, operators & spouses",
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
      "100% minute-for-minute match between Virgin Voyages 4N Key West & Bimini schedule, PortMiami Terminal V, and acquireit.com summit agenda.",
    utmSource: "acquire_it_summit",
    sailingPageUrl:
      "https://cruisepromenade.com/sailings/brilliant-lady/2027-01-21?utm_source=acquire_it_summit&utm_medium=hosted_organizer&utm_campaign=launch_2026_11",
    valueToPitchSummary:
      "Published summit schedule explicitly encourages searchers, operators, and spouses to explore Key West and Bimini together during open afternoon windows.",
    phoneOrTextScript: `${HOSTED_ORGANIZER_CORE_PITCH} Exact Jan 21 Brilliant Lady page: https://cruisepromenade.com/sailings/brilliant-lady/2027-01-21?utm_source=acquire_it_summit&utm_medium=hosted_organizer&utm_campaign=launch_2026_11`,
    emailSubject:
      "Optional Key West & Bimini port board for Acquire It Summit (Jan 21 Brilliant Lady)",
    emailBody: `Hi Acquisition Lab Events Team,

I saw that Acquire It Summit 2027 is gathering aboard Virgin Voyages' Brilliant Lady out of Miami on January 21–25, 2027.

${HOSTED_ORGANIZER_CORE_PITCH}

- Exact sailing page: https://cruisepromenade.com/sailings/brilliant-lady/2027-01-21?utm_source=acquire_it_summit&utm_medium=hosted_organizer&utm_campaign=launch_2026_11
- Group organizer setup: https://cruisepromenade.com/groups?utm_source=acquire_it_summit&utm_medium=hosted_organizer&utm_campaign=launch_2026_11

It reflects the published Terminal V Miami departure (17:00), Friday's Key West Pier B call (08:00–17:00), Saturday at sea, and Sunday at The Beach Club at Bimini (09:00–18:00) for casual afternoon port coordination with zero login wall or app download.

Feel free to test the page directly—happy to answer any questions if it helps your cohort coordinate ashore.

Best,
Erich
Cruise Promenade`,
    outreachStatus: "draft_ready",
    notes:
      "No verified direct phone number in pipeline. Verified email support@acquisitionlab.com; Gmail draft r3144573035214404133 saved; 0 messages sent.",
  },
  {
    leadId: "marketers_cruise",
    priorityRank: 7,
    leadName: "20th Annual Marketers Cruise",
    contactName: "Captain Lou Edwards & Mike Filsaime (Special Events at Sea)",
    phone: null,
    phoneInvitesText: false,
    email: null,
    altEmails: [],
    officialUrl: "https://marketerscruise.com",
    eventPageUrl: "https://facebook.com/groups/marketerscruisefriends",
    cohortDescription:
      "20th annual digital marketing mastermind cruise (resolved onto Carnival Venezia, not Carnival Vista)",
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
      "Discrepancy resolved: third-party listings said Carnival Vista (6N), but marketerscruise.com FAQ confirms Carnival Venezia 7N Jan 31 – Feb 7. Qualified & live.",
    utmSource: "marketers_cruise",
    sailingPageUrl:
      "https://cruisepromenade.com/sailings/carnival-venezia/2027-01-31?utm_source=marketers_cruise&utm_medium=hosted_organizer&utm_campaign=launch_2026_11",
    valueToPitchSummary:
      "Reach via marketerscruise.com portal or Marketers Cruise Friends FB group. Emphasize zero interference with Special Events at Sea VIP packages & private excursions (ideal for guests choosing 'Option 1: go on your own').",
    phoneOrTextScript: `${HOSTED_ORGANIZER_CORE_PITCH} Exact Jan 31 Carnival Venezia page: https://cruisepromenade.com/sailings/carnival-venezia/2027-01-31?utm_source=marketers_cruise&utm_medium=hosted_organizer&utm_campaign=launch_2026_11`,
    emailSubject:
      "Free attendee port-day board for the Jan 31, 2027 Marketers Cruise (Carnival Venezia)",
    emailBody: `Hi Captain Lou & Marketers Cruise Team,

Congrats on the milestone 20th Annual Marketers Cruise sailing out of Port Canaveral on January 31 – February 7, 2027 aboard Carnival Venezia.

${HOSTED_ORGANIZER_CORE_PITCH}

- Exact sailing page: https://cruisepromenade.com/sailings/carnival-venezia/2027-01-31?utm_source=marketers_cruise&utm_medium=hosted_organizer&utm_campaign=launch_2026_11
- Group organizer setup: https://cruisepromenade.com/groups?utm_source=marketers_cruise&utm_medium=hosted_organizer&utm_campaign=launch_2026_11

It does not replace or interfere with Special Events at Sea's cabin bookings, VIP packages, or private Marketers Cruise excursions—for guests choosing Option 1 ("go on your own") or casual small-group meetups at Celebration Key, Cozumel, and Roatan, one link lets attendees mark Interested, Going, or Booked with no login wall.

Best,
Erich
Cruise Promenade`,
    outreachStatus: "draft_ready",
    notes:
      "No public @marketerscruise.com email or direct phone published; uses portal on marketerscruise.com and facebook.com/groups/marketerscruisefriends. 0 messages sent.",
  },
  {
    leadId: "momentum_at_sea",
    priorityRank: 8,
    leadName: "Momentum at Sea — Lou Mongello",
    contactName: "Lou Mongello (WDW Radio / Momentum Mastermind)",
    phone: null,
    phoneInvitesText: false,
    email: "lou@loumongello.com",
    altEmails: ["Lou@wdwradio.com"],
    officialUrl: "https://www.loumongello.com/contact/",
    eventPageUrl: "https://www.loumongello.com/contact/",
    cohortDescription:
      "Creator & entrepreneur mastermind cruise out of Port Canaveral",
    hostedCruiseAndSailing:
      "Utopia of the Seas · Mar 15–19, 2027 (4N RT Port Canaveral — confirm CocoCay vs. Deep Work Sea Day first)",
    shipName: "Utopia of the Seas",
    shipSlug: "utopia-of-the-seas",
    sailDate: "2027-03-15",
    returnDate: "2027-03-19",
    portWindowsSummary:
      "loumongello.com schedules Wed Mar 17 'Deep Work Day' at sea & Thu Mar 18 CocoCay vs. RCI standard Wed CocoCay / Thu Sea",
    qualificationStatus: "held_schedule_conflict",
    qualificationDetail:
      "HELD (noindex — DAY_ORDER_CONFLICT_COCO_CAY_VS_SEA_DAY). Confirm whether 2027-03-15 Utopia of the Seas swaps CocoCay to Thursday Mar 18 before publishing or sending a sailing page link.",
    utmSource: "momentum_at_sea",
    sailingPageUrl: null,
    valueToPitchSummary:
      "Send a brief 2-sentence schedule check to lou@loumongello.com first confirming Wed Mar 17 Sea Day vs. Thu Mar 18 CocoCay so our page aligns 100% with his 'Deep Work Day' workshops before pitching the live link.",
    phoneOrTextScript: `Hi Lou — quick schedule question on Momentum at Sea (March 15–19, 2027 on Utopia of the Seas): is Wednesday March 17 your Day at Sea with CocoCay on Thursday March 18 on Royal Caribbean's voyage sheet? ${HOSTED_ORGANIZER_CORE_PITCH}`,
    emailSubject:
      "Quick CocoCay day check + free attendee port planner for Momentum at Sea (Mar 15 Utopia of the Seas)",
    emailBody: `Hi Lou,

Congrats on Momentum at Sea aboard Utopia of the Seas out of Port Canaveral (March 15–19, 2027).

Quick schedule question before we publish a planning page for that sailing: on Royal Caribbean's voyage sheet for March 15, is Wednesday, March 17 at sea ("The Deep Work Day") with Perfect Day at CocoCay on Thursday, March 18?

${HOSTED_ORGANIZER_CORE_PITCH}

Once we confirm that CocoCay/sea-day order so it never collides with your Wednesday workshops, I'd be glad to send over the free link in case it's helpful for your mastermind group.

Best,
Erich
Cruise Promenade`,
    outreachStatus: "held_pending_schedule_check",
    notes:
      "Hold /sailings/utopia-of-the-seas/2027-03-15 (noindex) until Wed Mar 17 Sea Day vs. Thu Mar 18 CocoCay rotation is confirmed. 0 messages sent.",
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
    if (trimmed && !urls.includes(trimmed)) {
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

  // First pass: bind sessions that arrived with an explicit `utm_source`
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

  const defaultScript =
    qualificationStatus === "qualified_page_live" && sailingPageUrl
      ? `Hi ${leadName} team — ${HOSTED_ORGANIZER_CORE_PITCH} Exact sailing page: ${sailingPageUrl}`
      : `Hi ${leadName} team — quick question to confirm your exact cruise ship and port day schedule! ${HOSTED_ORGANIZER_CORE_PITCH}`;

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
    phone,
    phoneDial: normalizePhoneDial(phone),
    phoneInvitesText,
    email,
    altEmails: Array.isArray(overlay?.altEmails)
      ? overlay.altEmails
      : seed?.altEmails
        ? [...seed.altEmails]
        : [],
    officialUrl:
      overlay?.officialUrl !== undefined
        ? overlay.officialUrl && overlay.officialUrl.trim()
          ? overlay.officialUrl.trim()
          : null
        : seed?.officialUrl ?? null,
    eventPageUrl:
      overlay?.eventPageUrl !== undefined
        ? overlay.eventPageUrl && overlay.eventPageUrl.trim()
          ? overlay.eventPageUrl.trim()
          : null
        : seed?.eventPageUrl ?? null,
    cohortDescription:
      (overlay?.cohortDescription && overlay.cohortDescription.trim()) ||
      seed?.cohortDescription ||
      "Hosted group cruise cohort",
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
    phoneOrTextScript:
      (overlay?.phoneOrTextScript && overlay.phoneOrTextScript.trim()) ||
      seed?.phoneOrTextScript ||
      defaultScript,
    emailSubject:
      (overlay?.emailSubject && overlay.emailSubject.trim()) ||
      seed?.emailSubject ||
      `Free shared cruise planner for ${leadName}`,
    emailBody:
      (overlay?.emailBody && overlay.emailBody.trim()) ||
      seed?.emailBody ||
      `Hi ${leadName} Team,\n\n${HOSTED_ORGANIZER_CORE_PITCH}\n\nBest,\nErich\nCruise Promenade`,
    outreachStatus,
    outreachStatusLabel: OUTREACH_STATUS_LABELS[outreachStatus],
    hasSentOutreach,
    outreachCount,
    lastContactedAt: overlay?.lastContactedAt || null,
    lastContactChannel: overlay?.lastContactChannel || null,
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
    kpis,
    leads,
  };
}

export interface UpdateOrganizerOutreachLeadInput {
  leadId: string;
  outreachStatus?: OrganizerOutreachStatus;
  qualificationStatus?: OrganizerQualificationStatus;
  qualificationDetail?: string;
  hostedCruiseAndSailing?: string;
  shipName?: string;
  sailDate?: string | null;
  sailingPageUrl?: string | null;
  phone?: string | null;
  phoneInvitesText?: boolean;
  email?: string | null;
  officialUrl?: string | null;
  contactName?: string | null;
  valueToPitchSummary?: string;
  phoneOrTextScript?: string;
  emailSubject?: string;
  emailBody?: string;
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

  // Enforce hold rule: if someone tries to set a live sailingPageUrl while still held/unqualified, reject or strip it.
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
    // If explicitly reset back to a 0-sent pre-outreach state, reset touch counter cleanly
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

  if (input.logTouchChannel && !nextFollowUpDate && input.followUpDate === undefined) {
    // Default follow-up +3 days after an outbound call/text/email if none was set
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
        Boolean(existing?.boardCreated);

  const nextTravelersJoined =
    input.travelersJoined !== undefined
      ? Math.max(0, Math.floor(Number(input.travelersJoined) || 0))
      : existing?.travelersJoined ?? 0;

  const nextOverlay: StoredOrganizerLeadOverlay = {
    ...existing,
    leadId,
    isCustomLead: !seed,
    qualificationStatus: nextQualification,
    ...(input.qualificationDetail !== undefined
      ? { qualificationDetail: input.qualificationDetail.slice(0, 1000) }
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
    ...(input.officialUrl !== undefined
      ? { officialUrl: input.officialUrl }
      : {}),
    ...(input.contactName !== undefined
      ? { contactName: input.contactName }
      : {}),
    ...(input.valueToPitchSummary !== undefined
      ? { valueToPitchSummary: input.valueToPitchSummary.slice(0, 1000) }
      : {}),
    ...(input.phoneOrTextScript !== undefined
      ? { phoneOrTextScript: input.phoneOrTextScript.slice(0, 2500) }
      : {}),
    ...(input.emailSubject !== undefined
      ? { emailSubject: input.emailSubject.slice(0, 240) }
      : {}),
    ...(input.emailBody !== undefined
      ? { emailBody: input.emailBody.slice(0, 5000) }
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
  phone?: string | null;
  phoneInvitesText?: boolean;
  email?: string | null;
  officialUrl?: string | null;
  cohortDescription?: string;
  hostedCruiseAndSailing: string;
  shipName?: string;
  sailDate?: string | null;
  portWindowsSummary?: string;
  qualificationStatus?: OrganizerQualificationStatus;
  qualificationDetail?: string;
  utmSource?: string;
  sailingPageUrl?: string | null;
  valueToPitchSummary?: string;
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
    priorityRank: phone ? 3 : 20,
    leadName,
    contactName: input.contactName?.trim() || null,
    phone,
    phoneInvitesText: Boolean(input.phoneInvitesText),
    email: input.email?.trim() || null,
    altEmails: [],
    officialUrl: input.officialUrl?.trim() || null,
    eventPageUrl: input.officialUrl?.trim() || null,
    cohortDescription:
      input.cohortDescription?.trim() || "Hosted group cruise prospect",
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
