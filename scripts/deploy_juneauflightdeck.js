const fs = require('fs');
const { execSync } = require('child_process');

const rootProjectJson = '.vercel/project.json';
const jfdProjectJson = 'apps/juneauflightdeck/.vercel/project.json';
const bakProjectJson = '.vercel/project.json.bak';

const rootVercelJson = 'vercel.json';
const jfdVercelJson = 'apps/juneauflightdeck/vercel.json';
const bakVercelJson = 'vercel.json.bak';

let swappedProjectJson = false;
let swappedVercelJson = false;

try {
  console.log('1. Backing up root .vercel/project.json...');
  fs.copyFileSync(rootProjectJson, bakProjectJson);
  fs.copyFileSync(jfdProjectJson, rootProjectJson);
  swappedProjectJson = true;

  console.log('2. Swapping root vercel.json with juneauflightdeck vercel.json...');
  fs.copyFileSync(rootVercelJson, bakVercelJson);
  fs.copyFileSync(jfdVercelJson, rootVercelJson);
  swappedVercelJson = true;

  console.log('3. Running npx vercel --prod --yes for juneauflightdeck...');
  const output = execSync('cmd.exe /c "npx vercel --prod --yes"', { encoding: 'utf8', stdio: 'pipe' });
  console.log('Vercel Output:\n', output);
} catch (err) {
  console.error('Deployment error:', err.stdout || err.message);
  process.exit(1);
} finally {
  console.log('4. Restoring original configurations...');
  if (swappedVercelJson && fs.existsSync(bakVercelJson)) {
    fs.copyFileSync(bakVercelJson, rootVercelJson);
    fs.unlinkSync(bakVercelJson);
    console.log('Original root vercel.json restored.');
  }
  if (swappedProjectJson && fs.existsSync(bakProjectJson)) {
    fs.copyFileSync(bakProjectJson, rootProjectJson);
    fs.unlinkSync(bakProjectJson);
    console.log('Original root .vercel/project.json restored successfully.');
  }
}
