async function verifyProd() {
  console.log('=== TEST 1: Live Production Search API ===');
  const res = await fetch('https://welcometotheswamp.com/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      travelDate: '2026-10-08',
      adults: 2,
      childrenAges: [],
      transportation: 'hotel_pickup',
      boatType: 'small_airboat',
      preferredTimeWindow: 'afternoon'
    })
  });
  const data = await res.json();
  console.log('Search Status:', res.status, 'OK:', data.ok);
  const win = data.data?.winningDeparture;
  console.log('Winning Departure Live in Production:');
  console.log('  Time:', win?.departureTimeDisplay);
  console.log('  Operator:', win?.operatorName);
  console.log('  Title:', win?.title);
  console.log('  Price Per Adult:', '$' + win?.pricePerAdult);
  console.log('  Group Total:', '$' + win?.totalPrice);
  console.log('  Pickup Window Display:', win?.pickupWindowDisplay);
  console.log('  Max Capacity:', win?.maxPartySize);

  console.log('\n=== TEST 2: Live Production Tour Page Embed ===');
  const tourPageRes = await fetch('https://welcometotheswamp.com/tours/airboat-tour');
  const html = await tourPageRes.text();
  console.log('Tour Page Status:', tourPageRes.status);
  console.log('Contains Item 228524:', html.includes('228524'));
  console.log('Contains FareHarbor embed:', html.includes('fareharbor.com/embeds/'));
  const match = html.match(/src="(https:\/\/fareharbor\.com\/embeds\/[^"]+)"/);
  if (match) {
    console.log('Embedded iframe src:', match[1]);
  }
}

verifyProd().catch(console.error);
