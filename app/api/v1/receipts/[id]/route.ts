import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  getMachineDecisionReceipt,
  getV03ReceiptWithFallback,
  verifyDecisionReceiptSignature,
  verifyV03DecisionReceiptJws,
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

  // Check v0.3 runtime store + Neon relational ledger if full 64-hex SHA-256 receipt ID
  if (decodedId.startsWith("rcpt:sha256:") || decodedId.startsWith("rcpt:sim:sha256:")) {
    const stored = await getV03ReceiptWithFallback(decodedId);
    if (stored) {
      const verification = await verifyV03DecisionReceiptJws({
        jwsCompact: stored.receipt.jwsCompact,
      });
      return buildMachineJsonResponse(
        {
          ok: true,
          protocolVersion: "0.3.0",
          objectType: "DecisionReceiptV03",
          receipt: stored.receipt,
          signatureVerification: verification,
        },
        {
          etag: `"sha256-${stored.receipt.rfc8785PayloadSha256}"`,
          cacheControl: "public, max-age=31536000, immutable",
        },
      );
    }
  }

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
