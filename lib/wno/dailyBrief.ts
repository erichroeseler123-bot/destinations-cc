import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { appendCorridorEventDurably, listRecentCorridorEvents } from "@/lib/dcc/telemetry/corridorEvents";

const WNO_BASE_URL = "https://www.welcometoneworleanstours.com";
const DCC_BASE_URL = "https://www.destinationcommandcenter.com";
const CORRIDOR_ID = "wno-commerce";
const BRIEF_SUBTYPE = "wno_48_hour_brief";

type LiveContext = {
  generatedAt?: string;
  period?: string;
  rainRisk?: "low" | "elevated" | "high";
  heatRisk?: "low" | "elevated" | "high";
  outdoorFriendly?: boolean;
  liveMusicSignal?: boolean;
  weather?: {
    temperatureF?: number | null;
    maxTemperatureF?: number | null;
    precipitationChance?: number | null;
    shortForecast?: string | null;
  } | null;
  events?: Array<{ title?: string; startDate?: string | null; endDate?: string | null; url?: string }>;
  conciergePick?: { slug?: string; title?: string; reason?: string } | null;
};

type Subscriber = { email: string; signupSource?: string };

function localDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function localHour(date = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );
}

function metadataEmail(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return undefined;
  const email = (metadata as Record<string, unknown>).email;
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.toLowerCase() : undefined;
}

export async function listActiveSubscribers(): Promise<Subscriber[]> {
  const events = await listRecentCorridorEvents(20000);
  const state = new Map<string, Subscriber | null>();

  for (const event of events) {
    if (event.corridorId !== CORRIDOR_ID) continue;
    if (event.eventName !== "lead_captured" && event.eventName !== "lead_unsubscribed") continue;
    const email = metadataEmail(event.metadata);
    if (!email || state.has(email)) continue;

    if (event.eventName === "lead_unsubscribed") {
      state.set(email, null);
      continue;
    }

    const metadata = (event.metadata || {}) as Record<string, unknown>;
    state.set(email, {
      email,
      signupSource: typeof metadata.signup_source === "string" ? metadata.signup_source : undefined,
    });
  }

  return [...state.values()].filter((value): value is Subscriber => Boolean(value));
}

export async function alreadySentToday(email: string, date = new Date()) {
  const key = localDateKey(date);
  const events = await listRecentCorridorEvents(20000);
  return events.some((event) => {
    if (event.corridorId !== CORRIDOR_ID || event.eventName !== "brief_sent") return false;
    const metadata = (event.metadata || {}) as Record<string, unknown>;
    return metadataEmail(metadata) === email.toLowerCase() && metadata.local_date === key;
  });
}

function signingKey() {
  return process.env.WNO_BRIEF_SIGNING_SECRET || process.env.DCC_RESEND_API_KEY || "";
}

export function unsubscribeToken(email: string) {
  const key = signingKey();
  if (!key) return "";
  return createHmac("sha256", key).update(email.toLowerCase()).digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string) {
  const expected = unsubscribeToken(email);
  if (!expected || !token || expected.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export async function unsubscribe(email: string) {
  const normalized = email.trim().toLowerCase();
  await appendCorridorEventDurably({
    corridor_id: CORRIDOR_ID,
    event_name: "lead_unsubscribed",
    subtype: BRIEF_SUBTYPE,
    metadata: {
      email: normalized,
      consent: "daily_brief_email_revoked",
      unsubscribed_at: new Date().toISOString(),
    },
  });
}

async function getLiveContext(): Promise<LiveContext> {
  const response = await fetch(`${WNO_BASE_URL}/api/live-context`, {
    headers: { Accept: "application/json", "User-Agent": "WNO 48-hour brief sender" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`live_context_${response.status}`);
  return response.json();
}

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatEventTime(value?: string | null) {
  if (!value) return "Time varies";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Time varies";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function buildBrief(context: LiveContext, email: string) {
  const weather = context.weather;
  const events = (context.events || []).slice(0, 3);
  const pick = context.conciergePick;
  const precip = typeof weather?.precipitationChance === "number" ? `${weather.precipitationChance}%` : "not available";
  const high = typeof weather?.maxTemperatureF === "number" ? `${weather.maxTemperatureF}°F` : "not available";
  const swampSignal = context.outdoorFriendly
    ? "Outdoor conditions currently favor an open-air swamp option; still confirm the operator’s departure and weather policy before booking."
    : "Weather favors a more protected swamp format today. A covered-boat option is the safer planning default."
  const riverSignal = context.rainRisk === "high"
    ? "Higher rain risk makes a river cruise more weather-sensitive today. Confirm boarding and operating status before building the day around it."
    : "Current weather does not raise a major rain flag for a river-cruise plan. Confirm the actual sailing before heading to the dock."
  const unsubscribeUrl = `${DCC_BASE_URL}/api/wno/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken(email)}`;
  const subjectLead = context.rainRisk === "high" ? "Rain-aware New Orleans plan" : context.liveMusicSignal ? "Music is moving the New Orleans plan" : "Your New Orleans 48-hour brief";

  const eventHtml = events.length
    ? `<ul style="padding-left:18px;margin:10px 0 0">${events
        .map((event) => `<li style="margin:0 0 8px"><strong>${esc(event.title || "New Orleans event")}</strong> — ${esc(formatEventTime(event.startDate))}</li>`)
        .join("")}</ul>`
    : `<p style="margin:10px 0 0;color:#6b6670">The public event feed did not return usable inventory for this send, so this brief is not inventing an event list.</p>`;

  const html = `<!doctype html><html><body style="margin:0;background:#0b090c;color:#f8f3e8;font-family:Arial,sans-serif"><div style="max-width:640px;margin:0 auto;padding:28px 20px"><div style="border:1px solid #6b5524;background:#171219;padding:28px"><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#d4af37">Welcome to New Orleans Tours</div><h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.1;margin:10px 0 8px">Your 48-hour brief</h1><p style="margin:0;color:#c9c2ce">A short planning read for what matters now — not a generic newsletter.</p></div>
  <div style="background:#fff;color:#18151a;padding:26px">
    <h2 style="font-family:Georgia,serif;margin:0 0 8px">Weather</h2><p style="margin:0 0 20px">${esc(weather?.shortForecast || "Live forecast summary unavailable")} · high ${esc(high)} · max rain chance ${esc(precip)}.</p>
    <h2 style="font-family:Georgia,serif;margin:0 0 8px">Tonight + tomorrow</h2>${eventHtml}
    <h2 style="font-family:Georgia,serif;margin:22px 0 8px">River planning signal</h2><p style="margin:0 0 20px">${esc(riverSignal)}</p>
    <h2 style="font-family:Georgia,serif;margin:0 0 8px">Swamp planning signal</h2><p style="margin:0 0 20px">${esc(swampSignal)}</p>
    <h2 style="font-family:Georgia,serif;margin:0 0 8px">Concierge pick</h2><p style="margin:0 0 8px"><strong>${esc(pick?.title || "Help Me Choose")}</strong></p><p style="margin:0 0 18px">${esc(pick?.reason || "Use the chooser to match your time, group and logistics.")}</p>
    <p style="margin:24px 0 0"><a href="${WNO_BASE_URL}${pick?.slug ? `/tours/${encodeURIComponent(pick.slug)}` : "/help-me-choose"}" style="display:inline-block;background:#d4af37;color:#171717;text-decoration:none;font-weight:bold;padding:12px 18px">Open today’s plan</a></p>
    <p style="margin:24px 0 0;font-size:12px;color:#756f79">River and swamp notes above are planning signals derived from current weather/event context, not river-stage or wetland sensor measurements. Tour schedules, availability and operator policies can change.</p>
  </div>
  <div style="padding:18px 6px;color:#918a96;font-size:11px;line-height:1.5">You joined the New Orleans 48-hour planning brief. <a style="color:#c5a059" href="${esc(unsubscribeUrl)}">Unsubscribe</a> · <a style="color:#c5a059" href="${WNO_BASE_URL}/privacy">Privacy</a></div></div></body></html>`;

  return { subject: subjectLead, html };
}

export async function sendDailyBriefs() {
  if (!process.env.DCC_RESEND_API_KEY) throw new Error("DCC_RESEND_API_KEY is not configured");
  const context = await getLiveContext();
  const subscribers = await listActiveSubscribers();
  const resend = new Resend(process.env.DCC_RESEND_API_KEY);
  const dateKey = localDateKey();
  const result = { subscribers: subscribers.length, sent: 0, skipped: 0, failed: 0, localDate: dateKey };

  for (const subscriber of subscribers) {
    if (await alreadySentToday(subscriber.email)) {
      result.skipped += 1;
      continue;
    }

    const brief = buildBrief(context, subscriber.email);
    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM_WNO || "Welcome to New Orleans Tours <updates@destinationcommandcenter.com>",
      replyTo: process.env.MAIL_REPLY_TO_WNO || "help@welcometoneworleanstours.com",
      to: subscriber.email,
      subject: brief.subject,
      html: brief.html,
      headers: {
        "List-Unsubscribe": `<${DCC_BASE_URL}/api/wno/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${unsubscribeToken(subscriber.email)}>`,
        "X-Entity-Ref-ID": `wno-brief-${dateKey}`,
      },
    });

    if (error || !data?.id) {
      result.failed += 1;
      continue;
    }

    await appendCorridorEventDurably({
      corridor_id: CORRIDOR_ID,
      event_name: "brief_sent",
      subtype: BRIEF_SUBTYPE,
      metadata: {
        email: subscriber.email,
        local_date: dateKey,
        message_id: data.id,
        signup_source: subscriber.signupSource,
      },
    });
    result.sent += 1;
  }

  return result;
}
