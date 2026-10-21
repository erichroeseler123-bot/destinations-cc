import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FAMILY_TOURS } from '../lib/familyTours.ts';
import { buildFamilySnapshot, FAMILY_SNAPSHOT_DATE } from '../lib/familySnapshot.ts';
const snapshot=buildFamilySnapshot(FAMILY_TOURS);
assert.deepEqual(snapshot.counts,{products:6,operatorBrands:5,allAges:1,minimumAge:2,minimumHeight:2,noVerifiedAgeOrHeight:1,hotelTransportOptions:5,centralTransport:1});
assert.deepEqual(snapshot,JSON.parse(fs.readFileSync(new URL('../public/data/swamp-tour-published-rules.json',import.meta.url),'utf8')));
for(const [i,tour] of FAMILY_TOURS.entries())for(const [key,fact] of Object.entries(tour.facts)) {
 const published=snapshot.products[i].facts[key];assert.deepEqual(published,fact);assert.equal(published.checkedOn,fact.checkedOn);
 if(fact.status==='unknown'){assert.equal(published.value,null);assert.equal(published.checkedOn,null);}
}
const edited=structuredClone(FAMILY_TOURS);edited[0].facts.minAge.checkedOn='2026-10-20';const changed=buildFamilySnapshot(edited);assert.equal(changed.compilationSnapshotDate,FAMILY_SNAPSHOT_DATE);assert.equal(changed.products[0].facts.minAge.checkedOn,'2026-10-20');assert.equal(changed.products[0].facts.pickup.checkedOn,FAMILY_TOURS[0].facts.pickup.checkedOn);
console.log('Snapshot counts, downloadable/source parity, null unknowns, and independent fact dates passed.');
