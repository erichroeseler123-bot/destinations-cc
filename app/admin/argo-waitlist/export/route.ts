import { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/adminAccess";
import { filterArgoWaitlist, readArgoWaitlist, waitlistToCsv } from "@/lib/argoWaitlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toInt(value: string | null) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : undefined;
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (!isValidAdminSession(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = (searchParams.get("month") || "").trim();
  const minParty = toInt(searchParams.get("minParty"));
  const maxParty = toInt(searchParams.get("maxParty"));

  const allEntries = await readArgoWaitlist();
  const filtered = filterArgoWaitlist(
    allEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    {
      preferredMonth: month || undefined,
      minPartySize: minParty,
      maxPartySize: maxParty,
    },
  );

  const csv = waitlistToCsv(filtered);
  const datePart = new Date().toISOString().slice(0, 10);
  const fileName = `argo-waitlist-${datePart}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
