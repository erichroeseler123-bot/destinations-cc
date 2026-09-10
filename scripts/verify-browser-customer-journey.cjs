const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
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

  send(method, params = {}, sessionId = undefined) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      const payload = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;
      this.ws.send(JSON.stringify(payload));
    });
  }

  onEvent(listener) {
    this.eventListeners.push(listener);
  }

  close() {
    this.ws.close();
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
            headers: params.response.headers,
            protocol: params.response.protocol,
            remoteIPAddress: params.response.remoteIPAddress,
          });
          console.log(`   📡 Original Browser Network Response: Status ${params.response.status} (${params.response.statusText})`);
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

    const matchingCta = ctas.find(c => c.href.includes(tour.expectedItemId)) || ctas[0];
    const firstCtaHref = matchingCta.href;
    const urlObj = new URL(firstCtaHref);
    const hasShortname = urlObj.pathname.includes(tour.expectedShortname);
    const hasItem = urlObj.pathname.includes(tour.expectedItemId) || urlObj.searchParams.get('item') === tour.expectedItemId;
    const hasAsn = urlObj.searchParams.get('asn') === tour.expectedAsn;

    console.log(`   Handoff URL Analysis:`);
    console.log(`     - Operator Shortname (${tour.expectedShortname}): ${hasShortname ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`     - Item ID (${tour.expectedItemId}): ${hasItem ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`     - Operator ASN (${tour.expectedAsn}): ${hasAsn ? '✅ MATCH' : '❌ MISMATCH'}`);

    console.log(`   Simulating click on booking CTA [${matchingCta.text}]...`);
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

    // 2. Verify expected tour and usable booking content inside original opened FareHarbor checkout iframe
    console.log('   Inspecting usable booking content inside original opened FareHarbor checkout iframe...');
    let fareHarborIframeTarget = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      await delay(1000);
      const targets = await browserClient.send('Target.getTargets');
      for (const t of targets.targetInfos) {
        if (t.type === 'iframe' && t.url.includes('fareharbor.com/embeds/book') && (t.url.includes(tour.expectedItemId) || t.url.includes('calendar') || t.url.includes('items'))) {
          fareHarborIframeTarget = t;
          break;
        }
      }
      if (fareHarborIframeTarget) break;
    }

    let originalIframeInspection = null;
    let futureDateExercise = null;

    if (fareHarborIframeTarget) {
      console.log(`     - Found opened iframe target: [${fareHarborIframeTarget.targetId}] "${fareHarborIframeTarget.title}"`);
      const { sessionId: iframeSessionId } = await browserClient.send('Target.attachToTarget', {
        targetId: fareHarborIframeTarget.targetId,
        flatten: true,
      });

      await browserClient.send('Runtime.enable', {}, iframeSessionId);

      for (let attempt = 0; attempt < 12; attempt++) {
        await delay(1000);
        const evalRes = await browserClient.send('Runtime.evaluate', {
          expression: `
            (() => {
              const h1 = document.querySelector('h1, h2, .item-name, [data-testid="item-name"], header h1, .sheet-title');
              const cal = document.querySelector('.calendar, [data-testid="calendar"], .sheet, .calendar-month, table, .booking-sheet, [data-test-id*="calendar"]');
              const buttons = Array.from(document.querySelectorAll('button, a.button, .btn, [role="button"], td, .day')).map(b => (b.innerText || '').trim()).filter(Boolean);
              const bodyText = document.body ? document.body.innerText.slice(0, 500).replace(/\\s+/g, ' ') : '';
              return {
                title: document.title,
                heading: h1 ? h1.innerText.trim() : null,
                hasCalendar: Boolean(cal),
                calTag: cal ? cal.tagName : null,
                buttonCount: buttons.length,
                buttons: buttons.slice(0, 6),
                bodyPreview: bodyText.slice(0, 200),
              };
            })()
          `,
          returnByValue: true,
        }, iframeSessionId);

        const val = evalRes?.result?.value;
        if (val && val.hasCalendar && val.buttonCount > 0) {
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
            bodyPreview: val.bodyPreview,
            tourMatch: Boolean(tourMatch),
            usableBookingControls: Boolean(val.hasCalendar && val.buttonCount > 0),
            verified: Boolean(tourMatch && val.hasCalendar && val.buttonCount > 0),
          };

          console.log(`     - Opened Iframe Target Title: "${fareHarborIframeTarget.title}"`);
          console.log(`     - Tour Match Assertion: ${originalIframeInspection.tourMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
          console.log(`     - Calendar Sheet Assertion: ${originalIframeInspection.hasCalendar ? '✅ RENDERED' : '❌ MISSING'}`);
          console.log(`     - Usable Booking Controls Assertion (${val.buttonCount} interactive buttons): ${originalIframeInspection.usableBookingControls ? '✅ VERIFIED' : '❌ MISSING'}`);
          break;
        }
      }

      // Exercise a visible future-date control inside the opened FareHarbor checkout iframe
      console.log('   Exercising a visible future-date control in FareHarbor checkout...');
      const exerciseEval = await browserClient.send('Runtime.evaluate', {
        expression: `
          (() => {
            const candidates = Array.from(document.querySelectorAll('button, a, [role="button"], td, .day, [data-date]'));
            const targetBtn = candidates.find(el => {
              const text = (el.innerText || '').trim();
              const aria = (el.getAttribute('aria-label') || '').toLowerCase();
              const disabled = el.disabled || el.getAttribute('aria-disabled') === 'true' || el.classList.contains('disabled') || el.classList.contains('is-disabled');
              const isDate = el.hasAttribute('data-date') || aria.includes('available') || aria.includes('select') || aria.includes('2026') || /^[0-9]{1,2}$/.test(text);
              const visible = el.offsetWidth > 0 || el.getClientRects().length > 0;
              return isDate && !disabled && visible;
            });

            if (targetBtn) {
              const info = {
                tag: targetBtn.tagName,
                text: targetBtn.innerText ? targetBtn.innerText.trim().replace(/\\s+/g, ' ') : '',
                aria: targetBtn.getAttribute('aria-label') || '',
                dataDate: targetBtn.getAttribute('data-date') || '',
                className: targetBtn.className || '',
              };
              targetBtn.click();
              return { exercised: true, control: info };
            }
            return { exercised: false, reason: 'no candidate visible' };
          })()
        `,
        returnByValue: true
      }, iframeSessionId);

      const exerciseRes = exerciseEval?.result?.value;
      if (exerciseRes && exerciseRes.exercised) {
        console.log(`     - Future Date Control Clicked: [${exerciseRes.control.tag}] "${exerciseRes.control.text || exerciseRes.control.aria}" (class: ${exerciseRes.control.className})`);
        await delay(2500);

        // Record resulting booking / availability state
        const stateEval = await browserClient.send('Runtime.evaluate', {
          expression: `
            (() => {
              const title = document.title;
              const heading = document.querySelector('h1, h2, .item-name, [data-testid="item-name"], header h1, .sheet-title')?.innerText?.trim() || null;
              const times = Array.from(document.querySelectorAll('.time, .timeslot, [data-testid*="time"], button, a, [role="button"]')).map(el => ({
                text: (el.innerText || '').trim().replace(/\\s+/g, ' '),
                aria: el.getAttribute('aria-label') || '',
                className: el.className || ''
              })).filter(t => t.text.includes('AM') || t.text.includes('PM') || t.text.includes('Book') || t.text.includes('Select') || t.aria.includes('time') || t.aria.includes('available'));

              const bodySnippet = document.body ? document.body.innerText.replace(/\\s+/g, ' ').slice(0, 400) : '';

              return {
                title,
                heading,
                timesCount: times.length,
                timeSamples: times.slice(0, 8),
                bodySnippet
              };
            })()
          `,
          returnByValue: true
        }, iframeSessionId);

        const stateRes = stateEval?.result?.value;
        futureDateExercise = {
          exercised: true,
          control: exerciseRes.control,
          resultingAvailabilityState: {
            title: stateRes?.title,
            heading: stateRes?.heading,
            timesCount: stateRes?.timesCount || 0,
            availableTimeslots: stateRes?.timeSamples || [],
            bodyPreview: stateRes?.bodySnippet || '',
            verified: Boolean(stateRes && (stateRes.timesCount > 0 || stateRes.bodySnippet.includes('Available') || stateRes.bodySnippet.includes('2026'))),
          }
        };

        console.log(`     - Resulting Availability State: ${futureDateExercise.resultingAvailabilityState.timesCount} timeslot option(s) available`);
        for (const slot of futureDateExercise.resultingAvailabilityState.availableTimeslots.slice(0, 3)) {
          console.log(`        * Slot: ${slot.text}`);
        }
      } else {
        console.log('     - ❌ Failed to exercise future-date control!');
        futureDateExercise = { exercised: false, reason: exerciseRes?.reason || 'no control' };
      }
    } else {
      console.log('     - ❌ Could not find opened FareHarbor booking iframe target!');
    }

    // 3. Correlate original browser-generated booking telemetry event
    await delay(1000);
    let originalBrowserBookingEvent = null;

    for (const t of telemetryRequests) {
      let parsed = null;
      try { parsed = JSON.parse(t.postData); } catch (e) {}
      if (parsed?.eventName === 'booking_opened' || parsed?.eventName === 'fareharbor_click') {
        const browserResp = responsesByRequestId.get(t.requestId);
        originalBrowserBookingEvent = {
          requestId: t.requestId,
          url: t.url,
          method: t.method,
          payload: parsed,
          browserReceivedStatus: browserResp?.status ?? null,
          browserReceivedStatusText: browserResp?.statusText ?? null,
          browserReceivedHeaders: browserResp?.headers ?? {},
          protocol: browserResp?.protocol ?? null,
          remoteIPAddress: browserResp?.remoteIPAddress ?? null,
          timestamp: t.timestamp,
        };
        break;
      }
    }

    console.log(`   Original Browser Telemetry Request Evidence:`);
    if (originalBrowserBookingEvent) {
      console.log(`     - Original Browser Event Dispatched: ✅ YES (Session: ${originalBrowserBookingEvent.payload?.sessionId})`);
      console.log(`     - Original Browser Request ID: ${originalBrowserBookingEvent.requestId}`);
      console.log(`     - Collector Target URL: ${originalBrowserBookingEvent.url}`);
      console.log(`     - Original Browser Received HTTP Status: ${originalBrowserBookingEvent.browserReceivedStatus} (${originalBrowserBookingEvent.browserReceivedStatusText})`);
      console.log(`     - Collector Accepted (HTTP 200 from live server): ${originalBrowserBookingEvent.browserReceivedStatus === 200 ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log(`     - ❌ No browser telemetry event captured!`);
    }

    const isSuccess = Boolean(
      hasShortname &&
      hasItem &&
      hasAsn &&
      renderedModalOk &&
      iframeHasShortname &&
      iframeHasItem &&
      iframeHasAsn &&
      originalIframeInspection?.verified &&
      originalIframeInspection?.tourMatch &&
      originalIframeInspection?.usableBookingControls &&
      originalBrowserBookingEvent?.payload?.sessionId &&
      originalBrowserBookingEvent?.browserReceivedStatus === 200 &&
      futureDateExercise?.exercised &&
      futureDateExercise?.resultingAvailabilityState?.verified
    );

    console.log(`   >>> OVERALL TOUR PASS STATUS: ${isSuccess ? '✅ PASS' : '❌ FAIL'}`);

    results.push({
      sku: tour.sku,
      productName: tour.name,
      pageUrl: tour.url,
      clickedCta: {
        text: matchingCta.text,
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
        verified: renderedModalOk && iframeHasShortname && iframeHasItem && iframeHasAsn && Boolean(originalIframeInspection?.verified),
        modalVisible: renderedModalOk,
        iframeSrc: checkoutModal?.iframeSrc,
        iframeDimensions: checkoutModal ? { width: checkoutModal.iframeWidth, height: checkoutModal.iframeHeight } : null,
        operatorMatch: iframeHasShortname,
        itemMatch: iframeHasItem,
        asnMatch: iframeHasAsn,
        originalIframeVerification: originalIframeInspection,
      },
      futureDateBookingVerification: futureDateExercise,
      originalBrowserTelemetryEvidence: {
        evidenceType: "original_browser_http_request",
        requestId: originalBrowserBookingEvent?.requestId,
        dispatchedUrl: originalBrowserBookingEvent?.url,
        method: originalBrowserBookingEvent?.method,
        browserNetworkStatus: originalBrowserBookingEvent?.browserReceivedStatus,
        browserReceivedStatusText: originalBrowserBookingEvent?.browserReceivedStatusText,
        sessionId: originalBrowserBookingEvent?.payload?.sessionId,
        payload: originalBrowserBookingEvent?.payload,
        protocol: originalBrowserBookingEvent?.protocol,
        remoteIPAddress: originalBrowserBookingEvent?.remoteIPAddress,
        accepted: originalBrowserBookingEvent?.browserReceivedStatus === 200,
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
    console.log(`   Original Browser Telemetry Accepted: ${r.originalBrowserTelemetryEvidence.accepted ? 'YES (HTTP ' + r.originalBrowserTelemetryEvidence.browserNetworkStatus + ')' : 'NO'}`);
    console.log(`   Future-Date Availability State: ${r.futureDateBookingVerification?.resultingAvailabilityState?.verified ? 'YES (' + r.futureDateBookingVerification.resultingAvailabilityState.timesCount + ' timeslot(s))' : 'NO'}`);
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
    evidenceMechanism: 'original_browser_request_capture_and_future_date_dom_exercise',
    results,
  }, null, 2), 'utf8');
  console.log(`\nSaved reproducible verification report to ${reportPath}`);

  chromeProcess.kill();
  const allPassed = results.every(r => r.success);
  if (!allPassed) {
    console.error('\n❌ One or more tours failed verification!');
    process.exit(1);
  }
  console.log('\n✅ All tours verified successfully with original browser telemetry and future-date availability states!');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error in customer journey test:', err);
  process.exit(1);
});
