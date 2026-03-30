"use client";

import { useState } from "react";
import type {
  ViatorHoldRequestDraft,
  ViatorPrebookState,
  ViatorPreparedBooking,
} from "@/lib/viator/schema";
import ViatorPaymentSessionCard from "@/app/components/dcc/ViatorPaymentSessionCard";

type ViatorPrebookStateCardProps = {
  productCode: string | null;
  currency?: string | null;
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; prebook: ViatorPrebookState };

type PreparedState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; prepared: ViatorPreparedBooking };

type HoldState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; executed: boolean; draft: ViatorHoldRequestDraft; response?: unknown };

export default function ViatorPrebookStateCard({
  productCode,
  currency = "USD",
}: ViatorPrebookStateCardProps) {
  const [travelDate, setTravelDate] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [state, setState] = useState<State>({ status: "idle" });
  const [preparedState, setPreparedState] = useState<PreparedState>({ status: "idle" });
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [holdState, setHoldState] = useState<HoldState>({ status: "idle" });

  if (!productCode) return null;

  async function handleBuildState() {
    setState({ status: "loading" });
    setPreparedState({ status: "idle" });
    setHoldState({ status: "idle" });

    try {
      const response = await fetch("/api/internal/viator/prebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode,
          travelDate,
          adults,
          children,
          currency,
          answers,
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
        state?: ViatorPrebookState;
      };

      if (!response.ok || !json.ok || !json.state) {
        setState({ status: "error", message: json.error || "Failed to build pre-book state." });
        return;
      }

      setState({ status: "success", prebook: json.state });
      const options = json.state.bookableOptions || [];
      setSelectedOptionId(options.length === 1 ? options[0].id : "");
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to build pre-book state.",
      });
    }
  }

  async function handlePrepareBooking() {
    setPreparedState({ status: "loading" });
    setHoldState({ status: "idle" });

    try {
      const response = await fetch("/api/internal/viator/prepare-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode,
          travelDate,
          adults,
          children,
          currency,
          answers,
          selectedOptionId: selectedOptionId || null,
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
        prepared?: ViatorPreparedBooking;
      };

      if (!response.ok || !json.ok || !json.prepared) {
        setPreparedState({
          status: "error",
          message: json.error || "Failed to prepare booking payload.",
        });
        return;
      }

      setPreparedState({ status: "success", prepared: json.prepared });
    } catch (error) {
      setPreparedState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to prepare booking payload.",
      });
    }
  }

  async function handleCartHold(execute: boolean) {
    if (preparedState.status !== "success") return;
    setHoldState({ status: "loading" });

    try {
      const response = await fetch("/api/internal/viator/cart-hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preparationId: preparedState.prepared.preparationId,
          firstName,
          lastName,
          email,
          phone,
          execute,
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
        draft?: ViatorHoldRequestDraft;
        response?: unknown;
        executed?: boolean;
      };

      if (!response.ok || !json.ok || !json.draft) {
        setHoldState({
          status: "error",
          message: json.error || "Failed to build cart hold request.",
        });
        return;
      }

      setHoldState({
        status: "success",
        executed: json.executed === true,
        draft: json.draft,
        response: json.response,
      });
    } catch (error) {
      setHoldState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to build cart hold request.",
      });
    }
  }

  const questions = state.status === "success" ? state.prebook.bookingQuestions : [];

  return (
    <section className="mb-16 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <h3 className="text-cyan-400">Pre-book state builder</h3>
      <p className="mt-2 text-sm text-zinc-300">
        This combines date, passenger mix, availability, and booking questions into one structured pre-book payload.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-4 md:items-end">
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Travel date</span>
          <input
            type="date"
            value={travelDate}
            onChange={(event) => setTravelDate(event.target.value)}
            className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Adults</span>
          <input
            type="number"
            min="1"
            step="1"
            value={adults}
            onChange={(event) => setAdults(event.target.value)}
            className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Children</span>
          <input
            type="number"
            min="0"
            step="1"
            value={children}
            onChange={(event) => setChildren(event.target.value)}
            className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
          />
        </label>
        <button
          type="button"
          onClick={handleBuildState}
          disabled={state.status === "loading"}
          className="rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.status === "loading" ? "Building..." : "Build pre-book state"}
        </button>
      </div>

      {questions.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {questions.map((question) => (
            <label key={question.id} className="grid gap-2">
              <span className="text-sm text-zinc-200">
                {question.label}
                {question.required ? " *" : ""}
              </span>
              <input
                value={answers[question.id] || ""}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: event.target.value,
                  }))
                }
                className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
                placeholder={question.type || "answer"}
              />
            </label>
          ))}
        </div>
      ) : null}

      {state.status === "success" && state.prebook.bookableOptions.length > 0 ? (
        <label className="mt-5 grid gap-2">
          <span className="text-sm text-zinc-200">Select bookable option</span>
          <select
            value={selectedOptionId}
            onChange={(event) => setSelectedOptionId(event.target.value)}
            className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
          >
            <option value="">Choose an option</option>
            {state.prebook.bookableOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
                {option.startTime ? ` - ${option.startTime}` : ""}
                {typeof option.price === "number" ? ` - ${option.price}` : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {state.status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {state.message}
        </div>
      ) : null}

      {state.status === "success" ? (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p>
            Bookable options: {state.prebook.availabilitySummary.optionCount}. Ready for hold:{" "}
            {state.prebook.readyForHold ? "yes" : "no"}.
          </p>
          <button
            type="button"
            onClick={handlePrepareBooking}
            disabled={preparedState.status === "loading"}
            className="mt-4 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {preparedState.status === "loading" ? "Preparing..." : "Prepare server-side booking payload"}
          </button>
          <details className="mt-3">
            <summary className="cursor-pointer text-emerald-200">Show pre-book payload</summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-emerald-100/90">
              {JSON.stringify(state.prebook, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}

      {preparedState.status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {preparedState.message}
        </div>
      ) : null}

      {preparedState.status === "success" ? (
        <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
          <p>
            Prepared booking ready for hold: {preparedState.prepared.validation.readyForHold ? "yes" : "no"}.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
              placeholder="First name"
            />
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
              placeholder="Last name"
            />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
              placeholder="Email"
            />
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
              placeholder="Phone"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleCartHold(false)}
              disabled={holdState.status === "loading"}
              className="rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Build hold draft
            </button>
            <button
              type="button"
              onClick={() => handleCartHold(true)}
              disabled={holdState.status === "loading"}
              className="rounded-xl border border-cyan-300/30 bg-white/5 px-4 py-3 text-sm font-semibold text-cyan-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Attempt live cart hold
            </button>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-cyan-200">Show prepared booking payload</summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-cyan-100/90">
              {JSON.stringify(preparedState.prepared, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}

      {holdState.status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {holdState.message}
        </div>
      ) : null}

      {holdState.status === "success" ? (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p>Cart hold {holdState.executed ? "executed" : "draft created"}.</p>
          <details className="mt-3">
            <summary className="cursor-pointer text-amber-200">Show hold request draft</summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-amber-100/90">
              {JSON.stringify(holdState.draft, null, 2)}
            </pre>
          </details>
          {holdState.response ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-amber-200">Show hold response</summary>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-amber-100/90">
                {JSON.stringify(holdState.response, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      ) : null}

      <ViatorPaymentSessionCard
        preparationId={preparedState.status === "success" ? preparedState.prepared.preparationId : null}
      />
    </section>
  );
}
