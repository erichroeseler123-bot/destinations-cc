// Manual export only. No network requests or automatic operator refresh.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FAMILY_TOURS } from '../lib/familyTours.ts';
import { buildFamilySnapshot } from '../lib/familySnapshot.ts';
const output=fileURLToPath(new URL('../public/data/swamp-tour-published-rules.json',import.meta.url));
const expected=JSON.stringify(buildFamilySnapshot(FAMILY_TOURS),null,2)+'\n';
if(process.argv.includes('--check')) {
  if(!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==expected)throw new Error('Published snapshot differs from editorial records. Review the compilation date and regenerate manually.');
  console.log('Published snapshot matches source facts; individual dates and unknowns preserved.');
} else {fs.mkdirSync(fileURLToPath(new URL('../public/data/',import.meta.url)),{recursive:true});fs.writeFileSync(output,expected);console.log('Wrote published rules snapshot.');}
