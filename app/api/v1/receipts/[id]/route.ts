import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  getMachineDecisionReceipt,
  verifyDecisionReceiptSignature,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const { id } = await context.params;
  const decodedId = decodeURIComponent(id);

  const receipt = getMachineDecisionReceipt(decodedId);
  if (!receipt) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "DECISION_RECEIPT_NOT_FOUND",
          message: `SignedDecisionReceipt "${decodedId}" was not found.`,
        },
      },
      { status: 404, cacheControl: "no-store" },
    );
  }

  const verification = verifyDecisionReceiptSignature(receipt);

  return buildMachineJsonResponse(
    {
      ok: true,
      objectType: "DecisionReceipt",
      receipt,
      signatureVerification: verification,
    },
    {
      etag: `"sha256-${receipt.canonicalPayloadHash.slice(0, 32)}"`,
      cacheControl: "public, max-age=31536000, immutable",
    },
  );
}
