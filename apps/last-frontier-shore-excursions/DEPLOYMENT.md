# Last Frontier Shore Excursions — Standalone Vercel Deployment

Production domain: `lastfrontiershoreexcursions.com`

## Required Vercel project settings

- Git repository: `erichroeseler123-bot/destinations-cc`
- Production branch: `main`
- Framework preset: Next.js
- Root Directory: `apps/last-frontier-shore-excursions`
- Node.js: 24.x

## Domain cutover

The production domain is currently attached to the shared `v0-code-review` Vercel project (`prj_NYmbSMRh4gwMnbc0u4jJjKrJwDYH`). Do not remove it from that project until the standalone Last Frontier project has a READY production deployment.

Cutover sequence:

1. Create/import a dedicated Vercel project from the repo above.
2. Set Root Directory to `apps/last-frontier-shore-excursions` before the first production deployment.
3. Confirm `/`, `/ports/juneau`, `/ports/skagway`, `/ports/ketchikan`, `/ports/sitka`, `/ports/icy-strait-point`, `/sitemap.xml`, and `/robots.txt` return successfully on the Vercel project URL.
4. Add `www.lastfrontiershoreexcursions.com` to the dedicated project.
5. Add `lastfrontiershoreexcursions.com` and redirect apex to `www`.
6. Only after the new aliases are active, remove both Last Frontier domains from `v0-code-review`.

## Affiliate isolation

This standalone app intentionally contains no FareHarbor integration. Its outbound tour layer uses the Last Frontier Viator helper and campaign namespace. If dedicated credentials are available, configure the app's Last Frontier-specific Viator environment variables in the dedicated Vercel project rather than inheriting unrelated provider credentials from the shared root project.

The old shared host currently injects GetYourGuide partner analytics (`F2MMUUH`) through the root app. That script is not part of this standalone app and should not be copied unless ownership and attribution are intentionally confirmed.
