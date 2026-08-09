import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildAskDccPrompt, fallbackAskDccAnswer, getAskDccEvidence } from "@/lib/dcc/ask/service";
import { normalizeAskSessionId, recordAskDccEvent, redactAskQuestion } from "@/lib/dcc/ask/telemetry";

export const runtime = "nodejs";
const MAX_MESSAGES = 8;
const MAX_MESSAGE_LENGTH = 1800;

function safeMessages(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is { role: "user" | "assistant"; content: string } => Boolean(item) && typeof item === "object" && ["user", "assistant"].includes(String((item as any).role)) && typeof (item as any).content === "string")
    .slice(-MAX_MESSAGES).map((item) => ({ role: item.role, content: item.content.trim().slice(0, MAX_MESSAGE_LENGTH) })).filter((item) => item.content.length > 0);
}

function routeTargetFromHref(href: string | undefined) {
  if (!href) return null;
  try { return new URL(href).hostname.replace(/^www\./, ""); } catch { return null; }
}

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const messages = safeMessages(body?.messages);
  const question = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  if (!question) return NextResponse.json({ error: "Ask DCC needs a question." }, { status: 400 });

  const sessionId = normalizeAskSessionId(body?.sessionId);
  const safeQuestion = redactAskQuestion(question);
  await recordAskDccEvent({
    eventName: "destination_selected",
    sessionId,
    metadata: {
      ask_stage: "question_submitted",
      question: safeQuestion,
      question_length: question.length,
      turn_number: messages.filter((message) => message.role === "user").length,
    },
  });

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

  const sourceSlugs = evidence.sources.map((source) => source.slug);
  await recordAskDccEvent({
    eventName: "recommendation_rendered",
    sessionId,
    targetPath: evidence.handoff?.href || null,
    routeTarget: routeTargetFromHref(evidence.handoff?.href),
    metadata: {
      ask_stage: "answer_rendered",
      question: safeQuestion,
      answer_mode: mode,
      confidence: evidence.confidence,
      source_slugs: sourceSlugs,
      source_count: sourceSlugs.length,
      handoff_site: evidence.handoff?.siteName || null,
    },
  });

  if (evidence.handoff) {
    await recordAskDccEvent({
      eventName: "handoff_viewed",
      sessionId,
      targetPath: evidence.handoff.href,
      routeTarget: routeTargetFromHref(evidence.handoff.href),
      metadata: {
        ask_stage: "handoff_offered",
        question: safeQuestion,
        handoff_site: evidence.handoff.siteName,
        handoff_reason: evidence.handoff.reason,
        source_slugs: sourceSlugs,
      },
    });
  }

  return NextResponse.json({ answer, mode, confidence: evidence.confidence, sources: evidence.sources.map(({ answer: _answer, ...source }) => source), handoff: evidence.handoff });
}
