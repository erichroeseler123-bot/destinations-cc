# AG Bridge: JFD, WNO, WTA, Welcome to the Swamp

This worker replaces manually relaying task instructions, code changes and code-review findings between ChatGPT/Codex and Antigravity. It uses GitHub issues as the queue and Antigravity's native CLI on Windows as the executor. It does not attach to an existing IDE conversation.

## Install on Windows

Run `install.ps1` from a permanent extracted copy of this directory. It installs missing Git, GitHub CLI, Node and Antigravity CLI when possible, handles initial sign-in, writes a Startup shortcut, and starts the worker. Use `-NoStartup` to skip the shortcut. It does not change AG's permission settings or skip permissions. The worker uses Node's standard library; no bridge dependencies or API keys are required. AG quota/credit usage follows your existing Google account plan.

Enable Codex Code Review for **destinations-cc** and **wta-renderer** in [Codex settings](https://chatgpt.com/codex/settings/code-review). The worker explicitly requests `@codex review` after each code push, so enabling automatic review triggers is optional. A missing review times out and pauses the task; it never counts as approval.

Keep the worker window open. The Startup shortcut reopens it at Windows sign-in. Closing the window stops polling; a running task interrupted by a close is marked blocked on the next run to avoid duplicate work. To disable startup, remove `AG Bridge.lnk` from `shell:startup`.

## Queue protocol

Create an issue in `erichroeseler123-bot/destinations-cc` with a body starting with the marker and one JSON block:

```text
<!-- ag-bridge:v1 -->
```

```json
{"site":"jfd","mode":"code","instructions":"Describe the requested change and acceptance criteria here."}
```

Sites: `jfd`, `wno`, `wta`, `swamp`. Modes: `audit` (read-only connection/source check) and `code` (edit/check/push/review). Only issues created by a configured trusted GitHub author are accepted. Comments do not expand the original task; create a follow-up issue for changed scope. The owner can submit tasks through ChatGPT's GitHub tools, eliminating manual transfer to AG.

The worker ignores unrelated issues, pull requests, unknown site IDs, malformed task JSON, and tasks from other authors. Closing an issue removes it from future polling, but does not cancel a task already executing; close the worker window to stop it.

## What it does

Each task gets a separate clean Git checkout under `%USERPROFILE%\.ag-bridge\workspaces` and an `ag-bridge/task-N` branch. Destinations CC checkouts exclude `data/memory/` because 2,343 filenames contain colons that Windows cannot check out; the dataset stays tracked in Git and is not deleted or renamed. Checks requiring that dataset must run on a compatible environment. Your existing working directories and unsaved AG changes are untouched. The worker reads applicable repository governance. It does not copy `.env` files, tokens, customer records, or raw agent/build logs to GitHub. Missing build configuration pauses the task rather than inventing credentials or claiming validation passed.

For code tasks it checks the allowed path list, runs the configured install/typecheck/build/test commands itself, stages only eligible files, commits, pushes the task branch, and opens a PR. Build/check output stays in local logs. Source checks do not establish visual/mobile behavior, booking functionality, or live production correctness; those require additional task-specific verification.

The review loop accepts only configured Codex bot reviews on the exact latest commit, forwards findings to AG, reruns checks, and requests a fresh review. It pauses after three correction rounds. Stale reviews, missing reviews, external branch edits, unexpected history changes, failed checks, and interrupted execution do not advance the task to ready. A review without findings means ready for owner review, not guaranteed correctness.

The worker does not merge, alter production branches, deploy, change domains/DNS, modify project ownership, or run database/payment mutations. Git pushes may create preview deployments according to your existing Vercel integration. Production publication is a separate explicitly authorized action.

## Source mappings

| Site | Repository | Candidate code directory | Vercel project record |
| --- | --- | --- | --- |
| JFD | destinations-cc | apps/juneauflightdeck | juneauflightdeck |
| WNO | destinations-cc | root; app/new-orleans plus apps/welcometoneworleanstours | welcometoneworleanstours |
| WTA | wta-renderer | root | wta-ui |
| Swamp | destinations-cc | apps/welcometotheswamp | welcometotheswamp |

These code directories were inspected on GitHub, and domain/project associations were read from Vercel. The older MASTER_DOMAIN_LEDGER differs in several rows; these are candidate code mappings, not a new declaration of production ownership. The initial four tasks only confirm source access and agent communication. WNO's app folder lacks a committed package.json, so its configured checks use the repository root. Any task needing shared files outside a site's allowed paths pauses for a scoped follow-up/configuration change. PARR and Gosno are excluded.

## Local status and troubleshooting

State: `%USERPROFILE%\.ag-bridge\state.json`; heartbeat: `heartbeat.json`; private logs: `agent-N-*.log` and `check-N-*.log`. Queue issues receive progress and PR links. Use one worker per queue. A local PID lock prevents duplicate processes on the same computer; do not install the same queue on two computers simultaneously.

After correcting a blocked task, create a follow-up task rather than deleting state blindly. Branches/workspaces are preserved for investigation. Task clones do not receive existing local `.env` files automatically. JFD and Swamp have no committed app lockfiles; their checks use `npm install --ignore-scripts --package-lock=false` without changing repository dependency files. WNO and WTA use their committed npm lockfiles with `npm ci --ignore-scripts`. Site runtime constraints may require Node 24 even if the bridge itself supports newer versions. Build-generated changes outside approved paths pause before push; adjust a task's scope deliberately if required.

Antigravity permissions remain scoped to its existing policy. Read/write tools inside its workspace are supported; shell tools may be denied in headless mode. The bridge runs the checks and Git publishing itself. Repository instructions/feedback are not treated as additional authorization.

## Verification

Run `node --test bridge.test.mjs`. Tests exercise the stdin protocol, a full audit round trip, a code-change/review/fix round trip, stale/foreign reviews, allowed paths, retry limits and interrupted-task handling using a fake agent/GitHub transport. Native Windows installation, Google/GitHub sign-in and real AG execution must be confirmed on the user's computer. The four queued audits provide that final check.

Official references: [AG headless mode](https://antigravity.google/docs/cli/headless/), [Windows installation](https://antigravity.google/docs/cli/install/), [Codex GitHub reviews](https://learn.chatgpt.com/docs/third-party/github).
