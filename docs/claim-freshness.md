# DCC claim source freshness

The claim ledger lives at `data/claims/dcc.claim-ledger.v1.json`. Each record names the original authority, the date it was checked, the next check date, and the sites that use it. Spokes use versioned exports, so updating the ledger alone does not update a deployed spoke snapshot.

Run the review queue from the DCC repository root:

```sh
node scripts/dcc/report-claim-freshness.mjs
```

Use `--json` for an ops brief or another program, `--as-of YYYY-MM-DD` to inspect a date, and `--lead-days N` to change the 14-day advance window. `--fail-on-problem` exits nonzero for stale, disputed, or unconfirmed records. It does not fail for sources merely due soon.

For every flagged claim, open its primary authority URL and verify the exact assertion. Update `checkedAt`, `nextCheckAt`, `status`, and the text or limitations as appropriate; do not advance dates without a new check. Regenerate the versioned snapshots with `node scripts/dcc/export-claim-ledger.mjs <site> <output>`, update any independent spoke repository, and deploy it through its usual review process. The DCC record is an audit trail; readers should have a direct link to the primary authority.

The existing **DCC Truth Audit** GitHub workflow runs the freshness check on relevant pull requests and can be run manually. It has no recurring schedule. The report lists only registered claims; it does not prove that all claims on all site pages have been audited or that a primary source has not changed before its next check date.
