async function pollAndVerify() {
  console.log("Checking Vercel production deployment on juneauflightdeck.com...");
  const dogSledUrl = "https://juneauflightdeck.com/juneau-dogsled-helicopter-tours";
  const homeUrl = "https://juneauflightdeck.com/";
  const waitlistAdminUrl = "https://juneauflightdeck.com/api/waitlist/admin";
  const waitlistPostUrl = "https://juneauflightdeck.com/api/waitlist";

  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    try {
      const res = await fetch(dogSledUrl, {
        headers: { "User-Agent": "Mozilla/5.0", "Cache-Control": "no-cache" },
      });
      const text = await res.text();
      const hasNewTitle = text.includes("No Juneau helicopter tours currently returned by our search");
      console.log(`Poll ${i + 1}: New title live on /juneau-dogsled-helicopter-tours? ${hasNewTitle}`);
      if (hasNewTitle) break;
    } catch (e) {
      console.log("Poll error:", e.message);
    }
  }

  // Check home page
  const homeRes = await fetch(homeUrl, {
    headers: { "User-Agent": "Mozilla/5.0", "Cache-Control": "no-cache" },
  });
  const homeHtml = await homeRes.text();
  const homeHasNewTitle = homeHtml.includes("No Juneau helicopter tours currently returned by our search");
  console.log("New title live on homepage (/)?", homeHasNewTitle);

  // Now submit live test availability alert to production!
  console.log("\n--- SUBMITTING LIVE PRODUCTION AVAILABILITY ALERT ---");
  const alertPayload = {
    name: "Production Verification Party",
    email: "prod.verification.test@juneauflightdeck.com",
    phone: "(907) 555-0199",
    cruiseLine: "Princess Cruises",
    shipName: "Discovery Princess",
    portCity: "juneau",
    portDate: "2027-07-28",
    juneauDate: "2027-07-28",
    tourType: "dog_sledding",
    partySize: 2,
    bookingMode: "instant_alert",
    notes: "Production verification test alert",
  };

  const postRes = await fetch(waitlistPostUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
    },
    body: JSON.stringify(alertPayload),
  });

  console.log(`Production POST status: ${postRes.status} ${postRes.statusText}`);
  const postData = await postRes.json();
  console.log("Production POST response:", JSON.stringify(postData, null, 2));

  // Now check waitlist admin & run scanner sweep on production!
  console.log("\n--- TRIGGERING LIVE PRODUCTION SCANNER SWEEP ---");
  const sweepRes = await fetch(`${waitlistAdminUrl}?action=sweep`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  console.log(`Production sweep status: ${sweepRes.status} ${sweepRes.statusText}`);
  const sweepData = await sweepRes.json();
  console.log("Production sweep response:", JSON.stringify(sweepData, null, 2));
}

pollAndVerify().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
