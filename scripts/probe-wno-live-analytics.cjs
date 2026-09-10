const https = require('https');

https.get('https://www.welcometoneworleanstours.com', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    
    // 1. Google Site Verification
    const gsvMatch = data.match(/name="google-site-verification"\s+content="([^"]+)"/i);
    console.log('Google Site Verification:', gsvMatch ? gsvMatch[1] : 'NOT FOUND (env var unset)');

    // 2. GA4 / GTM / gtag
    const gaMatch = data.match(/googletagmanager\.com|gtag\(|G-[A-Z0-9]{8,12}/g);
    console.log('GA4 / GTM / gtag:', gaMatch ? gaMatch : 'NOT FOUND in client DOM bundle');

    // 3. First-party Telemetry
    const telemetryMatch = data.includes('api/wno/telemetry') || data.includes('wno_funnel');
    console.log('First-party WnoFunnelTracker in build:', telemetryMatch ? 'YES' : 'Bundled in JS chunks');

    // 4. FareHarbor Lightframe loader
    const fhMatch = data.includes('fareharbor.com/embeds/api/v1/');
    console.log('FareHarbor Lightframe script preloaded:', fhMatch ? 'YES' : 'NO');
  });
}).on('error', (err) => {
  console.error('Fetch error:', err.message);
});
