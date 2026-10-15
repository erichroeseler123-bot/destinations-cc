# AG Bridge: Ten-Site Portfolio Worker

This worker replaces manually relaying task instructions, code changes and code-review findings between ChatGPT/Codex and Antigravity. It uses GitHub issues as the queue and Antigravity's native CLI on Windows as the executor. It does not attach to an existing IDE conversation.

## Install on Windows

Run `install.ps1` from a permanent extracted copy of this directory. It installs missing Git, GitHub CLI, Node and Antigravity CLI when possible, handles initial sign-in, writes a Startup shortcut, and starts the worker. Use `-NoStartup` to skip the shortcut. It does not change AG's permission settings or skip permissions. The worker uses Node's standard library; no bridge dependencies or API keys are required. AG quota/credit usage follows your existing Google account plan.

Enable Codex Code Review for configured repositories in [Codex settings](https://chatgpt.com/codex/settings/code-review). The worker explicitly requests `@codex review` after each code push, so enabling automatic review triggers is optional. A missing review times out and pauses the task; it never counts as approval.

Keep the worker window open. The Startup shortcut reopens it at Windows sign-in. Closing the window stops polling; a running task interrupted by a close is marked blocked on the next run to avoid duplicate work. To disable startup, remove `AG Bridge.lnk` from `shell:startup`.

The worker checks its fixed setup branch for updates at idle checkpoints. It validates Git's content checksum and JavaScript syntax, replaces only `bridge.mjs`, then exits with code 75 so the launcher can restart it. Local configuration, credentials, logs and task state are preserved. This allows subsequent worker repairs without repeating the installation command. Close the window to stop the worker and its update checks.

## Queue protocol

Create an issue in `erichroeseler123-bot/destinations-cc` with a body starting with the marker and one JSON block:

```text
<!-- ag-bridge:v1 -->
```

```json
{"site":"jfd","mode":"code","instructions":"Describe the requested change and acceptance criteria here."}
```

Sites: `jfd`, `wno`, `wta`, `swamp`, `cruisepromenade`, `brinkberry`, `dells`, `dcc`, `socializor`, `oddjobs`. Modes: `audit` (read-only connection/source check) and `code` (edit/check/push/review). Optional `"revisit"` string in the JSON block (or updating `"instructions"`) triggers a clean revisit of a previously blocked/stalled task. Only issues created by a configured trusted GitHub author are accepted.

The worker ignores unrelated issues, pull requests, unknown site IDs, malformed task JSON, and tasks from other authors. Closing an issue removes it from future polling, but does not cancel a task already executing; close the worker window to stop it.

## Resilience, Blocker Classification, Bounded Retries & Per-Site Isolation

- **Workspace Allowed-Path Manifest & Tool Safeguards**: Before invoking AG, `Bridge.agent()` runs `git ls-files` scoped to `site.allowedPaths` and injects the exact list of existing allowed files into the prompt so AG never guesses test or source paths. It explicitly instructs AG to use only synchronous workspace file tools (`view_file`, `list_dir`, `find_by_name`, `grep_search`, `replace_file_content`, `multi_replace_file_content`, `write_to_file`) and never invoke `run_command` or `invoke_subagent`.
- **Automatic Blocker Classification (`classifyBlocker`)**: Every failure is classified into a structured category (`ag_permission_denied`, `ag_transient_or_incomplete`, `check_failed`, `git_checkout_or_index`, `scope_violation`, `review_timeout`, `review_fix_limit`, `external_mutation`, `config_or_mapping`, `agent_reported_blocked`, `interrupted`, or `unclassified`).
- **Bounded Retries & Stalled Task Revisit**: Retryable pre-PR failures (`ag_permission_denied`, `ag_transient_or_incomplete`, `git_checkout_or_index`) and `review_timeout` automatically schedule up to `maxTaskRetries` (`2`) retries after `retryCooldownMinutes` (`15` minutes), resetting uncommitted working-tree changes cleanly to `baseSha` before retrying. Non-retryable failures (such as `check_failed` or `scope_violation`) or tasks that exhaust their retry budget transition to `stalled: true`. Updating `instructions` or adding/changing `"revisit"` in the issue JSON resets the retry counter and revisits a stalled task cleanly.
- **Deduplicated Blocker Comments**: Repeated ticks never spam identical blocker comments on the same issue (`lastReportedErrorHash`).
- **Per-Site Queue Isolation & Separated Reporting**: `Bridge.tick()` sorts active/new tasks ahead of blocked tasks and isolates each task in its own `try / catch` block so one blocked site never blocks the other nine sites. `heartbeat.json` writes a `summary` object that separately reports `productionReleases` (always empty at the worker layer, since production deploys require separate verification), `completed` (`done` / `ready`), `inProgress` (`running` / `review`), `blocked` (with category, retry count, and stalled state), and `bySite`.

## Source mappings

| Site Key | Site | Repository | Configured directory | Vercel project record |
| --- | --- | --- | --- | --- |
| `jfd` | Juneau Flight Deck | `destinations-cc` | `apps/juneauflightdeck` | `juneauflightdeck` |
| `wno` | Welcome to New Orleans Tours | `destinations-cc` | `.` (`app/new-orleans/`, `apps/welcometoneworleanstours/`) | `welcometoneworleanstours` |
| `wta` | Welcome to Alaska Tours | `wta-renderer` | `.` | `wta-ui` |
| `swamp` | Welcome to the Swamp | `destinations-cc` | `apps/welcometotheswamp` | `welcometotheswamp` |
| `cruisepromenade` | Cruise Promenade | `cruisepromenade` (`phase31c-clean-rebuild`) | `.` | `cruisepromenade` |
| `brinkberry` | Brinkberry | `brinkberry` | `.` | `brinkberry` |
| `dells` | Welcome to the Dells | `destinations-cc` | `apps/welcometothedells` | `welcometothedells` |
| `dcc` | Destination Command Center | `destinations-cc` | `.` | `destinations-cc` |
| `socializor` | Socializor | `socializor` | `.` | `socializor` |
| `oddjobs` | Eau Claire Odd Jobs | `eauclaireoddjobs` | `.` | `modern-portfolio` |

## Verification

Run `node --test tools/ag-bridge/bridge.test.mjs`. Tests exercise the stdin protocol, a full audit round trip, a code-change/review/fix round trip, stale/foreign reviews, allowed paths, blocker classification, bounded retries, stalled task revisit, per-site isolation, separated reporting, workspace manifest injection, and interrupted-task handling.
