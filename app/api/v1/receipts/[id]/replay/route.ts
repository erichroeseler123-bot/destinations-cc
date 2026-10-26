import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  handleV03ReplayReceiptRequest,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const { id } = await context.params;
  const receiptId = decodeURIComponent(id);

  try {
    const replayResult = await handleV03ReplayReceiptRequest(receiptId);
    return buildMachineJsonResponse(
      {
        ok: true,
        protocolVersion: "0.3.0",
        replay: {
          ...replayResult,
          matchesOriginalReceipt: replayResult.matchesOriginalHashes,
          replayedReceiptId: replayResult.replayResult.receiptId,
        },
      },
      {
        status: 200,
        cacheControl: "no-store",
      },
    );
  } catch (err) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "RECEIPT_REPLAY_NOT_FOUND",
          message:
            err instanceof Error
              ? err.message
              : `Receipt "${receiptId}" could not be replayed.`,
        },
      },
      { status: 404, cacheControl: "no-store" },
    );
  }
}
