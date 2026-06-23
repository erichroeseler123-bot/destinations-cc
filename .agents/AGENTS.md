# DCC Platform Governance and Operating Rules (DCC Repository)

These rules govern all coding, routing, and deployment actions for the Destination Command Center (DCC) repository. The AI assistant must adhere strictly to these rules. No exceptions.

## Core Directives

1. **Consult the Master Domain Ledger**:
   - The absolute source of truth for all domain mappings, repos, and Vercel projects is located at `/home/erichroeseler123/destinations-cc/MASTER_DOMAIN_LEDGER.md`.
   - Never modify a routing file, proxy redirect, or domain configuration without first consulting this ledger.
   - The ledger is a required source of truth, but it does not itself authorize domain moves, Vercel alias changes, DNS changes, deploys, or production claims. Those actions still require explicit approval and live verification.

2. **Remember the Architecture**: Every task must map to one of the defined layers:
   - **EarthOS**: Map and entity layer (database records for places, venues, timezones, events).
   - **DCC**: The authority brain and routing proxy (`destinations-cc`).
   - **TravelMarket**: The shared public template renderer (`blank-app` / `dcc-v1-cut-clean`).
   - **Satellite Domains**: Thin SEO entry points served by TravelMarket.
   - **Direct-Service Sites**: Dedicated operational checkouts (e.g., PARR).
   - **Vercel/GitHub Ledger**: The single source of truth for deployment state.

3. **Strict Verification Rules**:
   - Never claim "fixed," "done," or "working" for a public site unless the relevant production custom domain has been live-verified.
   - Verification must check: canonical host redirects, SSL certificate validity, sitemap.xml / robots.txt correctness, and booking link functionality.

4. **Quarantine `v0-code-review`**:
   - `v0-code-review` is a quarantine zone.
   - No production custom domain is allowed to point to it unless explicitly documented in the ledger.
