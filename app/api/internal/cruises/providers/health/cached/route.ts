import { NextResponse } from "next/server";
import {
  readCruiseProviderHealthSnapshot,
  getCruiseProviderHealthSnapshotStatus,
} from "@/lib/dcc/action/cruiseProviderHealth";

export const runtime = "nodejs";

export async function GET() {
  const snapshot = readCruiseProviderHealthSnapshot();
  const status = getCruiseProviderHealthSnapshotStatus(snapshot);

  return NextResponse.json(
    {
      snapshot,
      status,
    },
    { status: 200 }
  );
}
