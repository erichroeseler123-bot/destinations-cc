import { NextResponse } from "next/server";
import type { EngagementEvent } from "@/lib/dcc/liveSlots/types";

function isValidAction(action: string) {
  return [
    "page_view",
    "date_selected",
    "slots_loaded",
    "slot_click",
    "fallback_click",
    "no_results",
  ].includes(action);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<EngagementEvent>;

  if (
    !payload.site
    || !payload.market
    || !payload.page
    || !payload.action
    || !payload.occurredAt
    || !isValidAction(String(payload.action))
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  console.log("dcc-live-slot-engagement", payload);

  return NextResponse.json({ ok: true });
}
