const https = require('https');

const BASE_URL = 'https://www.welcometoneworleanstours.com';

https.get(`${BASE_URL}/tours/covered-tour-boat`, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status for /tours/covered-tour-boat:', res.statusCode);
    
    // Check for FareHarbor Lightframe trigger or booking link
    const hasLightframeLoader = data.includes('fareharbor.com/embeds/api/v1/');
    const hasRagincajun = data.includes('ragincajuntours');
    const hasAsn = data.includes('aktourcenter');
    const hasItemId = data.includes('590176');
    
    console.log('- Preloaded FareHarbor script:', hasLightframeLoader ? 'YES' : 'NO');
    console.log('- Contains operator shortname (ragincajuntours):', hasRagincajun ? 'YES' : 'NO');
    console.log('- Contains expected ASN (aktourcenter):', hasAsn ? 'YES' : 'NO');
    console.log('- Contains Item ID (590176):', hasItemId ? 'YES' : 'NO');
    
    if (res.statusCode === 200 && hasLightframeLoader && hasRagincajun && hasAsn) {
      console.log('\nFareHarbor Live Booking Handoff Verification: PASS ✅');
    } else {
      console.log('\nFareHarbor Live Booking Handoff Verification: INCOMPLETE/FAIL ❌');
    }
  });
}).on('error', (err) => {
  console.error('Error fetching tour detail:', err.message);
});
