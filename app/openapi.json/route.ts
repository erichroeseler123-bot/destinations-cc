import { CONNECTED_CRUISE_PORT_COUNT } from "@/lib/dcc/cruisePortDirectory";

export const dynamic = "force-static";

const OCTO_SANDBOX_NOTE =
  "Protocol sandbox / non-production: 0 external operators are currently live_authorized; DCC performs suitability evaluation, inquiry routing, and disclosed handoffs — no autonomous booking or delegated payment capture.";

export async function GET() {
  const document = {
    openapi: "3.1.0",
    info: {
      title: "Destination Command Center Location API",
      version: "2.0.0",
      description:
        "Dense coordinate-native public location intelligence. Latitude and longitude are the canonical DCC location key. Responses are assembled from geographically applicable public machine-readable sources.",
    },
    servers: [{ url: "https://www.destinationcommandcenter.com" }],
    paths: {
      "/api/location/{lat}/{lng}": {
        get: {
          operationId: "getLocationIntelligence",
          summary: "Get dense current public context for a coordinate",
          description:
            "Returns ordered modules for identity, current conditions, short-range forecast, hazards, water, official public data, events, machine feeds, and source freshness. Modules may be absent or empty when no mapped source applies.",
          parameters: [
            {
              name: "lat",
              in: "path",
              required: true,
              schema: { type: "number", minimum: -90, maximum: 90 },
              description: "Latitude. Canonical DCC URLs use five decimal places.",
            },
            {
              name: "lng",
              in: "path",
              required: true,
              schema: { type: "number", minimum: -180, maximum: 180 },
              description: "Longitude. Canonical DCC URLs use five decimal places.",
            },
            {
              name: "timezone",
              in: "query",
              required: false,
              schema: { type: "string", default: "auto" },
              description: "Optional timezone hint for legacy/configured event feeds. Core coordinate sources resolve timezone from the coordinate.",
            },
          ],
          responses: {
            "200": {
              description: "Dense DCC coordinate intelligence object",
              headers: {
                "X-DCC-Schema": { schema: { type: "string", const: "dcc-location-v2" } },
                "X-DCC-Coordinate": { schema: { type: "string" } },
              },
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DccLocationResponse" },
                },
              },
            },
            "400": { description: "Invalid coordinate" },
            "503": { description: "Coordinate accepted but location-intelligence sources are temporarily unavailable" },
          },
        },
      },
      "/octo/supplier": {
        get: {
          operationId: "getOctoSupplier",
          summary: "Get OCTO Supplier information",
          description: "Returns supplier identity, endpoint, contact information, and supported capabilities per OCTO Core v1.2.0.",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "OCTO Supplier profile" },
            "401": { description: "Invalid or missing Bearer token" },
          },
        },
      },
      "/octo/products": {
        get: {
          operationId: "listOctoProducts",
          summary: "List OCTO Products",
          description: "Returns all active tour and activity products available through the OCTO layer.",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Array of OCTO products" },
            "401": { description: "Invalid or missing Bearer token" },
          },
        },
      },
      "/octo/products/{productId}": {
        get: {
          operationId: "getOctoProduct",
          summary: "Get OCTO Product Details",
          parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "OCTO Product detail" },
            "404": { description: "Product not found" },
          },
        },
      },
      "/octo/availability/calendar": {
        post: {
          operationId: "getOctoAvailabilityCalendar",
          summary: "Check date-range availability calendar",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Calendar availability summary" },
          },
        },
      },
      "/octo/availability": {
        post: {
          operationId: "checkOctoAvailabilityCore",
          summary: "Check detailed live availability",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Available time slots, vacancies, and pricing" },
          },
        },
      },
      "/octo/bookings": {
        post: {
          operationId: "createOctoBooking",
          summary: "Create an OCTO reservation hold (protocol sandbox / non-production)",
          description: OCTO_SANDBOX_NOTE,
          security: [{ BearerAuth: [] }],
          responses: {
            "201": { description: "Booking hold created with utcHoldExpires (sandbox only)" },
            "400": { description: "Invalid request or insufficient availability" },
          },
        },
        get: {
          operationId: "listOctoBookings",
          summary: "List OCTO bookings (protocol sandbox / non-production)",
          description: OCTO_SANDBOX_NOTE,
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "List of bookings" },
          },
        },
      },
      "/octo/bookings/{bookingUuid}": {
        get: {
          operationId: "getOctoBookingByUuid",
          summary: "Retrieve booking status",
          parameters: [{ name: "bookingUuid", in: "path", required: true, schema: { type: "string" } }],
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Booking details" },
            "404": { description: "Booking not found" },
          },
        },
        patch: {
          operationId: "updateOctoBookingByUuid",
          summary: "Update passenger contact or notes on existing booking",
          parameters: [{ name: "bookingUuid", in: "path", required: true, schema: { type: "string" } }],
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Updated booking details" },
          },
        },
      },
      "/octo/bookings/{bookingUuid}/confirm": {
        post: {
          operationId: "confirmOctoBookingByUuid",
          summary: "Confirm on-hold booking (protocol sandbox / non-production)",
          description: OCTO_SANDBOX_NOTE,
          parameters: [{ name: "bookingUuid", in: "path", required: true, schema: { type: "string" } }],
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Booking confirmed with voucher (sandbox only)" },
            "410": { description: "Hold expired" },
          },
        },
      },
      "/octo/bookings/{bookingUuid}/cancel": {
        post: {
          operationId: "cancelOctoBookingByUuid",
          summary: "Cancel booking and initiate settlement adjustment",
          parameters: [{ name: "bookingUuid", in: "path", required: true, schema: { type: "string" } }],
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Booking cancelled" },
          },
        },
      },
      "/api/octo/participants": {
        get: {
          operationId: "listOctoParticipants",
          summary: "List authorized OCTO participants and ecosystem registry",
          description: "Returns connected operators, booking systems, resellers, and channel managers implementing the OCTO standard under DCC direct authority.",
          responses: {
            "200": { description: "List of OCTO participants" },
          },
        },
      },
      "/api/octo/availability": {
        post: {
          operationId: "checkOctoAvailability",
          summary: "Query OCTO availability (protocol sandbox / non-production)",
          description: `Protocol sandbox availability specification. ${OCTO_SANDBOX_NOTE}`,
          responses: {
            "200": { description: "Available time slots and pricing" },
          },
        },
      },
      "/api/octo/hold": {
        post: {
          operationId: "createOctoBookingHold",
          summary: "Reserve seats with explicit hold duration (protocol sandbox / non-production)",
          description: `Protocol sandbox / non-production two-phase reservation hold enforcing expirationMinutes per the OCTO Core specification. ${OCTO_SANDBOX_NOTE}`,
          responses: {
            "201": { description: "Hold created with utcHoldExpires timestamp (sandbox only)" },
          },
        },
      },
      "/api/octo/confirm": {
        post: {
          operationId: "confirmOctoBooking",
          summary: "Confirm held booking in OCTO sandbox (protocol sandbox / non-production)",
          description: `Protocol sandbox / non-production confirmation endpoint. ${OCTO_SANDBOX_NOTE}`,
          responses: {
            "200": { description: "Booking confirmed with voucher code (sandbox only)" },
            "410": { description: "Hold expired" },
          },
        },
      },
      "/api/octo/bookings/{id}": {
        get: {
          operationId: "getOctoBooking",
          summary: "Retrieve booking status and voucher details",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Booking details" } },
        },
        delete: {
          operationId: "cancelOctoBooking",
          summary: "Cancel reservation and trigger settlement refund",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Booking cancelled" } },
        },
      },
      "/.well-known/dcc": {
        get: {
          operationId: "getDccMachineWellKnown",
          summary: "Discover DCC Machine Layer capabilities, schemas, candidate universes, and active engines",
          responses: { "200": { description: "DCC Machine Layer discovery manifest and JSON Schemas" } },
        },
      },
      "/.well-known/dcc/keys.json": {
        get: {
          operationId: "getDccPublicSigningKeys",
          summary: "Discover public Ed25519 verification keys for signed DCC decision receipts",
          responses: { "200": { description: "Public signing key manifest (active, retired_verify_only, revoked)" } },
        },
      },
      "/api/v1/entities/{id}": {
        get: {
          operationId: "getMachineEntityById",
          summary: "Get canonical machine Entity by stable ID",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Machine Entity record" }, "404": { description: "Entity not found" } },
        },
      },
      "/api/v1/claims/{id}": {
        get: {
          operationId: "getMachineClaimById",
          summary: "Get machine Claim, immutable version history, conflicts, and retractions",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Machine Claim and version ledger" }, "404": { description: "Claim not found" } },
        },
      },
      "/api/v1/sources/{id}": {
        get: {
          operationId: "getMachineSourceById",
          summary: "Get authoritative Source, immutable SourceSnapshots, and EvidenceFragments",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Machine Source, snapshots, and evidence fragments" }, "404": { description: "Source not found" } },
        },
      },
      "/api/v1/rules/{id}": {
        get: {
          operationId: "getMachineRuleById",
          summary: "Get compiled Decision IR Rule and its claim-version dependencies",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Decision IR Rule" }, "404": { description: "Rule not found" } },
        },
      },
      "/api/v1/engines/{id}": {
        get: {
          operationId: "getMachineEngineById",
          summary: "Get Decision Engine metadata, active version pointer, available versions, and manifest",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Machine Engine metadata" }, "404": { description: "Engine not found" } },
        },
      },
      "/api/v1/bundles/{engineId}/{version}": {
        get: {
          operationId: "getMachineEngineBundle",
          summary: "Get immutable compiled Decision IR bundle for an engine and version",
          parameters: [
            { name: "engineId", in: "path", required: true, schema: { type: "string" } },
            { name: "version", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "Compiled DecisionIrBundle" }, "404": { description: "Bundle not found" } },
        },
      },
      "/api/v1/universes/{id}": {
        get: {
          operationId: "getCandidateUniverseById",
          summary: "Get declared, versioned, content-addressed CandidateUniverse artifact",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
            { name: "version", in: "query", required: false, schema: { type: "string" } },
          ],
          responses: { "200": { description: "CandidateUniverse artifact" }, "404": { description: "CandidateUniverse not found" } },
        },
      },
      "/api/v1/receipts/{id}": {
        get: {
          operationId: "getSignedDecisionReceiptById",
          summary: "Get content-addressed SignedDecisionReceipt and Ed25519 signature verification status",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "SignedDecisionReceipt and verification result" }, "404": { description: "Receipt not found" } },
        },
      },
      "/api/v1/evaluate": {
        post: {
          operationId: "evaluateDecisionIr",
          summary: "Deterministically evaluate a compiled DCC Decision IR bundle (compact or expanded provenance mode, with optional validAt and knownAt bitemporal parameters)",
          responses: { "200": { description: "Deterministic Compact or Expanded Evaluation Response" }, "400": { description: "Invalid request" }, "404": { description: "Engine or version not found" } },
        },
      },
      "/api/v1/evaluations:batch": {
        post: {
          operationId: "evaluateDecisionIrBatch",
          summary: "Batch-evaluate up to 250 Decision IR requests in a single deterministic pass",
          responses: { "200": { description: "Batch evaluation results" }, "400": { description: "Invalid batch request" } },
        },
      },
      "/api/v1/changes": {
        get: {
          operationId: "getMachineChangesFeed",
          summary: "Cursor-paginated epistemic change feed (published claims, supersessions, withdrawals, conflicts, bundle publications)",
          parameters: [
            { name: "since", in: "query", required: false, schema: { type: "integer", default: 0 } },
            { name: "limit", in: "query", required: false, schema: { type: "integer", default: 100 } },
          ],
          responses: { "200": { description: "Ordered change events and nextCursor" } },
        },
      },
      "/r/{id}": {
        get: {
          operationId: "resolveStableReference",
          summary: "Resolve a stable DCC reference URI (/r/{id}) to its current verified version and canonical citation URI",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Reference Resolution Envelope (JSON, JSON-LD, CSL-JSON, or HTML)" }, "404": { description: "Reference not found" } },
        },
        head: {
          operationId: "headStableReference",
          summary: "Verify existence, ETag, and Last-Modified of a stable DCC reference URI",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Headers only" }, "404": { description: "Not found" } },
        },
      },
      "/r/{id}/v/{version}": {
        get: {
          operationId: "resolveImmutableReferenceVersion",
          summary: "Resolve an immutable versioned DCC reference URI (/r/{id}/v/{version}) with immutable cache semantics",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
            { name: "version", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "Immutable Reference Resolution Envelope" }, "404": { description: "Reference or version not found" } },
        },
        head: {
          operationId: "headImmutableReferenceVersion",
          summary: "Verify existence, ETag, and immutable Cache-Control of a versioned DCC reference URI",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
            { name: "version", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "Headers only" }, "404": { description: "Not found" } },
        },
      },
      "/api/v1/cruise/port-day-excursions": {
        get: {
          operationId: "searchPortDayExcursions",
          summary: `Search cruise port-day shore excursions across all ${CONNECTED_CRUISE_PORT_COUNT} connected ports and evaluate deterministic sailing-window timing fit`,
          description:
            `Queries DCC's SQL-backed cruise port excursion catalog across all ${CONNECTED_CRUISE_PORT_COUNT} connected cruise ports, returns the port profile and any catalog entries from approved provider mappings, and evaluates each tour against the ship arrival and all-aboard window (\`status\`: \`fits\`, \`runs_too_late\`, or \`needs_verification\`). Uses \`status: needs_verification\` when the dated berth (\`datedBerth\`), route transfers (\`transfers\`), or all-aboard cutoff (\`allAboard\`) are missing. Coordinates (\`berthCoordinates\`, \`meetingPointCoordinates\`) help identify the endpoints, while the timing verdict requires evidence for the actual route and sailing. Public search returns approved affiliate links without creating checkout records.`,
          parameters: [
            {
              name: "port",
              in: "query",
              required: false,
              schema: { type: "string", default: "reykjavik" },
              description:
                `Any of the ${CONNECTED_CRUISE_PORT_COUNT} connected cruise port slugs or aliases (\`new-orleans\`, \`cozumel\`, \`reykjavik\`, \`kahului\`, \`juneau\`, \`skagway\`, \`ketchikan\`, \`seward\`, \`miami\`, \`tampa\`, \`seattle\`, \`roatan\`, \`nassau\`, \`st-thomas\`, \`grand-cayman\`, \`civitavecchia\`, \`barcelona\`, etc.).`,
            },
            {
              name: "viewMode",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["browse_all", "fits_sailing"], default: "browse_all" },
              description: "`browse_all` returns all tours with their `timeFit` evaluation; `fits_sailing` counts and paginates only tours with `timeFit.status === 'fits'`.",
            },
            {
              name: "category",
              in: "query",
              required: false,
              schema: {
                type: "string",
                enum: ["all", "sightseeing", "wildlife", "food", "culture", "adventure", "family"],
                default: "all",
              },
            },
            {
              name: "date",
              in: "query",
              required: false,
              schema: { type: "string", format: "date", example: "2027-07-15" },
              description: "Port call date in YYYY-MM-DD format.",
            },
            {
              name: "shipArrival",
              in: "query",
              required: false,
              schema: { type: "string", example: "07:00" },
              description: "Ship arrival time (`HH:MM` or `h:mm a.m./p.m.`).",
            },
            {
              name: "allAboard",
              in: "query",
              required: false,
              schema: { type: "string", example: "13:15" },
              description:
                "Traveler or schedule all-aboard deadline (`HH:MM` or `h:mm a.m./p.m.`, e.g. `13:15`, `1:15 p.m.`, `17:00`). If omitted/blank and no confirmed sailing schedule supplies it, labeled as a port estimate with `status: needs_verification`.",
            },
            {
              name: "shipDeparture",
              in: "query",
              required: false,
              schema: { type: "string", example: "16:00" },
              description: "Optional scheduled ship departure time (`HH:MM`).",
            },
            {
              name: "datedBerth",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Optional dated berth confirmation or status (`missing` / `unknown` forces `status: needs_verification`).",
            },
            {
              name: "transfers",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Optional route transfer confirmation (`missing` / `unknown` forces `status: needs_verification`).",
            },
            {
              name: "sailing",
              in: "query",
              required: false,
              schema: { type: "string", example: "royal-caribbean-symphony-of-the-seas-2027-01-03" },
              description: "Optional sailing ID to resolve scheduled arrival, all-aboard, and departure times.",
            },
            {
              name: "ship",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Optional ship slug or name.",
            },
            {
              name: "partySize",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, default: 2 },
            },
            {
              name: "productCode",
              in: "query",
              required: false,
              schema: { type: "string", example: "15200P6" },
              description: "Filter by exact provider product code (e.g. `15200P6`, `15200P1`, `103974P5`).",
            },
            {
              name: "search",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Keyword or product code search query.",
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 100, default: 12 },
            },
            {
              name: "offset",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 0, default: 0 },
            },
          ],
          responses: {
            "200": {
              description: "Port-day excursion catalog with deterministic sailing-window timing fit (`timeFit`) separated from `seatAvailability`",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PortDayExcursionCatalogResponse" },
                  examples: {
                    newOrleansFitsAt115Pm: {
                      summary: "New Orleans 15200P6 — fits at 1:15 p.m. (13:15) all aboard (+60m return buffer)",
                      value: {
                        url: "https://www.destinationcommandcenter.com/api/v1/cruise/port-day-excursions?port=new-orleans&date=2027-07-15&shipArrival=07:00&allAboard=13:15&partySize=2&productCode=15200P6",
                        status: "fits",
                        statusLabel: "Fits my sailing",
                        fitsSailing: true,
                        estimatedBackAtPierTime: "12:15",
                        bufferBeforeAllAboardMinutes: 60,
                      },
                    },
                    newOrleansRunsTooLateAt114Pm: {
                      summary: "New Orleans 15200P6 — runs_too_late at 1:14 p.m. (13:14) all aboard (+59m < 60m required)",
                      value: {
                        url: "https://www.destinationcommandcenter.com/api/v1/cruise/port-day-excursions?port=new-orleans&date=2027-07-15&shipArrival=07:00&allAboard=13:14&partySize=2&productCode=15200P6",
                        status: "runs_too_late",
                        statusLabel: "Runs too late",
                        fitsSailing: false,
                        estimatedBackAtPierTime: "12:15",
                        bufferBeforeAllAboardMinutes: 59,
                      },
                    },
                    newOrleansBlankAllAboardNeedsVerification: {
                      summary: "New Orleans 15200P6 — needs_verification when allAboard is blank (15:30 port estimate)",
                      value: {
                        url: "https://www.destinationcommandcenter.com/api/v1/cruise/port-day-excursions?port=new-orleans&date=2027-07-15&shipArrival=07:00&partySize=2&productCode=15200P6",
                        status: "needs_verification",
                        statusLabel: "Needs verification",
                        fitsSailing: false,
                        shipAllAboardTimeLabel: "15:30 (port estimate)",
                        allAboardTimeSource: "port_estimate",
                        missingFields: ["allAboard"],
                      },
                    },
                    cozumelSymphonyOfTheSeasJan8NeedsVerificationUntilConfirmed: {
                      summary: "Cozumel 103974P5 / TG1 on Jan 8, 2027 Symphony of the Seas — needs_verification while Marina ASIPONA meeting pin, berth transfers, and all-aboard cutoff are pending confirmation",
                      value: {
                        url: "https://www.destinationcommandcenter.com/api/v1/cruise/port-day-excursions?port=cozumel&sailing=royal-caribbean-symphony-of-the-seas-2027-01-03&date=2027-01-08&partySize=8&productCode=103974P5",
                        status: "needs_verification",
                        statusLabel: "Needs verification",
                        fitsSailing: false,
                        selectedOptionCode: "TG1",
                        selectedDepartureTime: "10:00",
                        missingFields: ["datedBerth", "meetingPoint", "transfers", "returnBuffer", "allAboard"],
                      },
                    },
                  },
                },
              },
            },
            "404": { description: "Unsupported or unmapped cruise port slug" },
          },
        },
        post: {
          operationId: "checkPortDayExcursionAvailability",
          summary: "Check live availability or prepare a catalog-approved checkout handoff",
          description:
            "The default request is read-only and returns live availability plus approved affiliate links without creating checkout records. Set action=prepare_checkout after traveler approval to prepare a durable checkout handoff for catalog-approved Viator options (New Orleans 15200P6 / TG10, New Orleans 15200P1 / TG9, TG2, TG6, TG7, or Cozumel 103974P5 / TG1 [gated behind DCC_ENABLE_COZUMEL_103974P5_CHECKOUT=true while Marina ASIPONA meeting pin, berth transfers, and all-aboard cutoff are verified]). Checkout requires a configured server credential scoped to dcc:commerce:handoff, travelerApprovedCheckout=true, an idempotencyKey, and verified sailing fit (all-aboard cutoff, dated berth, and transfers) plus live availability.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["port", "productCode", "date", "partySize"],
                  properties: {
                    action: { type: "string", enum: ["prepare_checkout"] },
                    port: { type: "string", example: "cozumel" },
                    productCode: { type: "string", example: "103974P5" },
                    tourId: { type: "string" },
                    optionCode: { type: "string", example: "TG1" },
                    date: { type: "string", format: "date", example: "2027-01-08" },
                    departureTime: { type: "string", example: "10:00" },
                    partySize: { type: "integer", minimum: 1, example: 8 },
                    travelerApprovedCheckout: { type: "boolean", const: true },
                    idempotencyKey: { type: "string", maxLength: 128 },
                    shipArrival: { type: "string", example: "08:00" },
                    allAboard: { type: "string", example: "17:00" },
                    shipDeparture: { type: "string", example: "18:00" },
                    datedBerth: { type: "string", example: "International Pier (SSA Mexico)" },
                    transfers: { type: "string", example: "5" },
                    sailing: { type: "string", example: "royal-caribbean-symphony-of-the-seas-2027-01-03" },
                    isQaTraffic: { type: "boolean" },
                    timeoutMs: { type: "integer", minimum: 1, maximum: 15000, default: 6000 },
                  },
                },
                example: {
                  port: "cozumel",
                  productCode: "103974P5",
                  optionCode: "TG1",
                  date: "2027-01-08",
                  departureTime: "10:00",
                  partySize: 4,
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Live seat and price availability or the saved checkout handoff. Unknown seat counts remain null.",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/PortDayAvailabilityCheckResponse" },
                      {
                        type: "object",
                        required: ["checkoutPrepared", "handoffId", "clickId", "outboundAffiliateUrl"],
                        properties: {
                          checkoutPrepared: { const: true },
                          handoffId: { type: "string" },
                          clickId: { type: "string" },
                          outboundAffiliateUrl: { type: "string", format: "uri" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "400": { description: "Missing productCode/tourId or past departure rejected" },
            "401": { description: "Missing or invalid checkout credential" },
            "403": { description: "Checkout credential lacks the handoff scope" },
            "409": { description: "Checkout selection, sailing fit, availability, or approval could not be confirmed" },
            "503": { description: "Durable checkout storage is unavailable" },
          },
        },
      },
      "/.well-known/mcp.json": {
        get: {
          operationId: "getMcpDiscoveryManifest",
          summary: "Discover DCC Model Context Protocol (MCP) server metadata, supported tools, and runnable examples",
          responses: {
            "200": {
              description:
                `MCP discovery manifest including dcc_search_port_excursions (${CONNECTED_CRUISE_PORT_COUNT} connected ports), dcc_check_tour_availability (read-only), and catalog-backed dcc_prepare_tour_checkout`,
            },
          },
        },
      },
      "/api/v1/mcp": {
        get: {
          operationId: "getMcpServerInfo",
          summary: "Retrieve MCP discovery document from the Streamable HTTP endpoint",
          responses: { "200": { description: "MCP discovery manifest" } },
        },
        post: {
          operationId: "callMcpJsonRpc",
          summary: "Execute standard MCP JSON-RPC 2.0 requests (initialize, notifications/initialized, ping, tools/list, tools/call)",
          description:
            `Standard MCP Streamable HTTP JSON-RPC 2.0 endpoint supporting \`initialize\`, \`notifications/initialized\`, \`ping\`, \`tools/list\`, and \`tools/call\` (including \`dcc_search_port_excursions\` across all ${CONNECTED_CRUISE_PORT_COUNT} ports, read-only \`dcc_check_tour_availability\`, and catalog-backed \`dcc_prepare_tour_checkout\` for New Orleans \`15200P6\` / \`TG10\`, New Orleans \`15200P1\` / \`TG9, TG2, TG6, TG7\`, and Cozumel \`103974P5\` / \`TG1\`).`,
          responses: {
            "200": { description: "JSON-RPC 2.0 response" },
            "202": { description: "JSON-RPC 2.0 notification accepted (e.g. notifications/initialized)" },
          },
        },
      },
    },
    components: {
      schemas: {
        PortDayTimeFitEvaluation: {
          type: "object",
          required: [
            "status",
            "statusLabel",
            "fitsSailing",
            "shipArrivalTime",
            "shipArrivalTimeLabel",
            "arrivalTimeSource",
            "shipAllAboardTime",
            "shipAllAboardTimeLabel",
            "allAboardTimeSource",
            "requiredReturnBufferMinutes",
            "missingFields",
            "reasonSummary",
          ],
          properties: {
            status: { type: "string", enum: ["fits", "runs_too_late", "needs_verification", "missing_operator_info"] },
            statusLabel: { type: "string", enum: ["Fits my sailing", "Runs too late", "Needs verification", "Missing operator info"] },
            fitsSailing: { type: "boolean" },
            selectedOptionCode: { type: ["string", "null"] },
            selectedOptionTitle: { type: ["string", "null"] },
            shipArrivalTime: { type: "string" },
            shipArrivalTimeLabel: { type: "string" },
            arrivalTimeSource: { type: "string", enum: ["request_param", "scheduled_port_call", "port_estimate"] },
            shipAllAboardTime: { type: "string" },
            shipAllAboardTimeLabel: { type: "string" },
            allAboardTimeSource: { type: "string", enum: ["request_param", "scheduled_port_call", "port_estimate"] },
            shipDepartureTime: { type: ["string", "null"] },
            departureTimeSource: { type: "string", enum: ["request_param", "scheduled_port_call", "missing", "ambiguous", "invalid"] },
            allAboardToShipDepartureMinutes: { type: ["integer", "null"] },
            earliestDisembarkationTime: { type: "string" },
            selectedDepartureTime: { type: ["string", "null"] },
            availableDepartureTimes: { type: "array", items: { type: "string" } },
            fittingDepartureTimes: { type: "array", items: { type: "string" } },
            tooLateDepartureTimes: { type: "array", items: { type: "string" } },
            checkInCutoffMinutes: { type: ["integer", "null"] },
            latestCheckInTime: { type: ["string", "null"] },
            leavePierByTime: { type: ["string", "null"] },
            meetingPointName: { type: ["string", "null"] },
            meetingPointAddress: { type: ["string", "null"] },
            pierToMeetingMinutes: { type: ["integer", "null"] },
            meetingToPierMinutes: { type: ["integer", "null"] },
            roundTripTransferMinutes: { type: ["integer", "null"] },
            durationMinutes: { type: ["integer", "null"] },
            tourEndTime: { type: ["string", "null"] },
            estimatedBackAtPierTime: { type: ["string", "null"] },
            requiredReturnBufferMinutes: { type: "integer" },
            bufferBeforeAllAboardMinutes: { type: ["integer", "null"] },
            bufferBeforeShipDepartureMinutes: { type: ["integer", "null"] },
            missingFields: { type: "array", items: { type: "string" } },
            reasonSummary: { type: "string" },
          },
        },
        PortDaySeatAvailabilityEvaluation: {
          type: "object",
          required: [
            "status",
            "statusLabel",
            "supportsLiveCheck",
            "checkedDate",
            "checkedPartySize",
            "available",
            "remainingSeats",
            "currency",
            "exactProductUrl",
            "dccTrackedHref",
            "providerStatus",
            "detailNote",
          ],
          properties: {
            status: { type: "string", enum: ["live_verified", "sold_out", "check_availability"] },
            statusLabel: { type: "string" },
            supportsLiveCheck: { type: "boolean" },
            liveCheckedAt: { type: ["string", "null"], format: "date-time" },
            checkedDate: { type: ["string", "null"], format: "date" },
            checkedPartySize: { type: "integer" },
            selectedOptionCode: { type: ["string", "null"] },
            selectedDepartureTime: { type: ["string", "null"] },
            available: { type: ["boolean", "null"] },
            remainingSeats: {
              type: ["integer", "null"],
              description: "Exact remaining seats when reported by the provider, or null when unknown (never fabricated).",
            },
            fromPriceUsd: { type: ["number", "null"] },
            totalPriceUsd: { type: ["number", "null"] },
            currency: { type: "string" },
            exactProductUrl: { type: "string", format: "uri" },
            dccTrackedHref: { type: "string" },
            pastDepartureRejected: { type: "boolean" },
            rejectionReason: { type: ["string", "null"] },
            providerStatus: { type: "string" },
            detailNote: { type: "string" },
          },
        },
        PortDayExcursionCatalogResponse: {
          type: "object",
          required: ["ok", "generatedAt", "port", "sailingWindow", "viewMode", "category", "pagination", "tours"],
          properties: {
            ok: { type: "boolean" },
            generatedAt: { type: "string", format: "date-time" },
            port: { type: "object", additionalProperties: true },
            sailingWindow: { type: "object", additionalProperties: true },
            viewMode: { type: "string", enum: ["browse_all", "fits_sailing"] },
            category: { type: "string" },
            pagination: { type: "object", additionalProperties: true },
            tours: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tourId: { type: "string" },
                  productCode: { type: ["string", "null"] },
                  optionCode: { type: ["string", "null"] },
                  title: { type: "string" },
                  timeFit: { $ref: "#/components/schemas/PortDayTimeFitEvaluation" },
                  seatAvailability: { $ref: "#/components/schemas/PortDaySeatAvailabilityEvaluation" },
                  handoff: { type: "object", additionalProperties: true },
                },
              },
            },
          },
        },
        PortDayAvailabilityCheckResponse: {
          type: "object",
          required: ["ok", "portSlug", "productCode", "optionCode", "seatAvailability"],
          properties: {
            ok: { type: "boolean" },
            portSlug: { type: "string" },
            tourId: { type: ["string", "null"] },
            productCode: { type: ["string", "null"] },
            optionCode: { type: ["string", "null"] },
            seatAvailability: { $ref: "#/components/schemas/PortDaySeatAvailabilityEvaluation" },
          },
        },
        DccLocationResponse: {
          type: "object",
          required: ["ok", "schema", "schemaVersion", "coordinate", "canonical", "checkedAt", "modules", "sources"],
          properties: {
            ok: { type: "boolean" },
            schema: { type: "string", const: "dcc-location-v2" },
            schemaVersion: { type: "integer", const: 2 },
            coordinate: {
              type: "object",
              required: ["lat", "lng", "precision_decimals"],
              properties: {
                lat: { type: "number" },
                lng: { type: "number" },
                precision_decimals: { type: "integer", const: 5 },
              },
            },
            location: {
              type: "object",
              additionalProperties: true,
              description: "Coordinate identity plus derived timezone/elevation. Human-readable reverse-geocoded names are not required for machine use.",
            },
            canonical: {
              type: "object",
              properties: {
                page: { type: "string" },
                api: { type: "string" },
                absolutePage: { type: "string", format: "uri" },
                absoluteApi: { type: "string", format: "uri" },
                destinationReference: { type: ["string", "null"], format: "uri" },
              },
            },
            checkedAt: { type: "string", format: "date-time" },
            travelReference: {
              type: "object",
              additionalProperties: true,
              description: "Connected curated destination reference metadata, entry dependency summary, operational safety boundaries, and specialist handoffs when within a curated DCC corridor.",
            },
            modules: {
              type: "object",
              required: ["identity", "now", "conditions", "hazards", "water", "official"],
              properties: {
                travelReference: { type: "object", additionalProperties: true },
                identity: { type: "object", additionalProperties: true },
                now: {
                  type: "object",
                  properties: {
                    weather: { type: ["object", "null"], additionalProperties: true },
                    airQuality: { type: ["object", "null"], additionalProperties: true },
                  },
                },
                conditions: {
                  type: "object",
                  properties: {
                    next12Hours: { type: "array", items: { type: "object", additionalProperties: true } },
                    next3Days: { type: "array", items: { type: "object", additionalProperties: true } },
                    airQualityNext12Hours: { type: "array", items: { type: "object", additionalProperties: true } },
                  },
                },
                hazards: {
                  type: "object",
                  properties: {
                    alerts: { type: "array", items: { type: "object", additionalProperties: true } },
                    earthquakes: { type: "array", items: { type: "object", additionalProperties: true } },
                    naturalEvents: { type: "array", items: { type: "object", additionalProperties: true } },
                  },
                },
                water: {
                  type: "object",
                  properties: {
                    nearbyGauges: { type: "array", items: { type: "object", additionalProperties: true } },
                  },
                },
                official: { type: "object", additionalProperties: true },
                events: { type: ["object", "null"], additionalProperties: true },
                machineFeeds: { type: "array", items: { type: "object", additionalProperties: true } },
                providerSlots: { type: "object", additionalProperties: true },
                officialLiveLinks: { type: "array", items: { type: "object", additionalProperties: true } },
              },
            },
            sources: {
              type: "array",
              description: "Per-provider availability, attribution, freshness, and error state.",
              items: {
                type: "object",
                properties: {
                  provider: { type: "string" },
                  attribution: { type: "string" },
                  available: { type: "boolean" },
                  checkedAt: { type: "string", format: "date-time" },
                  error: { type: "string" },
                },
              },
            },
            weather: { type: ["object", "null"], additionalProperties: true, description: "v1 compatibility alias for modules.now.weather" },
            alerts: { type: "array", items: { type: "object", additionalProperties: true }, description: "v1 compatibility alias for modules.hazards.alerts" },
            earthquakes: { type: "array", items: { type: "object", additionalProperties: true }, description: "Compatibility alias for modules.hazards.earthquakes" },
            events: { type: ["object", "null"], additionalProperties: true },
            machineFeeds: { type: "array", items: { type: "object", additionalProperties: true } },
            providerSlots: { type: "object", additionalProperties: true },
            policy: { type: "object", additionalProperties: true },
          },
        },
      },
    },
  };

  return Response.json(document, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
