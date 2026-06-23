# Direct-Service Site Rules

Direct-Service sites (`partyatredrocks.com`, `gosno.co`, `shuttleya.com`) are standalone transactional systems that hook into the DCC ecosystem but maintain repository and billing isolation.

## Rules & Constraints

1. **Repository Isolation**:
   - High-revenue direct-service sites must run in dedicated repositories rather than being mixed into the DCC authority repo (`destinations-cc`).
   - If legacy direct-service code exists in the `destinations-cc` monorepo (e.g., under `apps/`), it must be clearly deprecated or migrated.

2. **Immutable DNS and Custom Domain Mappings**:
   - Never alter DNS records, Vercel alias mappings, or routing rules for Direct-Service domains without an approved ledger state in `/home/erichroeseler123/destinations-cc/MASTER_DOMAIN_LEDGER.md`.
   - These sites are directly tied to revenue, ticket bookings, and payment processors (Square/Stripe/etc.). Ad-hoc routing shifts can break checkout flows.

3. **Event Egress to DCC**:
   - While operationally separate, Direct-Service sites must log checkout events, lead submissions, and booking data back to DCC via defined API webhooks.
   - Webhook token safety rules must be followed according to the ledger mappings.

4. **Party at Red Rocks Restriction**:
   - Party at Red Rocks is revenue-sensitive and remains do-not-touch unless explicitly instructed. DNS, Vercel aliases, checkout, payment, event pages, and booking flows must not be changed without direct approval.
