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
  if (!from) throw new Error("missing_telnyx_from_number");

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
