function pickFirst(...values: Array<string | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function getSquareEnvironment() {
  const explicit = pickFirst(process.env.SQUARE_ENVIRONMENT);
  if (explicit) return explicit.toLowerCase();

  if (pickFirst(process.env.SQUARE_sandbox_access_token, process.env.SQUARE_Sandbox_App_ID)) {
    return "sandbox";
  }

  return "production";
}

export function getSquareApplicationId() {
  const env = getSquareEnvironment();
  if (env === "sandbox") {
    return pickFirst(
      process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
      process.env.SQUARE_APP_ID,
      process.env.SQUARE_Sandbox_App_ID,
    );
  }

  return pickFirst(
    process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
    process.env.SQUARE_APP_ID,
    process.env.SQUARE_Sandbox_App_ID,
  );
}

export function getSquareLocationId() {
  return pickFirst(
    process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
    process.env.SQUARE_LOCATION_ID,
    process.env.SQUARE_location_id,
  );
}

export function getSquareAccessToken() {
  const env = getSquareEnvironment();
  if (env === "sandbox") {
    return pickFirst(
      process.env.SQUARE_ACCESS_TOKEN,
      process.env.SQUARE_access_token,
      process.env.SQUARE_sandbox_access_token,
    );
  }

  return pickFirst(
    process.env.SQUARE_ACCESS_TOKEN,
    process.env.SQUARE_access_token,
    process.env.SQUARE_sandbox_access_token,
  );
}

export function isSquareConfigured() {
  return Boolean(getSquareApplicationId() && getSquareLocationId() && getSquareAccessToken());
}
