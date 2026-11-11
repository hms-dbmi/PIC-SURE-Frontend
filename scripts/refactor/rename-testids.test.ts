import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const script = path.resolve(import.meta.dirname, '../../scripts/refactor/rename-testids.ts');

const fixture: Record<string, string> = {
  'src/lib/Row.svelte': [
    `<script lang="ts">`,
    `  let { 'data-testid': testid = 'error-alert', id, active } = $props();`,
    `  const unrelated = 'save-btn';`,
    `</script>`,
    ``,
    `<div data-testid="user-{id}-edit-btn" class="save-btn">save-btn</div>`,
    `<div data-testid={id === 'root' ? 'filter-root' : 'group-row'}></div>`,
    `<div data-testid={testid || 'copy'}></div>`,
    `<button {...testid ? { 'data-testid': \`\${testid}-btn\` } : {}}></button>`,
    `<p data-testid="{testid}-btn"></p>`,
    `<span data-testid="landing-action-{id}-btn"></span>`,
    '',
  ].join('\n'),
  'src/lib/Panel.svelte': [
    `<div data-testid={testid || title.replaceAll(' ', '-')}></div>`,
    `<table data-testid="{name}-table"></table>`,
    `<i data-testid={id}></i>`,
    `<b data-testid="Legacy-{id}"></b>`,
    '',
  ].join('\n'),
  'src/lib/tour.json': `[{ "element": "#row [data-testid=save-btn]" }, { "element": "[data-testid=\\"copy\\"]" }]\n`,
  'tests/end-to-end/row.test.ts': [
    `const testId = 'save-btn';`,
    `const id = 'u1';`,
    `page.getByTestId('save-btn');`,
    `page.getByTestId(\`user-\${id}-edit-btn\`);`,
    `page.getByTestId('user-a@b.c-edit-btn');`,
    `page.locator('#x [data-testid="save-btn"]');`,
    `const ids = ['copy', 'group-row', 'other-btn'];`,
    `page.getByTestId(\`\${id}-btn\`);`,
    `page.getByTestId(/^user-.*-edit-btn$/);`,
    `page.locator('[data-testid^="user-"]');`,
    `page.getByTestId(\`landing-action-\${id}-btn\`);`,
    `page.getByTestId('copy-btn');`,
    `page.getByTestId('user-7-delete-btn');`,
    `page.getByTestId('group-row-btn');`,
    '',
  ].join('\n'),
};

const mapping = `
# shared
<id>-btn -> <id>-trigger
save-btn -> admin-row-save
user-<id>-edit-btn -> admin-user-edit-<id>
user-<id>-delete -> admin-user-delete-<id>
copy -> ui-copy
error-alert -> ui-error-alert
group-row -> keep   # exempt from --check
Legacy-<id> -> keep
landing-action-<title>-btn -> !
`;

let repo: string;

function run(...args: string[]) {
  const result = spawnSync(process.execPath, [script, 'map.txt', ...args], {
    cwd: repo,
    encoding: 'utf-8',
  });
  return { status: result.status, out: result.stdout + result.stderr };
}

const read = (file: string) => readFileSync(path.join(repo, file), 'utf-8');

beforeEach(() => {
  repo = mkdtempSync(path.join(tmpdir(), 'rename-testids-'));
  for (const [file, text] of Object.entries(fixture)) {
    mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
    writeFileSync(path.join(repo, file), text);
  }
  writeFileSync(path.join(repo, 'map.txt'), mapping);
  execFileSync('git', ['init', '-q'], { cwd: repo });
  execFileSync('git', ['add', '-A'], { cwd: repo });
});

afterEach(() => rmSync(repo, { recursive: true, force: true }));

// Each test runs the script in a child process, which loads TypeScript and runs git.
describe('scripts/refactor/rename-testids.ts', { timeout: 20_000 }, () => {
  it('renames testids where the app sets them and wherever tests and selectors name them', () => {
    const { status, out } = run();
    expect(status, out).toBe(0);

    expect(read('src/lib/Row.svelte')).toBe(
      [
        `<script lang="ts">`,
        `  let { 'data-testid': testid = 'ui-error-alert', id, active } = $props();`,
        `  const unrelated = 'save-btn';`,
        `</script>`,
        ``,
        `<div data-testid="admin-user-edit-{id}" class="save-btn">save-btn</div>`,
        `<div data-testid={id === 'root' ? 'filter-root' : 'group-row'}></div>`,
        `<div data-testid={testid || 'ui-copy'}></div>`,
        `<button {...testid ? { 'data-testid': \`\${testid}-trigger\` } : {}}></button>`,
        `<p data-testid="{testid}-trigger"></p>`,
        `<span data-testid="landing-action-{id}-btn"></span>`,
        '',
      ].join('\n'),
    );
    expect(read('src/lib/tour.json')).toBe(
      `[{ "element": "#row [data-testid=admin-row-save]" }, { "element": "[data-testid=\\"ui-copy\\"]" }]\n`,
    );
    expect(read('tests/end-to-end/row.test.ts')).toBe(
      [
        `const testId = 'admin-row-save';`,
        `const id = 'u1';`,
        `page.getByTestId('admin-row-save');`,
        `page.getByTestId(\`admin-user-edit-\${id}\`);`,
        `page.getByTestId('admin-user-edit-a@b.c');`,
        `page.locator('#x [data-testid="admin-row-save"]');`,
        // Strings outside getByTestId and testid variables are only reported.
        `const ids = ['copy', 'group-row', 'other-btn'];`,
        `page.getByTestId(\`\${id}-btn\`);`,
        `page.getByTestId(/^user-.*-edit-btn$/);`,
        `page.locator('[data-testid^="user-"]');`,
        `page.getByTestId(\`landing-action-\${id}-btn\`);`,
        // A trigger follows the testid it opens, whether that is renamed or kept.
        `page.getByTestId('ui-copy-trigger');`,
        `page.getByTestId('admin-user-delete-7-trigger');`,
        `page.getByTestId('group-row-trigger');`,
        '',
      ].join('\n'),
    );
    expect(out).toContain('renamed 15 testids in 3 files');
  });

  it('reports what it would rewrite and what it leaves to a person', () => {
    const { status, out } = run('--dry-run');
    expect(status, out).toBe(0);
    expect(out).toContain('edit  src/lib/Row.svelte:6  user-{id}-edit-btn -> admin-user-edit-{id}');
    expect(out).toContain('names a testid renamed by hand: landing-action-{id}-btn');
    expect(out).toContain('names an old testid; edit by hand: /^user-.*-edit-btn$/');
    expect(out).toContain('names an old testid; edit by hand: user-');
    expect(out).toContain('note  tests/end-to-end/row.test.ts:7  copy (-> ui-copy)');
    expect(out).toContain('may name a trigger; edit by hand: ${id}-btn');
    expect(out).not.toContain('other-btn (');
    expect(read('src/lib/Row.svelte')).toBe(fixture['src/lib/Row.svelte']);
  });

  it('checks for stale testids and the convention', () => {
    const before = run('--check');
    expect(before.status).toBe(1);
    expect(before.out).toContain(
      'stale src/lib/Row.svelte:6  user-{id}-edit-btn (-> admin-user-edit-{id})',
    );
    expect(before.out).toContain(
      `convention src/lib/Panel.svelte:1  built from display text: {testid || title.replaceAll(' ', '-')}`,
    );
    expect(before.out).toContain(
      'convention src/lib/Panel.svelte:2  {name}-table: starts with {name}, not an area or the testid prop',
    );
    expect(before.out).toContain(
      "convention src/lib/Panel.svelte:3  built from a value that isn't a testid prop: id",
    );
    expect(before.out).toContain(
      'convention src/lib/Row.svelte:11  landing-action-{id}-btn: names the element ("btn"), not the action',
    );
    // `keep` exempts group-row; `filter-root` follows the convention; `root` is compared, not set.
    expect(before.out).not.toMatch(/convention.*(group-row|filter-root|'root')/);
    expect(before.out).not.toContain('Legacy-{id}');

    run();
    writeFileSync(path.join(repo, 'src/lib/Panel.svelte'), `<div data-testid={testid}></div>\n`);
    const replaced = read('src/lib/Row.svelte').replace(
      'landing-action-{id}-btn',
      'landing-action-{id}',
    );
    writeFileSync(path.join(repo, 'src/lib/Row.svelte'), replaced);
    const tests = read('tests/end-to-end/row.test.ts')
      .replace(/.*\/\^user-.*\n/, '')
      .replace(/.*data-testid\^=.*\n/, '')
      .replace(/.*\$\{id\}-btn.*\n/, '')
      .replace('landing-action-${id}-btn', 'landing-action-${id}');
    writeFileSync(path.join(repo, 'tests/end-to-end/row.test.ts'), tests);
    const after = run('--check');
    expect(after.out).toContain('ok: 8 app testids follow the convention');
    expect(after.status, after.out).toBe(0);
  });

  it('lists the testids the app sets', () => {
    const { status, out } = run('--list');
    expect(status, out).toBe(0);
    expect(out).toContain('src/lib/Row.svelte:6  user-{id}-edit-btn');
    expect(out).not.toContain('tests/');
  });

  it('rejects a rule that adds a hole', () => {
    writeFileSync(path.join(repo, 'map.txt'), 'user-<id>-edit -> admin-user-edit-<uuid>\n');
    const { status, out } = run('--dry-run');
    expect(status).toBe(1);
    expect(out).toContain("<uuid> isn't on the old side");
  });
});
