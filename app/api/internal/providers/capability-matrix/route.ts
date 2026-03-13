import { NextResponse } from "next/server";
import {
  getProviderCapabilitySummary,
  listProviderCapabilityMatrix,
} from "@/lib/dcc/providers/capabilityMatrix";

export const runtime = "nodejs";

export async function GET() {
  const providers = listProviderCapabilityMatrix();
  return NextResponse.json(
    {
      generated_at: new Date().toISOString(),
      summary: getProviderCapabilitySummary(),
      providers,
    },
    { status: 200 }
  );
}
