import { NextResponse } from "next/server";
import { sendMissionNotification } from "@/lib/mailer/send";
import { DccMissionApprovalEmail } from "@/lib/mailer/templates/dccMissionApproval";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin;
  const missionId = "MSN-TEST-001";

  const result = await sendMissionNotification({
    missionId,
    brandId: "DCC",
    template: DccMissionApprovalEmail,
    context: {
      missionId,
      priorityLevel: "Watch",
      decisionCorridor: "test-corridor",
      decisionAction: "verify_mailer",
      approveUrl: `${baseUrl}/dashboard/missions/${missionId}?action=approve`,
      rejectUrl: `${baseUrl}/dashboard/missions/${missionId}?action=reject`,
      dccHandoffId: "dcc_handoff_test_001",
      timestamp: new Date().toISOString(),
    },
    subject: "[DCC] Mission Approval Test: MSN-TEST-001",
  });

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
