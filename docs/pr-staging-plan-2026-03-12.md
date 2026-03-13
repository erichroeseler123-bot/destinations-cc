# PR Staging Plan (2026-03-12)

## 1) Tooling and Gate Fixes

Scope:
- ESLint v9 + Next 16 migration
- lint script update
- backup-file ignore hardening

Stage:
```bash
git add package.json package-lock.json eslint.config.mjs .gitignore
```

Suggested commit message:
```text
chore: migrate linting to eslint flat config and harden ignores
```

## 2) Cleanup and Route Migration

Scope:
- Remove legacy static shuttle pages
- Remove old `proxy.ts`
- Remove tracked backup artifact
- Keep app-route replacement in later commits

Stage:
```bash
git add -u app/mighty-argo-shuttle/page.js public/mighty-argo-shuttle proxy.ts data/tours.json.bak.2026-02-09-114306
```

Suggested commit message:
```text
chore: remove legacy shuttle static assets and stale backup files
```

## 3) DCC Core Libraries, Data Contracts, and Scripts

Scope:
- DCC service/core modules
- data registries and network artifacts
- governance/security scripts and tests

Stage:
```bash
git add lib/dcc lib/data lib/adminAccess.ts lib/argoProducts.ts lib/argoWaitlist.ts
git add src/data src/lib scripts/dcc scripts/security scripts/validate-data.mjs
git add tests/dcc
git add data/action data/cruises data/graph data/index data/map data/memory data/network data/nodes data/registry data/sources data/ports.seed.json data/ports.seed.tsv
git add docs .github/workflows
```

Suggested commit message:
```text
feat(dcc): add core action graph, provider adapters, contracts, and governance tooling
```

## 4) Internal/Admin/API Surfaces

Scope:
- Admin unlock/export routes
- Internal DCC APIs and Stripe endpoints
- Internal graph page

Stage:
```bash
git add app/admin app/api app/internal
```

Suggested commit message:
```text
feat(api): add internal dcc/admin/stripe endpoints and graph diagnostics pages
```

## 5) UI Components and Shared Experience Layer

Scope:
- New reusable DCC components
- Home/search/stat/diagnostics components
- minor shared component fixes

Stage:
```bash
git add app/components components
```

Suggested commit message:
```text
feat(ui): add dcc component layer for live summaries, authority panels, and discovery blocks
```

## 6) Destination/Cruise/Overlay Page Expansion

Scope:
- New route families (`cruises`, `ports`, `national-parks`, `mighty-argo`, `cities`, `book`, `checkout`, etc.)
- Existing city overlay and node page upgrades
- Registry-linked content and featured data updates

Stage:
```bash
git add app
git add data/featured.json data/nodes.json data/ports.generated.json
git add src/data/entities-registry.ts utils/affiliateLinks.ts wrangler.toml open-next.config.ts
```

Suggested commit message:
```text
feat(routes): expand destination overlays, cruise/port surfaces, and booking flow pages
```

## 7) Optional: Separate Nested App Experiment

Scope:
- `apps/special-pages/**` can be isolated if this is not intended for the primary deploy path.

Stage:
```bash
git add apps/special-pages
```

Suggested commit message:
```text
chore(experiment): add special-pages prototype app
```

## Recommended Execution Order
1. Commit sections 1 and 2 first (stability + cleanup).
2. Commit sections 3 and 4 second (backend/core behavior).
3. Commit sections 5 and 6 third (UI/page rollout).
4. Commit section 7 only if intentional for this PR.

## Pre-push Verification
```bash
npm run lint
npm run typecheck
npm run test:dcc
npm run dcc:env:check:ci
npm run build
```
