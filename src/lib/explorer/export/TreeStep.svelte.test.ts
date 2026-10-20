// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';

const dictionary = vi.hoisted(() => ({ getInitialTree: vi.fn(), getConceptTree: vi.fn() }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/explorer/Dictionary.ts', () => dictionary);
vi.mock('#lib/explorer/export/Summary.svelte', () => ({ default: () => {} }));

import TreeStep from '#lib/explorer/export/TreeStep.svelte';
import { exportState, mapSearchResultAsExport } from '#lib/explorer/export/export.svelte.ts';
import type { SearchResult } from '#lib/api/picsure/dictionary.types.ts';

const concept = (conceptPath: string, children?: SearchResult[]) =>
  ({
    conceptPath,
    name: conceptPath.split('\\').filter(Boolean).at(-1),
    dataset: 'ds',
    children,
  }) as unknown as SearchResult;

const deep = concept('\\ds\\a\\b\\c\\');
const tree = [concept('\\ds\\', [concept('\\ds\\a\\', [concept('\\ds\\a\\b\\', [])])])];

afterEach(() => {
  exportState.clear();
  vi.clearAllMocks();
});

describe('TreeStep', () => {
  it('keeps the tree, and what the user opened, when a deeper variable is selected', async () => {
    dictionary.getInitialTree.mockResolvedValue(tree);
    render(TreeStep);
    const folder = await screen.findByRole('treeitem', { name: 'ds' });
    expect(folder).toHaveAttribute('aria-expanded', 'false');
    await fireEvent.click(screen.getByTestId('ui-tree-toggle-ds-ds'));
    expect(folder).toHaveAttribute('aria-expanded', 'true');

    exportState.add(mapSearchResultAsExport(deep));
    flushSync();
    await Promise.resolve();

    expect(dictionary.getInitialTree).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('treeitem', { name: 'ds' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('loads the tree deep enough for the variables already selected', async () => {
    dictionary.getInitialTree.mockResolvedValue(tree);
    exportState.add(mapSearchResultAsExport(deep));

    render(TreeStep);

    expect(dictionary.getInitialTree).toHaveBeenCalledWith(4);
  });

  it('says so when the tree fails to load', async () => {
    dictionary.getInitialTree.mockRejectedValue(new Error('boom'));

    render(TreeStep);

    expect(await screen.findByText(/couldn't load the variables/)).toBeVisible();
  });
});
