#!/bin/bash
set -e

echo "=== 🚀 STEP 1: INITIALIZING TYPE SCRIPT CODE SANITY VALIDATION ==="
npx tsc --noEmit --project apps/juneauflightdeck/tsconfig.json

echo "=== 🧪 STEP 2: EXECUTING STRUCTURAL MATHEMATICAL ENGINES TEST SUITE ==="
node apps/juneauflightdeck/scripts/test-math-engine.mjs

echo "=== 🏗️ STEP 3: TESTING APP COMPILATION ENVELOPE ==="
npm --prefix apps/juneauflightdeck run build

echo "=== 🎉 ALL PRODUCTION LAUNCH VERIFICATIONS CLEARED CONDITIONALLY ==="
