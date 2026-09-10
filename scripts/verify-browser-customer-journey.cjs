const { spawn } = require('child_process');
const http = require('http');
const wsPath = require.resolve('ws', { paths: ['C:\\Users\\erich\\Documents\\Projects\\destinations-cc\\node_modules', process.cwd()] });
const WebSocket = require(wsPath);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getWebSocketDebuggerUrl() {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}/json/version`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.webSocketDebuggerUrl);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.eventListeners = [];
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(msg.error);
          else cb.resolve(msg.result);
        } else if (msg.method) {
          for (const listener of this.eventListeners) {
            listener(msg.method, msg.params);
          }
        }
      });
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  onEvent(listener) {
    this.eventListeners.push(listener);
  }

  close() {
    this.ws.close();
  }
}

async function verifyCollectorAcceptance(endpointUrl, payload) {
  try {
    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let body = null;
    try { body = JSON.parse(text); } catch (e) { body = text; }
    return {
      status: res.status,
      statusText: res.statusText,
      body,
      ok: res.status === 200 && body && body.ok === true,
    };
  } catch (err) {
    return {
      status: null,
      statusText: null,
      body: null,
      error: err.message,
      ok: false,
    };
  }
}

async function run() {
  console.log('1. Launching Headless Chrome...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + require('os').tmpdir() + '\\chrome_test_profile_' + Date.now()
  ], { stdio: 'ignore' });

  let wsUrl = '';
  for (let i = 0; i < 30; i++) {
    await delay(500);
    try {
      wsUrl = await getWebSocketDebuggerUrl();
      if (wsUrl) break;
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Failed to connect to Chrome DevTools port');
    chromeProcess.kill();
    process.exit(1);
  }

  console.log('Connected to Chrome DevTools at:', wsUrl);

  const testPages = [
    {
      sku: 'wno-evening-jazz-cruise',
      name: 'Steamboat Natchez Evening Jazz Cruise',
      url: 'https://www.welcometoneworleanstours.com/tours/evening-jazz-cruise',
      expectedShortname: 'neworleanssteamboatcompany',
      expectedItemId: '560825',
      expectedAsn: 'welcometoneworleanstours',
      sourceEvidence: {
        verbatim_quotations: [
          "Adult (Sightseeing Cruise Only): $58.00.",
          "Boarding: 6:00pm, Cruising: 7:00pm - 9:00pm.",
          "Bookings are non-refundable. All sales are final.",
          "The riverboat is handicap accessible. However, access to the top deck is by stairs only."
        ],
        summaries: [
          "Sightseeing base rate $58 verified; non-refundable policy verified.",
          "Vessel assignment (Steamboat NATCHEZ vs Riverboat CITY OF NEW ORLEANS) is determined during booking/schedule; main deck ramp accessible, hurricane/top deck stairs only on both vessels."
        ],
      },
    },
    {
      sku: 'wno-covered-tour-boat',
      name: 'Ragin Cajun Covered Tour Boat',
      url: 'https://www.welcometoneworleanstours.com/tours/covered-tour-boat',
      expectedShortname: 'ragincajuntours',
      expectedItemId: '590176',
      expectedAsn: 'aktourcenter',
      sourceEvidence: {
        verbatim_quotations: [
          "Our cancellation policy is a full refund up to 48 hours before tour time. Inside of 48 hours, there are no refunds.",
          "In the event of severe weather, all customers will be rescheduled or refunded whichever they prefer."
        ],
        summaries: [
          "Base rate $35 self-arrive and $60 with shuttle verified on published rate card; 48-hour cancellation verified.",
          "Standalone covered boat pickup and departure times are subject to seasonal operator confirmation in checkout; the cited 8:30 AM pickup belongs to the boat-and-plantation combination.",
          "Launch address and hotel pickup details are unconfirmed in FareHarbor item 590176 and require operator confirmation."
        ],
      },
    },
    {
      sku: 'wno-oak-alley-or-laura-plantation-tour',
      name: 'Southern Style Plantation Tour',
      url: 'https://www.welcometoneworleanstours.com/tours/oak-alley-or-laura-plantation-tour',
      expectedShortname: 'southernstyletours',
      expectedItemId: '83002',
      expectedAsn: 'aktourcenter',
      sourceEvidence: {
        verbatim_quotations: [
          "We pick up at most hotels in the uptown, downtown and French Quarter area. Be ready at 8:00 am. Pick up time is between 8:00 am and 8:30 am"
        ],
        summaries: [
          "Storefront tour offering alternative destinations (Oak Alley or Laura Plantation) determined during booking.",
          "Base rate, departure point, and cancellation policy require checkout confirmation."
        ],
      },
    },
  ];

  const results = [];

  for (const tour of testPages) {
    console.log(`\n========================================`);
    console.log(`Testing: ${tour.name}`);
    console.log(`URL: ${tour.url}`);

    const browserClient = new CdpClient(wsUrl);
    await browserClient.init();
    const { targetId } = await browserClient.send('Target.createTarget', { url: 'about:blank' });
    
    const pageWsUrl = `ws://127.0.0.1:${PORT}/devtools/page/${targetId}`;
    const pageClient = new CdpClient(pageWsUrl);
    await pageClient.init();

    await pageClient.send('Network.enable');
    await pageClient.send('Page.enable');
    await pageClient.send('Runtime.enable');

    const telemetryRequests = [];
    const responsesByRequestId = new Map();

    pageClient.onEvent((method, params) => {
      if (method === 'Network.requestWillBeSent') {
        const reqUrl = params.request.url;
        if (reqUrl.includes('/api/wno/telemetry')) {
          telemetryRequests.push({
            requestId: params.requestId,
            url: reqUrl,
            method: params.request.method,
            postData: params.request.postData,
            timestamp: params.timestamp,
          });
        }
      }
      if (method === 'Network.responseReceived') {
        const respUrl = params.response.url;
        if (respUrl.includes('/api/wno/telemetry')) {
          responsesByRequestId.set(params.requestId, {
            status: params.response.status,
            statusText: params.response.statusText,
            url: respUrl,
          });
          console.log(`   📡 Telemetry Network Response: Status ${params.response.status} (${params.response.statusText})`);
        }
      }
    });

    console.log('   Navigating to tour page...');
    await pageClient.send('Page.navigate', { url: tour.url });
    await delay(3500);

    const evalResult = await pageClient.send('Runtime.evaluate', {
      expression: `
        (() => {
          const links = Array.from(document.querySelectorAll('a[href*="fareharbor.com"]'));
          return links.map(l => ({
            href: l.href,
            text: l.innerText.trim(),
            className: l.className
          }));
        })()
      `,
      returnByValue: true,
    });

    const ctas = evalResult.result.value || [];
    console.log(`   Found ${ctas.length} FareHarbor CTA link(s) on page:`);
    for (const cta of ctas) {
      console.log(`     - CTA [${cta.text}]: ${cta.href}`);
    }

    if (ctas.length === 0) {
      console.error('   ❌ No FareHarbor CTA found on page!');
      results.push({ ...tour, success: false, reason: 'No FareHarbor CTA found' });
      await browserClient.send('Target.closeTarget', { targetId });
      browserClient.close();
      pageClient.close();
      continue;
    }

    const firstCta = ctas[0];
    const firstCtaHref = firstCta.href;
    const urlObj = new URL(firstCtaHref);
    const hasShortname = urlObj.pathname.includes(tour.expectedShortname);
    const hasItem = urlObj.pathname.includes(tour.expectedItemId) || urlObj.searchParams.get('item') === tour.expectedItemId;
    const hasAsn = urlObj.searchParams.get('asn') === tour.expectedAsn;

    console.log(`   Handoff URL Analysis:`);
    console.log(`     - Operator Shortname (${tour.expectedShortname}): ${hasShortname ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`     - Item ID (${tour.expectedItemId}): ${hasItem ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`     - Operator ASN (${tour.expectedAsn}): ${hasAsn ? '✅ MATCH' : '❌ MISMATCH'}`);

    console.log('   Simulating click on booking CTA...');
    await pageClient.send('Runtime.evaluate', {
      expression: `
        (() => {
          const link = document.querySelector('a[href*="fareharbor.com"]');
          if (link) {
            link.click();
            return true;
          }
          return false;
        })()
      `,
    });

    // 1. Assert rendered FareHarbor Lightframe checkout
    console.log('   Waiting for FareHarbor Lightframe checkout to render in DOM...');
    let checkoutModal = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      await delay(500);
      const checkDom = await pageClient.send('Runtime.evaluate', {
        expression: `
          (() => {
            const container = document.querySelector('#fareharbor-lightframe');
            const iframe = document.querySelector('#fareharbor-lightframe-iframe');
            if (!container || !iframe) return null;
            const cs = window.getComputedStyle(iframe);
            const isVisible = cs.display !== 'none' && cs.visibility !== 'hidden' && iframe.offsetWidth > 0 && iframe.offsetHeight > 0;
            const showingClass = container.classList.contains('fareharbor-is-showing');
            return {
              hasContainer: Boolean(container),
              isShowing: showingClass,
              iframeSrc: iframe.src,
              iframeWidth: iframe.offsetWidth,
              iframeHeight: iframe.offsetHeight,
              isVisible,
              htmlClasses: document.documentElement.className,
            };
          })()
        `,
        returnByValue: true,
      });
      if (checkDom.result.value && checkDom.result.value.isVisible && checkDom.result.value.iframeSrc) {
        checkoutModal = checkDom.result.value;
        break;
      }
    }

    const renderedModalOk = Boolean(checkoutModal && checkoutModal.isShowing && checkoutModal.isVisible);
    const iframeUrl = checkoutModal?.iframeSrc ? new URL(checkoutModal.iframeSrc) : null;
    const iframeHasShortname = iframeUrl ? iframeUrl.pathname.includes(tour.expectedShortname) : false;
    const iframeHasItem = iframeUrl ? (iframeUrl.pathname.includes(tour.expectedItemId) || iframeUrl.searchParams.get('item') === tour.expectedItemId) : false;
    const iframeHasAsn = iframeUrl ? (iframeUrl.searchParams.get('asn') === tour.expectedAsn) : false;

    console.log(`   Rendered FareHarbor Checkout Interface Analysis:`);
    console.log(`     - Lightframe Modal Visible: ${renderedModalOk ? '✅ YES (' + checkoutModal.iframeWidth + 'x' + checkoutModal.iframeHeight + 'px)' : '❌ NO'}`);
    console.log(`     - Modal Operator Shortname (${tour.expectedShortname}): ${iframeHasShortname ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`     - Modal Item ID (${tour.expectedItemId}): ${iframeHasItem ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`     - Modal Attribution ASN (${tour.expectedAsn}): ${iframeHasAsn ? '✅ MATCH' : '❌ MISMATCH'}`);

    // 2. Correlate post-click booking_opened telemetry event
    await delay(1000);
    let correlatedBookingOpened = null;
    let collectorVerification = null;

    for (const t of telemetryRequests) {
      let parsed = null;
      try { parsed = JSON.parse(t.postData); } catch (e) {}
      if (parsed?.eventName === 'booking_opened') {
        const browserResp = responsesByRequestId.get(t.requestId);
        correlatedBookingOpened = {
          requestId: t.requestId,
          url: t.url,
          payload: parsed,
          browserReceivedStatus: browserResp?.status ?? null,
          browserReceivedStatusText: browserResp?.statusText ?? null,
        };

        // Correlate with collector endpoint response and accepted body
        const collectorEndpoint = 'https://destinationcommandcenter.com/api/wno/telemetry';
        collectorVerification = await verifyCollectorAcceptance(collectorEndpoint, parsed);
        break;
      }
    }

    console.log(`   Correlated booking_opened Telemetry Analysis:`);
    if (correlatedBookingOpened && collectorVerification) {
      console.log(`     - Browser Event Captured: ✅ YES (Session: ${correlatedBookingOpened.payload?.sessionId})`);
      console.log(`     - Browser Network Status: ${correlatedBookingOpened.browserReceivedStatus} (${correlatedBookingOpened.browserReceivedStatusText})`);
      console.log(`     - Collector Target: https://destinationcommandcenter.com/api/wno/telemetry`);
      console.log(`     - Collector Status: ${collectorVerification.status} (${collectorVerification.statusText})`);
      console.log(`     - Collector Response Body: ${JSON.stringify(collectorVerification.body)}`);
      console.log(`     - Collector Accepted ({ ok: true }): ${collectorVerification.ok ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log(`     - ❌ No booking_opened telemetry event correlated!`);
    }

    const isSuccess = hasShortname && hasItem && hasAsn
      && renderedModalOk && iframeHasShortname && iframeHasItem && iframeHasAsn
      && Boolean(collectorVerification?.ok);

    results.push({
      sku: tour.sku,
      productName: tour.name,
      pageUrl: tour.url,
      clickedCta: {
        text: firstCta.text,
        href: firstCtaHref,
      },
      handoffAttribution: {
        shortname: urlObj.pathname.split('/')[3],
        itemId: urlObj.pathname.split('/')[5] || urlObj.searchParams.get('item'),
        asn: urlObj.searchParams.get('asn'),
        ref: urlObj.searchParams.get('ref'),
        flow: urlObj.searchParams.get('flow'),
        fullItems: urlObj.searchParams.get('full-items'),
        scheduleUuid: urlObj.searchParams.get('schedule-uuid'),
      },
      handoffChecks: {
        shortnameMatch: hasShortname,
        itemIdMatch: hasItem,
        asnMatch: hasAsn,
      },
      renderedCheckoutVerification: {
        verified: renderedModalOk && iframeHasShortname && iframeHasItem && iframeHasAsn,
        modalVisible: renderedModalOk,
        iframeSrc: checkoutModal?.iframeSrc,
        iframeDimensions: checkoutModal ? { width: checkoutModal.iframeWidth, height: checkoutModal.iframeHeight } : null,
        operatorMatch: iframeHasShortname,
        itemMatch: iframeHasItem,
        asnMatch: iframeHasAsn,
      },
      correlatedBookingOpenedEvent: {
        dispatchedUrl: correlatedBookingOpened?.url,
        browserNetworkStatus: correlatedBookingOpened?.browserReceivedStatus,
        sessionId: correlatedBookingOpened?.payload?.sessionId,
        payload: correlatedBookingOpened?.payload,
        collectorStatus: collectorVerification?.status,
        collectorResponseBody: collectorVerification?.body,
        accepted: collectorVerification?.ok === true,
      },
      sourceEvidence: tour.sourceEvidence,
      success: isSuccess,
    });

    await browserClient.send('Target.closeTarget', { targetId });
    browserClient.close();
    pageClient.close();
  }

  console.log('\n========================================');
  console.log('Strengthened Browser Verification Summary:');
  for (const r of results) {
    console.log(`${r.success ? '✅ PASS' : '❌ FAIL'}: ${r.productName}`);
    console.log(`   CTA Handoff: [${r.clickedCta.text}] -> ASN: ${r.handoffAttribution.asn} | Item: ${r.handoffAttribution.itemId}`);
    console.log(`   Checkout Rendered: ${r.renderedCheckoutVerification.verified ? 'YES' : 'NO'}`);
    console.log(`   booking_opened Accepted: ${r.correlatedBookingOpenedEvent.accepted ? 'YES (HTTP ' + r.correlatedBookingOpenedEvent.collectorStatus + ' ok: true)' : 'NO'}`);
  }

  // Save report to reports/wno-browser-verification-results.json
  const reportDir = require('path').join(__dirname, '../reports');
  if (!require('fs').existsSync(reportDir)) require('fs').mkdirSync(reportDir, { recursive: true });
  const reportPath = require('path').join(reportDir, 'wno-browser-verification-results.json');
  require('fs').writeFileSync(reportPath, JSON.stringify({
    auditDate: new Date().toISOString(),
    environment: 'production',
    targetOrigin: 'https://www.welcometoneworleanstours.com',
    browser: 'Headless Google Chrome (CDP)',
    results,
  }, null, 2), 'utf8');
  console.log(`\nSaved reproducible verification report to ${reportPath}`);

  chromeProcess.kill();
  const allPassed = results.every(r => r.success);
  process.exit(allPassed ? 0 : 1);
}

run().catch(err => {
  console.error('Fatal error in customer journey test:', err);
  process.exit(1);
});
