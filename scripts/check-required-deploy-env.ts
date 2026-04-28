const requiredEnvVars = [
  "DATABASE_URL",
  "SQUARE_ACCESS_TOKEN",
  "NEXT_PUBLIC_SQUARE_APP_ID",
  "NEXT_PUBLIC_SQUARE_LOCATION_ID",
  "FEASTLY_PAYMENT_CHECKOUT_URL",
] as const;

const missing = requiredEnvVars.filter((name) => !process.env[name]?.trim());

console.log("REQUIRED DEPLOY ENV CHECK");

if (missing.length > 0) {
  console.log("BLOCKED");
  console.log("Missing required env vars:");
  for (const name of missing) {
    console.log(`- ${name}`);
  }
  process.exit(1);
}

console.log("PASS");
console.log("Required deploy env vars are present.");
