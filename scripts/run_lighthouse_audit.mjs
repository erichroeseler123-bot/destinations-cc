import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const targetUrl = 'https://juneauflightdeck.com';
const destPath = 'C:\\Users\\erich\\.gemini\\antigravity\\brain\\1e696523-69e3-4d73-997e-11d421997a8b\\lighthouse_mobile_audit.json';
const tempOut = path.resolve('lighthouse-result.json');

console.log('Running Lighthouse on', targetUrl, '...');

const args = [
  'lighthouse',
  targetUrl,
  '--only-categories=performance,accessibility,best-practices,seo',
  '--output=json',
  `--output-path=${tempOut}`,
  '--chrome-flags=--headless=new --no-sandbox',
  '--quiet'
];

const res = spawnSync('npx.cmd', args, { stdio: 'inherit', shell: true });

if (fs.existsSync(tempOut)) {
  fs.copyFileSync(tempOut, destPath);
  console.log('Report saved successfully to:', destPath);
  
  const raw = fs.readFileSync(tempOut, 'utf8');
  const report = JSON.parse(raw);
  
  console.log('\n=== LIGHTHOUSE SCORES ===');
  for (const [catId, cat] of Object.entries(report.categories || {})) {
    console.log(`${cat.title}: ${Math.round(cat.score * 100)}`);
  }

  console.log('\n=== FAILED AUDITS IN BEST PRACTICES ===');
  const bp = report.categories['best-practices'];
  if (bp) {
    for (const auditRef of bp.auditRefs || []) {
      const audit = report.audits[auditRef.id];
      if (audit && audit.score !== null && audit.score < 1) {
        console.log(`- [${auditRef.id}] Score: ${audit.score}, Weight: ${auditRef.weight} -> ${audit.title}`);
        if (audit.displayValue) console.log(`  displayValue: ${audit.displayValue}`);
        if (audit.details?.items?.length) {
          console.log(`  Items:`, JSON.stringify(audit.details.items.slice(0, 3), null, 2));
        }
      }
    }
  }

  try { fs.unlinkSync(tempOut); } catch {}
} else {
  console.error('Lighthouse did not produce output file. Exit code:', res.status);
}
