async function verify() {
  const urls = [
    'https://www.welcometoneworleanstours.com/compare/natchez-vs-city-of-new-orleans-riverboat',
    'https://www.welcometoneworleanstours.com/compare/whitney-vs-oak-alley',
    'https://www.welcometoneworleanstours.com/garden-district-tours',
    'https://www.welcometoneworleanstours.com/swamp-tours',
    'https://www.welcometoneworleanstours.com/guides/best-swamp-tour-with-transportation',
    'https://www.welcometoneworleanstours.com/new-orleans-plantation-and-swamp-tour',
    'https://www.welcometoneworleanstours.com/guides/new-orleans-plantation-and-swamp-tour',
    'https://www.welcometoneworleanstours.com/guides/oak-alley-vs-whitney-plantation-vs-swamp-tour',
    'https://www.welcometoneworleanstours.com/compare/covered-swamp-boat-vs-airboat',
    'https://www.welcometoneworleanstours.com/compare/small-vs-large-airboat'
  ];

  console.log('--- Checking Live Content ---');
  for (const url of urls) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log(`URL: ${url}`);
      console.log(`  Status: ${res.status}`);
      if (url.includes('natchez-vs-city-of-new-orleans-riverboat')) {
        console.log('  Includes "Key Comparison: Steamboat NATCHEZ vs Riverboat CITY of NEW ORLEANS":', text.includes('Key Comparison: Steamboat NATCHEZ vs Riverboat CITY of NEW ORLEANS'));
        console.log('  Includes "$44.00 flat rate":', text.includes('$44.00 flat rate'));
        console.log('  Includes "$25.75 flat rate":', text.includes('$25.75 flat rate') || text.includes('$25.75'));
        console.log('  Includes "strictly non-refundable":', text.includes('strictly non-refundable') || text.includes('Non-refundable'));
      }
      if (url.includes('whitney-vs-oak-alley')) {
        console.log('  Includes "Key Comparison: Whitney Plantation vs Oak Alley Plantation":', text.includes('Key Comparison: Whitney Plantation vs Oak Alley Plantation'));
        console.log('  Includes "$89.00 flat rate":', text.includes('$89.00 flat rate'));
        console.log('  Includes "400 Toulouse St":', text.includes('400 Toulouse St'));
        console.log('  Includes "Non-refundable; all sales final per Gray Line":', text.includes('Non-refundable; all sales final per Gray Line'));
        console.log('  Does NOT promise 24h refund for Gray Line:', !text.includes('Full refund with 24 hours notice'));
      }
      if (url.includes('swamp-tours') && !url.includes('best-swamp')) {
        console.log('  Gray Line Covered Boat Flat rate: $65:', text.includes('Operated by <!-- -->Gray Line</p><p class="mb-3 text-base font-bold text-[#f6f1e8]">Flat rate: $65'));
        console.log('  Gray Line Small Airboat Flat rate: $119:', text.includes('Operated by <!-- -->Gray Line</p><p class="mb-3 text-base font-bold text-[#f6f1e8]">Flat rate: $119'));
        console.log('  Gray Line Large Airboat Flat rate: $90:', text.includes('Operated by <!-- -->Gray Line</p><p class="mb-3 text-base font-bold text-[#f6f1e8]">Flat rate: $90'));
        console.log('  Gray Line does not have old From $59 / From $89:', !text.includes('From $59') && !text.includes('From $89'));
      }
      if (url.includes('compare/small-vs-large-airboat')) {
        console.log('  Includes "Non-refundable; all sales final per Gray Line":', text.includes('Non-refundable; all sales final per Gray Line'));
        console.log('  Does NOT promise 24h refund for Gray Line:', !text.includes('Full refund with 24 hours notice'));
      }
      if (url.includes('compare/covered-swamp-boat-vs-airboat')) {
        console.log('  Includes Ragin Cajun self-drive rates ($65 / $85 / $95):', text.includes('$65 (large 16-pax)') && text.includes('$85 (medium 10-pax)') && text.includes('$95 (small 6–10 pax)'));
        console.log('  Includes Ragin Cajun shuttle rates ($90 / $110 / $120):', text.includes('$90 / $110 / $120 with round-trip shuttle'));
        console.log('  Includes 24 hours cancellation notice:', text.includes('24 hours notice prior to departure'));
      }
      if (url.includes('garden-district-tours')) {
        console.log('  Includes "See City Coach Tours (Featuring Garden District)":', text.includes('See City Coach Tours (Featuring Garden District)'));
      }
      console.log('  Includes GA4 G-S6JEJVWVDT:', text.includes('G-S6JEJVWVDT'));
    } catch (e) {
      console.error(`  Error fetching ${url}:`, e.message);
    }
  }

  console.log('\n--- Checking Apex Redirect ---');
  const apexUrls = [
    'http://welcometoneworleanstours.com/',
    'https://welcometoneworleanstours.com/'
  ];
  for (const apex of apexUrls) {
    try {
      const res = await fetch(apex, { redirect: 'manual' });
      console.log(`Apex URL: ${apex}`);
      console.log(`  Status: ${res.status}`);
      console.log(`  Location header: ${res.headers.get('location')}`);
    } catch (e) {
      console.error(`  Error fetching ${apex}:`, e.message);
    }
  }
}

verify();
