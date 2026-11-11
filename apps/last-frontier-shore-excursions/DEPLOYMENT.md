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

- **Viator Affiliate Attribution**: Uses `resolveViatorPid` (`NEXT_PUBLIC_VIATOR_PID` -> `NEXT_PUBLIC_LAST_FRONTIER_VIATOR_PID` -> `P00281144`, `mcid=42383`, `last-frontier-*` campaign tags).
- **GetYourGuide Partner Attribution**: Uses disclosed partner ID `F2MMUUH`.
- **FareHarbor Affiliate Network Attribution**: Selected direct Alaska operator comparison links (such as Allen Marine Tours on Juneau whale-watching comparison surfaces) use disclosed FareHarbor affiliate attribution `asn=welcometoalaskatours` so guests complete checkout directly with the local Alaska operator. Note that `welcometoalaskatours.com` (`wta-ui`) is a contained legacy domain and must never be linked as a public consumer destination.
- **Concierge Inquiries (`POST /api/inquiries`)**: Forwards multi-cabin and port-window inquiries via `lib/dcc/shared/specialistInquiryClient.ts` (`channel: "lastfrontiershoreexcursions-inquiry"`) into the DCC Unified Operator Inbox.
