const https = require('https');

const BASE_URL = process.env.VERIFY_BASE_URL || 'https://www.welcometoneworleanstours.com';

function fetchJson(path) {
  return new Promise((resolve) => {
    https.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function verify() {
  console.log(`Auditing Factual Reality of Feeds on ${BASE_URL}...\n`);

  const [agent, products, pricing, policies, schedules, locations] = await Promise.all([
    fetchJson('/agent.json'),
    fetchJson('/api/v2/feeds/products'),
    fetchJson('/api/v2/feeds/pricing'),
    fetchJson('/api/v2/feeds/policies'),
    fetchJson('/api/v2/feeds/operating-windows'),
    fetchJson('/api/v2/feeds/locations'),
  ]);

  // 1. Site ID Consistency
  console.log('1. Checking Site ID Reconciliation:');
  console.log('   - /agent.json dcc_id:', agent?.dcc_id);
  console.log('   - products feed source_site_id:', products?.source_site_id);
  console.log('   - pricing feed source_site_id:', pricing?.source_site_id);
  console.log('   - policies feed source_site_id:', policies?.source_site_id);
  console.log('   - operating-windows feed source_site_id:', schedules?.source_site_id);
  const idsMatch = 
    agent?.dcc_id === 'dcc:site:wno-tours' &&
    products?.source_site_id === 'dcc:site:wno-tours' &&
    pricing?.source_site_id === 'dcc:site:wno-tours' &&
    policies?.source_site_id === 'dcc:site:wno-tours' &&
    schedules?.source_site_id === 'dcc:site:wno-tours';
  console.log('   => Site ID Reconciliation:', idsMatch ? 'PASS ✅' : 'FAIL ❌');

  // 2. Evening Jazz Cruise
  console.log('\n2. Checking Evening Jazz Cruise Pilot Offering:');
  const jazzPrice = pricing?.items?.find((i) => i.sku === 'wno-evening-jazz-cruise');
  const jazzSched = schedules?.operating_schedules?.find((s) => s.sku === 'wno-evening-jazz-cruise');
  const jazzProd = products?.products?.find((p) => p.sku === 'wno-evening-jazz-cruise');
  const jazzPol = policies?.policies?.find((p) => p.sku === 'wno-evening-jazz-cruise');
  console.log('   - Price base rate:', jazzPrice?.base_rate);
  console.log('   - Wheelchair accessible:', jazzPol?.restrictions?.wheelchair_accessible);
  console.log('   - Meeting Hub:', jazzProd?.locations?.meeting_hub);
  const jazzOk = 
    jazzPrice?.base_rate === 58 &&
    jazzPol?.restrictions?.wheelchair_accessible === 'requires_operator_confirmation' &&
    jazzProd?.locations?.meeting_hub === 'dcc:poi:nola:toulouse-street-wharf';
  console.log('   => Evening Jazz Cruise Verification:', jazzOk ? 'PASS ✅' : 'FAIL ❌');

  // 3. Covered Tour Boat
  console.log('\n3. Checking Covered Tour Boat Pilot Offering:');
  const boatPrice = pricing?.items?.find((i) => i.sku === 'wno-covered-tour-boat');
  const boatSched = schedules?.operating_schedules?.find((s) => s.sku === 'wno-covered-tour-boat');
  const boatProd = products?.products?.find((p) => p.sku === 'wno-covered-tour-boat');
  console.log('   - Price base rate:', boatPrice?.base_rate, '| with transport:', boatPrice?.rate_with_transportation);
  console.log('   - Meeting Hub:', boatProd?.locations?.meeting_hub);
  console.log('   - Pickup Mode:', boatProd?.locations?.pickup_mode);
  const boatOk = 
    boatPrice?.base_rate === 35 &&
    boatPrice?.rate_with_transportation === 60 &&
    boatProd?.locations?.meeting_hub === undefined &&
    boatProd?.locations?.pickup_mode === 'requires_operator_confirmation';
  console.log('   => Covered Tour Boat Verification:', boatOk ? 'PASS ✅' : 'FAIL ❌');

  // 4. Oak Alley Plantation
  console.log('\n4. Checking Oak Alley Plantation Pilot Offering:');
  const oakPrice = pricing?.items?.find((i) => i.sku === 'wno-oak-alley-or-laura-plantation-tour');
  const oakSched = schedules?.operating_schedules?.find((s) => s.sku === 'wno-oak-alley-or-laura-plantation-tour');
  const oakProd = products?.products?.find((p) => p.sku === 'wno-oak-alley-or-laura-plantation-tour');
  console.log('   - Pricing verification status:', oakPrice?.verification_status);
  console.log('   - Schedule verification status:', oakSched?.verification_status);
  console.log('   - Possible destination hubs:', oakProd?.locations?.possible_destinations);
  const oakOk = 
    oakPrice?.verification_status === 'requires_operator_confirmation' &&
    oakSched?.verification_status === 'requires_operator_confirmation' &&
    Array.isArray(oakProd?.locations?.possible_destinations) &&
    oakProd?.locations?.possible_destinations.includes('dcc:poi:nola:oak-alley-plantation-grounds') &&
    oakProd?.locations?.possible_destinations.includes('dcc:poi:nola:laura-plantation-grounds') &&
    oakProd?.locations?.destination_selection === 'determined_during_booking' &&
    oakProd?.locations?.meeting_hub === undefined;
  console.log('   => Oak Alley Plantation Verification:', oakOk ? 'PASS ✅' : 'FAIL ❌');

  const allPassed = idsMatch && jazzOk && boatOk && oakOk;
  console.log(`\nOVERALL VERIFICATION: ${allPassed ? 'ALL PASS ✅' : 'INCOMPLETE/DEPLOYING ⏳'}`);
  process.exitCode = allPassed ? 0 : 1;
}

verify();
