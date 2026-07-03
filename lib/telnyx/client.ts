import Telnyx from "telnyx";
import { getTelnyxConfig } from "@/lib/telnyx/config";

let cachedClient: Telnyx | null = null;

export function getTelnyxClient(): Telnyx {
  if (cachedClient) return cachedClient;

  const config = getTelnyxConfig();
  if (!config.apiKey) throw new Error("missing_telnyx_api_key");

  cachedClient = new Telnyx({
    apiKey: config.apiKey,
    publicKey: config.publicKey || undefined,
    timeout: 20_000,
    maxRetries: 2,
  });

  return cachedClient;
}

export async function sendTelnyxSms(input: {
  to: string;
  text: string;
  from?: string;
}): Promise<{ id: string | null }> {
  const config = getTelnyxConfig();
  const from = input.from || config.fromNumber;
  if (!config.apiKey || !from) {
    console.log(`[MOCK Telnyx SMS] From: ${from || "DCC_MOCK"} -> To: ${input.to}\nContent:\n${input.text}`);
    return {
      id: `mock-msg-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  const response = await getTelnyxClient().messages.send({
    from,
    to: input.to,
    text: input.text,
    messaging_profile_id: config.messagingProfileId || undefined,
  });

  return {
    id: response.data?.id || null,
  };
}
