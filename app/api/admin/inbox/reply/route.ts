import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { authorizeControlCenterCaller } from "@/app/api/admin/control-center/route";
import {
  buildHydratedConciergePreset,
  extractPassengerFirstName,
  isConciergePresetId,
  resolveConciergePresetIdForSourceId,
  type ConciergePresetId,
} from "@/lib/dcc/conciergeReplyPresets";
import { saveOperatorInboxTriageOverlay } from "@/lib/dcc/operatorInbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_NOINDEX_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

const DEFAULT_JFD_FROM = "Juneau Flight Deck <press@juneauflightdeck.com>";
const DEFAULT_DCC_FROM =
  "Destination Command Center <concierge@destinationcommandcenter.com>";
const DEFAULT_REPLY_TO = "erichroeseler123@gmail.com";

// In-memory duplicate guard (supplements Postgres jfd_waitlist_notifications, and works in isolated DB test mode)
const inMemoryDeliveredConciergeQuotes = new Map<
  string,
  { deliveredAt: string; resendId: string | null; toEmail: string }
>();

export function resetConciergeReplyMemoryForTests(): void {
  inMemoryDeliveredConciergeQuotes.clear();
}

function resolveCandidateDatabaseUrls(): string[] {
  if (process.env.DCC_ISOLATED_TEST_DB === "1") {
    return [];
  }
  const explicitTarget = (
    process.env.DCC_TARGET_DB ||
    process.env.DCC_EARTHOS_ENV ||
    ""
  )
    .trim()
    .toLowerCase();
  const isNonProd =
    explicitTarget === "nonprod" ||
    explicitTarget === "preview" ||
    explicitTarget === "development" ||
    explicitTarget === "test" ||
    (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production");

  const raw = isNonProd
    ? [
        process.env.DCC_NONPROD_DATABASE_URL,
        process.env.DCC_DATABASE_URL,
        process.env.DATABASE_URL,
        process.env.POSTGRES_URL,
      ]
    : [
        process.env.DCC_DATABASE_URL,
        process.env.DATABASE_URL,
        process.env.POSTGRES_URL,
        process.env.DCC_NONPROD_DATABASE_URL,
      ];

  const seen = new Set<string>();
  const urls: string[] = [];
  for (const u of raw) {
    const trimmed = (u || "").trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      urls.push(trimmed);
    }
  }
  return urls;
}

export function resolveSafeConciergeFromAddress(
  fromBrand: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const normalizedBrand = (fromBrand || "").trim().toLowerCase();
  const envFrom = (env.DEPLOY_TEST_EMAIL_FROM || "").trim();

  if (
    normalizedBrand === "juneauflightdeck" ||
    normalizedBrand === "juneauflightdeck.com" ||
    normalizedBrand === "jfd"
  ) {
    // NEVER send Juneau Flight Deck emails from partyatredrocks.com
    if (envFrom && !/partyatredrocks\.com/i.test(envFrom) && /juneauflightdeck\.com/i.test(envFrom)) {
      return envFrom;
    }
    return DEFAULT_JFD_FROM;
  }

  if (normalizedBrand === "partyatredrocks" || normalizedBrand === "partyatredrocks.com") {
    return envFrom || "Party at Red Rocks <bookings@partyatredrocks.com>";
  }

  if (envFrom && !/partyatredrocks\.com/i.test(envFrom)) {
    return envFrom;
  }
  return DEFAULT_DCC_FROM;
}

interface JfdWaitlistHydrationRow {
  id: string;
  name: string | null;
  email: string | null;
  port_date: string | null;
  juneau_date: string | null;
  ship_name: string | null;
  party_size: number | null;
  is_test: boolean | null;
  raw_entry: Record<string, unknown> | string | null;
}

async function lookupJfdSubmissionAndDeliveryStatus(entryId: string): Promise<{
  submission: JfdWaitlistHydrationRow | null;
  alreadyDelivered: boolean;
  deliveredAt: string | null;
}> {
  const memExisting = inMemoryDeliveredConciergeQuotes.get(entryId);
  const dbUrls = resolveCandidateDatabaseUrls();

  for (const dbUrl of dbUrls) {
    try {
      const sql = neon(dbUrl);
      const subRows = (await sql`
        SELECT id, name, email, port_date, juneau_date, ship_name, party_size, is_test, raw_entry
        FROM jfd_waitlist_submissions
        WHERE id = ${entryId}
        LIMIT 1
      `) as JfdWaitlistHydrationRow[];

      const notifRows = (await sql`
        SELECT delivery_id, dispatched_at
        FROM jfd_waitlist_notifications
        WHERE entry_id = ${entryId}
          AND status = 'delivered'
          AND (
            departure_time = 'concierge_quote'
            OR delivery_id LIKE 'concierge-%'
            OR (payload IS NOT NULL AND payload::text ILIKE '%"concierge_quote"%')
          )
        ORDER BY dispatched_at DESC
        LIMIT 1
      `) as Array<{ delivery_id: string; dispatched_at: string | Date | null }>;

      const submission = subRows[0] || null;
      const dbDelivered = notifRows.length > 0;
      if (submission || dbDelivered) {
        return {
          submission,
          alreadyDelivered: dbDelivered || Boolean(memExisting),
          deliveredAt: dbDelivered
            ? String(notifRows[0].dispatched_at || new Date().toISOString())
            : memExisting?.deliveredAt || null,
        };
      }
    } catch {
      // Try next DB candidate or fall back cleanly
    }
  }

  return {
    submission: null,
    alreadyDelivered: Boolean(memExisting),
    deliveredAt: memExisting?.deliveredAt || null,
  };
}

async function recordJfdConciergeDeliveryInPostgres(params: {
  entryId: string;
  recipientEmail: string;
  portDate: string;
  tourName: string;
  resendId: string | null;
  fromUsed: string;
  actor: string;
  subject: string;
  isTest: boolean;
}): Promise<boolean> {
  const dbUrls = resolveCandidateDatabaseUrls();
  const nowIso = new Date().toISOString();
  const noteAppend = `[${nowIso}] Concierge quote sent via Resend (${params.resendId || "ok"}) by ${params.actor}`;
  const deliveryId = `concierge-${params.entryId}-${Date.now()}`;
  const payloadJson = JSON.stringify({
    kind: "concierge_quote",
    resendId: params.resendId,
    fromUsed: params.fromUsed,
    subject: params.subject,
    actor: params.actor,
    sentAt: nowIso,
  });

  for (const dbUrl of dbUrls) {
    try {
      const sql = neon(dbUrl);
      await sql`
        UPDATE jfd_waitlist_submissions
        SET
          status = 'contact_pending',
          notes = CASE
            WHEN notes IS NULL OR btrim(notes) = '' THEN ${noteAppend}
            ELSE notes || E'\n' || ${noteAppend}
          END
        WHERE id = ${params.entryId}
      `;

      await sql`
        INSERT INTO jfd_waitlist_notifications (
          delivery_id,
          entry_id,
          recipient_email,
          tour_name,
          operator,
          port,
          port_date,
          departure_time,
          status,
          payload,
          is_test,
          dispatched_at
        ) VALUES (
          ${deliveryId},
          ${params.entryId},
          ${params.recipientEmail},
          ${params.tourName},
          'Juneau Flight Deck Concierge',
          'juneau',
          ${params.portDate},
          'concierge_quote',
          'delivered',
          ${payloadJson}::jsonb,
          ${params.isTest},
          now()
        )
        ON CONFLICT (entry_id, port_date, departure_time) DO UPDATE SET
          delivery_id = EXCLUDED.delivery_id,
          recipient_email = EXCLUDED.recipient_email,
          status = EXCLUDED.status,
          payload = EXCLUDED.payload,
          dispatched_at = now()
      `;
      return true;
    } catch {
      // Try next candidate or continue fail-safe
    }
  }
  return false;
}

export async function GET(request: Request) {
  const auth = await authorizeControlCenterCaller(request);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        ok: false,
        error: "UNAUTHORIZED",
        message: "Valid admin session or internal secret required.",
      },
      { status: 401, headers: NO_STORE_NOINDEX_HEADERS },
    );
  }

  const url = new URL(request.url);
  const presetParam = url.searchParams.get("presetId");
  const guestName = url.searchParams.get("guestName");
  if (presetParam && isConciergePresetId(presetParam)) {
    const hydrated = buildHydratedConciergePreset(presetParam, {
      guestName,
    });
    return NextResponse.json(
      { ok: true, preset: hydrated },
      { status: 200, headers: NO_STORE_NOINDEX_HEADERS },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      presets: [
        buildHydratedConciergePreset("jfd_mvib0lba_2027_05_17"),
        buildHydratedConciergePreset("jfd_mv1sadck_2027_06_14"),
      ],
    },
    { status: 200, headers: NO_STORE_NOINDEX_HEADERS },
  );
}

export async function POST(request: Request) {
  const auth = await authorizeControlCenterCaller(request);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        ok: false,
        error: "UNAUTHORIZED",
        message: "Valid admin session or internal secret required.",
      },
      { status: 401, headers: NO_STORE_NOINDEX_HEADERS },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON" },
      { status: 400, headers: NO_STORE_NOINDEX_HEADERS },
    );
  }

  const dryRunSandbox = body.dryRunSandbox === true;
  const forceResend = body.forceResend === true;
  const requestedPresetId: ConciergePresetId | null = isConciergePresetId(
    body.presetId,
  )
    ? body.presetId
    : null;

  const rawItemKey = typeof body.itemKey === "string" ? body.itemKey.trim() : "";
  const inferredEntryIdFromKey = rawItemKey.startsWith("jfd:waitlist:")
    ? rawItemKey.slice("jfd:waitlist:".length).trim()
    : typeof body.entryId === "string"
      ? body.entryId.trim()
      : "";

  let entryId = inferredEntryIdFromKey;
  let toEmail = typeof body.toEmail === "string" ? body.toEmail.trim() : "";
  let guestFirstName =
    typeof body.guestFirstName === "string" && body.guestFirstName.trim()
      ? body.guestFirstName.trim()
      : "";
  let fromBrand =
    typeof body.fromBrand === "string" && body.fromBrand.trim()
      ? body.fromBrand.trim().toLowerCase()
      : rawItemKey.startsWith("jfd:")
        ? "juneauflightdeck"
        : "destinationcommandcenter";
  let subject = typeof body.subject === "string" ? body.subject.trim() : "";
  let textBody = typeof body.textBody === "string" ? body.textBody.trim() : "";
  let portDateForLog = "2027-06-01";
  let isTestEntry = false;

  if (requestedPresetId) {
    const baseMeta = buildHydratedConciergePreset(requestedPresetId);
    entryId = baseMeta.entryId;
    fromBrand = "juneauflightdeck";
    portDateForLog = baseMeta.portDate;
  } else if (!entryId && rawItemKey) {
    const matchedPreset = resolveConciergePresetIdForSourceId(rawItemKey);
    if (matchedPreset) {
      entryId = buildHydratedConciergePreset(matchedPreset).entryId;
    }
  }

  if (entryId) {
    const dbCheck = await lookupJfdSubmissionAndDeliveryStatus(entryId);
    if (dbCheck.alreadyDelivered && !forceResend && !dryRunSandbox) {
      return NextResponse.json(
        {
          ok: false,
          error: "ALREADY_DELIVERED",
          entryId,
          deliveredAt: dbCheck.deliveredAt,
          message: `Concierge quote was already delivered for ${entryId}. Pass forceResend: true to send again.`,
        },
        { status: 409, headers: NO_STORE_NOINDEX_HEADERS },
      );
    }

    if (dbCheck.submission) {
      if (dbCheck.submission.email && !toEmail) {
        toEmail = dbCheck.submission.email.trim();
      }
      if (dbCheck.submission.name && !guestFirstName) {
        guestFirstName = extractPassengerFirstName(dbCheck.submission.name);
      }
      if (dbCheck.submission.juneau_date || dbCheck.submission.port_date) {
        portDateForLog = String(
          dbCheck.submission.juneau_date || dbCheck.submission.port_date,
        );
      }
      isTestEntry = Boolean(dbCheck.submission.is_test);
    }
  }

  if (requestedPresetId) {
    const hydrated = buildHydratedConciergePreset(requestedPresetId, {
      guestFirstName: guestFirstName || "there",
      shareCode:
        typeof body.shareCode === "string" ? body.shareCode.trim() : null,
    });
    if (!subject) subject = hydrated.subject;
    if (!textBody) textBody = hydrated.textBody;
  }

  const effectiveItemKey =
    rawItemKey ||
    (entryId ? `jfd:waitlist:${entryId}` : "dcc:concierge:manual");

  if ((!toEmail && !dryRunSandbox) || !subject || !textBody) {
    return NextResponse.json(
      {
        ok: false,
        error: "MISSING_REQUIRED_FIELDS",
        message:
          "toEmail (or resolvable JFD submission email), subject, and textBody (or presetId) are required.",
      },
      { status: 400, headers: NO_STORE_NOINDEX_HEADERS },
    );
  }

  const effectiveRecipients = dryRunSandbox
    ? ["delivered@resend.dev"]
    : [toEmail];

  const replyTo = (
    (typeof body.replyTo === "string" && body.replyTo.trim()) ||
    (process.env.DEPLOY_TEST_EMAIL_TO || "").trim() ||
    DEFAULT_REPLY_TO
  ).trim();

  const safeFrom = resolveSafeConciergeFromAddress(fromBrand);
  const internalSecret = (process.env.DCC_INTERNAL_API_SECRET || "").trim();
  const isJfdBrand =
    fromBrand === "juneauflightdeck" ||
    fromBrand === "juneauflightdeck.com" ||
    fromBrand === "jfd";

  let dispatchChannel: "jfd_internal_relay" | "dcc_local_resend" | null = null;
  let resendId: string | null = null;
  let fromUsed = safeFrom;
  let lastError: string | null = null;
  let lastStatus = 502;

  // Step 1: Try JFD internal relay first when fromBrand === "juneauflightdeck" and DCC_INTERNAL_API_SECRET is configured
  if (isJfdBrand && internalSecret) {
    const relayUrl = (
      process.env.JFD_INTERNAL_CONCIERGE_REPLY_URL ||
      "https://juneauflightdeck.com/api/internal/concierge-reply"
    ).trim();
    try {
      const relayRes = await fetch(relayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-internal-secret": internalSecret,
        },
        body: JSON.stringify({
          to: effectiveRecipients,
          subject,
          text: textBody,
          replyTo,
          from: safeFrom,
          dryRunSandbox,
        }),
        cache: "no-store",
      });
      const relayJson = (await relayRes.json().catch(() => ({}))) as {
        ok?: boolean;
        resendId?: string | null;
        error?: string | null;
        fromUsed?: string | null;
      };
      if (relayRes.ok && relayJson.ok) {
        dispatchChannel = "jfd_internal_relay";
        resendId = relayJson.resendId || null;
        if (
          relayJson.fromUsed &&
          !/partyatredrocks\.com/i.test(relayJson.fromUsed)
        ) {
          fromUsed = relayJson.fromUsed;
        }
        lastStatus = 200;
      } else {
        lastError =
          relayJson.error || `JFD_RELAY_HTTP_${relayRes.status}`;
        lastStatus = relayRes.status || 502;
      }
    } catch (err) {
      lastError =
        err instanceof Error ? err.message : "JFD_RELAY_UNREACHABLE";
    }
  }

  // Step 2: Fallback to DCC local RESEND_API_KEY || DCC_RESEND_API_KEY
  if (!dispatchChannel) {
    const localResendKey = (
      process.env.RESEND_API_KEY ||
      process.env.DCC_RESEND_API_KEY ||
      ""
    ).trim();

    if (!localResendKey) {
      return NextResponse.json(
        {
          ok: false,
          error: lastError || "RESEND_NOT_CONFIGURED",
          status: 503,
          fromUsed: safeFrom,
        },
        { status: 503, headers: NO_STORE_NOINDEX_HEADERS },
      );
    }

    try {
      const localRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localResendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: safeFrom,
          to: effectiveRecipients,
          subject,
          text: textBody,
          reply_to: replyTo,
        }),
        cache: "no-store",
      });
      const localData = (await localRes.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
        name?: string;
      };
      if (!localRes.ok) {
        return NextResponse.json(
          {
            ok: false,
            error:
              localData.message ||
              localData.name ||
              `RESEND_HTTP_${localRes.status}`,
            status: localRes.status,
            fromUsed: safeFrom,
          },
          { status: localRes.status, headers: NO_STORE_NOINDEX_HEADERS },
        );
      }
      dispatchChannel = "dcc_local_resend";
      resendId = localData.id || null;
      fromUsed = safeFrom;
      lastStatus = 200;
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error: err instanceof Error ? err.message : "RESEND_NETWORK_ERROR",
          status: 502,
          fromUsed: safeFrom,
        },
        { status: 502, headers: NO_STORE_NOINDEX_HEADERS },
      );
    }
  }

  let dbUpdated = false;
  let triageOverlay = null;

  if (!dryRunSandbox) {
    const nowIso = new Date().toISOString();
    if (entryId) {
      inMemoryDeliveredConciergeQuotes.set(entryId, {
        deliveredAt: nowIso,
        resendId,
        toEmail,
      });
      dbUpdated = await recordJfdConciergeDeliveryInPostgres({
        entryId,
        recipientEmail: toEmail,
        portDate: portDateForLog,
        tourName: subject.slice(0, 140),
        resendId,
        fromUsed,
        actor: auth.actor,
        subject,
        isTest: isTestEntry,
      });
    }

    const triageSave = await saveOperatorInboxTriageOverlay({
      itemKey: effectiveItemKey,
      triageStatus: "contacted",
      operatorNote: `Concierge reply sent to ${toEmail} via ${dispatchChannel} (${resendId || "200 OK"})`,
      updatedBy: auth.actor,
      isTest: isTestEntry,
    });
    if (triageSave.ok) {
      triageOverlay = triageSave.overlay;
    }
  }

  return NextResponse.json(
    {
      ok: true,
      status: lastStatus,
      dispatchChannel,
      resendId,
      fromUsed,
      replyTo,
      recipientUsed: effectiveRecipients[0],
      dryRunSandbox,
      entryId: entryId || null,
      presetId: requestedPresetId,
      subject,
      dbUpdated,
      triageOverlay,
    },
    { status: 200, headers: NO_STORE_NOINDEX_HEADERS },
  );
}
