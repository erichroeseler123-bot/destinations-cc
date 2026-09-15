export type DccSagaStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUCCEEDED"
  | "COMPENSATING"
  | "COMPENSATED"
  | "FAILED";

export type DccSagaStepName =
  | "AVAILABILITY_CHECK"
  | "SUPPLIER_HOLD"
  | "PAYMENT_AUTHORIZE"
  | "SUPPLIER_CONFIRM"
  | "PAYMENT_CAPTURE"
  | "VOUCHER_RETRIEVAL"
  | "COMPENSATE_HOLD"
  | "COMPENSATE_PAYMENT";

export type DccSagaStepStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "COMPENSATING"
  | "COMPENSATED"
  | "SKIPPED";

export interface DccRetryPolicy {
  maxRetries: number;
  backoffMs: number;
  maxBackoffMs: number;
  factor: number;
  timeoutMs?: number;
}

export const DEFAULT_SAGA_RETRY_POLICY: DccRetryPolicy = {
  maxRetries: 3,
  backoffMs: 200,
  maxBackoffMs: 2000,
  factor: 2,
  timeoutMs: 10000,
};

export interface DccSagaStepRecord {
  id: string; // dcc:saga:step:...
  sagaId: string;
  orderId: string;
  stepName: DccSagaStepName;
  stepIndex: number;
  status: DccSagaStepStatus;
  idempotencyKey: string;
  attemptCount: number;
  maxRetries: number;
  retryPolicy: DccRetryPolicy;
  nextRetryAt?: string | null;
  externalReferenceId?: string | null;
  inputPayload: Record<string, unknown>;
  outputPayload?: Record<string, unknown> | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  compensationStatus: "NOT_APPLICABLE" | "PENDING" | "EXECUTED" | "FAILED";
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DccSupplierBookingRecord {
  id: string; // dcc:sbk:...
  orderId: string;
  orderItemId: string;
  supplierConnectionId: string;
  operatorSlug: string;
  operatorName: string;
  productId: string;
  optionId: string;
  availabilityId: string;
  providerBookingId?: string | null;
  providerBookingUuid?: string | null;
  status: "PENDING_HOLD" | "ON_HOLD" | "CONFIRMED" | "CANCELLED" | "FAILED" | "EXPIRED";
  holdExpiresAt?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  price: number;
  currency: string;
  unitItems: unknown[];
  idempotencyKey?: string | null;
  idempotencyHash?: string | null;
  externalRequestId?: string | null;
  attemptCount: number;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  voucherCode?: string | null;
  voucherUrl?: string | null;
  voucherInstructions?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DccSagaAuditEventRecord {
  id: number;
  sagaId: string;
  orderId: string;
  stepId?: string | null;
  eventType: string;
  action: string;
  entityType: string;
  entityId: string;
  idempotencyKey?: string | null;
  attemptNumber: number;
  status: "SUCCESS" | "FAILURE" | "RETRYING" | "COMPENSATING";
  errorCode?: string | null;
  errorMessage?: string | null;
  sanitizedDetails: Record<string, unknown>;
  occurredAt: string;
}

export interface DccSagaExecutionOptions {
  simulatedErrors?: {
    holdFailureSupplierConnectionId?: string;
    holdFailureOptionId?: string;
    failPaymentAuthorization?: boolean;
    failPaymentCapture?: boolean;
    failSupplierConfirmation?: boolean;
    failSupplierConfirmationBookingUuid?: string;
    simulateExpiredHold?: boolean;
    simulateCompensationTimeout?: boolean;
  };
  retryPolicy?: Partial<DccRetryPolicy>;
}

export interface DccSagaResult {
  sagaId: string;
  orderId: string;
  status: DccSagaStatus;
  successful: boolean;
  steps: DccSagaStepRecord[];
  errorCode?: string;
  errorMessage?: string;
  supplierBookings: DccSupplierBookingRecord[];
  paymentId?: string;
}
