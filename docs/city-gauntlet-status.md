# City Gauntlet Status

This tracker is the operating board for city rollout and refresh work.

Legend:
- `yes`: completed
- `partial`: present but still weak or pending visible confirmation
- `no`: not done yet

## Completed Batch

| City | Registry | Manifest | Media | Specificity | Live Layer | Production Verify | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Boston | yes | yes | yes | yes | yes | yes | fully-verified | Output, response `200 image/jpeg`, and real-browser visual confirmation are complete. Hero renders naturally, page flows well, and the page no longer feels text-only. |
| Seattle | yes | yes | yes | yes | yes | yes | fully-verified | Output, response `200 image/jpeg`, and real-browser visual confirmation are complete. Hero renders naturally, page flows well, and the page no longer feels text-only. |
| Washington, DC | yes | yes | yes | yes | yes | yes | fully-verified | Output, response `200 image/jpeg`, and real-browser visual confirmation are complete. Hero renders naturally, page flows well, and the page no longer feels text-only. |
| Phoenix | yes | yes | yes | yes | yes | yes | fully-verified | Output, response `200 image/jpeg`, and real-browser visual confirmation are complete after the Wikimedia hash-path fix. Hero renders naturally and the page flows well. |
| Salt Lake City | yes | yes | yes | yes | yes | yes | fully-verified | Output, response `200 image/jpeg`, and real-browser visual confirmation are complete after the Wikimedia hash-path fix. Hero renders naturally and the page flows well. |

## Current Focus Batch

| City | Registry | Manifest | Media | Specificity | Live Layer | Production Verify | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Honolulu | yes | yes | yes | yes | partial | yes | live | Production HTML now emits hero image markup and the optimized hero image returns `200 image/jpeg`. Browser visual sign-off is the only remaining gate. |
| Tampa | yes | yes | yes | yes | partial | yes | live | Production HTML now emits hero image markup and the optimized hero image returns `200 image/jpeg`. Browser visual sign-off is the only remaining gate. |

## Next Implementation Batch

| City | Registry | Manifest | Media | Specificity | Live Layer | Production Verify | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Scottsdale | yes | yes | yes | yes | partial | yes | live | Production HTML now emits hero image markup and the optimized hero image returns `200 image/jpeg`. Browser visual sign-off is the only remaining gate. |
| San Antonio | yes | yes | yes | yes | partial | yes | live | Production HTML now emits hero image markup and the optimized hero image returns `200 image/jpeg`. Browser visual sign-off is the only remaining gate. |

## Remaining Expanded Rollout Cities

| City | Registry | Manifest | Media | Specificity | Live Layer | Production Verify | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portland | yes | yes | yes | yes | partial | yes | live | Production HTML now emits hero image markup and the updated Portland hero/copy output is live. Browser visual sign-off is the only remaining gate. |

## Category Pattern Status

| Page | Hero | Tours Near Top | Relevance Filter | Production Verify | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| /new-orleans/swamp-tours | yes | yes | yes | yes | fully-verified | Hero is present, the tour block now leads above the overview, and junk inventory no longer surfaces. |
| /new-orleans/ghost-tours | yes | yes | yes | yes | fully-verified | Output markup, smoke/output verification, and real-browser visual confirmation are complete. The hero renders naturally, the top ghost-tour lanes lead cleanly, and no junk inventory is surfacing. |
| /new-orleans/food-tours | yes | yes | yes | yes | live | Shared category-page pattern is holding: top placement is correct and lead cards stay within the page intent. |
| /new-orleans/jazz-tours | yes | yes | yes | yes | live | Production HTML now shows the stronger jazz-specific hero and top block with French Quarter heritage, Preservation Hall, Frenchmen Street, jazz brunch cruises, and Congo Square lanes. Browser GUI sign-off is the only remaining gate. |
| /boston/day-trips | yes | yes | yes | yes | live | City-hero inheritance, metadata cleanup, and Boston-specific route lanes are now live. The page no longer opens as a thin generic shell or generic city-intent grid. |
| /las-vegas/shows | yes | yes | yes | yes | live | Hero now leads beside the Vegas shows intro, a dedicated Top Las Vegas Shows Right Now block is above the broader live inventory, and the page opens as a real show-intent lane instead of a styled text wall. |
| /las-vegas/concerts | yes | yes | yes | yes | live | Production HTML now shows the inherited Vegas hero, Top Las Vegas Concerts & Residencies Right Now, and clean fallback lanes for Sphere, residency shows, headliners, and magic/comedy. Browser GUI sign-off is the only remaining gate. |

## Day-Trip Quality Pass

| City | Hero | Metadata | Specific Lanes | Production Verify | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Boston | yes | yes | yes | yes | fully-verified | Hero, metadata, and city-specific route lanes are live: Salem, Cambridge, Cape Cod, and Newport. |
| Honolulu | yes | yes | yes | yes | live | Production now shows Pearl Harbor, North Shore, circle-island, and east-side route lanes under the upgraded hero and metadata shell. |
| Tampa | yes | yes | yes | yes | live | Production now shows Clearwater, St. Pete, Busch Gardens, and Weeki Wachee route lanes under the upgraded hero and metadata shell. |
| Seattle | yes | yes | yes | yes | live | Deployed and smoke-passed on production with Olympic, Rainier, San Juan Islands, and Leavenworth lanes. Awaiting browser GUI sign-off only. |
| Phoenix | yes | yes | yes | yes | live | Deployed and smoke-passed on production with Sedona, Grand Canyon, Apache Trail, and Jerome lanes. Awaiting browser GUI sign-off only. |
| Salt Lake City | yes | yes | yes | yes | live | Deployed and smoke-passed on production with Park City, Great Salt Lake/Antelope Island, Provo Canyon, and Ogden lanes. Awaiting browser GUI sign-off only. |
| Washington, DC | yes | yes | yes | yes | live | Deployed and smoke-passed on production with Annapolis, Gettysburg, Shenandoah, and Baltimore lanes. Awaiting browser GUI sign-off only. |
| Denver | yes | yes | yes | yes | live | Deployed and smoke-passed on production with Boulder, Rocky Mountain National Park, Golden, and Estes Park lanes. Awaiting browser GUI sign-off only. |
| Las Vegas | yes | yes | yes | yes | live | Deployed and smoke-passed on production with Hoover Dam, Valley of Fire, Red Rock Canyon, and Mount Charleston lanes. Awaiting browser GUI sign-off only. |
| New Orleans | yes | yes | yes | yes | live | Deployed and smoke-passed on production with Cajun country, Baton Rouge, Honey Island Swamp, and River Road plantation lanes. Awaiting browser GUI sign-off only. |
| Chicago | yes | yes | yes | yes | live | Deployed and smoke-passed on production with Indiana Dunes, Milwaukee, Starved Rock, and Oak Park lanes. Awaiting browser GUI sign-off only. |
| Miami | yes | yes | yes | yes | live | Deployed and smoke-passed on production with Everglades, Key Biscayne, Vizcaya/Coconut Grove, and Biscayne Bay lanes. Awaiting browser GUI sign-off only. |
| San Francisco | partial | partial | yes | yes | live | Deployed and smoke-passed on production with Sausalito, Alcatraz/Bay, Napa Valley, and Muir Woods lanes. City-manifest/hero polish plus browser GUI sign-off still missing. |
| San Diego | yes | yes | yes | yes | fully-verified | Output markup, smoke/output verification, and real-browser visual confirmation are complete. Hero renders naturally and the top lanes for La Jolla, Balboa Park, Coronado, and Torrey Pines are visible without generic leftovers. |
| Atlanta | partial | partial | yes | yes | live | Deployed and smoke-passed on production with Stone Mountain, Savannah, North Georgia, and Lake Lanier lanes. City-manifest/hero polish plus browser GUI sign-off still missing. |
| Orlando | partial | partial | yes | yes | fully-verified | Output markup, smoke/output verification, and real-browser visual confirmation are complete. The hero renders naturally and the top lane set, including Universal rides commitment day, is visible without junk. |
| Austin | partial | partial | yes | yes | live | Deployed and smoke-passed on production with Fredericksburg, San Antonio, Enchanted Rock, and Lockhart lanes. City-manifest/hero polish plus browser GUI sign-off still missing. |
| Nashville | partial | partial | yes | yes | fully-verified | Output markup, smoke/output verification, and real-browser visual confirmation are complete. The hero renders naturally and the Jack Daniel's, Franklin, Percy Warner, and Lynchburg lanes lead cleanly. |

## Category Prep Queue

| Page | Hero Plan | Inventory Lead | Relevance Filter | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| /las-vegas/shows | inherit city hero | top “Top Las Vegas Shows Right Now” block | require show/residency intent over broad entertainment noise | live | Hero-plus-lead-inventory pattern is now live on production. |
| /las-vegas/residencies | inherit city hero | top “Top Las Vegas Residencies Right Now” block | require residency, headliner, magic, and comedy intent over broad entertainment noise | fully-verified | Output markup, smoke/output verification, and real-browser visual confirmation are complete. The Vegas hero renders naturally, residency lanes lead at the top, and the page stays conversion-oriented without junk. |
| /miami/beach-tours | inherit city hero | top “Top Miami Beach Tours Right Now” block | require beach, bay, Key Biscayne, and coastal-water intent over broad sightseeing noise | live | Production HTML now shows the inherited Miami hero, Top Miami Beach Tours Right Now, and clean fallback lanes for South Beach, Key Biscayne, Biscayne Bay, and sandbar/coastal half-day intent. Browser GUI sign-off is the only remaining gate. |

## Operating Notes

- The first five spotlight cities above were the first full gauntlet test cases.
- "Production Verify" here reflects production-output verification from live HTML plus image-response checks. A human browser pass is still the final visual sign-off standard.
- Do not add more homepage visibility shelves until the improving cities have visible hero confirmation.
- The first five-city upgrade batch is now fully verified in production, including external real-browser GUI confirmation.
- Current active batch: Honolulu + Tampa.
- Next implementation batch in flight: Scottsdale + San Antonio.
- Portland is now production-verified at the output level.
- The shared category-page pattern is now validated on New Orleans tour verticals: hero inheritance, top-placed tour grid, and strict relevance filtering.
- `/las-vegas/concerts` is now live at the production-output level with explicit concert/residency filter tokens instead of relying on broad entertainment matching.
- Day-trip pages now use the same anti-dead-opening pattern when a city manifest provides a hero image and category description.
- Day-trip quality passes should replace generic city-intent leftovers with real city-specific route lanes before a page is considered strong.
- Seattle and Phoenix day-trips are now deployed and smoke-passed on production; browser GUI sign-off is the only remaining gate.
- Salt Lake City, Washington, DC, Denver, Las Vegas, New Orleans, Chicago, and Miami day trips are now deployed and smoke-passed on production; browser GUI sign-off is the only remaining gate.
- Atlanta, Austin, and San Francisco day trips are now also deployed and smoke-passed on production; browser GUI sign-off is the only remaining gate.
- San Diego, Orlando, and Nashville day trips now also have external real-browser GUI confirmation and are fully verified.
- Las Vegas shows is now live at the production-output level with the same hero-plus-lead-inventory pattern used to fix weak category pages.
- New Orleans jazz tours is now also live at the production-output level with stronger music-specific fallback lanes and updated category copy.
- Orlando day trips now include the stronger Universal rides commitment lane and are fully verified through browser GUI confirmation.
- Las Vegas residencies is now fully verified with external browser confirmation and the same hero-plus-lead-inventory pattern used for Vegas shows and concerts.
- New Orleans ghost tours now also has external real-browser GUI confirmation and is fully verified.
- Miami beach tours is now live at the production-output level with South Beach, Key Biscayne, Biscayne Bay, and sandbar/coastal fallback lanes.
