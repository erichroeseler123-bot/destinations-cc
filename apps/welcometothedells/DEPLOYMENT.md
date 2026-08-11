# Welcome to the Dells — Standalone Vercel Deployment

Production domain: `welcometothedells.com`

## Required Vercel project settings

- Git repository: `erichroeseler123-bot/destinations-cc`
- Production branch: `main`
- Framework preset: Next.js
- Root Directory: `apps/welcometothedells`
- Node.js: 24.x

## Production validation

Before moving the custom domain, confirm the dedicated project URL returns successfully for:

- `/`
- `/first-time`
- `/rainy-day`
- `/families`
- `/adults`
- `/tonight`
- `/large-groups`
- `/downtown`
- `/parkway`
- `/lake-delton`
- `/sitemap.xml`
- `/robots.txt`
- `/api/health`

## Domain cutover rule

Do not point `welcometothedells.com` at a generic DCC root deployment. The canonical production app is the standalone Next.js app in `apps/welcometothedells`.

Cutover sequence:

1. Import `erichroeseler123-bot/destinations-cc` into a dedicated Vercel project.
2. Set Root Directory to `apps/welcometothedells` before deployment.
3. Confirm the validation routes above on the Vercel project URL.
4. Attach `www.welcometothedells.com` and `welcometothedells.com` to that dedicated project.
5. Redirect the non-canonical hostname consistently.
6. Only after aliases are active, remove the domain from any stale or generic project.

## Commercial and network behavior

Welcome to the Dells should remain a consumer-first Wisconsin Dells planner. It can route qualified visitors into operator booking paths, Viator fallback inventory, Feastly for large-group food logistics, and Destination Command Center for deeper destination context without exposing internal network/governance terminology to consumers.
