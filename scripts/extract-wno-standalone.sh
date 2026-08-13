#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
DEST="$ROOT/apps/welcometoneworleanstours"

mkdir -p "$DEST/app"

# Preserve the existing WNO machine-readable routes already under DEST/app.
rsync -a --delete-excluded "$ROOT/app/new-orleans/" "$DEST/app/new-orleans/"

# Initial dependency snapshot. These broad roots are copied first so the standalone
# app can be made buildable; the extraction audit then prunes anything not reachable
# from the WNO production graph.
for dir in components lib data config src public; do
  if [ -e "$ROOT/$dir" ]; then
    rm -rf "$DEST/$dir"
    cp -a "$ROOT/$dir" "$DEST/$dir"
  fi
done

# Baseline Next.js project harness copied from the currently working monolith.
for file in package.json package-lock.json pnpm-lock.yaml next-env.d.ts next.config.mjs postcss.config.js tsconfig.json proxy.ts .npmrc .nvmrc .gitignore; do
  if [ -f "$ROOT/$file" ]; then
    cp "$ROOT/$file" "$DEST/$file"
  fi
done

for file in layout.tsx globals.css not-found.tsx; do
  if [ -f "$ROOT/app/$file" ]; then
    cp "$ROOT/app/$file" "$DEST/app/$file"
  fi
done

cat <<'EOF'
WNO staging snapshot created at apps/welcometoneworleanstours.
Next: run the WNO-specific build/tests from that root, then prune DCC-only and dead dependencies before any Vercel cutover.
EOF
