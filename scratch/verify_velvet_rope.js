const { Redis } = require("@upstash/redis");

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error("❌ Error: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing.");
  console.error("Please run with: node --env-file=.env.local verify_velvet_rope.js");
  process.exit(1);
}

const redis = new Redis({ url, token });
const baseUrl = process.argv.includes("--local") ? "http://localhost:3000" : "https://destinations-cc.vercel.app";

async function runSmokeTest() {
  console.log("🚀 Starting Velvet Rope Pipeline Smoke Test...");
  console.log(`Targeting Monolith Deployment: ${baseUrl}\n`);

  const happeningId = "argo-cablecar-shuttle-9am";
  const happeningTitle = "9AM Shuttle to the Mighty Argo Cable Car";
  const partySize = 2;
  const note = "Tactical code verification transmission.";
  const placeId = "red-rocks-co";
  const price = 35.00;
  const phone = "+15555555555";

  // Step 1: Submit Request Invite payload to the API
  console.log("Step 1: Submitting guest invite transmission payload...");
  const postResponse = await fetch(`${baseUrl}/api/request-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ happeningId, happeningTitle, partySize, note, placeId, price, phone })
  });

  if (!postResponse.ok) {
    throw new Error(`POST /api/request-invite failed with status ${postResponse.status}: ${await postResponse.text()}`);
  }

  const postData = await postResponse.json();
  if (!postData.success || !postData.transmissionId) {
    throw new Error(`POST /api/request-invite returned invalid payload: ${JSON.stringify(postData)}`);
  }

  const txId = postData.transmissionId;
  console.log(`✅ Transmission Secured. TX_ID: ${txId}\n`);

  // Step 2: Retrieve transmission state and confirm 'pending'
  console.log("Step 2: Polling transmission state via GET /api/request-invite...");
  const getResponse = await fetch(`${baseUrl}/api/request-invite?id=${txId}`);
  if (!getResponse.ok) {
    throw new Error(`GET /api/request-invite failed with status ${getResponse.status}`);
  }

  const getData = await getResponse.json();
  if (!getData.success || getData.transmission.status !== "pending") {
    throw new Error(`Expected status to be 'pending', got: ${JSON.stringify(getData)}`);
  }
  if (getData.transmission.phone !== phone) {
    throw new Error(`Expected phone to be '${phone}', got: '${getData.transmission.phone}'`);
  }
  console.log(`✅ State confirmed: PENDING (Phone matched: ${getData.transmission.phone})\n`);

  // Step 3: Simulate Operator Authorization directly in Redis
  console.log("Step 3: Simulating Operator Authorization in Upstash Redis...");
  const redisKey = `invite_req:${txId}`;
  const rawData = await redis.get(redisKey);
  if (!rawData) {
    throw new Error(`Redis key ${redisKey} not found!`);
  }

  const record = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
  const mockCheckoutUrl = `https://checkout.square.site/merchant/MOCK_MERCHANT/checkout/INVITE_PASS?amt=${price}&qty=${partySize}&id=${happeningId}`;
  
  record.status = "AUTHORIZED";
  record.checkoutUrl = mockCheckoutUrl;

  await redis.set(redisKey, JSON.stringify(record));
  console.log(`✅ Redis record updated to AUTHORIZED with Square link.\n`);

  // Step 4: Verify client retrieves AUTHORIZED status and correct payment redirect
  console.log("Step 4: Polling client endpoint again for AUTHORIZED status...");
  const getResponseAuth = await fetch(`${baseUrl}/api/request-invite?id=${txId}`);
  if (!getResponseAuth.ok) {
    throw new Error(`GET /api/request-invite failed with status ${getResponseAuth.status}`);
  }

  const getDataAuth = await getResponseAuth.json();
  if (!getDataAuth.success || getDataAuth.transmission.status !== "AUTHORIZED" || getDataAuth.transmission.checkoutUrl !== mockCheckoutUrl) {
    throw new Error(`Invalid authorized payload state: ${JSON.stringify(getDataAuth)}`);
  }
  console.log(`✅ State confirmed: AUTHORIZED`);
  console.log(`✅ Redirect link matches: ${getDataAuth.transmission.checkoutUrl}\n`);

  // Step 5: Burn transmission (Clean up Redis key)
  console.log("Step 5: Burning transmission (cleaning up DB key)...");
  await redis.del(redisKey);
  
  const getResponseFinal = await fetch(`${baseUrl}/api/request-invite?id=${txId}`);
  if (getResponseFinal.status !== 404) {
    throw new Error(`Expected 404 status after burn, got: ${getResponseFinal.status}`);
  }
  console.log(`✅ Database key purged. Test completed successfully!`);
}

runSmokeTest().catch((err) => {
  console.error("❌ Smoke test failed:", err.message);
  process.exit(1);
});
