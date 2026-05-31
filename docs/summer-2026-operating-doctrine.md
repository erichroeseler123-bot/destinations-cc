# Summer 2026 Operating Doctrine

This is the working rule for the network as it moves into a lower-touch operating mode.

## Core Principle

`Build governed corridors, publish them clearly, carry intent cleanly, measure the handoff.`

This network is not a content farm and not a pile of disconnected sites.

It is a governed decision system:

- `DCC` decides
- satellites narrow once
- operators execute
- `EarthOS` governs operations and publication

## Node Role Contract

The node system is fail-closed.

Allowed roles:

- `decision`
- `satellite`
- `guide_candidate`
- `disabled`

Validation contract:

- `decision` requires:
  - `verdict`
  - `primary_cta_label`
  - `target_surface_id`
- `satellite` requires:
  - `target_surface_id`
- `guide_candidate` and `disabled` do not require those fields

Operational result:

- valid `decision` or `satellite` surfaces may be indexable when governance also allows it
- `guide_candidate` is a research or holding state and must remain `noindex`
- `disabled` is extinguished and should resolve as `404`
- invalid `decision` or `satellite` nodes fail closed:
  - `noindex` in production
  - internal warning in dev / preview

## 1. Structure

Every corridor must have a clear role.

- `DCC` owns the macro decision
- satellites handle one narrowing step when needed
- operators own booking truth and fulfillment
- no corridor should rely on users re-deciding the same question twice
- no surface should try to do all jobs at once

Rule:

- if the user is still unclear, narrow once
- if the user is already clear, route directly to execution
- never chain satellites
- never let a support page compete with the execution truth

## 2. Machine Readability

Every important surface must be technically explicit.

That means governed publication of:

- `sitemap.xml`
- `llms.txt`
- `agent.json`
- correct schema family / JSON-LD

`EarthOS` should be the publication layer for these outputs where the system intends governed generation.

Rule:

- machine-readable outputs must reflect actual role
- do not hand-author discovery files if the governed publisher is supposed to own them
- do not let discovery outputs drift away from route doctrine
- do not publish discovery outputs for surfaces that fail the role contract

## 3. Decision Carriage

Cross-site continuity must use the canonical model.

Use:

- `dcc_handoff_id`
- `source_page`
- `decision_corridor`
- `decision_action`
- `decision_option`
- `decision_product`
- `decision_entry`
- `decision_state`

Rule:

- `decision_*` is the governing language
- legacy lane/product params are fallback compatibility only
- the destination should continue the resolved action, not reopen the macro choice

## 4. Measurement

The network is judged by completed loops, not by pages published.

Track:

- landing
- CTA click
- booking start
- booking complete

Rule:

- clean plumbing without outcome improvement is not success
- a corridor is only "working" when external intent reliably becomes measurable execution

## 5. Prime-Season Rule

When a money surface is in peak season, protect it.

For Red Rocks right now:

- freeze `partyatredrocks`
- do not change booking UX, checkout, payment, or booking-state logic
- improve DCC-side conviction only
- measure handoff quality and attributed starts/completions

Allowed changes:

- DCC verdict strength
- CTA clarity
- internal linking into the corridor
- handoff accuracy

Disallowed changes:

- any change that alters booking behavior
- any experiment inside execution surfaces
- any new booking path

Rule:

- prime season = protect execution
- optimize upstream first

Reason:

- prime season is for harvesting, not experimenting

### UI Rule During Prime Season

DCC-side UI fixes are allowed when they improve conviction without changing corridor structure or execution behavior.

Allowed UI work:

- clearer visual hierarchy around the verdict
- stronger CTA prominence
- cleaner mobile layout
- tighter shared vs private comparison blocks
- clearer "what happens next" handoff explanation

Disallowed UI work:

- UI changes that create a new decision path
- UI changes that add new surfaces to solve conversion problems
- UI changes that alter operator-side booking behavior
- UI work used as a disguised execution-surface redesign

Test:

- if the UI change helps the user understand the verdict faster and click the correct existing CTA with more confidence, it is allowed
- if the UI change changes where the user goes, adds a new choice, or changes booking behavior, it is not allowed

## 6. Corridor Priority Rule

Do not scale based on theory.
Scale from one corridor that proves the loop.

Current benchmark corridor:

- Red Rocks

Suggested order after proof:

1. Red Rocks
2. Argo
3. Swamp or Juneau

Rule:

- prove one corridor repeatedly before broad expansion

## 7. New Work Filter

Before prioritizing any new page, app, or corridor, ask:

1. Is this a governed corridor or just page sprawl?
2. Does it make the system more structurally clear?
3. Does it improve machine-readable clarity?
4. Does it preserve canonical `decision_*` continuity?
5. Can we measure whether it produced execution?

If not, deprioritize it.

## 8. Summer 2026 Operating Goal

By the time the system is being run from Wisconsin, the network should be:

- structurally governed
- machine-readable and auditable
- measurable from decision to execution
- low-maintenance at the operator layer
- focused on a few working corridors instead of broad unfinished expansion

## 9. Daily Operator Loop

Every active corridor must be evaluated daily using the same loop.

Track:

- DCC page sessions
- CTA click rate
- booking starts
- booking completions

Diagnose:

- low CTR -> decision not strong enough
- high CTR, low starts -> wrong expectation or weak handoff
- starts without completions -> execution surface friction; log it, do not change it in prime season

Act:

- only change the weakest step in the loop
- do not redesign the entire corridor
- do not introduce new surfaces to "fix" a conversion problem

Rule:

- improve the loop, not the surface area

### Daily Spider Path + Machine Understanding Review

Machine-readable understanding is a continuously maintained operational surface.

Spider Path is the intended crawl and understanding flow for AI crawlers, search engines, LLM agents, entity systems, recommendation systems, and other machine readers.

Required checks:

- [ ] `llms.txt` validity
- [ ] `agent.json` validity
- [ ] Organization/WebSite schema integrity
- [ ] network relationship consistency
- [ ] execution hierarchy consistency
- [ ] canonical URL alignment
- [ ] sitemap freshness
- [ ] crawler-discoverable path continuity
- [ ] internal-link reinforcement
- [ ] SERP title clarity
- [ ] meta description decisiveness
- [ ] decision compression language
- [ ] marketplace fallback framing
- [ ] continuity preservation
- [ ] no stale marketplace wording
- [ ] no accidental "browse" language
- [ ] no contradictory execution claims
- [ ] no broken execution hierarchy references

Daily questions:

- What are machines learning first?
- What relationships are they inferring?
- What execution layer appears primary?
- Are we reinforcing certainty or reopening optionality?
- Are we accidentally teaching "marketplace" instead of "decision continuity"?
- Which pages reinforce operational authority?
- Which pages weaken confidence?

Machine Understanding Drift includes stale doctrine, contradictory metadata, stale descriptions, old marketplace assumptions, weak execution framing, entity ambiguity, and inconsistent crawler paths.

If detected:

- log it as a governance finding
- flag it in telemetry/dashboard when possible
- fix the machine-readable layer before expanding traffic

## 10. Corridor Application: The Argo Loop (Owned-Flow Benchmark)

While Red Rocks benchmarks the handoff to an external operator, Argo benchmarks the handoff to an owned action surface (`Shuttleya`).

### The Argo Constraint Set

- DCC intake:
  - `/mighty-argo-shuttle`
  - related arrival pages
- execution surface:
  - `shuttleya.com`
- doctrinal goal:
  - validate `decision_*` carriage when the destination surface is under direct control but restricted to a single-corridor role

### The "One Yes" Audit For Argo

Because `Shuttleya` is an owned surface, the primary risk is UI drift and choice reset.

During prime season, the Argo loop must stay stricter than a generic owned-surface redesign.

1. Direct path:
   - DCC must decide `Argo Shuttle` and hand off to the `Shuttleya` booking page with zero intervening steps.
2. No choice reset:
   - if a user selects a date or time on DCC, that state should arrive at `Shuttleya` prefilled when the current flow supports it.
3. Visual lock:
   - `Shuttleya` UI fixes are allowed only when they increase booking-start conviction.
   - do not add feature pages, auxiliary content, or new route families during prime season.

### Argo-Specific Daily Loop

Track:

- DCC Argo page sessions
- handoff CTR to `Shuttleya`
- `Shuttleya` booking started vs booking completed

Diagnose:

- high DCC CTR, low `Shuttleya` starts -> the handoff feels like a new website instead of a continuation; UI mismatch or expectation drift is breaking trust
- starts without completions -> owned-surface friction exists inside the current `Shuttleya` flow; fix presentation first, not corridor scope

Act:

- fix CSS, layout, copy, and visual continuity on `Shuttleya` when they improve conviction
- keep the booking engine logic stable during prime season
- do not add new surfaces to solve an owned-flow conversion problem

Rule:

- Argo is the owned-flow benchmark
- improve continuity and booking-start conviction without widening the corridor

## Working Motto

`Govern the corridor. Publish the role. Carry the decision. Measure the outcome.`
