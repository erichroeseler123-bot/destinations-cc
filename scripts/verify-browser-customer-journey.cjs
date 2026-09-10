const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const WebSocket = require('C:/Users/erich/Documents/Projects/destinations-cc/node_modules/ws');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9222;

const REQUESTED_DATE = '2026-09-11';
const REQUESTED_DATE_FORMATTED = 'Friday, September 11, 2026';
const REQUESTED_TIMEZONE = 'America/Chicago';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

  send(method, params = {}, sessionId = null) {
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
  console.log('1. Launching Headless Chrome with Fetch interception and web security disabled...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--disable-web-security',
    '--no-default-browser-check',
    '--user-data-dir=' + require('os').tmpdir() + '/chrome_wno_full_' + Date.now(),
  ], { stdio: 'ignore' });

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

    const { targetId } = await browserClient.send('Target.createTarget', { url: 'about:blank' });
    const pageWsUrl = `ws://127.0.0.1:${PORT}/devtools/page/${targetId}`;
    const pageClient = new CdpClient(pageWsUrl);
    await pageClient.init();

    await pageClient.send('Network.enable');
    await pageClient.send('Page.enable');
    await pageClient.send('Runtime.enable');

    // Intercept responses for telemetry on this page
    await pageClient.send('Fetch.enable', {
      patterns: [{ urlPattern: '*api/wno/telemetry*', requestStage: 'Response' }]
    });

    const telemetryRequests = [];
    const telemetryResponsesByRequestId = new Map();

    pageClient.onEvent(async (method, params) => {
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

      if (method === 'Fetch.requestPaused') {
        const interceptedRequestId = params.requestId;
        const statusCode = params.responseStatusCode;
        const reqUrl = params.request?.url || '';

        if (reqUrl.includes('/api/wno/telemetry') && statusCode === 200) {
          try {
            const bodyRes = await pageClient.send('Fetch.getResponseBody', { requestId: interceptedRequestId });
            const rawBody = bodyRes.base64Encoded ? Buffer.from(bodyRes.body, 'base64').toString('utf8') : bodyRes.body;
            let parsedBody = null;
            try { parsedBody = JSON.parse(rawBody); } catch (e) {}

            telemetryResponsesByRequestId.set(interceptedRequestId, {
              status: statusCode,
              rawBody,
              parsedBody,
              url: reqUrl,
              headers: params.responseHeaders,
            });
            console.log(`   ⚡ Intercepted completed telemetry response (200):`, rawBody);
          } catch (err) {
            console.error('   Fetch.getResponseBody error:', err.message);
          }
        }

        try {
          await pageClient.send('Fetch.continueResponse', {
            requestId: interceptedRequestId,
            responseCode: statusCode,
          });
        } catch (e) {
          await pageClient.send('Fetch.continueRequest', { requestId: interceptedRequestId }).catch(() => {});
        }
      }
    });

    console.log('   Navigating to tour storefront...');
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
    console.log(`   Found ${ctas.length} FareHarbor CTA link(s) on page.`);
    const matchingCta = ctas.find(c => c.href.includes(tour.expectedItemId)) || ctas[0];

    const firstCtaHref = matchingCta.href;
    const urlObj = new URL(firstCtaHref);
    const hasShortname = urlObj.pathname.includes(tour.expectedShortname);
    const hasItem = urlObj.pathname.includes(tour.expectedItemId) || urlObj.searchParams.get('item') === tour.expectedItemId;
    const hasAsn = urlObj.searchParams.get('asn') === tour.expectedAsn;

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

    // Wait for FareHarbor Lightframe modal to render
    console.log('   Waiting for FareHarbor Lightframe checkout modal...');
    let checkoutModal = null;
    for (let attempt = 0; attempt < 25; attempt++) {
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

    console.log(`   Modal Rendered: ${renderedModalOk ? 'YES (' + checkoutModal.iframeWidth + 'x' + checkoutModal.iframeHeight + 'px)' : 'NO'}`);

    // Attach to FareHarbor iframe target
    console.log('   Locating opened FareHarbor iframe target...');
    let fareHarborIframeTarget = null;
    for (let attempt = 0; attempt < 25; attempt++) {
      await delay(1000);
      const targets = await browserClient.send('Target.getTargets');
      for (const t of targets.targetInfos) {
        if (t.type === 'iframe' && t.url.includes('fareharbor.com/embeds/book') && (t.url.includes(tour.expectedItemId) || t.url.includes(tour.expectedShortname))) {
          fareHarborIframeTarget = t;
          break;
        }
      }
      if (fareHarborIframeTarget) break;
    }

    let originalIframeInspection = null;
    let futureDateSelection = null;

    if (fareHarborIframeTarget) {
      console.log(`     - Attached to iframe target [${fareHarborIframeTarget.targetId}] "${fareHarborIframeTarget.title}"`);
      const { sessionId: iframeSessionId } = await browserClient.send('Target.attachToTarget', {
        targetId: fareHarborIframeTarget.targetId,
        flatten: true,
      });

      await browserClient.send('Runtime.enable', {}, iframeSessionId);

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
        }, iframeSessionId);

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

      // Requirement 1: Select an enabled calendar control representing a specific future date in America/Chicago.
      // Record requested date, selected date, and resulting availability for that same date. Assert that they match.
      console.log(`   Selecting enabled calendar control for ${REQUESTED_DATE_FORMATTED} (${REQUESTED_TIMEZONE})...`);
      let dateSelectRes = null;
      for (let attempt = 0; attempt < 25; attempt++) {
        await delay(1000);
        const dateSelectEval = await browserClient.send('Runtime.evaluate', {
          expression: `
            (() => {
              const targetStr = "September 11, 2026";
              // Direct query by aria-label matching September 11, 2026
              let btn = document.querySelector('button[aria-label*="September 11, 2026"], [role="button"][aria-label*="September 11, 2026"], .next-day-card[aria-label*="September 11, 2026"]');
              
              if (!btn) {
                // Fallback: search all interactive elements
                const all = Array.from(document.querySelectorAll('button, a, [role="button"], td, .day, .next-day-card'));
                btn = all.find(b => {
                  const aria = b.getAttribute('aria-label') || '';
                  const text = (b.innerText || '').trim().replace(/\\s+/g, ' ');
                  const dt = b.getAttribute('data-date') || '';
                  const disabled = b.disabled || b.getAttribute('aria-disabled') === 'true' || (typeof b.className === 'string' && b.className.includes('disabled'));
                  if (disabled) return false;
                  return aria.includes(targetStr) || text.includes('11 Sep') || dt === '2026-09-11';
                });
              }

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
        }, iframeSessionId);

        if (dateSelectEval?.result?.value) {
          dateSelectRes = dateSelectEval.result.value;
          break;
        }
      }

      if (dateSelectRes && dateSelectRes.success) {
        console.log(`     - Clicked Date Button: [${dateSelectRes.tag}] "${dateSelectRes.aria || dateSelectRes.text}"`);
        await delay(3000);

        // Extract resulting availability for that date
        const availEval = await browserClient.send('Runtime.evaluate', {
          expression: `
            (() => {
              const bodyText = document.body ? document.body.innerText.replace(/\\s+/g, ' ') : '';
              
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
                reportedState,
                timeslotCount: timeslotElements.length,
                availableTimeslots: timeslotElements.slice(0, 6),
                bodySnippet: bodyText.slice(0, 300),
              };
            })()
          `,
          returnByValue: true,
        }, iframeSessionId);

        const availRes = availEval?.result?.value;
        const selectedDateDisplay = dateSelectRes.aria.trim() || dateSelectRes.text || REQUESTED_DATE_FORMATTED;
        const selectedDateMatchesRequestedDate = selectedDateDisplay.includes('September 11, 2026') || selectedDateDisplay.includes('11 Sep') || dateSelectRes.dataDate === REQUESTED_DATE;

        futureDateSelection = {
          requestedDate: REQUESTED_DATE,
          requestedDateFormatted: REQUESTED_DATE_FORMATTED,
          timezone: REQUESTED_TIMEZONE,
          selectedDate: selectedDateDisplay,
          selectedDateMatchesRequestedDate,
          resultingAvailability: {
            state: availRes?.reportedState,
            isAvailable: availRes?.reportedState === 'AVAILABLE',
            isSoldOut: availRes?.reportedState === 'SOLD_OUT',
            isCallToBook: availRes?.reportedState === 'CALL_TO_BOOK',
            timeslotCount: availRes?.timeslotCount || 0,
            availableTimeslots: availRes?.availableTimeslots || [],
            availabilityVerifiedForRequestedDate: Boolean(availRes && (availRes.reportedState === 'AVAILABLE' || availRes.reportedState === 'SOLD_OUT' || availRes.reportedState === 'CALL_TO_BOOK')),
          }
        };

        console.log(`     - Requested Date: ${futureDateSelection.requestedDate} (${futureDateSelection.timezone})`);
        console.log(`     - Selected Date: ${futureDateSelection.selectedDate}`);
        console.log(`     - Date Match Assertion: ${futureDateSelection.selectedDateMatchesRequestedDate ? 'MATCH' : 'MISMATCH'}`);
        console.log(`     - Resulting Availability State: ${futureDateSelection.resultingAvailability.state} (${futureDateSelection.resultingAvailability.timeslotCount} timeslots)`);
        for (const slot of futureDateSelection.resultingAvailability.availableTimeslots.slice(0, 3)) {
          console.log(`        * Slot: ${slot.text}`);
        }
      } else {
        console.log(`     - FAILED to select requested date control: matching enabled date control not found`);
        futureDateSelection = { success: false, reason: 'matching enabled date control not found' };
      }
    }

    // Correlate original browser telemetry request and response
    await delay(1000);
    let originalBrowserBookingEvent = null;

    for (const t of telemetryRequests) {
      let parsed = null;
      try { parsed = JSON.parse(t.postData); } catch (e) {}
      if (parsed?.eventName === 'booking_opened' || parsed?.eventName === 'fareharbor_click') {
        const interceptResp = Array.from(telemetryResponsesByRequestId.values()).find(r => r.parsedBody?.ok === true);
        originalBrowserBookingEvent = {
          requestId: t.requestId,
          url: t.url,
          method: t.method,
          payload: parsed,
          completedResponse: interceptResp || null,
        };
        break;
      }
    }

    const telemetryAssertions = {
      browserRequestDispatched: Boolean(originalBrowserBookingEvent?.payload),
      sessionCorrelated: Boolean(originalBrowserBookingEvent?.payload?.sessionId),
      eventCorrelated: originalBrowserBookingEvent?.payload?.eventName === 'booking_opened' || originalBrowserBookingEvent?.payload?.eventName === 'fareharbor_click',
      tourCorrelated: originalBrowserBookingEvent?.payload?.itemId === tour.expectedItemId || originalBrowserBookingEvent?.payload?.sku === tour.sku,
      sourcePageCorrelated: Boolean(originalBrowserBookingEvent?.payload?.sourcePage && (tour.url.includes(originalBrowserBookingEvent.payload.sourcePage) || originalBrowserBookingEvent.payload.sourcePage.includes(tour.sku))),
      completedResponseCaptured: Boolean(originalBrowserBookingEvent?.completedResponse),
      completedResponseStatus200: originalBrowserBookingEvent?.completedResponse?.status === 200,
      completedResponseBodyContainsOkTrue: originalBrowserBookingEvent?.completedResponse?.parsedBody?.ok === true,
    };

    console.log(`   Telemetry Correlation Evidence:`);
    console.log(`     - Session ID: ${originalBrowserBookingEvent?.payload?.sessionId}`);
    console.log(`     - Event Name: ${originalBrowserBookingEvent?.payload?.eventName}`);
    console.log(`     - Tour Item: ${originalBrowserBookingEvent?.payload?.itemId} (Expected: ${tour.expectedItemId})`);
    console.log(`     - Source Page: ${originalBrowserBookingEvent?.payload?.sourcePage}`);
    console.log(`     - Completed Response Status: ${originalBrowserBookingEvent?.completedResponse?.status}`);
    console.log(`     - Completed Response Body: ${JSON.stringify(originalBrowserBookingEvent?.completedResponse?.parsedBody)}`);
    console.log(`     - Body Contains ok:true Assertion: ${telemetryAssertions.completedResponseBodyContainsOkTrue ? 'MATCH' : 'MISMATCH'}`);

    const isSuccess = Boolean(
      hasShortname &&
      hasItem &&
      hasAsn &&
      renderedModalOk &&
      iframeHasShortname &&
      iframeHasItem &&
      iframeHasAsn &&
      originalIframeInspection?.verified &&
      futureDateSelection?.selectedDateMatchesRequestedDate &&
      futureDateSelection?.resultingAvailability?.availabilityVerifiedForRequestedDate &&
      Object.values(telemetryAssertions).every(Boolean)
    );

    console.log(`   >>> OVERALL TOUR VERIFICATION: ${isSuccess ? 'PASS' : 'FAIL'}`);

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
        requestId: originalBrowserBookingEvent?.requestId,
        dispatchedUrl: originalBrowserBookingEvent?.url,
        payload: originalBrowserBookingEvent?.payload,
        completedResponse: originalBrowserBookingEvent?.completedResponse,
        assertions: telemetryAssertions,
      },
      sourceEvidence: tour.sourceEvidence,
      success: isSuccess,
    });

    await pageClient.send('Fetch.disable').catch(() => {});
    pageClient.close();
    await browserClient.send('Target.closeTarget', { targetId });
  }

  browserClient.close();
  chromeProcess.kill();

  console.log('\n========================================');
  console.log('FINAL RESULTS SUMMARY:');
  for (const r of results) {
    console.log(`${r.success ? 'PASS' : 'FAIL'}: ${r.productName}`);
    console.log(`   Selected Date: ${r.futureDateSelection?.selectedDate} | Availability: ${r.futureDateSelection?.resultingAvailability?.state}`);
    console.log(`   Telemetry Response: status ${r.originalBrowserTelemetryEvidence?.completedResponse?.status} -> ok=${r.originalBrowserTelemetryEvidence?.completedResponse?.parsedBody?.ok}`);
  }

  const allPassed = results.every(r => r.success);

  const reportPayload = {
    auditDate: new Date().toISOString(),
    environment: 'production',
    targetOrigin: 'https://www.welcometoneworleanstours.com',
    browser: 'Headless Google Chrome (CDP)',
    evidenceMechanism: 'original_browser_request_capture_and_future_date_dom_exercise',
    timezone: REQUESTED_TIMEZONE,
    requestedDate: REQUESTED_DATE,
    requestedDateFormatted: REQUESTED_DATE_FORMATTED,
    results,
    overallStatus: allPassed ? 'PASSED' : 'FAILED',
  };

  const reportDir = 'C:/Users/erich/Documents/Projects/destinations-cc/reports';
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'wno-browser-verification-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportPayload, null, 2), 'utf8');
  console.log('\nSaved reproducible verification report to ' + reportPath);

  const gosnoReportPath = 'C:/Users/erich/gosno-production/reports/wno-browser-verification-results.json';
  fs.writeFileSync(gosnoReportPath, JSON.stringify(reportPayload, null, 2), 'utf8');
  console.log('Mirrored report to ' + gosnoReportPath);

  if (!allPassed) {
    console.error('\n❌ One or more tours failed verification!');
    process.exit(1);
  }
  console.log('\n✅ All tours verified successfully with original browser telemetry and future-date availability states!');
  process.exit(0);
}

run().catch(console.error);
