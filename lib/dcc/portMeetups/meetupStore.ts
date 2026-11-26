import { createHash } from "node:crypto";
import { redis } from "@/lib/redis";
import type { MeetupAttendanceParty } from "./meetupTypes";

const testParties = new Map<string, Record<string, MeetupAttendanceParty>>();
export function clearInMemoryPortMeetupStoreForTests() { testParties.clear(); }
export function isDccPortMeetupPilotEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const flag = (env.ENABLE_PORT_MEETUP_PILOT || "").trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;
  if (env.VERCEL_ENV === "production") return false;
  return true;
}
export function resolvePortMeetupNamespace(): string {
  return process.env.VERCEL_ENV === "production" ? "production" : "preview";
}
export function hashOpaquePartyToken(token: string): string {
  if (!/^[A-Za-z0-9_-]{24,128}$/.test(token)) throw new Error("Invalid party token.");
  return createHash("sha256").update(`dcc-port-meetup-party-v1:${token}`).digest("hex");
}
export function buildPortMeetupKey(p: { physicalSailingId: string; portSlug: string; serviceDate: string; operatorId: string; productCom: string; departureTime24: string }): string {
  return [p.physicalSailingId, p.portSlug, p.serviceDate, p.operatorId, p.productCom, p.departureTime24].join("::");
}
export function buildOperatorDepartureSlotKey(p: { portSlug: string; serviceDate: string; operatorId: string; productCom: string; departureTime24: string }): string {
  return [p.portSlug, p.serviceDate, p.operatorId, p.productCom, p.departureTime24].join("::");
}
function key(meetupKey: string) {
  return `dcc:port-meetup:booking-v1:${resolvePortMeetupNamespace()}:${createHash("sha256").update(meetupKey).digest("hex")}:parties`;
}
function testOnly(): boolean {
  return process.env.DCC_ISOLATED_TEST_DB === "1" && process.env.VERCEL_ENV !== "production";
}
export async function readMeetupParties(meetupKey: string): Promise<MeetupAttendanceParty[]> {
  const k = key(meetupKey);
  if (testOnly()) return Object.values(structuredClone(testParties.get(k) || {}));
  if (!redis) throw new Error("Headcount storage is unavailable.");
  const entries = await redis.hgetall<Record<string, MeetupAttendanceParty | string>>(k);
  return Object.values(entries || {}).map((value) => typeof value === "string" ? JSON.parse(value) as MeetupAttendanceParty : value);
}
export async function saveMeetupParty(meetupKey: string, party: MeetupAttendanceParty): Promise<void> {
  const k = key(meetupKey);
  if (testOnly()) {
    testParties.set(k, { ...testParties.get(k), [party.partyId]: structuredClone(party) });
    return;
  }
  if (!redis) throw new Error("Headcount storage is unavailable. Please try again later.");
  // One atomic field update per party: concurrent guests never overwrite the entire headcount.
  await redis.hset(k, { [party.partyId]: JSON.stringify(party) });
  await redis.expire(k, 60 * 60 * 24 * 400);
}
export async function deleteMeetupParty(meetupKey: string, partyId: string): Promise<void> {
  const k = key(meetupKey);
  if (testOnly()) { const entries = testParties.get(k); if (entries) delete entries[partyId]; return; }
  if (!redis) throw new Error("Headcount storage is unavailable. Please try again later.");
  await redis.hdel(k, partyId);
}
