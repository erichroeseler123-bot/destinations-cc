import type { SatelliteTelemetryEvent, SatelliteTelemetryInput, SatelliteTelemetryResult } from "./types";

export function buildTelemetryEvent(input: SatelliteTelemetryInput): SatelliteTelemetryEvent {
  return {
    satelliteId: input.satelliteId,
    brandId: input.brandId,
    handoffId: input.dccHandoffId,
    eventName: input.event_name,
    eventPayload: input.event_payload,
    occurredAt: input.occurredAt || new Date().toISOString(),
    decision: {
      decision_corridor: input.decision_corridor,
      decision_action: input.decision_action,
      decision_option: input.decision_option,
      decision_product: input.decision_product,
    },
    sourceUrl: input.source_url,
    destinationUrl: input.destination_url,
  };
}

export async function emitTelemetry(
  input: SatelliteTelemetryInput,
  options: {
    satelliteSecret?: string;
    fetchImpl?: typeof fetch;
    endpointPath?: string;
  } = {},
): Promise<SatelliteTelemetryResult> {
  const event = buildTelemetryEvent(input);
  const satelliteSecret = options.satelliteSecret?.trim();

  if (!satelliteSecret) {
    return { ok: false, event, error: "Missing satellite secret." };
  }

  const endpoint = new URL(options.endpointPath || "/api/internal/satellite-handoffs/events", input.dccBaseUrl);
  const fetcher = options.fetchImpl || fetch;

  try {
    const response = await fetcher(endpoint.toString(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-dcc-satellite-token": satelliteSecret,
      },
      body: JSON.stringify({
        satelliteId: event.satelliteId,
        handoffId: event.handoffId,
        eventType: event.eventName,
        occurredAt: event.occurredAt,
        payload: event.eventPayload,
        decision: event.decision,
        sourceUrl: event.sourceUrl,
        destinationUrl: event.destinationUrl,
      }),
    });

    return {
      ok: response.ok,
      status: response.status,
      event,
      error: response.ok ? undefined : `Telemetry endpoint returned ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      event,
      error: error instanceof Error ? error.message : "telemetry_emit_failed",
    };
  }
}
