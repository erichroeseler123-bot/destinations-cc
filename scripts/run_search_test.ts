import { searchNextAirboatDepartures } from '../apps/welcometotheswamp/lib/searchEngine';
import { getTodayNewOrleansDate, getTomorrowNewOrleansDate } from '../apps/welcometotheswamp/lib/timezone';

async function testSearch(date: string, adults: number, transportation: 'hotel_pickup' | 'self_drive' | 'either') {
  console.log(`\n======================================================`);
  console.log(`TEST: Date=${date} | Adults=${adults} | Transport=${transportation}`);
  console.log(`======================================================`);

  const result = await searchNextAirboatDepartures({
    travelDate: date,
    adults,
    childrenAges: [],
    transportation,
    boatType: 'any',
    preferredTimeWindow: 'any',
  });

  console.log('Result State:', result.state);
  console.log('Summary:', result.summaryMessage);
  if (result.winningDeparture) {
    const win = result.winningDeparture;
    console.log('Winning Departure:');
    console.log('  Time:', win.departureTimeDisplay);
    console.log('  Operator:', win.operatorName);
    console.log('  Title:', win.title);
    console.log('  Availability Type:', win.availabilityType);
    console.log('  Price Per Adult (Base):', '$' + win.pricePerAdult);
    console.log('  Group Total (Base):', '$' + win.totalPrice);
    console.log('  Pickup Window Display:', win.pickupWindowDisplay || 'N/A (Self-drive: dock arrival ' + win.dockArrivalTimeDisplay + ')');
    console.log('  Booking URL:', win.bookingUrl);
  }
}

async function run() {
  const tomorrow = getTomorrowNewOrleansDate();

  // Test 1: Tomorrow 2 PM Ragin Cajun with Hotel Pickup
  console.log(`\n======================================================`);
  console.log(`TEST: Ragin Cajun Small Airboat (Hotel Pickup, Afternoon / 2 PM)`);
  console.log(`======================================================`);
  const pickupRes = await searchNextAirboatDepartures({
    travelDate: tomorrow,
    adults: 2,
    childrenAges: [],
    transportation: 'hotel_pickup',
    boatType: 'small_airboat',
    preferredTimeWindow: 'afternoon',
  });
  const winP = pickupRes.winningDeparture;
  console.log('Result:', {
    time: winP?.departureTimeDisplay,
    operator: winP?.operatorName,
    title: winP?.title,
    basePerPerson: '$' + winP?.pricePerAdult,
    baseTotal: '$' + winP?.totalPrice,
    pickupNotice: winP?.pickupWindowDisplay,
    url: winP?.bookingUrl,
  });

  // Test 2: Tomorrow 2 PM Ragin Cajun Self-Drive
  console.log(`\n======================================================`);
  console.log(`TEST: Ragin Cajun Small Airboat (Self-Drive, Afternoon / 2 PM)`);
  console.log(`======================================================`);
  const driveRes = await searchNextAirboatDepartures({
    travelDate: tomorrow,
    adults: 2,
    childrenAges: [],
    transportation: 'self_drive',
    boatType: 'small_airboat',
    preferredTimeWindow: 'afternoon',
  });
  const winD = driveRes.winningDeparture;
  console.log('Result:', {
    time: winD?.departureTimeDisplay,
    operator: winD?.operatorName,
    title: winD?.title,
    basePerPerson: '$' + winD?.pricePerAdult,
    baseTotal: '$' + winD?.totalPrice,
    dockArrival: winD?.dockArrivalTimeDisplay,
    url: winD?.bookingUrl,
  });
}

run();
