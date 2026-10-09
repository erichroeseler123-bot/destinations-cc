export interface Passenger {
  id: number;
  seatLabel: string;
  weightLbs: number;
  row: 'front' | 'rear' | 'pilot';
  position: 'left' | 'center' | 'right' | 'pilot';
}

export interface WeightAnalysisResult {
  passengerCount: number;
  totalPassengerWeight: number;
  pilotWeight: number;
  totalGrossPayload: number; // passenger weight + pilot (200 lbs)
  maxGrossPayload: number; // 1,220 lbs (1,020 lbs pax + 200 lbs pilot)
  hasSurcharge: boolean;
  surchargeCount: number;
  surchargedSeatIds: number[];
  payloadStatus: 'safe' | 'warning' | 'overweight';
  sixthSeatProbability: 'high' | 'medium' | 'low' | 'not-applicable';
  sixthSeatPercent: number;
  cgBalance: {
    lateralOffsetPercent: number; // -50 (full left) to +50 (full right)
    longitudinalOffsetPercent: number; // -50 (forward) to +50 (aft)
    status: 'balanced' | 'slight-deviation' | 'unbalanced';
    description: string;
  };
  strategyRecommendation: string;
}

export const PILOT_WEIGHT_LBS = 200;
export const MAX_PAX_PAYLOAD_LBS = 1020;
export const MAX_GROSS_PAYLOAD_LBS = MAX_PAX_PAYLOAD_LBS + PILOT_WEIGHT_LBS; // 1220 lbs
export const SURCHARGE_THRESHOLD_LBS = 250;

export const DEFAULT_6_PAX_SEATS: Passenger[] = [
  { id: 1, seatLabel: 'Seat 1 (Front Left)', weightLbs: 180, row: 'front', position: 'left' },
  { id: 2, seatLabel: 'Seat 2 (Front Center)', weightLbs: 160, row: 'front', position: 'center' },
  { id: 3, seatLabel: 'Seat 3 (Rear Left)', weightLbs: 190, row: 'rear', position: 'left' },
  { id: 4, seatLabel: 'Seat 4 (Rear Center-Left)', weightLbs: 150, row: 'rear', position: 'center' },
  { id: 5, seatLabel: 'Seat 5 (Rear Center-Right)', weightLbs: 170, row: 'rear', position: 'center' },
  { id: 6, seatLabel: 'Seat 6 (Rear Right)', weightLbs: 140, row: 'rear', position: 'right' },
];

export const PRESET_PROFILES: { label: string; description: string; passengers: Passenger[] }[] = [
  {
    label: 'Balanced Tour (6 Passengers)',
    description: 'Standard mixed adult party showing balanced CG across front and rear rows.',
    passengers: [
      { id: 1, seatLabel: 'Seat 1 (Front Left)', weightLbs: 180, row: 'front', position: 'left' },
      { id: 2, seatLabel: 'Seat 2 (Front Center)', weightLbs: 160, row: 'front', position: 'center' },
      { id: 3, seatLabel: 'Seat 3 (Rear Left)', weightLbs: 190, row: 'rear', position: 'left' },
      { id: 4, seatLabel: 'Seat 4 (Rear Center-Left)', weightLbs: 150, row: 'rear', position: 'center' },
      { id: 5, seatLabel: 'Seat 5 (Rear Center-Right)', weightLbs: 170, row: 'rear', position: 'center' },
      { id: 6, seatLabel: 'Seat 6 (Rear Right)', weightLbs: 140, row: 'rear', position: 'right' },
    ],
  },
  {
    label: 'Light 6-Pax Group (High 6th Seat Unlock)',
    description: 'Sub-900 lb 6-person party that qualifies for direct dispatch manual override.',
    passengers: [
      { id: 1, seatLabel: 'Seat 1 (Front Left)', weightLbs: 140, row: 'front', position: 'left' },
      { id: 2, seatLabel: 'Seat 2 (Front Center)', weightLbs: 130, row: 'front', position: 'center' },
      { id: 3, seatLabel: 'Seat 3 (Rear Left)', weightLbs: 155, row: 'rear', position: 'left' },
      { id: 4, seatLabel: 'Seat 4 (Rear Center-Left)', weightLbs: 125, row: 'rear', position: 'center' },
      { id: 5, seatLabel: 'Seat 5 (Rear Center-Right)', weightLbs: 160, row: 'rear', position: 'center' },
      { id: 6, seatLabel: 'Seat 6 (Rear Right)', weightLbs: 145, row: 'rear', position: 'right' },
    ],
  },
  {
    label: 'Couple (2 Passengers)',
    description: 'Two adult guests flying together (will share departure with other guests).',
    passengers: [
      { id: 1, seatLabel: 'Seat 1 (Front Left)', weightLbs: 185, row: 'front', position: 'left' },
      { id: 2, seatLabel: 'Seat 2 (Front Center)', weightLbs: 145, row: 'front', position: 'center' },
    ],
  },
  {
    label: 'Standard Family (4 Passengers)',
    description: 'Two adults and two teenagers/children well within aircraft limits.',
    passengers: [
      { id: 1, seatLabel: 'Seat 1 (Front Left)', weightLbs: 195, row: 'front', position: 'left' },
      { id: 2, seatLabel: 'Seat 2 (Front Center)', weightLbs: 145, row: 'front', position: 'center' },
      { id: 3, seatLabel: 'Seat 3 (Rear Left)', weightLbs: 125, row: 'rear', position: 'left' },
      { id: 4, seatLabel: 'Seat 4 (Rear Center-Left)', weightLbs: 110, row: 'rear', position: 'center' },
    ],
  },
  {
    label: 'Party with 250lb+ Surcharge Passenger',
    description: 'One passenger triggers the standard operator comfort seat requirement.',
    passengers: [
      { id: 1, seatLabel: 'Seat 1 (Front Left)', weightLbs: 265, row: 'front', position: 'left' },
      { id: 2, seatLabel: 'Seat 2 (Front Center)', weightLbs: 175, row: 'front', position: 'center' },
      { id: 3, seatLabel: 'Seat 3 (Rear Left)', weightLbs: 180, row: 'rear', position: 'left' },
      { id: 4, seatLabel: 'Seat 4 (Rear Center-Left)', weightLbs: 165, row: 'rear', position: 'center' },
    ],
  },
];

export function analyzeHelicopterPayload(passengers: Passenger[]): WeightAnalysisResult {
  const passengerCount = passengers.length;
  const totalPassengerWeight = passengers.reduce((sum, p) => sum + (Number(p.weightLbs) || 0), 0);
  const pilotWeight = PILOT_WEIGHT_LBS;
  const totalGrossPayload = totalPassengerWeight + pilotWeight;
  const maxGrossPayload = MAX_GROSS_PAYLOAD_LBS;

  // 1. Surcharge detection
  const surchargedSeats = passengers.filter(p => (Number(p.weightLbs) || 0) >= SURCHARGE_THRESHOLD_LBS);
  const hasSurcharge = surchargedSeats.length > 0;
  const surchargeCount = surchargedSeats.length;
  const surchargedSeatIds = surchargedSeats.map(p => p.id);

  // 2. Gross payload evaluation
  let payloadStatus: 'safe' | 'warning' | 'overweight' = 'safe';
  if (totalPassengerWeight > MAX_PAX_PAYLOAD_LBS) {
    payloadStatus = 'overweight';
  } else if (totalPassengerWeight > 940) {
    payloadStatus = 'warning';
  }

  // 3. 6th Seat Unlock Probability
  let sixthSeatProbability: 'high' | 'medium' | 'low' | 'not-applicable' = 'not-applicable';
  let sixthSeatPercent = 0;
  if (passengerCount >= 5) {
    if (totalPassengerWeight <= 900) {
      sixthSeatProbability = 'high';
      sixthSeatPercent = Math.min(95, Math.max(75, Math.round(100 - (totalPassengerWeight - 800) * 0.2)));
    } else if (totalPassengerWeight <= 980) {
      sixthSeatProbability = 'medium';
      sixthSeatPercent = Math.min(70, Math.max(35, Math.round(70 - (totalPassengerWeight - 900) * 0.4)));
    } else {
      sixthSeatProbability = 'low';
      sixthSeatPercent = Math.min(30, Math.max(10, Math.round(30 - (totalPassengerWeight - 980) * 0.5)));
    }
  }

  // 4. Center of Gravity (CG) Moment Math (AStar AS350 representation)
  // Pilot is at Front Right: x = +0.5, y = +0.6
  // Seat 1: Front Left: x = -0.7, y = +0.6
  // Seat 2: Front Center: x = -0.1, y = +0.6
  // Seat 3: Rear Left: x = -0.8, y = -0.6
  // Seat 4: Rear Center-Left: x = -0.27, y = -0.6
  // Seat 5: Rear Center-Right: x = +0.27, y = -0.6
  // Seat 6: Rear Right: x = +0.8, y = -0.6
  let momentX = pilotWeight * 0.5; // Pilot weight moment
  let momentY = pilotWeight * 0.6;
  let totalMomentWeight = pilotWeight;

  passengers.forEach(p => {
    const w = Number(p.weightLbs) || 0;
    if (w <= 0) return;
    totalMomentWeight += w;

    if (p.id === 1) { momentX += w * -0.7; momentY += w * 0.6; }
    else if (p.id === 2) { momentX += w * -0.1; momentY += w * 0.6; }
    else if (p.id === 3) { momentX += w * -0.8; momentY += w * -0.6; }
    else if (p.id === 4) { momentX += w * -0.27; momentY += w * -0.6; }
    else if (p.id === 5) { momentX += w * +0.27; momentY += w * -0.6; }
    else if (p.id === 6) { momentX += w * +0.8; momentY += w * -0.6; }
  });

  const lateralArm = totalMomentWeight > 0 ? momentX / totalMomentWeight : 0;
  const longitudinalArm = totalMomentWeight > 0 ? momentY / totalMomentWeight : 0;

  // Normalized percentage offset for visual crosshair (-35% to +35%)
  const lateralOffsetPercent = Math.max(-45, Math.min(45, lateralArm * 38));
  const longitudinalOffsetPercent = Math.max(-45, Math.min(45, -longitudinalArm * 35));

  let cgStatus: 'balanced' | 'slight-deviation' | 'unbalanced' = 'balanced';
  let cgDescription = 'Weight & balance centers efficiently within structural limits.';

  const cgRadius = Math.sqrt(lateralOffsetPercent * lateralOffsetPercent + longitudinalOffsetPercent * longitudinalOffsetPercent);
  if (cgRadius > 25) {
    cgStatus = 'unbalanced';
    cgDescription = 'Center of gravity deviates from ideal envelope. Ground crew ramp lead will reposition passenger seating prior to boarding.';
  } else if (cgRadius > 14) {
    cgStatus = 'slight-deviation';
    cgDescription = 'Acceptable operational variance. Dispatch software will balance fuel load to counter seating asymmetry.';
  }

  // 5. Strategy recommendation
  let strategyRecommendation = 'Your group fits cleanly within a standard single-aircraft booking envelope.';

  if (payloadStatus === 'overweight') {
    strategyRecommendation = `⚠️ Combined party weight (${totalPassengerWeight} lbs) exceeds single-aircraft safety margins for Juneau Icefield mountain hover limits (1,020 lbs). Your party should be split across dual departures or booked as a multi-aircraft flight.`;
  } else if (passengerCount === 6 && sixthSeatProbability === 'high') {
    strategyRecommendation = `✨ High Unlock Probability (${sixthSeatPercent}%): Because your 6-person party is exceptionally light (${totalPassengerWeight} lbs total, well below the 920 lb ceiling), dispatchers can safely override the 5-passenger online web block. Submit an availability request or call dispatch to release the 6th seat.`;
  } else if (hasSurcharge) {
    strategyRecommendation = `⚠️ Surcharge Notice: ${surchargeCount} guest(s) exceed 250 lbs fully clothed. Alaska FAA Part 135 operators require purchasing an additional comfort seat (or 50%–100% surcharge) to ensure lateral center of gravity limits remain compliant.`;
  } else if (passengerCount >= 5 && sixthSeatProbability === 'low') {
    strategyRecommendation = `ℹ️ Group Payload Notice: Your group is approaching the structural mountain payload ceiling (${totalPassengerWeight} lbs). Standard online systems will lock out the 6th seat, and dispatch will likely split your party across two staggered aircraft for safety.`;
  } else if (payloadStatus === 'warning') {
    strategyRecommendation = `⚠️ Approaching Mountain Payload Margin: At ${totalPassengerWeight} lbs, your group is close to maximum gross weight under warm summer weather conditions (density altitude). Dispatch will monitor fuel burns closely.`;
  }

  return {
    passengerCount,
    totalPassengerWeight,
    pilotWeight,
    totalGrossPayload,
    maxGrossPayload,
    hasSurcharge,
    surchargeCount,
    surchargedSeatIds,
    payloadStatus,
    sixthSeatProbability,
    sixthSeatPercent,
    cgBalance: {
      lateralOffsetPercent,
      longitudinalOffsetPercent,
      status: cgStatus,
      description: cgDescription,
    },
    strategyRecommendation,
  };
}
