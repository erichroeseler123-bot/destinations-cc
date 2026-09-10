const https = require('https');

const BASE_URL = 'https://www.welcometoneworleanstours.com';

const endpoints = [
  '/agent.json',
  '/api/v2/feeds/products',
  '/api/v2/feeds/locations',
  '/api/v2/feeds/pricing',
  '/api/v2/feeds/policies',
  '/api/v2/feeds/operating-windows',
];

function fetchJson(path) {
  return new Promise((resolve) => {
    https.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ path, status: res.statusCode, ok: res.statusCode === 200, json });
        } catch (err) {
          resolve({ path, status: res.statusCode, ok: false, error: err.message, raw: data.slice(0, 100) });
        }
      });
    }).on('error', (err) => {
      resolve({ path, status: 0, ok: false, error: err.message });
    });
  });
}

async function run() {
  console.log(`Checking Live Stage 2 Endpoints on ${BASE_URL}...\n`);
  let allPass = true;

  for (const ep of endpoints) {
    const res = await fetchJson(ep);
    if (res.ok) {
      console.log(`✅ [${res.status}] ${res.path}`);
      if (ep === '/agent.json') {
        console.log(`   - Spec: ${res.json.spec} v${res.json.version}`);
        console.log(`   - DCC ID: ${res.json.dcc_id}`);
        console.log(`   - Feeds declared: ${Object.keys(res.json.directory).length}`);
      } else if (ep === '/api/v2/feeds/products') {
        console.log(`   - Products count: ${res.json.products?.length}`);
        console.log(`   - Sample SKU: ${res.json.products?.[0]?.sku}`);
      } else if (ep === '/api/v2/feeds/locations') {
        console.log(`   - Locations count: ${res.json.locations?.length}`);
      } else if (ep === '/api/v2/feeds/pricing') {
        console.log(`   - Pricing count: ${res.json.items?.length}`);
        console.log(`   - Provenance source: ${res.json.items?.[0]?.provenance?.source}`);
      } else if (ep === '/api/v2/feeds/policies') {
        console.log(`   - Policies count: ${res.json.policies?.length}`);
      } else if (ep === '/api/v2/feeds/operating-windows') {
        console.log(`   - Schedules count: ${res.json.operating_schedules?.length}`);
      }
    } else {
      allPass = false;
      console.error(`❌ [${res.status}] ${res.path} - ${res.error || 'Failed'}`);
      if (res.raw) console.error(`   Raw: ${res.raw}`);
    }
  }

  console.log(`\nOverall Live Verification: ${allPass ? 'ALL PASS ✅' : 'FAIL ❌'}`);
  if (!allPass) process.exitCode = 1;
}

run();
