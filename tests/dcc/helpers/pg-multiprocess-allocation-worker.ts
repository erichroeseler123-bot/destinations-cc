import fs from "node:fs";
import { DccPaymentService } from "../../../lib/payments/paymentService";
import { OctoApiError } from "../../../lib/octo/adapters/base";

type WorkerPayload =
  | {
      mode: "assert_evidence";
      barrierFile?: string;
      transactionId: string;
      orderId: string;
      bookingId: string;
      amount: number;
      capturedAt: string;
    }
  | {
      mode: "adjust_allocation";
      barrierFile?: string;
      paymentId: string;
      orderId: string;
      bookingId: string;
      newAllocatedAmount: number;
    }
  | {
      mode: "process_refund";
      barrierFile?: string;
      orderId: string;
      bookingId: string;
      amount: number;
      refundId: string;
    };

async function waitForBarrier(barrierFile?: string) {
  if (!barrierFile) return;
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (fs.existsSync(barrierFile)) {
      return;
    }
    await new Promise((r) => setTimeout(r, 10));
  }
}

async function writeResultAndExit(
  resultObj: Record<string, any>,
  resultFile: string | undefined,
  code: number
): Promise<never> {
  const jsonStr = JSON.stringify(resultObj);
  if (resultFile) {
    try {
      fs.writeFileSync(resultFile, jsonStr, "utf8");
    } catch {}
  }
  await new Promise<void>((resolve) => {
    process.stdout.write(`RESULT_JSON:${jsonStr}\n`, () => resolve());
  });
  process.exit(code);
}

async function main() {
  const rawArg = process.env.DCC_WORKER_PAYLOAD_JSON || process.argv[2];
  if (!rawArg) {
    console.error("Missing worker payload argument");
    process.exit(2);
  }
  const payload = JSON.parse(rawArg) as WorkerPayload & { resultFile?: string };

  // Signal ready before waiting on barrier
  await new Promise<void>((resolve) => {
    process.stdout.write("WORKER_READY\n", () => resolve());
  });
  await waitForBarrier(payload.barrierFile);

  try {
    if (payload.mode === "assert_evidence") {
      const res = await DccPaymentService.assertTraceablePaymentEvidence(
        {
          verified: true,
          provider: "square",
          transactionId: payload.transactionId,
          capturedAmount: payload.amount,
          currency: "USD",
          capturedAt: payload.capturedAt,
          provenanceSource: "provider_api_response",
        },
        payload.amount,
        {
          orderId: payload.orderId,
          bookingId: payload.bookingId,
        }
      );
      await writeResultAndExit(
        { ok: true, bookingId: res.bookingId, amount: payload.amount },
        payload.resultFile,
        0
      );
    } else if (payload.mode === "adjust_allocation") {
      const res = await DccPaymentService.adjustPaymentObligationAllocation({
        paymentId: payload.paymentId,
        orderId: payload.orderId,
        bookingId: payload.bookingId,
        newAllocatedAmount: payload.newAllocatedAmount,
      });
      await writeResultAndExit({ ok: true, ...res }, payload.resultFile, 0);
    } else if (payload.mode === "process_refund") {
      const res = await DccPaymentService.processRefund({
        orderId: payload.orderId,
        bookingId: payload.bookingId,
        operatorSlug: "gosno",
        amount: payload.amount,
        currency: "USD",
        type: "refund",
        reason: "Multi-process Postgres transactional refund test",
        options: {
          squareClient: {
            refunds: {
              refundPayment: async (req: any) => ({
                refund: {
                  id: payload.refundId,
                  status: "COMPLETED",
                  amountMoney: req.amountMoney,
                },
              }),
            },
          },
        },
      });
      await writeResultAndExit(
        { ok: true, refundId: res.id, status: res.status },
        payload.resultFile,
        0
      );
    }
  } catch (err: any) {
    if (
      err instanceof OctoApiError ||
      (err && typeof err.status === "number" && typeof err.code === "string")
    ) {
      await writeResultAndExit(
        {
          ok: false,
          status: err.status,
          code: err.code,
          message: err.message,
        },
        payload.resultFile,
        0
      );
    }
    await writeResultAndExit(
      {
        ok: false,
        status: 500,
        code: "UNEXPECTED_ERROR",
        message: err?.message || String(err),
      },
      payload.resultFile,
      1
    );
  }
}

main();
