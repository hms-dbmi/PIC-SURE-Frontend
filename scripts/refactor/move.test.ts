import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const script = path.resolve(import.meta.dirname, '../../scripts/refactor/move.ts');

const fixture: Record<string, string> = {
  'src/lib/index.ts': `export { a } from './util/a.ts';\n`,
  'src/lib/util/a.ts': [
    `import { b } from './b';`,
    `import { other } from '../other/x';`,
    `export * from '#lib/util/c.ts';`,
    `export const a = b + other;`,
    '',
  ].join('\n'),
  'src/lib/util/b.ts': `export const b = 1;\n`,
  'src/lib/util/c.ts': `import '../twin/index';\nexport type B = import('./b.ts').B;\n`,
  'src/lib/twin.ts': '',
  'src/lib/twin/index.ts': '',
  'src/lib/util/plugins.ts': `export const load = (name: string) => import(\`./plugins/\${name}.ts\`);\n`,
  'src/lib/util/plugins/p.ts': `export const p = 1;\n`,
  'src/lib/other/x.ts': `import { f } from '../feature';\nexport const other = f;\n`,
  'src/lib/feature/index.ts': `export const f = 2;\n`,
  'src/lib/components/Card.svelte': [
    `<script module lang="ts">`,
    `  export { b } from '#lib/util/b.ts';`,
    `</script>`,
    ``,
    `<script lang="ts">`,
    `  import { a } from '#lib/util/a.ts';`,
    `  import Icon from './Icon.svelte';`,
    `</script>`,
    ``,
    `<Icon />{a} '#lib/util/a.ts' in markup is left alone`,
    '',
  ].join('\n'),
  'src/lib/components/Icon.svelte': `<i></i>\n`,
  'src/routes/items/+page.ts': [
    `import type { PageLoad } from './$types';`,
    `import { a } from '#lib/util/a.ts';`,
    `export const load: PageLoad = () => ({ a });`,
    '',
  ].join('\n'),
  'src/routes/items/Row.svelte': `<script lang="ts">\n  import type { PageData } from './$types';\n</script>\n`,
  'src/routes/items/Cell.svelte': `<script lang="ts">\n  import type { PageData } from './$types';\n</script>\n`,
  'src/routes/solo/+page.ts': `import type { PageLoad } from './$types';\n`,
  'tests/unit/a.test.ts': [
    `import { vi } from 'vitest';`,
    `vi.mock('#lib/util/b.ts', () => ({ b: 2 }));`,
    `vi.mock(import('#lib/util/c.ts'));`,
    `const url = new URL('../../src/lib/util/b.ts', import.meta.url);`,
    `const a = await import('#lib/util/a.ts');`,
    `import type { PageData } from '../../.svelte-kit/types/src/routes/items/$types';`,
    `import type { PageLoad } from '../../.svelte-kit/types/src/routes/solo/$types';`,
    '',
  ].join('\n'),
  'tests/end-to-end/e.ts': `import { a } from '../../src/lib/util/a';\nimport b from '../../src/lib/util/b.ts?raw';\n`,
  'vite.config.ts': `export default { setupFiles: ['src/lib/util/b.ts'] };\n`,
  'README.md': 'See `#lib/util/a.ts`, and `src/lib/other/x.ts`, which stays.\n',
};

const mapping = `
# the util folder, except b.ts, which gets its own home (and runes)
src/lib/util -> src/lib/shared/util
src/lib/util/b.ts -> src/lib/core/b.svelte.ts
src/routes/items -> src/routes/things
src/routes/items/Cell.svelte -> src/routes/other/Cell.svelte   # a file line wins over its folder
src/lib/components/Icon.svelte -> src/lib/ui/Icon.svelte
src/lib/feature/index.ts -> src/lib/feat.ts
src/routes/solo/+page.ts -> src/routes/alone/+page.ts
`;

let repo: string;

function git(...args: string[]) {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf-8' });
}

function move(...args: string[]) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: repo, encoding: 'utf-8' });
  return { status: result.status, out: result.stdout + result.stderr };
}

const read = (file: string) => readFileSync(path.join(repo, file), 'utf-8');

function write(files: Record<string, string>) {
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
    writeFileSync(path.join(repo, file), text);
  }
}

function commit(message: string) {
  git('add', '-A');
  git(
    '-c',
    'user.name=t',
    '-c',
    'user.email=t@t',
    '-c',
    'commit.gpgsign=false',
    'commit',
    '-qm',
    message,
  );
}

beforeEach(() => {
  repo = mkdtempSync(path.join(tmpdir(), 'move-script-'));
  write(fixture);
  writeFileSync(path.join(repo, 'map.txt'), mapping);
  git('init', '-q');
  commit('base');
});

afterEach(() => rmSync(repo, { recursive: true, force: true }));

// Each test runs the script in a child process, which loads TypeScript and runs git.
describe('scripts/refactor/move.ts', { timeout: 20_000 }, () => {
  it('moves the files and rewrites every reference to them', () => {
    const { status, out } = move('map.txt');
    expect(status, out).toBe(0);

    expect(existsSync(path.join(repo, 'src/lib/util'))).toBe(false);
    expect(read('src/lib/index.ts')).toBe(`export { a } from './shared/util/a.ts';\n`);
    expect(read('src/lib/shared/util/a.ts')).toBe(
      [
        `import { b } from '../../core/b.svelte';`,
        `import { other } from '../../other/x';`,
        `export * from '#lib/shared/util/c.ts';`,
        `export const a = b + other;`,
        '',
      ].join('\n'),
    );
    expect(read('src/lib/shared/util/c.ts')).toBe(
      `import '../../twin/index';\nexport type B = import('../../core/b.svelte.ts').B;\n`,
    );
    expect(read('src/lib/components/Card.svelte')).toBe(
      fixture['src/lib/components/Card.svelte']
        .replace(`'#lib/util/b.ts'`, `'#lib/core/b.svelte.ts'`)
        .replace(`from '#lib/util/a.ts'`, `from '#lib/shared/util/a.ts'`)
        .replace(`'./Icon.svelte'`, `'../ui/Icon.svelte'`),
    );
    expect(read('src/routes/things/+page.ts')).toBe(
      fixture['src/routes/items/+page.ts'].replace('#lib/util/a.ts', '#lib/shared/util/a.ts'),
    );
    expect(read('src/routes/things/Row.svelte')).toBe(fixture['src/routes/items/Row.svelte']);
    expect(read('src/routes/other/Cell.svelte')).toContain(`from '../things/$types'`);
    expect(read('tests/unit/a.test.ts')).toBe(
      [
        `import { vi } from 'vitest';`,
        `vi.mock('#lib/core/b.svelte.ts', () => ({ b: 2 }));`,
        `vi.mock(import('#lib/shared/util/c.ts'));`,
        `const url = new URL('../../src/lib/core/b.svelte.ts', import.meta.url);`,
        `const a = await import('#lib/shared/util/a.ts');`,
        `import type { PageData } from '../../.svelte-kit/types/src/routes/things/$types';`,
        `import type { PageLoad } from '../../.svelte-kit/types/src/routes/alone/$types';`,
        '',
      ].join('\n'),
    );
    expect(read('src/lib/other/x.ts')).toBe(
      `import { f } from '../feat';\nexport const other = f;\n`,
    );
    expect(read('src/routes/alone/+page.ts')).toBe(fixture['src/routes/solo/+page.ts']);
    expect(read('tests/end-to-end/e.ts')).toBe(
      `import { a } from '../../src/lib/shared/util/a';\nimport b from '../../src/lib/core/b.svelte.ts?raw';\n`,
    );
  });

  it('warns about references it cannot rewrite', () => {
    const { status, out } = move('map.txt', '--check');
    expect(status).toBe(1);
    expect(out).toContain("src/lib/util/plugins.ts:1: can't rewrite the template `./plugins/…`");
    expect(out).toContain('vite.config.ts:1: still mentions src/lib/util/b.ts');
    expect(out).toContain('README.md:1: still mentions #lib/util/a.ts');
    expect(out).toContain('src/lib/components/Card.svelte:10: still mentions #lib/util/a.ts');
    expect(out).not.toContain('other/x.ts');
    expect(git('status', '--porcelain')).toBe('');
  });

  it('prints the plan on a dry run and changes nothing', () => {
    const { status, out } = move('map.txt', '--dry-run');
    expect(status, out).toBe(0);
    expect(out).toContain('move  src/lib/util/b.ts -> src/lib/core/b.svelte.ts');
    expect(out).toContain('edit  tests/unit/a.test.ts:2  #lib/util/b.ts -> #lib/core/b.svelte.ts');
    expect(git('status', '--porcelain')).toBe('');
  });

  it('moves everything back with --reverse, leaving no diff', () => {
    expect(move('map.txt').status).toBe(0);
    const back = move('map.txt', '--reverse');
    expect(back.status, back.out).toBe(0);
    git('add', '-A');
    expect(git('status', '--porcelain')).toBe('');
  });

  it('allows a case-only rename', () => {
    writeFileSync(path.join(repo, 'case.txt'), 'src/lib/other -> src/lib/Other\n');
    const { status, out } = move('case.txt', '--dry-run');
    expect(status, out).toBe(0);
    expect(out).toContain('move  src/lib/other/x.ts -> src/lib/Other/x.ts');
  });

  it('refuses a mapping that would overwrite or chain, and moves nothing', () => {
    writeFileSync(path.join(repo, 'src/lib/untracked.ts'), '');
    writeFileSync(
      path.join(repo, 'bad.txt'),
      [
        'src/lib/other/x.ts -> src/lib/util/a.ts',
        'src/lib/util/b.ts -> src/lib/other/x.ts',
        'src/lib/util/c.ts -> src/lib/components',
        'src/lib/util/plugins.ts -> src/lib/untracked.ts',
        'src/lib/index.ts -> src/lib/i.ts',
        'src/lib/index.ts -> src/lib/j.ts',
        'src/lib/nope -> src/lib/yes',
      ].join('\n'),
    );
    const { status, out } = move('bad.txt');
    expect(status).toBe(1);
    expect(out).toContain('src/lib/util/a.ts already exists');
    expect(out).toContain('src/lib/other/x.ts moves too');
    expect(out).toContain('src/lib/components is a directory');
    expect(out).toContain('src/lib/untracked.ts already exists');
    expect(out).toContain('src/lib/index.ts is the source of two lines');
    expect(out).toContain('warn  src/lib/nope: no tracked file or directory by that name');
    expect(git('status', '--porcelain')).toBe('?? bad.txt\n?? src/lib/untracked.ts\n');
  });

  it('refuses to reverse directories that were merged into one', () => {
    writeFileSync(
      path.join(repo, 'merge.txt'),
      'src/lib/util -> src/lib/all\nsrc/lib/other -> src/lib/all\n',
    );
    expect(move('merge.txt').status).toBe(0);
    const { status, out } = move('merge.txt', '--reverse', '--check');
    expect(status).toBe(1);
    expect(out).toContain('src/lib/all is the source of two lines');
  });

  it('respells an unchanged import that a moved-in file would shadow', () => {
    write({
      'src/lib/old/consumer.ts': `import { h } from './helper';\n`,
      'src/lib/old/helper/index.ts': `export const h = 1;\n`,
      'src/lib/new/helper.ts': `export const h = 2;\n`,
    });
    commit('shadow');
    writeFileSync(path.join(repo, 'shadow.txt'), 'src/lib/old -> src/lib/new\n');
    const { status, out } = move('shadow.txt');
    expect(status, out).toBe(0);
    expect(read('src/lib/new/consumer.ts')).toBe(`import { h } from './helper/index';\n`);
  });
});
