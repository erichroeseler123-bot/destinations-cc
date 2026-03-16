# Port Tours Coverage Rollout

Current state of canonical port coverage for `/tours` handoff into the existing city tours surface.

Audit basis:
- canonical ports under `data/registry/port/*.jsonl`
- direct destination coverage from `data/city-aliases.json` and `data/attractions.json`
- explicit mapped handoffs from `data/port-tour-destinations.json`

## Summary

- `covered`: 45
- `needs_city_coverage`: 27
- `needs_explicit_mapping`: 2
- `do_not_route_to_city_tours`: 7
- `needs_policy_decision`: 4

## Covered

| port_slug | bucket | handoff_destination | status | notes |
| --- | --- | --- | --- | --- |
| amsterdam | direct city destination | amsterdam | covered | direct city-style handoff |
| barcelona | direct city destination | barcelona | covered | direct city-style handoff |
| bergen | direct city destination | bergen | covered | minimal starter coverage added |
| cabo-san-lucas | direct city destination | cabo-san-lucas | covered | direct city-style handoff |
| civitavecchia | mapped nearby destination | rome | covered | mapped cruise gateway |
| copenhagen | direct city destination | copenhagen | covered | direct city-style handoff |
| costa-maya | mapped nearby destination | mahahual | covered | mapped nearby destination |
| cozumel | direct city destination | cozumel | covered | direct city-style handoff |
| dubai | direct city destination | dubai | covered | direct city-style handoff |
| dubrovnik | direct city destination | dubrovnik | covered | direct city-style handoff |
| helsinki | direct city destination | helsinki | covered | direct city-style handoff |
| hong-kong | direct city destination | hong-kong | covered | direct city-style handoff |
| honolulu | direct city destination | honolulu | covered | direct city-style handoff |
| istanbul | direct city destination | istanbul | covered | direct city-style handoff |
| juneau | direct city destination | juneau | covered | Alaska city handoff |
| ketchikan | direct city destination | ketchikan | covered | Alaska city handoff |
| key-west | direct city destination | key-west | covered | direct city-style handoff |
| kusadasi | mapped nearby destination | ephesus | covered | mapped nearby destination |
| lisbon | direct city destination | lisbon | covered | direct city-style handoff |
| livorno | mapped nearby destination | florence | covered | mapped cruise gateway |
| los-angeles | direct city destination | los-angeles | covered | direct city-style handoff |
| marseille | direct city destination | marseille | covered | direct city-style handoff |
| naples | direct city destination | naples | covered | direct city-style handoff |
| nassau | direct city destination | nassau | covered | direct city-style handoff |
| new-orleans | direct city destination | new-orleans | covered | direct city-style handoff |
| piraeus | mapped nearby destination | athens | covered | mapped cruise gateway |
| port-canaveral | mapped nearby destination | orlando | covered | mapped cruise gateway |
| port-everglades | mapped nearby destination | miami | covered | mapped cruise gateway |
| portmiami | mapped nearby destination | miami | covered | strip-port-prefix handoff |
| progreso | mapped nearby destination | merida | covered | mapped nearby destination |
| puerto-vallarta | direct city destination | puerto-vallarta | covered | direct city-style handoff |
| san-diego | direct city destination | san-diego | covered | direct city-style handoff |
| san-francisco | direct city destination | san-francisco | covered | direct city-style handoff |
| san-juan | direct city destination | san-juan | covered | direct city-style handoff |
| seattle | direct city destination | seattle | covered | direct city-style handoff |
| singapore | direct city destination | singapore | covered | direct city-style handoff |
| sitka | direct city destination | sitka | covered | Alaska city handoff |
| skagway | direct city destination | skagway | covered | Alaska city handoff |
| southampton | direct city destination | southampton | covered | direct city-style handoff |
| stockholm | direct city destination | stockholm | covered | direct city-style handoff |
| sydney | direct city destination | sydney | covered | direct city-style handoff |
| tampa | direct city destination | tampa | covered | direct city-style handoff |
| vancouver | direct city destination | vancouver | covered | direct city-style handoff |
| venice | direct city destination | venice | covered | direct city-style handoff |
| yokohama | direct city destination | yokohama | covered | current policy routes to Yokohama, not Tokyo |

## Needs City Coverage

| port_slug | bucket | handoff_destination | status | notes |
| --- | --- | --- | --- | --- |
| abu-dhabi | direct city destination | abu-dhabi | needs_city_coverage | cheap direct-city win |
| auckland | direct city destination | auckland | needs_city_coverage | cheap direct-city win |
| basseterre | direct city destination | basseterre | needs_city_coverage | direct Caribbean capital |
| belize-city | direct city destination | belize-city | needs_city_coverage | direct city-style handoff |
| bridgetown | direct city destination | bridgetown | needs_city_coverage | direct Caribbean capital |
| brisbane | direct city destination | brisbane | needs_city_coverage | cheap direct-city win |
| cartagena | direct city destination | cartagena | needs_city_coverage | strong cruise/tours destination |
| castries | direct city destination | castries | needs_city_coverage | direct Caribbean capital |
| falmouth-jamaica | direct city destination | falmouth-jamaica | needs_city_coverage | could later normalize to falmouth |
| galveston | direct city destination | galveston | needs_city_coverage | strong US cruise origin |
| haines | direct city destination | haines | needs_city_coverage | lower-value Alaska town |
| hamburg | direct city destination | hamburg | needs_city_coverage | cheap direct-city win |
| mazatlan | direct city destination | mazatlan | needs_city_coverage | direct Mexico port city |
| melbourne | direct city destination | melbourne | needs_city_coverage | cheap direct-city win |
| montego-bay | direct city destination | montego-bay | needs_city_coverage | direct Caribbean tourism city |
| mykonos | direct city destination | mykonos | needs_city_coverage | strong cruise/tours destination |
| oranjestad | direct city destination | oranjestad | needs_city_coverage | direct Caribbean capital |
| palma-de-mallorca | direct city destination | palma-de-mallorca | needs_city_coverage | strong Mediterranean destination |
| philipsburg | direct city destination | philipsburg | needs_city_coverage | direct Caribbean capital |
| santorini | direct city destination | santorini | needs_city_coverage | strong cruise/tours destination |
| seward | direct city destination | seward | needs_city_coverage | direct Alaska town destination |
| shanghai | direct city destination | shanghai | needs_city_coverage | cheap direct-city win |
| tallinn | direct city destination | tallinn | needs_city_coverage | direct Northern Europe city |
| valdez | direct city destination | valdez | needs_city_coverage | lower-value Alaska town |
| valencia | direct city destination | valencia | needs_city_coverage | cheap direct-city win |
| whittier | direct city destination | whittier | needs_city_coverage | direct Alaska town destination |
| willemstad | direct city destination | willemstad | needs_city_coverage | direct Caribbean capital |

## Needs Explicit Mapping

| port_slug | bucket | handoff_destination | status | notes |
| --- | --- | --- | --- | --- |
| icy-strait-point | mapped nearby destination | hoonah | needs_explicit_mapping | cruise gateway name already hints at Hoonah |
| messina | mapped nearby destination | taormina | needs_explicit_mapping | likely higher-intent excursion destination than Messina itself |

## Do Not Route To City Tours

| port_slug | bucket | handoff_destination | status | notes |
| --- | --- | --- | --- | --- |
| cococay | private island / operator-defined destination |  | do_not_route_to_city_tours | operator island, not a city tours surface |
| college-fjord | scenic/non-city excursion node |  | do_not_route_to_city_tours | scenic pass-through, not a city |
| glacier-bay | scenic/non-city excursion node |  | do_not_route_to_city_tours | scenic national park call, not a city tours handoff |
| great-stirrup-cay | private island / operator-defined destination |  | do_not_route_to_city_tours | operator island, not a city tours surface |
| hubbard-glacier | scenic/non-city excursion node |  | do_not_route_to_city_tours | scenic glacier node |
| labadee | private island / operator-defined destination |  | do_not_route_to_city_tours | operator destination, not a city |
| tracy-arm-fjord | scenic/non-city excursion node |  | do_not_route_to_city_tours | scenic fjord node |

## Needs Policy Decision

| port_slug | bucket | handoff_destination | status | notes |
| --- | --- | --- | --- | --- |
| anchorage | insufficient data |  | needs_policy_decision | label says via Whittier/Seward; product destination needs explicit choice |
| george-town-grand-cayman | insufficient data |  | needs_policy_decision | decide whether to hand off to `george-town-grand-cayman` or `grand-cayman` |
| roatan | insufficient data |  | needs_policy_decision | decide whether island-level destination is acceptable or if a town slug is preferred |
| st-thomas | insufficient data |  | needs_policy_decision | decide whether to route to `st-thomas` or a more specific urban destination |

## Next 10 Highest-Value Ports To Cover

Preferring cheap direct-city wins first:

1. `abu-dhabi`
2. `auckland`
3. `brisbane`
4. `cartagena`
5. `hamburg`
6. `melbourne`
7. `shanghai`
8. `valencia`
9. `mykonos`
10. `santorini`

Why these 10:
- all are direct city-style destinations
- no resolver changes required
- no explicit mapping table entries required
- each only needs:
  - a city key in `data/city-aliases.json`
  - a minimal starter entry in `data/attractions.json`

## Cheapest Remaining Wins

Only need city coverage:
- `abu-dhabi`
- `auckland`
- `basseterre`
- `belize-city`
- `bridgetown`
- `brisbane`
- `cartagena`
- `castries`
- `falmouth-jamaica`
- `galveston`
- `haines`
- `hamburg`
- `mazatlan`
- `melbourne`
- `montego-bay`
- `mykonos`
- `oranjestad`
- `palma-de-mallorca`
- `philipsburg`
- `santorini`
- `seward`
- `shanghai`
- `tallinn`
- `valdez`
- `valencia`
- `whittier`
- `willemstad`

Need explicit entries in `data/port-tour-destinations.json`:
- `icy-strait-point -> hoonah`
- `messina -> taormina`
