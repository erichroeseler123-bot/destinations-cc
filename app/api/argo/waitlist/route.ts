import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

type WaitlistBody = {
  email?: string;
  name?: string;
  source?: string;
  preferredMonth?: string;
  partySize?: number;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as WaitlistBody;
  const email = (body.email || "").trim().toLowerCase();
  const name = (body.name || "").trim();
  const source = (body.source || "argo-page").trim();
  const preferredMonth = (body.preferredMonth || "").trim() || null;
  const partySizeRaw = Number(body.partySize || 0);
  const partySize = Number.isFinite(partySizeRaw) ? Math.max(1, Math.min(20, Math.round(partySizeRaw))) : null;

  if (!isValidEmail(email)) {
    return Response.json({ ok: false, error: "Please provide a valid email." }, { status: 400 });
  }

  const record = {
    createdAt: new Date().toISOString(),
    email,
    name: name || null,
    source,
    preferredMonth,
    partySize,
  };

  const outDir = path.join(process.cwd(), "data", "waitlist");
  const outFile = path.join(outDir, "argo-launch-alerts.jsonl");
  await mkdir(outDir, { recursive: true });
  await appendFile(outFile, `${JSON.stringify(record)}\n`, "utf8");

  return Response.json({ ok: true });
}
