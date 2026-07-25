#!/bin/bash
echo "=== LINT ==="
npm run lint
echo "LINT_EXIT: $?"

echo "=== TYPECHECK ==="
npm run typecheck
echo "TYPECHECK_EXIT: $?"

echo "=== TEST ==="
npm run test || echo "TEST_EXIT: no test script"

echo "=== BUILD ==="
npm run build
echo "BUILD_EXIT: $?"
