#!/bin/bash
npm run clean
echo "=== LINT ==="
npm run lint
echo "LINT_EXIT: $?"

echo "=== TYPECHECK ==="
npm run typecheck
echo "TYPECHECK_EXIT: $?"

echo "=== BUILD ==="
npm run build
echo "BUILD_EXIT: $?"
