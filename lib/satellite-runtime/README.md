# Satellite Runtime Kit

The Satellite Runtime Kit is the shared contract layer for DCC-connected satellite apps. Its job is to remove repeated wiring from new brands and corridors before that repetition turns into drift.

This first version is intentionally small: documentation, types, normalizers, stubs, and smoke-test helpers. It does not refactor any live satellite and it does not touch PARR checkout, payment, booking, Square, or Red Rocks money flows.

## Baseline Contract

Every satellite should be able to produce or consume these fields:

| Field | Purpose |
| --- | --- |
| `satelliteId` | Stable machine id for the satellite node. |
| `brandId` | Brand identity used for reporting, mailer identity, and future templates. |
| `dccBaseUrl` | Destination Command Center origin for control-plane calls. |
| `dccHandoffId` | Durable id that links the full lifecycle across DCC, satellite, payment, and telemetry. |
| `decision_corridor` | The decision lane, market, or corridor that produced the handoff. |
| `decision_action` | The next operational action requested by DCC or the satellite. |
| `decision_option` | Optional selected buyer/operator option. |
| `decision_product` | Optional product or service being handed off. |
| `source_url` | Page or surface that initiated the handoff. |
| `destination_url` | Page or surface receiving the handoff. |
| `event_name` | Telemetry lifecycle event name. |
| `event_payload` | Structured event payload. Keep PII out unless explicitly required. |

## Modules

- `types.ts`: shared TypeScript contract definitions.
- `env.ts`: baseline env validation and hard-fail helper.
- `handoff.ts`: URL/search-param/object parsing and `decision_*` normalization.
- `telemetry.ts`: DCC telemetry envelope builder and emitter.
- `paymentSession.ts`: payment session request builder plus a dry-run-first DCC client stub.
- `mailer.ts`: mailer brand config stub and env resolver.
- `smokeTest.ts`: quick runtime contract smoke test.

## 5-Minute Satellite Test

Minimum steps to wire a new satellite:

1. Define a `SatelliteContract` with `satelliteId`, `brandId`, and `dccBaseUrl`.
2. Add the baseline env keys: `SATELLITE_ID`, `SATELLITE_BRAND_ID`, `DCC_BASE_URL`, and `DCC_SATELLITE_SECRET`.
3. Parse the incoming URL or query params with `parseSatelliteHandoff`.
4. Emit a dry telemetry event with `buildTelemetryEvent` or `emitTelemetry` in a non-production path.
5. Run `runSatelliteSmokeTest` and require all checks to pass before deploying.
6. Keep `createPaymentSession` in dry-run mode until the DCC payment-session endpoint is live and verified.

If those steps take more than five minutes for a new satellite, the repeated setup belongs in this kit.

## Security Posture

The kit assumes satellites authenticate to DCC with `x-dcc-satellite-token`. Do not expose this token to browser code. Client-side components should call local satellite routes, and those server routes should call DCC with the secret.

The payment client is a stub by default. `dryRun` is enabled unless explicitly disabled, so adopting the kit cannot accidentally change live payment behavior.
