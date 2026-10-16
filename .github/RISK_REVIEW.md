# Risk-based PR review

Every PR is classified from its diff, on every push:

- **`risk:low`**: no human review is required. The author can merge once the required checks pass.
- **`risk:needs-review`**: a human who is not the author must approve the PR before it can merge. By default the approval must be on the latest commit (see `review.requireApprovalOnLatestCommit`).

Nothing here approves or merges a PR. The workflows only set a label and publish one check, `Review policy`, whose summary lists the findings. Nothing is commented on the PR.

## Files

| File                            | Purpose                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `workflows/risk-classifier.yml` | Job **Risk classifier**: label and the **`Review policy`** check run                                                                    |
| `workflows/review-trigger.yml`  | A no-op that fires when a review is submitted/dismissed, so `Review policy` is recomputed (via `workflow_run`, which runs trusted code) |
| `workflows/quality-gates.yml`   | Jobs **Diff coverage** and **Duplication delta**, for every PR                                                                          |
| `risk/policy.json`              | All tunable rules: categories, limits, red-flag patterns, trusted bots                                                                  |
| `scripts/risk/*.mjs`            | Dependency-free Node scripts; `risk.test.mjs` holds the unit tests (`node --test .github/scripts/risk/risk.test.mjs`)                   |
| `scripts/risk/package.json`     | Pins jscpd for **Duplication delta**. The scripts themselves need no install.                                                           |
| `CODEOWNERS`                    | Sensitive paths that need a named owner                                                                                                 |
| `dependabot.yml`                | Weekly pnpm, Docker and jscpd update PRs                                                                                                |

### Why `review-trigger.yml` is a separate file

It looks foldable into `risk-classifier.yml`, but it must not be. GitHub decides which copy of a workflow file runs based on the event:

- `pull_request_target` and `workflow_run` run the file from the **base branch**, so a PR cannot edit them. The classifier relies on this.
- `pull_request_review` (an approval or dismissal) has no `_target` variant. It runs the file from the **PR's own branch**, and on fork PRs with a read-only token.

If the classifier listened to `pull_request_review` directly, a PR could rewrite its own classifier to report success. So `review-trigger.yml` does nothing except finish, and its completion fires the classifier's `workflow_run` trigger, which runs trusted code from the base branch with a write-capable token. A PR can edit the no-op, but that only causes an extra re-run. Without it, an approval would not update `Review policy` until the next push or label change.

Keep the review event out of `risk-classifier.yml` for the same reason.

`tests.yml` declares `permissions: contents: read` so that no job running PR code holds `checks: write`: test code in the existing workflows could otherwise post a fake `Review policy` check as the same GitHub Actions app the ruleset trusts. This does not stop a PR that adds or edits a workflow itself; code-owner review of `.github/` does (see "Who can forge `Review policy`"). The same goes for `quality-gates.yml`. Keep it that way when adding jobs.

## How a PR is judged

A PR is `risk:needs-review` if **any** of the following is true. If none is, it is `risk:low`. All limits and patterns are in `risk/policy.json`.

### Needs review (any one of these)

1. **A changed file is not docs, tests, static assets or application source.** That means anything under `.github/`, build and dependency files (`package.json`, `pnpm-lock.yaml`, vite/svelte/tsconfig/eslint configs, Dockerfiles, scripts, `.env*`), server-side SvelteKit code (`+server`, `*.server`, hooks, `lib/server`), or any other path.
2. **Application source is too large.** More than `lowRiskMaxLines` changed lines (60 now) across `src/**/*.{svelte,ts,js}`.
3. **The PR is too large overall.** More than `limits.maxChangedLines` changed lines (150 now) or `limits.maxFiles` files (10 now), counting every file except `pnpm-lock.yaml`.
4. **The PR is a draft, or comes from a fork.**
5. **A path looks sensitive.** Auth, token, session, crypto, consent and similar words in the name.
6. **Security red flags in added lines.** Raw HTML (`{@html}`, `innerHTML`), dynamic code, browser storage, new network calls, navigation/postMessage, env access, PHI/PII identifiers, lint/type suppressions, hardcoded secrets.
7. **Test hygiene problems.** Deleted, skipped or focused tests, new tests without assertions, or a net loss of assertions.

The one exception to rule 1 is a Dependabot **patch** bump that only changes version numbers in `package.json` and `pnpm-lock.yaml`, where every changed `package.json` version is one the PR title/body declares and the lockfile change introduces **no new package**.

### Low risk (everything else)

A `risk:low` PR changes only **docs, tests, plain CSS, raster images and small application source**, stays within both size limits, and trips none of the flags above. No human review is required; the required checks are the reviewer.

### How lines are counted

"Changed lines" is additions plus deletions, per file, summed. The two limits count different sets of files:

- `limits.maxChangedLines` counts **every file** in the PR (except paths in `limits.ignoreForSize`, which holds `pnpm-lock.yaml`).
- `lowRiskMaxLines` counts **only files in that category**.

Example: 40 lines of source, 80 of tests and 20 of docs is 140 lines in total, under 150. The source is judged on its own 40 lines against `lowRiskMaxLines`.

Keep `lowRiskMaxLines` below `maxChangedLines`. If it is higher, the overall limit always trips first and `lowRiskMaxLines` has no effect.

The classifier re-runs on `opened`, `synchronize` (every push), `reopened`, `edited`, `ready_for_review`,
`converted_to_draft`, `labeled`, `unlabeled`, and on every review submitted or dismissed. It recomputes from scratch and
**replaces** the label, so a PR that starts as docs-only and later touches auth code flips to `risk:needs-review`.
Merge rules key off the `Review policy` check for the head commit, never off the label, so tampering with the label does nothing.

The classifier runs from the **base branch** and never executes PR code, so a PR cannot edit its own rules. Any change under `.github/` is itself `needs-review`.

A renamed file is judged by both its old and new paths, so moving a file into a lenient location (such as `tests/`) cannot shed the rules of where it came from. Renaming a test file to a path that no longer runs as a test counts as a deleted test.

### The `Review policy` check

| Situation                                                                                         | Check run                           |
| ------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `risk:low`                                                                                        | success, "no human review required" |
| `risk:needs-review`, no qualifying approval yet                                                   | in progress (blocks merge)          |
| `risk:needs-review`, approved by a human other than the author **on the latest commit** (default) | success                             |
| anyone has an outstanding "changes requested" (either risk level)                                 | failure                             |

Approvals from bots and from the author never count. Raise `review.minApprovals` in the policy for two reviewers.

#### Approval on the latest commit: `review.requireApprovalOnLatestCommit`

| Value            | Behavior                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `true` (default) | Only approvals on the PR's current head commit count. A new push means the PR needs approval again.                                |
| `false`          | A human's approval counts no matter which commit it was given on. Dismissed approvals and outstanding change requests still apply. |

Setting `false` means code pushed after the approval is not reviewed, and a PR that is reclassified as `needs-review` by a later push is satisfied by an earlier approval. Prefer `true` unless review fatigue outweighs that.

Two places enforce this and they must agree. If the branch ruleset has _dismiss stale approvals on new commits_ on, GitHub dismisses approvals itself on every push, so the classifier never sees an old one and `false` has no effect. To use `false`, turn that ruleset setting off too.

Approving re-runs the classifier (`Review Trigger` → `Risk Classifier`), so an approved `risk:needs-review` PR becomes mergeable without a new push. This also works for fork PRs, with two limits: GitHub may hold the fork's `Review Trigger` run until a maintainer approves it, and a fork that deletes `review-trigger.yml` never triggers. In either case, add or remove any label after approving to re-run the classifier.

### Who can forge `Review policy`

It is a check run created with `GITHUB_TOKEN`, so it belongs to the GitHub Actions app, and the ruleset accepts it only from that app (see settings below).

- **Blocked:** posting it with a personal token. Only GitHub Apps can create check runs; a commit status with the same name from anyone else does not satisfy the rule.
- **Blocked by code-owner review, not by permissions:** a PR adding its own `on: pull_request` workflow with `checks: write`, which runs from the PR's own copy and posts a passing `Review policy`. The fake result replaces the classifier's, so the check alone proves nothing for that PR. What stops the merge is that the PR touches `.github/`, so the ruleset's "Require review from Code Owners" still needs an owner other than the author to approve. **This holds only if that ruleset setting is on and `CODEOWNERS` covers `/.github/`.** Treat both as prerequisites for making `Review policy` required.
- **Not blocked:** someone with write access pushing a workflow on a branch outside any PR that posts a passing check on another PR's commit. That run is visible in the Actions history under their name. Push rulesets that restrict `.github/workflows/**` on all branches would close it if the org's plan offers them. A GitHub App owned by the org, with its key in an environment limited to `main`, would close it fully.

### Why source code is safe to include

With no reviewer on `risk:low` source changes, the **required checks are the reviewer**. They must be required in the ruleset (below), not merely present:
tests, lint/format, type check, diff coverage (80% of added lines), and no new duplicated code. The red-flag patterns catch the riskiest constructs in a small diff;
the `lowRiskMaxLines` cap keeps what remains small enough to fail loudly in CI. Tune both from audit data.

There is **no SAST gate by default**: CodeQL is off unless you enable it (see [Enabling CodeQL](#enabling-codeql-optional)). Until you do, the
red-flag patterns are the only security analysis on `risk:low` source changes, so consider a lower `lowRiskMaxLines` (0 sends all source to a human).

## Rollout

1. **Observe (2 to 4 weeks).** Merge these files but leave the ruleset as it is (1 required approval). Every PR gets a label and a
   `Review policy` check, but the check is not required yet, so nothing changes for anyone. Compare `risk:low`
   verdicts with what your reviewers would have said, especially for source changes. Tune `risk/policy.json`.
2. **Waive review for low risk.** In the branch ruleset, set required approvals to 0 and add `Review policy` as a required status check
   (**"Require review from Code Owners" must be on and `/.github/` must be in `CODEOWNERS`**: they are what stop a PR from forging `Review policy`, see "Who can forge"). From now on `risk:low` PRs merge without review and everything else waits for a human.
3. **Widen or tighten.** Review about 10 percent of `risk:low` merges each week. Raise `lowRiskMaxLines` if audits come back clean; lower it
   (0 turns source back into human-review-only) if they don't.

**Kill switch:** remove `Review policy` from the required checks and set approvals back to 1. The classifier keeps labeling harmlessly.

## One-time repository settings

1. **Branch ruleset** for the default branch (final state after rollout step 2): require a pull request with **0** approvals,
   _dismiss stale approvals on new commits_ (keep this on while `review.requireApprovalOnLatestCommit` is `true`; turn it off if you set that to `false`), require review from Code Owners, and require these status checks: `Review policy`,
   `lint`, `typecheck`, `vitest`, `playwright (1/3)`, `playwright (2/3)`, `playwright (3/3)`, `Check labels`, `Diff coverage`, `Duplication delta`. For `Review policy`, set the
   check's source to **GitHub Actions** rather than "any source". `tests.yml`'s `audit` job is `continue-on-error`, so it is advisory and cannot be required. Block force pushes, and enable a merge queue if you can. Do not give any bot bypass rights.
2. **Code security**: enable secret scanning with push protection and the dependency graph. CodeQL is optional (see below).
3. Keep `dependabot.yml` on the default branch so patch bumps arrive as PRs the classifier can fast-track.

## Verify on the first real PRs

The scripts are unit-tested and were run end to end against a mocked GitHub API, but not yet against live GitHub Actions. Check these first:

1. **Code-owner review with 0 approvals.** Confirm in a test PR that, with required approvals set to 0 and "Require review from Code Owners" on, a PR touching a CODEOWNERS path is still blocked until the owner approves. If the ruleset does not enforce that combination, keep approvals at 1 or drop the waiver for those paths.
2. **Review latency.** After a review is submitted, `Review Trigger` then `Risk Classifier` must run before `Review policy` turns green (typically under a minute). Check on a test PR.
3. **Vitest coverage flags.** `Diff coverage` runs `pnpm run test:vitest --coverage.enabled=true --coverage.reporter=lcov ...`, using `@vitest/coverage-v8` (pinned to the same version as `vitest`; bump them together). Run locally, this produces `coverage/lcov.info`.
4. **Svelte coverage.** `.svelte` files appear in the lcov output when run locally. If one is ever missing in CI, the job warns "No coverage data for ..." instead of failing, which would let untested component changes through as `risk:low`. Consider setting `coverage.failOnMissingFile` to `true` once a few PRs have confirmed this.
5. **Duplicate work.** `Diff coverage` installs dependencies and runs vitest again beside `tests.yml`. If CI minutes matter, add the coverage flags to the existing `vitest` job and upload `lcov.info` instead.
6. **Check names.** Open a PR and confirm the check names match what the ruleset requires exactly (especially `playwright (1/3)`). Confirm `Review policy` appears on the PR's head commit, and that the ruleset lists GitHub Actions as its source.
7. **Duplication baseline.** `Duplication delta` fails only on clones that `origin/<base>` does not have (`--baseline-from-ref`). Confirm the first runs pass on PRs that add no source, and that jscpd reads `.svelte` files; if the numbers look empty, restrict the pattern to `ts,js`. Tune `--min-lines`/`--min-tokens` or allow a few new clones (`--fail-on-new-clones N`) in `quality-gates.yml` if it is too strict.
8. **Red-flag noise.** `fetch(`, `localStorage` and the path words (`token`, `session`, `role`) are deliberately broad. Expect some false positives in the observe phase and tune `risk/policy.json`.

## Not included, and why

- **Auto-merge.** Excluded on purpose: a `risk:low` PR is simply mergeable by its author. It can be added back later.
- **Mutation testing (Stryker)** needs configuration inside the project, so it cannot be added from workflow files alone. Now that source changes can skip review, it is the best next gate for catching tests that pass but prove nothing.
- **Dependency-review and gitleaks/trufflehog actions**: left out to avoid pinning more third-party actions. GitHub-native secret scanning covers secrets without them.
- **CodeQL / SAST**: off by default. It is free on public repos but needs a paid GitHub Code Security license on private ones. See below to turn it on.
- **Complexity thresholds and static analysis beyond ESLint (already in `lint`)**: adding them as gates would fail on existing findings. Add them with a baseline first.

## Enabling CodeQL (optional)

CodeQL adds whole-codebase security analysis (XSS, injection, path traversal, and so on). It is free on public repos; private repos need GitHub Code Security.

1. In Settings → Code security → Code scanning, choose **CodeQL analysis → Set up → Default**, language `javascript-typescript`.
   Default setup and an advanced `codeql.yml` workflow conflict, so use one or the other.
2. Open a PR and confirm the check is named exactly `Analyze (javascript-typescript)`.
3. Observe for a couple of weeks. If it is noisy, fix or dismiss existing alerts first so it only flags new ones.
4. Add `Analyze (javascript-typescript)` to the branch ruleset's required status checks. **Do this only after step 2**: requiring a check that never reports blocks every PR.
5. Optionally raise `lowRiskMaxLines` in `risk/policy.json` again, since `risk:low` source changes now have a SAST gate.

To turn it off, remove `Analyze (javascript-typescript)` from the required checks first, then disable code scanning.

## Possible improvements

Not built. See the api repo's `RISK_REVIEW.md` for the fuller list (diff-based re-approval, per-category approval settings, a GitHub App to publish the check, push rulesets).
