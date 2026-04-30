# Route Policy

This document defines how public routes in the `destinations-cc` workspace are classified, indexed, canonized, and represented in sitemap and schema output.

The goal is simple:

- one winner per intent
- one canonical URL per page meaning
- no crawl waste from aliases, utilities, or helper routes
- clear role discipline across DCC, satellites, and operators

---

## 1. Core rule

Every public route must be classified as one of these:

- `canonical`
- `redirect_alias`
- `utility`
- `strategy_review`

That classification controls:

- sitemap inclusion
- canonical metadata
- robots behavior
- schema expectations
- internal linking policy

If a route is not classified, it is not ready to ship.

---

## 2. System roles

Route policy must respect site role.

### DCC

Role: `understand`

DCC routes explain, compare, and route users into the right downstream surface.
They do not act as operator booking pages.

### Satellites

Role: `choose`

Satellite routes narrow the user into the right lane, shortlist, or handoff.
They should not behave like direct checkout pages unless the site is intentionally being redesigned as act-layer.

### Operators

Role: `act`

Operator routes execute booking, logistics, and post-selection support.
They can include supporting trust, FAQ, and discovery surfaces, but they should not drift into broad authority-role duplication already owned by DCC.

---

## 3. Classification types

### 3.1 `canonical`

A route is `canonical` when all of the following are true:

- it is a real public destination
- it should be crawled
- it should be indexable unless explicitly overridden
- it does not immediately redirect to a different URL
- it is the preferred internal-link target for its meaning
- its page-level canonical should point to itself

Canonical routes:

- belong in sitemaps
- should receive internal links
- should emit metadata that confirms self-canonical status
- should emit schema matching the page family

---

### 3.2 `redirect_alias`

A route is `redirect_alias` when it exists only to send users or old links to a canonical destination.

A redirect alias:

- must not appear in sitemaps
- must not be the target of internal links
- must not self-canonical
- should 301 to the canonical destination
- should be retained only if it serves migration, legacy, or UX continuity

Examples:

- old booking aliases
- renamed route families
- shortened handoff entry points that resolve into canonical destinations

Rule:
If a route 301s, the destination belongs in the sitemap, not the alias.

---

### 3.3 `utility`

A route is `utility` when it supports navigation, filtering, status, search, helper behavior, redirects, success flows, or internal tools rather than serving as a search destination.

Utility routes usually include:

- `/search`
- `/find`
- success pages
- helper flows
- internal query surfaces
- search results pages
- redirect helpers
- temporary state pages

Utility routes:

- do not belong in sitemaps
- should generally be `noindex, follow`
- should not self-position as ranking pages
- should not receive canonical treatment as primary search destinations
- may emit utility schema only if that matches reality, but should still usually be noindex

---

### 3.4 `strategy_review`

A route is `strategy_review` when it is public, but inclusion/indexability is not obvious enough to decide automatically.

Use this when:

- freshness/value is ambiguous
- route family may cause duplication
- there are near-duplicate intent surfaces
- indexing may be useful but also risky
- the route’s role in the funnel is still under review

Strategy-review routes:

- should not be included in sitemaps by default until resolved
- must be explicitly reviewed before being promoted to canonical
- should be tracked in documentation or code comments as unresolved policy

Examples:

- freshness-heavy weekly pages
- marginal route families with weak uniqueness
- near-duplicate topical surfaces
- experimental programmatic families

---

## 4. Route policy outputs

Each route family should have an explicit policy for:

- `classification`
- `indexable`
- `sitemap`
- `canonical_target`
- `internal_link_target`
- `schema_family`

Suggested structure:

| Route pattern | Site role | Classification | Indexable | In sitemap | Canonical target | Schema family | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |

---

## 4.1 Public URL Contract

Every public URL must satisfy the five-part contract before it can remain a crawlable network surface:

1. one job
2. one canonical owner
3. one schema family
4. one intended next step
5. one measurable outcome

In the page registry, those signals are enforced as:

| Contract field | Registry signal | Meaning |
| --- | --- | --- |
| one job | `justification` or `notes` | why this URL exists and what user uncertainty it resolves |
| one canonical owner | `owner` | which system owns the URL and its canonical truth |
| one schema family | derived from `layer` | structured-data family must match the route role |
| one intended next step | `handoffTarget` or `canonicalTarget` | where the user should go after this URL does its job |
| one measurable outcome | `successMetric` | the event or metric that proves the page worked |

Current derived schema families:

| Layer | Schema family |
| --- | --- |
| `understand` | `WebSite`, `CollectionPage`, or `Guide` |
| `choose` | `FAQPage`, `ItemList`, or `Service` |
| `act` | `LocalBusiness`, `Product`, `Offer`, or `Service` |

Fail-closed rule:

- `canonical` and `keep` routes in public layers must pass the five-part contract.
- `review`, `redirect_pending`, `kill`, `ops`, and `unclassified` routes are not valid crawlable winners.
- if a public URL cannot satisfy the contract, it should be noindexed, redirected, parked as utility/internal, or removed from the public surface.

The executable guard lives in:

- [scripts/check-governance-rules.ts](/home/ewrewr12/destinations-cc/scripts/check-governance-rules.ts)

---

## 5. Global rules

### 5.1 Sitemap rules

Only `canonical` routes belong in sitemaps.

Sitemaps must exclude:

- redirect aliases
- utility routes
- success pages
- search pages
- helper routes
- known duplicate variants
- unresolved strategy-review routes unless explicitly approved

Sitemaps should be generated from real route inventory wherever possible:

- registries
- snapshots
- generated route families
- canonical source files

Do not rely on stale hand-curated arrays if a route family can be derived from current source-of-truth data.

---

### 5.2 Canonical metadata rules

Every canonical route must self-confirm.

That means:

- canonical metadata points to itself
- robots allow indexing unless explicitly overridden
- internal links point to that URL, not to an alias
- no conflicting alternate route claims the same intent

Redirect aliases must never self-canonical.

Utility routes should generally use `noindex, follow`.

---

### 5.3 Internal linking rules

Internal links should point only to:

- canonical routes
- intentional handoff routes
- utility routes only when the route is functionally required for user flow and not intended as a search destination

Do not link users into:

- redirect aliases
- `/find`-style helpers
- search-result utilities as if they were canonical landing pages

---

### 5.4 Schema rules

Schema must reflect the actual role of the page.

Schema does not decide whether a page should exist in search.
Route classification decides that first.

Then schema should reinforce the page’s meaning.

Typical mappings:

- homepage -> `WebSite`
- hub/category/index -> `CollectionPage`
- FAQ-heavy guide -> `FAQPage`
- event/show page -> `Event`
- local service page -> `LocalBusiness` / `TransportationService`
- search page -> `SearchResultsPage` and usually `noindex`

Schema should be consistent within route families and use shared builders where possible.

---

## 6. Role-specific guidance

### 6.1 DCC routes

DCC routes may be canonical when they:

- explain a destination, transport constraint, comparison, or planning question
- serve as hub or feeder pages
- route users toward the correct chooser or operator

DCC routes should not become operator execution clones.

Typical DCC canonical families:

- hubs
- feeders
- comparison/explanation pages
- planning guides with distinct search intent

DCC utilities should remain out of sitemaps.

---

### 6.2 Satellite routes

Satellite routes may be canonical when they:

- narrow a real decision fork
- support chooser logic
- surface shortlist-oriented destinations
- stay in choose-layer discipline

Satellite routes should not directly expose operator checkout URLs unless that site is intentionally being converted into an act-layer site.

Typical satellite canonical families:

- chooser entry pages
- plan pages
- comparison pages
- category narrowing pages

Satellite search and helper routes should remain utility/noindex.

---

### 6.3 Operator routes

Operator routes may be canonical when they:

- represent real booking surfaces
- support transaction intent
- support trust/logistics around execution
- support discovery that feeds execution

Operator routes may include:

- booking pages
- service/support pages
- FAQ/logistics pages
- discovery pages for shows/artists/venues when they are genuinely part of the acquisition funnel

Operator aliases and helpers should still be excluded from sitemaps.

---

## 7. Canonical winner rule

For any given user intent, there should be one preferred ranking destination per site role.

Examples:

- broad understanding question -> DCC
- narrowing/chooser question -> satellite
- execution/booking question -> operator

Do not create multiple self-canonical routes that target the same intent with only cosmetic variation.

When two routes are too close:

- keep one canonical
- redirect or de-emphasize the weaker one
- remove non-winners from the sitemap

---

## 8. Deep-page rule

A route should not become canonical just because it exists.

Deep pages must justify themselves by intent.

Questions to ask:

- does this page answer a real search question?
- is it meaningfully distinct from its parent or sibling pages?
- is the user still broad enough in intent to need this page?
- does it add unique value, or is it just a thin branch?

If not, the route should remain utility, be redirected, or be excluded from sitemap coverage.

---

## 9. Freshness rule

Freshness-heavy route families require special caution.

Do not automatically treat freshness pages as canonical winners.

Examples:

- weekly views
- temporary inventory slices
- short-lived calendars
- time-window landing pages

These may belong in:

- `canonical`
- `utility`
- `strategy_review`

depending on uniqueness, value, and duplication risk.

If uncertain, classify as `strategy_review` until explicitly decided.

---

## 10. Source of truth order

When route policy and docs disagree, trust this order:

1. actual live route behavior
2. code-level route implementation
3. current registries/snapshots/data sources
4. generated inventories/maps
5. recent docs
6. old docs or stale audits

Do not preserve a sitemap entry just because an old document listed it.

---

## 11. Default exclusion list

Unless explicitly approved otherwise, these should be excluded from sitemaps:

- redirect aliases
- `/find`
- `/search`
- success pages
- helper/query surfaces
- temporary redirect bridges
- internal tools
- raw filtering/search result pages
- duplicate utility views
- unresolved strategy-review families

---

## 12. Review checklist

Before classifying a route as canonical, confirm:

- does it redirect?
- is it the preferred internal-link target?
- does it serve a distinct search intent?
- should it index?
- does it self-canonical?
- does it have the right schema family?
- should it appear in the sitemap?
- does it stay in the site’s lane?

If any of those are unclear, classify as `strategy_review` until resolved.

---

## 13. Example policy table

### Example only - update per real route inventory

| Route pattern | Site role | Classification | Indexable | In sitemap | Canonical target | Schema family | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | site-specific | canonical | yes | yes | self | `WebSite` | homepage |
| `/guide/*` | operator or DCC | canonical | yes | yes | self | `CollectionPage` or `FAQPage` | only when distinct and useful |
| `/book/*/custom/shared` | operator | canonical | yes | yes | self | service/support | execution surface |
| `/book/*` | operator | redirect_alias | no | no | redirected destination | none | alias only |
| `/search` | any | utility | noindex | no | self or omitted | `SearchResultsPage` | utility only |
| `/find` | any | utility | noindex | no | self or omitted | utility | helper only |
| `/week/*` | varies | strategy_review | TBD | no by default | TBD | collection/list | needs explicit decision |

---

## 14. Implementation rule

All sitemap, metadata, schema, and internal-link logic should be derived from route policy rather than invented independently.

The system should work in this order:

1. classify route
2. decide indexability and canonical target
3. include/exclude from sitemap
4. generate metadata
5. generate matching schema
6. enforce with tests/audits

That is how crawl policy, metadata, and structured data stay aligned.

---

## 15. Non-goal

This document does not decide business strategy by itself.

It provides the classification system.

For route families that are strategically unclear, use `strategy_review` and escalate the decision instead of forcing a bad default.

---

## 16. Enforcement

Route policy is not doc-only.

The current governance commands are:

- `npm run dcc:canonical:audit`
- `npm run dcc:decision:audit`
- `npm run dcc:intent:audit`
- `npm run dcc:verify`

`dcc:verify` is the CI gate:

- typecheck
- canonical alignment audit
- decision rollout audit
- intent duplication audit

Warnings from the canonical audit are not automatic contradictions.
Only clear failures should block the gate:

- sitemap includes a redirect or utility route
- sitemap includes an explicitly noindex route
- known canonical contradictions
- duplicated live winners in the same cluster and layer
