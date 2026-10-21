# Swamp search side project — October 21, 2026

## Objective and scope

One-time work on Welcome to the Swamp. Improve useful answers, reuse verified product facts as a citable compilation, and connect directly related pages. No ranking or AI-citation gains are assumed. No recurring AI job, new account, paid service, external message, social post, review request, or operator-data refresh is authorized by this change.

## Search Console selection — blocked on sign-in

No page/query impression, click, CTR or position baseline has been retrieved. An authenticated Search Console performance view has not been verified. No credentials or account/session details belong in this record. Do not infer performance access from public site access.

Do not label the pages edited here “highest-impression pages” or “positions 6–20.” They were chosen for independently observed content gaps and relation to the current family guide. The ranking-based 3–5-page selection is pending actual evidence.

### Selection and measurement procedure once authorized access is available

1. Use the welcometotheswamp.com property, Web search performance, the preceding three complete months initially; extend to six months if volume is low. Retain the exact date range, property, device/country/search-type filters and data extraction date.
2. Examine page-query pairs, not only sitewide or pagewide averages. Filter average position 6–20, sort by impressions, and prioritize relevant tour-planning intent. Separate brand terms and incidental queries. Cross-check the last 28 complete days so an old seasonal association is not mistaken for a current opportunity.
3. Select 3–5 distinct existing canonical pages only after checking their query mix and booking value. Record impressions, clicks, CTR and average position as measured values. No placeholder zeros.
4. For each selected query, record the current top-three comparison URLs, retrieval date, what each resolves and the remaining evidence-backed gap. Search observations are not a fixed, universal Google ranking order.
5. Make targeted improvements on existing URLs; preserve useful source content and booking attribution. Add a small number of descriptive internal links based on visitor relevance, not an all-to-all link pattern.
6. Compare equivalent 28-day windows around 4–8 weeks after release, reviewing device, query, country and seasonality changes. Review organic booking handoffs and attributed bookings where available; handoffs are not purchases. No scheduled paid checks are created. This document is a manual checkpoint.

Candidate routes for investigation after access: `/transportation`, `/airboat-vs-boat`, `/best-time`, `/types`, and existing tour detail pages. This is a topical candidate list, not a measured ranking shortlist.

## Work completed independently of the missing ranking data

- `/with-kids`: concise direct answers for under-five eligibility, rental-address pickup and whole-outing duration; original six-product rules snapshot at `#published-rules`; sourced JSON download; existing interactive matcher retained.
- `/transportation`: replace unsupported universal fares, timing, phone-coverage anecdotes and immediate-return guarantees with operator-specific transport warnings and sourced product examples. Preserve existing planning handoff context.
- `/airboat-vs-boat`: descriptive link to the same product-level snapshot and family eligibility guide.
- Existing family fact data remains the source of truth. No individual checkedOn date is advanced by the export. Scope: six products from five operator brands; not a census, traveler survey, firsthand tour research or accessibility testing.

Snapshot: https://welcometotheswamp.com/with-kids#published-rules
Download: https://welcometotheswamp.com/data/swamp-tour-published-rules.json

### Manual maintenance

Review each changed operator fact and update only its own checkedOn/source/status. Review the compilation date in `lib/familySnapshot.ts`, then run `node scripts/export-family-rules.mjs`. Run `node scripts/export-family-rules.mjs --check` and `node tests/family-decision.test.mjs` before building/releasing. The export uses no network calls and performs no source verification itself. Unknown fields must remain null with status unknown; do not replace them with false/zero/allowed. Keep qualifications and product scope in the download.

## Relevant outreach prospects — researched, not contacted

All contact routes checked against their own public sites on October 21, 2026. These are prospective editorial/resource contacts, not confirmed placements or link commitments. Ask for independent editorial consideration or corrections, never payment, an obligatory link, a review swap, or a predetermined endorsement.

| Prospect | Why relevant | Verified public route | Appropriate angle |
| --- | --- | --- | --- |
| New Orleans Mom | Publishes local family outings and swamp-tour coverage | https://neworleansmom.com/contact/ — info@neworleansmom.com | Child-age versus height distinctions and no-car logistics; offer the compilation as a source. Guest-post guidelines restrict financially affiliated business promotion, so do not submit disguised promotional content. |
| New Orleans & Company communications | Destination information and travel-media resources | https://www.neworleans.com/press-media/contact-us/ — communications@neworleans.com | A transparent visitor-planning resource, not an official tourism-board endorsement. |
| Visit Jefferson Parish travel media | Local swamp-tour destination and travel-writer support | https://www.visitjeffersonparish.com/media/press-kit/ — Charlene@visitjeffersonparish.com | Source-backed pickup and child-rule distinctions relevant to parish visitors. |
| Tours by Foot New Orleans | Maintains a substantive New Orleans swamp-tour guide | https://freetoursbyfoot.com/new-orleans-tours/contact-new-orleans/ — nola@freetoursbyfoot.com | Offer exact product-rule sources and reusable snapshot to support editorial updates. |
| Gators & Ghosts | Local tour seller with swamp-tour comparisons and visitor resources | https://gatorsandghosts.com/contact — info@gatorsandghosts.com | Secondary prospect: invite factual corrections/resource consideration; commercial overlap may make a placement unlikely. |

Relevant coverage checked: https://neworleansmom.com/perspectives-in-parenting/worth-the-drive-cajun-pride-swamp-tour/ and https://freetoursbyfoot.com/swamp-tours-new-orleans/. Contact verification does not establish that recipients want the pitch. Resolve identities/current routes again before any separately authorized send.

### Reviewable outreach draft — not sent

Subject: Sourced child-rule and pickup comparison for New Orleans swamp tours

Hi [editor/team],

We compiled the published child-eligibility and transportation rules for six New Orleans swamp-tour products across five operator brands. It separates age limits from height limits, hotel pickup from central departures, and verified rules from details that still need confirmation.

The comparison and downloadable source records are here:
https://welcometotheswamp.com/with-kids#published-rules

Each fact retains its operator source, product scope and check date. This is a compilation of published information, not firsthand tour research or a live availability service.

If it would help your readers, please consider it as a source for your family-trip or swamp-tour coverage. We would also welcome specific corrections supported by an operator source.

Thanks,
Erich

## Evidence supporting the search approach

Google primary guidance reviewed October 21, 2026:
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/docs/appearance/ai-features

Google says there is no special AI markup, required chunking format or ideal page length. Concise self-contained answers and useful internal links are reader-oriented implementation choices, not proven citation switches. Do not claim that 40–60 words, exact-match question headings, LinkedIn posts or YouTube publication guarantee inclusion. The claim that this project is the highest-ROI action is a hypothesis until actual costs, qualified traffic and booking outcomes can be measured. Search visibility and inclusion are not guaranteed.

## Release evidence

Local production build, snapshot/source parity, independent fact dates and existing family matching tests passed. Preview 990dc5944354cac7a631a60956be63ea78fdcd4f passed browser checks for SSR, canonical, snapshot download, 1280/375/320 widths, age/height matching, booking destinations, transportation links and no same-site API POSTs. Mobile caption refinement follows that check. Final exact-head preview and production custom-domain evidence are recorded in PR #196. No outreach was sent.
