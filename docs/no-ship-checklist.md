# No-Ship Checklist

Every new page, feature, or module must answer these questions before it ships.

## Required

1. What state does this serve?
   - `understand`
   - `choose`
   - `act`
   - `ops`

2. Where does it hand off next?
   - Name the exact route or system.

3. What is the success metric?
   - `click-forward`
   - `checkout_start`
   - `completion`
   - another explicit metric if justified

4. Why does this not belong in another layer?
   - Provide the explicit layer-boundary justification.

5. Does this create a duplicate path?
   - If yes, do not ship it.

## Enforcement Rule

- If a route is not present in `data/page-registry.ts`, it does not ship.
- If it competes with a canonical route, it goes into `data/cleanup-queue.ts`.
- If it needs user context, it must accept a typed warm-transfer payload from `lib/warm-transfer.ts`.
- If it cannot declare a measurable handoff or outcome, it should not exist.
