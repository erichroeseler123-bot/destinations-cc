import {
  hasLegacySquareEnvAlias,
  readCanonicalSquareEnv,
  reportLegacySquareEnvAlias,
} from "@/lib/squareEnvDrift";

function pickFirst(...values: Array<string | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function is420PickupRoute(route?: string | null) {
  return route === "airport-420-pickup";
}

export function getSquareEnvironment(route?: string | null) {
  if (is420PickupRoute(route)) {
    const explicit420 = pickFirst(process.env.SQUARE_ENVIRONMENT_420_PICKUP);
    if (explicit420) return explicit420.toLowerCase();
  }

  const explicit = pickFirst(process.env.SQUARE_ENVIRONMENT);
  if (explicit) return explicit.toLowerCase();

  if (hasLegacySquareEnvAlias("SQUARE_sandbox_access_token")) {
    reportLegacySquareEnvAlias(
      { name: "SQUARE_sandbox_access_token", replacement: "SQUARE_ENVIRONMENT + SQUARE_ACCESS_TOKEN" },
      "square.environment",
    );
    return "sandbox";
  }

  if (hasLegacySquareEnvAlias("SQUARE_Sandbox_App_ID")) {
    reportLegacySquareEnvAlias(
      { name: "SQUARE_Sandbox_App_ID", replacement: "SQUARE_ENVIRONMENT + SQUARE_APP_ID" },
      "square.environment",
    );
    return "sandbox";
  }

  return "production";
}

export function getSquareApplicationId(route?: string | null) {
  const env = getSquareEnvironment(route);
  if (is420PickupRoute(route)) {
    const routeSpecific = readCanonicalSquareEnv(
      ["NEXT_PUBLIC_SQUARE_APPLICATION_ID_420_PICKUP", "SQUARE_APP_ID_420_PICKUP"],
      [],
      "square.application_id.420_pickup",
    );
    if (routeSpecific) return routeSpecific;
  }

  if (env === "sandbox") {
    return readCanonicalSquareEnv(
      ["NEXT_PUBLIC_SQUARE_APP_ID", "SQUARE_APP_ID"],
      [
        { name: "NEXT_PUBLIC_SQUARE_APPLICATION_ID", replacement: "NEXT_PUBLIC_SQUARE_APP_ID" },
        { name: "SQUARE_Sandbox_App_ID", replacement: "SQUARE_APP_ID" },
      ],
      "square.application_id",
    );
  }

  return readCanonicalSquareEnv(
    ["NEXT_PUBLIC_SQUARE_APP_ID", "SQUARE_APP_ID"],
    [
      { name: "NEXT_PUBLIC_SQUARE_APPLICATION_ID", replacement: "NEXT_PUBLIC_SQUARE_APP_ID" },
      { name: "SQUARE_Sandbox_App_ID", replacement: "SQUARE_APP_ID" },
    ],
    "square.application_id",
  );
}

export function getSquareLocationId(route?: string | null) {
  if (is420PickupRoute(route)) {
    const routeSpecific = readCanonicalSquareEnv(
      ["NEXT_PUBLIC_SQUARE_LOCATION_ID_420_PICKUP", "SQUARE_LOCATION_ID_420_PICKUP"],
      [],
      "square.location_id.420_pickup",
    );
    if (routeSpecific) return routeSpecific;
  }

  return readCanonicalSquareEnv(
    ["NEXT_PUBLIC_SQUARE_LOCATION_ID", "SQUARE_LOCATION_ID"],
    [{ name: "SQUARE_location_id", replacement: "SQUARE_LOCATION_ID" }],
    "square.location_id",
  );
}

export function getSquareAccessToken(route?: string | null) {
  const env = getSquareEnvironment(route);
  if (is420PickupRoute(route)) {
    const routeSpecific = readCanonicalSquareEnv(
      ["SQUARE_ACCESS_TOKEN_420_PICKUP"],
      [{ name: "SQUARE_access_token_420_pickup", replacement: "SQUARE_ACCESS_TOKEN_420_PICKUP" }],
      "square.access_token.420_pickup",
    );
    if (routeSpecific) return routeSpecific;
  }

  if (env === "sandbox") {
    return readCanonicalSquareEnv(
      ["SQUARE_ACCESS_TOKEN"],
      [
        { name: "SQUARE_access_token", replacement: "SQUARE_ACCESS_TOKEN" },
        { name: "SQUARE_sandbox_access_token", replacement: "SQUARE_ACCESS_TOKEN" },
      ],
      "square.access_token",
    );
  }

  return readCanonicalSquareEnv(
    ["SQUARE_ACCESS_TOKEN"],
    [
      { name: "SQUARE_access_token", replacement: "SQUARE_ACCESS_TOKEN" },
      { name: "SQUARE_sandbox_access_token", replacement: "SQUARE_ACCESS_TOKEN" },
    ],
    "square.access_token",
  );
}

export function isSquareConfigured(route?: string | null) {
  return Boolean(getSquareApplicationId(route) && getSquareLocationId(route) && getSquareAccessToken(route));
}
