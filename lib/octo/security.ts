import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Returns a 32-byte encryption key from environment.
 * Ensures data is safely encrypted at rest.
 * In production (NODE_ENV === 'production'), a dedicated OCTO_ENCRYPTION_KEY is strictly required.
 */
function getEncryptionKey(): Buffer {
  const isProd = process.env.NODE_ENV === "production";
  const explicitKey = process.env.OCTO_ENCRYPTION_KEY;

  if (isProd) {
    if (!explicitKey) {
      throw new Error(
        "SECURITY_CRITICAL: OCTO_ENCRYPTION_KEY is required in production environment. " +
        "Silent fallback to secondary secrets is prohibited."
      );
    }
    return crypto.createHash("sha256").update(explicitKey).digest();
  }

  // Non-production development/testing fallback
  const envSecret =
    explicitKey ||
    process.env.INTERNAL_API_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dcc-octo-sovereign-vault-secret-2026";

  return crypto.createHash("sha256").update(envSecret).digest();
}

export interface EncryptedPayload {
  ciphertext: string; // hex
  iv: string; // hex
  tag: string; // hex
}

/**
 * Encrypt sensitive supplier credentials at rest using AES-256-GCM
 */
export function encryptCredential(plainText: string): string {
  if (!plainText) return "";

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  // Serialized format: iv:tag:ciphertext
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive supplier credentials for server-side API communication only
 */
export function decryptCredential(encryptedString: string): string {
  if (!encryptedString) return "";

  const parts = encryptedString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted credential format");
  }

  const [ivHex, tagHex, ciphertext] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Mask credentials for display or audit trails (e.g. "octo_live_...9f2a")
 * Never exposes full secret keys.
 */
export function maskCredential(rawCredential?: string): string {
  if (!rawCredential) return "none";
  if (rawCredential.length <= 8) return "********";
  const start = rawCredential.slice(0, 4);
  const end = rawCredential.slice(-4);
  return `${start}...${end}`;
}

/**
 * Verifies signed webhooks from OCTO suppliers when supported
 */
export function verifyOctoWebhookSignature(
  payload: string,
  signatureHeader: string | null,
  webhookSecret: string
): boolean {
  if (!signatureHeader || !webhookSecret) return false;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}
