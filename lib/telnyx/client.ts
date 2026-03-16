import { getTelnyxConfig } from "@/lib/telnyx/config";

export async function sendTelnyxSms(input: {
  to: string;
  text: string;
  from?: string;
}): Promise<{ id: string | null }> {
  const config = getTelnyxConfig();
  if (!config.apiKey) throw new Error("missing_telnyx_api_key");

  const from = input.from || config.fromNumber;
  if (!from) throw new Error("missing_telnyx_from_number");

  const response = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      text: input.text,
      messaging_profile_id: config.messagingProfileId || undefined,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = (await response.text()).slice(0, 300);
    throw new Error(`telnyx_send_failed_${response.status}:${message}`);
  }

  const json = (await response.json()) as { data?: { id?: string } };
  return {
    id: json?.data?.id || null,
  };
}
