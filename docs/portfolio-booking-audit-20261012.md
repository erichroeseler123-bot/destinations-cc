# Four-site booking-path audit — October 12, 2026

Scope: initial public desktop-browser checks and targeted GitHub source review for JFD, WNO, WTA and Welcome to the Swamp. No purchases, customer registrations, real customer messages, production deployments, domain changes or payment/database mutations were performed.

## Findings and prepared changes

| Site | Observed behavior | Action/status |
| --- | --- | --- |
| WTA | The homepage promises four choices, but the Juneau best-overall shortlist renders five. Source inspection shows the fallback loop appends after the diversity pass reaches the limit. | Fixed in wta-renderer PR #10. Regression fails before the fix and passes after. |
| WTA | Homepage date reaches the direct calendar link, but shortlist See details links omit date/ship. Tour details also overwrite selected calendar context with the next-available month; some NorthStar links discard context. | Preserve date/ship on detail links and all detail booking links; use next availability only when no date/month is selected. Included in PR #10. |
| Swamp | Public browser accessibility tree exposes unnamed selectors for adults, children, transportation and boat preference; source labels/spans are unassociated. Custom date and child-age fields also need explicit names. | Associate visible labels using stable React useId IDs; name custom date field. Prepared in this PR. |

## Paths checked without finding a blocking defect

- **JFD:** selecting a test date and three travelers produces a Viator link containing `startDate` and `numTravelers=3`. Seat-alert links preserve the date. The Ship Port Timing navigation opens a page containing the timing solver and daily-availability request form. The form was inspected without submitting a customer request.
- **WNO:** homepage covered-boat card opens the matching tour detail page. Check Dates & Prices opens the Ragin Cajun Covered Tour Boat FareHarbor calendar. Its item and operator match the site link, and the embedded calendar visibly renders selectable dates. No reservation was made.
- **Swamp:** default hotel-pickup departure search returns scheduled results, base totals, pickup time, a partial-provider warning, and an explicit instruction that seats/date/time/passenger count require confirmation on checkout. The Ragin Cajun result opens the corresponding airboat detail and FareHarbor calendar path. Live inventory and a completed transaction were not independently validated.
- **WTA:** the real homepage date-to-shortlist-to-direct-calendar path preserves the date when entered with native keyboard events. The first automation fill did not trigger React's change event; that apparent homepage date loss was a test artifact and was excluded from fixes.

## Validation and remaining checks

WTA's expanded recommendation regression covers strict limits 1, 2 and 4, multiple operators, duplicate candidates, empty input, zero limits and a partial diversity pass. It was executed with Node 24 native TypeScript support using a temporary `.ts` import adaptation. React checklist reviewed for the small server-page link changes and Swamp useId associations.

Full preview builds and browser verification of changed pages remain pending. This initial pass does not establish complete mobile/responsive correctness, successful purchases, customer email delivery, waitlist scanner reliability, live seat availability or supplier policy accuracy. Those require separate focused tests with appropriate test environments.

The Windows AG worker posted receipt/failure updates for the original connection tasks (#144–#147). As of this pass, no successful updated connection check has been posted. The fixes to its Windows sparse checkout and AG response handling are published in setup PR #143; autonomous execution depends on restarting the updated worker.

## Next batch

1. Verify WTA preview: four cards; selected date through See details and direct calendar; explicit month handling; all NorthStar booking links.
2. Verify Swamp preview labels with keyboard/screen reader semantics and repeat default, self-drive and child-age searches.
3. Exercise JFD request validation and mocked notification/seat-release cases in a test environment, without emailing customers or assuming real inventory opens.
4. Exercise WNO chooser routes, pickup variants and checkout fallbacks across representative tour categories, then inspect mobile layouts.
