import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildAskDccPrompt, fallbackAskDccAnswer, getAskDccEvidence } from "@/lib/dcc/ask/service";

export const runtime = "nodejs";
const MAX_MESSAGES = 8;
const MAX_MESSAGE_LENGTH = 1800;

function safeMessages(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is { role: "user" | "assistant"; content: string } => Boolean(item) && typeof item === "object" && ["user", "assistant"].includes(String((item as any).role)) && typeof (item as any).content === "string")
    .slice(-MAX_MESSAGES).map((item) => ({ role: item.role, content: item.content.trim().slice(0, MAX_MESSAGE_LENGTH) })).filter((item) => item.content.length > 0);
}

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const messages = safeMessages(body?.messages);
  const question = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  if (!question) return NextResponse.json({ error: "Ask DCC needs a question." }, { status: 400 });

  const evidence = getAskDccEvidence(question);
  let answer = fallbackAskDccAnswer(question, evidence);
  let mode: "graph" | "ai" = "graph";
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && evidence.sources.length > 0) {
    try {
      const client = new GoogleGenerativeAI(apiKey);
      const model = client.getGenerativeModel({ model: process.env.DCC_AI_MODEL || "gemini-3.6-flash" });
      const result = await model.generateContent(buildAskDccPrompt({ question, history: messages, evidence }));
      const generated = result.response.text().trim();
      if (generated) { answer = generated; mode = "ai"; }
    } catch (error) {
      console.error("Ask DCC model synthesis failed; using graph fallback", error);
    }
  }

  return NextResponse.json({ answer, mode, confidence: evidence.confidence, sources: evidence.sources.map(({ answer: _answer, ...source }) => source), handoff: evidence.handoff });
}
