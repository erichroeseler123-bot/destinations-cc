import { GoogleGenerativeAI } from "@google/generative-ai";

export type TelnyxConfig = {
  apiKey: string;
  fromNumber: string;
  messagingProfileId: string;
  webhookSecret: string;
  aiSystemPrompt: string;
  geminiApiKey: string;
  geminiModel: string;
};

function read(name: string): string {
  return String(process.env[name] || "").trim();
}

export function getTelnyxConfig(): TelnyxConfig {
  return {
    apiKey: read("TELNYX_API_KEY"),
    fromNumber: read("TELNYX_FROM_NUMBER") || read("TELNYX_PHONE_NUMBER"),
    messagingProfileId: read("TELNYX_MESSAGING_PROFILE_ID"),
    webhookSecret: read("TELNYX_WEBHOOK_SECRET"),
    aiSystemPrompt:
      read("TELNYX_AI_SYSTEM_PROMPT") ||
      "You are the Destination Command Center SMS assistant. Reply in plain SMS, under 320 characters, helpful, direct, no markdown, no emojis unless clearly natural.",
    geminiApiKey: read("GEMINI_API_KEY"),
    geminiModel: read("TELNYX_AI_MODEL") || "gemini-1.5-flash",
  };
}

export function getTelnyxGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = getTelnyxConfig().geminiApiKey;
  return apiKey ? new GoogleGenerativeAI(apiKey) : null;
}
