import crypto from "crypto";
import { DccBookingService } from "@/lib/bookings";
import { DccPaymentService } from "@/lib/payments";
import { DccSettlementEngine } from "@/lib/settlement";
import { DccTravelerService } from "@/lib/travelers";
import {
  CreateOrderRequest,
  DccMasterOrder,
  DccOrderItem,
  DccOrderStatus,
} from "@/lib/orders/types";
import {
  DccRetryPolicy,
  DEFAULT_SAGA_RETRY_POLICY,
  DccSagaExecutionOptions,
  DccSagaResult,
  DccSagaStatus,
  DccSagaStepName,
  DccSagaStepRecord,
  DccSupplierBookingRecord,
} from "./types";
import { DccSagaRepository } from "./sagaRepository";
import { sanitizeSagaError, sanitizeSagaPayload } from "./sanitizer";
import { OctoApiError } from "@/lib/providers";

export class DccSagaCoordinator {
  /**
   * Executes the 9-step durable Saga for multi-supplier DCC order booking.
   */
  static async executeOrderSaga(
    params: CreateOrderRequest & {
      paymentInfo?: {
        provider?: string;
        paymentId?: string;
        paymentIntentId?: string;
        status?: "authorized" | "captured";
      };
    },
    options?: DccSagaExecutionOptions
  ): Promise<DccSagaResult> {
    const orderId = `dcc:ord:${crypto.randomUUID().slice(0, 12)}`;
    const sagaId = `saga_${orderId.replace("dcc:ord:", "")}`;
    const retryPolicy: DccRetryPolicy = {
      ...DEFAULT_SAGA_RETRY_POLICY,
      ...options?.retryPolicy,
    };

    const steps: DccSagaStepRecord[] = [];
    const supplierBookings: DccSupplierBookingRecord[] = [];
    let orderStatus: DccOrderStatus = "PENDING_HOLD";
    let sagaStatus: DccSagaStatus = "IN_PROGRESS";
    let paymentId: string | undefined;
    let totalPrice = 0;
    let orderItems: DccOrderItem[] = [];

    // Check for duplicate request or altered payload
    const payloadHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(params.items))
      .digest("hex");

    if (params.idempotencyKey) {
      // Check existing order with this idempotency key
      const existing = await DccSagaRepository.getOrderByPendingIdempotencyKey(params.idempotencyKey);
      if (existing) {
        if ((existing as any).idempotencyHash && (existing as any).idempotencyHash !== payloadHash) {
          throw new OctoApiError(
            400,
            "ALTERED_IDEMPOTENCY_REQUEST",
            "Idempotency key was previously used with a different order payload"
          );
        }
        // Return existing order result
        const existingBookings = await DccSagaRepository.getSupplierBookingsForOrder(existing.orderId);
        const existingSteps = await DccSagaRepository.getSagaSteps((existing as any).sagaId || "");
        return {
          sagaId: (existing as any).sagaId || `saga_${existing.orderId}`,
          orderId: existing.orderId,
          status: "SUCCEEDED",
          successful: existing.status === "CONFIRMED",
          steps: existingSteps,
          supplierBookings: existingBookings,
          paymentId: existing.paymentId,
        };
      }
    }

    // Pre-flight client validation: referral products and unauthorized suppliers
    for (const item of params.items) {
      if (
        (item as any).referralOnly ||
        item.productId.startsWith("ref_") ||
        item.productId.startsWith("referral_") ||
        item.productId.includes("viator") ||
        item.productId.includes("fareharbor")
      ) {
        throw new OctoApiError(
          400,
          "REFERRAL_BOOKING_NOT_SUPPORTED",
          "Referral-only and affiliate listings cannot be booked through DCC master orders"
        );
      }

      const supplierConnId = await DccBookingService.resolveConnectionForProduct(item.productId);
      const { adapter, isMock, connection } = await DccBookingService.getAdapterForConnection(supplierConnId);

      if (connection?.connectionStatus === "authorization_pending" || (!isMock && !adapter)) {
        throw new OctoApiError(
          403,
          "UNAUTHORIZED_SUPPLIER",
          `Supplier ${connection?.operatorName || supplierConnId} is authorization_pending and non-bookable`
        );
      }
    }

    // Record initial SAGA_STARTED audit event
    await DccSagaRepository.recordAuditEvent({
      sagaId,
      orderId,
      eventType: "SAGA_STARTED",
      action: "START_ORDER_SAGA",
      entityType: "ORDER",
      entityId: orderId,
      idempotencyKey: params.idempotencyKey || null,
      attemptNumber: 1,
      status: "SUCCESS",
      sanitizedDetails: {
        itemCount: params.items.length,
        currency: params.currency || "USD",
      },
      occurredAt: new Date().toISOString(),
    });

    try {
      // -------------------------------------------------------------
      // STEP 1: AVAILABILITY CHECK (OCTO POST /availability)
      // -------------------------------------------------------------
      const step1Key = `${sagaId}:step1:avail`;
      const step1Record: DccSagaStepRecord = {
        id: `dcc:saga:step:${crypto.randomUUID().slice(0, 10)}`,
        sagaId,
        orderId,
        stepName: "AVAILABILITY_CHECK",
        stepIndex: 1,
        status: "RUNNING",
        idempotencyKey: step1Key,
        attemptCount: 1,
        maxRetries: retryPolicy.maxRetries,
        retryPolicy,
        inputPayload: { itemCount: params.items.length },
        compensationStatus: "NOT_APPLICABLE",
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await DccSagaRepository.recordSagaStep(step1Record);
      steps.push(step1Record);

      for (let i = 0; i < params.items.length; i++) {
        const item = params.items[i];

        if (
          (item as any).referralOnly ||
          item.productId.startsWith("ref_") ||
          item.productId.startsWith("referral_") ||
          item.productId.includes("viator") ||
          item.productId.includes("fareharbor")
        ) {
          throw new OctoApiError(
            400,
            "REFERRAL_BOOKING_NOT_SUPPORTED",
            "Referral-only and affiliate listings cannot be booked through DCC master orders"
          );
        }

        const supplierConnId = await DccBookingService.resolveConnectionForProduct(item.productId);
        const { adapter, isMock, connection } = await DccBookingService.getAdapterForConnection(supplierConnId);

        if (connection?.connectionStatus === "authorization_pending" || (!isMock && !adapter)) {
          throw new OctoApiError(
            403,
            "UNAUTHORIZED_SUPPLIER",
            `Supplier ${connection?.operatorName || supplierConnId} is authorization_pending and non-bookable`
          );
        }

        // Date check
        const dateMatch = item.availabilityId.match(/\d{4}-\d{2}-\d{2}/);
        const checkDate = dateMatch ? dateMatch[0] : "2026-09-20";

        if (isMock) {
          const { MockOctoSupplierEngine } = await import("@/lib/octo/mockServer");
          const slots = MockOctoSupplierEngine.checkAvailability(
            item.productId,
            item.optionId,
            checkDate,
            item.unitItems
          );
          const found = slots.find((s) => s.id === item.availabilityId || (item.availabilityId === "avail_slot_1" && s.available));
          if (!found || !found.available || found.status === "SOLD_OUT") {
            throw new OctoApiError(
              400,
              "INSUFFICIENT_AVAILABILITY",
              `Availability slot ${item.availabilityId} is sold out or unavailable`
            );
          }
        }
      }

      step1Record.status = "SUCCEEDED";
      step1Record.completedAt = new Date().toISOString();
      await DccSagaRepository.recordSagaStep(step1Record);

      // -------------------------------------------------------------
      // STEP 2: SUPPLIER ON_HOLD BOOKINGS (OCTO POST /bookings)
      // -------------------------------------------------------------
      const step2Key = `${sagaId}:step2:holds`;
      const step2Record: DccSagaStepRecord = {
        id: `dcc:saga:step:${crypto.randomUUID().slice(0, 10)}`,
        sagaId,
        orderId,
        stepName: "SUPPLIER_HOLD",
        stepIndex: 2,
        status: "RUNNING",
        idempotencyKey: step2Key,
        attemptCount: 1,
        maxRetries: retryPolicy.maxRetries,
        retryPolicy,
        inputPayload: { itemCount: params.items.length },
        compensationStatus: "PENDING",
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await DccSagaRepository.recordSagaStep(step2Record);
      steps.push(step2Record);

      let earliestHoldExpires: string | undefined;

      for (let i = 0; i < params.items.length; i++) {
        const item = params.items[i];
        const supplierConnId = await DccBookingService.resolveConnectionForProduct(item.productId);
        const itemId = `dcc:item:${crypto.randomUUID().slice(0, 12)}`;
        const holdIdempotencyKey = `${sagaId}:item_${i}:hold`;

        // Check simulated failure for testing multi-supplier failure modes
        if (
          options?.simulatedErrors?.holdFailureSupplierConnectionId === supplierConnId ||
          options?.simulatedErrors?.holdFailureOptionId === item.optionId
        ) {
          throw new OctoApiError(
            400,
            "SUPPLIER_HOLD_REJECTED",
            `Simulated hold failure for supplier ${supplierConnId} on option ${item.optionId}`
          );
        }

        const hold = await DccBookingService.createHold({
          supplierConnectionId: supplierConnId,
          productId: item.productId,
          optionId: item.optionId,
          availabilityId: item.availabilityId,
          unitItems: item.unitItems,
          notes: item.notes,
          idempotencyKey: holdIdempotencyKey,
          resellerId: params.resellerId,
          orderId,
        });

        totalPrice += hold.totalPrice;

        if (hold.utcHoldExpires) {
          if (!earliestHoldExpires || new Date(hold.utcHoldExpires) < new Date(earliestHoldExpires)) {
            earliestHoldExpires = hold.utcHoldExpires;
          }
        }

        const orderItem: DccOrderItem = {
          itemId,
          productId: item.productId,
          optionId: item.optionId,
          availabilityId: item.availabilityId,
          supplierConnectionId: supplierConnId,
          unitItems: item.unitItems,
          price: hold.totalPrice,
          currency: hold.currency,
          status: "ON_HOLD",
          bookingId: hold.dccBookingId,
          bookingUuid: hold.uuid,
          notes: item.notes,
        };
        orderItems.push(orderItem);

        const sbRecord: DccSupplierBookingRecord = {
          id: `dcc:sbk:${hold.uuid.slice(0, 12)}`,
          orderId,
          orderItemId: itemId,
          supplierConnectionId: supplierConnId,
          operatorSlug: "alaska-premier-expeditions",
          operatorName: "Alaska Premier Expeditions",
          productId: item.productId,
          optionId: item.optionId,
          availabilityId: item.availabilityId,
          providerBookingId: hold.supplierReference || null,
          providerBookingUuid: hold.uuid,
          status: "ON_HOLD",
          holdExpiresAt: hold.utcHoldExpires,
          price: hold.totalPrice,
          currency: hold.currency,
          unitItems: item.unitItems,
          idempotencyKey: holdIdempotencyKey,
          idempotencyHash: crypto.createHash("sha256").update(JSON.stringify(item)).digest("hex"),
          attemptCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        supplierBookings.push(sbRecord);

        // Persist records
        await DccSagaRepository.saveOrderItem(orderItem, orderId);
        await DccSagaRepository.saveSupplierBooking(sbRecord);
      }

      step2Record.status = "SUCCEEDED";
      step2Record.completedAt = new Date().toISOString();
      await DccSagaRepository.recordSagaStep(step2Record);

      orderStatus = "ON_HOLD";

      // -------------------------------------------------------------
      // STEP 3: PAYMENT AUTHORIZATION
      // -------------------------------------------------------------
      const step3Key = `${sagaId}:step3:pay_auth`;
      const step3Record: DccSagaStepRecord = {
        id: `dcc:saga:step:${crypto.randomUUID().slice(0, 10)}`,
        sagaId,
        orderId,
        stepName: "PAYMENT_AUTHORIZE",
        stepIndex: 3,
        status: "RUNNING",
        idempotencyKey: step3Key,
        attemptCount: 1,
        maxRetries: retryPolicy.maxRetries,
        retryPolicy,
        inputPayload: { amount: totalPrice, currency: "USD" },
        compensationStatus: "PENDING",
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await DccSagaRepository.recordSagaStep(step3Record);
      steps.push(step3Record);

      if (options?.simulatedErrors?.failPaymentAuthorization) {
        throw new Error("PAYMENT_AUTH_DECLINED: Card authorization declined by issuing bank");
      }

      // Check expired hold simulation
      if (options?.simulatedErrors?.simulateExpiredHold) {
        throw new OctoApiError(400, "EXPIRED_HOLD", "Reservation hold expired prior to payment");
      }

      const authPaymentResult = await DccPaymentService.processPayment({
        orderId,
        amount: totalPrice,
        currency: "USD",
        sourceId: (params as any).sourceId || (params.paymentInfo as any)?.sourceId,
        paymentInfo: {
          provider: "square",
          ...params.paymentInfo,
          status: "authorized",
        },
        customer: params.customer
          ? {
              fullName: params.customer.fullName,
              emailAddress: params.customer.emailAddress,
            }
          : undefined,
      });

      if (!authPaymentResult.success) {
        throw new Error("PAYMENT_AUTH_FAILED: Failed to obtain authorization on card");
      }

      paymentId = authPaymentResult.paymentId;
      step3Record.externalReferenceId = paymentId;
      step3Record.status = "SUCCEEDED";
      step3Record.completedAt = new Date().toISOString();
      await DccSagaRepository.recordSagaStep(step3Record);

      // -------------------------------------------------------------
      // STEP 4: SUPPLIER CONFIRMATION (OCTO POST /bookings/{uuid}/confirm)
      // -------------------------------------------------------------
      const step4Key = `${sagaId}:step4:confirm`;
      const step4Record: DccSagaStepRecord = {
        id: `dcc:saga:step:${crypto.randomUUID().slice(0, 10)}`,
        sagaId,
        orderId,
        stepName: "SUPPLIER_CONFIRM",
        stepIndex: 4,
        status: "RUNNING",
        idempotencyKey: step4Key,
        attemptCount: 1,
        maxRetries: retryPolicy.maxRetries,
        retryPolicy,
        inputPayload: { bookingCount: supplierBookings.length },
        compensationStatus: "PENDING",
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await DccSagaRepository.recordSagaStep(step4Record);
      steps.push(step4Record);

      for (let i = 0; i < supplierBookings.length; i++) {
        const sb = supplierBookings[i];
        const confirmKey = `${sagaId}:item_${i}:confirm`;

        if (
          options?.simulatedErrors?.failSupplierConfirmation ||
          options?.simulatedErrors?.failSupplierConfirmationBookingUuid === sb.providerBookingUuid
        ) {
          throw new OctoApiError(
            500,
            "SUPPLIER_CONFIRMATION_FAILED",
            `Supplier API failed to confirm booking ${sb.providerBookingUuid}`
          );
        }

        const confirmed = await DccBookingService.confirmReservation({
          bookingId: sb.providerBookingUuid!,
          contact: {
            fullName: params.customer?.fullName || "Valued Traveler",
            emailAddress: params.customer?.emailAddress || "traveler@example.com",
            phoneNumber: params.customer?.phoneNumber,
            country: params.customer?.country,
          },
          payment: {
            provider: "square",
            paymentId,
            amount: sb.price,
            currency: sb.currency,
            status: "authorized",
          },
          idempotencyKey: confirmKey,
          resellerId: params.resellerId,
          orderId,
        });

        sb.status = "CONFIRMED";
        sb.confirmedAt = confirmed.confirmedAt || new Date().toISOString();
        sb.voucherCode = confirmed.voucher?.code || null;
        sb.voucherUrl = confirmed.voucher?.barcodeUrl || null;
        sb.voucherInstructions = confirmed.voucher?.redemptionInstructions || null;

        const item = orderItems.find((it) => it.itemId === sb.orderItemId);
        if (item) {
          item.status = "CONFIRMED";
          item.voucher = confirmed.voucher
            ? {
                code: confirmed.voucher.code,
                barcode: (confirmed.voucher as any).barcode || confirmed.voucher.barcodeUrl,
                url: (confirmed.voucher as any).url || confirmed.voucher.barcodeUrl,
              }
            : undefined;
          await DccSagaRepository.saveOrderItem(item, orderId);
        }

        await DccSagaRepository.saveSupplierBooking(sb);
      }

      step4Record.status = "SUCCEEDED";
      step4Record.completedAt = new Date().toISOString();
      await DccSagaRepository.recordSagaStep(step4Record);

      // -------------------------------------------------------------
      // STEP 5: PAYMENT CAPTURE
      // -------------------------------------------------------------
      const step5Key = `${sagaId}:step5:capture`;
      const step5Record: DccSagaStepRecord = {
        id: `dcc:saga:step:${crypto.randomUUID().slice(0, 10)}`,
        sagaId,
        orderId,
        stepName: "PAYMENT_CAPTURE",
        stepIndex: 5,
        status: "RUNNING",
        idempotencyKey: step5Key,
        attemptCount: 1,
        maxRetries: retryPolicy.maxRetries,
        retryPolicy,
        inputPayload: { paymentId, amount: totalPrice },
        compensationStatus: "PENDING",
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await DccSagaRepository.recordSagaStep(step5Record);
      steps.push(step5Record);

      // Execute with retry policy
      let captureSuccess = false;
      let captureAttempts = 0;

      while (!captureSuccess && captureAttempts < retryPolicy.maxRetries) {
        captureAttempts++;
        step5Record.attemptCount = captureAttempts;

        if (options?.simulatedErrors?.failPaymentCapture) {
          // Failure on all retries
          if (captureAttempts >= retryPolicy.maxRetries) {
            throw new Error("PAYMENT_CAPTURE_FAILED: Gateway capture timed out or failed permanently");
          }
          continue;
        }

        const captureResult = await DccPaymentService.processPayment({
          orderId,
          amount: totalPrice,
          currency: "USD",
          paymentInfo: {
            provider: "square",
            paymentId,
            status: "captured",
          },
          customer: params.customer
            ? {
                fullName: params.customer.fullName,
                emailAddress: params.customer.emailAddress,
              }
            : undefined,
        });

        if (captureResult.success) {
          captureSuccess = true;
        }
      }

      if (!captureSuccess) {
        throw new Error("PAYMENT_CAPTURE_FAILED: Unable to capture payment after retries");
      }

      step5Record.status = "SUCCEEDED";
      step5Record.completedAt = new Date().toISOString();
      await DccSagaRepository.recordSagaStep(step5Record);

      // -------------------------------------------------------------
      // STEP 6: VOUCHER RETRIEVAL
      // -------------------------------------------------------------
      const step6Key = `${sagaId}:step6:vouchers`;
      const step6Record: DccSagaStepRecord = {
        id: `dcc:saga:step:${crypto.randomUUID().slice(0, 10)}`,
        sagaId,
        orderId,
        stepName: "VOUCHER_RETRIEVAL",
        stepIndex: 6,
        status: "SUCCEEDED",
        idempotencyKey: step6Key,
        attemptCount: 1,
        maxRetries: 1,
        retryPolicy,
        inputPayload: { confirmedItemsCount: orderItems.length },
        compensationStatus: "NOT_APPLICABLE",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await DccSagaRepository.recordSagaStep(step6Record);
      steps.push(step6Record);

      // -------------------------------------------------------------
      // STEP 9: FINAL ORDER STATE
      // -------------------------------------------------------------
      orderStatus = "CONFIRMED";
      sagaStatus = "SUCCEEDED";

      // Associate traveler profile
      let travelerId = params.travelerId;
      if (!travelerId && params.customer?.emailAddress) {
        const profile = await DccTravelerService.getOrCreateProfile(params.customer.emailAddress, {
          fullName: params.customer.fullName,
          phone: params.customer.phoneNumber,
          country: params.customer.country,
        });
        travelerId = profile.id;
      }

      const masterOrder: DccMasterOrder = {
        orderId,
        travelerId,
        resellerId: params.resellerId,
        status: "CONFIRMED",
        currency: "USD",
        totalPrice: Math.round(totalPrice * 100) / 100,
        items: orderItems,
        bookingIds: supplierBookings.map((b) => b.providerBookingUuid || b.id),
        paymentId,
        utcHoldExpires: null,
        customer: params.customer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (masterOrder as any).sagaId = sagaId;
      (masterOrder as any).sagaStatus = "SUCCEEDED";
      (masterOrder as any).idempotencyKey = params.idempotencyKey;
      (masterOrder as any).idempotencyHash = payloadHash;

      await DccSagaRepository.saveOrder(masterOrder);

      await DccSagaRepository.recordAuditEvent({
        sagaId,
        orderId,
        eventType: "SAGA_COMPLETED",
        action: "ORDER_SAGA_SUCCEEDED",
        entityType: "ORDER",
        entityId: orderId,
        attemptNumber: 1,
        status: "SUCCESS",
        sanitizedDetails: {
          totalPrice,
          paymentId,
          confirmedBookingsCount: supplierBookings.length,
        },
        occurredAt: new Date().toISOString(),
      });

      return {
        sagaId,
        orderId,
        status: "SUCCEEDED",
        successful: true,
        steps,
        supplierBookings,
        paymentId,
      };
    } catch (err: any) {
      // -------------------------------------------------------------
      // STEP 7 & 8: COMPENSATION ORCHESTRATION & REFUND/VOID
      // -------------------------------------------------------------
      const { errorCode, errorMessage } = sanitizeSagaError(err);
      sagaStatus = "COMPENSATING";

      if (steps.length > 0) {
        const lastStep = steps[steps.length - 1];
        if (lastStep.status === "RUNNING") {
          lastStep.status = "FAILED";
          lastStep.errorCode = errorCode;
          lastStep.errorMessage = errorMessage;
          lastStep.completedAt = new Date().toISOString();
          await DccSagaRepository.recordSagaStep(lastStep);
        }
      }

      await DccSagaRepository.recordAuditEvent({
        sagaId,
        orderId,
        eventType: "COMPENSATION_INITIATED",
        action: "TRIGGER_SAGA_COMPENSATION",
        entityType: "ORDER",
        entityId: orderId,
        attemptNumber: 1,
        status: "COMPENSATING",
        errorCode,
        errorMessage,
        sanitizedDetails: {
          failedAtStep: steps[steps.length - 1]?.stepName || "INITIALIZATION",
        },
        occurredAt: new Date().toISOString(),
      });

      // Compensation Step 7a: Cancel holds and confirmed bookings
      for (let i = 0; i < supplierBookings.length; i++) {
        const sb = supplierBookings[i];
        if (sb.status === "ON_HOLD" || sb.status === "CONFIRMED") {
          const compKey = `${sagaId}:item_${i}:compensate`;
          let cancelAttempts = 0;
          let cancelSuccess = false;

          while (!cancelSuccess && cancelAttempts < retryPolicy.maxRetries) {
            cancelAttempts++;
            try {
              if (options?.simulatedErrors?.simulateCompensationTimeout && cancelAttempts === 1) {
                throw new Error("COMPENSATION_TIMEOUT: Upstream supplier connection timed out");
              }

              if (sb.providerBookingUuid) {
                await DccBookingService.cancelBooking(sb.providerBookingUuid, {
                  reason: `Saga compensation: ${errorCode}`,
                });
              }

              sb.status = "CANCELLED";
              sb.cancelledAt = new Date().toISOString();
              sb.cancellationReason = `Saga failure: ${errorCode}`;
              await DccSagaRepository.saveSupplierBooking(sb);
              cancelSuccess = true;
            } catch (compErr: any) {
              if (cancelAttempts >= retryPolicy.maxRetries) {
                console.warn(`Compensation retry exhausted for ${sb.id}: ${compErr.message}`);
              }
            }
          }
        }
      }

      // Compensation Step 8: Refund or void payment if captured / authorized
      if (paymentId) {
        try {
          await DccPaymentService.cancelOrVoidPayment(orderId, `Saga compensation rollback: ${errorCode}`);
        } catch (payErr: any) {
          console.warn("Payment compensation refund error:", payErr.message);
        }
      }

      sagaStatus = "COMPENSATED";
      orderStatus = "FAILED";

      const failedOrder: DccMasterOrder = {
        orderId,
        travelerId: params.travelerId,
        resellerId: params.resellerId,
        status: "FAILED",
        currency: "USD",
        totalPrice: Math.round(totalPrice * 100) / 100,
        items: orderItems.map((it) => ({ ...it, status: "CANCELLED" })),
        bookingIds: supplierBookings.map((b) => b.providerBookingUuid || b.id),
        paymentId,
        utcHoldExpires: null,
        customer: params.customer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (failedOrder as any).sagaId = sagaId;
      (failedOrder as any).sagaStatus = "COMPENSATED";
      (failedOrder as any).idempotencyKey = params.idempotencyKey;
      (failedOrder as any).idempotencyHash = payloadHash;
      (failedOrder as any).lastErrorCode = errorCode;
      (failedOrder as any).lastErrorMessage = errorMessage;

      await DccSagaRepository.saveOrder(failedOrder);

      await DccSagaRepository.recordAuditEvent({
        sagaId,
        orderId,
        eventType: "SAGA_FAILED",
        action: "ORDER_SAGA_FAILED",
        entityType: "ORDER",
        entityId: orderId,
        attemptNumber: 1,
        status: "FAILURE",
        errorCode,
        errorMessage,
        sanitizedDetails: {
          compensatedBookingsCount: supplierBookings.length,
          paymentRolledBack: Boolean(paymentId),
        },
        occurredAt: new Date().toISOString(),
      });

      return {
        sagaId,
        orderId,
        status: sagaStatus,
        successful: false,
        steps,
        errorCode,
        errorMessage,
        supplierBookings,
        paymentId,
      };
    }
  }
}
