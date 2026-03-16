import { getTelnyxGeminiClient, getTelnyxConfig } from "@/lib/telnyx/config";

const STOP_KEYWORDS = new Set(["stop", "stopall", "unsubscribe", "cancel", "end", "quit"]);
const HELP_KEYWORDS = new Set(["help", "support"]);

function compactSms(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length <= 320 ? cleaned : `${cleaned.slice(0, 317).trim()}...`;
}

export function getTelnyxKeywordResponse(message: string): string | null {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return "Thanks for reaching out. Send HELP for contact details.";
  if (STOP_KEYWORDS.has(normalized)) {
    return "You’re opted out and won’t receive more texts from DCC on this number. Reply START to re-subscribe.";
  }
  if (normalized === "start") {
    return "You’re opted back in for DCC text updates. Reply HELP for support.";
  }
  if (HELP_KEYWORDS.has(normalized)) {
    return "DCC support: reply with your question and our automated assistant will help. For urgent issues email support@destinationcommandcenter.com.";
  }
  return null;
}

export async function generateTelnyxAiReply(input: {
  from: string;
  text: string;
}): Promise<string> {
  const keywordResponse = getTelnyxKeywordResponse(input.text);
  if (keywordResponse) return keywordResponse;

  const client = getTelnyxGeminiClient();
  if (!client) {
    return "Thanks for texting DCC. We got your message and our automated assistant is being connected. Reply HELP if you need support details.";
  }

  const config = getTelnyxConfig();
  const model = client.getGenerativeModel({ model: config.geminiModel });
  const result = await model.generateContent([
    config.aiSystemPrompt,
    `Customer phone: ${input.from}`,
    `Customer message: ${input.text}`,
    "Reply as DCC by SMS only. Keep it direct, useful, and under 320 characters.",
  ]);
  const text = result.response.text();

  return compactSms(
    text || "Thanks for texting DCC. We got your message and will reply shortly."
  );
}
