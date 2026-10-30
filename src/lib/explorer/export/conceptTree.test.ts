import { describe, expect, it } from 'vitest';

import { toConceptNodes } from '#lib/explorer/export/conceptTree.ts';
import type { SearchResult } from '#lib/api/picsure/dictionary.types.ts';

function concept(conceptPath: string, children?: SearchResult[]): SearchResult {
  const name = conceptPath.split('\\').filter(Boolean).pop() ?? '';
  return { conceptPath, name, children } as SearchResult;
}

const study = () =>
  concept('\\study\\', [
    concept('\\study\\demo\\', [concept('\\study\\demo\\age\\'), concept('\\study\\demo\\sex\\')]),
    concept('\\study\\labs\\', []),
  ]);

describe('toConceptNodes', () => {
  it('makes concepts without children leaves and ones with an empty list lazy', () => {
    const [root] = toConceptNodes([study()]);
    const [demo, labs] = root.children!;

    expect(demo.children!.map((node) => [node.label, node.children, node.lazy])).toEqual([
      ['age', undefined, undefined],
      ['sex', undefined, undefined],
    ]);
    expect(labs.lazy).toBe(true);
  });

  it('opens the parents of a partial selection and selects fully selected ones', () => {
    const [root] = toConceptNodes([study()], ['\\study\\demo\\age\\']);
    const demo = root.children![0];

    expect(demo.children!.map((node) => node.selected)).toEqual([true, false]);
    expect(demo).toMatchObject({ selected: false, open: true });
    expect(root).toMatchObject({ selected: false, open: true });

    const [all] = toConceptNodes([study()], ['\\study\\demo\\']);
    expect(all.children![0]).toMatchObject({ selected: true, open: false });
    expect(all).toMatchObject({ selected: false, open: true });
  });

  it('disables everything under a disabled path', () => {
    const [root] = toConceptNodes([study()], [], ['\\study\\demo\\']);

    expect(root.disabled).toBe(false);
    expect(root.children![0].disabled).toBe(true);
    expect(root.children![0].children!.every((node) => node.disabled)).toBe(true);
  });
});
