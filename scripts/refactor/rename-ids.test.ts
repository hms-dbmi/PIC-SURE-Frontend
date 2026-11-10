import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const script = path.resolve(import.meta.dirname, '../../scripts/refactor/rename-ids.ts');

const fixture: Record<string, string> = {
  'src/lib/Table.svelte': [
    `<script lang="ts">`,
    `  let { id, help } = $props();`,
    `  const panelId = 'side-panel';`,
    `  document.getElementById('page')?.focus();`,
    `  const rows = document.querySelectorAll(\`#Users-table tr[id^="Users-row-"]\`);`,
    `</script>`,
    ``,
    `<div id="page" data-testid="page"><a href="https://x.org/?id=page">page</a>&#160;</div>`,
    `<label for="side-panel">Panel</label>`,
    `<input aria-describedby="hint side-panel" />`,
    `<p aria-describedby={help ? 'hint side-panel' : 'hint'}></p>`,
    `<tr id="{id}-row-1"></tr>`,
    `<b id="Legacy"></b>`,
    `<i id={help}></i>`,
    `<u id="authentication"></u>`,
    ``,
    `<style>`,
    `  #page > #side-panel { color: red; }`,
    `</style>`,
    '',
  ].join('\n'),
  'src/app.css': `nav#page .x, #side-panel { display: none; }\n`,
  'src/lib/tour.json': `[{ "element": "#Users-table #Users-row-0" }, { "element": "#Legacy" }]\n`,
  'tests/end-to-end/table.test.ts': [
    `page.locator('#page');`,
    `page.locator(\`#Users-row-\${n} td\`);`,
    `page.locator('tr[id^="Users-row-"]');`,
    `document.getElementById('side-panel');`,
    `const key = 'token';`,
    `page.locator('#modal');`,
    `page.getByText(/no token yet/);`,
    '',
  ].join('\n'),
};

const mapping = `
authentication -> keep   # a URL fragment target
page -> app-page
side-panel -> results-side-panel
hint -> results-hint
token -> user-token
Users-table -> admin-user-table
Users-row-<n> -> admin-user-table-row-<n>
modal -> !
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
  repo = mkdtempSync(path.join(tmpdir(), 'rename-ids-'));
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
describe('scripts/refactor/rename-ids.ts', { timeout: 20_000 }, () => {
  it('renames ids where markup sets them and wherever selectors, CSS and lookups name them', () => {
    const { status, out } = run();
    expect(status, out).toBe(0);

    expect(read('src/lib/Table.svelte')).toBe(
      [
        `<script lang="ts">`,
        `  let { id, help } = $props();`,
        `  const panelId = 'results-side-panel';`,
        `  document.getElementById('app-page')?.focus();`,
        `  const rows = document.querySelectorAll(\`#admin-user-table tr[id^="admin-user-table-row-"]\`);`,
        `</script>`,
        ``,
        // Testids, URLs, text and HTML entities aren't ids.
        `<div id="app-page" data-testid="page"><a href="https://x.org/?id=page">page</a>&#160;</div>`,
        `<label for="results-side-panel">Panel</label>`,
        `<input aria-describedby="results-hint results-side-panel" />`,
        `<p aria-describedby={help ? 'results-hint results-side-panel' : 'results-hint'}></p>`,
        `<tr id="{id}-row-1"></tr>`,
        `<b id="Legacy"></b>`,
        `<i id={help}></i>`,
        `<u id="authentication"></u>`,
        ``,
        `<style>`,
        `  #app-page > #results-side-panel { color: red; }`,
        `</style>`,
        '',
      ].join('\n'),
    );
    expect(read('src/app.css')).toBe(`nav#app-page .x, #results-side-panel { display: none; }\n`);
    expect(read('src/lib/tour.json')).toBe(
      `[{ "element": "#admin-user-table #admin-user-table-row-0" }, { "element": "#Legacy" }]\n`,
    );
    expect(read('tests/end-to-end/table.test.ts')).toBe(
      [
        `page.locator('#app-page');`,
        `page.locator(\`#admin-user-table-row-\${n} td\`);`,
        // A prefix selector follows a rule that ends in a hole.
        `page.locator('tr[id^="admin-user-table-row-"]');`,
        `document.getElementById('results-side-panel');`,
        `const key = 'token';`,
        `page.locator('#modal');`,
        `page.getByText(/no token yet/);`,
        '',
      ].join('\n'),
    );
  });

  it('reports test strings it leaves alone and ids renamed by hand', () => {
    const { status, out } = run('--dry-run');
    expect(status, out).toBe(0);
    expect(out).toContain('note  tests/end-to-end/table.test.ts:5  token (-> user-token)');
    expect(out).toContain(
      'warn  tests/end-to-end/table.test.ts:6  names an id renamed by hand: modal',
    );
    // A one-word id inside a regex is most likely text.
    expect(out).not.toContain('no token yet');
  });

  it('checks the convention, allowing a value that starts with the component id', () => {
    run();
    const { status, out } = run('--check');
    expect(status).toBe(1);
    expect(out).toContain('convention src/lib/Table.svelte:13  Legacy: not kebab-case');
    expect(out).toContain(
      "convention src/lib/Table.svelte:14  built from a value that isn't an id prop: help",
    );
    expect(out).not.toMatch(/convention.*(\{id\}-row-1|authentication)/);
  });
});
