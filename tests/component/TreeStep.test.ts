// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/svelte';

import TreeStep from '#lib/components/explorer/export/TreeStep.svelte';

const subscribers = vi.hoisted(() => ({ active: 0 }));

vi.mock('#lib/stores/Export.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('#lib/stores/Export.ts')>();
  return {
    ...actual,
    exports: {
      ...actual.exports,
      subscribe(run: Parameters<typeof actual.exports.subscribe>[0]) {
        subscribers.active++;
        const unsubscribe = actual.exports.subscribe(run);
        return () => {
          subscribers.active--;
          unsubscribe();
        };
      },
    },
  };
});
vi.mock('#lib/stores/Dictionary.ts', () => ({
  getInitialTree: () => new Promise(() => {}),
  getConceptTree: vi.fn(),
}));
vi.mock('#lib/ExportStepperManager.svelte.ts', () => ({
  getQueryRequest: () => ({ query: { select: [] } }),
}));
vi.mock('#lib/components/explorer/export/Summary.svelte', () => ({ default: () => {} }));

describe('TreeStep', () => {
  it('releases its exports subscription when unmounted', () => {
    const { unmount } = render(TreeStep);
    expect(subscribers.active).toBeGreaterThan(0);

    unmount();

    expect(subscribers.active).toBe(0);
  });
});
