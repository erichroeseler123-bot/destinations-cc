# DCC Equalizer Engineering Doctrine

## Mission

**DCC converts complexity into opportunity.**

For travelers, it turns fragmented destination data into understandable decisions.
For local operators, it turns basic availability and capability into sophisticated digital distribution.
For a solo operator running the platform, it turns feeds and rules into an automatically operating destination network.

Portfolio model:

**WHEN → WHERE → WHO → HOW TO BUY → WHY THIS**

- **WHEN — CruisePromenade:** trip, sailing, port-call and time-window context.
- **WHERE — Destination Command Center:** destination truth, live observations and spatial context.
- **WHO — Vibe and specialist discovery surfaces:** eligible providers and local capacity.
- **HOW TO BUY — GoSno, WNO, Alaska, affiliates and other transaction owners:** reservations, quotes and checkout.
- **WHY THIS — decision explanation layer:** machine-readable evidence for why a plan, place or provider fits.

## Equalizer rules

1. Destination facts cannot be purchased.
2. Paid relationships cannot alter weather, geography, distance, event ordering, accessibility facts or port-window feasibility.
3. Commercial matches must disclose why they matched.
4. Local operators can participate without buying advertising.
5. A smaller operator can outrank a larger operator when the smaller operator is the better deterministic fit.
6. Results must distinguish informational, algorithmically matched, sponsored and transactional states.
7. AI may translate, summarize and explain evidence; it may not manufacture live-state evidence or invent scoring inputs.
8. Commercial payment contributes **zero points** to fit scoring.

## One source of truth, not parallel systems

DCC must not create separate competing models in Next.js config, Supabase, n8n and individual sites.

The canonical flow is:

**providers → ingestion/normalization → canonical DCC contracts → persistence/cache → `/v1/...` public/internal read surfaces → portfolio sites**

Supabase, Redis, Vercel storage, n8n or other infrastructure may persist, queue, cache or schedule data, but they do not redefine canonical entity IDs or decision semantics.

## Three data lifecycles

### 1. Stable facts — what exists

Canonical graph entities and relationships:

- Destination
- Neighborhood
- Place
- Venue
- Port
- Airport
- Operator / Driver
- Vehicle
- TransportationService
- stable relationships such as `locatedIn`, `contains`, `servesArea`, `operatesVehicle`

Stable facts use canonical IDs and change only after source-backed review or trusted ingestion.

### 2. Live observations — what is happening

Ephemeral/provider-owned observations:

- Event
- WeatherObservation
- ShipCallObservation
- WebcamObservation
- RoadStatus
- FerryStatus
- ProviderAvailability

Observations retain source identity, observed/fetched time, cache age and provider health. They must expire or refresh according to source policy.

### 3. Decisions — what should this traveler do

Derived, reproducible outputs:

- StructuredIntent
- ReturnRiskAssessment
- MatchResult
- RecommendationExplanation

Decisions must cite the facts/observations/rules used to produce them. They are never stored as destination truth.

## AI evidence boundary

AI can:

- extract structured intent from language or voice;
- summarize source-backed observations;
- generate operator-profile drafts from operator-provided evidence;
- explain deterministic match/risk outputs;
- classify observations when the model returns confidence and source evidence.

AI cannot:

- invent a live observation;
- silently fill missing availability;
- create a provider license claim without verification evidence;
- invent a fit score;
- change a return-risk calculation for commercial reasons.

For visual/live classification, store structured claims and confidence first. Human-facing text is generated only from supported claims.

Example:

```json
{
  "claim": "surf_state",
  "value": "light",
  "confidence": 0.89,
  "sourceObservationId": "webcam:st-thomas/magens-bay:2026-08-14T15:00:00Z"
}
```

If evidence is weak, surface `unknown` rather than confident prose.

## Solo-operator rule

**If information can be reliably derived from machines, the platform operator should never have to type it twice.**

If the same manual task is required repeatedly, move it into a feed, rule, template, review queue or exception workflow.

Humans manage exceptions, verification and strategy—not routine city curation.
