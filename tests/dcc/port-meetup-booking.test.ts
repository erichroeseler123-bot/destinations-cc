import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { resolvePortMeetupForShipCall, evaluateDepartureScheduleFit, upsertMeetupAttendanceParty, removeMeetupAttendanceParty } from '../../lib/dcc/portMeetups/meetupEngine';
import { clearInMemoryPortMeetupStoreForTests, readMeetupParties, hashOpaquePartyToken, isDccPortMeetupPilotEnabled } from '../../lib/dcc/portMeetups/meetupStore';
import { VERIFIED_SHIP_PORT_CALLS, VERIFIED_OPERATOR_MEETUP_PRODUCTS } from '../../lib/dcc/portMeetups/portCallRegistry';
import type { RezgoReadOnlyInspectionResult, RezgoInspectedItemSummary } from '../../lib/dcc/liveSlots/rezgoReadOnly';
import { GET, POST } from '../../app/api/v1/cruise/port-meetups/route';

process.env.DCC_ISOLATED_TEST_DB = '1';
process.env.VERCEL_ENV = 'preview';
const call = VERIFIED_SHIP_PORT_CALLS[0];
const product = VERIFIED_OPERATOR_MEETUP_PRODUCTS['juneau-tours-whale-watch::31703'];
const lookup = { physicalSailingId: call.physicalSailingId, portSlug: 'juneau' };
const token = 'test_party_0123456789abcdefghijk';
function option(uid: string, seats: number|null, time='09:30'): RezgoInspectedItemSummary {
  return {uid,com:'31703',itemName:'Juneau Whale Watch Tour',optionName:time,duration:'3–3.5 hours',adultPrice:'155.00',childPrice:'135.00',currency:'USD',startingLocation:'Goldbelt Tramway',departureTime:time,searchDateChecked:'2027-05-18',dateSlots:[{date:'2027-05-18',departureTime:time,availableSpots:seats,maxAvailability:40,adultPrice:'155.00',childPrice:'135.00',seniorPrice:null,active:true}]};
}
function feed(items: RezgoInspectedItemSummary[]): RezgoReadOnlyInspectionResult {
  return {ok:true,readOnly:true,mutatedRemoteState:false,isolatedSecondaryProperty:true,checkedAt:new Date().toISOString(),searchDate:'2027-05-18',status:'inspected_ok',companyName:'Juneau Tours & Whale Watch',domain:'juneauwhalewatch.rezgo.com',currency:'USD',itemsCount:items.length,items,errorMessage:null};
}
beforeEach(()=>clearInMemoryPortMeetupStoreForTests());

test('schedule accounts for disembarking, check-in, upper return duration, berth transfer and two-hour cutoff',()=>{
  assert.equal(evaluateDepartureScheduleFit({call,product,departureTime24:'08:30'}).fits,false);
  const fit=evaluateDepartureScheduleFit({call,product,departureTime24:'09:30'});
  assert.equal(fit.fits,true);
  assert.equal(fit.evaluation.checkInTime24,'09:15');
  assert.equal(fit.evaluation.latestBackAtShipBerthTime24,'13:20');
  assert.equal(fit.evaluation.safetyCutoffAtBerthTime24,'18:45');
  assert.equal(fit.evaluation.usableFreeAfternoonMinutes,325);
  assert.equal(fit.evaluation.allAboardSource,'modeled');
  assert.equal(evaluateDepartureScheduleFit({call,product,departureTime24:'16:00'}).fits,false);
});

test('whole party must fit one option; low inventory never moves the 09:30 anchor',async()=>{
  const result=(await resolvePortMeetupForShipCall({...lookup,partySize:4,rezgoInspectionOverride:feed([option('1',2),option('2',2),option('3',10,'10:30')])}))!;
  assert.equal(result.schedule.departureTime24,'09:30');
  assert.equal(result.liveInventory.bookableSeatsInSingleOption,2);
  assert.equal(result.liveInventory.partyFitsSingleOption,false);
  assert.equal(result.liveInventory.directBookingUrl,null);
  assert.equal(result.overflowCandidate?.departureTime24,'10:30');
});

test('additional same-time option restores booking without changing the meetup identity',async()=>{
  const closed=(await resolvePortMeetupForShipCall({...lookup,partySize:4,rezgoInspectionOverride:feed([option('1',0)])}))!;
  const open=(await resolvePortMeetupForShipCall({...lookup,partySize:4,rezgoInspectionOverride:feed([option('1',0),option('2',4)])}))!;
  assert.equal(closed.liveInventory.state,'sold_out');
  assert.equal(open.meetupKey,closed.meetupKey);
  assert.equal(open.liveInventory.chosenOptionUid,'2');
  const url=new URL(open.liveInventory.directBookingUrl!);
  assert.equal(url.hostname,'juneauwhalewatch.rezgo.com');
  assert.match(url.pathname,/\/31703\/.*\/2\/2027-05-18$/);
  assert.equal(url.searchParams.get('refid'),'dccjuneau10');
  assert.equal(url.searchParams.has('adult_num'),false);
});

test('unknown seats, expired inventory, wrong dates and inactive slots never become a sellout or fresh price',async()=>{
  const wrong=option('2',38); wrong.dateSlots![0].date='2027-05-19';
  const inactive=option('3',38); inactive.dateSlots![0].active=false;
  const expired=feed([option('4',38)]); expired.checkedAt=new Date(Date.now()-360_000).toISOString();
  const wrongSearch=feed([option('5',38)]);wrongSearch.searchDate='2027-05-19';
  for(const f of [feed([option('1',null)]),feed([option('1',0),option('2',null)]),feed([wrong]),feed([inactive]),expired,wrongSearch,null]){
    const r=(await resolvePortMeetupForShipCall({...lookup,rezgoInspectionOverride:f}))!;
    assert.equal(r.liveInventory.state,'availability_stale');
    assert.equal(r.liveInventory.bookableSeatsInSingleOption,null);
    assert.equal(r.liveInventory.adultPriceUsd,null);
  }
});

test('one browser party edits and removes the same shared headcount across hosted and physical pages',async()=>{
  const f=feed([option('1',38)]);
  const first=(await upsertMeetupAttendanceParty({...lookup,partyToken:token,status:'planning',partySize:4,sourceSurface:'hosted_sailing',rezgoInspectionOverride:f}))!;
  const edit=(await upsertMeetupAttendanceParty({...lookup,partyToken:token,status:'reported_booked',partySize:3,sourceSurface:'physical_sailing',rezgoInspectionOverride:f}))!;
  assert.equal(first.attendance.planningTravelersCount,4);
  assert.equal(edit.attendance.totalCoordinatingPartiesCount,1);
  assert.equal(edit.attendance.planningTravelersCount,0);
  assert.equal(edit.attendance.reportedBookedTravelersCount,3);
  assert.equal(edit.liveInventory.bookableSeatsInSingleOption,38);
  assert.equal(edit.attendance.viewerParty?.partySize,3);
  const stored=await readMeetupParties(first.meetupKey);
  assert.equal(stored[0].partyId,hashOpaquePartyToken(token));
  assert.doesNotMatch(JSON.stringify(stored),new RegExp(token));
  const removed=(await removeMeetupAttendanceParty({...lookup,partyToken:token,rezgoInspectionOverride:f}))!;
  assert.equal(removed.attendance.totalCoordinatingTravelersCount,0);
  assert.equal(removed.attendance.viewerParty,null);
});

test('simultaneous different parties retain independent rows',async()=>{
  const f=feed([option('1',38)]);
  await Promise.all(Array.from({length:10},(_,i)=>upsertMeetupAttendanceParty({...lookup,partyToken:`${token}_${i}`,status:'planning',partySize:2,rezgoInspectionOverride:f})));
  const r=(await resolvePortMeetupForShipCall({...lookup,rezgoInspectionOverride:f}))!;
  assert.equal(r.attendance.planningPartiesCount,10);
  assert.equal(r.attendance.planningTravelersCount,20);
  assert.equal(r.liveInventory.bookableSeatsInSingleOption,38);
});

test('public API rejects alert actions, simulations, arbitrary fields and URL tokens',async()=>{
  for(const key of ['email','partyToken','namespace','simulate','cabinNumber']){
    assert.equal((await GET(new Request(`https://destinationcommandcenter.com/api/v1/cruise/port-meetups?${key}=x`))).status,400);
  }
  for(const extra of [{action:'join_waitlist'},{action:'run_monitor'},{action:'upsert_attendance',email:'x@example.test'},{action:'upsert_attendance',partySize:0},{action:'upsert_attendance',status:'operator_confirmed'}]){
    const response=await POST(new Request('https://destinationcommandcenter.com/api/v1/cruise/port-meetups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...lookup,partyToken:token,status:'planning',partySize:2,...extra})}));
    assert.equal(response.status,400);
  }
});

test('pilot has an explicit rollback switch and unknown sailings never get a forced match',async()=>{
  assert.equal(isDccPortMeetupPilotEnabled({ENABLE_PORT_MEETUP_PILOT:'false'}),false);
  assert.equal(isDccPortMeetupPilotEnabled({VERCEL_ENV:'production'}),true);
  assert.equal(await resolvePortMeetupForShipCall({shipSlug:'unknown',sailDate:'2027-05-15',rezgoInspectionOverride:null}),null);
});
