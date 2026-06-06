type SendResendEmailInput = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  replyTo?: string | string[];
};

export async function sendResendEmail({
  from,
  to,
  subject,
  html,
  replyTo,
}: SendResendEmailInput) {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    return { sent: false as const, reason: "Email not configured." };
  }

  const replyToList = Array.isArray(replyTo)
    ? replyTo.map((value) => value.trim()).filter(Boolean)
    : typeof replyTo === "string" && replyTo.trim() !== ""
      ? [replyTo.trim()]
      : [];

  const upstream = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      ...(replyToList.length > 0 ? { reply_to: replyToList } : {}),
    }),
  });

  if (!upstream.ok) {
    const data = await upstream.json().catch(() => null);
    return { sent: false as const, reason: data?.message || "Resend rejected request." };
  }

  return { sent: true as const };
}
