"use client";

import { FormEvent, useState } from "react";

type OnboardingChoice = "send_guests_to_checkout" | "apply_for_api_access";

type CapabilityCard = {
  capability: "checkout" | "seat_availability" | "commission_terms" | "api_booking";
  title: string;
  code: string;
  label: string;
  ready: boolean;
  evidence: string;
  evidenceRequiredToChange: string;
};

type ProviderGuide = {
  bookingSystem: string;
  providerKey: string;
  availabilityState: "active_for_new_orleans_pilot" | "available_on_request";
  headline: string;
  operatorActionSummary: string;
  approvalSteps: Array<{
    stepNumber: number;
    title: string;
    detail: string;
    owner: "operator" | "dcc_reviewer" | "provider";
  }>;
  credentialSecurityPolicy: string;
};

const PROVIDER_GUIDES: Record<string, ProviderGuide> = {
  FareHarbor: {
    bookingSystem: "FareHarbor",
    providerKey: "fareharbor",
    availabilityState: "active_for_new_orleans_pilot",
    headline:
      "Approve the FareHarbor affiliate connection for this specific offer and confirm the eligible hotel pickup stops.",
    operatorActionSummary:
      "In FareHarbor Dashboard → Settings → Affiliates / ASN, authorize our affiliate account for item #763318 and confirm the French Quarter & Downtown hotel pickup list.",
    approvalSteps: [
      {
        stepNumber: 1,
        title: "Approve the affiliate connection for that specific offer",
        detail:
          "Authorize our FareHarbor affiliate account (welcometoneworleanstours or aktourcenter) for item #763318 (Covered Swamp Tour with Transportation) so is_affiliate_rules_applied is active on the ASN price sheet.",
        owner: "operator",
      },
      {
        stepNumber: 2,
        title: "Confirm the eligible pickup stops",
        detail:
          "Confirm the eligible French Quarter & Downtown hotel pickup stops on FareHarbor custom field #12258400 (including Hotel Monteleone, 214 Royal St — #22056428) and pickup lead times before departure.",
        owner: "operator",
      },
      {
        stepNumber: 3,
        title: "Record affiliate account, commission, refund treatment, payout timing & referral booking record delivery",
        detail:
          "Reuse the existing DCC review queue to record the confirmed affiliate account, commission rate, refund/cancellation treatment, payout timing, and how we receive a booking record carrying online_booking_references (<placementId>-clk_<24hex>).",
        owner: "dcc_reviewer",
      },
    ],
    credentialSecurityPolicy:
      "Keep the intake limited to business and product details. Arrange any credentials through FareHarbor's approved secure process.",
  },
  Rezdy: {
    bookingSystem: "Rezdy",
    providerKey: "rezdy",
    availabilityState: "available_on_request",
    headline:
      "Approve the Rezdy Marketplace / Agent rate sheet for the exact product option and confirm pickup locations.",
    operatorActionSummary:
      "Authorize DCC as an agent for the specific Rezdy product code and confirm your pickup location list during review.",
    approvalSteps: [
      {
        stepNumber: 1,
        title: "Approve Rezdy Agent connection for the exact product option",
        detail:
          "Enable the specific product code on our Rezdy Agent connection and confirm net/commissionable rates.",
        owner: "operator",
      },
      {
        stepNumber: 2,
        title: "Confirm eligible hotel or pier pickup stops",
        detail:
          "Confirm the pickup location list and cutoff window for the selected tour option.",
        owner: "operator",
      },
      {
        stepNumber: 3,
        title: "Record agent account, commission, refund treatment, payout timing & order reference delivery",
        detail:
          "Record commercial terms and how order confirmations carrying our referral reference are delivered.",
        owner: "dcc_reviewer",
      },
    ],
    credentialSecurityPolicy:
      "Keep the intake limited to business and product details. Arrange any Rezdy API credentials through Rezdy's approved secure process.",
  },
  "Bókun": {
    bookingSystem: "Bókun",
    providerKey: "bokun",
    availabilityState: "available_on_request",
    headline:
      "Approve the Bókun Marketplace reseller contract for the specific experience and confirm pickup places.",
    operatorActionSummary:
      "Accept the Bókun reseller contract covering your experience ID and confirm enabled hotel pickup places.",
    approvalSteps: [
      {
        stepNumber: 1,
        title: "Approve Bókun Marketplace contract for the specific experience",
        detail:
          "Approve our reseller contract proposal in Bókun Marketplace for the exact tour option.",
        owner: "operator",
      },
      {
        stepNumber: 2,
        title: "Confirm eligible pickup places",
        detail:
          "Verify the Bókun pickup place IDs and lead-time windows for hotel pickup.",
        owner: "operator",
      },
      {
        stepNumber: 3,
        title: "Record reseller account, commission, refund treatment, payout timing & externalBookingReference reporting",
        detail:
          "Record commercial terms and how booking records with externalBookingReference are delivered.",
        owner: "dcc_reviewer",
      },
    ],
    credentialSecurityPolicy:
      "Keep the intake limited to business and product details. Arrange any Bókun credentials through Bókun's approved secure process.",
  },
  "Ventrata / OCTO": {
    bookingSystem: "Ventrata / OCTO",
    providerKey: "ventrata_octo",
    availabilityState: "available_on_request",
    headline:
      "Approve the reseller product & option mapping in Ventrata / OCTO and confirm pickup points.",
    operatorActionSummary:
      "Enable the specific productId and optionId for our reseller connection and confirm pickup points.",
    approvalSteps: [
      {
        stepNumber: 1,
        title: "Authorize reseller connection for the exact product & option ID",
        detail:
          "Enable the specific product and option on our reseller connection in your Ventrata dashboard.",
        owner: "operator",
      },
      {
        stepNumber: 2,
        title: "Confirm eligible pickup point IDs",
        detail:
          "Verify which hotel or pier pickup points are included for that option.",
        owner: "operator",
      },
      {
        stepNumber: 3,
        title: "Record reseller account, commission, refund treatment, payout timing & resellerReference reporting",
        detail:
          "Record commercial terms and how booking records with resellerReference are delivered.",
        owner: "dcc_reviewer",
      },
    ],
    credentialSecurityPolicy:
      "Keep the intake limited to business and product details. Arrange any OCTO bearer credentials through the provider's approved secure process.",
  },
};

const JEAN_LAFITTE_DEFAULT = {
  operatorName: "Jean Lafitte Swamp Tours",
  businessEmail: "sales@jeanlafitteswamptour.com",
  bookingSystem: "FareHarbor",
  exactTourOption:
    "Covered Swamp Tour with Transportation — Swamp Tour with Hotel Pick-up (Item #763318)",
  existingCheckoutLink:
    "https://fareharbor.com/embeds/book/jeanlafitteswamptour/items/763318/?full-items=yes",
  tourId: "dcc:tour:fh:jeanlafitteswamptour:763318",
  offerItemId: "763318",
};

const INITIAL_JEAN_LAFITTE_CAPABILITIES: CapabilityCard[] = [
  {
    capability: "checkout",
    title: "Checkout",
    code: "checkout_tested",
    label: "Checkout tested",
    ready: true,
    evidence:
      "Mobile checkout journey verified through FareHarbor item #763318 final review screen (2026-11-18, 2 adults, Hotel Monteleone pickup #22056428, $124.00 subtotal + $7.44 fees = $131.44 total) with referral tracking parameters.",
    evidenceRequiredToChange:
      "Changes to 'Checkout tested' when an end-to-end checkout walkthrough verifies date, party size, option, pickup stop, price breakdown, and referral tag pass-through.",
  },
  {
    capability: "seat_availability",
    title: "Seat availability",
    code: "check_seats_at_fareharbor",
    label: "Check seats at FareHarbor",
    ready: false,
    evidence:
      "FareHarbor calendar feed lists open departure time slots (08:30 / 10:00), but omits numeric remaining seat count in the public calendar feed; guests check remaining seats at FareHarbor.",
    evidenceRequiredToChange:
      "Changes to 'Live seat count verified' only when a provider feed or authorized API response confirms numeric remaining seat capacity.",
  },
  {
    capability: "commission_terms",
    title: "Commission terms",
    code: "commission_terms_pending",
    label: "Commission terms pending",
    ready: false,
    evidence:
      "FareHarbor item #763318 currently returns is_affiliate_rules_applied: false; awaiting operator confirmation of the affiliate account, commission rate, refund treatment, payout timing, and referral booking record delivery.",
    evidenceRequiredToChange:
      "Changes to 'Commission terms confirmed' when the reviewer records the confirmed affiliate account, commission rate, refund treatment, payout timing, and booking record delivery method.",
  },
  {
    capability: "api_booking",
    title: "API booking",
    code: "api_booking_requires_approval",
    label: "API booking requires approval",
    ready: false,
    evidence:
      "Guests are sent to Jean Lafitte's hosted FareHarbor checkout; native API booking creation requires separate provider-approved API credentials and end-to-end verification.",
    evidenceRequiredToChange:
      "Changes to 'API booking approved' only when provider-approved API credentials are arranged through the secure process and booking write access is verified.",
  },
];

type Props = {
  initialCompanyName?: string;
  initialWebsite?: string;
  initialDestinations?: string;
  initialBookingSystem?: string;
  initialChoice?: OnboardingChoice;
};

export default function OperatorOnboardingForm({
  initialCompanyName = "",
  initialWebsite = "",
  initialDestinations = "",
  initialBookingSystem = "Rezdy Native REST API v1",
  initialChoice = "send_guests_to_checkout",
}: Props) {
  const [selectedChoice, setSelectedChoice] = useState<OnboardingChoice>(initialChoice);

  // Choice 1: Send guests to our checkout (1-tour intake, preloaded with Jean Lafitte 763318 in Read-Only Sample Demo mode)
  const [isReadOnlyDemo, setIsReadOnlyDemo] = useState(true);
  const [checkoutOperatorName, setCheckoutOperatorName] = useState(
    JEAN_LAFITTE_DEFAULT.operatorName,
  );
  const [checkoutBusinessEmail, setCheckoutBusinessEmail] = useState(
    JEAN_LAFITTE_DEFAULT.businessEmail,
  );
  const [checkoutBookingSystem, setCheckoutBookingSystem] = useState(
    JEAN_LAFITTE_DEFAULT.bookingSystem,
  );
  const [exactTourOption, setExactTourOption] = useState(
    JEAN_LAFITTE_DEFAULT.exactTourOption,
  );
  const [existingCheckoutLink, setExistingCheckoutLink] = useState(
    JEAN_LAFITTE_DEFAULT.existingCheckoutLink,
  );
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<Record<string, any> | null>(null);

  // Interactive Submission -> Review -> Referral Trace Sample Preview State
  const [previewLoading, setPreviewLoading] = useState(false);
  const [lifecyclePreview, setLifecyclePreview] = useState<Record<string, any> | null>(null);

  // Choice 2: Apply for API booking access (Existing full API intake)
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState(initialWebsite);
  const [destinations, setDestinations] = useState(initialDestinations);
  const [bookingSystem, setBookingSystem] = useState(initialBookingSystem);
  const [apiDocumentationUrl, setApiDocumentationUrl] = useState(
    "https://developers.rezdy.com/",
  );
  const [authorizedApiAccessAvailable, setAuthorizedApiAccessAvailable] = useState(true);
  const [operatorPermissionConfirmed, setOperatorPermissionConfirmed] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);

  const activeProviderGuide =
    PROVIDER_GUIDES[checkoutBookingSystem] || PROVIDER_GUIDES.FareHarbor;

  // Compute current readiness cards (from submitted/reviewed result if available, otherwise Jean Lafitte baseline)
  const displayedCapabilities: CapabilityCard[] = (() => {
    const statuses =
      lifecyclePreview?.stage2ReviewRecorded?.readinessStatuses ||
      checkoutResult?.readinessStatuses;
    if (!statuses) {
      return INITIAL_JEAN_LAFITTE_CAPABILITIES;
    }
    return [
      {
        capability: "checkout",
        title: "Checkout",
        code: statuses.checkout?.code || "checkout_tested",
        label: statuses.checkout?.label || "Checkout tested",
        ready: Boolean(statuses.checkout?.ready),
        evidence: statuses.checkout?.evidence || "",
        evidenceRequiredToChange:
          INITIAL_JEAN_LAFITTE_CAPABILITIES[0].evidenceRequiredToChange,
      },
      {
        capability: "seat_availability",
        title: "Seat availability",
        code: statuses.seatAvailability?.code || "check_seats_at_fareharbor",
        label: statuses.seatAvailability?.label || "Check seats at FareHarbor",
        ready: Boolean(statuses.seatAvailability?.ready),
        evidence: statuses.seatAvailability?.evidence || "",
        evidenceRequiredToChange:
          INITIAL_JEAN_LAFITTE_CAPABILITIES[1].evidenceRequiredToChange,
      },
      {
        capability: "commission_terms",
        title: "Commission terms",
        code: statuses.commissionTerms?.code || "commission_terms_pending",
        label: statuses.commissionTerms?.label || "Commission terms pending",
        ready: Boolean(statuses.commissionTerms?.ready),
        evidence: statuses.commissionTerms?.evidence || "",
        evidenceRequiredToChange:
          INITIAL_JEAN_LAFITTE_CAPABILITIES[2].evidenceRequiredToChange,
      },
      {
        capability: "api_booking",
        title: "API booking",
        code: statuses.apiBooking?.code || "api_booking_requires_approval",
        label: statuses.apiBooking?.label || "API booking requires approval",
        ready: Boolean(statuses.apiBooking?.ready),
        evidence: statuses.apiBooking?.evidence || "",
        evidenceRequiredToChange:
          INITIAL_JEAN_LAFITTE_CAPABILITIES[3].evidenceRequiredToChange,
      },
    ];
  })();

  function loadJeanLafitteExample() {
    setIsReadOnlyDemo(true);
    setCheckoutOperatorName(JEAN_LAFITTE_DEFAULT.operatorName);
    setCheckoutBusinessEmail(JEAN_LAFITTE_DEFAULT.businessEmail);
    setCheckoutBookingSystem(JEAN_LAFITTE_DEFAULT.bookingSystem);
    setExactTourOption(JEAN_LAFITTE_DEFAULT.exactTourOption);
    setExistingCheckoutLink(JEAN_LAFITTE_DEFAULT.existingCheckoutLink);
    setCheckoutResult(null);
    setLifecyclePreview(null);
  }

  function unlockLiveOperatorIntake() {
    setIsReadOnlyDemo(false);
    setCheckoutOperatorName("");
    setCheckoutBusinessEmail("");
    setCheckoutBookingSystem("FareHarbor");
    setExactTourOption("");
    setExistingCheckoutLink("");
    setCheckoutResult(null);
    setLifecyclePreview(null);
  }

  async function handleCheckoutOnboardingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReadOnlyDemo) {
      return;
    }
    setCheckoutSubmitting(true);
    setCheckoutResult(null);
    try {
      const res = await fetch("/api/operators/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingPath: "send_guests_to_checkout",
          operatorName: checkoutOperatorName,
          businessEmail: checkoutBusinessEmail,
          bookingSystem: checkoutBookingSystem,
          exactTourOption,
          existingCheckoutLink,
        }),
      });
      const json = await res.json();
      setCheckoutResult(json);
    } catch (err: any) {
      setCheckoutResult({
        ok: false,
        message: err?.message || "Failed to submit tour checkout onboarding.",
      });
    } finally {
      setCheckoutSubmitting(false);
    }
  }

  async function handleRunSubmissionThroughReviewPreview() {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/operators/onboarding?preview=jean-lafitte-763318");
      const json = await res.json();
      if (json.ok && json.preview) {
        setLifecyclePreview(json.preview);
      }
    } catch {
      // ignore preview error
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleBookingSystemChange(value: string) {
    setBookingSystem(value);
    if (value.includes("Rezdy")) {
      setApiDocumentationUrl("https://developers.rezdy.com/");
    } else if (value.includes("FareHarbor")) {
      setApiDocumentationUrl("https://developer.fareharbor.com/api/external/v1/");
    } else if (value.includes("Bókun")) {
      setApiDocumentationUrl("https://docs.bokun.io/");
    } else if (value.includes("OCTO") || value.includes("Ventrata")) {
      setApiDocumentationUrl("https://docs.octo.travel/");
    } else if (value === "no_api") {
      setApiDocumentationUrl("");
      setAuthorizedApiAccessAvailable(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/operators/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingPath: "apply_for_api_access",
          companyName,
          contactName,
          contactEmail,
          website,
          destinations,
          bookingSystem,
          apiDocumentationUrl,
          authorizedApiAccessAvailable,
          operatorPermissionConfirmed,
          notes,
        }),
      });
      const json = await res.json();
      setResult(json);
    } catch (err: any) {
      setResult({
        ok: false,
        message: err?.message || "Failed to submit onboarding application.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Two Onboarding Path Choices */}
      <div
        role="tablist"
        aria-label="Operator onboarding choices"
        className="grid gap-4 md:grid-cols-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedChoice === "send_guests_to_checkout"}
          data-testid="choice-send-guests-to-checkout"
          onClick={() => setSelectedChoice("send_guests_to_checkout")}
          className={`text-left rounded-2xl border p-5 transition ${
            selectedChoice === "send_guests_to_checkout"
              ? "border-emerald-400 bg-emerald-950/30 shadow-lg shadow-emerald-950/40"
              : "border-white/15 bg-black/40 hover:border-white/30"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-300">
              Choice 1 · New Orleans Pilot
            </span>
            <span className="text-xs font-mono text-emerald-300">
              {selectedChoice === "send_guests_to_checkout" ? "● Selected" : "Select →"}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-black text-white">
            Send guests to our checkout
          </h3>
          <p className="mt-1 text-xs leading-5 text-zinc-300">
            Add one tour using your existing hosted checkout link (e.g., Jean Lafitte&apos;s covered swamp tour with transportation, item <code className="text-emerald-200">763318</code>). No API credentials collected—approve the affiliate connection and pickup stops during review.
          </p>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={selectedChoice === "apply_for_api_access"}
          data-testid="choice-apply-for-api-access"
          onClick={() => setSelectedChoice("apply_for_api_access")}
          className={`text-left rounded-2xl border p-5 transition ${
            selectedChoice === "apply_for_api_access"
              ? "border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-950/40"
              : "border-white/15 bg-black/40 hover:border-white/30"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full border border-cyan-400/40 bg-cyan-400/15 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300">
              Choice 2 · Direct API Integration
            </span>
            <span className="text-xs font-mono text-cyan-300">
              {selectedChoice === "apply_for_api_access" ? "● Selected" : "Select →"}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-black text-white">
            Apply for API booking access
          </h3>
          <p className="mt-1 text-xs leading-5 text-zinc-300">
            Route through our full API technical and commercial intake (Rezdy, FareHarbor External API, Bókun, Ventrata/OCTO). Credentials are arranged through the provider&apos;s approved secure process after review.
          </p>
        </button>
      </div>

      {selectedChoice === "send_guests_to_checkout" ? (
        <div className="space-y-8" data-testid="panel-send-guests-to-checkout">
          {/* Read-Only Sample Demo Banner */}
          <div
            data-testid="read-only-sample-banner"
            className="rounded-2xl border border-amber-400/40 bg-amber-950/25 p-5 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-amber-300/50 bg-amber-400/20 px-3 py-0.5 text-[11px] font-mono font-black uppercase tracking-widest text-amber-200">
                  SAMPLE DATA — READ-ONLY DEMO
                </span>
                <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-300">
                  Queue &amp; Attribution Ledger Untouched
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                End-to-end write test gated behind Authenticated QA (<code className="text-cyan-300">mode=qa_live_test</code>)
              </span>
            </div>
            <p className="text-xs leading-5 text-zinc-200">
              The pre-loaded <strong>Jean Lafitte Swamp Tours (Item #763318)</strong> example below is a <strong>read-only sample preview</strong>. Opening or inspecting this public preview never creates an onboarding application or writes to the attribution ledger. Real operators can click <strong>Enter Your Own Tour (Live Intake)</strong> to submit a tour.
            </p>
          </div>

          {/* 1. Add One Tour */}
          <form
            onSubmit={handleCheckoutOnboardingSubmit}
            className="rounded-2xl border border-emerald-500/30 bg-black/40 p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-300">
                  1. Add One Tour · New Orleans Pilot Intake{" "}
                  {isReadOnlyDemo ? "(SAMPLE DATA — READ-ONLY DEMO)" : "(LIVE INTAKE)"}
                </span>
                <h3 className="mt-1 text-xl font-black text-white">
                  Send Guests to Your Existing Checkout
                </h3>
                <p className="mt-1 text-xs text-zinc-300">
                  Pre-loaded with Jean Lafitte&apos;s covered swamp tour with transportation (<code className="text-emerald-200">763318</code>) as a read-only sample example. Keep the intake limited to business and product details—arrange any credentials through the provider&apos;s approved secure process.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isReadOnlyDemo ? (
                  <button
                    type="button"
                    data-testid="unlock-live-intake-btn"
                    onClick={unlockLiveOperatorIntake}
                    className="rounded-xl border border-cyan-400/50 bg-cyan-400/15 px-3.5 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/25"
                  >
                    Enter Your Own Tour (Live Intake)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={loadJeanLafitteExample}
                    className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3.5 py-2 text-xs font-bold text-amber-200 hover:bg-amber-400/20"
                  >
                    Return to Read-Only Jean Lafitte (#763318) Sample Demo
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3.5 text-xs leading-5 text-amber-100">
              <strong>Business &amp; Product Details Only:</strong> Never enter API keys, passwords, or secret tokens here. Any provider credentials are arranged separately through the provider&apos;s approved secure process.
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
                  htmlFor="checkout-operator-name"
                >
                  Operator Name *{" "}
                  {isReadOnlyDemo ? (
                    <span className="ml-1 font-mono text-[10px] text-amber-300">
                      [SAMPLE — READ-ONLY]
                    </span>
                  ) : null}
                </label>
                <input
                  id="checkout-operator-name"
                  type="text"
                  required
                  readOnly={isReadOnlyDemo}
                  value={checkoutOperatorName}
                  onChange={(e) => setCheckoutOperatorName(e.target.value)}
                  placeholder="Your Tour Company Name"
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-white outline-none ${
                    isReadOnlyDemo
                      ? "border-amber-400/30 bg-black/40 text-zinc-300 cursor-not-allowed"
                      : "border-white/15 bg-black/60 focus:border-emerald-400"
                  }`}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
                  htmlFor="checkout-business-email"
                >
                  Business Email *{" "}
                  {isReadOnlyDemo ? (
                    <span className="ml-1 font-mono text-[10px] text-amber-300">
                      [SAMPLE — READ-ONLY]
                    </span>
                  ) : null}
                </label>
                <input
                  id="checkout-business-email"
                  type="email"
                  required
                  readOnly={isReadOnlyDemo}
                  value={checkoutBusinessEmail}
                  onChange={(e) => setCheckoutBusinessEmail(e.target.value)}
                  placeholder="reservations@yourcompany.com"
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-white outline-none ${
                    isReadOnlyDemo
                      ? "border-amber-400/30 bg-black/40 text-zinc-300 cursor-not-allowed"
                      : "border-white/15 bg-black/60 focus:border-emerald-400"
                  }`}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
                  htmlFor="checkout-booking-system"
                >
                  Booking System *
                </label>
                <select
                  id="checkout-booking-system"
                  disabled={isReadOnlyDemo}
                  value={checkoutBookingSystem}
                  onChange={(e) => setCheckoutBookingSystem(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-white outline-none ${
                    isReadOnlyDemo
                      ? "border-amber-400/30 bg-black/50 text-zinc-300 cursor-not-allowed"
                      : "border-white/15 bg-black/80 focus:border-emerald-400"
                  }`}
                >
                  <option value="FareHarbor">FareHarbor (Active for New Orleans Pilot)</option>
                  <option value="Rezdy">Rezdy</option>
                  <option value="Bókun">Bókun</option>
                  <option value="Ventrata / OCTO">Ventrata / OCTO</option>
                </select>
              </div>

              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
                  htmlFor="checkout-exact-tour-option"
                >
                  Exact Tour Option *{" "}
                  {isReadOnlyDemo ? (
                    <span className="ml-1 font-mono text-[10px] text-amber-300">
                      [SAMPLE — READ-ONLY]
                    </span>
                  ) : null}
                </label>
                <input
                  id="checkout-exact-tour-option"
                  type="text"
                  required
                  readOnly={isReadOnlyDemo}
                  value={exactTourOption}
                  onChange={(e) => setExactTourOption(e.target.value)}
                  placeholder="Exact Tour Name & Option ID"
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-white outline-none ${
                    isReadOnlyDemo
                      ? "border-amber-400/30 bg-black/40 text-zinc-300 cursor-not-allowed"
                      : "border-white/15 bg-black/60 focus:border-emerald-400"
                  }`}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
                htmlFor="checkout-existing-link"
              >
                Existing Checkout Link *{" "}
                {isReadOnlyDemo ? (
                  <span className="ml-1 font-mono text-[10px] text-amber-300">
                    [SAMPLE — READ-ONLY]
                  </span>
                ) : null}
              </label>
              <input
                id="checkout-existing-link"
                type="url"
                required
                readOnly={isReadOnlyDemo}
                value={existingCheckoutLink}
                onChange={(e) => setExistingCheckoutLink(e.target.value)}
                placeholder="https://..."
                className={`w-full rounded-xl border px-4 py-3 text-sm font-mono text-emerald-200 outline-none ${
                  isReadOnlyDemo
                    ? "border-amber-400/30 bg-black/40 cursor-not-allowed"
                    : "border-white/15 bg-black/60 focus:border-emerald-400"
                }`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isReadOnlyDemo ? (
                <button
                  type="button"
                  disabled
                  data-testid="submit-checkout-onboarding-btn"
                  className="rounded-xl border border-amber-400/40 bg-amber-400/15 px-6 py-3 text-xs font-black uppercase tracking-wider text-amber-200 opacity-80 cursor-not-allowed"
                >
                  Read-Only Sample Demo (Queue &amp; Ledger Untouched)
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={checkoutSubmitting}
                  data-testid="submit-checkout-onboarding-btn"
                  className="rounded-xl bg-emerald-400 px-6 py-3 text-xs font-black uppercase tracking-wider text-black hover:bg-emerald-300 transition disabled:opacity-60"
                >
                  {checkoutSubmitting ? "Submitting Tour…" : "Submit One Tour for Checkout Referral"}
                </button>
              )}

              <button
                type="button"
                disabled={previewLoading}
                data-testid="run-lifecycle-preview-btn"
                onClick={handleRunSubmissionThroughReviewPreview}
                className="rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-5 py-3 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20 transition disabled:opacity-60"
              >
                {previewLoading
                  ? "Loading Read-Only Sample Preview…"
                  : "Inspect Read-Only Sample Walkthrough (Stages 1–3)"}
              </button>
            </div>

            {checkoutResult ? (
              <div
                role="status"
                data-testid="checkout-submission-result"
                className={`rounded-2xl border p-4 text-xs leading-6 ${
                  checkoutResult.ok
                    ? "border-emerald-400/40 bg-emerald-950/30 text-emerald-100"
                    : "border-rose-400/40 bg-rose-950/30 text-rose-100"
                }`}
              >
                <p className="font-bold text-sm">
                  {checkoutResult.ok
                    ? `Submitted: ${checkoutResult.applicationStatus} (Application ID: ${checkoutResult.applicationId})`
                    : `Submission Error (${checkoutResult.errorCode || "error"})`}
                </p>
                <p className="mt-1">
                  {checkoutResult.message || checkoutResult.commercialTermsNote}
                </p>
                {checkoutResult.ok && checkoutResult.persisted ? (
                  <div className="mt-2 rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-white/80 space-y-1">
                    <p>• Offer Linked: {checkoutResult.checkoutOffer?.tourId || "custom"}</p>
                    <p>• Review Queue State: {checkoutResult.reviewQueueState}</p>
                    <p>• Retrieval Token: {checkoutResult.retrievalToken}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </form>

          {/* 2. Show the Next Action */}
          <div
            data-testid="section-next-action"
            className="rounded-2xl border border-cyan-500/30 bg-black/40 p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300">
                  2. Show the Next Action · Provider-Specific Approval &amp; Review Steps
                </span>
                <h3 className="mt-1 text-xl font-black text-white">
                  {activeProviderGuide.headline}
                </h3>
                <p className="mt-1 text-xs text-zinc-300">
                  {activeProviderGuide.operatorActionSummary}
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-mono font-bold uppercase ${
                  activeProviderGuide.availabilityState === "active_for_new_orleans_pilot"
                    ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                    : "border-amber-400/40 bg-amber-400/15 text-amber-200"
                }`}
              >
                {activeProviderGuide.availabilityState === "active_for_new_orleans_pilot"
                  ? "Active · New Orleans Pilot"
                  : "Provider Connection Step"}
              </span>
            </div>

            {/* Provider selector pills to inspect each provider's approval steps */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-400 uppercase mr-1">
                Provider Steps:
              </span>
              {Object.keys(PROVIDER_GUIDES).map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setCheckoutBookingSystem(prov)}
                  className={`rounded-lg border px-3 py-1 text-xs font-bold transition ${
                    checkoutBookingSystem === prov
                      ? "border-cyan-400 bg-cyan-400/20 text-white"
                      : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/25"
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {activeProviderGuide.approvalSteps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-cyan-300 font-bold">STEP {step.stepNumber}</span>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-zinc-300 uppercase">
                      {step.owner === "operator" ? "Operator Action" : "DCC Review Queue"}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">{step.title}</p>
                  <p className="text-xs leading-5 text-zinc-300">{step.detail}</p>
                </div>
              ))}
            </div>

            {/* Existing Review Process Fields Recorded */}
            <div className="rounded-xl border border-white/10 bg-black/60 p-4 space-y-3">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                Recorded in Existing Review Queue (earthosControlMapFindings) — Sample Schema:
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <span className="text-zinc-400 block font-mono text-[11px]">
                    1. Affiliate Account
                  </span>
                  <strong className="text-white">
                    {lifecyclePreview?.stage2ReviewRecorded?.reviewRecord?.affiliateAccount ||
                      "Pending operator confirmation (e.g., aktourcenter / welcometoneworleanstours)"}
                  </strong>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <span className="text-zinc-400 block font-mono text-[11px]">
                    2. Commission Rate
                  </span>
                  <strong className="text-white">
                    {lifecyclePreview?.stage2ReviewRecorded?.reviewRecord
                      ?.commissionRatePercent
                      ? `${lifecyclePreview.stage2ReviewRecorded.reviewRecord.commissionRatePercent}% confirmed ASN commission (SAMPLE)`
                      : "Pending FareHarbor ASN price sheet confirmation"}
                  </strong>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <span className="text-zinc-400 block font-mono text-[11px]">
                    3. Refund Treatment
                  </span>
                  <strong className="text-white">
                    {lifecyclePreview?.stage2ReviewRecorded?.reviewRecord?.refundTreatment ||
                      "No commission on cancelled/refunded bookings; reversed in ledger"}
                  </strong>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <span className="text-zinc-400 block font-mono text-[11px]">
                    4. Payout Timing
                  </span>
                  <strong className="text-white">
                    {lifecyclePreview?.stage2ReviewRecorded?.reviewRecord?.payoutTiming ||
                      "Monthly FareHarbor ASN settlement / Net-30 after completed tour"}
                  </strong>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <span className="text-zinc-400 block font-mono text-[11px]">
                    5. Referral Booking Record Delivery
                  </span>
                  <strong className="text-white">
                    {lifecyclePreview?.stage2ReviewRecorded?.reviewRecord
                      ?.bookingRecordDeliveryMethod ||
                      "FareHarbor ASN booking report or webhook carrying online_booking_references (<placementId>-clk_<24hex>)"}
                  </strong>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <span className="text-zinc-400 block font-mono text-[11px]">
                    6. Eligible Pickup Stops
                  </span>
                  <strong className="text-white">
                    Hotel Monteleone (214 Royal St — #22056428) + French Quarter / Downtown Stops
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Show What's Ready (4 Independent Capability Statuses) */}
          <div
            data-testid="section-whats-ready"
            className="rounded-2xl border border-white/15 bg-black/40 p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-300">
                  3. Show What&apos;s Ready · Capability Readiness Tracker
                </span>
                <h3 className="mt-1 text-xl font-black text-white">
                  Checkout, Seat Availability, Commission Terms &amp; API Booking Tracked Separately
                </h3>
                <p className="mt-1 text-xs text-zinc-300">
                  Jean Lafitte (<code className="text-emerald-200">763318</code>) starts with{" "}
                  <strong>Checkout tested</strong>, <strong>Check seats at FareHarbor</strong>,{" "}
                  <strong>Commission terms pending</strong>, and{" "}
                  <strong>API booking requires approval</strong>. Each status changes only when we have evidence for that specific capability.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {displayedCapabilities.map((item) => (
                <div
                  key={item.capability}
                  data-testid={`capability-card-${item.capability}`}
                  className={`rounded-xl border p-4 space-y-2.5 ${
                    item.ready
                      ? "border-emerald-400/40 bg-emerald-950/25"
                      : "border-amber-400/30 bg-amber-950/15"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">
                      {item.title}
                    </span>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        item.ready ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                    />
                  </div>
                  <p
                    data-testid={`capability-status-${item.capability}`}
                    className={`text-sm font-black ${
                      item.ready ? "text-emerald-300" : "text-amber-200"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs leading-5 text-zinc-300">{item.evidence}</p>
                  <p className="border-t border-white/10 pt-2 text-[11px] leading-4 text-zinc-400">
                    <strong>When it changes:</strong> {item.evidenceRequiredToChange}
                  </p>
                </div>
              ))}
            </div>

            {/* Submission -> Review -> Traced Referral Read-Only Sample Preview Panel */}
            <div
              data-testid="lifecycle-preview-panel"
              className="rounded-xl border border-cyan-400/30 bg-cyan-950/15 p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                    SAMPLE DATA · READ-ONLY DEMO WALKTHROUGH (Jean Lafitte #763318)
                  </span>
                  <h4 className="text-base font-bold text-white">
                    How One Application Moves From Submission Through Review &amp; Checkout Attribution
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Public preview serves labeled sample data (<code className="text-amber-200">sample_onb_jean_lafitte_763318_demo</code>) and leaves the live application queue and attribution ledger untouched. The live end-to-end test runs behind authenticated QA (<code className="text-cyan-200">mode=qa_live_test</code>).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunSubmissionThroughReviewPreview}
                  disabled={previewLoading}
                  className="rounded-lg border border-cyan-400/40 bg-cyan-400/15 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-400/25"
                >
                  {previewLoading ? "Loading Sample…" : "Load Read-Only Sample Data"}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3 text-xs">
                <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-1.5">
                  <p className="font-mono text-[11px] font-bold text-amber-300 uppercase">
                    Stage 1 · Sample Submission (Initial State)
                  </p>
                  <p className="font-bold text-white">
                    Jean Lafitte Swamp Tours · Item #763318 (Sample)
                  </p>
                  <ul className="space-y-1 text-zinc-300 pt-1">
                    <li>
                      • Checkout: <strong className="text-emerald-300">Checkout tested</strong>
                    </li>
                    <li>
                      • Seats:{" "}
                      <strong className="text-amber-200">Check seats at FareHarbor</strong>
                    </li>
                    <li>
                      • Commission:{" "}
                      <strong className="text-amber-200">Commission terms pending</strong>
                    </li>
                    <li>
                      • API:{" "}
                      <strong className="text-amber-200">API booking requires approval</strong>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-1.5">
                  <p className="font-mono text-[11px] font-bold text-emerald-300 uppercase">
                    Stage 2 · Sample Review Record (Illustrative)
                  </p>
                  <p className="font-bold text-white">
                    Affiliate + Pickup + Payout Terms Recorded
                  </p>
                  <ul className="space-y-1 text-zinc-300 pt-1">
                    <li>
                      • Affiliate:{" "}
                      <code className="text-cyan-200">
                        {lifecyclePreview?.stage2ReviewRecorded?.reviewRecord
                          ?.affiliateAccount || "aktourcenter"}
                      </code>{" "}
                      (15% ASN — Sample)
                    </li>
                    <li>• Pickup: Hotel Monteleone (#22056428)</li>
                    <li>
                      • Commission:{" "}
                      <strong className="text-emerald-300">
                        Commission terms confirmed (Sample)
                      </strong>
                    </li>
                    <li>
                      • Seats &amp; API remain{" "}
                      <strong className="text-amber-200">Check seats at FareHarbor</strong>{" "}
                      / <strong className="text-amber-200">API booking requires approval</strong>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-1.5">
                  <p className="font-mono text-[11px] font-bold text-cyan-300 uppercase">
                    Stage 3 · Sample Referral Trace (Read-Only)
                  </p>
                  <p className="font-bold text-white">
                    Matcher + Click Redirect + Attribution Format
                  </p>
                  <p className="text-zinc-300 leading-5">
                    Placement{" "}
                    <code className="text-cyan-200">nola-hotel-monteleone-demo-pilot</code>{" "}
                    routes through <code className="text-cyan-200">/api/v1/ads/click</code> to FareHarbor item <code className="text-emerald-200">763318</code> with sample{" "}
                    <code className="text-emerald-200">
                      ref=
                      {lifecyclePreview?.stage3ReferralTrace?.referralReferenceTag ||
                        "nola-hotel-monteleone-demo-pilot-clk_000000000000763318de0001"}
                    </code>
                    .
                  </p>
                  {lifecyclePreview?.stage3ReferralTrace?.providerCheckoutUrl ? (
                    <p className="font-mono text-[10px] break-all text-emerald-300 pt-1">
                      Sample URL: {lifecyclePreview.stage3ReferralTrace.providerCheckoutUrl}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          data-testid="panel-apply-for-api-access"
          className="space-y-6 rounded-2xl border border-cyan-500/30 bg-black/40 p-6"
        >
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs leading-6 text-amber-100">
            <strong>Security &amp; Commercial Notice:</strong> Do <strong>not</strong> enter API keys, tokens, or secrets in this form or send them by email. Credentials are arranged securely through the provider&apos;s approved process after technical review and signed commercial terms. Submitting this application does not automatically authorize sales; existing verified Viator listings remain active on Viator until a direct integration passes all verification gates.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
                htmlFor="onb-company"
              >
                Company Name *
              </label>
              <input
                id="onb-company"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Cajun Pride Swamp Tours"
                className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
                htmlFor="onb-website"
              >
                Official Company Website *
              </label>
              <input
                id="onb-website"
                type="url"
                required
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
                htmlFor="onb-contact-name"
              >
                Contact Name &amp; Role *
              </label>
              <input
                id="onb-contact-name"
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Name / Distribution or API Lead"
                className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
                htmlFor="onb-contact-email"
              >
                Business Email *
              </label>
              <input
                id="onb-contact-email"
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
                htmlFor="onb-destinations"
              >
                Destinations Served *
              </label>
              <input
                id="onb-destinations"
                type="text"
                required
                value={destinations}
                onChange={(e) => setDestinations(e.target.value)}
                placeholder="e.g., New Orleans, LA; Juneau, AK; Worldwide"
                className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
                htmlFor="onb-system"
              >
                Booking System *
              </label>
              <select
                id="onb-system"
                value={bookingSystem}
                onChange={(e) => handleBookingSystemChange(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                <option value="Rezdy Native REST API v1">Rezdy (Native REST API v1)</option>
                <option value="FareHarbor External API v1">FareHarbor (External API v1)</option>
                <option value="Bókun REST API">Bókun (Native REST API)</option>
                <option value="Ventrata / OCTO Core v1.2">Ventrata / OCTO Core v1.2</option>
                <option value="TourCMS Native / OCTO API">TourCMS (Palisis)</option>
                <option value="Custom Operator REST API">Custom Operator REST API</option>
                <option value="no_api">No API Access Available (Continue via Viator)</option>
              </select>
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
              htmlFor="onb-api-docs"
            >
              API Documentation URL / Specification Reference{" "}
              {bookingSystem !== "no_api" ? "*" : "(Optional if No API)"}
            </label>
            <input
              id="onb-api-docs"
              type="url"
              required={bookingSystem !== "no_api" && authorizedApiAccessAvailable}
              value={apiDocumentationUrl}
              onChange={(e) => setApiDocumentationUrl(e.target.value)}
              placeholder="https://developers.rezdy.com/ or provider API specification URL"
              className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/80">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={authorizedApiAccessAvailable}
                onChange={(e) => setAuthorizedApiAccessAvailable(e.target.checked)}
                className="mt-1"
              />
              <span>
                <strong>Authorized API Access Confirmation:</strong> Our company has (or can authorize) provider-approved API access for our booking system. (Direct partnerships are API-only; without an API connection, we cannot switch bookings to direct and existing verified listings can continue through Viator.)
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={operatorPermissionConfirmed}
                onChange={(e) => setOperatorPermissionConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span>
                <strong>Operator Permission &amp; Commercial Terms Separation *:</strong> I confirm I have operator permission to submit this application for technical review, and I understand the proposed 10% commission on completed direct bookings is separate from signed commercial and settlement terms (submitting this form does not authorize sales until commercial terms are signed and technical verification passes).
              </span>
            </label>
          </div>

          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
              htmlFor="onb-notes"
            >
              Notes on Product Catalog or Policies (Do NOT include API keys or secrets)
            </label>
            <textarea
              id="onb-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes on tour codes, seasonal operating windows, or cancellation/cruise-return policies…"
              className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-cyan-400 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-300 transition disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Operator Onboarding Application"}
          </button>

          {result ? (
            <div
              role="status"
              className={`rounded-2xl border p-5 text-xs leading-6 ${
                result.ok
                  ? "border-emerald-400/40 bg-emerald-950/30 text-emerald-100"
                  : "border-rose-400/40 bg-rose-950/30 text-rose-100"
              }`}
            >
              <p className="font-bold text-sm">
                {result.ok
                  ? `Status: ${result.applicationStatus} (Application ID: ${result.applicationId})`
                  : `Submission Error (${result.errorCode || "error"})`}
              </p>
              <p className="mt-1">{result.message || result.commercialTermsNote}</p>
              {result.ok && result.persisted ? (
                <div className="mt-2 rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-white/80 space-y-1">
                  <p>• Durable Storage: {result.storageBackend} (verified post-write read-back)</p>
                  <p>• Private Review Queue State: {result.reviewQueueState}</p>
                  <p>• Applicant Retrieval Token: {result.retrievalToken}</p>
                </div>
              ) : null}
              {result.credentialArrangementNote ? (
                <p className="mt-2 text-white/75">{result.credentialArrangementNote}</p>
              ) : null}
            </div>
          ) : null}
        </form>
      )}
    </div>
  );
}
