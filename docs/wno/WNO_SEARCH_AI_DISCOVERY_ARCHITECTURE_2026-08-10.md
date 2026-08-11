# WelcomeToNewOrleansTours.com — Search + AI Discovery Architecture

**Date:** 2026-08-10

## Objective

Make WNO maximally understandable, crawlable, and citable by Google Search, Google AI features, ChatGPT Search, Perplexity, Claude search/retrieval, and other retrieval systems without using fake AEO/GEO tricks or unsupported markup.

## Principles

1. Human-visible facts and machine-readable facts must match.
2. WNO is the marketplace/broker/decision layer; participating operators remain the providers/operators.
3. FareHarbor remains the booking infrastructure/affiliate destination for third-party tours.
4. Do not claim merchant-of-record status in structured data when WNO is not the merchant.
5. Canonical URLs, operator identity, product identity, imagery, and booking attribution must be consistent everywhere.
6. Search/AI crawler access should be explicit and auditable.
7. Unique local decision content beats scaled commodity pages.
8. Training/model-development crawler policy is a separate governance choice from search/citation visibility.

## Discovery stack

### Crawl/index layer
- canonical WNO host
- clean robots.txt
- explicit OAI-SearchBot, PerplexityBot, Claude-SearchBot, and Claude-User access rules
- XML sitemap with canonical URLs only
- public machine-readable tour catalog listed in the WNO sitemap
- internal links into all important commercial and decision pages
- no duplicate top-level aliases in sitemap

### Entity graph layer
- Organization
- WebSite
- WebPage
- BreadcrumbList
- Service
- TouristTrip
- provider = actual operator
- broker = Welcome to New Orleans Tours
- CollectionPage/ItemList for category/comparison surfaces
- operator/FareHarbor identifiers where known

### Public commerce catalog
Expose a first-party JSON catalog on `/guides/tour-catalog.json` containing only public, factual storefront data:
- slug
- canonical URL
- title
- category
- operator
- WNO broker identity
- FareHarbor company shortname/item/flow identifiers when present
- image subject/source where rights-cleared
- duration/logistics labels already shown publicly
- decision context already shown to humans: best fit, not ideal for, child/family considerations, highlights, physical format, logistics, and booking-confirmation questions
- booking system = FareHarbor

No hidden rankings, private partner terms, commission rates, customer data, secrets, unsupported live availability, or fake prices.

### Content layer
Prioritize first-hand/non-commodity pages:
- operator comparisons
- vessel/format differences
- logistics from the French Quarter
- same-day/tonight planning
- before/after cruise constraints
- family/mobility/time-window decisions
- local concierge insights

## AI/search policy

Google: optimize for normal Search fundamentals. Do not invent AI-only schema or depend on llms.txt; special AI markup/files are not required for Google AI search features. Use Search Console's available Search/AI visibility reporting rather than trying to infer Google AI traffic from a normal referrer.

OpenAI: allow OAI-SearchBot so public pages can be discovered and cited in ChatGPT Search.

Perplexity: allow PerplexityBot so public pages can be indexed and cited.

Anthropic: allow Claude-SearchBot for search indexing and Claude-User for user-requested retrieval. Keep ClaudeBot/model-development policy separate.

Training crawlers are a separate governance decision and should not be conflated with search/citation crawlers.

## Measurement

Track:
- Google search entry traffic
- Google generative-AI visibility through Search Console reports when available for the property
- ChatGPT referrals (`utm_source=chatgpt.com` where present)
- Perplexity referrals
- Claude referrals when a stable referrer/source is observable
- DCC / Cruise Promenade / Welcome to the Swamp / French Quarter Orientation handoffs
- chooser starts/completions
- phone/text clicks
- FareHarbor opens
- product-open to booking-open rate
- revenue/opportunity attribution where available

## Validation

Before merge:
- robots output for WNO host
- `/guides/tour-catalog.json` returns 200 and valid JSON
- catalog product count matches live storefront inventory
- catalog exposes decision context but no private commercial terms
- no draft/nonbookable products leak into catalog
- all catalog canonical URLs resolve under WNO host
- sitemap includes the catalog and canonical tour URLs only
- schema validator checks on representative tour/category pages
- Google Rich Results Test for supported schema types
- production crawl smoke tests with Googlebot/OAI-SearchBot/PerplexityBot/Claude-SearchBot user-agent headers where feasible
