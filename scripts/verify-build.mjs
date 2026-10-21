import { execSync } from "child_process";

console.log("=== 🚀 STEP 1: INITIALIZING TYPE SCRIPT CODE SANITY VALIDATION ===");
try {
  execSync("npx --yes tsc --noEmit --project apps/juneauflightdeck/tsconfig.json", { stdio: "inherit" });
  console.log("✓ TypeScript typecheck passed cleanly.");
} catch {
  console.error("❌ TypeScript typecheck failed.");
  process.exit(1);
}

console.log("\n=== 🧪 STEP 2: EXECUTING STRUCTURAL MATHEMATICAL ENGINES TEST SUITE ===");
try {
  execSync("node apps/juneauflightdeck/scripts/test-math-engine.mjs", { stdio: "inherit" });
  console.log("✓ All mathematical payload & center-of-gravity tests passed.");
} catch {
  console.error("❌ Mathematical payload tests failed.");
  process.exit(1);
}

console.log("\n=== 🏗️ STEP 3: TESTING APP COMPILATION ENVELOPE ===");
try {
  execSync("npm.cmd --prefix apps/juneauflightdeck run build", { stdio: "inherit" });
  console.log("✓ Next.js production build compiled cleanly across all routes.");
} catch {
  console.error("❌ Next.js production build failed.");
  process.exit(1);
}

console.log("\n=== 🎉 ALL PRODUCTION LAUNCH VERIFICATIONS CLEARED CONDITIONALLY ===");
