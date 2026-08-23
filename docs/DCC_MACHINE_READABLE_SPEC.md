# DCC Machine-Readable Portfolio Contract

Status: active

Spec ID: `dcc-site-contract`

Current version: `1.0`

## Purpose

The DCC portfolio contract gives every public property in the Destination Command Center network a stable machine-readable identity and a predictable way to describe what it knows, what public data it exposes, and where its commercial boundaries begin and end.

DCC is the canonical directory and relationship graph. Individual properties remain authoritative for their own public facts and public data endpoints.

## Required contract fields

Every `/agent.json` implementation should expose at least:

- `spec`: always `dcc-site-contract`
- `version`: contract version, currently `1.0`
- `dcc_id`: stable network identity, for example `dcc:site:gosno`
- `site.id`: stable local site slug
- `site.name`: public site name
- `site.url`: canonical public URL
- `site.type`: concise machine-readable role
- `site.description`: factual description of the public service
- `authority`: what facts the site is authoritative for
- `entry_points`: useful human or machine entry points
- `machine`: public machine-readable surfaces available on the site
- `booking_boundary`: where applicable, what the site can and cannot authoritatively represent about booking or checkout
- `network`: relationship back to Destination Command Center and the canonical DCC portfolio feed

## Identity rules

Stable site IDs use the form:

`dcc:site:{slug}`

Stable entity IDs should use typed namespaces, for example:

- `dcc:destination:st-thomas`
- `dcc:destination:new-orleans`
- `dcc:airport:den`
- `dcc:resort:breckenridge`
- `dcc:port:st-thomas`
- `dcc:tour:wno:city-tour`

Names and domains may change. A stable DCC ID should not change merely because public branding changes.

## Layering

1. Human web: useful normal pages, canonical URLs, robots, sitemap, structured HTML.
2. Site contract: `/agent.json`, schema.org JSON-LD, `/llms.txt`, and public data endpoints.
3. DCC graph: canonical entities and relationships across properties.
4. Portfolio feeds: DCC exposes the combined public graph for machines.

## Rules

- Do not expose secrets, internal strategy, unpublished inventory, or private customer data.
- Do not claim live availability unless the source is actually live and the endpoint states its freshness.
- Public prices, schedules, routes, tours, drivers, places, and similar facts should come from the authoritative property or its documented upstream source.
- `openapi.json` is optional and should only exist where there is a genuine public API worth documenting.
- `llms.txt` is supplemental discovery, not a substitute for normal crawlability or structured data.
- `agent.json` is a DCC portfolio convention, not a claim of universal industry-standard support.

## Canonical portfolio graph

The DCC graph is exposed at:

`https://www.destinationcommandcenter.com/api/public/portfolio-feed`

Each site contract should point back to this feed.