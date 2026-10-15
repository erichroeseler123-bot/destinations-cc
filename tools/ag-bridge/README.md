# AG Bridge: 10-Site Portfolio Continuous Improvement Worker

This worker continuously researches, improves, tests, reviews, and prepares updates across the 10-website portfolio using GitHub issues (`erichroeseler123-bot/destinations-cc`) as the queue, Antigravity's native CLI (`agy.exe`) on Windows as the executor, and Codex (`@codex review`) as the automated PR reviewer.

## Configured Portfolio & Rotation Order

The worker rotates across 10 configured sites (`DEFAULT_SITE_ROTATION_ORDER`) on a 2-hour (`autoDiscoverIntervalMinutes: 120`) cycle when the active queue is empty:

| Order | Site ID | Name | Domain | Repository | Directory | Vercel Project |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `cruisepromenade` | Cruise Promenade | `cruisepromenade.com` | `erichroeseler123-bot/cruisepromenade` (`phase31c-clean-rebuild`) | `.` | `cruisepromenade` |
| 2 | `wta` | Welcome to Alaska Tours | `welcometoalaskatours.com` | `erichroeseler123-bot/wta-renderer` | `.` | `wta-ui` |
| 3 | `dells` | Welcome to the Dells | `www.welcometothedells.com` | `erichroeseler123-bot/destinations-cc` | `apps/welcometothedells` | `welcometothedells` |
| 4 | `brinkberry` | Brinkberry | `brinkberry.com` | `erichroeseler123-bot/brinkberry` | `.` | `brinkberry` |
| 5 | `swamp` | Welcome to the Swamp | `www.welcometotheswamp.com` | `erichroeseler123-bot/destinations-cc` | `apps/welcometotheswamp` | `welcometotheswamp` |
| 6 | `wno` | Welcome to New Orleans Tours | `www.welcometoneworleanstours.com` | `erichroeseler123-bot/destinations-cc` | `.` (`app/new-orleans/`, `apps/welcometoneworleanstours/`) | `welcometoneworleanstours` |
| 7 | `jfd` | Juneau Flight Deck | `juneauflightdeck.com` | `erichroeseler123-bot/destinations-cc` | `apps/juneauflightdeck` | `juneauflightdeck` |
| 8 | `oddjobs` | Eau Claire Odd Jobs | `eauclaireoddjobs.com` | `erichroeseler123-bot/eauclaireoddjobs` | `.` | `eauclaireoddjobs` |
| 9 | `dcc` | Destination Command Center | `destinationcommandcenter.com` | `erichroeseler123-bot/destinations-cc` | `.` | `destinations-cc` |
| 10 | `socializor` | Socializor | `socializor.app` | `erichroeseler123-bot/socializor` | `.` | `socializor` |

## Startup, Watchdog & Windows Task Scheduler

Run `install.ps1` from `C:\Users\erich\AppData\Local\AG-Bridge`. It configures:
1. **Supervisor loop (`Start-AG-Bridge.cmd` + `Ensure-AG-Bridge.vbs`)**:
   - Sets `AG_BRIDGE_SUPERVISED=1` and runs `node.exe bridge.mjs`.
   - Exit code `75` (self-update installed from `codex/ag-bridge-20261012`) restarts immediately. If `bridge.mjs` was ever started outside `Start-AG-Bridge.cmd`, it spawns a detached replacement before exiting so self-updates never stop the worker.
   - Exit code `78` (`EALREADY_RUNNING` when another live `node.exe` worker holds `C:\Users\erich\.ag-bridge\worker.lock`) exits cleanly (`exit /b 0`) so duplicate launches never loop or open extra windows.
   - Unexpected non-zero exit codes wait 15 seconds (`timeout /t 15`) and automatically restart.
2. **Stale Lock Protection (`acquireWorkerLock` & `isWorkerPidAlive`)**:
   - Checks both `process.kill(pid, 0)` and Windows `tasklist /FI "PID eq <pid>"` so that if a PID in `worker.lock` was recycled by Windows after a reboot into a non-`node.exe` process, the stale lock is automatically detected and replaced.
   - Registers `exit`, `SIGINT`, `SIGTERM`, `SIGHUP`, and `SIGBREAK` cleanup handlers.
3. **Windows Task Scheduler Limitation & Working Solution**:
   - **Limitation**: Standard (non-elevated) Windows user accounts (`IsAdmin: False`) receive `Access is denied` when registering system boot triggers (`New-ScheduledTaskTrigger -AtStartup`) or `-RunLevel Highest`.
   - **Working Solution**: `install.ps1` registers the user-scoped Scheduled Task `AG-Bridge-Worker` combining an `-AtLogOn -User $env:USERNAME` trigger and a repeating 15-minute watchdog trigger (`-RepetitionInterval (New-TimeSpan -Minutes 15)`) launching `wscript.exe Ensure-AG-Bridge.vbs` (`MultipleInstances = IgnoreNew`), alongside the Startup folder shortcut (`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\AG Bridge.lnk`). This starts the worker automatically at sign-in and recovers it within 15 minutes if terminated, with zero elevation required and zero console window popups.

## Verified Commit Author Identity (Vercel Private Repo Compatibility)

Private repositories connected to Vercel (`cruisepromenade`, `socializor`, `eauclaireoddjobs`) enforce Vercel commit-author verification (`<!-- vercel-commit-author-required -->`). Unlinked noreply addresses (`ag-bridge@users.noreply.github.com`) have `author: null` on GitHub and are blocked by Vercel from deploying previews.

`config.json` and `bridge.mjs` use the repository owner's verified GitHub and Vercel identity (`commitAuthorName: "erichroeseler123-bot"`, `commitAuthorEmail: "erichroeseler123@gmail.com"`), ensuring every worker commit is linked to `erichroeseler123-bot` on GitHub and passes Vercel deployment verification legitimately without weakening security.

## Automatic Task Discovery & PR Merge Reconciliation

- **Automatic `ready -> done` Reconciliation (`reconcileReadyTask`)**: On each tick, before checking whether the queue is empty, the worker inspects any `ready` task's PR. Once the PR is merged or closed, the worker automatically marks the task `done`, records `mergedSha`, and closes the corresponding queue issue on `erichroeseler123-bot/destinations-cc`.
- **Automatic Task Discovery (`discoverNextTaskIfEmpty` & `selectNextRotationSite`)**: When no open issue is in `new`, `running`, `review`, or `ready` status and at least `autoDiscoverIntervalMinutes` (`120` minutes) have elapsed since `rotation.lastCreatedAt`, the worker selects the next eligible site in rotation (`skip`ping busy/stalled sites and already-dispatched task keys/hashes) and creates the next scoped GitHub issue automatically.
- **Multi-Pass Discovery Backlog (`DEFAULT_SITE_DISCOVERY_BACKLOG`)**: Each site has verified, file-specific UX, mobile usability (`320px`/`375px`), accessibility (WCAG 2.2), Core Web Vitals (CLS/LCP), conversion clarity, and technical SEO improvements. Pass 0 completes across all eligible sites before advancing to `followUps` (Pass 1).

## Safeguards & Verification

- **Path & Governance Safeguards**: `allowedFile()` blocks `.env*`, `.git`, `.github`, `.vercel`, `AGENTS.md`, `MASTER_DOMAIN_LEDGER.md`, `vercel.json`, `package.json`, lockfiles, and `middleware`/`proxy` files.
- **Pre-PR Crash Recovery**: If the worker is interrupted while a task is `running` before a PR is opened, the next tick marks it `blocked` with a 15-minute cooldown and `needsCleanReset = true`, then automatically resets the workspace and retries up to `maxTaskRetries`. Post-PR interruptions remain paused to prevent duplicate PR commits.
- **Independent Site Checks & Exact-SHA Codex Review**: Every code task runs its configured `npm ci` / `typecheck` / `test` / `build` checks before pushing, requests `@codex review` on the exact commit SHA, and only transitions to `ready` when `chatgpt-codex-connector[bot]` reviews that exact commit SHA with zero findings.
- **Unit Test Suite**: Run `node --test bridge.test.mjs` (`24/24` tests covering queue parsing, path guards, review matching, self-update checksums, NTFS sparse checkout, bounded retries, crash recovery, lock management, PR merge reconciliation, and multi-pass auto-discovery).
