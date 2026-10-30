import crypto from "crypto";
import {
  getDb,
  hasConfiguredDatabaseUrl,
  withPaymentAllocationTransaction,
  type DccDb,
} from "@/lib/db/client";
import {
  dccOrderPayments,
  dccPaymentAllocations,
  dccOrderItems,
  dccSupplierBookings,
  dccOperatorPayables,
  dccDisputesAndRefunds,
  dccSquareWebhookEvents,
  octoBookings,
  octoSettlementLedger,
  octoAuditLogs,
} from "@/lib/db/schema";
import { and, eq, or, sql } from "drizzle-orm";
import { SquareClient, SquareEnvironment } from "square";
import {
  getSquareAccessToken,
  getSquareEnvironment,
  getSquareLocationIdDcc,
  assertValidDccSquareProductionConfig,
  isSquareProduction,
} from "@/lib/squareConfig";
import {
  OctoVerifiedPaymentEvidence,
  OctoVerifiedRefundEvidence,
  PaymentEvidenceProvenanceSource,
} from "@/lib/octo/types";
import { OctoApiError } from "@/lib/octo/adapters/base";
import {
  DccPaymentStatus,
  DccRefundStatus,
  DccExpectedFinancialObligation,
  DccPaymentResult,
  DccProcessPaymentParams,
  DccOrderPaymentRecord,
  DccRefundParams,
  DccRefundRecord,
  DccChargebackParams,
} from "./types";

const fallbackPaymentStore = new Map<string, DccOrderPaymentRecord>();
const fallbackRefundStore = new Map<string, DccRefundRecord>();
const paymentObligationAllocations = new Map<string, Map<string, number>>();
const refundObligationAllocations = new Map<string, string>();

async function maybeTriggerBetweenAllocationWritesHook(): Promise<void> {
  if (process.env.DCC_TEST_PAUSE_BETWEEN_ALLOCATION_WRITES === "1") {
    process.stdout.write("DCC_ALLOC_TX_AFTER_FIRST_WRITE\n");
    await new Promise((resolve) => setTimeout(resolve, 30_000));
  } else if (process.env.DCC_TEST_CRASH_BETWEEN_ALLOCATION_WRITES === "1") {
    process.stdout.write("DCC_ALLOC_TX_AFTER_FIRST_WRITE\n");
    process.kill(process.pid, "SIGKILL");
  }
}

/**
 * Strictly maps a provider (Square) payment status to DCC's internal payment status.
 * Missing, empty, non-string, or unfamiliar statuses MUST remain "unresolved" and NEVER default to "captured".
 */
export function mapSquarePaymentStatusToDccStatus(rawStatus: unknown): DccPaymentStatus {
  if (typeof rawStatus !== "string" || !rawStatus.trim()) {
    return "unresolved";
  }
  const normalized = rawStatus.trim().toUpperCase();
  switch (normalized) {
    case "COMPLETED":
      return "captured";
    case "APPROVED":
      return "authorized";
    case "PENDING":
      return "pending";
    case "CANCELED":
    case "CANCELLED":
      return "cancelled";
    case "FAILED":
      return "failed";
    default:
      return "unresolved";
  }
}

/**
 * Strictly maps a provider (Square) refund status to DCC's internal refund status.
 * Missing, empty, non-string, or unfamiliar statuses MUST remain "unresolved" and NEVER default to "processed".
 */
export function mapSquareRefundStatusToDccStatus(rawStatus: unknown): DccRefundStatus {
  if (typeof rawStatus !== "string" || !rawStatus.trim()) {
    return "unresolved";
  }
  const normalized = rawStatus.trim().toUpperCase();
  switch (normalized) {
    case "COMPLETED":
      return "processed";
    case "PENDING":
      return "pending";
    case "FAILED":
    case "REJECTED":
    case "CANCELED":
    case "CANCELLED":
      return "failed";
    default:
      return "unresolved";
  }
}

function isExplicitPaymentTestSimulation(options?: {
  allowTestSimulation?: boolean;
  simulateCapture?: boolean;
}): boolean {
  return Boolean(
    options?.allowTestSimulation ||
      options?.simulateCapture ||
      process.env.DCC_PAYMENT_SIMULATION_MODE === "explicit_test"
  );
}

function encodePaymentProvenanceMeta(meta: {
  method?: string;
  provenanceSource: PaymentEvidenceProvenanceSource;
  providerPaymentId?: string;
  providerStatus?: string;
  webhookEventId?: string;
}): string {
  return JSON.stringify(meta);
}

function decodePaymentProvenanceMeta(raw: string | null | undefined): {
  method?: string;
  provenanceSource?: PaymentEvidenceProvenanceSource;
  providerPaymentId?: string;
  providerStatus?: string;
  webhookEventId?: string;
} {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {}
  return { method: raw };
}

function encodeRefundReasonMeta(meta: {
  reason: string;
  provenanceSource: PaymentEvidenceProvenanceSource;
  providerStatus?: string;
  webhookEventId?: string;
}): string {
  return JSON.stringify(meta);
}

function decodeRefundReasonMeta(raw: string | null | undefined): {
  reason?: string;
  provenanceSource?: PaymentEvidenceProvenanceSource;
  providerStatus?: string;
  webhookEventId?: string;
} {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "provenanceSource" in parsed) {
      return parsed;
    }
  } catch {}
  return { reason: raw };
}

function normalizeObligationInput(
  expectedObligation?: DccExpectedFinancialObligation | string | null,
  evidence?: { orderId?: string; bookingId?: string } | null
): DccExpectedFinancialObligation {
  if (typeof expectedObligation === "string" && expectedObligation.trim()) {
    const trimmed = expectedObligation.trim();
    return {
      bookingId: trimmed,
      bookingUuid: trimmed,
      orderId: trimmed,
      orderItemId: trimmed,
      ledgerId: trimmed,
    };
  }
  const obj =
    expectedObligation && typeof expectedObligation === "object" ? expectedObligation : {};
  const bookingId = obj.bookingId?.trim() || evidence?.bookingId?.trim() || undefined;
  const bookingUuid = obj.bookingUuid?.trim() || undefined;
  const orderId = obj.orderId?.trim() || evidence?.orderId?.trim() || undefined;
  const orderItemId = obj.orderItemId?.trim() || undefined;
  const ledgerId = obj.ledgerId?.trim() || undefined;
  return {
    bookingId,
    bookingUuid,
    orderId,
    orderItemId,
    ledgerId,
  };
}

async function resolveObligationContext(
  obligation: DccExpectedFinancialObligation,
  targetDb?: DccDb | null
): Promise<{
  hasIdentity: boolean;
  canonicalBookingId?: string;
  linkedOrderIds: Set<string>;
  candidateIds: Set<string>;
}> {
  const candidateIds = new Set<string>();
  const linkedOrderIds = new Set<string>();
  let canonicalBookingId = obligation.bookingId;

  for (const val of [
    obligation.bookingId,
    obligation.bookingUuid,
    obligation.orderId,
    obligation.orderItemId,
    obligation.ledgerId,
  ]) {
    if (val && val.trim()) {
      candidateIds.add(val.trim());
    }
  }

  if (obligation.orderId) {
    linkedOrderIds.add(obligation.orderId);
  }

  if (obligation.ledgerId && obligation.ledgerId.startsWith("dcc:ledg:")) {
    const derivedBk = `dcc:bk:${obligation.ledgerId.replace(/^dcc:ledg:/, "")}`;
    candidateIds.add(derivedBk);
    if (!canonicalBookingId) {
      canonicalBookingId = derivedBk;
    }
  }

  if (canonicalBookingId && canonicalBookingId.startsWith("dcc:bk:")) {
    candidateIds.add(`dcc:ledg:${canonicalBookingId.replace(/^dcc:bk:/, "")}`);
  }

  const db = targetDb !== undefined ? targetDb : getDb();
  if (db && candidateIds.size > 0) {
    try {
      for (const cid of Array.from(candidateIds)) {
        const bkRows = await db
          .select()
          .from(octoBookings)
          .where(or(eq(octoBookings.id, cid), eq(octoBookings.bookingUuid, cid)));
        for (const b of bkRows) {
          candidateIds.add(b.id);
          candidateIds.add(b.bookingUuid);
          if (!canonicalBookingId || !canonicalBookingId.startsWith("dcc:bk:")) {
            canonicalBookingId = b.id;
          }
          const metaOrderId = (b.contact as any)?.__dccMeta?.orderId;
          if (typeof metaOrderId === "string" && metaOrderId.trim()) {
            linkedOrderIds.add(metaOrderId.trim());
          }
        }

        const itemRows = await db
          .select()
          .from(dccOrderItems)
          .where(
            or(
              eq(dccOrderItems.id, cid),
              eq(dccOrderItems.bookingId, cid),
              eq(dccOrderItems.bookingUuid, cid)
            )
          );
        for (const it of itemRows) {
          if (it.orderId) linkedOrderIds.add(it.orderId);
          if (it.bookingId) {
            candidateIds.add(it.bookingId);
            if (!canonicalBookingId || !canonicalBookingId.startsWith("dcc:bk:")) {
              canonicalBookingId = it.bookingId;
            }
          }
          if (it.bookingUuid) candidateIds.add(it.bookingUuid);
        }

        const sbRows = await db
          .select()
          .from(dccSupplierBookings)
          .where(
            or(
              eq(dccSupplierBookings.id, cid),
              eq(dccSupplierBookings.providerBookingUuid, cid),
              eq(dccSupplierBookings.orderItemId, cid)
            )
          );
        for (const sb of sbRows) {
          if (sb.orderId) linkedOrderIds.add(sb.orderId);
          if (sb.providerBookingUuid) candidateIds.add(sb.providerBookingUuid);
        }

        const payableRows = await db
          .select()
          .from(dccOperatorPayables)
          .where(
            or(
              eq(dccOperatorPayables.bookingId, cid),
              eq(dccOperatorPayables.orderItemId, cid)
            )
          );
        for (const p of payableRows) {
          if (p.orderId) linkedOrderIds.add(p.orderId);
          if (p.bookingId) {
            candidateIds.add(p.bookingId);
            if (!canonicalBookingId || !canonicalBookingId.startsWith("dcc:bk:")) {
              canonicalBookingId = p.bookingId;
            }
          }
        }
      }
    } catch (err: any) {
      if (err instanceof OctoApiError) throw err;
      throw new OctoApiError(
        503,
        "PAYMENT_ALLOCATION_PERSISTENCE_FAILED",
        `Database error while resolving financial obligation identity: ${err.message}`
      );
    }
  }

  return {
    hasIdentity: candidateIds.size > 0,
    canonicalBookingId:
      canonicalBookingId ||
      obligation.bookingUuid ||
      obligation.orderItemId ||
      obligation.ledgerId ||
      obligation.orderId,
    linkedOrderIds,
    candidateIds,
  };
}

/**
 * Executes all payment allocation mutations—including hydration/reductions from `octo_settlement_ledger`,
 * parent-order placeholder release, individual obligation allocation writes (increases or reductions),
 * refund-driven allocation adjustments, and the `__PAYMENT_TOTAL__` sentinel update—inside a SINGLE
 * database transaction (`txDb`) while holding the per-payment database lock.
 */
async function executeTransactionalPaymentAllocationSync(
  txDb: DccDb,
  params: {
    record: DccOrderPaymentRecord;
    netAvailableCapturedCents: number;
    targetObligation?: {
      obligationKey: string;
      candidateIds: Set<string>;
      requiredAllocationCents: number;
    };
    refundAdjustment?: {
      bookingId?: string;
      orderItemId?: string;
      refundAmountCents: number;
    };
  }
): Promise<{
  targetObligationKey?: string;
  previousObligationCents: number;
  newObligationCents: number;
  totalAllocatedCents: number;
  obligationMapDollars: Map<string, number>;
}> {
  const { record, netAvailableCapturedCents } = params;
  const netAvailableCaptured = netAvailableCapturedCents / 100;

  // 1. Ensure sentinel budget row exists for this payment inside the transaction
  await txDb
    .insert(dccPaymentAllocations)
    .values({
      id: `alloc_total:${record.id}`,
      paymentId: record.id,
      orderId: record.orderId,
      obligationKey: "__PAYMENT_TOTAL__",
      allocatedAmountCents: 0,
      currency: record.currency,
    })
    .onConflictDoNothing();

  // 2. Acquire row-level FOR UPDATE lock on all allocation rows for this payment in PostgreSQL
  if (hasConfiguredDatabaseUrl()) {
    await txDb.execute(
      sql`SELECT id, obligation_key, allocated_amount_cents FROM dcc_payment_allocations WHERE payment_id = ${record.id} FOR UPDATE`
    );
  }

  // 3. Load existing durable allocations for this payment inside the transaction
  const existingAllocRows = await txDb
    .select()
    .from(dccPaymentAllocations)
    .where(eq(dccPaymentAllocations.paymentId, record.id));
  const existingObligationMap = new Map<string, number>();
  for (const row of existingAllocRows) {
    if (row.obligationKey !== "__PAYMENT_TOTAL__") {
      existingObligationMap.set(row.obligationKey, Number(row.allocatedAmountCents || 0));
    }
  }

  // 4. Synchronize any unrecorded allocations or refund reductions from octoSettlementLedger
  const ledgerRows = await txDb.select().from(octoSettlementLedger);
  for (const lr of ledgerRows) {
    const meta = (lr.metadata || {}) as Record<string, any>;
    const ev = meta.verifiedPaymentEvidence;
    if (
      !ev ||
      (ev.transactionId !== record.id &&
        ev.providerRecordId !== record.id &&
        ev.transactionId !== record.providerPaymentId)
    ) {
      continue;
    }
    const isActiveCapture =
      (lr.paymentStatus === "captured" || lr.paymentStatus === "partially_refunded") &&
      lr.cancellationStatus !== "cancelled_full_refund";
    const allocatedAmt = Number(meta.capturedAmount ?? lr.grossAmount ?? 0);
    const refundedAmt = Number(meta.refundedAmount ?? 0);
    const ledgerNetCents = isActiveCapture
      ? Math.max(0, Math.round((allocatedAmt - refundedAmt) * 100))
      : 0;

    const currentRecordedCents = existingObligationMap.get(lr.bookingId);
    const isExplicitlyTargeted =
      params.targetObligation &&
      (params.targetObligation.obligationKey === lr.bookingId ||
        params.targetObligation.candidateIds.has(lr.bookingId));

    if (currentRecordedCents === undefined && ledgerNetCents > 0 && !isExplicitlyTargeted) {
      await txDb
        .insert(dccPaymentAllocations)
        .values({
          id: `alloc:${record.id}:${lr.bookingId}`,
          paymentId: record.id,
          orderId: record.orderId,
          obligationKey: lr.bookingId,
          allocatedAmountCents: ledgerNetCents,
          currency: record.currency,
        })
        .onConflictDoUpdate({
          target: dccPaymentAllocations.id,
          set: {
            allocatedAmountCents: ledgerNetCents,
            updatedAt: new Date(),
          },
        });
      existingObligationMap.set(lr.bookingId, ledgerNetCents);
    } else if (
      currentRecordedCents !== undefined &&
      ledgerNetCents < currentRecordedCents &&
      !isExplicitlyTargeted
    ) {
      await txDb
        .update(dccPaymentAllocations)
        .set({
          allocatedAmountCents: ledgerNetCents,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(dccPaymentAllocations.paymentId, record.id),
            eq(dccPaymentAllocations.obligationKey, lr.bookingId)
          )
        );
      existingObligationMap.set(lr.bookingId, ledgerNetCents);
    }
  }

  let resolvedTargetKey: string | undefined;
  let previousObligationCents = 0;
  let newObligationCents = 0;

  // 5. Target obligation allocation change (increase, reduction, or initial write)
  if (params.targetObligation) {
    const { obligationKey, candidateIds, requiredAllocationCents } = params.targetObligation;

    // Release parent order container placeholder if allocating a child booking item
    if (obligationKey !== record.orderId && existingObligationMap.has(record.orderId)) {
      await txDb
        .delete(dccPaymentAllocations)
        .where(
          and(
            eq(dccPaymentAllocations.paymentId, record.id),
            eq(dccPaymentAllocations.obligationKey, record.orderId)
          )
        );
      existingObligationMap.delete(record.orderId);
    }

    const matchedExistingKey = existingObligationMap.has(obligationKey)
      ? obligationKey
      : Array.from(candidateIds).find(
          (cid) => cid !== record.orderId && existingObligationMap.has(cid)
        );
    resolvedTargetKey = matchedExistingKey || obligationKey;
    previousObligationCents = matchedExistingKey
      ? existingObligationMap.get(matchedExistingKey)!
      : 0;
    newObligationCents = Math.max(0, requiredAllocationCents);

    // Write 1: Individual obligation row upsert inside the transaction
    await txDb
      .insert(dccPaymentAllocations)
      .values({
        id: `alloc:${record.id}:${resolvedTargetKey}`,
        paymentId: record.id,
        orderId: record.orderId,
        obligationKey: resolvedTargetKey,
        allocatedAmountCents: newObligationCents,
        currency: record.currency,
      })
      .onConflictDoUpdate({
        target: dccPaymentAllocations.id,
        set: {
          allocatedAmountCents: newObligationCents,
          updatedAt: new Date(),
        },
      });
    existingObligationMap.set(resolvedTargetKey, newObligationCents);
  }

  // 6. Refund-driven allocation adjustment inside the same transaction
  if (params.refundAdjustment && params.refundAdjustment.refundAmountCents > 0) {
    const { bookingId, orderItemId, refundAmountCents } = params.refundAdjustment;
    let refundTargetKey =
      bookingId && existingObligationMap.has(bookingId) ? bookingId : undefined;
    if (!refundTargetKey && (bookingId || orderItemId)) {
      const ctx = await resolveObligationContext({ bookingId, orderItemId }, txDb);
      refundTargetKey = Array.from(ctx.candidateIds).find((cid) =>
        existingObligationMap.has(cid)
      );
    }

    if (refundTargetKey && existingObligationMap.has(refundTargetKey)) {
      const prevCents = existingObligationMap.get(refundTargetKey)!;
      const reducedCents = Math.max(0, prevCents - refundAmountCents);
      resolvedTargetKey = refundTargetKey;
      previousObligationCents = prevCents;
      newObligationCents = reducedCents;
      await txDb
        .update(dccPaymentAllocations)
        .set({
          allocatedAmountCents: reducedCents,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(dccPaymentAllocations.paymentId, record.id),
            eq(dccPaymentAllocations.obligationKey, refundTargetKey)
          )
        );
      existingObligationMap.set(refundTargetKey, reducedCents);
    }

    // Ensure total allocations after refund do not exceed netAvailableCapturedCents
    let sumAfterRefund = Array.from(existingObligationMap.values()).reduce(
      (sum, c) => sum + c,
      0
    );
    if (sumAfterRefund > netAvailableCapturedCents) {
      let excessCents = sumAfterRefund - netAvailableCapturedCents;
      const orderedKeys = [
        ...(existingObligationMap.has(record.orderId) ? [record.orderId] : []),
        ...Array.from(existingObligationMap.keys()).filter((k) => k !== record.orderId),
      ];
      for (const k of orderedKeys) {
        if (excessCents <= 0) break;
        const cur = existingObligationMap.get(k) || 0;
        if (cur <= 0) continue;
        const cut = Math.min(cur, excessCents);
        const updatedCents = cur - cut;
        excessCents -= cut;
        await txDb
          .update(dccPaymentAllocations)
          .set({
            allocatedAmountCents: updatedCents,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(dccPaymentAllocations.paymentId, record.id),
              eq(dccPaymentAllocations.obligationKey, k)
            )
          );
        existingObligationMap.set(k, updatedCents);
      }
    }
  }

  // 7. Deterministic crash-between-writes test hook (after individual obligation write(s), before __PAYMENT_TOTAL__ write and COMMIT)
  await maybeTriggerBetweenAllocationWritesHook();

  // 8. Recompute authoritative total from individual obligation rows and enforce budget ceiling
  const totalAllocatedCents = Array.from(existingObligationMap.values()).reduce(
    (sum, c) => sum + c,
    0
  );
  if (totalAllocatedCents > netAvailableCapturedCents) {
    const allocatedToOtherDollars =
      Math.max(0, totalAllocatedCents - newObligationCents) / 100;
    throw new OctoApiError(
      422,
      "PAYMENT_OVERALLOCATED",
      `Payment '${record.id}' has $${netAvailableCaptured.toFixed(2)} net captured balance, with $${allocatedToOtherDollars.toFixed(2)} already allocated to other obligations; cannot allocate an additional $${(newObligationCents / 100).toFixed(2)} to '${resolvedTargetKey || record.orderId}'.`
    );
  }

  // 9. Write 2: Update __PAYMENT_TOTAL__ sentinel row in the same transaction
  await txDb
    .update(dccPaymentAllocations)
    .set({
      allocatedAmountCents: totalAllocatedCents,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(dccPaymentAllocations.paymentId, record.id),
        eq(dccPaymentAllocations.obligationKey, "__PAYMENT_TOTAL__")
      )
    );

  const obligationMapDollars = new Map<string, number>();
  for (const [k, cents] of existingObligationMap.entries()) {
    obligationMapDollars.set(k, cents / 100);
  }

  return {
    targetObligationKey: resolvedTargetKey,
    previousObligationCents,
    newObligationCents,
    totalAllocatedCents,
    obligationMapDollars,
  };
}

export class DccPaymentService {
  static clearInMemoryStoresForProcessRestartSimulation(): void {
    fallbackPaymentStore.clear();
    fallbackRefundStore.clear();
    paymentObligationAllocations.clear();
    refundObligationAllocations.clear();
  }

  /**
   * Process or record payment for a master DCC order (one payment per master DCC Order).
   * Outside explicit test simulation (`options.allowTestSimulation` / `DCC_PAYMENT_SIMULATION_MODE=explicit_test`),
   * requires a valid `sourceId`, valid provider configuration (`SQUARE_ACCESS_TOKEN` & `SQUARE_LOCATION_ID_DCC`),
   * and an authoritative provider response (never falling back to a generated `sq_pay_...` ID).
   */
  static async processPayment(params: DccProcessPaymentParams): Promise<DccPaymentResult> {
    const requestedStatus = params.paymentInfo?.status || "captured";
    const explicitSim = isExplicitPaymentTestSimulation(params.options);

    // 1. Idempotency / Two-phase capture check:
    const existingPayment = await this.getPaymentByOrderId(params.orderId);
    if (existingPayment) {
      if (
        existingPayment.status === "captured" ||
        (existingPayment.status === "authorized" && requestedStatus === "authorized")
      ) {
        return {
          success: true,
          paymentId: existingPayment.id,
          status: existingPayment.status,
          providerStatus: existingPayment.providerStatus,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          processedAt: existingPayment.updatedAt,
          provider: existingPayment.paymentProvider,
          provenanceSource: existingPayment.provenanceSource,
          webhookEventId: existingPayment.webhookEventId,
        };
      }

      // Two-phase transition from "authorized" -> "captured": MUST inspect the completion response!
      if (existingPayment.status === "authorized" && requestedStatus === "captured") {
        if (params.options?.simulateFailure) {
          throw new Error("Square payment failed: Simulated payment gateway decline");
        }
        const token = getSquareAccessToken();
        if (!explicitSim && !params.options?.squareClient && !token) {
          throw new OctoApiError(
            503,
            "MISSING_PAYMENT_PROVIDER_CONFIG",
            "Missing SQUARE_ACCESS_TOKEN required to capture authorized payment outside explicit test simulation"
          );
        }

        const hasProviderClient = Boolean(
          params.options?.squareClient ||
            (token && existingPayment.provenanceSource !== "explicit_test_simulation")
        );

        let completedStatus: DccPaymentStatus = "captured";
        let rawCompletionStatus: string | undefined = "COMPLETED";
        let nextProvenance: PaymentEvidenceProvenanceSource =
          existingPayment.provenanceSource || "explicit_test_simulation";

        if (hasProviderClient && (existingPayment.providerPaymentId || existingPayment.id)) {
          try {
            const client =
              params.options?.squareClient ||
              new SquareClient({
                token,
                environment:
                  getSquareEnvironment() === "production"
                    ? SquareEnvironment.Production
                    : SquareEnvironment.Sandbox,
              });
            if (typeof client.payments?.complete !== "function") {
              completedStatus = "unresolved";
              rawCompletionStatus = undefined;
            } else {
              const completeRes = await client.payments.complete({
                paymentId: existingPayment.providerPaymentId || existingPayment.id,
              });
              const rawStatus = completeRes?.payment?.status;
              rawCompletionStatus = typeof rawStatus === "string" ? rawStatus : undefined;
              completedStatus = mapSquarePaymentStatusToDccStatus(rawStatus);
              nextProvenance = "provider_api_response";
            }
          } catch (err: any) {
            if (!explicitSim || params.options?.squareClient) {
              if (err instanceof OctoApiError) throw err;
              throw new OctoApiError(
                502,
                "PAYMENT_PROVIDER_ERROR",
                `Square payment completion failed: ${err.message}`
              );
            }
          }
        }

        await this.updatePaymentStatus(params.orderId, completedStatus, {
          provenanceSource: nextProvenance,
          providerStatus: rawCompletionStatus,
        });
        const updated = (await this.getPaymentByOrderId(params.orderId)) || existingPayment;
        return {
          success: completedStatus === "captured",
          paymentId: updated.id,
          status: completedStatus,
          providerStatus: rawCompletionStatus,
          amount: updated.amount,
          currency: updated.currency,
          processedAt: updated.updatedAt,
          provider: updated.paymentProvider,
          provenanceSource: updated.provenanceSource,
          webhookEventId: updated.webhookEventId,
        };
      }
    }

    if (params.options?.simulateFailure) {
      throw new Error("Square payment failed: Simulated payment gateway decline");
    }

    if (isSquareProduction()) {
      assertValidDccSquareProductionConfig();
    }

    const provider = params.paymentInfo?.provider || "square";
    const now = new Date().toISOString();
    const sourceId =
      params.sourceId ||
      (params.paymentInfo as any)?.sourceId ||
      (params.options?.squareClient ? "cnon:card-nonce-ok" : undefined);
    const token = getSquareAccessToken();
    const locationId = getSquareLocationIdDcc();

    if (!explicitSim) {
      if (params.paymentInfo?.paymentId && !params.sourceId && !(params.paymentInfo as any)?.sourceId && !params.options?.squareClient) {
        throw new OctoApiError(
          422,
          "UNVERIFIED_CALLER_PAYMENT_STATUS",
          `Caller-supplied paymentId '${params.paymentInfo.paymentId}' or captured status without a real provider sourceId is rejected outside explicit test simulation.`
        );
      }
      if (!sourceId || !String(sourceId).trim()) {
        throw new OctoApiError(
          422,
          "MISSING_PAYMENT_SOURCE",
          "Missing payment sourceId. Outside explicit test simulation, payment processing must fail closed when source information is missing."
        );
      }
      if (!params.options?.squareClient && (!token || !locationId)) {
        throw new OctoApiError(
          503,
          "MISSING_PAYMENT_PROVIDER_CONFIG",
          "Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID_DCC configuration. Payment processing must fail closed when provider configuration is missing."
        );
      }
    }

    let paymentId = "";
    let providerPaymentId = "";
    let status: DccPaymentStatus = requestedStatus;
    let rawProviderStatus: string | undefined;
    let provenanceSource: PaymentEvidenceProvenanceSource = "explicit_test_simulation";

    if (
      sourceId &&
      (params.options?.squareClient || (token && locationId)) &&
      (!params.paymentInfo?.paymentId || params.options?.squareClient)
    ) {
      try {
        const client =
          params.options?.squareClient ||
          new SquareClient({
            token,
            environment:
              getSquareEnvironment() === "production"
                ? SquareEnvironment.Production
                : SquareEnvironment.Sandbox,
          });

        const amountCents = Math.round(params.amount * 100);
        const sqResponse = await client.payments.create({
          sourceId,
          idempotencyKey: params.idempotencyKey || `sq_idem_${params.orderId}_${Date.now()}`,
          locationId: locationId || "loc_sim_default",
          amountMoney: {
            amount: BigInt(amountCents),
            currency: params.currency || "USD",
          },
          autocomplete: requestedStatus === "captured",
          referenceId: params.orderId,
          note: `DCC Master Order ${params.orderId}`,
        });

        const returnedId = sqResponse?.payment?.id;
        if (!returnedId) {
          throw new OctoApiError(
            502,
            "PAYMENT_PROVIDER_INVALID_RESPONSE",
            "Square payments.create did not return a payment.id"
          );
        }

        const rawStatus = sqResponse?.payment?.status;
        rawProviderStatus = typeof rawStatus === "string" ? rawStatus : undefined;
        const mappedStatus = mapSquarePaymentStatusToDccStatus(rawStatus);

        if (mappedStatus === "failed" || mappedStatus === "cancelled") {
          throw new OctoApiError(
            422,
            "PAYMENT_PROVIDER_DECLINED",
            `Square payment returned non-capturable status '${rawProviderStatus || mappedStatus}'`
          );
        }

        paymentId = returnedId;
        providerPaymentId = returnedId;
        status = mappedStatus;
        provenanceSource = "provider_api_response";
      } catch (err: any) {
        if (
          !explicitSim ||
          params.options?.squareClient ||
          process.env.NODE_ENV === "production" ||
          params.options?.simulateFailure
        ) {
          if (err instanceof OctoApiError) throw err;
          throw new OctoApiError(
            502,
            "PAYMENT_PROVIDER_ERROR",
            `Square payment failed: ${err.message}`
          );
        }
        paymentId = `sq_pay_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
        providerPaymentId = paymentId;
        status = requestedStatus === "authorized" ? "authorized" : "captured";
        provenanceSource = "explicit_test_simulation";
      }
    } else if (explicitSim) {
      paymentId =
        params.paymentInfo?.paymentId ||
        `sq_pay_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
      providerPaymentId = params.paymentInfo?.paymentIntentId || paymentId;
      status = requestedStatus;
      provenanceSource = "explicit_test_simulation";
    } else {
      throw new OctoApiError(
        422,
        "UNVERIFIED_CALLER_PAYMENT_STATUS",
        "Cannot record payment without an authoritative provider response or explicit test simulation."
      );
    }

    const paymentRecord: DccOrderPaymentRecord = {
      id: paymentId,
      orderId: params.orderId,
      paymentProvider: provider,
      providerPaymentId,
      providerStatus: rawProviderStatus,
      amount: params.amount,
      currency: params.currency || "USD",
      status,
      provenanceSource,
      rawMetadata: {
        customerEmail: params.customer?.emailAddress,
        customerName: params.customer?.fullName,
        provenanceSource,
        providerPaymentId,
        providerStatus: rawProviderStatus,
      },
      createdAt: now,
      updatedAt: now,
    };

    const db = getDb();
    if (db) {
      try {
        await db.insert(dccOrderPayments).values({
          id: paymentRecord.id,
          orderId: paymentRecord.orderId,
          provider: paymentRecord.paymentProvider,
          amount: paymentRecord.amount.toFixed(2),
          currency: paymentRecord.currency,
          status: paymentRecord.status,
          paymentMethod: encodePaymentProvenanceMeta({
            method: provider,
            provenanceSource,
            providerPaymentId,
            providerStatus: rawProviderStatus,
          }),
          customerEmail: params.customer?.emailAddress,
        });

        await db.insert(octoAuditLogs).values({
          action: "ORDER_PAYMENT_PROCESSED",
          entityType: "ORDER_PAYMENT",
          entityId: paymentRecord.id,
          status: "SUCCESS",
          payload: {
            orderId: paymentRecord.orderId,
            amount: paymentRecord.amount,
            status: paymentRecord.status,
            providerStatus: rawProviderStatus || null,
            provider,
            provenanceSource,
          },
        });
      } catch (err: any) {
        throw new OctoApiError(
          503,
          "PAYMENT_PERSISTENCE_FAILED",
          `Failed to persist order payment ${paymentRecord.id} to database: ${err.message}`
        );
      }
    }

    fallbackPaymentStore.set(params.orderId, paymentRecord);
    fallbackPaymentStore.set(paymentId, paymentRecord);

    const isSuccess =
      requestedStatus === "authorized"
        ? status === "authorized" || status === "captured"
        : status === "captured";

    return {
      success: isSuccess,
      paymentId,
      status,
      providerStatus: rawProviderStatus,
      amount: params.amount,
      currency: params.currency || "USD",
      processedAt: now,
      provider,
      provenanceSource,
    };
  }

  /**
   * Records or updates an authoritative payment capture from an authenticated Square webhook event.
   */
  static async recordWebhookPaymentCapture(params: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    webhookEventId: string;
    provenanceSource?: PaymentEvidenceProvenanceSource;
    rawProviderStatus?: unknown;
  }): Promise<OctoVerifiedPaymentEvidence> {
    if (!params.webhookEventId || !params.webhookEventId.trim()) {
      throw new OctoApiError(
        422,
        "MISSING_WEBHOOK_EVENT_ID",
        "Webhook payment capture requires an authenticated webhookEventId"
      );
    }
    const mappedStatus =
      params.rawProviderStatus !== undefined
        ? mapSquarePaymentStatusToDccStatus(params.rawProviderStatus)
        : "captured";
    if (mappedStatus !== "captured") {
      throw new OctoApiError(
        422,
        "UNCAPTUREABLE_WEBHOOK_PAYMENT_STATUS",
        `Webhook payment '${params.paymentId}' has status '${String(params.rawProviderStatus)}' (mapped to '${mappedStatus}'), not 'COMPLETED'.`
      );
    }

    const provenanceSource: PaymentEvidenceProvenanceSource =
      params.provenanceSource || "authenticated_webhook";
    const now = new Date().toISOString();
    const existing =
      (await this.getPaymentById(params.paymentId)) ||
      (await this.getPaymentByOrderId(params.orderId));

    const db = getDb();
    if (existing) {
      existing.status = "captured";
      existing.providerStatus = "COMPLETED";
      existing.provenanceSource = provenanceSource;
      existing.webhookEventId = params.webhookEventId;
      existing.updatedAt = now;
      if (db) {
        try {
          await db
            .update(dccOrderPayments)
            .set({
              status: "captured",
              paymentMethod: encodePaymentProvenanceMeta({
                method: existing.paymentProvider,
                provenanceSource,
                providerPaymentId: existing.providerPaymentId || existing.id,
                providerStatus: "COMPLETED",
                webhookEventId: params.webhookEventId,
              }),
              updatedAt: new Date(),
            })
            .where(eq(dccOrderPayments.id, existing.id));
        } catch (err: any) {
          throw new OctoApiError(
            503,
            "PAYMENT_PERSISTENCE_FAILED",
            `Failed to update webhook payment capture ${existing.id}: ${err.message}`
          );
        }
      }
      fallbackPaymentStore.set(existing.orderId, existing);
      fallbackPaymentStore.set(existing.id, existing);
    } else {
      const record: DccOrderPaymentRecord = {
        id: params.paymentId,
        orderId: params.orderId,
        paymentProvider: "square",
        providerPaymentId: params.paymentId,
        providerStatus: "COMPLETED",
        amount: params.amount,
        currency: params.currency || "USD",
        status: "captured",
        provenanceSource,
        webhookEventId: params.webhookEventId,
        createdAt: now,
        updatedAt: now,
      };
      if (db) {
        try {
          await db.insert(dccOrderPayments).values({
            id: record.id,
            orderId: record.orderId,
            provider: "square",
            amount: record.amount.toFixed(2),
            currency: record.currency,
            status: "captured",
            paymentMethod: encodePaymentProvenanceMeta({
              method: "square",
              provenanceSource,
              providerPaymentId: record.id,
              providerStatus: "COMPLETED",
              webhookEventId: params.webhookEventId,
            }),
          });
        } catch (err: any) {
          throw new OctoApiError(
            503,
            "PAYMENT_PERSISTENCE_FAILED",
            `Failed to insert webhook payment capture ${record.id}: ${err.message}`
          );
        }
      }
      fallbackPaymentStore.set(record.orderId, record);
      fallbackPaymentStore.set(record.id, record);
    }

    return {
      verified: true,
      provider: "square",
      transactionId: existing?.id || params.paymentId,
      capturedAmount: existing?.amount ?? params.amount,
      currency: existing?.currency || params.currency || "USD",
      capturedAt: now,
      provenanceSource,
      providerRecordId: existing?.id || params.paymentId,
      webhookEventId: params.webhookEventId,
      orderId: existing?.orderId || params.orderId,
    };
  }

  /**
   * Verifies that a supplied `OctoVerifiedPaymentEvidence` object is:
   * 1. Traced to an authoritative recorded payment in `DccPaymentService` with status `"captured"` or `"partially_refunded"` (never `"refunded"`, `"authorized"`, `"pending"`, or `"unresolved"`).
   * 2. Bound to the expected financial obligation (`bookingId` / `orderId`), preventing reuse of unrelated payments.
   * 3. Atomically and durably reserved against net unrefunded captured funds (`dcc_payment_allocations`), failing closed on over-allocation (`422 PAYMENT_OVERALLOCATED`) or database read/write errors (`503 PAYMENT_ALLOCATION_PERSISTENCE_FAILED`).
   */
  static async assertTraceablePaymentEvidence(
    evidence: OctoVerifiedPaymentEvidence | null | undefined,
    expectedAmount?: number,
    expectedCurrencyOrObligation?: string | DccExpectedFinancialObligation | null,
    expectedObligationArg?: DccExpectedFinancialObligation | string | null
  ): Promise<OctoVerifiedPaymentEvidence> {
    if (
      !evidence ||
      evidence.verified !== true ||
      typeof evidence.provider !== "string" ||
      !evidence.provider.trim() ||
      typeof evidence.transactionId !== "string" ||
      !evidence.transactionId.trim() ||
      typeof evidence.capturedAmount !== "number" ||
      !Number.isFinite(evidence.capturedAmount) ||
      (evidence.capturedAmount <= 0 &&
        !(typeof expectedAmount === "number" && Number.isFinite(expectedAmount) && expectedAmount >= 0 && evidence.capturedAmount >= 0)) ||
      typeof evidence.currency !== "string" ||
      !evidence.currency.trim() ||
      typeof evidence.capturedAt !== "string" ||
      Number.isNaN(Date.parse(evidence.capturedAt))
    ) {
      throw new OctoApiError(
        422,
        "INVALID_VERIFIED_PAYMENT_EVIDENCE",
        "Payment evidence is incomplete or malformed."
      );
    }

    let expectedCurrency: string | undefined;
    let expectedObligation: DccExpectedFinancialObligation | string | undefined;
    if (
      typeof expectedCurrencyOrObligation === "object" &&
      expectedCurrencyOrObligation !== null
    ) {
      expectedObligation = expectedCurrencyOrObligation;
      expectedCurrency =
        typeof expectedObligationArg === "string" ? expectedObligationArg : undefined;
    } else if (typeof expectedCurrencyOrObligation === "string") {
      if (expectedObligationArg !== undefined && expectedObligationArg !== null) {
        expectedCurrency = expectedCurrencyOrObligation;
        expectedObligation = expectedObligationArg;
      } else if (/^[A-Z]{3}$/i.test(expectedCurrencyOrObligation.trim())) {
        expectedCurrency = expectedCurrencyOrObligation;
        expectedObligation = undefined;
      } else {
        expectedObligation = expectedCurrencyOrObligation;
      }
    } else if (expectedObligationArg !== undefined && expectedObligationArg !== null) {
      expectedObligation = expectedObligationArg;
    }

    const txKey = evidence.transactionId.trim();
    return withPaymentAllocationTransaction(txKey, async (txDb) => {
      try {
        const normalizedObligation = normalizeObligationInput(expectedObligation, evidence);
        const obligationCtx = await resolveObligationContext(normalizedObligation, txDb);
        if (!obligationCtx.hasIdentity) {
          throw new OctoApiError(
            422,
            "MISSING_PAYMENT_OBLIGATION_IDENTITY",
            "Payment evidence verification requires an expected bookingId or orderId to bind the payment to a specific financial obligation."
          );
        }

        const explicitSim = isExplicitPaymentTestSimulation();
        const record = await this.getPaymentById(txKey, txDb);
        if (!record) {
          if (explicitSim && evidence.provenanceSource === "explicit_test_simulation") {
            return {
              ...evidence,
              orderId: normalizedObligation.orderId || normalizedObligation.bookingId,
              bookingId: obligationCtx.canonicalBookingId,
            };
          }
          throw new OctoApiError(
            422,
            "UNTRACEABLE_PAYMENT_EVIDENCE",
            `Payment transactionId '${evidence.transactionId}' is not backed by any recorded provider payment capture or authenticated webhook in DccPaymentService. Generated payment IDs or caller-supplied verified:true fields are rejected.`
          );
        }

        if (record.status === "refunded") {
          throw new OctoApiError(
            422,
            "PAYMENT_ALREADY_REFUNDED",
            `Recorded payment '${evidence.transactionId}' has status 'refunded' and cannot be accepted as available capture evidence.`
          );
        }

        if (record.status !== "captured" && record.status !== "partially_refunded") {
          throw new OctoApiError(
            422,
            "UNRESOLVED_PAYMENT_EVIDENCE",
            `Recorded payment '${evidence.transactionId}' has status '${record.status}', not 'captured'. Pending, authorized, failed, or unresolved payments cannot be accepted as completed capture evidence.`
          );
        }

        // Verify obligation binding: record.orderId must match the target obligation or its parent order
        const matchesDirectCandidate = obligationCtx.candidateIds.has(record.orderId);
        const matchesLinkedOrder = obligationCtx.linkedOrderIds.has(record.orderId);
        const explicitOrderMismatch =
          normalizedObligation.orderId &&
          normalizedObligation.orderId !== normalizedObligation.bookingId &&
          normalizedObligation.orderId !== record.orderId &&
          !obligationCtx.candidateIds.has(record.orderId);

        if (explicitOrderMismatch || (!matchesDirectCandidate && !matchesLinkedOrder)) {
          throw new OctoApiError(
            422,
            "PAYMENT_OBLIGATION_MISMATCH",
            `Recorded payment '${evidence.transactionId}' belongs to obligation '${record.orderId}' and cannot be bound to unrelated obligation '${obligationCtx.canonicalBookingId || normalizedObligation.orderId}'.`
          );
        }

        const provenance = record.provenanceSource || "explicit_test_simulation";
        if (!explicitSim && provenance === "explicit_test_simulation") {
          throw new OctoApiError(
            422,
            "UNTRACEABLE_PAYMENT_EVIDENCE",
            `Payment '${evidence.transactionId}' was created via test simulation, which is rejected outside explicit test simulation mode.`
          );
        }

        if (provenance === "authenticated_webhook" && record.webhookEventId && txDb) {
          const evtRows = await txDb
            .select()
            .from(dccSquareWebhookEvents)
            .where(eq(dccSquareWebhookEvents.squareEventId, record.webhookEventId));
          if (evtRows.length === 0 || evtRows[0].processingStatus === "failed") {
            throw new OctoApiError(
              422,
              "UNTRACEABLE_PAYMENT_EVIDENCE",
              `Webhook payment '${evidence.transactionId}' references unverified or failed webhook event '${record.webhookEventId}'.`
            );
          }
        }

        if (
          expectedCurrency &&
          record.currency.toUpperCase() !== expectedCurrency.toUpperCase()
        ) {
          throw new OctoApiError(
            422,
            "PAYMENT_CURRENCY_MISMATCH",
            `Recorded payment '${evidence.transactionId}' currency '${record.currency}' does not match booking currency '${expectedCurrency}'.`
          );
        }

        // Compute net unrefunded captured funds on this payment record (counting only processed refunds)
        const orderRefunds = await this.getRefundsForOrder(record.orderId, txDb);
        const processedRefundsTotal = orderRefunds
          .filter((r) => r.status === "processed" && r.type === "refund")
          .reduce((sum, r) => sum + r.amount, 0);
        const netAvailableCaptured = Math.max(
          0,
          Math.round((record.amount - processedRefundsTotal) * 100) / 100
        );
        const netAvailableCapturedCents = Math.round(netAvailableCaptured * 100);

        if (netAvailableCapturedCents <= 0) {
          throw new OctoApiError(
            422,
            "PAYMENT_ALREADY_REFUNDED",
            `Recorded payment '${evidence.transactionId}' has $0.00 net captured balance remaining after processed refunds ($${processedRefundsTotal.toFixed(2)} refunded of $${record.amount.toFixed(2)}).`
          );
        }

        if (Math.round(evidence.capturedAmount * 100) > netAvailableCapturedCents) {
          throw new OctoApiError(
            422,
            "INSUFFICIENT_CAPTURED_PAYMENT",
            `Payment evidence capturedAmount (${evidence.capturedAmount}) exceeds net unrefunded captured balance (${netAvailableCaptured}) on payment '${evidence.transactionId}'.`
          );
        }

        if (
          typeof expectedAmount === "number" &&
          Number.isFinite(expectedAmount) &&
          netAvailableCapturedCents < Math.round(expectedAmount * 100)
        ) {
          throw new OctoApiError(
            422,
            "INSUFFICIENT_CAPTURED_PAYMENT",
            `Recorded payment '${evidence.transactionId}' net captured balance (${netAvailableCaptured}) is less than required amount (${expectedAmount}).`
          );
        }

        const obligationKey =
          obligationCtx.canonicalBookingId ||
          normalizedObligation.bookingId ||
          normalizedObligation.orderId!;
        const requiredAllocation =
          typeof expectedAmount === "number" && Number.isFinite(expectedAmount)
            ? expectedAmount
            : evidence.capturedAmount;
        const requiredAllocationCents = Math.round(requiredAllocation * 100);

        const allocMap =
          paymentObligationAllocations.get(record.id) || new Map<string, number>();

        if (txDb) {
          const syncRes = await executeTransactionalPaymentAllocationSync(txDb, {
            record,
            netAvailableCapturedCents,
            targetObligation: {
              obligationKey,
              candidateIds: obligationCtx.candidateIds,
              requiredAllocationCents,
            },
          });
          paymentObligationAllocations.set(record.id, syncRes.obligationMapDollars);
        } else {
          // Pure in-memory reservation when no DB is configured (serialized by withPaymentAllocationTransaction)
          let allocatedToOtherObligations = 0;
          for (const [otherKey, otherAmt] of allocMap.entries()) {
            if (otherKey === obligationKey || obligationCtx.candidateIds.has(otherKey)) {
              continue;
            }
            if (otherKey === record.orderId && obligationKey !== record.orderId) {
              continue;
            }
            allocatedToOtherObligations += otherAmt;
          }

          if (
            Math.round((allocatedToOtherObligations + requiredAllocation) * 100) >
            netAvailableCapturedCents
          ) {
            throw new OctoApiError(
              422,
              "PAYMENT_OVERALLOCATED",
              `Payment '${evidence.transactionId}' has $${netAvailableCaptured.toFixed(2)} net captured balance, with $${allocatedToOtherObligations.toFixed(2)} already allocated to other obligations; cannot allocate an additional $${requiredAllocation.toFixed(2)} to '${obligationKey}'.`
            );
          }

          allocMap.set(obligationKey, requiredAllocation);
          paymentObligationAllocations.set(record.id, allocMap);
        }

        return {
          ...evidence,
          provenanceSource: provenance,
          providerRecordId: record.id,
          orderId: record.orderId,
          bookingId: obligationKey,
          ...(record.webhookEventId ? { webhookEventId: record.webhookEventId } : {}),
        };
      } catch (err: any) {
        if (err instanceof OctoApiError) {
          throw err;
        }
        throw new OctoApiError(
          503,
          "PAYMENT_ALLOCATION_PERSISTENCE_FAILED",
          `Database error while verifying or reserving payment allocation for '${evidence.transactionId}': ${err?.message || String(err)}`
        );
      }
    });
  }

  /**
   * Atomically adjusts (increases, reduces, or zeroes out) an obligation's allocation
   * against a payment inside a single database transaction with per-payment locking.
   */
  static async adjustPaymentObligationAllocation(params: {
    paymentId: string;
    orderId?: string;
    bookingId: string;
    newAllocatedAmount: number;
    reason?: string;
  }): Promise<{
    paymentId: string;
    obligationKey: string;
    previousAllocatedAmount: number;
    newAllocatedAmount: number;
    totalAllocatedAmount: number;
  }> {
    if (
      !params.paymentId ||
      !params.bookingId ||
      typeof params.newAllocatedAmount !== "number" ||
      !Number.isFinite(params.newAllocatedAmount) ||
      params.newAllocatedAmount < 0
    ) {
      throw new OctoApiError(
        422,
        "INVALID_ALLOCATION_ADJUSTMENT",
        "adjustPaymentObligationAllocation requires a valid paymentId, bookingId, and non-negative newAllocatedAmount."
      );
    }

    const txKey = params.paymentId.trim();
    return withPaymentAllocationTransaction(txKey, async (txDb) => {
      try {
        const obligationCtx = await resolveObligationContext(
          {
            orderId: params.orderId,
            bookingId: params.bookingId,
          },
          txDb
        );
        const record =
          (await this.getPaymentById(txKey, txDb)) ||
          (params.orderId ? await this.getPaymentByOrderId(params.orderId, txDb) : null);
        if (!record) {
          throw new OctoApiError(
            422,
            "UNTRACEABLE_PAYMENT_EVIDENCE",
            `Cannot adjust allocation: payment '${params.paymentId}' does not exist.`
          );
        }

        const orderRefunds = await this.getRefundsForOrder(record.orderId, txDb);
        const processedRefundsTotal = orderRefunds
          .filter((r) => r.status === "processed" && r.type === "refund")
          .reduce((sum, r) => sum + r.amount, 0);
        const netAvailableCaptured = Math.max(
          0,
          Math.round((record.amount - processedRefundsTotal) * 100) / 100
        );
        const netAvailableCapturedCents = Math.round(netAvailableCaptured * 100);
        const obligationKey = obligationCtx.canonicalBookingId || params.bookingId;
        const requiredAllocationCents = Math.round(params.newAllocatedAmount * 100);

        if (txDb) {
          const syncRes = await executeTransactionalPaymentAllocationSync(txDb, {
            record,
            netAvailableCapturedCents,
            targetObligation: {
              obligationKey,
              candidateIds: obligationCtx.candidateIds,
              requiredAllocationCents,
            },
          });
          paymentObligationAllocations.set(record.id, syncRes.obligationMapDollars);
          return {
            paymentId: record.id,
            obligationKey: syncRes.targetObligationKey || obligationKey,
            previousAllocatedAmount: syncRes.previousObligationCents / 100,
            newAllocatedAmount: syncRes.newObligationCents / 100,
            totalAllocatedAmount: syncRes.totalAllocatedCents / 100,
          };
        }

        const allocMap =
          paymentObligationAllocations.get(record.id) || new Map<string, number>();
        const prevAmt = allocMap.get(obligationKey) || 0;
        let allocatedToOther = 0;
        for (const [k, v] of allocMap.entries()) {
          if (k !== obligationKey && !obligationCtx.candidateIds.has(k)) {
            allocatedToOther += v;
          }
        }
        if (
          Math.round((allocatedToOther + params.newAllocatedAmount) * 100) >
          netAvailableCapturedCents
        ) {
          throw new OctoApiError(
            422,
            "PAYMENT_OVERALLOCATED",
            `Payment '${record.id}' has $${netAvailableCaptured.toFixed(2)} net captured balance; cannot adjust '${obligationKey}' to $${params.newAllocatedAmount.toFixed(2)}.`
          );
        }
        allocMap.set(obligationKey, params.newAllocatedAmount);
        paymentObligationAllocations.set(record.id, allocMap);
        return {
          paymentId: record.id,
          obligationKey,
          previousAllocatedAmount: prevAmt,
          newAllocatedAmount: params.newAllocatedAmount,
          totalAllocatedAmount:
            Math.round((allocatedToOther + params.newAllocatedAmount) * 100) / 100,
        };
      } catch (err: any) {
        if (err instanceof OctoApiError) throw err;
        throw new OctoApiError(
          503,
          "PAYMENT_ALLOCATION_PERSISTENCE_FAILED",
          `Database error while adjusting payment allocation for '${params.paymentId}': ${err?.message || String(err)}`
        );
      }
    });
  }

  /**
   * Verifies that a supplied `OctoVerifiedRefundEvidence` object is:
   * 1. Traced to an authoritative recorded refund in `DccPaymentService` with status `"processed"` (never `"pending"`, `"unresolved"`, or `"failed"`).
   * 2. Bound to the expected financial obligation (`bookingId` / `orderId`), preventing reuse of unrelated refunds.
   */
  static async assertTraceableRefundEvidence(
    evidence: OctoVerifiedRefundEvidence | null | undefined,
    maxRefundableAmount: number,
    expectedCurrencyOrObligation?: string | DccExpectedFinancialObligation | null,
    expectedObligationArg?: DccExpectedFinancialObligation | string | null
  ): Promise<OctoVerifiedRefundEvidence> {
    if (
      !evidence ||
      evidence.verified !== true ||
      typeof evidence.provider !== "string" ||
      !evidence.provider.trim() ||
      typeof evidence.refundId !== "string" ||
      !evidence.refundId.trim() ||
      typeof evidence.refundedAmount !== "number" ||
      !Number.isFinite(evidence.refundedAmount) ||
      evidence.refundedAmount <= 0 ||
      typeof evidence.currency !== "string" ||
      !evidence.currency.trim() ||
      typeof evidence.refundedAt !== "string" ||
      Number.isNaN(Date.parse(evidence.refundedAt))
    ) {
      throw new OctoApiError(
        422,
        "INVALID_VERIFIED_REFUND_EVIDENCE",
        "Refund evidence is incomplete or malformed."
      );
    }

    let expectedCurrency: string | undefined;
    let expectedObligation: DccExpectedFinancialObligation | string | undefined;
    if (
      typeof expectedCurrencyOrObligation === "object" &&
      expectedCurrencyOrObligation !== null
    ) {
      expectedObligation = expectedCurrencyOrObligation;
      expectedCurrency =
        typeof expectedObligationArg === "string" ? expectedObligationArg : undefined;
    } else if (typeof expectedCurrencyOrObligation === "string") {
      if (expectedObligationArg !== undefined && expectedObligationArg !== null) {
        expectedCurrency = expectedCurrencyOrObligation;
        expectedObligation = expectedObligationArg;
      } else if (/^[A-Z]{3}$/i.test(expectedCurrencyOrObligation.trim())) {
        expectedCurrency = expectedCurrencyOrObligation;
        expectedObligation = undefined;
      } else {
        expectedObligation = expectedCurrencyOrObligation;
      }
    } else if (expectedObligationArg !== undefined && expectedObligationArg !== null) {
      expectedObligation = expectedObligationArg;
    }

    const normalizedObligation = normalizeObligationInput(expectedObligation, evidence);
    const obligationCtx = await resolveObligationContext(normalizedObligation);
    if (!obligationCtx.hasIdentity) {
      throw new OctoApiError(
        422,
        "MISSING_REFUND_OBLIGATION_IDENTITY",
        "Refund evidence verification requires an expected bookingId or orderId to bind the refund to a specific financial obligation."
      );
    }

    const explicitSim = isExplicitPaymentTestSimulation();
    const refundRecord = await this.getRefundById(evidence.refundId.trim());
    if (!refundRecord) {
      if (explicitSim && evidence.provenanceSource === "explicit_test_simulation") {
        return {
          ...evidence,
          orderId: normalizedObligation.orderId || normalizedObligation.bookingId,
          bookingId: obligationCtx.canonicalBookingId,
        };
      }
      throw new OctoApiError(
        422,
        "UNTRACEABLE_REFUND_EVIDENCE",
        `Refund ID '${evidence.refundId}' is not backed by any recorded provider refund or authenticated webhook in DccPaymentService. Generated refund IDs or caller-supplied verified:true fields are rejected.`
      );
    }

    if (refundRecord.status !== "processed") {
      throw new OctoApiError(
        422,
        "UNRESOLVED_REFUND_EVIDENCE",
        `Recorded refund '${evidence.refundId}' has status '${refundRecord.status}', not 'processed'. Pending, failed, or unresolved refunds cannot be accepted as completed refund evidence.`
      );
    }

    // Verify refund obligation binding
    if (
      refundRecord.bookingId &&
      !obligationCtx.candidateIds.has(refundRecord.bookingId)
    ) {
      throw new OctoApiError(
        422,
        "REFUND_OBLIGATION_MISMATCH",
        `Recorded refund '${evidence.refundId}' belongs to booking '${refundRecord.bookingId}' and cannot be applied to '${obligationCtx.canonicalBookingId}'.`
      );
    }

    const matchesOrderOrCandidate =
      obligationCtx.candidateIds.has(refundRecord.orderId) ||
      obligationCtx.linkedOrderIds.has(refundRecord.orderId);
    if (!matchesOrderOrCandidate) {
      throw new OctoApiError(
        422,
        "REFUND_OBLIGATION_MISMATCH",
        `Recorded refund '${evidence.refundId}' belongs to obligation '${refundRecord.orderId}' and cannot be applied to unrelated obligation '${obligationCtx.canonicalBookingId || normalizedObligation.orderId}'.`
      );
    }

    const obligationKey =
      obligationCtx.canonicalBookingId ||
      normalizedObligation.bookingId ||
      normalizedObligation.orderId!;
    const existingRefundOwner = refundObligationAllocations.get(refundRecord.id);
    if (
      existingRefundOwner &&
      existingRefundOwner !== obligationKey &&
      !obligationCtx.candidateIds.has(existingRefundOwner)
    ) {
      throw new OctoApiError(
        422,
        "REFUND_OBLIGATION_MISMATCH",
        `Recorded refund '${evidence.refundId}' was already allocated to obligation '${existingRefundOwner}' and cannot be reused for '${obligationKey}'.`
      );
    }

    const provenance = refundRecord.provenanceSource || "explicit_test_simulation";
    if (!explicitSim && provenance === "explicit_test_simulation") {
      throw new OctoApiError(
        422,
        "UNTRACEABLE_REFUND_EVIDENCE",
        `Refund '${evidence.refundId}' was created via test simulation, which is rejected outside explicit test simulation mode.`
      );
    }

    if (
      expectedCurrency &&
      refundRecord.currency.toUpperCase() !== expectedCurrency.toUpperCase()
    ) {
      throw new OctoApiError(
        422,
        "REFUND_CURRENCY_MISMATCH",
        `Recorded refund '${evidence.refundId}' currency '${refundRecord.currency}' does not match expected '${expectedCurrency}'.`
      );
    }

    if (
      Math.round(refundRecord.amount * 100) !== Math.round(evidence.refundedAmount * 100)
    ) {
      throw new OctoApiError(
        422,
        "REFUND_AMOUNT_MISMATCH",
        `Refund evidence amount (${evidence.refundedAmount}) does not match recorded provider refund amount (${refundRecord.amount}).`
      );
    }

    if (
      Number.isFinite(maxRefundableAmount) &&
      Math.round(refundRecord.amount * 100) > Math.round(maxRefundableAmount * 100)
    ) {
      throw new OctoApiError(
        422,
        "REFUND_EXCEEDS_CAPTURED_AMOUNT",
        `Refund amount (${refundRecord.amount}) exceeds captured amount (${maxRefundableAmount}).`
      );
    }

    refundObligationAllocations.set(refundRecord.id, obligationKey);

    return {
      ...evidence,
      provenanceSource: provenance,
      providerRecordId: refundRecord.id,
      orderId: refundRecord.orderId,
      bookingId: obligationKey,
      ...(refundRecord.webhookEventId ? { webhookEventId: refundRecord.webhookEventId } : {}),
    };
  }

  /**
   * Retrieve the primary payment record for an order
   */
  static async getPaymentByOrderId(
    orderId: string,
    targetDb?: DccDb | null
  ): Promise<DccOrderPaymentRecord | null> {
    const db = targetDb !== undefined ? targetDb : getDb();
    if (db) {
      const rows = await db
        .select()
        .from(dccOrderPayments)
        .where(eq(dccOrderPayments.orderId, orderId));
      if (rows.length > 0) {
        const r = rows[0];
        const meta = decodePaymentProvenanceMeta(r.paymentMethod);
        return {
          id: r.id,
          orderId: r.orderId,
          paymentProvider: r.provider,
          providerPaymentId: meta.providerPaymentId || r.id,
          providerStatus: meta.providerStatus,
          amount: Number(r.amount),
          currency: r.currency,
          status: r.status as any,
          provenanceSource: meta.provenanceSource,
          webhookEventId: meta.webhookEventId,
          rawMetadata: { customerEmail: r.customerEmail, ...meta },
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt || new Date().toISOString()),
          updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt || new Date().toISOString()),
        };
      }
    }

    return fallbackPaymentStore.get(orderId) || null;
  }

  /**
   * Retrieve a payment record by either internal DCC ID or provider payment ID
   */
  static async getPaymentById(
    id: string,
    targetDb?: DccDb | null
  ): Promise<DccOrderPaymentRecord | null> {
    const db = targetDb !== undefined ? targetDb : getDb();
    if (db) {
      const rows = await db
        .select()
        .from(dccOrderPayments)
        .where(or(eq(dccOrderPayments.id, id), eq(dccOrderPayments.orderId, id)));
      if (rows.length > 0) {
        const r = rows[0];
        const meta = decodePaymentProvenanceMeta(r.paymentMethod);
        return {
          id: r.id,
          orderId: r.orderId,
          paymentProvider: r.provider,
          providerPaymentId: meta.providerPaymentId || r.id,
          providerStatus: meta.providerStatus,
          amount: Number(r.amount),
          currency: r.currency,
          status: r.status as any,
          provenanceSource: meta.provenanceSource,
          webhookEventId: meta.webhookEventId,
          rawMetadata: { customerEmail: r.customerEmail, ...meta },
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt || new Date().toISOString()),
          updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt || new Date().toISOString()),
        };
      }
    }

    return fallbackPaymentStore.get(id) || null;
  }

  /**
   * Retrieve a recorded refund by ID
   */
  static async getRefundById(
    refundId: string,
    targetDb?: DccDb | null
  ): Promise<DccRefundRecord | null> {
    const db = targetDb !== undefined ? targetDb : getDb();
    if (db) {
      const rows = await db
        .select()
        .from(dccDisputesAndRefunds)
        .where(eq(dccDisputesAndRefunds.id, refundId));
      if (rows.length > 0) {
        const r = rows[0];
        const meta = decodeRefundReasonMeta(r.reason);
        return {
          id: r.id,
          orderId: r.orderId,
          orderItemId: r.orderItemId || undefined,
          bookingId: r.bookingId || undefined,
          operatorSlug: r.operatorSlug,
          type: r.type as any,
          amount: Number(r.amount),
          currency: r.currency,
          status: (r.status === "succeeded" ? "processed" : r.status) as any,
          providerStatus: meta.providerStatus,
          reason: meta.reason || r.reason || undefined,
          provenanceSource: meta.provenanceSource,
          webhookEventId: meta.webhookEventId,
          settlementAdjusted: r.settlementImpact === "reduced_pending",
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt || new Date().toISOString()),
        };
      }
    }
    return fallbackRefundStore.get(refundId) || null;
  }

  /**
   * Update the status of an existing payment record
   */
  static async updatePaymentStatus(
    orderId: string,
    status: DccPaymentStatus,
    webhookMeta?: {
      webhookEventId?: string;
      provenanceSource?: PaymentEvidenceProvenanceSource;
      providerStatus?: string;
    }
  ): Promise<boolean> {
    const payment = await this.getPaymentByOrderId(orderId);
    if (!payment) return false;

    payment.status = status;
    if (webhookMeta?.provenanceSource) {
      payment.provenanceSource = webhookMeta.provenanceSource;
    }
    if (webhookMeta?.webhookEventId) {
      payment.webhookEventId = webhookMeta.webhookEventId;
    }
    if (webhookMeta?.providerStatus !== undefined) {
      payment.providerStatus = webhookMeta.providerStatus;
    }
    payment.updatedAt = new Date().toISOString();

    const db = getDb();
    if (db) {
      try {
        await db
          .update(dccOrderPayments)
          .set({
            status,
            paymentMethod: encodePaymentProvenanceMeta({
              method: payment.paymentProvider,
              provenanceSource: payment.provenanceSource || "explicit_test_simulation",
              providerPaymentId: payment.providerPaymentId || payment.id,
              providerStatus: payment.providerStatus,
              webhookEventId: payment.webhookEventId,
            }),
            updatedAt: new Date(),
          })
          .where(eq(dccOrderPayments.orderId, orderId));
      } catch (err: any) {
        throw new OctoApiError(
          503,
          "PAYMENT_PERSISTENCE_FAILED",
          `Failed to update payment status for order ${orderId}: ${err.message}`
        );
      }
    }

    fallbackPaymentStore.set(orderId, payment);
    fallbackPaymentStore.set(payment.id, payment);

    return true;
  }

  /**
   * Record an external refund event (e.g. from authenticated Square webhook).
   * Only reduces the payment balance and adjusts payment allocations when the refund status is "processed" ("COMPLETED").
   * Executes inside a single database transaction with per-payment locking.
   */
  static async recordExternalRefund(params: {
    refundId: string;
    orderId: string;
    bookingId?: string;
    orderItemId?: string;
    amount: number;
    currency?: string;
    reason?: string;
    webhookEventId?: string;
    provenanceSource?: PaymentEvidenceProvenanceSource;
    rawProviderStatus?: unknown;
  }): Promise<DccRefundRecord> {
    const now = new Date().toISOString();
    const initialPayment = await this.getPaymentByOrderId(params.orderId);
    const provenanceSource: PaymentEvidenceProvenanceSource =
      params.provenanceSource ||
      (params.webhookEventId ? "authenticated_webhook" : "explicit_test_simulation");
    const mappedStatus: DccRefundStatus =
      params.rawProviderStatus !== undefined
        ? mapSquareRefundStatusToDccStatus(params.rawProviderStatus)
        : "processed";
    const providerStatusStr =
      typeof params.rawProviderStatus === "string" ? params.rawProviderStatus : undefined;

    const refundRecord: DccRefundRecord = {
      id: params.refundId,
      orderId: params.orderId,
      bookingId: params.bookingId,
      orderItemId: params.orderItemId,
      operatorSlug: "dcc-system",
      type: "refund",
      amount: params.amount,
      currency: params.currency || "USD",
      status: mappedStatus,
      providerStatus: providerStatusStr,
      reason: params.reason || "External Square Refund",
      provenanceSource,
      webhookEventId: params.webhookEventId,
      settlementAdjusted: mappedStatus === "processed",
      createdAt: now,
    };

    const lockKey = initialPayment?.id || params.orderId;
    return withPaymentAllocationTransaction(lockKey, async (txDb) => {
      const payment = (await this.getPaymentByOrderId(params.orderId, txDb)) || initialPayment;

      if (mappedStatus === "processed") {
        const existingRefunds = await this.getRefundsForOrder(params.orderId, txDb);
        const processedOthers = existingRefunds
          .filter((r) => r.id !== params.refundId && r.status === "processed" && r.type === "refund")
          .reduce((sum, r) => sum + r.amount, 0);
        const totalRefunded = processedOthers + params.amount;

        if (payment) {
          payment.status =
            totalRefunded >= payment.amount - 0.005 ? "refunded" : "partially_refunded";
          payment.updatedAt = now;
        }
      }

      if (txDb) {
        try {
          await txDb
            .insert(dccDisputesAndRefunds)
            .values({
              id: refundRecord.id,
              orderId: refundRecord.orderId,
              orderItemId: refundRecord.orderItemId || null,
              bookingId: refundRecord.bookingId || null,
              paymentId: payment?.id || "pay_unspecified",
              operatorSlug: refundRecord.operatorSlug,
              type: refundRecord.type,
              amount: refundRecord.amount.toFixed(2),
              currency: refundRecord.currency,
              status: refundRecord.status,
              reason: encodeRefundReasonMeta({
                reason: refundRecord.reason || "External Square Refund",
                provenanceSource,
                providerStatus: providerStatusStr,
                webhookEventId: params.webhookEventId,
              }),
              settlementImpact:
                mappedStatus === "processed"
                  ? "reduced_pending"
                  : "pending_provider_confirmation",
            })
            .onConflictDoUpdate({
              target: dccDisputesAndRefunds.id,
              set: {
                status: refundRecord.status,
                reason: encodeRefundReasonMeta({
                  reason: refundRecord.reason || "External Square Refund",
                  provenanceSource,
                  providerStatus: providerStatusStr,
                  webhookEventId: params.webhookEventId,
                }),
                settlementImpact:
                  mappedStatus === "processed"
                    ? "reduced_pending"
                    : "pending_provider_confirmation",
                updatedAt: new Date(),
              },
            });

          if (payment && mappedStatus === "processed") {
            await txDb
              .update(dccOrderPayments)
              .set({ status: payment.status, updatedAt: new Date() })
              .where(eq(dccOrderPayments.orderId, params.orderId));

            const updatedRefunds = await this.getRefundsForOrder(params.orderId, txDb);
            const processedTotal = updatedRefunds
              .filter((r) => r.status === "processed" && r.type === "refund")
              .reduce((sum, r) => sum + r.amount, 0);
            const netAvailableCents = Math.max(
              0,
              Math.round((payment.amount - processedTotal) * 100)
            );
            const syncRes = await executeTransactionalPaymentAllocationSync(txDb, {
              record: payment,
              netAvailableCapturedCents: netAvailableCents,
              refundAdjustment: {
                bookingId: params.bookingId,
                orderItemId: params.orderItemId,
                refundAmountCents: Math.round(params.amount * 100),
              },
            });
            paymentObligationAllocations.set(payment.id, syncRes.obligationMapDollars);
          }

          await txDb.insert(octoAuditLogs).values({
            action: "WEBHOOK_REFUND_RECORDED",
            entityType: "REFUND",
            entityId: refundRecord.id,
            status: "SUCCESS",
            payload: {
              orderId: params.orderId,
              amount: params.amount,
              status: refundRecord.status,
              providerStatus: providerStatusStr || null,
              provenanceSource,
              webhookEventId: params.webhookEventId,
            },
          });
        } catch (err: any) {
          if (err instanceof OctoApiError) throw err;
          throw new OctoApiError(
            503,
            "REFUND_PERSISTENCE_FAILED",
            `Failed to persist external refund ${refundRecord.id}: ${err.message}`
          );
        }
      }

      fallbackRefundStore.set(params.refundId, refundRecord);
      if (payment) {
        fallbackPaymentStore.set(params.orderId, payment);
        fallbackPaymentStore.set(payment.id, payment);
      }

      return refundRecord;
    });
  }

  /**
   * Process and record a refund (item-level or order-level).
   * Strictly maps provider refund status:
   * - COMPLETED -> "processed" (reduces payment balance & adjusts allocations in one locked transaction)
   * - PENDING -> "pending" (does NOT reduce payment balance)
   * - missing / unfamiliar -> "unresolved" (does NOT reduce payment balance)
   * - FAILED / REJECTED / CANCELED -> "failed" (does NOT reduce payment balance)
   */
  static async processRefund(params: DccRefundParams): Promise<DccRefundRecord> {
    const now = new Date().toISOString();
    const explicitSim = isExplicitPaymentTestSimulation(params.options);
    const initialPayment = await this.getPaymentByOrderId(params.orderId);
    const token = getSquareAccessToken();

    if (!explicitSim) {
      if (
        !initialPayment ||
        (initialPayment.status !== "captured" && initialPayment.status !== "partially_refunded")
      ) {
        throw new OctoApiError(
          422,
          "MISSING_CAPTURED_PAYMENT_FOR_REFUND",
          `Order ${params.orderId} does not have a captured payment eligible for provider refund.`
        );
      }
      if (!params.options?.squareClient && !token) {
        throw new OctoApiError(
          503,
          "MISSING_PAYMENT_PROVIDER_CONFIG",
          "Missing SQUARE_ACCESS_TOKEN required to execute provider refund outside explicit test simulation."
        );
      }
    }

    const existingRefundsPre = await this.getRefundsForOrder(params.orderId);
    const alreadyProcessedRefundsTotalPre = existingRefundsPre
      .filter((r) => r.status === "processed" && r.type === "refund")
      .reduce((sum, r) => sum + r.amount, 0);

    if (initialPayment) {
      if (
        initialPayment.status === "refunded" ||
        alreadyProcessedRefundsTotalPre >= initialPayment.amount - 0.005
      ) {
        throw new OctoApiError(
          422,
          "PAYMENT_ALREADY_REFUNDED",
          `Order ${params.orderId} payment (${initialPayment.id}) has already been fully refunded.`
        );
      }
      if (alreadyProcessedRefundsTotalPre + params.amount > initialPayment.amount + 0.01) {
        throw new OctoApiError(
          422,
          "REFUND_EXCEEDS_CAPTURED_BALANCE",
          `Requested refund (${params.amount}) plus already-processed refunds (${alreadyProcessedRefundsTotalPre}) exceeds captured payment amount (${initialPayment.amount}).`
        );
      }
    }

    let refundId = `ref_${crypto.randomUUID().slice(0, 16)}`;
    let refundStatus: DccRefundStatus = "processed";
    let rawProviderRefundStatus: string | undefined;
    let provenanceSource: PaymentEvidenceProvenanceSource = "explicit_test_simulation";

    const shouldInvokeProvider = Boolean(
      params.options?.squareClient ||
        (initialPayment?.paymentProvider === "square" &&
          initialPayment.providerPaymentId &&
          token &&
          initialPayment.provenanceSource !== "explicit_test_simulation" &&
          !initialPayment.providerPaymentId.startsWith("mock_"))
    );

    if (shouldInvokeProvider) {
      if (isSquareProduction()) {
        assertValidDccSquareProductionConfig();
      }
      try {
        const client =
          params.options?.squareClient ||
          new SquareClient({
            token,
            environment:
              getSquareEnvironment() === "production"
                ? SquareEnvironment.Production
                : SquareEnvironment.Sandbox,
          });
        const amountCents = Math.round(params.amount * 100);
        const sqRefundRes = await client.refunds.refundPayment({
          idempotencyKey: refundId,
          amountMoney: {
            amount: BigInt(amountCents),
            currency: (params.currency || "USD") as any,
          },
          paymentId:
            initialPayment?.providerPaymentId || initialPayment?.id || params.orderId,
          reason: params.reason || "DCC Order Cancellation",
        });
        const providerRefundId = sqRefundRes?.refund?.id;
        if (!providerRefundId && !explicitSim) {
          throw new OctoApiError(
            502,
            "REFUND_PROVIDER_INVALID_RESPONSE",
            "Square refunds.refundPayment did not return a refund.id"
          );
        }
        if (providerRefundId) {
          refundId = providerRefundId;
        }
        const rawStatus = sqRefundRes?.refund?.status;
        rawProviderRefundStatus = typeof rawStatus === "string" ? rawStatus : undefined;
        refundStatus = mapSquareRefundStatusToDccStatus(rawStatus);
        provenanceSource = "provider_api_response";

        if (refundStatus === "failed") {
          throw new OctoApiError(
            422,
            "REFUND_PROVIDER_REJECTED",
            `Square refund returned failed/rejected status '${rawProviderRefundStatus || refundStatus}'`
          );
        }
      } catch (sqErr: any) {
        if (
          !explicitSim ||
          params.options?.squareClient ||
          process.env.NODE_ENV === "production"
        ) {
          if (sqErr instanceof OctoApiError) throw sqErr;
          throw new OctoApiError(
            502,
            "REFUND_PROVIDER_ERROR",
            `Square refund failed: ${sqErr.message}`
          );
        }
      }
    }

    const refundRecord: DccRefundRecord = {
      id: refundId,
      orderId: params.orderId,
      orderItemId: params.orderItemId,
      bookingId: params.bookingId,
      operatorSlug: params.operatorSlug,
      type: "refund",
      amount: params.amount,
      currency: params.currency || "USD",
      status: refundStatus,
      providerStatus: rawProviderRefundStatus,
      reason: params.reason || "Customer cancellation refund",
      provenanceSource,
      settlementAdjusted: refundStatus === "processed",
      createdAt: now,
    };

    const lockKey = initialPayment?.id || params.orderId;
    return withPaymentAllocationTransaction(lockKey, async (txDb) => {
      const payment =
        (await this.getPaymentByOrderId(params.orderId, txDb)) || initialPayment;
      const existingRefunds = await this.getRefundsForOrder(params.orderId, txDb);
      const alreadyProcessedRefundsTotal = existingRefunds
        .filter((r) => r.id !== refundId && r.status === "processed" && r.type === "refund")
        .reduce((sum, r) => sum + r.amount, 0);

      if (payment && refundStatus === "processed") {
        if (
          payment.status === "refunded" ||
          alreadyProcessedRefundsTotal >= payment.amount - 0.005
        ) {
          throw new OctoApiError(
            422,
            "PAYMENT_ALREADY_REFUNDED",
            `Order ${params.orderId} payment (${payment.id}) has already been fully refunded.`
          );
        }
        if (alreadyProcessedRefundsTotal + params.amount > payment.amount + 0.01) {
          throw new OctoApiError(
            422,
            "REFUND_EXCEEDS_CAPTURED_BALANCE",
            `Requested refund (${params.amount}) plus already-processed refunds (${alreadyProcessedRefundsTotal}) exceeds captured payment amount (${payment.amount}).`
          );
        }

        const totalRefunded = alreadyProcessedRefundsTotal + params.amount;
        payment.status =
          totalRefunded >= payment.amount - 0.005 ? "refunded" : "partially_refunded";
        payment.updatedAt = now;
      }

      if (txDb) {
        try {
          await txDb.insert(dccDisputesAndRefunds).values({
            id: refundRecord.id,
            orderId: refundRecord.orderId,
            orderItemId: refundRecord.orderItemId || null,
            bookingId: refundRecord.bookingId || null,
            paymentId: payment?.id || "pay_unspecified",
            operatorSlug: refundRecord.operatorSlug,
            type: refundRecord.type,
            amount: refundRecord.amount.toFixed(2),
            currency: refundRecord.currency,
            status: refundRecord.status,
            reason: encodeRefundReasonMeta({
              reason: refundRecord.reason || "Customer cancellation refund",
              provenanceSource,
              providerStatus: rawProviderRefundStatus,
            }),
            settlementImpact:
              refundStatus === "processed"
                ? "reduced_pending"
                : "pending_provider_confirmation",
          });

          if (payment && refundStatus === "processed") {
            await txDb
              .update(dccOrderPayments)
              .set({ status: payment.status, updatedAt: new Date() })
              .where(eq(dccOrderPayments.orderId, params.orderId));

            const totalRefunded = alreadyProcessedRefundsTotal + params.amount;
            const netAvailableCents = Math.max(
              0,
              Math.round((payment.amount - totalRefunded) * 100)
            );
            const syncRes = await executeTransactionalPaymentAllocationSync(txDb, {
              record: payment,
              netAvailableCapturedCents: netAvailableCents,
              refundAdjustment: {
                bookingId: params.bookingId,
                orderItemId: params.orderItemId,
                refundAmountCents: Math.round(params.amount * 100),
              },
            });
            paymentObligationAllocations.set(payment.id, syncRes.obligationMapDollars);
          }

          await txDb.insert(octoAuditLogs).values({
            action:
              refundStatus === "processed"
                ? "REFUND_PROCESSED"
                : "REFUND_PENDING_OR_UNRESOLVED",
            entityType: "REFUND",
            entityId: refundRecord.id,
            status: "SUCCESS",
            payload: {
              orderId: params.orderId,
              orderItemId: params.orderItemId,
              bookingId: params.bookingId,
              amount: params.amount,
              status: refundRecord.status,
              providerStatus: rawProviderRefundStatus || null,
              provenanceSource,
            },
          });
        } catch (err: any) {
          if (err instanceof OctoApiError) throw err;
          throw new OctoApiError(
            503,
            "REFUND_PERSISTENCE_FAILED",
            `Failed to persist refund ${refundRecord.id} to database: ${err.message}`
          );
        }
      } else if (payment && refundStatus === "processed" && params.bookingId) {
        const allocMap = paymentObligationAllocations.get(payment.id);
        if (allocMap && allocMap.has(params.bookingId)) {
          const cur = allocMap.get(params.bookingId) || 0;
          allocMap.set(
            params.bookingId,
            Math.max(0, Math.round((cur - params.amount) * 100) / 100)
          );
        }
      }

      fallbackRefundStore.set(refundId, refundRecord);
      if (payment) {
        fallbackPaymentStore.set(params.orderId, payment);
        fallbackPaymentStore.set(payment.id, payment);
      }

      return refundRecord;
    });
  }

  /**
   * Cancel or void an authorized payment when a booking fails before capture
   */
  static async cancelOrVoidPayment(orderId: string, reason?: string): Promise<boolean> {
    const payment = await this.getPaymentByOrderId(orderId);
    if (!payment) return false;

    if (payment.status === "authorized") {
      const token = getSquareAccessToken();
      if (
        payment.paymentProvider === "square" &&
        payment.providerPaymentId &&
        token &&
        !payment.providerPaymentId.startsWith("mock_")
      ) {
        try {
          const client = new SquareClient({
            token,
            environment:
              getSquareEnvironment() === "production"
                ? SquareEnvironment.Production
                : SquareEnvironment.Sandbox,
          });
          await client.payments.cancel({ paymentId: payment.providerPaymentId });
        } catch {
          // Void attempt completed
        }
      }
      await this.updatePaymentStatus(orderId, "failed");
      return true;
    } else if (payment.status === "captured") {
      await this.processRefund({
        orderId,
        operatorSlug: "dcc-system",
        amount: payment.amount,
        currency: payment.currency,
        reason: reason || "Void/Refund after checkout failure",
      });
      return true;
    }

    return false;
  }

  /**
   * Record a chargeback dispute against an order
   */
  static async recordChargeback(params: DccChargebackParams): Promise<DccRefundRecord> {
    const disputeId = `chg_${crypto.randomUUID().slice(0, 16)}`;
    const now = new Date().toISOString();
    const payment = await this.getPaymentByOrderId(params.orderId);

    const record: DccRefundRecord = {
      id: disputeId,
      orderId: params.orderId,
      operatorSlug: params.operatorSlug,
      type: "chargeback",
      amount: params.amount,
      currency: params.currency || "USD",
      status: "initiated",
      reason: params.reason || "Bank chargeback dispute",
      settlementAdjusted: false,
      createdAt: now,
    };

    const db = getDb();
    if (db) {
      try {
        await db.insert(dccDisputesAndRefunds).values({
          id: record.id,
          orderId: record.orderId,
          paymentId: payment?.id || "pay_unspecified",
          operatorSlug: record.operatorSlug,
          type: record.type,
          amount: record.amount.toFixed(2),
          currency: record.currency,
          status: record.status,
          reason: record.reason || null,
          settlementImpact: "deducted_future_payout",
        });

        if (payment) {
          await db
            .update(dccOrderPayments)
            .set({ status: "chargeback", updatedAt: new Date() })
            .where(eq(dccOrderPayments.orderId, params.orderId));
        }
      } catch (err: any) {
        throw new OctoApiError(
          503,
          "CHARGEBACK_PERSISTENCE_FAILED",
          `Failed to persist chargeback ${record.id}: ${err.message}`
        );
      }
    }

    fallbackRefundStore.set(disputeId, record);
    if (payment) {
      payment.status = "chargeback";
      payment.updatedAt = now;
      fallbackPaymentStore.set(params.orderId, payment);
      fallbackPaymentStore.set(payment.id, payment);
    }

    return record;
  }

  /**
   * List refunds and disputes for an order
   */
  static async getRefundsForOrder(
    orderId: string,
    targetDb?: DccDb | null
  ): Promise<DccRefundRecord[]> {
    const db = targetDb !== undefined ? targetDb : getDb();
    if (db) {
      const rows = await db
        .select()
        .from(dccDisputesAndRefunds)
        .where(eq(dccDisputesAndRefunds.orderId, orderId));
      if (rows.length > 0) {
        return rows.map((r) => {
          const meta = decodeRefundReasonMeta(r.reason);
          return {
            id: r.id,
            orderId: r.orderId,
            orderItemId: r.orderItemId || undefined,
            bookingId: r.bookingId || undefined,
            operatorSlug: r.operatorSlug,
            type: r.type as any,
            amount: Number(r.amount),
            currency: r.currency,
            status: (r.status === "succeeded" ? "processed" : r.status) as any,
            reason: meta.reason || r.reason || undefined,
            provenanceSource: meta.provenanceSource,
            webhookEventId: meta.webhookEventId,
            settlementAdjusted: Boolean(r.settlementImpact),
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt || new Date().toISOString()),
          };
        });
      }
    }

    return Array.from(fallbackRefundStore.values()).filter((r) => r.orderId === orderId);
  }
}


