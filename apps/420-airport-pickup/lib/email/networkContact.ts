import { sendResendEmail } from "./resend";

type NetworkContactEmailInput = {
  siteName: string;
  sourceSite: string;
  fromEmail: string;
  email: string;
  message: string;
  name?: string;
  sourcePath?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getNetworkContactForwardTo() {
  return process.env.NETWORK_CONTACT_FORWARD_TO?.trim() || "contact@gosno.co";
}

export async function sendNetworkContactEmail({
  siteName,
  sourceSite,
  fromEmail,
  email,
  message,
  name,
  sourcePath,
}: NetworkContactEmailInput) {
  const html = `
    <h2>${escapeHtml(siteName)} contact message</h2>
    <p><strong>Source site:</strong> ${escapeHtml(sourceSite)}</p>
    <p><strong>From email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Name:</strong> ${escapeHtml(name?.trim() || "Not provided")}</p>
    <p><strong>Source path:</strong> ${escapeHtml(sourcePath?.trim() || "/contact")}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
  `;

  return sendResendEmail({
    from: fromEmail,
    to: [getNetworkContactForwardTo()],
    subject: `[${siteName}] New contact message`,
    html,
    replyTo: email,
  });
}
