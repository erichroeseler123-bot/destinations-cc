"use client";

import { useState } from "react";

type BookingQuestionSummary = {
  id: string;
  label: string;
  required: boolean;
  type: string | null;
};

type ViatorBookingQuestionsCardProps = {
  productCode: string | null;
  questionRefs?: string[];
};

type QuestionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; questions: BookingQuestionSummary[]; count: number };

export default function ViatorBookingQuestionsCard({
  productCode,
  questionRefs = [],
}: ViatorBookingQuestionsCardProps) {
  const [state, setState] = useState<QuestionState>({ status: "idle" });

  if (!productCode) return null;

  async function handleLoadQuestions(forceRefresh = false) {
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/internal/viator/booking-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productCode, forceRefresh }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
        count?: number;
        questions?: BookingQuestionSummary[];
      };

      if (!response.ok || !json.ok) {
        setState({ status: "error", message: json.error || "Failed to load booking questions." });
        return;
      }

      setState({
        status: "success",
        questions: Array.isArray(json.questions) ? json.questions : [],
        count: typeof json.count === "number" ? json.count : 0,
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load booking questions.",
      });
    }
  }

  return (
    <section className="mb-16 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <h3 className="text-cyan-400">Booking questions</h3>
      <p className="mt-2 text-sm text-zinc-300">
        This shows the traveler information fields Viator may require before booking can be submitted.
      </p>

      {questionRefs.length > 0 ? (
        <p className="mt-3 text-sm text-zinc-400">
          Product detail already references {questionRefs.length} question field{questionRefs.length === 1 ? "" : "s"}.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleLoadQuestions(false)}
          disabled={state.status === "loading"}
          className="rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.status === "loading" ? "Loading..." : "Load booking questions"}
        </button>
        <button
          type="button"
          onClick={() => handleLoadQuestions(true)}
          disabled={state.status === "loading"}
          className="rounded-xl border border-zinc-700 bg-black/20 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Force refresh
        </button>
      </div>

      {state.status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {state.message}
        </div>
      ) : null}

      {state.status === "success" ? (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-zinc-300">
            {state.count} booking question{state.count === 1 ? "" : "s"} returned.
          </p>
          <div className="grid gap-3">
            {state.questions.map((question) => (
              <div key={question.id} className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{question.label}</p>
                  {question.required ? (
                    <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200">
                      Required
                    </span>
                  ) : null}
                  {question.type ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300">
                      {question.type}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-zinc-500">Question ID: {question.id}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

