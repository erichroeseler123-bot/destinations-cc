import { preparePortDayTourCheckout } from "@/lib/dcc/cruisePortExcursionCatalogEngine";
import { verifyEvaluationAuthAndRateLimit } from "../securityLimits";

export function prepareTourCheckoutFromRequest(
  request: Request,
  args: Record<string, unknown>,
  surface: string,
) {
  const auth = verifyEvaluationAuthAndRateLimit({
    headers: request.headers,
    requiredScope: "dcc:commerce:handoff",
    requireExplicitApiKey: true,
    allowDefaultApiKeys: false,
  });
  const str = (value: unknown) => typeof value === "string" ? value.trim() : null;

  return preparePortDayTourCheckout({
    portSlug: str(args.port ?? args.portSlug),
    productCode: str(args.productCode),
    optionCode: str(args.optionCode ?? args.option),
    date: str(args.date ?? args.sailingDate),
    departureTime: str(args.departureTime ?? args.selectedDepartureTime),
    partySize: typeof args.partySize === "number" ? args.partySize : null,
    travelerApprovedCheckout: args.travelerApprovedCheckout === true,
    idempotencyKey: str(args.idempotencyKey),
    sailingId: str(args.sailing ?? args.sailingId),
    shipSlug: str(args.ship ?? args.shipSlug),
    shipArrivalTime: str(args.shipArrival ?? args.shipArrivalTime),
    shipAllAboardTime: str(args.allAboard ?? args.shipAllAboardTime),
    shipDepartureTime: str(args.shipDeparture ?? args.shipDepartureTime),
    callerClientId: auth.clientId,
    originatingSite: "destinationcommandcenter.com",
    surface,
    isQaTraffic: args.isQaTraffic === true || args.qaTraffic === true || args.isTest === true,
    simulateTimeout: args.simulateTimeout === true,
  });
}
