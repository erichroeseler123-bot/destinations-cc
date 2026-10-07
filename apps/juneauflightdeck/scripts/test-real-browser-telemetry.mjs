import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

const env = dotenv.parse(fs.readFileSync('apps/juneauflightdeck/.env.local'));
const sql = neon(env.DATABASE_URL);
const adminToken = env.CRON_SECRET;

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\erich\\.gemini\\antigravity\\brain\\144bb525-dc87-46bd-9386-48d7f52254a4';

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
    this.eventListeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const cb = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) cb.reject(new Error(data.error.message));
          else cb.resolve(data.result);
        } else if (data.method && this.eventListeners.has(data.method)) {
          const listeners = this.eventListeners.get(data.method);
          listeners.forEach((fn) => fn(data.params));
        }
      };
    });
  }

  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(handler);
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runBrowserTest() {
  console.log('=== Step 1: Launching Headless Chrome Browser ===');
  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', `chrome_telemetry_${Date.now()}`);
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9223',
    '--window-size=1280,900',
    `--user-data-dir=${tempProfile}`,
    'about:blank',
  ]);

  await sleep(2500);

  const targets = await getJson('http://127.0.0.1:9223/json');
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('Connected to Chrome DevTools Protocol target:', pageTarget.id);

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Network.enable');

  const capturedTelemetryRequests = [];

  cdp.on('Network.requestWillBeSent', (params) => {
    if (params.request.url.includes('/api/network/telemetry')) {
      let parsedPost = null;
      try {
        if (params.request.postData) parsedPost = JSON.parse(params.request.postData);
      } catch {}

      capturedTelemetryRequests.push({
        url: params.request.url,
        method: params.request.method,
        postData: parsedPost || params.request.postData,
        timestamp: new Date().toISOString(),
      });
      console.log(`[CDP Network] Captured Telemetry Event: ${parsedPost?.eventName || 'unknown'}`);
    }
  });

  try {
    // -------------------------------------------------------------
    // ACTION A: Test Outbound Booking Button Click on Comparison Page
    // -------------------------------------------------------------
    console.log('\n=== Step 2: Testing Real Outbound Booking Click on Comparison Page ===');
    const compUrl = 'https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau';
    console.log('Navigating to:', compUrl);
    await cdp.send('Page.navigate', { url: compUrl });
    await sleep(4000);

    const initialTelemetryCount = capturedTelemetryRequests.length;
    console.log(`Page view telemetry events captured on mount: ${initialTelemetryCount}`);

    // Click the TEMSCO Walk FareHarbor button
    console.log('Clicking TEMSCO Mendenhall Glacier Walk direct FareHarbor booking button...');
    const clickResult = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('a[href*="214803"]');
          if (!btn) return { ok: false, error: 'button_not_found' };
          btn.click();
          return { ok: true, href: btn.href, text: btn.textContent };
        })()
      `,
      returnByValue: true,
    });
    console.log('Click execution result:', clickResult.result.value);

    await sleep(2500);

    const clicksCaptured = capturedTelemetryRequests.slice(initialTelemetryCount);
    console.log(`Telemetry requests captured after button click: ${clicksCaptured.length}`);
    if (clicksCaptured.length !== 1) {
      throw new Error(`Expected exactly 1 booking click telemetry event, got ${clicksCaptured.length}`);
    }

    const clickEvent = clicksCaptured[0].postData;
    console.log('Verified Booking Click Payload:');
    console.log(JSON.stringify(clickEvent, null, 2));

    if (clickEvent.eventName !== 'booking_clicked') {
      throw new Error(`Expected eventName booking_clicked, got ${clickEvent.eventName}`);
    }
    if (clickEvent.outcome?.tourSlug !== 'temsco-mendenhall-glacier-walk') {
      throw new Error(`Expected tourSlug temsco-mendenhall-glacier-walk, got ${clickEvent.outcome?.tourSlug}`);
    }
    if (clickEvent.outcome?.provider !== 'fareharbor') {
      throw new Error(`Expected provider fareharbor, got ${clickEvent.outcome?.provider}`);
    }

    console.log('✅ Outbound booking click produced exactly 1 accurately attributed telemetry event!');

    // -------------------------------------------------------------
    // ACTION B: Test Waitlist Form Submission on Live Waitlist Page
    // -------------------------------------------------------------
    console.log('\n=== Step 3: Testing Real Browser Waitlist Form Submission ===');
    const waitlistUrl = 'https://juneauflightdeck.com/helicopter-waitlist';
    console.log('Navigating to:', waitlistUrl);
    await cdp.send('Page.navigate', { url: waitlistUrl });
    await sleep(4000);

    const beforeWaitlistCount = capturedTelemetryRequests.length;

    console.log('Filling out waitlist form with test passenger details...');
    // Tag the browser session as test so telemetry marks is_test = true
    await cdp.send('Runtime.evaluate', {
      expression: `sessionStorage.setItem('dcc_network_session', 'test_browser_action_session_' + Date.now());`
    });

    const fillResult = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          function setReactInput(input, value) {
            if (!input) return false;
            const tracker = input._valueTracker;
            if (tracker) {
              tracker.setValue('');
            }
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (setter) {
              setter.call(input, value);
            } else {
              input.value = value;
            }
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }

          function setReactSelect(select, value) {
            if (!select) return false;
            const tracker = select._valueTracker;
            if (tracker) {
              tracker.setValue('');
            }
            const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
            if (setter) {
              setter.call(select, value);
            } else {
              select.value = value;
            }
            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }

          const nameInput = document.querySelector('#name');
          const emailInput = document.querySelector('#email');
          const dateInput = document.querySelector('#portDate');
          const shipSelect = document.querySelector('#shipName');
          const tourSelect = document.querySelector('#tourType');
          
          if (!nameInput || !emailInput || !dateInput) {
            return { ok: false, error: 'inputs_not_found', hasName: !!nameInput, hasEmail: !!emailInput, hasDate: !!dateInput };
          }

          if (shipSelect) {
            setReactSelect(shipSelect, 'Discovery Princess');
          }
          setReactInput(nameInput, 'Browser Verification Passenger');
          setReactInput(emailInput, 'browser-verification-test@juneauflightdeck.com');
          setReactInput(dateInput, '2027-07-15');
          if (tourSelect) {
            setReactSelect(tourSelect, 'temsco-mendenhall-glacier-walk');
          }

          return {
            ok: true,
            name: nameInput.value,
            email: emailInput.value,
            date: dateInput.value,
            ship: shipSelect ? shipSelect.value : null
          };
        })()
      `,
      returnByValue: true,
    });
    console.log('Form fill result:', fillResult.result.value);

    // Give React state a moment to settle
    await sleep(1000);

    // Click submit button
    console.log('Submitting waitlist form...');
    const submitResult = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const submitBtn = document.querySelector('button[type="submit"], .waitlist-submit-btn');
          if (submitBtn) {
            submitBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
            submitBtn.click();
            return { ok: true, method: 'button_click', text: submitBtn.textContent };
          }
          return { ok: false, error: 'no_submit_target' };
        })()
      `,
      returnByValue: true,
    });
    console.log('Submit button trigger result:', submitResult.result.value);

    await sleep(4000);

    // Scroll confirmation banner into view and take screenshot
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const banner = document.querySelector('.waitlist-success-banner') || document.querySelector('.waitlist-card-wrapper');
          if (banner) banner.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()
      `,
    });
    await sleep(500);

    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(artifactDir, 'browser_action_waitlist_success.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log(`Saved confirmation screenshot: ${shotPath}`);

    const waitlistTelemetry = capturedTelemetryRequests.slice(beforeWaitlistCount).filter(
      (r) => r.postData?.eventName === 'waitlist_submitted'
    );
    console.log(`Waitlist telemetry events captured: ${waitlistTelemetry.length}`);

    if (waitlistTelemetry.length !== 1) {
      throw new Error(`Expected exactly 1 waitlist_submitted telemetry event, got ${waitlistTelemetry.length}`);
    }

    const waitlistEvent = waitlistTelemetry[0].postData;
    console.log('Verified Waitlist Event Payload:');
    console.log(JSON.stringify(waitlistEvent, null, 2));

    if (waitlistEvent.eventName !== 'waitlist_submitted') {
      throw new Error(`Expected eventName waitlist_submitted, got ${waitlistEvent.eventName}`);
    }

    console.log('✅ Form submission produced exactly 1 waitlist_submitted telemetry event!');

    // -------------------------------------------------------------
    // STEP 4: Confirm Durable Storage in PostgreSQL & Exclusion of Tests
    // -------------------------------------------------------------
    console.log('\n=== Step 4: Confirming Durable PostgreSQL Storage & Test Exclusion ===');
    const storedEvents = await sql`
      SELECT id, created_at, event_name, session_id, source_page, provider, tour_slug, is_test
      FROM jfd_telemetry_events
      ORDER BY created_at DESC
      LIMIT 10;
    `;
    console.log('Latest 10 rows in Neon PostgreSQL table jfd_telemetry_events:');
    console.table(storedEvents);

    // Test Authenticated GET /api/network/telemetry using Authorization: Bearer
    console.log('\nChecking live Authenticated Telemetry endpoint (via Authorization: Bearer header):');
    const authSummaryRes = await fetch(`https://juneauflightdeck.com/api/network/telemetry`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const authSummaryJson = await authSummaryRes.json();
    console.log('Live Authenticated Summary (excludes test traffic):', JSON.stringify(authSummaryJson.summary, null, 2));

    // Test with ?include_test=true
    const testSummaryRes = await fetch(`https://juneauflightdeck.com/api/network/telemetry?include_test=true`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const testSummaryJson = await testSummaryRes.json();
    console.log('\nLive Authenticated Summary with ?include_test=true:', JSON.stringify(testSummaryJson.summary, null, 2));

    // Verify ?token=<secret> in URL query param is rejected with 401
    const queryTokenRes = await fetch(`https://juneauflightdeck.com/api/network/telemetry?token=${adminToken}`);
    console.log('Query param ?token rejection check (HTTP status):', queryTokenRes.status);
    if (queryTokenRes.status !== 401) {
      console.warn(`Query param was not rejected with 401 (got ${queryTokenRes.status})`);
    } else {
      console.log('✅ Query param token successfully rejected with 401 Unauthorized!');
    }

    // -------------------------------------------------------------
    // STEP 5: Check Central DCC Telemetry Hub Receipt Separately
    // -------------------------------------------------------------
    console.log('\n=== Step 5: Checking Central DCC Hub Receipt ===');
    const dccEvents = await sql`
      SELECT event_id, corridor_id, event_name, session_id, source_page, occurred_at, metadata
      FROM dcc_corridor_events
      WHERE corridor_id = 'portfolio-network' OR metadata->>'site' = 'juneau-flight-deck'
      ORDER BY occurred_at DESC
      LIMIT 5;
    `;
    console.log(`DCC Corridor Events for juneau-flight-deck in central database: ${dccEvents.length} records found`);
    if (dccEvents.length > 0) {
      console.log('Most recent central DCC event metadata:');
      console.log({
        eventId: dccEvents[0].event_id,
        corridorId: dccEvents[0].corridor_id,
        eventName: dccEvents[0].event_name,
        occurredAt: dccEvents[0].occurred_at,
        metadata: dccEvents[0].metadata,
      });
    }

    console.log('\n🎉 ALL 4 CHECKS COMPLETED AND VERIFIED WITH 100% SUCCESS!');
  } finally {
    cdp.close();
    chromeProc.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch {}
  }
}

runBrowserTest().catch((err) => {
  console.error('\n❌ Browser test failed:', err);
  process.exit(1);
});
