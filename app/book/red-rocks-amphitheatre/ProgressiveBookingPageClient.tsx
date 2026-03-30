"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCheckoutPricing, getCheckoutProduct } from "@/lib/checkoutProducts";
import { buildParrPrivateRedRocksUrl, buildParrSharedRedRocksUrl } from "@/lib/dcc/contracts/dccParrBridge";
import { PARR_OPERATOR, PARR_PICKUP_HUBS } from "@/lib/parrOperator";

type ServiceType = "private" | "shared" | null;
type StepKey =
  | "service"
  | "shared-location"
  | "shared-passengers"
  | "details"
  | "contact"
  | "pickup"
  | "payment";

type SharedLocationKey = "denver" | "golden" | null;

const SHARED_LOCATIONS = {
  denver: {
    key: "denver",
    city: PARR_PICKUP_HUBS.denver.city,
    label: PARR_PICKUP_HUBS.denver.shortLabel,
    pickup: PARR_PICKUP_HUBS.denver.pickupText,
    productKey: "parr-shared-denver",
    priceCents: 6500,
  },
  golden: {
    key: "golden",
    city: PARR_PICKUP_HUBS.golden.city,
    label: PARR_PICKUP_HUBS.golden.shortLabel,
    pickup: PARR_PICKUP_HUBS.golden.pickupText,
    productKey: "parr-shared-golden",
    priceCents: 5900,
  },
} as const;

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDatePreview(value: string) {
  if (!value) return "Select concert date";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StepShell({
  visible,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-[28px] border border-white/10 bg-black/25 p-5 transition-all duration-200 sm:p-6 ${
        visible ? "block translate-y-0 opacity-100" : "hidden translate-y-2 opacity-0"
      }`}
    >
      <p className="text-base font-black uppercase tracking-[0.2em] text-orange-300 sm:text-lg">{eyebrow}</p>
      <h2 className="mt-2 text-4xl font-black text-white sm:text-5xl">{title}</h2>
      {subtitle ? <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ProgressiveBookingPageClient() {
  const router = useRouter();
  const privateProduct = useMemo(() => getCheckoutProduct("parr-suburban"), []);
  const privatePricing = useMemo(
    () => getCheckoutPricing("parr-private", "parr-suburban", 1),
    [],
  );

  const [serviceType, setServiceType] = useState<ServiceType>(null);
  const [step, setStep] = useState<StepKey>("service");
  const [sharedLocation, setSharedLocation] = useState<SharedLocationKey>(null);
  const [sharedQty, setSharedQty] = useState(1);
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [pickup, setPickup] = useState("");
  const [pickupTime, setPickupTime] = useState("4:30 PM");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const selectedSharedLocation = sharedLocation ? SHARED_LOCATIONS[sharedLocation] : null;
  const sharedTotalCents = selectedSharedLocation ? selectedSharedLocation.priceCents * sharedQty : 0;
  const summaryTitle =
    serviceType === "private"
      ? privateProduct?.title || "Red Rocks Private Suburban"
      : serviceType === "shared"
        ? `Red Rocks Shared Shuttle${selectedSharedLocation ? ` - ${selectedSharedLocation.city}` : ""}`
        : "Choose service";
  const summaryPickup =
    serviceType === "private"
      ? pickup || "Add pickup address"
      : selectedSharedLocation?.pickup || "Choose pickup location";
  const summaryRiders = serviceType === "private" ? 6 : sharedQty;
  const totalCents = serviceType === "private" ? privatePricing?.totalCents || 0 : sharedTotalCents;
  const depositCents =
    serviceType === "private" ? privatePricing?.amountDueNowCents || 0 : sharedTotalCents;

  const canContinuePayment =
    Boolean(serviceType) &&
    Boolean(date) &&
    Boolean(eventName.trim()) &&
    Boolean(name.trim()) &&
    Boolean(email.trim()) &&
    Boolean(phone.trim()) &&
    (serviceType === "private" ? Boolean(pickup.trim()) : Boolean(selectedSharedLocation));

  function advance(nextStep: StepKey) {
    setStep(nextStep);
  }

  function chooseService(nextService: ServiceType) {
    setServiceType(nextService);
    if (nextService === "shared") {
      setPickup("");
      advance("shared-location");
      return;
    }
    advance("details");
  }

  function chooseSharedLocation(location: SharedLocationKey) {
    if (!location) return;
    setSharedLocation(location);
    advance("shared-passengers");
  }

  function continueToNextAfterPassengers() {
    advance("details");
  }

  function continueAfterDetails() {
    advance("contact");
  }

  function continueAfterContact() {
    if (serviceType === "private") {
      advance("pickup");
      return;
    }
    advance("payment");
  }

  function continueAfterPickup() {
    advance("payment");
  }

  function continueToCheckout() {
    if (canContinuePayment === false) return;

    if (serviceType === "shared" && selectedSharedLocation) {
      const params = new URLSearchParams({
        route: "parr-shared",
        product: selectedSharedLocation.productKey,
        date,
        qty: String(sharedQty),
        partySize: String(sharedQty),
        pickup: selectedSharedLocation.pickup,
        dropoff: "Red Rocks Amphitheatre",
        pickupTime: "Shared shuttle pickup time confirmed after booking",
      });

      router.push(buildParrSharedRedRocksUrl(Object.fromEntries(params.entries())));
      return;
    }

    if (serviceType === "private" && privateProduct) {
      const params = new URLSearchParams({
        route: "parr-private",
        product: privateProduct.key,
        date,
        qty: "1",
        partySize: "6",
        pickup,
        dropoff: "Red Rocks Amphitheatre",
        pickupTime,
      });

      router.push(buildParrPrivateRedRocksUrl(Object.fromEntries(params.entries())));
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0f16] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
              Transportation operated by {PARR_OPERATOR.name}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              One page. One path. Fast on mobile.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              DCC keeps the Red Rocks planning and authority layer clear. {PARR_OPERATOR.name} handles the live transportation side with shared Denver and Golden pickups plus private vehicles for groups.
            </p>
          </div>
          <div className="hidden rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-right lg:block">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Operator</div>
            <div className="mt-2 text-lg font-bold text-white">{PARR_OPERATOR.name}</div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="order-1 rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-2xl sm:p-6">
            <div className="grid gap-5">
              <StepShell
                visible={step === "service"}
                eyebrow="#1"
                title="Pick service"
                subtitle="Tap once and move. Shared is fastest. Private gives your group one vehicle and a return ride after the show."
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => chooseService("private")}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-6 text-left transition hover:border-white/20 active:scale-[0.98]"
                  >
                    <div className="text-4xl font-black text-white sm:text-5xl">Private ride</div>
                    <p className="mt-3 text-lg leading-8 text-slate-300 sm:text-xl">
                      Red Rocks Private Suburban. One pickup address. Guaranteed ride home.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => chooseService("shared")}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-6 text-left transition hover:border-white/20 active:scale-[0.98]"
                  >
                    <div className="text-4xl font-black text-white sm:text-5xl">Shared shuttle</div>
                    <p className="mt-3 text-lg leading-8 text-slate-300 sm:text-xl">
                      Fixed pickup spots. Lower price. Fastest way to lock in a seat.
                    </p>
                  </button>
                </div>
              </StepShell>

              <StepShell
                visible={step === "shared-location"}
                eyebrow="#2"
                title="Pick pickup"
                subtitle="No typing. Tap your stop and keep going."
              >
                <div className="grid gap-3">
                  {Object.values(SHARED_LOCATIONS).map((location) => (
                    <button
                      key={location.key}
                      type="button"
                      onClick={() => chooseSharedLocation(location.key)}
                      className="rounded-[24px] border border-white/10 bg-[#141923] p-6 text-left transition hover:border-white/20 active:scale-[0.98]"
                    >
                      <div className="text-4xl font-black text-white sm:text-5xl">
                        {location.city} · {formatMoney(location.priceCents)}
                      </div>
                      <p className="mt-3 text-lg leading-8 text-slate-300 sm:text-xl">{location.label}</p>
                    </button>
                  ))}
                </div>
              </StepShell>

              <StepShell
                visible={step === "shared-passengers"}
                eyebrow="#3"
                title="How many tickets?"
                subtitle="Set the rider count, then move on."
              >
                <div className="flex items-center justify-center gap-5 py-6">
                  <button
                    type="button"
                    onClick={() => setSharedQty((value) => Math.max(1, value - 1))}
                    className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/5 text-4xl font-black text-white sm:h-24 sm:w-24 sm:text-5xl"
                  >
                    -
                  </button>
                  <div className="min-w-28 text-center">
                    <div className="text-6xl font-black text-white sm:text-7xl">{sharedQty}</div>
                    <div className="mt-2 text-sm uppercase tracking-[0.18em] text-slate-400 sm:text-base">Tickets</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSharedQty((value) => Math.min(12, value + 1))}
                    className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/5 text-4xl font-black text-white sm:h-24 sm:w-24 sm:text-5xl"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={continueToNextAfterPassengers}
                  className="flex min-h-16 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-lg font-black text-slate-950 sm:text-xl"
                >
                  Continue
                </button>
              </StepShell>

              <StepShell
                visible={step === "details"}
                eyebrow={serviceType === "shared" ? "#4" : "#2"}
                title="Show details"
                subtitle="Keep this tight. Just what we need to match the ride."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-base font-bold text-white sm:text-lg">
                    Artist / show name
                    <input
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="Megan Moroney at Red Rocks"
                      className="mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-lg text-white sm:text-xl placeholder:text-slate-500"
                    />
                  </label>
                  <label className="block text-base font-bold text-white sm:text-lg">
                    Concert date
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-lg text-white sm:text-xl"
                    />
                  </label>
                  {serviceType === "private" ? (
                    <label className="block text-base font-bold text-white sm:text-lg">
                      Pickup time
                      <input
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        placeholder="4:30 PM"
                        className="mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-lg text-white sm:text-xl placeholder:text-slate-500"
                      />
                    </label>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={continueAfterDetails}
                  disabled={!eventName.trim() || !date}
                  className="mt-5 flex min-h-16 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-lg font-black text-slate-950 disabled:opacity-50 sm:text-xl"
                >
                  Continue
                </button>
              </StepShell>

              <StepShell
                visible={step === "contact"}
                eyebrow={serviceType === "shared" ? "#5" : "#3"}
                title="Contact"
                subtitle="Make autofill do the work."
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block text-base font-bold text-white sm:text-lg">
                    Full name
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      placeholder="Your full name"
                      className="mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-lg text-white sm:text-xl placeholder:text-slate-500"
                    />
                  </label>
                  <label className="block text-base font-bold text-white sm:text-lg">
                    Email
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      className="mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-lg text-white sm:text-xl placeholder:text-slate-500"
                    />
                  </label>
                  <label className="block text-base font-bold text-white sm:text-lg">
                    Phone
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="(555) 555-5555"
                      className="mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-lg text-white sm:text-xl placeholder:text-slate-500"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={continueAfterContact}
                  disabled={!name.trim() || !email.trim() || !phone.trim()}
                  className="mt-5 flex min-h-16 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-lg font-black text-slate-950 disabled:opacity-50 sm:text-xl"
                >
                  Continue
                </button>
              </StepShell>

              <StepShell
                visible={step === "pickup"}
                eyebrow="#4"
                title="Pickup"
                subtitle="Private rides use one exact pickup address."
              >
                <label className="block text-base font-bold text-white sm:text-lg">
                  Pickup address
                  <input
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    autoComplete="street-address"
                    placeholder="Hotel, Airbnb, or home pickup address"
                    className="mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-lg text-white sm:text-xl placeholder:text-slate-500"
                  />
                </label>
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-base leading-7 text-emerald-50/90 sm:text-lg">
                  Drop-off is fixed: <span className="font-bold text-white">Red Rocks Amphitheatre</span>.
                  Return after the show is included.
                </div>
                <button
                  type="button"
                  onClick={continueAfterPickup}
                  disabled={!pickup.trim()}
                  className="mt-5 flex min-h-16 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-lg font-black text-slate-950 disabled:opacity-50 sm:text-xl"
                >
                  Continue
                </button>
              </StepShell>

              <StepShell
                visible={step === "payment"}
                eyebrow={serviceType === "shared" ? "#6" : "#5"}
                title="Payment"
                subtitle="Wallet first. Card second."
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xl font-black text-white sm:text-2xl">Express checkout first</div>
                  <p className="mt-2 text-base leading-7 text-slate-300 sm:text-lg">
                    Apple Pay and Google Pay should be the fastest possible finish from here.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      className="min-h-16 rounded-2xl border border-white/15 bg-black text-lg font-black text-white sm:text-xl"
                    >
                      Apple Pay
                    </button>
                    <button
                      type="button"
                      className="min-h-16 rounded-2xl border border-white/15 bg-white text-lg font-black text-slate-950 sm:text-xl"
                    >
                      Google Pay
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xl font-black text-white sm:text-2xl">Card fallback</div>
                  <p className="mt-2 text-base leading-7 text-slate-300 sm:text-lg">
                    Full card entry only shows if the wallet path is not available.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={continueToCheckout}
                  disabled={!canContinuePayment}
                  className="mt-5 flex min-h-16 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-lg font-black text-slate-950 disabled:opacity-50 sm:text-xl"
                >
                  {serviceType === "shared" ? "Continue to secure checkout" : "Continue to secure deposit"}
                </button>
              </StepShell>
            </div>
          </section>

          <aside className="order-2 rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-2xl lg:sticky lg:top-6 lg:self-start">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-300 sm:text-base">Booking summary</p>
            <h2 className="mt-3 text-2xl font-black">{summaryTitle}</h2>
            <div className="mt-5 space-y-3 text-base text-slate-200 sm:text-lg">
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-400">Show</span>
                <span className="text-right text-lg font-semibold sm:text-xl">{eventName || "Add show name"}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-400">Date</span>
                <span className="text-right text-lg font-semibold sm:text-xl">{formatDatePreview(date)}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-400">Pickup</span>
                <span className="text-right text-lg font-semibold sm:text-xl">{summaryPickup}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-400">Pickup time</span>
                <span className="text-right text-lg font-semibold sm:text-xl">
                  {serviceType === "private" ? pickupTime : "Fixed before show"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-400">{serviceType === "shared" ? "Tickets" : "Riders"}</span>
                <span className="text-right text-lg font-semibold sm:text-xl">{summaryRiders}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-400">Total</span>
                <span className="text-right text-2xl font-black text-white">
                  {formatMoney(totalCents)}
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <div className="text-sm font-bold text-emerald-200">
                {serviceType === "shared" ? "Flat pickup pricing" : "Return ride after the show"}
              </div>
              <div className="mt-2 text-sm text-emerald-50/85">
                {serviceType === "shared"
                  ? "The price is baked into the pickup button, so the traveler knows the total path early."
                  : "One vehicle, one pickup plan, and a return ride after the show."}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Operator</div>
              <h3 className="mt-2 text-xl font-black text-white">{PARR_OPERATOR.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{PARR_OPERATOR.summary}</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-200">
                {PARR_OPERATOR.trustPoints.map((point) => (
                  <div key={point}>{point}</div>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {PARR_OPERATOR.pickupHubs.map((hub) => (
                  <div key={hub.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-sm font-bold text-white">{hub.businessName}</div>
                    <div className="mt-1 text-sm text-slate-300">{hub.address}</div>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <a
                        href={hub.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-xs font-black uppercase tracking-[0.14em] text-orange-300 no-underline"
                      >
                        Open in Maps
                      </a>
                      {hub.websiteUrl ? (
                        <a
                          href={hub.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-xs font-black uppercase tracking-[0.14em] text-slate-200 no-underline"
                        >
                          Official hotel website
                        </a>
                      ) : null}
                      {hub.menuUrl ? (
                        <a
                          href={hub.menuUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-xs font-black uppercase tracking-[0.14em] text-slate-200 no-underline"
                        >
                          Official menu
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
                <div className="font-semibold text-white">{PARR_OPERATOR.supportLabel}</div>
                <p className="mt-2">Questions about pickup, payment, or your ride? Text <a href={PARR_OPERATOR.supportSmsUrl} className="text-orange-300 no-underline">{PARR_OPERATOR.supportPhone}</a> or email <a href={PARR_OPERATOR.supportEmailUrl} className="text-orange-300 no-underline">{PARR_OPERATOR.supportEmail}</a>.</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={PARR_OPERATOR.website}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/14 bg-white/6 px-4 py-2 text-[12px] font-black uppercase tracking-[0.16em] text-white no-underline transition hover:border-white/24 hover:bg-white/10"
                >
                  Visit {PARR_OPERATOR.name}
                </a>
                <Link
                  href="/red-rocks"
                  className="rounded-full border border-white/14 bg-white/6 px-4 py-2 text-[12px] font-black uppercase tracking-[0.16em] text-white no-underline transition hover:border-white/24 hover:bg-white/10"
                >
                  DCC Red Rocks Guide
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-2 text-sm text-slate-300">
              <div>Big tap targets</div>
              <div>No page reloads</div>
              <div>Autofill-friendly contact</div>
              <div>Express checkout at payment</div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Due now</div>
              <div className="mt-2 text-3xl font-black text-white">{formatMoney(depositCents)}</div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
