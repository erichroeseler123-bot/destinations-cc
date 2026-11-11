# Last Frontier Shore Excursions — Monorepo Vercel Deployment

Production domains: `www.lastfrontiershoreexcursions.com` (canonical) and `lastfrontiershoreexcursions.com` (308 apex redirect to `www`).

## Live Vercel project & Git link

- Git repository: `erichroeseler123-bot/destinations-cc` (monorepo)
- Production branch: `main`
- Framework preset: Next.js
- Root Directory: `apps/last-frontier-shore-excursions`
- Shared monorepo imports: `lib/dcc/shared/*` (enabled via `turbopack.root` / `outputFileTracingRoot` pointing to repo root and `scripts/vercel-ignore-monorepo.mjs`)
- Node.js: 24.x

## Verified verification routes

Confirm the following routes return `200 OK` on preview/production deployments:

- `/`, `/about`, `/contact`
- `/ports/juneau`, `/ports/skagway`, `/ports/ketchikan`, `/ports/sitka`, `/ports/icy-strait-point`
- `/cruise-ships`, `/tours`, `/sitemap.xml`, `/robots.txt`

## Disclosed affiliate & operator boundaries

Last Frontier Shore Excursions operates as an independent Alaska cruise-excursion comparison and concierge guide (not a cruise line or merchant of record):

- **Viator Affiliate Attribution**: Active affiliate partner (`pid=P00281144`, `mcid=42383`, `last-frontier-*` campaign tags) via `resolveViatorPid` (`NEXT_PUBLIC_VIATOR_PID` -> `NEXT_PUBLIC_LAST_FRONTIER_VIATOR_PID` -> `P00281144`).
- **GetYourGuide Partner Attribution**: Active affiliate partner (`partner_id=F2MMUUH`). Held commercial SKUs (such as Ketchikan's *Aleutian Ballad*) remain gated from direct self-serve checkout until owner portal and pier-window sign-off.
- **Partner Domain Boundary**: Last Frontier Shore Excursions uses only `Viator (pid=P00281144)` and `GetYourGuide (partner_id=F2MMUUH)` as active affiliate partners (`0` external FareHarbor partner ASNs on LFSE).
- **Concierge Inquiries (`POST /api/inquiries`)**: Forwards multi-cabin and port-window inquiries via `lib/dcc/shared/specialistInquiryClient.ts` (`channel: "lastfrontiershoreexcursions-inquiry"`) into the DCC Unified Operator Inbox.
