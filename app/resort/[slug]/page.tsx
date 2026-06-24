import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getResortConfig, listResortConfigs } from "@/src/data/resorts-config";
import ResortCommandDeckClient from "./ResortCommandDeckClient";
import { createPaymentSession } from "@/lib/satellite-runtime/paymentSession";
import { emitTelemetry } from "@/lib/satellite-runtime/telemetry";
import type { SatelliteHandoffContext, SatelliteTelemetryInput } from "@/lib/satellite-runtime/types";

interface ResortPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-static";

export function generateStaticParams() {
  return listResortConfigs().map((resort) => ({
    slug: resort.slug,
  }));
}

export async function generateMetadata({ params }: ResortPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resort = getResortConfig(slug);

  if (!resort) {
    return {
      title: "Resort OS | Destination Command Center",
    };
  }

  return {
    title: `${resort.name} Large Group Dinner Staging | Resort OS`,
    description: `Eliminate group dining coordination stress at ${resort.name}. Deploy Feastly Spread infrastructure for seamless, zero-prep food staging in your villa.`,
    alternates: {
      canonical: `/resort/${resort.slug}`,
    },
  };
}

export default async function ResortPage({ params }: ResortPageProps) {
  const { slug } = await params;
  const resort = getResortConfig(slug);

  if (!resort) {
    notFound();
  }

  // Server action to emit telemetry tracking events
  async function emitResortTelemetryAction(input: SatelliteTelemetryInput) {
    "use server";

    const satelliteSecret =
      process.env.DCC_SATELLITE_WEBHOOK_TOKEN?.trim() ||
      process.env.DCC_SATELLITE_SECRET?.trim();
    const internalSecret = process.env.INTERNAL_API_SECRET?.trim();

    if (!satelliteSecret || !internalSecret) return;

    await emitTelemetry(input, {
      satelliteSecret,
      fetchImpl: async (inputUrl, init) => {
        const headers = new Headers(init?.headers);
        headers.set("x-internal-secret", internalSecret);

        return fetch(inputUrl, {
          ...init,
          headers,
          cache: "no-store",
        });
      },
    });
  }

  // Server action for 10-person package checkout
  async function checkoutResortAction10(handoff: SatelliteHandoffContext) {
    "use server";

    const satelliteSecret = process.env.DCC_SATELLITE_SECRET?.trim();
    const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
    const fallbackUrl = resort!.checkoutLink10;

    if (!satelliteSecret || !internalSecret) {
      redirect(fallbackUrl);
    }

    try {
      const response = await createPaymentSession(
        {
          ...handoff,
          amountCents: 50000,
          currency: "USD",
          provider: "square",
          metadata: {
            source: `resort_os_${resort!.slug}`,
            event_name: "feastly_checkout_intent",
            package: "10_people",
          },
        },
        {
          satelliteSecret,
          dryRun: false,
          fetchImpl: async (inputUrl, init) => {
            const headers = new Headers(init?.headers);
            headers.set("x-internal-secret", internalSecret);

            return fetch(inputUrl, {
              ...init,
              headers,
              cache: "no-store",
            });
          },
        }
      );

      redirect(response.ok && response.checkoutUrl ? response.checkoutUrl : fallbackUrl);
    } catch (err) {
      console.error("Resort checkout session creation failed:", err);
      redirect(fallbackUrl);
    }
  }

  // Server action for 20-person package checkout
  async function checkoutResortAction20(handoff: SatelliteHandoffContext) {
    "use server";

    const satelliteSecret = process.env.DCC_SATELLITE_SECRET?.trim();
    const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
    const fallbackUrl = resort!.checkoutLink20;

    if (!satelliteSecret || !internalSecret) {
      redirect(fallbackUrl);
    }

    try {
      const response = await createPaymentSession(
        {
          ...handoff,
          amountCents: 85000,
          currency: "USD",
          provider: "square",
          metadata: {
            source: `resort_os_${resort!.slug}`,
            event_name: "feastly_checkout_intent",
            package: "20_people",
          },
        },
        {
          satelliteSecret,
          dryRun: false,
          fetchImpl: async (inputUrl, init) => {
            const headers = new Headers(init?.headers);
            headers.set("x-internal-secret", internalSecret);

            return fetch(inputUrl, {
              ...init,
              headers,
              cache: "no-store",
            });
          },
        }
      );

      redirect(response.ok && response.checkoutUrl ? response.checkoutUrl : fallbackUrl);
    } catch (err) {
      console.error("Resort checkout session creation failed:", err);
      redirect(fallbackUrl);
    }
  }

  return (
    <ResortCommandDeckClient
      resort={resort}
      emitTelemetryAction={emitResortTelemetryAction}
      checkoutAction10={checkoutResortAction10}
      checkoutAction20={checkoutResortAction20}
    />
  );
}
