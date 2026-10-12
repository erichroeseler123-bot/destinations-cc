import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Bridge, MARKER, parseTask, allowedFile, findingsForHead, parseAgent, run, refreshWorker } from './bridge.mjs';
import { createHash } from 'node:crypto';

const config = JSON.parse(fs.readFileSync(new URL('./config.json', import.meta.url)));
const issue = (number, mode = 'audit', site = 'jfd') => ({ number, user: { login: 'erichroeseler123-bot' }, body: MARKER + '\n```json\n' + JSON.stringify({ site, mode, instructions: 'Read the source mapping.' }) + '\n```' });

test('queue ignores unrelated, untrusted, malformed and excluded-site tasks', () => {
  assert.equal(parseTask(issue(1), config).site, 'jfd');
  assert.equal(parseTask({ ...issue(1), user: { login: 'stranger' } }, config), null);
  assert.equal(parseTask(issue(1, 'audit', 'parr'), config), null);
  assert.equal(parseTask(issue(1, 'deploy'), config), null);
  assert.equal(parseTask({ ...issue(1), pull_request: {} }, config), null);
  assert.equal(parseTask({ ...issue(1), body: MARKER + '\n```json\n{nope}\n```' }, config), null);
});
test('site paths reject secrets, traversal, routing and other brands', () => {
  const site = config.sites.jfd;
  assert.ok(allowedFile('apps/juneauflightdeck/app/page.tsx', site));
  for (const p of ['apps/juneauflightdeck/.env.local', 'apps/juneauflightdeck/../welcometotheswamp/page.tsx', 'apps/juneauflightdeck/proxy.ts', 'apps/juneauflightdeck/.github/workflows/a.yml', 'apps/juneauflightdeck/AGENTS.md', 'apps/gosno/page.tsx', 'public/shared.json']) assert.equal(allowedFile(p, site), false, p);
});
test('reviews must belong to the configured bot and exact head', () => {
  const reviews = [{ id: 1, commit_id: 'old', user: { login: config.reviewBots[0] } }, { id: 2, commit_id: 'new', user: { login: 'stranger' } }];
  assert.equal(findingsForHead(reviews, [], 'new', config.reviewBots).reviewed, false);
  reviews.push({ id: 3, commit_id: 'new', user: { login: config.reviewBots[0] }, body: '', state: 'COMMENTED' });
  const comments = [{ pull_request_review_id: 3, commit_id: 'new', position: 1, user: { login: config.reviewBots[0] }, path: 'a.ts', line: 4, body: '[P1] Fix this.' }, { pull_request_review_id: 1, commit_id: 'old', position: 1, user: { login: config.reviewBots[0] }, body: 'stale' }];
  assert.deepEqual(findingsForHead(reviews, comments, 'new', config.reviewBots).findings, ['a.ts:4\n[P1] Fix this.']);
});
test('agent status and acknowledgement are checked even after exit zero', () => {
  assert.throws(() => parseAgent('{"event":"result","result":{"status":"WAITING","response":"AG_BRIDGE_OK"}}'));
  assert.throws(() => parseAgent('{"event":"result","result":{"status":"SUCCESS","response":""}}'));
  assert.equal(parseAgent('{"event":"result","result":{"status":"SUCCESS","response":"Source inspection completed."}}').response, 'Source inspection completed.');
  assert.throws(() => parseAgent('{"event":"result","result":{"status":"SUCCESS","response":"","denied_actions":[{"action":"command"}]}}'), /permission blocked: command/);
});
test('automatic worker update validates content and syntax before replacing only the worker', async t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bridge-update-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  fs.writeFileSync(path.join(dir,'bridge.mjs'),'export const version=1;');
  fs.writeFileSync(path.join(dir,'config.json'),'LOCAL USER CONFIG');
  const bytes=Buffer.from('export const version=2;');
  const sha=createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
  const transport=async (exe,args,options)=>exe==='gh'?JSON.stringify({encoding:'base64',path:'tools/ag-bridge/bridge.mjs',size:bytes.length,sha,content:bytes.toString('base64')}):run(exe,args,options);
  assert.equal(await refreshWorker(dir,transport),true);
  assert.equal(await refreshWorker(dir,transport),false);
  assert.equal(fs.readFileSync(path.join(dir,'config.json'),'utf8'),'LOCAL USER CONFIG');
  await assert.rejects(refreshWorker(dir,async()=>JSON.stringify({encoding:'base64',path:'tools/ag-bridge/bridge.mjs',sha:'bad',content:bytes.toString('base64')})),/checksum mismatch/);
});
test('real process transport passes shell metacharacters only through stdin', async t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-transport-')); t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const fake = path.join(home, 'agent.mjs');
  fs.writeFileSync(fake, `let input='';for await(const b of process.stdin)input+=b;const p=JSON.parse(input);console.log(JSON.stringify({event:'result',result:{status:'SUCCESS',response:'AG_BRIDGE_OK '+p.message.content}}));`);
  const prompt = 'quotes " & $() ` | > ; remain data\nnext line';
  const raw = await run(process.execPath, [fake], { input: JSON.stringify({ event: 'user', message: { content: prompt } }) + '\n' });
  assert.equal(parseAgent(raw).response, 'AG_BRIDGE_OK ' + prompt);
});
test('real Git sparse checkout excludes Windows-invalid memory files and retains site source', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-sparse-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  await run('git', ['init', '-b', 'main'], { cwd: dir });
  fs.mkdirSync(path.join(dir, 'data/memory/baselines'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'apps/juneauflightdeck'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'data/memory/baselines/dcc:place:test.json'), '{}');
  fs.writeFileSync(path.join(dir, 'apps/juneauflightdeck/package.json'), '{}');
  await run('git', ['add', '.'], { cwd: dir });
  await run('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'fixture'], { cwd: dir });
  const clone = path.join(dir, 'worker-clone');
  await run('git', ['clone', '--single-branch', '--no-checkout', dir, clone]);
  await run('git', ['sparse-checkout', 'set', '--no-cone', '--stdin'], { cwd: clone, input: '/*\n!/data/memory/\n' });
  await run('git', ['read-tree', '-mu', 'HEAD'], { cwd: clone });
  await run('git', ['switch', '-c', 'ag-bridge/test'], { cwd: clone });
  assert.ok(!fs.existsSync(path.join(clone, 'data/memory')));
  assert.ok(fs.existsSync(path.join(clone, 'apps/juneauflightdeck/package.json')));
  assert.equal(await run('git', ['status', '--porcelain'], { cwd: clone }), '');
});

function harness(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-flow-')); t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const calls = [], notes = [], reviews = [], reviewComments = []; let head = 'base', dirty = false;
  const command = async (exe, args, options = {}) => {
    calls.push([exe, ...args]);
    if (exe === 'gh' && args[0] === 'repo') {
      fs.mkdirSync(path.join(args[3], '.git'), { recursive: true });
      fs.mkdirSync(path.join(args[3], 'apps/juneauflightdeck'), { recursive: true });
      fs.writeFileSync(path.join(args[3], 'apps/juneauflightdeck/package.json'), '{}'); return '';
    }
    if (exe === 'git') {
      if (args[0] === 'branch') return calls.some(c => c[0] === 'git' && c[1] === 'switch') ? 'ag-bridge/task-1' : 'main';
      if (args[0] === 'rev-parse') return head;
      if (args[0] === 'diff') return dirty || head !== 'base' ? 'apps/juneauflightdeck/app/page.tsx\0' : '';
      if (args.includes('commit')) { head = head === 'base' ? 'v1' : 'v2'; dirty = false; }
      return '';
    }
    return '';
  };
  const b = new Bridge(config, home, command);
  b.api = async (endpoint, method, data) => {
    calls.push([method ?? 'GET', endpoint]);
    if (endpoint.endsWith('/pulls') && method === 'POST') return { number: 99, html_url: 'https://github.com/test/pr/99' };
    if (endpoint.includes('/pulls?')) return [];
    if (endpoint.endsWith('/pulls/99')) return { state: 'open', head: { sha: head } };
    if (endpoint.includes('/reviews')) return reviews;
    if (endpoint.includes('/pulls/99/comments')) return reviewComments;
    return null;
  };
  b.comment = async (number, body) => notes.push(body);
  let agentRuns = 0;
  b.agent = async (dir, number, task, site, feedback) => { agentRuns++; if (task.mode === 'code') dirty = true; return { response: 'Private output AG_BRIDGE_OK', conversation_id: 'fake-test-session' }; };
  return { b, notes, calls, reviews, reviewComments, runs: () => agentRuns, head: () => head };
}
test('full audit receives task, executes AG, posts metadata and persists completion once', async t => {
  const h = harness(t); const i = issue(1);
  await h.b.process(i, parseTask(i, config));
  assert.equal(h.b.state[1].status, 'done');
  assert.ok(h.notes.some(n => n.includes('Connection check passed')));
  assert.ok(h.notes.every(n => !n.includes('Private output')));
  assert.ok(!h.calls.some(c => c.includes('push')));
  await h.b.process(i, parseTask(i, config)); assert.equal(h.runs(), 1);
  const restored = new Bridge(config, h.b.home, h.b.command); assert.equal(restored.state[1].status, 'done');
});
test('updated worker recovers diagnosed read-only install failures once', async t => {
  const h = harness(t); const i = issue(1); const task = parseTask(i, config);
  h.b.state[1] = { status: 'blocked', site: 'jfd', mode: 'audit', fixes: 0, error: 'AG did not acknowledge the bridge protocol.' };
  await h.b.process(i, task); assert.equal(h.b.state[1].status, 'done'); assert.equal(h.runs(), 1);
  h.b.state[1].status = 'blocked'; h.b.state[1].error = 'gh exited 1.';
  await h.b.process(i, task); assert.equal(h.b.state[1].status, 'blocked'); assert.equal(h.runs(), 1);
});
test('full code flow checks, publishes, consumes current review, fixes and rereviews', async t => {
  const h = harness(t); const i = issue(1, 'code'); const task = parseTask(i, config);
  await h.b.process(i, task);
  assert.equal(h.b.state[1].status, 'review'); assert.equal(h.b.state[1].sha, 'v1');
  assert.ok(h.calls.findIndex(c => c[0] === 'npm' && c.includes('build')) < h.calls.findIndex(c => c[0] === 'git' && c[1] === 'push'));
  h.reviews.push({ id: 10, commit_id: 'old', user: { login: config.reviewBots[0] }, body: '[P1] stale', state: 'COMMENTED' });
  await h.b.process(i, task); assert.equal(h.runs(), 1);
  h.reviews.push({ id: 11, commit_id: 'v1', user: { login: config.reviewBots[0] }, body: '', state: 'COMMENTED' });
  h.reviewComments.push({ pull_request_review_id: 11, commit_id: 'v1', position: 1, user: { login: config.reviewBots[0] }, path: 'apps/juneauflightdeck/app/page.tsx', line: 1, body: '[P1] Fix bug' });
  await h.b.process(i, task); assert.equal(h.runs(), 2); assert.equal(h.b.state[1].sha, 'v2');
  assert.equal(h.b.state[1].fixes, 1); assert.equal(h.b.state[1].status, 'review');
  h.reviews.push({ id: 12, commit_id: 'v2', user: { login: config.reviewBots[0] }, body: '', state: 'COMMENTED' });
  await h.b.process(i, task); assert.equal(h.b.state[1].status, 'ready');
  assert.ok(!h.calls.some(c => c.includes('merge') || c.includes('--prod')));
});
test('interrupted jobs and retry limit pause instead of reexecuting', async t => {
  const h = harness(t); const i = issue(1); h.b.state[1] = { status: 'running', site: 'jfd', mode: 'audit' };
  await h.b.process(i, parseTask(i, config)); assert.equal(h.b.state[1].status, 'blocked'); assert.equal(h.runs(), 0);
  const j = issue(1, 'code'); h.b.state[1] = { status: 'review', site: 'jfd', mode: 'code', fixes: 3, pr: 99, sha: 'base', reviewAt: Date.now() };
  h.reviews.push({ id: 1, commit_id: 'base', user: { login: config.reviewBots[0] }, state: 'CHANGES_REQUESTED', body: '[P1] still broken' });
  await h.b.process(j, parseTask(j, config)); assert.equal(h.b.state[1].status, 'blocked'); assert.equal(h.runs(), 0);
});
test('check failures never push source or request review', async t => {
  const h = harness(t); const original = h.b.command;
  h.b.command = async (exe, args, options) => { if (exe === 'npm') throw new Error('check failed'); return original(exe, args, options); };
  const i = issue(1, 'code'); await h.b.process(i, parseTask(i, config));
  assert.equal(h.b.state[1].status, 'blocked'); assert.ok(!h.calls.some(c => c.includes('push')));
});
