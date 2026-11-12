export const VERIFIED_DCC_RESEND_SENDER_DOMAINS = new Set<string>([
  "destinationcommandcenter.com",
  "juneauflightdeck.com",
  "frenchquarterorientation.com",
  "partyatredrocks.com",
  "rollcallusa.com",
  "redrocksdd.com",
  "vibearoundtown.com",
  "bluehillsoutpost.com",
  "feastlyspread.com",
]);

/**
 * Domains with 0 MX records or NXDOMAIN that must NEVER be used as `to`,
 * `cc`, `bcc`, or `replyTo` / `reply_to` recipients.
 */
const ZERO_MX_OR_NXDOMAIN_RECIPIENT_DOMAINS = new Set<string>([
  "destinations-cc.com",
  "destinationcommandcenter.com",
]);

const SIMPLE_EMAIL_RE = /^[^\s@<>]+@([^\s@<>]+\.[^\s@<>]+)$/;

export const DEFAULT_DCC_SYSTEM_FROM =
  "DCC Ops <alerts@destinationcommandcenter.com>";
export const DEFAULT_DCC_OWNER_RECIPIENT = "erichroeseler123@gmail.com";

export const DEFAULT_SOMERSET_FROM =
  "Shuttle to Somerset <bookings@partyatredrocks.com>";
export const DEFAULT_SOMERSET_DISPATCH_TO = "hello@partyatredrocks.com";

export const DEFAULT_WNO_FROM =
  "Welcome to New Orleans Tours <updates@destinationcommandcenter.com>";
export const DEFAULT_WNO_REPLY_TO = "help@welcometoneworleanstours.com";

export function extractEmailAddress(raw: string | null | undefined): string | null {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;
  const angleMatch = trimmed.match(/<([^<>]+)>/);
  const candidate = (angleMatch ? angleMatch[1] : trimmed).trim();
  return SIMPLE_EMAIL_RE.test(candidate) ? candidate : null;
}

export function extractEmailDomain(raw: string | null | undefined): string | null {
  const email = extractEmailAddress(raw);
  if (!email) return null;
  const atIdx = email.lastIndexOf("@");
  return atIdx > 0 ? email.slice(atIdx + 1).toLowerCase() : null;
}

export function isVerifiedResendSenderAddress(
  raw: string | null | undefined,
  allowedDomains?: ReadonlySet<string>,
): boolean {
  const domain = extractEmailDomain(raw);
  if (!domain) return false;
  if (!VERIFIED_DCC_RESEND_SENDER_DOMAINS.has(domain)) return false;
  if (allowedDomains && !allowedDomains.has(domain)) return false;
  return true;
}

export function isDeliverableMxRecipientAddress(
  raw: string | null | undefined,
): boolean {
  const domain = extractEmailDomain(raw);
  if (!domain) return false;
  return !ZERO_MX_OR_NXDOMAIN_RECIPIENT_DOMAINS.has(domain);
}

const ALLOWED_DCC_BRAND_SENDER_DOMAINS = new Set<string>([
  "destinationcommandcenter.com",
]);

const ALLOWED_SOMERSET_SENDER_DOMAINS = new Set<string>([
  "partyatredrocks.com",
  "destinationcommandcenter.com",
]);

const ALLOWED_WNO_SENDER_DOMAINS = new Set<string>([
  "destinationcommandcenter.com",
  "frenchquarterorientation.com",
]);

export function resolveSafeDccSystemFrom(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const candidate = (env.MAIL_FROM_DCC || "").trim();
  if (isVerifiedResendSenderAddress(candidate, ALLOWED_DCC_BRAND_SENDER_DOMAINS)) {
    return candidate;
  }
  return DEFAULT_DCC_SYSTEM_FROM;
}

export function resolveSafeDccReplyTo(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const candidate = extractEmailAddress(env.MAIL_REPLY_TO_DCC);
  if (candidate && isDeliverableMxRecipientAddress(candidate)) {
    return candidate;
  }
  return DEFAULT_DCC_OWNER_RECIPIENT;
}

export function resolveSafeDeliverableRecipients(
  sources: ReadonlyArray<string | null | undefined>,
  fallback: string,
  excludeLowerEmails: ReadonlySet<string> = new Set(),
): string[] {
  for (const source of sources) {
    const raw = (source || "").trim();
    if (!raw) continue;
    const valid = raw
      .split(",")
      .map((entry) => extractEmailAddress(entry))
      .filter((entry): entry is string => {
        if (!entry) return false;
        if (excludeLowerEmails.has(entry.toLowerCase())) return false;
        return isDeliverableMxRecipientAddress(entry);
      });
    if (valid.length > 0) {
      return [...new Set(valid)];
    }
  }
  return fallback ? [fallback] : [];
}

export function resolveSafeDccOwnerRecipients(
  env: NodeJS.ProcessEnv = process.env,
  excludeCustomerEmail?: string | null,
): string[] {
  const exclude = new Set<string>();
  if (excludeCustomerEmail?.trim()) {
    exclude.add(excludeCustomerEmail.trim().toLowerCase());
  }
  return resolveSafeDeliverableRecipients(
    [env.EARTHOS_APPROVAL_TO],
    DEFAULT_DCC_OWNER_RECIPIENT,
    exclude,
  );
}

export function resolveSafeSomersetFrom(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const candidates = [env.SOMERSET_FROM_EMAIL, env.PARR_PRIVATE_FROM_EMAIL];
  for (const candidate of candidates) {
    const trimmed = (candidate || "").trim();
    if (isVerifiedResendSenderAddress(trimmed, ALLOWED_SOMERSET_SENDER_DOMAINS)) {
      return trimmed;
    }
  }
  return DEFAULT_SOMERSET_FROM;
}

export function resolveSafeSomersetRecipients(
  env: NodeJS.ProcessEnv = process.env,
  excludeCustomerEmail?: string | null,
): string[] {
  const exclude = new Set<string>();
  if (excludeCustomerEmail?.trim()) {
    exclude.add(excludeCustomerEmail.trim().toLowerCase());
  }
  return resolveSafeDeliverableRecipients(
    [env.SOMERSET_DISPATCH_TO_EMAIL, env.EARTHOS_APPROVAL_TO],
    DEFAULT_SOMERSET_DISPATCH_TO,
    exclude,
  );
}

export function resolveSafeWnoFrom(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const candidate = (env.MAIL_FROM_WNO || "").trim();
  if (isVerifiedResendSenderAddress(candidate, ALLOWED_WNO_SENDER_DOMAINS)) {
    return candidate;
  }
  return DEFAULT_WNO_FROM;
}

export function resolveSafeWnoReplyTo(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const candidate = extractEmailAddress(env.MAIL_REPLY_TO_WNO);
  if (candidate && isDeliverableMxRecipientAddress(candidate)) {
    return candidate;
  }
  return DEFAULT_WNO_REPLY_TO;
}

export const brands = {
  DCC: {
    get from(): string {
      return resolveSafeDccSystemFrom(process.env);
    },
    get replyTo(): string {
      return resolveSafeDccReplyTo(process.env);
    },
    name: "DCC Ops",
    get baseUrl(): string {
      return (
        process.env.DCC_PUBLIC_BASE_URL ||
        "https://www.destinationcommandcenter.com"
      );
    },
  },
  // Future satellite identities stay scoped here to prevent brand/header bleed.
  // GOSNO: {
  //   from: process.env.MAIL_FROM_GOSNO,
  //   replyTo: process.env.MAIL_REPLY_TO_GOSNO,
  //   name: "GoSno LLC",
  //   baseUrl: "https://gosno.co",
  // },
  // FEASTLY: {
  //   from: process.env.MAIL_FROM_FEASTLY,
  //   replyTo: process.env.MAIL_REPLY_TO_FEASTLY,
  //   name: "Feastly",
  //   baseUrl: "https://feastlyspread.com",
  // },
  // PARR: {
  //   from: process.env.MAIL_FROM_PARR,
  //   replyTo: process.env.MAIL_REPLY_TO_PARR,
  //   name: "Party at Red Rocks",
  //   baseUrl: "https://partyatredrocks.com",
  // },
} as const;

export type BrandId = keyof typeof brands;
