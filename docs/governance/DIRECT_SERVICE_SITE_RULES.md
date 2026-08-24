# Direct-Service Site Rules

Direct-Service sites such as `partyatredrocks.com` and `gosno.co` are standalone transactional systems that hook into the DCC ecosystem but maintain repository and billing isolation.

`shuttleya.com` is no longer a Direct-Service site. It is a transportation discovery and operator-routing satellite. It must not operate vehicles, publish a house shuttle schedule, or accept transportation payment. The former Denver to Mighty Argo scheduled shuttle is retired.

## Rules & Constraints

1. **Repository Isolation**:
   - High-revenue direct-service sites must run in dedicated repositories rather than being mixed into the DCC authority repo (`destinations-cc`).
   - If legacy direct-service code exists in the `destinations-cc` monorepo (e.g., under `apps/`), it must be clearly deprecated or migrated.

2. **Immutable DNS and Custom Domain Mappings**:
   - Never alter DNS records, Vercel alias mappings, or routing rules for Direct-Service domains without an approved ledger state in `MASTER_DOMAIN_LEDGER.md`.
   - These sites are directly tied to revenue, ticket bookings, and payment processors. Ad-hoc routing shifts can break checkout flows.

3. **Event Egress to DCC**:
   - While operationally separate, Direct-Service sites should log relevant lead and booking events back to DCC via defined API webhooks.
   - Webhook token safety rules must be followed according to the ledger mappings.

4. **Party at Red Rocks Restriction**:
   - Party at Red Rocks is revenue-sensitive. DNS, Vercel aliases, checkout, payment, event pages, and booking flows must not be changed without direct approval.

5. **ShuttleYa Discovery Boundary**:
   - ShuttleYa may publish transportation comparisons, route-selection guidance, and links to actual operators.
   - ShuttleYa must identify the actual operator as authoritative for service, live price, availability, vehicles, pickup instructions, payment, restrictions, and cancellation terms.
   - The retired Argo booking and payment paths must remain disabled.
