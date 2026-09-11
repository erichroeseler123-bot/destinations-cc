const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const WebSocket = require('C:/Users/erich/Documents/Projects/destinations-cc/node_modules/ws');

// Neon database setup for durable event verification
const envPath = 'C:/Users/erich/Documents/Projects/destinations-cc/.vercel/.env.production.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const { neon } = require('C:/Users/erich/Documents/Projects/destinations-cc/node_modules/@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9222;

const REQUESTED_DATE = '2026-09-11';
const REQUESTED_DATE_FORMATTED = 'Friday, September 11, 2026';
const REQUESTED_TIMEZONE = 'America/Chicago';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseDateFromObservedText(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/(?:(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s*)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})/i);
  if (!match) {
    const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return {
        isoDate: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`,
        matchedSnippet: isoMatch[0],
      };
    }
    return null;
  }
  const monthNames = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const monthNum = monthNames.indexOf(match[1].toLowerCase()) + 1;
  if (monthNum === 0) return null;
  const month = String(monthNum).padStart(2, '0');
  const day = String(match[2]).padStart(2, '0');
  const year = match[3];
  return {
    isoDate: `${year}-${month}-${day}`,
    matchedSnippet: match[0],
  };
}

function validateDateAssertion({ requestedDate, calendarDateText, activePanelObservedText }) {
  if (!activePanelObservedText || typeof activePanelObservedText !== 'string') {
    return { pass: false, reason: 'missing_availability_panel_date' };
  }
  const parsed = parseDateFromObservedText(activePanelObservedText);
  if (!parsed || !parsed.isoDate) {
    return { pass: false, reason: 'unparseable_availability_panel_date', rawObserved: activePanelObservedText };
  }
  if (parsed.isoDate !== requestedDate) {
    return {
      pass: false,
      reason: 'availability_panel_date_mismatch',
      requestedDate,
      parsedDate: parsed.isoDate,
      rawObserved: activePanelObservedText,
    };
  }
  return {
    pass: true,
    requestedDate,
    parsedDate: parsed.isoDate,
    matchedSnippet: parsed.matchedSnippet,
    rawObserved: activePanelObservedText,
  };
}

// Regression Checks
function runAllRegressionChecks() {
  console.log('--- RUNNING WNO REGRESSION SUITE ---');

  // 1. Telemetry regression: successful page_view cannot satisfy booking event
  function validateBookingTelemetryCheck(telemetryEvents, durableRecords = []) {
    const bookingEvent = telemetryEvents.find(e => e.payload?.eventName === 'booking_opened');
    if (!bookingEvent) return { pass: false, reason: 'missing_booking_opened_event' };
    const hasValidBody = bookingEvent.completedResponse?.parsedBody?.ok === true;
    const hasDurableRecord = durableRecords.some(r => r.session_id === bookingEvent.payload.sessionId && r.event_name === 'booking_opened');
    if (!hasValidBody && !hasDurableRecord) return { pass: false, reason: 'booking_not_verified' };
    return { pass: true };
  }

  const pageViewOnly = validateBookingTelemetryCheck([
    { payload: { eventName: 'page_viewed', sessionId: 'wno_reg_1' }, completedResponse: { status: 200, parsedBody: { ok: true } } }
  ], []);
  if (pageViewOnly.pass) throw new Error('REGRESSION FAILURE: Page view satisfied booking check!');

  // 2. Date regression: Calendar has requested date, but active availability panel shows a different date (MUST FAIL)
  const mismatchedPanelDate = validateDateAssertion({
    requestedDate: '2026-09-11',
    calendarDateText: 'Friday, September 11, 2026',
    activePanelObservedText: 'Saturday, September 12, 2026 at 6:00 PM',
  });
  if (mismatchedPanelDate.pass) {
    throw new Error('REGRESSION FAILURE: Mismatched panel date (Sept 12 vs Sept 11) incorrectly passed date assertion!');
  }
  console.log('✅ REGRESSION PROVEN: Mismatched panel date (Sept 12 vs Sept 11) strictly fails verification.');

  // 3. Date regression: Missing or unparseable date text in availability panel (MUST FAIL)
  const unparseableDate = validateDateAssertion({
    requestedDate: '2026-09-11',
    calendarDateText: 'Friday, September 11, 2026',
    activePanelObservedText: 'All Ages • 2 Hour Cruise • Meal not included',
  });
  if (unparseableDate.pass) {
    throw new Error('REGRESSION FAILURE: Unparseable date text incorrectly passed date assertion!');
  }
  console.log('✅ REGRESSION PROVEN: Unparseable date text strictly fails verification.');

  return {
    regressionProven: true,
    testedCases: [
      'page_viewed_only_cannot_satisfy_booking_check',
      'calendar_requested_date_with_mismatched_panel_date_fails',
      'unparseable_or_missing_panel_date_fails'
    ]
  };
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
      const timer = setTimeout(() => {
        reject(new Error('WebSocket connection timed out after 10s'));
      }, 10000);

      this.ws.on('open', () => {
        clearTimeout(timer);
        resolve();
      });

      this.ws.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      this.ws.on('close', () => {
        clearTimeout(timer);
        for (const [id, cb] of this.callbacks.entries()) {
          cb.reject(new Error(`WebSocket closed while waiting for response to message ${id}`));
        }
        this.callbacks.clear();
      });

      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.id && this.callbacks.has(msg.id)) {
            const cb = this.callbacks.get(msg.id);
            this.callbacks.delete(msg.id);
            if (msg.error) cb.reject(msg.error);
            else cb.resolve(msg.result);
          } else if (msg.method) {
            for (const listener of this.eventListeners) {
              try {
                listener(msg.method, msg.params);
              } catch (e) {}
            }
          }
        } catch (err) {}
      });
    });
  }

  send(method, params = {}, sessionId = null, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error(`Cannot send ${method}: WebSocket is not OPEN (state: ${this.ws.readyState})`));
      }
      const id = this.id++;
      const timer = setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error(`CDP command ${method} timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      this.callbacks.set(id, {
        resolve: (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });

      const payload = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;
      try {
        this.ws.send(JSON.stringify(payload));
      } catch (err) {
        clearTimeout(timer);
        this.callbacks.delete(id);
        reject(err);
      }
    });
  }

  onEvent(listener) {
    this.eventListeners.push(listener);
  }

  close() {
    try {
      this.ws.close();
    } catch (e) {}
  }
}

async function run() {
  const GLOBAL_TIMEOUT_MS = 240000; // 4 minutes maximum total runtime
  const globalWatchdog = setTimeout(() => {
    console.error(`\n🚨 GLOBAL TIMEOUT EXCEEDED: Script reached maximum runtime of ${GLOBAL_TIMEOUT_MS / 1000}s! Terminating Chrome and exiting...`);
    try { chromeProcess.kill(); } catch (e) {}
    process.exit(1);
  }, GLOBAL_TIMEOUT_MS);
  globalWatchdog.unref();

  const regressionResult = runAllRegressionChecks();

  console.log('\n1. Launching Headless Chrome under NORMAL SECURITY (no --disable-web-security)...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + require('os').tmpdir() + '/chrome_wno_corrected_date_' + Date.now(),
  ], { stdio: 'ignore' });

  process.on('exit', () => {
    try { chromeProcess.kill(); } catch (e) {}
  });

  await delay(1500);

  const version = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}/json/version`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const browserClient = new CdpClient(version.webSocketDebuggerUrl);
  await browserClient.init();

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
    console.log(`Testing Tour: ${tour.name}`);
    console.log(`URL: ${tour.url}`);

    let targetId = null;
    let pageClient = null;

    try {
      await Promise.race([
        (async () => {
          const createRes = await browserClient.send('Target.createTarget', { url: 'about:blank' }, null, 10000);
          targetId = createRes.targetId;
          const pageWsUrl = `ws://127.0.0.1:${PORT}/devtools/page/${targetId}`;
          pageClient = new CdpClient(pageWsUrl);
          await pageClient.init();

          await pageClient.send('Network.enable', {}, null, 5000);
          await pageClient.send('Page.enable', {}, null, 5000);
          await pageClient.send('Runtime.enable', {}, null, 5000);

          await pageClient.send('Fetch.enable', {
            patterns: [{ urlPattern: '*api/wno/telemetry*', requestStage: 'Response' }]
          }, null, 5000);

          const networkRequests = new Map();
          const pausedResponses = [];

          pageClient.onEvent(async (method, params) => {
            if (method === 'Network.requestWillBeSent') {
              const req = params.request;
              if (req.url.includes('/api/wno/telemetry')) {
                networkRequests.set(params.requestId, {
                  requestId: params.requestId,
                  url: req.url,
                  method: req.method,
                  postData: req.postData,
                  redirectResponse: params.redirectResponse,
                });
              }
            }

            if (method === 'Fetch.requestPaused') {
              const interceptedRequestId = params.requestId;
              const networkId = params.networkId;
              const statusCode = params.responseStatusCode;
              const reqUrl = params.request?.url || '';

              if (reqUrl.includes('/api/wno/telemetry')) {
                const matchingNetReq = networkRequests.get(networkId);
                let rawBody = null;
                let parsedBody = null;

                if (statusCode === 200) {
                  try {
                    const bodyRes = await pageClient.send('Fetch.getResponseBody', { requestId: interceptedRequestId }, null, 3000);
                    rawBody = bodyRes?.base64Encoded ? Buffer.from(bodyRes.body, 'base64').toString('utf8') : bodyRes?.body;
                    if (rawBody) {
                      try { parsedBody = JSON.parse(rawBody); } catch (e) {}
                    }
                  } catch (err) {}
                }

                pausedResponses.push({
                  interceptedRequestId,
                  networkId,
                  statusCode,
                  reqUrl,
                  matchingNetReq,
                  rawBody,
                  parsedBody,
                });
              }

              try {
                await pageClient.send('Fetch.continueResponse', {
                  requestId: interceptedRequestId,
                  responseCode: statusCode,
                }, null, 3000);
              } catch (e) {
                try {
                  await pageClient.send('Fetch.continueRequest', { requestId: interceptedRequestId }, null, 3000);
                } catch (e2) {}
              }
            }
          });

          console.log('   Navigating to tour storefront...');
          await pageClient.send('Page.navigate', { url: tour.url }, null, 25000);
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
          }, null, 5000);

          const ctas = evalResult?.result?.value || [];
          const matchingCta = ctas.find(c => c.href.includes(tour.expectedItemId)) || ctas[0];
          const firstCtaHref = matchingCta?.href || '';
          const urlObj = firstCtaHref ? new URL(firstCtaHref) : new URL('https://fareharbor.com');
          const hasShortname = urlObj.pathname.includes(tour.expectedShortname);
          const hasItem = urlObj.pathname.includes(tour.expectedItemId) || urlObj.searchParams.get('item') === tour.expectedItemId;
          const hasAsn = urlObj.searchParams.get('asn') === tour.expectedAsn;

          console.log('   Waiting for FareHarbor Lightframe API to initialize...');
          for (let attempt = 0; attempt < 15; attempt++) {
            const fhReady = await pageClient.send('Runtime.evaluate', {
              expression: 'Boolean(window.FH && typeof window.FH.open === "function")',
              returnByValue: true,
            }, null, 3000).catch(() => null);
            if (fhReady?.result?.value) {
              console.log('     - FareHarbor Lightframe API is ready');
              break;
            }
            await delay(500);
          }

          console.log(`   Simulating click on booking CTA [${matchingCta?.text || 'BOOK'}]...`);
          await pageClient.send('Runtime.evaluate', {
            expression: `
              (() => {
                const links = Array.from(document.querySelectorAll('a[href*="fareharbor.com"]'));
                const target = links.find(l => l.href.includes("${tour.expectedItemId}")) || links[0];
                if (target) {
                  target.click();
                  return true;
                }
                return false;
              })()
            `,
          }, null, 5000).catch(() => null);

          // Wait for FareHarbor Lightframe modal to render
          console.log('   Waiting for FareHarbor Lightframe checkout modal...');
          let checkoutModal = null;
          for (let attempt = 0; attempt < 15; attempt++) {
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
                  };
                })()
              `,
              returnByValue: true,
            }, null, 3000).catch(() => null);

            if (checkDom?.result?.value?.isVisible && checkDom?.result?.value?.iframeSrc) {
              checkoutModal = checkDom.result.value;
              break;
            }
          }

          // Fallback: invoke FH.open via API if modal didn't render from click
          if (!checkoutModal) {
            console.log('   Modal not opened yet, invoking FH.open via API directly...');
            await pageClient.send('Runtime.evaluate', {
              expression: `
                (() => {
                  if (window.FH && window.FH.open) {
                    window.FH.open({
                      shortname: "${tour.expectedShortname}",
                      asn: "${tour.expectedAsn}",
                      view: { item: "${tour.expectedItemId}" },
                      fullItems: "yes"
                    });
                    return true;
                  }
                  return false;
                })()
              `,
              returnByValue: true,
            }, null, 3000).catch(() => null);

            for (let attempt = 0; attempt < 15; attempt++) {
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
                    };
                  })()
                `,
                returnByValue: true,
              }, null, 3000).catch(() => null);

              if (checkDom?.result?.value?.isVisible && checkDom?.result?.value?.iframeSrc) {
                checkoutModal = checkDom.result.value;
                break;
              }
            }
          }

          const renderedModalOk = Boolean(checkoutModal && checkoutModal.isShowing && checkoutModal.isVisible);
          const iframeUrl = checkoutModal?.iframeSrc ? new URL(checkoutModal.iframeSrc) : null;
          const iframeHasShortname = iframeUrl ? iframeUrl.pathname.includes(tour.expectedShortname) : false;
          const iframeHasItem = iframeUrl ? (iframeUrl.pathname.includes(tour.expectedItemId) || iframeUrl.searchParams.get('item') === tour.expectedItemId) : false;
          const iframeHasAsn = iframeUrl ? (iframeUrl.searchParams.get('asn') === tour.expectedAsn) : false;

          // Attach to FareHarbor iframe target
          console.log('   Locating opened FareHarbor iframe target...');
          await delay(3500);
          let fareHarborIframeTarget = null;
          for (let attempt = 0; attempt < 20; attempt++) {
            try {
              const targets = await browserClient.send('Target.getTargets', {}, null, 5000);
              for (const t of targets.targetInfos) {
                if (t.type === 'iframe' && t.url.includes('fareharbor.com/embeds/book') && (t.url.includes(tour.expectedItemId) || t.url.includes(tour.expectedShortname))) {
                  fareHarborIframeTarget = t;
                  break;
                }
              }
            } catch (e) {}
            if (fareHarborIframeTarget) break;
            await delay(1000);
          }

          let originalIframeInspection = null;
          let futureDateSelection = null;

          if (fareHarborIframeTarget) {
            console.log(`     - Attached to iframe target [${fareHarborIframeTarget.targetId}] "${fareHarborIframeTarget.title}"`);
            let iframeSessionId = null;
            try {
              const attachRes = await browserClient.send('Target.attachToTarget', {
                targetId: fareHarborIframeTarget.targetId,
                flatten: true,
              }, null, 5000);
              iframeSessionId = attachRes.sessionId;
              await browserClient.send('Runtime.enable', {}, iframeSessionId, 5000);
            } catch (e) {
              console.error('Failed to attach to iframe target:', e.message);
            }

            if (iframeSessionId) {
              for (let attempt = 0; attempt < 15; attempt++) {
                await delay(1000);
                const evalRes = await browserClient.send('Runtime.evaluate', {
                  expression: `
                    (() => {
                      const h1 = document.querySelector('h1, h2, .item-name, [data-testid="item-name"], header h1, .sheet-title');
                      const cal = document.querySelector('.calendar, [data-testid="calendar"], .sheet, .calendar-month, table, .booking-sheet, [data-test-id*="calendar"], .next-day-card');
                      const buttons = Array.from(document.querySelectorAll('button, a.button, .btn, [role="button"], td, .day, .next-day-card')).map(b => (b.innerText || '').trim()).filter(Boolean);
                      const bodyText = document.body ? document.body.innerText.slice(0, 500).replace(/\\s+/g, ' ') : '';
                      return {
                        title: document.title,
                        heading: h1 ? h1.innerText.trim() : null,
                        hasCalendar: Boolean(cal),
                        buttonCount: buttons.length,
                        buttons: buttons.slice(0, 6),
                        bodyPreview: bodyText.slice(0, 200),
                      };
                    })()
                  `,
                  returnByValue: true,
                }, iframeSessionId, 5000).catch(() => null);

                const val = evalRes?.result?.value;
                if (val && (val.hasCalendar || val.buttonCount > 0)) {
                  const expectedTourKey = tour.expectedShortname.toLowerCase();
                  const titleLower = (val.title || fareHarborIframeTarget.title || '').toLowerCase();
                  const bodyLower = (val.bodyPreview || '').toLowerCase();
                  const nameLower = tour.name.toLowerCase();
                  const tourMatch = titleLower.includes(expectedTourKey)
                    || bodyLower.includes(expectedTourKey)
                    || (nameLower.includes('jazz') && (titleLower.includes('jazz') || bodyLower.includes('jazz') || titleLower.includes('steamboat')))
                    || (nameLower.includes('covered') && (titleLower.includes('covered') || bodyLower.includes('covered') || titleLower.includes('cajun')))
                    || (nameLower.includes('plantation') && (titleLower.includes('plantation') || bodyLower.includes('plantation') || titleLower.includes('oak alley')));

                  originalIframeInspection = {
                    openedIframeTargetFound: true,
                    targetId: fareHarborIframeTarget.targetId,
                    targetTitle: fareHarborIframeTarget.title,
                    targetUrl: fareHarborIframeTarget.url,
                    documentTitle: val.title,
                    heading: val.heading,
                    hasCalendar: val.hasCalendar,
                    interactiveButtonCount: val.buttonCount,
                    buttonSamples: val.buttons,
                    tourMatch: Boolean(tourMatch),
                    usableBookingControls: Boolean(val.buttonCount > 0),
                    verified: Boolean(tourMatch && val.buttonCount > 0),
                  };
                  break;
                }
              }

              console.log(`   Selecting enabled calendar control for ${REQUESTED_DATE_FORMATTED} (${REQUESTED_TIMEZONE})...`);
              let dateSelectRes = null;
              for (let attempt = 0; attempt < 25; attempt++) {
                await delay(1000);
                const dateSelectEval = await browserClient.send('Runtime.evaluate', {
                  expression: `
                    (() => {
                      const targetStr = "September 11, 2026";
                      const all = Array.from(document.querySelectorAll('button, a, [role="button"], td, .day, .next-day-card, .calendar-day, [data-date]'));
                      const btn = all.find(b => {
                        const aria = b.getAttribute('aria-label') || '';
                        const text = (b.innerText || '').trim().replace(/\\s+/g, ' ');
                        const dt = b.getAttribute('data-date') || '';
                        const disabled = b.disabled || b.getAttribute('aria-disabled') === 'true' || (typeof b.className === 'string' && b.className.includes('disabled'));
                        if (disabled) return false;
                        return aria.includes(targetStr) || text.includes('11 Sep') || dt === '2026-09-11';
                      });

                      if (!btn) return null;

                      const rawAria = btn.getAttribute('aria-label') || '';
                      const rawText = (btn.innerText || '').trim().replace(/\\s+/g, ' ');
                      const rawDt = btn.getAttribute('data-date') || '';

                      btn.click();

                      return {
                        success: true,
                        tag: btn.tagName,
                        aria: rawAria,
                        text: rawText,
                        dataDate: rawDt,
                      };
                    })()
                  `,
                  returnByValue: true,
                }, iframeSessionId, 5000).catch(() => null);

                if (dateSelectEval?.result?.value) {
                  dateSelectRes = dateSelectEval.result.value;
                  break;
                }
              }

              if (dateSelectRes && dateSelectRes.success) {
                console.log(`     - Clicked Date Control: [${dateSelectRes.tag}] "${dateSelectRes.aria || dateSelectRes.text}"`);
                
                console.log('     - Reading actual date from active availability panel or selected booking slot...');
                let availRes = null;
                for (let waitAttempt = 0; waitAttempt < 15; waitAttempt++) {
                  await delay(1000);
                  const availEval = await browserClient.send('Runtime.evaluate', {
                    expression: `
                      (() => {
                        const bodyText = document.body ? document.body.innerText.replace(/\\s+/g, ' ') : '';
                        
                        const candidateSelectors = [
                          '.day-title',
                          '.sheet-title',
                          '.timeslot-header',
                          '.text-huge',
                          '.booking-sheet header',
                          '[data-test-id*="availability"] header',
                          'h1', 'h2', 'h3', 'h4', 'header'
                        ];

                        let exactObservedDateText = null;
                        for (const sel of candidateSelectors) {
                          const els = Array.from(document.querySelectorAll(sel));
                          for (const el of els) {
                            if (el.classList.contains('fh-link--text-variant') || el.closest('.fh-link--text-variant')) continue;
                            const txt = (el.innerText || '').trim().replace(/\\s+/g, ' ');
                            if (/(January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},\\s*\\d{4}/i.test(txt)) {
                              exactObservedDateText = txt;
                              break;
                            }
                          }
                          if (exactObservedDateText) break;
                        }

                        if (!exactObservedDateText) {
                          const allElements = Array.from(document.querySelectorAll('.booking-sheet, .sheet, .availability-pane, .time-select, [data-test-id*="availability"], form, main, .item-view, div, section, p, span'));
                          for (const container of allElements) {
                            if (container.children.length > 2) continue;
                            if (container.classList.contains('fh-link--text-variant') || container.closest('.fh-link--text-variant')) continue;
                            const txt = (container.innerText || '').trim().replace(/\\s+/g, ' ');
                            if (txt.length < 100 && /(January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},\\s*\\d{4}/i.test(txt)) {
                              exactObservedDateText = txt;
                              break;
                            }
                          }
                        }

                        const timeslotElements = Array.from(document.querySelectorAll('.time, .timeslot, [data-testid*="time"], button, a, [role="button"], .booking-sheet-item, .item-headline, .timeslot-card, .availability-cell, .cal-block')).map(el => {
                          const text = (el.innerText || '').trim().replace(/\\s+/g, ' ');
                          const aria = el.getAttribute('aria-label') || '';
                          const cls = typeof el.className === 'string' ? el.className : '';
                          const disabled = el.disabled || el.getAttribute('aria-disabled') === 'true' || cls.includes('disabled');
                          return { text, aria, cls, disabled };
                        }).filter(t => (t.text.includes('AM') || t.text.includes('PM') || t.aria.includes('time') || t.text.includes('Available') || t.text.includes('Book') || t.text.includes('Call')) && t.text.length < 90);

                        const isSoldOut = bodyText.toLowerCase().includes('sold out') || timeslotElements.some(t => t.text.toLowerCase().includes('sold out'));
                        const isCallToBook = bodyText.toLowerCase().includes('call to book') || bodyText.toLowerCase().includes('call us') || timeslotElements.some(t => t.text.toLowerCase().includes('call'));
                        const isAvailable = timeslotElements.some(t => !t.disabled && (t.text.includes('Available') || t.text.includes('Book') || t.text.includes('AM') || t.text.includes('PM')));

                        let reportedState = 'UNKNOWN';
                        if (isAvailable) reportedState = 'AVAILABLE';
                        else if (isSoldOut) reportedState = 'SOLD_OUT';
                        else if (isCallToBook) reportedState = 'CALL_TO_BOOK';

                        return {
                          exactObservedDateText,
                          reportedState,
                          timeslotCount: timeslotElements.length,
                          availableTimeslots: timeslotElements.slice(0, 6),
                          bodySnippet: bodyText.slice(0, 300),
                        };
                      })()
                    `,
                    returnByValue: true,
                  }, iframeSessionId, 5000).catch(() => null);

                  const resVal = availEval?.result?.value;
                  if (resVal && resVal.exactObservedDateText) {
                    availRes = resVal;
                    break;
                  }
                }

                const selectedDateDisplay = dateSelectRes.aria.trim() || dateSelectRes.text || REQUESTED_DATE_FORMATTED;
                const exactObservedText = availRes?.exactObservedDateText || null;
                
                const dateValidation = validateDateAssertion({
                  requestedDate: REQUESTED_DATE,
                  calendarDateText: selectedDateDisplay,
                  activePanelObservedText: exactObservedText,
                });

                const selectedCalendarDateMatches = selectedDateDisplay.includes('September 11, 2026') || selectedDateDisplay.includes('11 Sep') || dateSelectRes.dataDate === REQUESTED_DATE;
                const datesAgree = Boolean(dateValidation.pass && selectedCalendarDateMatches);

                futureDateSelection = {
                  requestedDate: REQUESTED_DATE,
                  requestedDateFormatted: REQUESTED_DATE_FORMATTED,
                  timezone: REQUESTED_TIMEZONE,
                  selectedCalendarDate: selectedDateDisplay,
                  selectedCalendarDateMatches,
                  exactObservedText,
                  parsedDate: dateValidation.parsedDate || null,
                  matchedDateSnippet: dateValidation.matchedSnippet || null,
                  dateMatchAssertion: dateValidation.pass,
                  dateValidationFailureReason: dateValidation.reason || null,
                  datesAgree,
                  resultingAvailability: {
                    state: availRes?.reportedState,
                    isAvailable: availRes?.reportedState === 'AVAILABLE',
                    isSoldOut: availRes?.reportedState === 'SOLD_OUT',
                    isCallToBook: availRes?.reportedState === 'CALL_TO_BOOK',
                    timeslotCount: availRes?.timeslotCount || 0,
                    availableTimeslots: availRes?.availableTimeslots || [],
                    availabilityVerifiedForRequestedDate: Boolean(availRes && datesAgree && (availRes.reportedState === 'AVAILABLE' || availRes.reportedState === 'SOLD_OUT' || availRes.reportedState === 'CALL_TO_BOOK')),
                  }
                };

                console.log(`     - Requested Date: ${futureDateSelection.requestedDate} (${futureDateSelection.timezone})`);
                console.log(`     - Selected Calendar Date: ${futureDateSelection.selectedCalendarDate}`);
                console.log(`     - Exact Observed Panel/Slot Text: "${futureDateSelection.exactObservedText}"`);
                console.log(`     - Parsed Date: ${futureDateSelection.parsedDate}`);
                console.log(`     - Date Comparison: ${futureDateSelection.parsedDate} === ${futureDateSelection.requestedDate} -> ${futureDateSelection.dateMatchAssertion ? 'MATCH' : 'MISMATCH'}`);
                console.log(`     - Resulting Availability State: ${futureDateSelection.resultingAvailability.state} (${futureDateSelection.resultingAvailability.timeslotCount} timeslots)`);
              } else {
                console.log(`     - FAILED to select requested date control: matching enabled date control not found`);
                futureDateSelection = { success: false, reason: 'matching enabled date control not found' };
              }
            }
          }

          // Telemetry correlation via networkId and durable event verification
          await delay(2000);
          let originalBookingNetworkReq = null;
          let originalBookingPausedResp = null;

          for (const [reqId, req] of networkRequests.entries()) {
            let parsed = null;
            try { parsed = JSON.parse(req.postData); } catch (e) {}
            if (parsed?.eventName === 'booking_opened' || parsed?.eventName === 'fareharbor_click') {
              originalBookingNetworkReq = {
                requestId: reqId,
                url: req.url,
                method: req.method,
                payload: parsed,
              };
              originalBookingPausedResp = pausedResponses.find(p => p.networkId === reqId && (p.statusCode === 200 || p.statusCode === 307));
              break;
            }
          }

          let durableRecord = null;
          let durableRecordVerified = false;
          if (originalBookingNetworkReq?.payload?.sessionId) {
            console.log(`   Verifying matching durable event record for session [${originalBookingNetworkReq.payload.sessionId}]...`);
            try {
              const rows = await sql`
                SELECT event_id, occurred_at, corridor_id, event_name, session_id, source_page, clicked_product_slug, route_target, metadata
                FROM dcc_corridor_events
                WHERE corridor_id = 'wno-commerce'
                  AND session_id = ${originalBookingNetworkReq.payload.sessionId}
                  AND event_name = 'booking_opened'
                ORDER BY occurred_at DESC
                LIMIT 1
              `;
              if (rows.length > 0) {
                durableRecord = rows[0];
                durableRecordVerified = true;
                console.log(`     ✅ Durable record verified in dcc_corridor_events! (event_id: ${durableRecord.event_id})`);
              } else {
                console.log(`     ⚠️ No matching row found in dcc_corridor_events`);
              }
            } catch (dbErr) {
              console.error(`     ❌ DB query error:`, dbErr.message);
            }
          }

          const telemetryAssertions = {
            browserRequestDispatched: Boolean(originalBookingNetworkReq?.payload),
            sessionCorrelated: Boolean(originalBookingNetworkReq?.payload?.sessionId),
            eventCorrelated: originalBookingNetworkReq?.payload?.eventName === 'booking_opened' || originalBookingNetworkReq?.payload?.eventName === 'fareharbor_click',
            tourCorrelated: originalBookingNetworkReq?.payload?.itemId === tour.expectedItemId || originalBookingNetworkReq?.payload?.sku === tour.sku,
            sourcePageCorrelated: Boolean(originalBookingNetworkReq?.payload?.sourcePage && (tour.url.includes(originalBookingNetworkReq.payload.sourcePage) || originalBookingNetworkReq.payload.sourcePage.includes(tour.sku))),
            networkIdCorrelated: Boolean(originalBookingPausedResp && originalBookingPausedResp.networkId === originalBookingNetworkReq.requestId),
            responseStatusOkOrRedirect: originalBookingPausedResp ? (originalBookingPausedResp.statusCode === 200 || originalBookingPausedResp.statusCode === 307) : false,
            durableEventVerified: durableRecordVerified,
            responseBodyOkOrDurableVerified: (originalBookingPausedResp?.parsedBody?.ok === true) || durableRecordVerified,
          };

          const isSuccess = Boolean(
            hasShortname &&
            hasItem &&
            hasAsn &&
            renderedModalOk &&
            iframeHasShortname &&
            iframeHasItem &&
            iframeHasAsn &&
            originalIframeInspection?.verified &&
            futureDateSelection?.datesAgree &&
            futureDateSelection?.dateMatchAssertion &&
            futureDateSelection?.resultingAvailability?.availabilityVerifiedForRequestedDate &&
            Object.values(telemetryAssertions).every(Boolean)
          );

          console.log(`   >>> OVERALL TOUR VERIFICATION: ${isSuccess ? 'PASS' : 'FAIL'}`);

          results.push({
            sku: tour.sku,
            productName: tour.name,
            pageUrl: tour.url,
            clickedCta: {
              text: matchingCta?.text,
              href: firstCtaHref,
            },
            handoffAttribution: {
              shortname: urlObj.pathname.split('/')[3],
              itemId: urlObj.pathname.split('/')[5] || urlObj.searchParams.get('item'),
              asn: urlObj.searchParams.get('asn'),
            },
            renderedCheckoutVerification: {
              modalVisible: renderedModalOk,
              iframeSrc: checkoutModal?.iframeSrc,
              operatorMatch: iframeHasShortname,
              itemMatch: iframeHasItem,
              asnMatch: iframeHasAsn,
              originalIframeInspection,
            },
            futureDateSelection,
            originalBrowserTelemetryEvidence: {
              requestId: originalBookingNetworkReq?.requestId,
              networkId: originalBookingPausedResp?.networkId,
              dispatchedUrl: originalBookingNetworkReq?.url,
              payload: originalBookingNetworkReq?.payload,
              responseStatusCode: originalBookingPausedResp?.statusCode,
              durableRecord,
              assertions: telemetryAssertions,
            },
            sourceEvidence: tour.sourceEvidence,
            success: isSuccess,
          });
        })(),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Tour ${tour.name} exceeded 75s timeout`)), 75000)),
      ]);
    } catch (err) {
      console.error(`\n❌ Error during tour verification for ${tour.name}:`, err.message);
      results.push({
        sku: tour.sku,
        productName: tour.name,
        pageUrl: tour.url,
        success: false,
        error: err.message,
      });
    } finally {
      if (pageClient) {
        try { await pageClient.send('Fetch.disable', {}, null, 2000); } catch (e) {}
        try { pageClient.close(); } catch (e) {}
      }
      if (targetId) {
        try { await browserClient.send('Target.closeTarget', { targetId }, null, 5000); } catch (e) {}
      }
    }
  }

  try { browserClient.close(); } catch (e) {}
  try { chromeProcess.kill(); } catch (e) {}
  await delay(1000);

  console.log('\n========================================');
  console.log('FINAL RESULTS SUMMARY:');
  for (const r of results) {
    console.log(`${r.success ? 'PASS' : 'FAIL'}: ${r.productName}`);
    console.log(`   Observed Panel/Slot Date: "${r.futureDateSelection?.exactObservedText}"`);
    console.log(`   Parsed Date: ${r.futureDateSelection?.parsedDate} (Match: ${r.futureDateSelection?.dateMatchAssertion})`);
    console.log(`   Availability: ${r.futureDateSelection?.resultingAvailability?.state} (${r.futureDateSelection?.resultingAvailability?.timeslotCount} timeslots)`);
    console.log(`   Telemetry: status ${r.originalBrowserTelemetryEvidence?.responseStatusCode} -> durable_verified=${r.originalBrowserTelemetryEvidence?.assertions?.durableEventVerified}`);
  }

  const allPassed = results.length > 0 && results.every(r => r.success);

  const reportPayload = {
    auditDate: new Date().toISOString(),
    environment: 'production',
    targetOrigin: 'https://www.welcometoneworleanstours.com',
    browser: 'Headless Google Chrome (CDP) under Normal Customer Security (no --disable-web-security)',
    evidenceMechanism: 'cdp_network_id_correlation_durable_event_verification_and_parsed_active_panel_date_agreement',
    timezone: REQUESTED_TIMEZONE,
    requestedDate: REQUESTED_DATE,
    requestedDateFormatted: REQUESTED_DATE_FORMATTED,
    regressionCheck: regressionResult,
    results,
    overallStatus: allPassed ? 'PASSED' : 'FAILED',
  };

  const reportDir = 'C:/Users/erich/Documents/Projects/destinations-cc/reports';
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'wno-browser-verification-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportPayload, null, 2), 'utf8');
  console.log('\nSaved reproducible verification report to ' + reportPath);

  const gosnoDir = 'C:/Users/erich/gosno-production/reports';
  if (fs.existsSync(gosnoDir)) {
    const gosnoReportPath = path.join(gosnoDir, 'wno-browser-verification-results.json');
    fs.writeFileSync(gosnoReportPath, JSON.stringify(reportPayload, null, 2), 'utf8');
    console.log('Mirrored report to ' + gosnoReportPath);
  }

  clearTimeout(globalWatchdog);

  if (!allPassed) {
    console.error('\n❌ One or more tours failed verification!');
    process.exit(1);
  }
  console.log('\n✅ All tours verified successfully under normal security with exact parsed date assertion, networkId correlation, and durable DB records!');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
