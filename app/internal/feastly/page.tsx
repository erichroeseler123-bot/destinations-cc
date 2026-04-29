import type { Metadata } from "next";
import { neon } from "@neondatabase/serverless";
import { SquareClient, SquareEnvironment, type Payment } from "square";
import { listRecentProductionCorridorEvents } from "@/lib/dcc/telemetry/corridorEvents";
import { hasDb } from "@/lib/db/client";
import {
  getSquareAccessToken,
  getSquareEnvironment,
  getSquareLocationId,
} from "@/lib/squareConfig";

const FEASTLY_ROUTE = "feastly-dinner-night";
const FEASTLY_BOOKING_FEE_CENTS = 50000;

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Internal Feastly | Destination Command Center",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

type DataResult<T> = {
  ok: boolean;
  connected: boolean;
  message: string;
  rows: T[];
};

type TelemetryRow = {
  id: string;
  occurredAt: string;
  sourcePage: string;
  product: string;
  handoffId: string;
};

type HelperApplicationRow = {
  id: string;
  createdAt: string;
  name: string;
  market: string;
  status: string;
};

type SquarePaymentRow = {
  id: string;
  createdAt: string;
  status: string;
};

function databaseUrl() {
  return (
    process.env.DCC_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ""
  ).trim();
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "-";
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
}

function squareEnvironment(value?: string) {
  return value?.toLowerCase() === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;
}

function squareAmountCents(value: unknown) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapTelemetryEvent(event: Awaited<ReturnType<typeof listRecentProductionCorridorEvents>>[number]): TelemetryRow {
  return {
    id: String(event.eventId),
    occurredAt: formatDate(event.occurredAt),
    sourcePage: event.sourcePage || "-",
    product: event.clickedProductSlug || event.defaultCardSlug || "-",
    handoffId: event.handoffId || "-",
  };
}

async function readTelemetry() {
  if (!hasDb()) {
    return {
      connected: false,
      message: "DB not connected",
      bookingOpens: [] as TelemetryRow[],
      bookingsCompleted: [] as TelemetryRow[],
    };
  }

  try {
    const events = await listRecentProductionCorridorEvents(500);
    const feastlyEvents = events.filter((event) => event.corridorId === FEASTLY_ROUTE);

    return {
      connected: true,
      message: "DB connected",
      bookingOpens: feastlyEvents
        .filter((event) => event.eventName === "booking_opened")
        .slice(0, 10)
        .map(mapTelemetryEvent),
      bookingsCompleted: feastlyEvents
        .filter((event) => event.eventName === "booking_completed")
        .slice(0, 10)
        .map(mapTelemetryEvent),
    };
  } catch {
    return {
      connected: true,
      message: "Telemetry unavailable",
      bookingOpens: [] as TelemetryRow[],
      bookingsCompleted: [] as TelemetryRow[],
    };
  }
}

async function readHelperApplications(): Promise<DataResult<HelperApplicationRow>> {
  const url = databaseUrl();
  if (!url) {
    return { ok: false, connected: false, message: "DB not connected", rows: [] };
  }

  try {
    const sql = neon(url);
    const rows = await sql`
      SELECT
        id,
        full_name,
        city_market,
        status,
        created_at::text AS created_at
      FROM feastly_host_applications
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return {
      ok: true,
      connected: true,
      message: "Helper applications connected",
      rows: rows.map((row) => ({
        id: String(row.id || "-"),
        createdAt: formatDate(String(row.created_at || "")),
        name: String(row.full_name || "-"),
        market: String(row.city_market || "-"),
        status: String(row.status || "-"),
      })),
    };
  } catch {
    return { ok: false, connected: true, message: "Helper applications unavailable", rows: [] };
  }
}

async function readSquarePayments(): Promise<DataResult<SquarePaymentRow>> {
  const token = getSquareAccessToken();
  const locationId = getSquareLocationId();

  if (!token || !locationId) {
    return { ok: false, connected: false, message: "Square not connected", rows: [] };
  }

  try {
    const client = new SquareClient({
      token,
      environment: squareEnvironment(getSquareEnvironment()),
    });
    const page = await client.payments.list({
      locationId,
      limit: 25,
      sortField: "CREATED_AT",
      sortOrder: "DESC",
    });
    const rows: SquarePaymentRow[] = [];

    for await (const payment of page) {
      if (squareAmountCents(payment.amountMoney?.amount) !== FEASTLY_BOOKING_FEE_CENTS) continue;
      rows.push(mapSquarePayment(payment));
      if (rows.length >= 5) break;
    }

    return {
      ok: true,
      connected: true,
      message: "Square connected",
      rows,
    };
  } catch {
    return { ok: false, connected: true, message: "Square unavailable", rows: [] };
  }
}

function mapSquarePayment(payment: Payment): SquarePaymentRow {
  return {
    id: payment.id || "-",
    createdAt: formatDate(payment.createdAt || payment.updatedAt || ""),
    status: payment.status || "-",
  };
}

function TextList<T>({
  rows,
  empty,
  render,
}: {
  rows: T[];
  empty: string;
  render: (row: T) => string;
}) {
  if (!rows.length) return <p>{empty}</p>;
  return (
    <ul>
      {rows.map((row, index) => (
        <li key={index}>{render(row)}</li>
      ))}
    </ul>
  );
}

export default async function FeastlyInternalPage() {
  const [telemetry, helperApplications, squarePayments] = await Promise.all([
    readTelemetry(),
    readHelperApplications(),
    readSquarePayments(),
  ]);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Feastly Ops</h1>

      <section>
        <h2>Bookings Completed:</h2>
        <TextList
          rows={telemetry.bookingsCompleted}
          empty="none"
          render={(row) => `${row.occurredAt} | source=${row.sourcePage} | product=${row.product} | handoff=${row.handoffId}`}
        />
        {squarePayments.rows.length ? (
          <>
            <p>Square $500 payments:</p>
            <TextList
              rows={squarePayments.rows}
              empty="none"
              render={(row) => `${row.createdAt} | payment=${row.id} | status=${row.status}`}
            />
          </>
        ) : null}
      </section>

      <section>
        <h2>Booking Opens:</h2>
        <TextList
          rows={telemetry.bookingOpens}
          empty="none"
          render={(row) => `${row.occurredAt} | source=${row.sourcePage} | product=${row.product} | handoff=${row.handoffId}`}
        />
      </section>

      <section>
        <h2>Helper Applications:</h2>
        <TextList
          rows={helperApplications.rows}
          empty="none"
          render={(row) => `${row.createdAt} | ${row.name} | ${row.market} | status=${row.status}`}
        />
      </section>

      <section>
        <h2>System Status:</h2>
        <ul>
          <li>{telemetry.connected ? "DB connected" : "DB not connected"}</li>
          <li>{squarePayments.connected ? "Square connected" : "Square not connected"}</li>
          <li>Telemetry: {telemetry.message}</li>
          <li>Helper applications: {helperApplications.message}</li>
          <li>Square payments: {squarePayments.message}</li>
        </ul>
      </section>
    </main>
  );
}
