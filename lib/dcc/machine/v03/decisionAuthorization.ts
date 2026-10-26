import crypto from "node:crypto";
import {
  getActiveV03SigningKey,
  jwsCompactSignEdDsa,
  jwsCompactVerifyEdDsa,
  rfc8785Canonicalize,
  sha256HexFull,
  verifyV03DecisionReceiptJws,
  type V03SignedDecisionReceipt,
} from "./rfc8785AndJws";

/**
 * DCC Machine Layer v0.3 — Provider-Neutral DecisionAuthorization (Shadow Mode)
 *
 * Implements Requirement 11:
 * - Provider-neutral `DecisionAuthorization` schema binding:
 *   - `decisionReceipt` (`receiptId`, `jwsCompact`, `evaluationFingerprint`)
 *   - `permittedAction`
 *   - `providerProductReference` (DCC entity ID + versioned external aliases)
 *   - `maxPrice` & `currency`
 *   - `expiresAt`
 *   - `revalidationRequirements`
 *   - `consentMandateReference`
 *   - `idempotencyKey`
 *   - `requiredParameters`
 *   - `opaqueRouting` (with `wtaExcluded: true`)
 *   - `revocation`
 *   - `providerResultLinkage`
 * - Adapter interfaces and shadow-mode dry-run implementations for:
 *   - `OCTO` (Open Connectivity for Tours, Activities & Attractions)
 *   - `AP2` (Agent Payments Protocol)
 *   - `ACP` (Agentic Commerce Protocol)
 *   - `Rezdy`
 *   - `Square`
 * - Zero live bookings, zero inventory reservations, zero payment charges, and zero traveler contact.
 */

export type CommerceAdapterTarget = "octo" | "ap2" | "acp" | "rezdy" | "square";

export type PermittedAuthorizationAction =
  | "shadow_quote_validation"
  | "shadow_inventory_check"
  | "shadow_checkout_intent_preparation";

export interface V03RevalidationRequirement {
  requirementCode: string;
  predicate: string;
  thresholdOrExpectedValue: string | number | boolean;
  mustRevalidateWithinSeconds: number;
}

export interface V03DecisionAuthorizationPayload {
  objectType: "DecisionAuthorization";
  spec: "dcc-decision-authorization/0.3";
  authorizationId: string;
  executionMode: "shadow_only_no_side_effects";
  decisionReceipt: {
    receiptId: string;
    evaluationFingerprint: string;
    resultHash: string;
    knowledgeCutoff: string;
    jwsCompact: string;
  };
  permittedAction: PermittedAuthorizationAction;
  providerProductReference: {
    candidateDccEntityId: string;
    operatorDccEntityId: string;
    displayName: string;
    externalAliases: Record<string, string>;
  };
  maxPrice: {
    amountMinorUnits: number;
    amountDecimal: number;
    currency: "USD";
  };
  issuedAt: string;
  expiresAt: string;
  revalidationRequirements: V03RevalidationRequirement[];
  consentMandateReference: {
    mandateId: string;
    principalType: "traveler_delegated_agent" | "autonomous_shadow_verifier";
    scopeDigestSha256: string;
    grantedAt: string;
  };
  idempotencyKey: string;
  requiredParameters: {
    serviceDate: string;
    passengerCount: number;
    pickupNodeCode: string;
    dropoffNodeCode: string;
    luggageSkiBagCount?: number;
  };
  opaqueRouting: {
    targetAdapter: CommerceAdapterTarget;
    routingToken: string;
    wtaExcluded: true;
  };
  revocation: {
    status: "active" | "revoked" | "expired";
    revokedAt: string | null;
    revocationReason: string | null;
    revocationCheckUri: string;
  };
  providerResultLinkage: {
    shadowExecutionId: string;
    adapterId: CommerceAdapterTarget;
    dryRunValidatedAt: string;
    liveSideEffectsExecuted: false;
    bookingSubmitted: false;
    inventoryReserved: false;
    paymentCharged: false;
    travelerContacted: false;
    simulatedProviderRequestSha256: string;
  };
}

export interface V03SignedDecisionAuthorization {
  authorizationId: string;
  executionMode: "shadow_only_no_side_effects";
  kid: string;
  alg: "EdDSA";
  jwsCompact: string;
  payload: V03DecisionAuthorizationPayload;
}

export interface ShadowCommerceAdapterResult {
  adapterId: CommerceAdapterTarget;
  executionMode: "shadow_only_no_side_effects";
  schemaValid: boolean;
  liveNetworkCallMade: false;
  bookingSubmitted: false;
  inventoryReserved: false;
  paymentCharged: false;
  travelerContacted: false;
  simulatedWireEnvelope: Record<string, unknown>;
  simulatedWireEnvelopeSha256: string;
}

export interface ShadowCommerceAdapter {
  readonly adapterId: CommerceAdapterTarget;
  readonly protocolSpec: string;
  validateAndSimulateShadowPayload(
    authz: V03DecisionAuthorizationPayload,
  ): Promise<ShadowCommerceAdapterResult>;
}

function makeShadowAdapter(
  adapterId: CommerceAdapterTarget,
  protocolSpec: string,
  mapEnvelope: (authz: V03DecisionAuthorizationPayload) => Record<string, unknown>,
): ShadowCommerceAdapter {
  return {
    adapterId,
    protocolSpec,
    async validateAndSimulateShadowPayload(authz) {
      if (authz.executionMode !== "shadow_only_no_side_effects") {
        throw new Error(`Adapter ${adapterId} refuses non-shadow execution in v0.3.`);
      }
      if (!authz.opaqueRouting.wtaExcluded) {
        throw new Error("WTA routing is strictly forbidden.");
      }
      const simulatedWireEnvelope = {
        _shadowModeOnly: true,
        _protocol: protocolSpec,
        idempotencyKey: authz.idempotencyKey,
        authorizationId: authz.authorizationId,
        receiptId: authz.decisionReceipt.receiptId,
        ...mapEnvelope(authz),
      };
      return {
        adapterId,
        executionMode: "shadow_only_no_side_effects",
        schemaValid: true,
        liveNetworkCallMade: false,
        bookingSubmitted: false,
        inventoryReserved: false,
        paymentCharged: false,
        travelerContacted: false,
        simulatedWireEnvelope,
        simulatedWireEnvelopeSha256: sha256HexFull(
          rfc8785Canonicalize(simulatedWireEnvelope),
        ),
      };
    },
  };
}

export const SHADOW_COMMERCE_ADAPTERS: Record<CommerceAdapterTarget, ShadowCommerceAdapter> = {
  octo: makeShadowAdapter("octo", "OCTO-Core/1.2-shadow", (a) => ({
    productId: a.providerProductReference.externalAliases.octo_product_id ?? a.providerProductReference.candidateDccEntityId,
    availabilityDate: a.requiredParameters.serviceDate,
    units: [{ id: "pax-adult", quantity: a.requiredParameters.passengerCount }],
    maxTotalMinorUnits: a.maxPrice.amountMinorUnits,
    currency: a.maxPrice.currency,
  })),
  ap2: makeShadowAdapter("ap2", "Google-AP2-Mandate/0.1-shadow", (a) => ({
    cartMandateId: a.consentMandateReference.mandateId,
    maxAmountMinor: a.maxPrice.amountMinorUnits,
    currency: a.maxPrice.currency,
    merchantEntityId: a.providerProductReference.operatorDccEntityId,
    decisionReceiptHash: a.decisionReceipt.evaluationFingerprint,
  })),
  acp: makeShadowAdapter("acp", "Agentic-Commerce-Protocol/0.1-shadow", (a) => ({
    checkoutIntentType: a.permittedAction,
    skuReference: a.providerProductReference.candidateDccEntityId,
    priceCeiling: a.maxPrice,
    revalidationGates: a.revalidationRequirements.map((r) => r.requirementCode),
  })),
  rezdy: makeShadowAdapter("rezdy", "Rezdy-Supplier-API/v1-shadow", (a) => ({
    productCode: a.providerProductReference.externalAliases.rezdy_product_code ?? "SHADOW-REZDY-SKU",
    startTimeLocal: `${a.requiredParameters.serviceDate}T08:00:00`,
    quantities: [{ optionLabel: "Shuttle Seat", value: a.requiredParameters.passengerCount }],
  })),
  square: makeShadowAdapter("square", "Square-Orders-DryRun/2026-shadow", (a) => ({
    locationId: a.providerProductReference.externalAliases.square_location_id ?? "SHADOW-SQUARE-LOC",
    lineItems: [
      {
        name: a.providerProductReference.displayName,
        quantity: String(a.requiredParameters.passengerCount),
        basePriceMoney: {
          amount: a.maxPrice.amountMinorUnits,
          currency: a.maxPrice.currency,
        },
      },
    ],
  })),
};

export async function issueShadowDecisionAuthorization(params: {
  receipt: V03SignedDecisionReceipt;
  permittedAction: PermittedAuthorizationAction;
  providerProductReference: V03DecisionAuthorizationPayload["providerProductReference"];
  maxPriceUsdDecimal: number;
  requiredParameters: V03DecisionAuthorizationPayload["requiredParameters"];
  targetAdapter: CommerceAdapterTarget;
  issuedAtIso?: string;
  ttlSeconds?: number;
}): Promise<{
  signedAuthorization: V03SignedDecisionAuthorization;
  adapterDryRun: ShadowCommerceAdapterResult;
}> {
  const receiptVer = await verifyV03DecisionReceiptJws({
    jwsCompact: params.receipt.jwsCompact,
  });
  if (!receiptVer.valid || !receiptVer.payload) {
    throw new Error(`Cannot authorize from invalid decision receipt: ${receiptVer.reason}`);
  }
  if (
    receiptVer.payload.decisionState !== "recommended" &&
    receiptVer.payload.decisionState !== "qualified_recommendation"
  ) {
    throw new Error(
      `Cannot issue DecisionAuthorization for non-viable decision state "${receiptVer.payload.decisionState}".`,
    );
  }

  const issuedAt = params.issuedAtIso ?? new Date().toISOString();
  const expiresAt = new Date(
    Date.parse(issuedAt) + (params.ttlSeconds ?? 900) * 1000,
  ).toISOString();
  const amountMinorUnits = Math.round(params.maxPriceUsdDecimal * 100);

  const idempotencyKey = `idem:sha256:${sha256HexFull(
    rfc8785Canonicalize({
      receiptId: params.receipt.receiptId,
      permittedAction: params.permittedAction,
      candidateDccEntityId: params.providerProductReference.candidateDccEntityId,
      requiredParameters: params.requiredParameters,
      targetAdapter: params.targetAdapter,
    }),
  )}`;

  const simulatedProviderRequestSha256 = sha256HexFull(
    rfc8785Canonicalize({
      adapter: params.targetAdapter,
      idempotencyKey,
      providerProductReference: params.providerProductReference,
      requiredParameters: params.requiredParameters,
      amountMinorUnits,
    }),
  );

  const authCoreHash = sha256HexFull(
    rfc8785Canonicalize({
      receiptId: params.receipt.receiptId,
      idempotencyKey,
      issuedAt,
      expiresAt,
      simulatedProviderRequestSha256,
    }),
  );
  const authorizationId = `authz:sha256:${authCoreHash}`;

  const payload: V03DecisionAuthorizationPayload = {
    objectType: "DecisionAuthorization",
    spec: "dcc-decision-authorization/0.3",
    authorizationId,
    executionMode: "shadow_only_no_side_effects",
    decisionReceipt: {
      receiptId: params.receipt.receiptId,
      evaluationFingerprint: params.receipt.payload.evaluationFingerprint,
      resultHash: params.receipt.payload.resultHash,
      knowledgeCutoff: params.receipt.payload.knowledgeCutoff,
      jwsCompact: params.receipt.jwsCompact,
    },
    permittedAction: params.permittedAction,
    providerProductReference: params.providerProductReference,
    maxPrice: {
      amountMinorUnits,
      amountDecimal: params.maxPriceUsdDecimal,
      currency: "USD",
    },
    issuedAt,
    expiresAt,
    revalidationRequirements: [
      {
        requirementCode: "REVALIDATE_RECEIPT_NOT_REVOKED",
        predicate: "signing_key_and_receipt_active",
        thresholdOrExpectedValue: true,
        mustRevalidateWithinSeconds: 60,
      },
      {
        requirementCode: "REVALIDATE_CLAIMS_NOT_WITHDRAWN",
        predicate: "pinned_claims_remain_active_in_ledger",
        thresholdOrExpectedValue: true,
        mustRevalidateWithinSeconds: 60,
      },
      {
        requirementCode: "REVALIDATE_PRICE_CEILING",
        predicate: "live_quote_minor_units_lte_max_price",
        thresholdOrExpectedValue: amountMinorUnits,
        mustRevalidateWithinSeconds: 300,
      },
    ],
    consentMandateReference: {
      mandateId: `mandate:sha256:${sha256HexFull(`consent:${idempotencyKey}`).slice(0, 32)}`,
      principalType: "autonomous_shadow_verifier",
      scopeDigestSha256: sha256HexFull(
        rfc8785Canonicalize(params.requiredParameters),
      ),
      grantedAt: issuedAt,
    },
    idempotencyKey,
    requiredParameters: params.requiredParameters,
    opaqueRouting: {
      targetAdapter: params.targetAdapter,
      routingToken: `rtok:${sha256HexFull(`${authorizationId}:${params.targetAdapter}`).slice(0, 24)}`,
      wtaExcluded: true,
    },
    revocation: {
      status: "active",
      revokedAt: null,
      revocationReason: null,
      revocationCheckUri: `https://www.destinationcommandcenter.com/api/v1/authorizations/${encodeURIComponent(authorizationId)}`,
    },
    providerResultLinkage: {
      shadowExecutionId: `shdw:${crypto.randomUUID()}`,
      adapterId: params.targetAdapter,
      dryRunValidatedAt: issuedAt,
      liveSideEffectsExecuted: false,
      bookingSubmitted: false,
      inventoryReserved: false,
      paymentCharged: false,
      travelerContacted: false,
      simulatedProviderRequestSha256,
    },
  };

  const activeKey = getActiveV03SigningKey();
  const canonicalPayload = rfc8785Canonicalize(payload);
  const jwsCompact = jwsCompactSignEdDsa({
    protectedHeader: {
      alg: "EdDSA",
      typ: "application/dcc-decision-authorization+jws",
      kid: activeKey.kid,
    },
    payloadUtf8: canonicalPayload,
    privateKeyObject: activeKey.privateKeyObject!,
  });

  const adapter = SHADOW_COMMERCE_ADAPTERS[params.targetAdapter];
  const adapterDryRun = await adapter.validateAndSimulateShadowPayload(payload);

  return {
    signedAuthorization: {
      authorizationId,
      executionMode: "shadow_only_no_side_effects",
      kid: activeKey.kid,
      alg: "EdDSA",
      jwsCompact,
      payload,
    },
    adapterDryRun,
  };
}

export async function verifyShadowDecisionAuthorizationJws(
  jwsCompact: string,
): Promise<{
  valid: boolean;
  payload?: V03DecisionAuthorizationPayload;
}> {
  const sigCheck = jwsCompactVerifyEdDsa({ jwsCompact });
  if (!sigCheck.valid || !sigCheck.decodedPayloadUtf8) {
    return { valid: false };
  }
  const payload = JSON.parse(sigCheck.decodedPayloadUtf8) as V03DecisionAuthorizationPayload;
  return { valid: true, payload };
}
