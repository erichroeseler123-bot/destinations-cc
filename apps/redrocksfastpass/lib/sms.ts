function read(name: string) {
  return String(process.env[name] || "").trim();
}

function getTelnyxConfig() {
  return {
    apiKey: read("TELNYX_API_KEY"),
    fromNumber: read("TELNYX_FROM_NUMBER") || read("TELNYX_PHONE_NUMBER"),
    messagingProfileId: read("TELNYX_MESSAGING_PROFILE_ID"),
  };
}

export async function sendSms(to: string, text: string) {
  const config = getTelnyxConfig();
  if (!config.apiKey) throw new Error("missing_telnyx_api_key");
  if (!config.fromNumber) throw new Error("missing_telnyx_from_number");

  const response = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.fromNumber,
      to,
      text,
      messaging_profile_id: config.messagingProfileId || undefined,
    }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.errors?.[0]?.detail || "telnyx_send_failed");
  }

  return data;
}
