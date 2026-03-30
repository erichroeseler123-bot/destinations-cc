"use client";

import { useState } from "react";
import type { ViatorPaymentSession } from "@/lib/viator/schema";

type Props = {
  preparationId: string | null;
};

type SessionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; session: ViatorPaymentSession };

type TokenState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; response: unknown };

type BookingState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; response: unknown };

type CancelReasonsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; reasons: Array<{ reasonCode: string; label: string }> };

type CancelState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; response: unknown };

type AmendmentCheckState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; amendmentTypes: string[]; response: unknown };

type AmendmentState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; response: unknown; quoteReference?: string | null };

type SupplierState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      acknowledgements: Array<{ bookingRef: string; acknowledgeBy: string | null }>;
      response: unknown;
    };

export default function ViatorPaymentSessionCard({ preparationId }: Props) {
  const [sessionState, setSessionState] = useState<SessionState>({ status: "idle" });
  const [tokenState, setTokenState] = useState<TokenState>({ status: "idle" });
  const [bookingState, setBookingState] = useState<BookingState>({ status: "idle" });
  const [cancelReasonsState, setCancelReasonsState] = useState<CancelReasonsState>({ status: "idle" });
  const [cancelState, setCancelState] = useState<CancelState>({ status: "idle" });
  const [amendmentCheckState, setAmendmentCheckState] = useState<AmendmentCheckState>({ status: "idle" });
  const [amendmentState, setAmendmentState] = useState<AmendmentState>({ status: "idle" });
  const [supplierState, setSupplierState] = useState<SupplierState>({ status: "idle" });
  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [paymentToken, setPaymentToken] = useState("");
  const [cancellationReasonCode, setCancellationReasonCode] = useState("");
  const [amendmentType, setAmendmentType] = useState("");
  const [amendmentTravelDate, setAmendmentTravelDate] = useState("");
  const [quoteReference, setQuoteReference] = useState("");

  if (!preparationId) return null;

  async function loadSession() {
    setSessionState({ status: "loading" });
    setTokenState({ status: "idle" });
    setBookingState({ status: "idle" });
    setCancelState({ status: "idle" });
    setAmendmentCheckState({ status: "idle" });
    setAmendmentState({ status: "idle" });
    try {
      const response = await fetch("/api/internal/viator/payment-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preparationId }),
      });
      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
        session?: ViatorPaymentSession;
      };
      if (!response.ok || !json.ok || !json.session) {
        setSessionState({ status: "error", message: json.error || "Failed to load payment session." });
        return;
      }
      setSessionState({ status: "success", session: json.session });
    } catch (error) {
      setSessionState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load payment session.",
      });
    }
  }

  async function submitPaymentAccount() {
    setTokenState({ status: "loading" });
    setBookingState({ status: "idle" });
    try {
      const response = await fetch("/api/internal/viator/payment-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preparationId,
          cardNumber,
          cvv,
          expMonth,
          expYear,
          name,
          owner: { country, postalCode },
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        setTokenState({ status: "error", message: json.error || "Failed to submit payment account." });
        return;
      }
      setTokenState({ status: "success", response: json.response });
    } catch (error) {
      setTokenState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to submit payment account.",
      });
    }
  }

  async function submitCartBook(execute: boolean) {
    setBookingState({ status: "loading" });
    try {
      const response = await fetch("/api/internal/viator/cart-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preparationId,
          paymentToken: paymentToken || null,
          execute,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        setBookingState({ status: "error", message: json.error || "Failed to submit cart booking." });
        return;
      }
      setBookingState({ status: "success", response: json.response || json.draft || json });
    } catch (error) {
      setBookingState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to submit cart booking.",
      });
    }
  }

  async function loadBookingStatus() {
    setBookingState({ status: "loading" });
    try {
      const response = await fetch("/api/internal/viator/booking-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preparationId }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        setBookingState({ status: "error", message: json.error || "Failed to load booking status." });
        return;
      }
      setBookingState({ status: "success", response: json.response || json });
    } catch (error) {
      setBookingState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load booking status.",
      });
    }
  }

  async function loadCancelReasons() {
    setCancelReasonsState({ status: "loading" });
    try {
      const response = await fetch("/api/internal/viator/cancel-reasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preparationId }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok || !Array.isArray(json.reasons)) {
        setCancelReasonsState({ status: "error", message: json.error || "Failed to load cancellation reasons." });
        return;
      }
      setCancelReasonsState({ status: "success", reasons: json.reasons });
      if (!cancellationReasonCode && json.reasons[0]?.reasonCode) {
        setCancellationReasonCode(json.reasons[0].reasonCode);
      }
    } catch (error) {
      setCancelReasonsState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load cancellation reasons.",
      });
    }
  }

  async function loadCancelQuote() {
    setCancelState({ status: "loading" });
    try {
      const response = await fetch("/api/internal/viator/cancel-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preparationId }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        setCancelState({ status: "error", message: json.error || "Failed to load cancel quote." });
        return;
      }
      setCancelState({ status: "success", response: json.response || json });
    } catch (error) {
      setCancelState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load cancel quote.",
      });
    }
  }

  async function cancelBooking(execute: boolean) {
    setCancelState({ status: "loading" });
    try {
      const response = await fetch("/api/internal/viator/cancel-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preparationId,
          cancellationReasonCode,
          execute,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        setCancelState({ status: "error", message: json.error || "Failed to cancel booking." });
        return;
      }
      setCancelState({ status: "success", response: json.response || json.draft || json });
    } catch (error) {
      setCancelState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to cancel booking.",
      });
    }
  }

  async function loadAmendmentCheck() {
    setAmendmentCheckState({ status: "loading" });
    try {
      const response = await fetch("/api/internal/viator/amendment-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preparationId }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        setAmendmentCheckState({ status: "error", message: json.error || "Failed to load amendment check." });
        return;
      }
      const amendmentTypes = Array.isArray(json.amendmentTypes) ? json.amendmentTypes : [];
      setAmendmentCheckState({ status: "success", amendmentTypes, response: json.response || json });
      if (!amendmentType && amendmentTypes[0]) setAmendmentType(amendmentTypes[0]);
    } catch (error) {
      setAmendmentCheckState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load amendment check.",
      });
    }
  }

  async function loadAmendmentQuote() {
    setAmendmentState({ status: "loading" });
    try {
      const response = await fetch("/api/internal/viator/amendment-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preparationId,
          amendmentType,
          travelDate: amendmentTravelDate || null,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        setAmendmentState({ status: "error", message: json.error || "Failed to load amendment quote." });
        return;
      }
      const nextQuoteReference =
        typeof json.quoteReference === "string" && json.quoteReference.trim().length > 0
          ? json.quoteReference.trim()
          : "";
      if (nextQuoteReference) setQuoteReference(nextQuoteReference);
      setAmendmentState({
        status: "success",
        response: json.response || json,
        quoteReference: nextQuoteReference || null,
      });
    } catch (error) {
      setAmendmentState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load amendment quote.",
      });
    }
  }

  async function executeAmendment(execute: boolean) {
    setAmendmentState({ status: "loading" });
    try {
      const response = await fetch("/api/internal/viator/amend-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preparationId,
          quoteReference,
          execute,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        setAmendmentState({ status: "error", message: json.error || "Failed to amend booking." });
        return;
      }
      setAmendmentState({
        status: "success",
        response: json.response || json,
        quoteReference,
      });
    } catch (error) {
      setAmendmentState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to amend booking.",
      });
    }
  }

  async function loadSupplierEvents() {
    setSupplierState({ status: "loading" });
    try {
      const response = await fetch("/api/internal/viator/supplier-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        setSupplierState({ status: "error", message: json.error || "Failed to load supplier events." });
        return;
      }
      setSupplierState({
        status: "success",
        acknowledgements: Array.isArray(json.acknowledgements) ? json.acknowledgements : [],
        response: json,
      });
    } catch (error) {
      setSupplierState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load supplier events.",
      });
    }
  }

  async function acknowledgeSupplierEvents() {
    if (supplierState.status !== "success" || supplierState.acknowledgements.length === 0) return;
    setSupplierState({ status: "loading" });
    try {
      const response = await fetch("/api/internal/viator/supplier-events-ack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledgements: supplierState.acknowledgements }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        setSupplierState({ status: "error", message: json.error || "Failed to acknowledge supplier events." });
        return;
      }
      setSupplierState({
        status: "success",
        acknowledgements: [],
        response: json,
      });
    } catch (error) {
      setSupplierState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to acknowledge supplier events.",
      });
    }
  }

  return (
    <section className="mb-16 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <h3 className="text-cyan-400">Payment session</h3>
      <p className="mt-2 text-sm text-zinc-300">
        This loads payment session details from the cart hold response. `PARTNER_FORM` uses `paymentDataSubmissionUrl`; `VIATOR_FORM` uses `paymentSessionToken`.
      </p>
      <button
        type="button"
        onClick={loadSession}
        disabled={sessionState.status === "loading"}
        className="mt-4 rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sessionState.status === "loading" ? "Loading..." : "Load payment session"}
      </button>

      {sessionState.status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {sessionState.message}
        </div>
      ) : null}

      {sessionState.status === "success" ? (
        <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
          <p>Mode: {sessionState.session.paymentDataSubmissionMode || "unknown"}</p>
          {sessionState.session.paymentSessionToken ? (
            <p className="mt-2">Iframe token available: {sessionState.session.paymentSessionToken}</p>
          ) : null}
          {sessionState.session.hostingUrl ? <p className="mt-2">Hosting URL: {sessionState.session.hostingUrl}</p> : null}
          {sessionState.session.paymentDataSubmissionUrl ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-cyan-200">Show payment submission URL</summary>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-cyan-100/90">
                {sessionState.session.paymentDataSubmissionUrl}
              </pre>
            </details>
          ) : null}
        </div>
      ) : null}

      {sessionState.status === "success" && sessionState.session.paymentDataSubmissionMode === "PARTNER_FORM" ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white" placeholder="Cardholder name" />
          <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white" placeholder="Card number" />
          <input value={expMonth} onChange={(e) => setExpMonth(e.target.value)} className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white" placeholder="Exp month" />
          <input value={expYear} onChange={(e) => setExpYear(e.target.value)} className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white" placeholder="Exp year" />
          <input value={cvv} onChange={(e) => setCvv(e.target.value)} className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white" placeholder="CVV" />
          <input value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white" placeholder="Country code" />
          <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white" placeholder="Postal code" />
          <button
            type="button"
            onClick={submitPaymentAccount}
            disabled={tokenState.status === "loading"}
            className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {tokenState.status === "loading" ? "Submitting..." : "Submit payment account"}
          </button>
        </div>
      ) : null}

      {tokenState.status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {tokenState.message}
        </div>
      ) : null}

      {tokenState.status === "success" ? (
        <details className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <summary className="cursor-pointer text-emerald-200">Show payment account response</summary>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-emerald-100/90">
            {JSON.stringify(tokenState.response, null, 2)}
          </pre>
        </details>
      ) : null}

      {sessionState.status === "success" ? (
        <div className="mt-5 rounded-xl border border-zinc-800 bg-black/20 p-4">
          {sessionState.session.paymentDataSubmissionMode === "VIATOR_FORM" ? (
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
              <input
                value={paymentToken}
                onChange={(e) => setPaymentToken(e.target.value)}
                className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
                placeholder="Paste iframe paymentToken after submit success"
              />
              <button
                type="button"
                onClick={() => submitCartBook(false)}
                disabled={bookingState.status === "loading"}
                className="rounded-xl bg-zinc-700 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Draft cart book
              </button>
              <button
                type="button"
                onClick={() => submitCartBook(true)}
                disabled={bookingState.status === "loading"}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bookingState.status === "loading" ? "Booking..." : "Execute cart book"}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => submitCartBook(false)}
                disabled={bookingState.status === "loading"}
                className="rounded-xl bg-zinc-700 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Draft cart book
              </button>
              <button
                type="button"
                onClick={() => submitCartBook(true)}
                disabled={bookingState.status === "loading"}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bookingState.status === "loading" ? "Booking..." : "Execute cart book"}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={loadBookingStatus}
            disabled={bookingState.status === "loading"}
            className="mt-3 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Check booking status
          </button>
        </div>
      ) : null}

      {bookingState.status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {bookingState.message}
        </div>
      ) : null}

      {bookingState.status === "success" ? (
        <details className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-sm text-indigo-100">
          <summary className="cursor-pointer text-indigo-200">Show booking response</summary>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-indigo-100/90">
            {JSON.stringify(bookingState.response, null, 2)}
          </pre>
        </details>
      ) : null}

      <div className="mt-5 rounded-xl border border-zinc-800 bg-black/20 p-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadCancelReasons}
            disabled={cancelReasonsState.status === "loading"}
            className="rounded-xl bg-zinc-700 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelReasonsState.status === "loading" ? "Loading..." : "Load cancel reasons"}
          </button>
          <button
            type="button"
            onClick={loadCancelQuote}
            disabled={cancelState.status === "loading"}
            className="rounded-xl bg-rose-700 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelState.status === "loading" ? "Loading..." : "Load cancel quote"}
          </button>
        </div>

        {cancelReasonsState.status === "success" ? (
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
            <select
              value={cancellationReasonCode}
              onChange={(e) => setCancellationReasonCode(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
            >
              <option value="">Choose cancellation reason</option>
              {cancelReasonsState.reasons.map((reason) => (
                <option key={reason.reasonCode} value={reason.reasonCode}>
                  {reason.label} ({reason.reasonCode})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => cancelBooking(false)}
              disabled={cancelState.status === "loading"}
              className="rounded-xl bg-zinc-700 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Draft cancel
            </button>
            <button
              type="button"
              onClick={() => cancelBooking(true)}
              disabled={cancelState.status === "loading"}
              className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelState.status === "loading" ? "Cancelling..." : "Execute cancel"}
            </button>
          </div>
        ) : null}
      </div>

      {cancelReasonsState.status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {cancelReasonsState.message}
        </div>
      ) : null}

      {cancelState.status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {cancelState.message}
        </div>
      ) : null}

      {cancelState.status === "success" ? (
        <details className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
          <summary className="cursor-pointer text-rose-200">Show cancellation response</summary>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-rose-100/90">
            {JSON.stringify(cancelState.response, null, 2)}
          </pre>
        </details>
      ) : null}

      <div className="mt-5 rounded-xl border border-zinc-800 bg-black/20 p-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadAmendmentCheck}
            disabled={amendmentCheckState.status === "loading"}
            className="rounded-xl bg-zinc-700 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {amendmentCheckState.status === "loading" ? "Loading..." : "Load amendment check"}
          </button>
          <button
            type="button"
            onClick={loadAmendmentQuote}
            disabled={amendmentState.status === "loading"}
            className="rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {amendmentState.status === "loading" ? "Loading..." : "Load amendment quote"}
          </button>
        </div>

        {amendmentCheckState.status === "success" ? (
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <select
              value={amendmentType}
              onChange={(e) => setAmendmentType(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
            >
              <option value="">Choose amendment type</option>
              {amendmentCheckState.amendmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={amendmentTravelDate}
              onChange={(e) => setAmendmentTravelDate(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
            />
            <input
              value={quoteReference}
              onChange={(e) => setQuoteReference(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
              placeholder="Quote reference"
            />
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => executeAmendment(false)}
            disabled={amendmentState.status === "loading"}
            className="rounded-xl bg-zinc-700 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Draft amendment
          </button>
          <button
            type="button"
            onClick={() => executeAmendment(true)}
            disabled={amendmentState.status === "loading"}
            className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {amendmentState.status === "loading" ? "Amending..." : "Execute amendment"}
          </button>
        </div>
      </div>

      {amendmentCheckState.status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {amendmentCheckState.message}
        </div>
      ) : null}

      {amendmentState.status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {amendmentState.message}
        </div>
      ) : null}

      {amendmentState.status === "success" ? (
        <details className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-violet-100">
          <summary className="cursor-pointer text-violet-200">Show amendment response</summary>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-violet-100/90">
            {JSON.stringify(amendmentState.response, null, 2)}
          </pre>
        </details>
      ) : null}

      <div className="mt-5 rounded-xl border border-zinc-800 bg-black/20 p-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadSupplierEvents}
            disabled={supplierState.status === "loading"}
            className="rounded-xl bg-zinc-700 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {supplierState.status === "loading" ? "Loading..." : "Load supplier events"}
          </button>
          <button
            type="button"
            onClick={acknowledgeSupplierEvents}
            disabled={supplierState.status === "loading" || supplierState.status !== "success" || supplierState.acknowledgements.length === 0}
            className="rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Acknowledge supplier events
          </button>
        </div>
      </div>

      {supplierState.status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {supplierState.message}
        </div>
      ) : null}

      {supplierState.status === "success" ? (
        <details className="mt-4 rounded-xl border border-teal-500/20 bg-teal-500/10 p-4 text-sm text-teal-100">
          <summary className="cursor-pointer text-teal-200">Show supplier event response</summary>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-teal-100/90">
            {JSON.stringify(supplierState.response, null, 2)}
          </pre>
        </details>
      ) : null}
    </section>
  );
}
