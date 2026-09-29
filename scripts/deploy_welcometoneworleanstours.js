const fs = require('fs');
const { execSync } = require('child_process');

const rootProjectJson = '.vercel/project.json';
const wnoProjectJson = 'apps/welcometoneworleanstours/.vercel/project.json';
const bakProjectJson = '.vercel/project.json.bak';

try {
  console.log('1. Backing up root .vercel/project.json...');
  fs.copyFileSync(rootProjectJson, bakProjectJson);

  console.log('2. Swapping in welcometoneworleanstours project.json...');
  fs.copyFileSync(wnoProjectJson, rootProjectJson);

  console.log('3. Running npx vercel --prod --yes for welcometoneworleanstours...');
  const output = execSync('cmd.exe /c "npx vercel --prod --yes"', { encoding: 'utf8', stdio: 'pipe' });
  console.log('Vercel Output:\n', output);
} catch (err) {
  console.error('Deployment error:', err.stdout || err.message);
} finally {
  console.log('4. Restoring original root .vercel/project.json...');
  if (fs.existsSync(bakProjectJson)) {
    fs.copyFileSync(bakProjectJson, rootProjectJson);
    fs.unlinkSync(bakProjectJson);
    console.log('Original root .vercel/project.json restored successfully.');
  }
}
