import "server-only";

import { createHash } from "node:crypto";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { brands, type BrandId } from "@/lib/mailer/brands";

type MissionTemplateFactory<TContext extends Record<string, unknown>> = (
  context: TContext,
) => ReactElement;

export type MissionNotificationResult = {
  success: boolean;
  messageId?: string;
  error?: string;
  toCount: number;
  ccCount: number;
  bccCount: number;
  recipientsHash: string;
};

export type SendMissionNotificationInput<TContext extends Record<string, unknown>> = {
  missionId: string;
  template: MissionTemplateFactory<TContext>;
  brandId?: BrandId;
  context: TContext;
  subject?: string;
};

const resend = new Resend(process.env.DCC_RESEND_API_KEY);

export function parseEmailList(value?: string): string[] {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function hashRecipients(recipients: string[]): string {
  const normalized = recipients.map((item) => item.toLowerCase()).sort().join(",");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 24);
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "unknown_mailer_error";
  }
}

export async function sendMissionNotification<TContext extends Record<string, unknown>>({
  missionId,
  template,
  brandId = "DCC",
  context,
  subject,
}: SendMissionNotificationInput<TContext>): Promise<MissionNotificationResult> {
  const brand = brands[brandId];
  const to = parseEmailList(process.env.EARTHOS_APPROVAL_TO);
  const cc = parseEmailList(process.env.EARTHOS_APPROVAL_CC);
  const bcc = parseEmailList(process.env.EARTHOS_APPROVAL_BCC);
  const recipientsHash = hashRecipients([...to, ...cc, ...bcc]);

  const baseResult = {
    toCount: to.length,
    ccCount: cc.length,
    bccCount: bcc.length,
    recipientsHash,
  };

  if (!process.env.DCC_RESEND_API_KEY) {
    return {
      success: false,
      error: "DCC_RESEND_API_KEY is not configured",
      ...baseResult,
    };
  }

  if (!brand.from) {
    return {
      success: false,
      error: `MAIL_FROM for ${brandId} is not configured`,
      ...baseResult,
    };
  }

  if (to.length === 0) {
    return {
      success: false,
      error: "EARTHOS_APPROVAL_TO is not configured",
      ...baseResult,
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: brand.from,
      replyTo: brand.replyTo,
      to,
      cc: cc.length ? cc : undefined,
      bcc: bcc.length ? bcc : undefined,
      subject: subject || `[${brandId}] Mission Approval Required: ${missionId}`,
      react: template(context),
      headers: {
        "X-Entity-Ref-ID": missionId,
      },
    });

    if (error) {
      return {
        success: false,
        error: stringifyError(error),
        ...baseResult,
      };
    }

    return {
      success: true,
      messageId: data?.id,
      ...baseResult,
    };
  } catch (error) {
    return {
      success: false,
      error: stringifyError(error),
      ...baseResult,
    };
  }
}
