import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { isDccPortMeetupPilotEnabled } from "@/lib/dcc/portMeetups/meetupStore";
import { resolvePortMeetupForShipCall, upsertMeetupAttendanceParty, removeMeetupAttendanceParty, type MeetupLookup } from "@/lib/dcc/portMeetups/meetupEngine";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" };
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
const allowedQuery = new Set(["physicalSailingId", "shipSlug", "sailDate", "organizerSlug", "sailingSlug", "portSlug", "partySize"]);
const allowedBody = new Set(["action", "physicalSailingId", "shipSlug", "sailDate", "organizerSlug", "sailingSlug", "portSlug", "partyToken", "status", "partySize", "sourceSurface"]);
function lookup(data: Record<string, unknown>): MeetupLookup {
  const keys = ["physicalSailingId", "shipSlug", "sailDate", "organizerSlug", "sailingSlug", "portSlug"] as const;
  return Object.fromEntries(keys.map(k => [k, typeof data[k] === "string" ? data[k] : null]));
}
export async function GET(request: Request) {
  if (!isDccPortMeetupPilotEnabled()) return reply({ ok: false, error: "PILOT_DISABLED" },404);
  const query = new URL(request.url).searchParams;
  if ([...query.keys()].some(p=>!allowedQuery.has(p))) return reply({ ok:false,error:"UNSUPPORTED_QUERY" },400);
  try {
    const result = await resolvePortMeetupForShipCall({ ...lookup(Object.fromEntries(query)), partySize: query.has("partySize") ? Number(query.get("partySize")) : 2, viewerPartyToken: request.headers.get("x-cp-party-token") });
    return result ? reply(result) : reply({ok:false,error:"PORT_MEETUP_NOT_FOUND"},404);
  } catch { return reply({ok:false,error:"MEETUP_UNAVAILABLE"},503); }
}
export async function POST(request: Request) {
  if (!isDccPortMeetupPilotEnabled()) return reply({ok:false,error:"PILOT_DISABLED"},404);
  if (new URL(request.url).search) return reply({ok:false,error:"UNSUPPORTED_QUERY"},400);
  const origin = request.headers.get("origin");
  if (origin && !["https://cruisepromenade.com","https://destinationcommandcenter.com","https://www.destinationcommandcenter.com",new URL(request.url).origin].includes(origin)) return reply({ok:false,error:"ORIGIN_NOT_ALLOWED"},403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply({ok:false,error:"JSON_REQUIRED"},415);
  const text = await request.text();
  if (text.length > 2048) return reply({ok:false,error:"PAYLOAD_TOO_LARGE"},413);
  let body: Record<string,unknown>;
  try { body=JSON.parse(text); if (!body || Array.isArray(body) || typeof body!=="object") throw Error(); } catch {return reply({ok:false,error:"INVALID_JSON"},400);}
  if (Object.keys(body).some(k=>!allowedBody.has(k))) return reply({ok:false,error:"UNSUPPORTED_FIELD"},400);
  if (body.action!=="upsert_attendance"&&body.action!=="remove_attendance") return reply({ok:false,error:"UNSUPPORTED_ACTION"},400);
  if (typeof body.partyToken!=="string"||!/^[A-Za-z0-9_-]{24,128}$/.test(body.partyToken)) return reply({ok:false,error:"INVALID_PARTY_TOKEN"},400);
  if (body.action==="upsert_attendance"&&(!["planning","reported_booked"].includes(String(body.status))||!Number.isInteger(body.partySize)||Number(body.partySize)<1||Number(body.partySize)>8)) return reply({ok:false,error:"INVALID_ATTENDANCE"},400);
  try {
    if (!(process.env.DCC_ISOLATED_TEST_DB==="1"&&process.env.VERCEL_ENV!=="production")) {
      if (!redis) throw Error("Headcount storage unavailable.");
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const rateKey = `dcc:meetup:rate:${Math.floor(Date.now()/60000)}:${createHash("sha256").update(ip).digest("hex").slice(0,24)}`;
      const count=await redis.incr(rateKey); if(count===1)await redis.expire(rateKey,120);
      if(count>120)return reply({ok:false,error:"RATE_LIMITED",message:"Please wait a minute and try again."},429);
    }
    const base={...lookup(body),partyToken:body.partyToken};
    const result=body.action==="remove_attendance"?await removeMeetupAttendanceParty(base):await upsertMeetupAttendanceParty({...base,status:body.status as "planning"|"reported_booked",partySize:Number(body.partySize),sourceSurface:body.sourceSurface==="physical_sailing"?"physical_sailing":"hosted_sailing"});
    return result?reply(result):reply({ok:false,error:"PORT_MEETUP_NOT_FOUND"},404);
  } catch { return reply({ok:false,error:"HEADCOUNT_UNAVAILABLE",message:"Your change could not be confirmed. Please try again; your party will only be counted once."},503); }
}
