// Run with:  node --test .github/scripts/risk/risk.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  globToRegExp,
  parsePatch,
  bumpLevel,
  extractBumps,
  evaluate,
  parseLcov,
  diffCoverage,
  renderReport,
  checkRunPayload,
  reviewDecision,
} from './lib.mjs';

const policy = JSON.parse(readFileSync(new URL('../../risk/policy.json', import.meta.url), 'utf8'));

// ---- helpers ---------------------------------------------------------------
const patchOf = (added = [], removed = [], start = 1) =>
  `@@ -${start},${removed.length} +${start},${added.length} @@\n` +
  [...removed.map((l) => `-${l}`), ...added.map((l) => `+${l}`)].join('\n');
const file = (filename, added = [], removed = [], extra = {}) => ({
  filename,
  status: 'modified',
  additions: added.length,
  deletions: removed.length,
  changes: added.length + removed.length,
  patch: patchOf(added, removed),
  ...extra,
});
const pr = (extra = {}) => ({
  title: '[ALS-1] Change',
  body: '',
  draft: false,
  user: { login: 'someone', type: 'User' },
  head: { repo: { full_name: 'org/repo' } },
  base: { repo: { full_name: 'org/repo' } },
  ...extra,
});
const run = (files, prExtra) => evaluate({ pr: pr(prExtra), files, policy });
const rules = (r) => r.findings.filter((f) => f.level === 'block').map((f) => f.rule);

// ---- primitives ------------------------------------------------------------
test('globs', () => {
  assert.ok(globToRegExp('package.json').test('package.json'));
  assert.ok(!globToRegExp('package.json').test('src/package.json'));
  assert.ok(globToRegExp('**/*.{test,spec}.{ts,js}').test('src/lib/a.test.ts'));
  assert.ok(globToRegExp('src/routes/**/+server.{ts,js}').test('src/routes/api/x/+server.ts'));
  assert.ok(globToRegExp('src/**/*.{svelte,ts,js}').test('src/lib/components/Button.svelte'));
  assert.ok(globToRegExp('vite.config.*').test('vite.config.ts'));
  assert.ok(globToRegExp('.env*').test('.env.test'));
});

test('patch parsing tracks new-file line numbers', () => {
  const { added, removed } = parsePatch('@@ -1,3 +10,4 @@\n ctx\n-old\n+new1\n+new2\n ctx2');
  assert.deepEqual(added, [
    { line: 11, text: 'new1' },
    { line: 12, text: 'new2' },
  ]);
  assert.deepEqual(removed, ['old']);
});

test('bump levels and extraction', () => {
  assert.equal(bumpLevel('5.4.1', '5.4.2'), 'patch');
  assert.equal(bumpLevel('5.4.1', '5.5.0'), 'minor');
  assert.equal(bumpLevel('5.4.1', '6.0.0'), 'major');
  assert.equal(bumpLevel('5.4.1', '5.4.2-beta.1'), 'unknown');
  assert.deepEqual(extractBumps('[pnpm] Bump vite from 5.4.1 to 5.4.2', ''), [
    { from: '5.4.1', to: '5.4.2' },
  ]);
});

// ---- low risk --------------------------------------------------------------
test('docs-only and test-only (with assertions) PRs are low risk', () => {
  assert.equal(run([file('README.md', ['x'])]).risk, 'low');
  const r = run([
    file('src/lib/a.test.ts', ["it('works', () => {", '  expect(f()).toBe(1);', '});']),
  ]);
  assert.equal(r.risk, 'low', JSON.stringify(r.findings));
});

test('css and binary images are low risk', () => {
  assert.equal(run([file('src/lib/app.css', ['a{color:red}'])]).risk, 'low');
  assert.equal(
    run([
      file('static/logo.png', [], [], { patch: undefined, changes: 0, additions: 0, deletions: 0 }),
    ]).risk,
    'low',
  );
});

// ---- needs review ----------------------------------------------------------
test('small UI changes are low risk; larger ones, svg and unknown static files need review', () => {
  const small = run([file('src/lib/components/Button.svelte', ['<p>x</p>'])]);
  assert.equal(small.risk, 'low', JSON.stringify(small.findings));
  assert.ok(
    rules(
      run([
        file(
          'src/lib/a.ts',
          Array(policy.categories.find((c) => c.id === 'ui-source').lowRiskMaxLines + 1).fill(
            'const a = 1;',
          ),
        ),
      ]),
    ).includes('category:ui-source'),
  );
  assert.ok(rules(run([file('static/logo.svg', ['<svg/>'])])).includes('category:other'));
  assert.ok(rules(run([file('static/config.json', ['{}'])])).includes('category:other'));
});

test('small UI changes still trip every red flag', () => {
  assert.ok(
    rules(run([file('src/lib/components/Button.svelte', ['{@html body}'])])).includes('raw-html'),
  );
  assert.ok(rules(run([file('src/lib/a.ts', ['await fetch(url);'])])).includes('network-call'));
  assert.ok(
    rules(run([file('src/lib/auth/login.ts', ['const a = 1;'])])).includes('sensitive-path'),
  );
});

test('server code, build config, CI and env files need review', () => {
  assert.ok(
    rules(run([file('src/routes/api/x/+server.ts', ['x'])])).includes('category:server-code'),
  );
  assert.ok(rules(run([file('src/hooks.server.ts', ['x'])])).includes('category:server-code'));
  assert.ok(rules(run([file('package.json', ['x'])])).includes('category:build'));
  assert.ok(rules(run([file('vite.config.ts', ['x'])])).includes('category:build'));
  assert.ok(rules(run([file('.env.test', ['A=b'])])).includes('category:build'));
  assert.ok(rules(run([file('.github/workflows/tests.yml', ['x'])])).includes('category:ci'));
});

test('sensitive path outside tests/docs needs review, but "author" is fine', () => {
  assert.ok(rules(run([file('src/lib/auth/login.ts', ['x'])])).includes('sensitive-path'));
  assert.ok(!rules(run([file('src/lib/AuthorList.svelte', ['x'])])).includes('sensitive-path'));
  assert.equal(run([file('docs/auth.md', ['x'])]).risk, 'low');
});

test('red flags in application code', () => {
  const r = rules(
    run([
      file('src/lib/a.ts', [
        'el.innerHTML = x;',
        'localStorage.setItem("t", v);',
        'await fetch(url);',
        '// eslint-disable-next-line',
      ]),
    ]),
  );
  for (const id of ['raw-html', 'client-storage', 'network-call', 'suppression'])
    assert.ok(r.includes(id), id);
});

test('hollow, skipped, focused and deleted tests', () => {
  assert.ok(
    rules(run([file('src/lib/a.test.ts', ["it('x', () => { f(); });"])])).includes('hollow-test'),
  );
  assert.ok(
    rules(
      run([file('src/lib/a.test.ts', ["it.skip('x', () => { expect(1).toBe(1); });"])]),
    ).includes('test-skipped'),
  );
  assert.ok(
    rules(
      run([file('tests/e2e.spec.ts', ["test.only('x', async () => { expect(1).toBe(1); });"])]),
    ).includes('test-skipped'),
  );
  assert.ok(
    rules(
      run([
        file('src/lib/a.test.ts', [], ["it('x', () => { expect(1).toBe(1); });"], {
          status: 'removed',
        }),
      ]),
    ).includes('test-deleted'),
  );
  assert.ok(
    rules(
      run([file('src/lib/a.test.ts', ['f();'], ['expect(1).toBe(1);', 'expect(2).toBe(2);'])]),
    ).includes('assertions-removed'),
  );
});

test('hardcoded secret is flagged', () => {
  assert.ok(
    rules(run([file('README.md', ["const token = 'abcd1234efgh5678'"])])).includes(
      'hardcoded-secret',
    ),
  );
});

test('size limits, draft, fork', () => {
  assert.ok(
    rules(run([file('README.md', Array(policy.limits.maxChangedLines + 1).fill('l'))])).includes(
      'size',
    ),
  );
  assert.ok(rules(run([file('README.md', ['x'])], { draft: true })).includes('draft'));
  assert.ok(
    rules(run([file('README.md', ['x'])], { head: { repo: { full_name: 'evil/repo' } } })).includes(
      'fork',
    ),
  );
});

// ---- dependabot ------------------------------------------------------------
const bot = (title, body = '') => ({
  title,
  body,
  user: { login: 'dependabot[bot]', type: 'Bot' },
});
const pkgBump = (name, from, to) =>
  file('package.json', [`    "${name}": "^${to}",`], [`    "${name}": "^${from}",`]);
const lockBump = (name, from, to) =>
  file(
    'pnpm-lock.yaml',
    [`  ${name}@${to}:`, '    resolution: {integrity: sha512-new}'],
    [`  ${name}@${from}:`, '    resolution: {integrity: sha512-old}'],
  );

test('dependabot patch bump with lockfile is low risk', () => {
  const r = run(
    [pkgBump('vite', '5.4.1', '5.4.2'), lockBump('vite', '5.4.1', '5.4.2')],
    bot('[pnpm] Bump vite from 5.4.1 to 5.4.2', 'Bumps [vite](u) from 5.4.1 to 5.4.2.'),
  );
  assert.equal(r.risk, 'low', JSON.stringify(r.findings));
});

test('dependabot bump that adds a new transitive package needs review', () => {
  const lock = file('pnpm-lock.yaml', ['  vite@5.4.2:', '  evil-pkg@1.0.0:'], ['  vite@5.4.1:']);
  const r = run([pkgBump('vite', '5.4.1', '5.4.2'), lock], bot('Bump vite from 5.4.1 to 5.4.2'));
  assert.ok(rules(r).includes('bot-bump'));
  assert.match(JSON.stringify(r.findings), /evil-pkg/);
});

test('dependabot lockfile that moves a transitive package past a patch bump needs review', () => {
  const lock = file(
    'pnpm-lock.yaml',
    ['  vite@5.4.2:', '  lodash@5.0.0:'],
    ['  vite@5.4.1:', '  lodash@4.17.21:'],
  );
  const r = run([pkgBump('vite', '5.4.1', '5.4.2'), lock], bot('Bump vite from 5.4.1 to 5.4.2'));
  assert.ok(rules(r).includes('bot-bump'));
  assert.match(JSON.stringify(r.findings), /lodash/);
});

test('dependabot lockfile that changes a tarball URL needs review', () => {
  const lock = file(
    'pnpm-lock.yaml',
    ['  vite@5.4.2:', '    resolution: {tarball: https://evil.example/vite.tgz}'],
    ['  vite@5.4.1:', '    resolution: {integrity: sha512-old}'],
  );
  const r = run([pkgBump('vite', '5.4.1', '5.4.2'), lock], bot('Bump vite from 5.4.1 to 5.4.2'));
  assert.match(JSON.stringify(r.findings), /tarball/);
});

test('dependabot minor bump, renamed dependency, or extra files need review', () => {
  assert.equal(
    run([pkgBump('vite', '5.4.1', '5.5.0')], bot('Bump vite from 5.4.1 to 5.5.0')).risk,
    'review',
  );
  const renamed = file('package.json', ['    "evil": "^5.4.2",'], ['    "vite": "^5.4.1",']);
  assert.equal(run([renamed], bot('Bump vite from 5.4.1 to 5.4.2')).risk, 'review');
  assert.equal(
    run(
      [pkgBump('vite', '5.4.1', '5.4.2'), file('src/lib/a.ts', ['x'])],
      bot('Bump vite from 5.4.1 to 5.4.2'),
    ).risk,
    'review',
  );
});

test('a human PR with the same diff still needs review', () => {
  assert.equal(
    run([pkgBump('vite', '5.4.1', '5.4.2')], { title: 'Bump vite from 5.4.1 to 5.4.2' }).risk,
    'review',
  );
});

test('a user merely named dependabot[bot] but not type Bot is not trusted', () => {
  const r = run([pkgBump('vite', '5.4.1', '5.4.2')], {
    title: 'Bump vite from 5.4.1 to 5.4.2',
    user: { login: 'dependabot[bot]', type: 'User' },
  });
  assert.equal(r.risk, 'review');
});

test('dependabot versions must match the declared bump', () => {
  const declared = bot('Bump vite from 5.4.1 to 5.4.2', 'Bumps [vite](u) from 5.4.1 to 5.4.2.');
  assert.equal(run([pkgBump('vite', '5.4.1', '9.0.0')], declared).risk, 'review');
  assert.equal(run([pkgBump('vite', '4.0.0', '4.0.1')], declared).risk, 'review');
});

test('moving source into tests/ keeps the rules of where it came from', () => {
  const moved = file('tests/support/store.ts', [], ['const t = localStorage.getItem("token");'], {
    status: 'renamed',
    previous_filename: 'src/lib/auth/store.ts',
  });
  const r = rules(run([moved]));
  assert.ok(r.includes('client-storage'), r.join());
  assert.ok(r.includes('sensitive-path'), r.join());
});

test('authorization paths are sensitive; author paths are not', () => {
  for (const f of [
    'AuthorizationService.ts',
    'Authorize.ts',
    'Authorities.ts',
    'Authorizer.ts',
    'AuthoriseFilter.ts',
  ]) {
    assert.ok(rules(run([file(`src/lib/services/${f}`, ['x'])])).includes('sensitive-path'), f);
  }
  for (const f of ['AuthorDto.ts', 'Authors.ts', 'AuthorshipService.ts']) {
    assert.ok(!rules(run([file(`src/lib/services/${f}`, ['x'])])).includes('sensitive-path'), f);
  }
});

test('renaming a test file out of the test globs counts as deleting it', () => {
  const r = run([
    file('src/lib/foo.test.ts.disabled', [], [], {
      status: 'renamed',
      previous_filename: 'src/lib/foo.test.ts',
      changes: 0,
      patch: undefined,
    }),
  ]);
  assert.ok(rules(r).includes('test-deleted'), JSON.stringify(r.findings));
});

test('a rename within one category counts its lines once', () => {
  const r = run([
    file('src/lib/b.ts', Array(35).fill('const a = 1;'), [], {
      status: 'renamed',
      previous_filename: 'src/lib/a.ts',
    }),
  ]);
  assert.equal(r.risk, 'low', JSON.stringify(r.findings));
  assert.equal(r.stats.categories['ui-source'], 1);
});

// ---- coverage --------------------------------------------------------------
test('lcov diff coverage counts only executable changed lines, reports missing files', () => {
  const cov = parseLcov(
    'SF:/home/runner/work/r/r/src/lib/a.ts\nDA:1,1\nDA:2,0\nDA:3,4\nend_of_record\n',
  );
  const r = diffCoverage(
    new Map([
      ['src/lib/a.ts', [{ line: 1 }, { line: 2 }, { line: 9 }]],
      ['src/lib/b.ts', [{ line: 1 }]],
    ]),
    cov,
  );
  assert.equal(r.total, 2);
  assert.equal(r.pct, 50);
  assert.deepEqual(r.perFile[0].uncovered, [2]);
  assert.deepEqual(r.missing, ['src/lib/b.ts']);
});

test('report renders blockers and the review line', () => {
  const body = renderReport({
    result: run([file('package.json', ['x'])]),
    sha: 'abcdef123',
    reviewText: 'Needs 1 human approval(s)',
  });
  assert.match(body, /needs human review/);
  assert.match(body, /Review policy:\*\* Needs 1 human/);
});

// ---- review policy ------------------------------------------------
test('check run stays in progress while pending and completes otherwise', () => {
  const result = run([file('README.md', ['x'])]);
  const payload = (state) =>
    checkRunPayload({
      name: 'Review policy',
      sha: 'sha1',
      result,
      review: { state, description: 'd' },
    });
  assert.deepEqual(
    [payload('pending'), payload('success'), payload('failure')].map((p) => [
      p.status,
      p.conclusion,
    ]),
    [
      ['in_progress', undefined],
      ['completed', 'success'],
      ['completed', 'failure'],
    ],
  );
  assert.equal(payload('success').head_sha, 'sha1');
  assert.match(payload('success').output.summary, /Risk: low/);
});

const rv = (login, state, commit_id = 'sha1', type = 'User') => ({
  user: { login, type },
  state,
  commit_id,
});
const headPr = { user: { login: 'author' }, head: { sha: 'sha1' } };
const decide = (reviews, risk) => reviewDecision({ pr: headPr, reviews, risk, policy });

test('risk:low waives review; risk:needs-review needs a human approval', () => {
  assert.equal(decide([], 'low').state, 'success');
  assert.equal(decide([], 'review').state, 'pending');
  assert.equal(decide([rv('alice', 'APPROVED')], 'review').state, 'success');
});

test('approvals must be from a human, not the author, on the current commit', () => {
  const latestOnly = {
    ...policy,
    review: { ...policy.review, requireApprovalOnLatestCommit: true },
  };
  const decideLatest = (reviews, risk) =>
    reviewDecision({ pr: headPr, reviews, risk, policy: latestOnly });
  assert.equal(decide([rv('author', 'APPROVED')], 'review').state, 'pending');
  assert.equal(decide([rv('some-bot', 'APPROVED', 'sha1', 'Bot')], 'review').state, 'pending');
  assert.equal(decideLatest([rv('alice', 'APPROVED', 'old-sha')], 'review').state, 'pending');
});

test('requireApprovalOnLatestCommit: false accepts an approval on an older commit', () => {
  const anyCommit = {
    ...policy,
    review: { ...policy.review, requireApprovalOnLatestCommit: false },
  };
  const decideAny = (reviews, risk) =>
    reviewDecision({ pr: headPr, reviews, risk, policy: anyCommit });
  assert.equal(decideAny([rv('alice', 'APPROVED', 'old-sha')], 'review').state, 'success');
  assert.equal(decideAny([rv('author', 'APPROVED', 'old-sha')], 'review').state, 'pending');
  assert.equal(
    decideAny([rv('alice', 'APPROVED', 'old-sha'), rv('alice', 'DISMISSED', 'old-sha')], 'review')
      .state,
    'pending',
  );
  assert.equal(
    decideAny([rv('bob', 'CHANGES_REQUESTED'), rv('alice', 'APPROVED', 'old-sha')], 'review').state,
    'failure',
  );
  assert.doesNotMatch(decideAny([], 'review').description, /latest commit/);
});

test('dismissed approvals and change requests are respected, even on risk:low', () => {
  assert.equal(
    decide([rv('alice', 'APPROVED'), rv('alice', 'DISMISSED')], 'review').state,
    'pending',
  );
  assert.equal(decide([rv('bob', 'CHANGES_REQUESTED')], 'low').state, 'failure');
  assert.equal(
    decide([rv('bob', 'CHANGES_REQUESTED'), rv('bob', 'APPROVED')], 'review').state,
    'success',
  );
});
