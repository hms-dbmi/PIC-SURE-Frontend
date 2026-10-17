import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');
const script = path.join(root, 'tests/support/check-mock-specifiers.ts');

let dir: string | undefined;
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

// The fixture has to sit inside the repo: #lib and relative specifiers resolve from its location.
describe('tests/support/check-mock-specifiers.ts', { timeout: 20_000 }, () => {
  it('reports every mock that does not resolve, and only those', () => {
    dir = mkdtempSync(path.join(root, 'tests/unit/mock-check-'));
    const file = path.join(dir, 'fixture.ts');
    writeFileSync(
      file,
      [
        `vi.mock('#lib/utilities/HTML.ts');`,
        `vi.mock('$app/state');`,
        `vi.mock(import('../HTML.test.ts'));`,
        `vi.mock('#lib/nope.ts');`,
        `vi.doMock('./nope.ts');`,
        `vi.mock('$app/nope');`,
        `vi.mock(name);`,
        '',
      ].join('\n'),
    );

    const result = spawnSync(process.execPath, [script, file], { cwd: root, encoding: 'utf-8' });

    expect(result.status, result.stdout + result.stderr).toBe(1);
    const where = path.relative(root, file);
    const reported = result.stderr.split('\n').filter((line) => line.includes(where));
    expect(reported.map((line) => line.trim().split(':')[1])).toEqual(['4', '5', '6', '7']);
    expect(reported[3]).toContain("not a static specifier, so it can't be checked");
  });
});
