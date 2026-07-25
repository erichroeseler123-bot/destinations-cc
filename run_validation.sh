#!/bin/bash
echo "=== LINT ==="
npx next lint
echo "LINT_EXIT: $?"

echo "=== TYPECHECK ==="
npx tsc --noEmit
echo "TYPECHECK_EXIT: $?"

echo "=== BUILD ==="
npm run build
echo "BUILD_EXIT: $?"
