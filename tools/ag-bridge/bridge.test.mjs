import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Bridge, MARKER, parseTask, allowedFile, findingsForHead, parseAgent, run, refreshWorker, validateWindowsCheckout, classifyBlocker, computeTaskHash, summarizePortfolioState, selectNextRotationSite, DEFAULT_SITE_DISCOVERY_BACKLOG, readJsonFile, acquireWorkerLock, isWorkerPidAlive } from './bridge.mjs';
import { createHash } from 'node:crypto';
import { summarizeCheckLog } from './bridge.mjs';

test('check diagnostics publish only known categories and hashes, not private log values', () => {
  const result = summarizeCheckLog('secret=PRIVATE email=customer@example.invalid\nType error: error TS2322\nCannot find module private-path\nAssertionError ERR_ASSERTION\nnpm error code ERESOLVE');
  assert.deepEqual(result.codes, ['ERESOLVE', 'ERR_ASSERTION', 'TS2322']);
  assert.ok(result.signals.includes('module resolution failure'));
  assert.ok(result.signals.includes('test assertion failure'));
  assert.ok(result.signals.includes('type checking failure'));
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
  assert.ok(!JSON.stringify(result).includes('customer@'));
  assert.match(result.logSha256, /^[a-f0-9]{64}$/);
});

test('blocked check backfills timestamp-matched evidence once without executing or changing edits', async t => {
  const h = harness(t);
  const now = Date.now();
  h.b.state[169] = { site: 'brinkberry', status: 'blocked', blocker: { category: 'check_failed' }, blockedAt: now };
  const log = path.join(h.b.home, 'check-169-1.log');
  fs.writeFileSync(log, 'AssertionError ERR_ASSERTION private customer record');
  await h.b.reportBlockedCheck(169, { site: 'brinkberry' });
  await h.b.reportBlockedCheck(169, { site: 'brinkberry' });
  assert.equal(h.notes.length, 1);
  assert.equal(h.b.state[169].checkEvidence.check.command, 'npm run test');
  assert.equal(h.b.state[169].status, 'blocked');
  assert.equal(h.runs(), 0);
  assert.ok(!h.notes[0].includes('private customer'));
  assert.ok(!h.calls.some(c => c.includes('reset') || c.includes('push') || c.includes('commit')));
});

test('diagnostics never attribute stale check logs to a later failure', async t => {
  const h = harness(t);
  h.b.state[169] = { site: 'brinkberry', status: 'blocked', blocker: { category: 'check_failed' }, blockedAt: Date.now() };
  const log = path.join(h.b.home, 'check-169-1.log');
  fs.writeFileSync(log, 'AssertionError ERR_ASSERTION');
  fs.utimesSync(log, new Date(0), new Date(0));
  await h.b.reportBlockedCheck(169, { site: 'brinkberry' });
  assert.equal(h.b.state[169].checkEvidence.check, null);
  assert.equal(h.b.state[169].checkEvidence.diagnostic, null);
});

test('transport retains exit code while keeping raw stderr private', async () => {
  await assert.rejects(run(process.execPath, ['-e', 'console.error("PRIVATE"); process.exit(7)']), err => {
    assert.equal(err.exitCode, 7);
    assert.ok(!err.message.includes('PRIVATE'));
    return true;
  });
});

const config = JSON.parse(fs.readFileSync(new URL('./config.json', import.meta.url)));
const issue = (number, mode = 'audit', site = 'jfd', extra = {}) => ({ number, user: { login: 'erichroeseler123-bot' }, body: MARKER + '\n```json\n' + JSON.stringify({ site, mode, instructions: 'Read the source mapping.', ...extra }) + '\n```' });

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
test('Windows checkout permits invalid names only inside the excluded dataset', () => {
  validateWindowsCheckout('data/memory/dcc:place.json\0apps/juneauflightdeck/page.tsx\0');
  for (const name of ['app/a:b.json', 'app/NUL.txt', 'app/COM1', 'app/trailing.', 'app/GIT~1/config', 'app/.git/config', 'app/back\\slash']) assert.throws(() => validateWindowsCheckout(name + '\0'), /outside the excluded/);
});
test('real Git sparse checkout excludes Windows-invalid memory files and retains site source', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-sparse-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  await run('git', ['init', '-b', 'main'], { cwd: dir });
  fs.mkdirSync(path.join(dir, 'apps/juneauflightdeck'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'apps/juneauflightdeck/package.json'), '{}');
  await run('git', ['add', 'apps/juneauflightdeck/package.json'], { cwd: dir });
  const blobSha = (await run('git', ['hash-object', '-w', '--stdin'], { cwd: dir, input: '{}' })).trim();
  await run('git', ['-c', 'core.protectNTFS=false', 'update-index', '--add', '--cacheinfo', '100644', blobSha, 'data/memory/baselines/dcc:place:test.json'], { cwd: dir });
  await run('git', ['-c', 'core.protectNTFS=false', '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'fixture'], { cwd: dir });
  const clone = path.join(dir, 'worker-clone');
  await run('git', ['clone', '--single-branch', '--no-checkout', dir, clone]);
  validateWindowsCheckout(await run('git', ['ls-tree', '-r', '--name-only', '-z', 'HEAD'], { cwd: clone }));
  await run('git', ['config', '--local', 'core.protectNTFS', 'false'], { cwd: clone });
  await run('git', ['sparse-checkout', 'set', '--no-cone', '--stdin'], { cwd: clone, input: '/*\n!/data/memory/\n' });
  await run('git', ['read-tree', '-mu', 'HEAD'], { cwd: clone });
  await run('git', ['switch', '-c', 'ag-bridge/test'], { cwd: clone });
  assert.ok(!fs.existsSync(path.join(clone, 'data/memory')));
  assert.ok(fs.existsSync(path.join(clone, 'apps/juneauflightdeck/package.json')));
  assert.equal(await run('git', ['status', '--porcelain'], { cwd: clone }), '');
});

function harness(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-flow-')); t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const calls = [], notes = [], reviews = [], reviewComments = []; let head = 'base', dirty = false, branch = 'main';
  const command = async (exe, args, options = {}) => {
    calls.push([exe, ...args]);
    if (exe === 'gh' && args[0] === 'repo') {
      fs.mkdirSync(path.join(args[3], '.git'), { recursive: true });
      fs.mkdirSync(path.join(args[3], 'apps/juneauflightdeck'), { recursive: true });
      fs.writeFileSync(path.join(args[3], 'apps/juneauflightdeck/package.json'), '{}');
      fs.writeFileSync(path.join(args[3], 'package.json'), '{}'); return '';
    }
    if (exe === 'git') {
      if (args[0] === 'switch' && args[1] === '-c') { branch = args[2]; return ''; }
      if (args[0] === 'branch') return branch;
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
test('explicit correction revisits the existing ready PR once without reset or duplicate task', async t => {
  const h = harness(t); const i = issue(1, 'code'); const task = parseTask(i, config);
  await h.b.process(i, task);
  h.reviews.push({ id: 1, commit_id: 'v1', user: { login: config.reviewBots[0] }, state: 'COMMENTED', body: '' });
  await h.b.process(i, task);
  assert.equal(h.b.state[1].status, 'ready');
  const correction = { ...task, revisit: 'owner-correction-20261017', instructions: 'Remove unsupported new comparison claims; preserve semantic form improvements.' };
  await h.b.process(i, correction);
  assert.equal(h.runs(), 2);
  assert.equal(h.b.state[1].sha, 'v2');
  assert.equal(h.b.state[1].pr, 99);
  assert.equal(h.b.state[1].status, 'review');
  await h.b.process(i, correction);
  assert.equal(h.runs(), 2);
  assert.ok(!h.calls.some(c => c.includes('reset') || c.includes('clean')));
});
test('explicit post-PR correction preserves a changed remote head and never invokes AG', async t => {
  const h = harness(t);const i = issue(1, 'code');const task = parseTask(i, config);
  await h.b.process(i, task);
  h.b.state[1].status = 'blocked';
  h.b.state[1].blocker = { category: 'check_failed' };
  h.b.api = async () => ({ state: 'open', head: { sha: 'owner-newer-head' } });
  await h.b.process(i, { ...task, revisit: 'correct-existing-pr' });
  assert.equal(h.runs(), 1);
  assert.equal(h.b.state[1].status, 'blocked');
  assert.match(h.b.state[1].error, /changed outside/);
});
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
  h.b.state[1] = { status: 'blocked', site: 'jfd', mode: 'audit', fixes: 0, recoveredFor: 'workspace-file-tools-v3', error: 'git read-tree exited 128. Details are in the local log; they were not uploaded.' };
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
  assert.equal(h.b.state[1].status, 'blocked');
  assert.equal(h.b.state[1].blocker.category, 'check_failed');
  assert.equal(h.b.state[1].stalled, true);
  assert.ok(!h.calls.some(c => c.includes('push')));
});
test('classifyBlocker categorizes permission, transient, check, scope, review and git failures', () => {
  assert.deepEqual(classifyBlocker(new Error('AG permission blocked: command. No completion was assumed.')).category, 'ag_permission_denied');
  assert.equal(classifyBlocker(new Error('AG permission blocked: command. No completion was assumed.')).retryable, true);
  assert.equal(classifyBlocker(new Error('AG did not complete successfully. Check the local AG log.')).category, 'ag_transient_or_incomplete');
  assert.equal(classifyBlocker(new Error('npm.cmd run exited 1.'), 'check').category, 'check_failed');
  assert.equal(classifyBlocker(new Error('npm.cmd run exited 1.'), 'check').retryable, false);
  assert.equal(classifyBlocker(new Error('Change outside approved task paths: package.json. Paused before push.')).category, 'scope_violation');
  assert.equal(classifyBlocker(new Error('No Codex review received.')).category, 'review_timeout');
  assert.equal(classifyBlocker(new Error('Reached 3 correction rounds.')).category, 'review_fix_limit');
  assert.equal(classifyBlocker(new Error('git read-tree exited 128.')).category, 'git_checkout_or_index');
});
test('bounded retries recover transient or permission failures after cooldown and stall when exhausted without duplicate comments', async t => {
  const h = harness(t);
  h.b.config = { ...config, maxTaskRetries: 2, retryCooldownMinutes: 0 };
  let attempt = 0;
  h.b.agent = async () => {
    attempt++;
    if (attempt <= 2) throw new Error('AG permission blocked: command. No completion was assumed.');
    return { response: 'Recovered AG_BRIDGE_OK', conversation_id: 'recovered-session' };
  };
  const i = issue(1, 'audit', 'dells');
  const task = parseTask(i, h.b.config);
  // Attempt 1 fails -> blocked, retries: 0, eligible for retry 1/2
  await h.b.process(i, task);
  assert.equal(h.b.state[1].status, 'blocked');
  assert.equal(h.b.state[1].blocker.category, 'ag_permission_denied');
  assert.equal(h.b.state[1].stalled, false);
  assert.equal(h.b.state[1].retries, 0);
  // Retry 1 fails -> blocked, retries: 1, eligible for retry 2/2
  await h.b.process(i, task);
  assert.equal(h.b.state[1].status, 'blocked');
  assert.equal(h.b.state[1].retries, 1);
  assert.equal(h.b.state[1].stalled, false);
  // Retry 2 succeeds -> done!
  await h.b.process(i, task);
  assert.equal(h.b.state[1].status, 'done');
  assert.equal(attempt, 3);
});
test('stalled task can be revisited when instructions or revisit token change', async t => {
  const h = harness(t);
  let shouldFail = true;
  const original = h.b.command;
  h.b.command = async (exe, args, options) => {
    if (exe === 'npm' && shouldFail) throw new Error('check failed');
    return original(exe, args, options);
  };
  const i1 = issue(1, 'code', 'jfd', { instructions: 'Initial instructions with failing test.' });
  await h.b.process(i1, parseTask(i1, config));
  assert.equal(h.b.state[1].status, 'blocked');
  assert.equal(h.b.state[1].stalled, true);
  const notesAfterBlock = h.notes.length;
  // Repeated cycle with unchanged instructions does not re-run or re-comment
  await h.b.process(i1, parseTask(i1, config));
  assert.equal(h.runs(), 1);
  assert.equal(h.notes.length, notesAfterBlock);
  // Updating instructions or revisit token triggers a clean revisit
  shouldFail = false;
  const i1Updated = issue(1, 'code', 'jfd', { instructions: 'Updated instructions with deterministic test paths.', revisit: '2026-10-15T05:00:00Z' });
  await h.b.process(i1Updated, parseTask(i1Updated, config));
  assert.equal(h.runs(), 2);
  assert.equal(h.b.state[1].status, 'review');
  assert.equal(h.b.state[1].stalled, false);
});
test('tick isolates per-site failures so one blocked site never stops the other nine sites and separates reporting', async t => {
  const h = harness(t);
  const blockedIssue = issue(10, 'code', 'dells', { instructions: 'Blocked Dells task' });
  const healthyIssue = issue(11, 'audit', 'wta', { instructions: 'Healthy WTA audit' });
  h.b.state[10] = {
    status: 'blocked',
    site: 'dells',
    mode: 'code',
    fixes: 0,
    retries: 2,
    maxRetries: 2,
    stalled: true,
    blocker: { category: 'ag_permission_denied', retryable: true },
    error: 'AG permission blocked: command.',
    taskHash: computeTaskHash(parseTask(blockedIssue, config))
  };
  h.b.all = async (endpoint) => {
    if (endpoint.includes('/issues?state=open')) return [blockedIssue, healthyIssue];
    return [];
  };
  const heartbeat = await h.b.tick();
  assert.equal(h.b.state[10].status, 'blocked');
  assert.equal(h.b.state[11].status, 'done');
  assert.deepEqual(heartbeat.summary.productionReleases, []);
  assert.equal(heartbeat.summary.completed.length, 1);
  assert.equal(heartbeat.summary.completed[0].site, 'wta');
  assert.equal(heartbeat.summary.blocked.length, 1);
  assert.equal(heartbeat.summary.blocked[0].site, 'dells');
  assert.equal(heartbeat.summary.blocked[0].category, 'ag_permission_denied');
});
test('agent prompt injects existing allowed workspace files and forbids invoke_subagent and run_command', async t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-manifest-')); t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  let capturedInput = '';
  const command = async (exe, args, options = {}) => {
    if (exe === 'git' && args[0] === 'ls-files') {
      return 'apps/welcometothedells/tests/content-regression.test.ts\0apps/welcometothedells/tests/sitemap-regression.test.ts\0apps/welcometothedells/package.json\0';
    }
    capturedInput = options.input ?? '';
    return JSON.stringify({ event: 'result', result: { status: 'SUCCESS', response: 'Done AG_BRIDGE_OK' } });
  };
  const b = new Bridge(config, home, command);
  await b.agent(home, 157, { site: 'dells', mode: 'code', instructions: 'Add canonical test' }, config.sites.dells);
  assert.ok(capturedInput.includes('apps/welcometothedells/tests/content-regression.test.ts'));
  assert.ok(capturedInput.includes('apps/welcometothedells/tests/sitemap-regression.test.ts'));
  assert.ok(!capturedInput.includes('apps/welcometothedells/package.json'));
  assert.ok(capturedInput.includes('never invoke subagents (invoke_subagent)'));
});
test('selectNextRotationSite rotates across verified sites and skips active or stalled sites', () => {
  const first = selectNextRotationSite(config, {}, { lastSite: 'socializor' });
  assert.equal(first.site, 'cruisepromenade');
  assert.equal(first.task.key, 'cruisepromenade-mobile-nav-accessibility');
  const skippedStalled = selectNextRotationSite(
    config,
    { 200: { site: 'cruisepromenade', status: 'blocked', stalled: true } },
    { lastSite: 'socializor' }
  );
  assert.equal(skippedStalled.site, 'wta');
  const nextAfterDispatched = selectNextRotationSite(
    config,
    {},
    { lastSite: 'socializor', dispatchedKeys: ['cruisepromenade-mobile-nav-accessibility'] }
  );
  assert.equal(nextAfterDispatched.site, 'wta');
});
test('tick automatically discovers and queues next rotated task when active queue is empty and reloads state.json', async t => {
  const h = harness(t);
  h.b.config = { ...config, autoDiscoverWhenEmpty: true, autoDiscoverIntervalMinutes: 120 };
  let createdPayload = null;
  const origApi = h.b.api.bind(h.b);
  h.b.api = async (endpoint, method = 'GET', data) => {
    if (endpoint === `repos/${config.queueRepo}/issues` && method === 'POST') {
      createdPayload = data;
      return {
        number: 165,
        title: data.title,
        body: data.body,
        user: { login: config.trustedAuthors[0] }
      };
    }
    return origApi(endpoint, method, data);
  };
  h.b.all = async (endpoint) => {
    if (endpoint.includes('/issues?state=open')) return [];
    return [];
  };
  // Write an external state entry to disk and verify reloadState() picks it up
  fs.writeFileSync(h.b.stateFile, '\uFEFF' + JSON.stringify({ 150: { site: 'wno', mode: 'code', status: 'done' } }));
  fs.writeFileSync(h.b.rotationFile, '\uFEFF' + JSON.stringify({ lastSite: 'wno' }));
  const heartbeat = await h.b.tick();
  assert.equal(h.b.state[150].status, 'done');
  assert.ok(createdPayload, 'Expected a new task issue to be created when queue is empty');
  assert.equal(heartbeat.rotation.lastSite, 'jfd');
  assert.equal(heartbeat.rotation.lastIssue, 165);
  assert.equal(h.b.state[165].site, 'jfd');
  assert.equal(h.b.state[165].status, 'review');
  // Verify commit uses verified GitHub/Vercel author identity from config
  const commitCall = h.calls.find(c => c[0] === 'git' && c.includes('commit'));
  assert.ok(commitCall, 'Expected git commit call');
  assert.ok(commitCall.includes(`user.name=${config.commitAuthorName}`));
  assert.ok(commitCall.includes(`user.email=${config.commitAuthorEmail}`));
});
test('acquireWorkerLock recovers stale or recycled non-Node PIDs and blocks live duplicate workers', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-lock-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const lock = path.join(dir, 'worker.lock');
  // Stale lock with dead PID is automatically replaced
  fs.writeFileSync(lock, '999999');
  const release = acquireWorkerLock(lock, () => false);
  assert.equal(fs.readFileSync(lock, 'utf8'), String(process.pid));
  // Duplicate worker while lock is held throws EALREADY_RUNNING
  assert.throws(() => acquireWorkerLock(lock, () => true), err => err.code === 'EALREADY_RUNNING');
  release();
  assert.equal(fs.existsSync(lock), false);
});
test('pre-PR interrupted task pauses immediately and recovers cleanly after cooldown while post-PR interrupted stays stalled', async t => {
  const h = harness(t);
  h.b.config = { ...config, maxTaskRetries: 2, retryCooldownMinutes: 15 };
  const i = issue(1, 'code', 'jfd');
  const task = parseTask(i, h.b.config);
  h.b.state[1] = { status: 'running', site: 'jfd', mode: 'code', branch: 'ag-bridge/task-1', baseSha: 'base', retries: 0 };
  // First pass after restart marks it blocked with a cooldown and does NOT run immediately
  await h.b.process(i, task);
  assert.equal(h.b.state[1].status, 'blocked');
  assert.equal(h.b.state[1].stalled, false);
  assert.equal(h.b.state[1].needsCleanReset, true);
  assert.equal(h.runs(), 0);
  // Once cooldown elapses, it resets cleanly and executes
  h.b.state[1].nextRetryAt = Date.now() - 1000;
  await h.b.process(i, task);
  assert.equal(h.runs(), 1);
  assert.equal(h.b.state[1].status, 'review');
  assert.equal(h.b.state[1].retries, 1);
});
test('tick reconciles merged ready PR to done, closes queue issue, and auto-discovers next site task', async t => {
  const h = harness(t);
  h.b.config = { ...config, autoDiscoverWhenEmpty: true, autoDiscoverIntervalMinutes: 120 };
  const readyIssue = issue(165, 'code', 'cruisepromenade', { instructions: 'Mobile nav fix' });
  h.b.state[165] = {
    status: 'ready',
    site: 'cruisepromenade',
    mode: 'code',
    pr: 61,
    sha: '3901b18421',
    url: 'https://github.com/erichroeseler123-bot/cruisepromenade/pull/61'
  };
  fs.writeFileSync(h.b.stateFile, JSON.stringify(h.b.state));
  fs.writeFileSync(h.b.rotationFile, JSON.stringify({
    lastSite: 'cruisepromenade',
    lastCreatedAt: Date.now() - 3 * 3600 * 1000,
    lastIssue: 165,
    dispatchedKeys: ['cruisepromenade-mobile-nav-accessibility']
  }));
  let closedIssue = false;
  let createdNext = null;
  const origApi = h.b.api.bind(h.b);
  h.b.api = async (endpoint, method = 'GET', data) => {
    if (endpoint === 'repos/erichroeseler123-bot/cruisepromenade/pulls/61') {
      return { state: 'closed', merged: true, merge_commit_sha: '12e987ce7d4922fa854be09accedfe13505b8d7d' };
    }
    if (endpoint === `repos/${config.queueRepo}/issues/165` && method === 'PATCH' && data?.state === 'closed') {
      closedIssue = true;
      return { number: 165, state: 'closed' };
    }
    if (endpoint === `repos/${config.queueRepo}/issues` && method === 'POST') {
      createdNext = data;
      return {
        number: 166,
        title: data.title,
        body: data.body,
        user: { login: config.trustedAuthors[0] }
      };
    }
    return origApi(endpoint, method, data);
  };
  h.b.all = async (endpoint) => {
    if (endpoint.includes('/issues?state=open')) return [readyIssue];
    return [];
  };
  const heartbeat = await h.b.tick();
  assert.equal(h.b.state[165].status, 'done');
  assert.equal(h.b.state[165].mergedSha, '12e987ce7d4922fa854be09accedfe13505b8d7d');
  assert.equal(closedIssue, true);
  assert.ok(createdNext, 'Expected next site task to be auto-discovered after ready PR merged');
  assert.equal(heartbeat.rotation.lastSite, 'wta');
  assert.equal(heartbeat.rotation.lastIssue, 166);
});
test('selectNextRotationSite advances to follow-up backlog pass after all first-pass keys are dispatched', () => {
  const allPass0Keys = Object.values(DEFAULT_SITE_DISCOVERY_BACKLOG).map(s => s.key);
  const secondPass = selectNextRotationSite(config, {}, { lastSite: 'socializor', dispatchedKeys: allPass0Keys });
  assert.ok(secondPass);
  assert.equal(secondPass.site, 'cruisepromenade');
  assert.equal(secondPass.key, 'cruisepromenade-hero-sample-context-clarity');
});
test('discoverNextTaskIfEmpty rotates to next unblocked site after 2-hour interval even if another site has an unmerged ready PR', async t => {
  const h = harness(t);
  h.b.config = { ...config, autoDiscoverWhenEmpty: true, autoDiscoverIntervalMinutes: 120 };
  const readyIssue = issue(166, 'code', 'wta', { instructions: 'Mobile nav fix' });
  h.b.state[166] = {
    status: 'ready',
    site: 'wta',
    mode: 'code',
    pr: 13,
    sha: '043df8066c',
    url: 'https://github.com/erichroeseler123-bot/wta-renderer/pull/13'
  };
  fs.writeFileSync(h.b.stateFile, JSON.stringify(h.b.state));
  fs.writeFileSync(h.b.rotationFile, JSON.stringify({
    lastSite: 'wta',
    lastCreatedAt: Date.now() - 3 * 3600 * 1000,
    lastIssue: 166,
    dispatchedKeys: ['cruisepromenade-mobile-nav-accessibility', 'wta-port-nav-aria-current-filter-live']
  }));
  let createdNext = null;
  const origApi = h.b.api.bind(h.b);
  h.b.api = async (endpoint, method = 'GET', data) => {
    if (endpoint === 'repos/erichroeseler123-bot/wta-renderer/pulls/13') {
      return { state: 'open', merged: false, head: { sha: '043df8066c' } };
    }
    if (endpoint === `repos/${config.queueRepo}/issues` && method === 'POST') {
      createdNext = data;
      return {
        number: 167,
        title: data.title,
        body: data.body,
        user: { login: config.trustedAuthors[0] }
      };
    }
    return origApi(endpoint, method, data);
  };
  h.b.all = async (endpoint) => {
    if (endpoint.includes('/issues?state=open')) return [readyIssue];
    return [];
  };
  const heartbeat = await h.b.tick();
  assert.equal(h.b.state[166].status, 'ready');
  assert.ok(createdNext, 'Expected next unblocked site task to be discovered after interval even while WTA PR is ready');
  assert.equal(heartbeat.rotation.lastSite, 'dells');
  assert.equal(heartbeat.rotation.lastIssue, 167);
});
test('review stage waits for pending Vercel statuses and blocks on failing Vercel deployments before reporting ready', async t => {
  const h = harness(t);
  const i = issue(1, 'code');
  const task = parseTask(i, config);
  await h.b.process(i, task);
  assert.equal(h.b.state[1].status, 'review');
  h.reviews.push({ id: 1, commit_id: 'v1', user: { login: config.reviewBots[0] }, state: 'COMMENTED', body: '' });
  let vercelStatuses = [{ context: 'Vercel – juneauflightdeck', state: 'pending', description: 'Deploying' }];
  const origApi = h.b.api.bind(h.b);
  h.b.api = async (endpoint, method = 'GET', data) => {
    if (endpoint.endsWith('/commits/v1/status')) {
      return { state: vercelStatuses[0].state, statuses: vercelStatuses };
    }
    return origApi(endpoint, method, data);
  };
  await h.b.process(i, task);
  assert.equal(h.b.state[1].status, 'review', 'Pending Vercel deployment must keep task in review');
  assert.ok(!h.notes.some(n => n.includes('Ready for owner review')));

  vercelStatuses = [{ context: 'Vercel – web', state: 'failure', description: 'Deployment has failed' }];
  await h.b.process(i, task);
  assert.equal(h.b.state[1].status, 'blocked', 'Failed Vercel deployment must block task');
  assert.equal(h.b.state[1].blocker.category, 'check_failed');
  assert.ok(!h.notes.some(n => n.includes('Ready for owner review')));

  h.b.state[1].status = 'review';
  vercelStatuses = [
    { context: 'Vercel – juneauflightdeck', state: 'success', description: 'Deployment has completed' },
    { context: 'Vercel – web', state: 'success', description: 'Canceled by Ignored Build Step' }
  ];
  await h.b.process(i, task);
  assert.equal(h.b.state[1].status, 'ready');
  assert.ok(h.notes.some(n => n.includes('Ready for owner review')));
});
