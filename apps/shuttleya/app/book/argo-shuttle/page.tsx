import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ArgoShuttleClient from "./ArgoShuttleClient";
import {
  ARGO_SEAT_PRICE_CENTS,
  ARGO_SHUTTLE_SLOTS,
  resolveArgoReservation,
} from "@/lib/argoReservation";
import { readCanonicalSquareEnv } from "@/lib/squareEnvDrift";

type SearchParamsValue = string | string[] | undefined;

export const metadata: Metadata = {
  title: "Argo Shuttle from Denver ($35) | Book Direct",
  description:
    "Book the $35 Argo shuttle from Denver direct on Shuttleya with an 8:00 AM departure and 11:30-11:45 AM return.",
  alternates: { canonical: "/book/argo-shuttle" },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Argo Shuttle from Denver ($35) | Book Direct",
    description:
      "Book the $35 Argo shuttle from Denver direct on Shuttleya with 8:00 AM departure and return handled.",
    url: "https://shuttleya.com/book/argo-shuttle",
    type: "website",
  },
};

function getSquareApplicationId() {
  return readCanonicalSquareEnv(
    ["NEXT_PUBLIC_SQUARE_APP_ID", "SQUARE_APP_ID"],
    [
      { name: "NEXT_PUBLIC_SQUARE_APPLICATION_ID", replacement: "NEXT_PUBLIC_SQUARE_APP_ID" },
      { name: "SQUARE_Sandbox_App_ID", replacement: "SQUARE_APP_ID" },
    ],
    "shuttleya.square.application_id",
  );
}

function getSquareLocationId() {
  return readCanonicalSquareEnv(
    ["NEXT_PUBLIC_SQUARE_LOCATION_ID", "SQUARE_LOCATION_ID"],
    [{ name: "SQUARE_location_id", replacement: "SQUARE_LOCATION_ID" }],
    "shuttleya.square.location_id",
  );
}

function isArgoPrelaunch() {
  return process.env.NEXT_PUBLIC_ARGO_PRELAUNCH?.trim().toLowerCase() === "true";
}

function readFirst(value: SearchParamsValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ArgoShuttlePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, SearchParamsValue>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    const first = readFirst(value);
    if (first) params.set(key, first);
  }

  const initialResolution = resolveArgoReservation(params);
  const primarySlot = ARGO_SHUTTLE_SLOTS[0];
  const seatPriceDollars = ARGO_SEAT_PRICE_CENTS / 100;

  return (
    <main>
      <section className="hero">
        <div className="eyebrow">Mighty Argo shuttle booking</div>
        <h1>Book the Mighty Argo shuttle from Denver to Idaho Springs.</h1>
        <p className="lead">
          Verdict: use the fixed Shuttleya Argo shuttle when you want the Denver pickup, Idaho Springs visit window, and return plan decided before arrival.
        </p>
        <section className="card" style={{ marginTop: 18 }}>
          <div className="step-label">DCC field note</div>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            Idaho Springs trips are easier when the return plan is decided before arrival.
          </p>
        </section>
        <div className="cta-row">
          <a href="#argo-booking" className="button">
            Continue to Argo booking
          </a>
          <Link href="/" className="button-secondary">
            Review Shuttleya first
          </Link>
        </div>
        <div className="bento-grid" aria-label="Mighty Argo shuttle booking summary">
          <div className="bento-card bento-ticket bento-ticket-gold">
            <span className="ticket-kicker">Daily shuttle</span>
            <strong>{primarySlot.runLabel}</strong>
            <span>{primarySlot.departureLabel.replace(" departure", "")} out</span>
            <span>{primarySlot.returnLabel.replace(" return", "")} back</span>
          </div>
          <div className="bento-card bento-price">
            <span className="ticket-kicker">Round trip seats from</span>
            <strong>${seatPriceDollars}</strong>
            <span>Per person. Round trip.</span>
          </div>
          <div className="bento-card bento-ticket bento-ticket-dark">
            <span className="ticket-kicker">Static verdict</span>
            <strong>Book the shuttle</strong>
            <span>Mighty Argo</span>
            <span>Idaho Springs</span>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <ArgoShuttleClient
          squareApplicationId={getSquareApplicationId()}
          squareLocationId={getSquareLocationId()}
          prelaunchMode={isArgoPrelaunch()}
          initialResolution={initialResolution}
        />
      </Suspense>
    </main>
  );
}
