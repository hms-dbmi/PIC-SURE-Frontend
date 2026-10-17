// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import RemoteTree from '#lib/ui/tree/RemoteTree.svelte';
import type { SearchResult } from '#lib/explorer/types.ts';

const folder = { name: 'study', conceptPath: '\\study\\', children: [] } as unknown as SearchResult;

describe('RemoteTree', () => {
  it('shows a fixed message, never the error text, when children fail to load', async () => {
    const fetchChildren = vi.fn().mockRejectedValue(new Error('<!doctype html><body>500</body>'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(RemoteTree, {
      props: {
        initialNodes: [folder],
        fetchChildren,
        fullWidth: false,
        selectedConcepts: [],
        disabledConcepts: [],
      },
    });

    await fireEvent.click(screen.getByTestId('ui-tree-toggle-study-study'));

    expect(await screen.findByText('Error loading children: Failed to load children')).toBeTruthy();
    expect(fetchChildren).toHaveBeenCalledWith('\\study\\');
    expect(document.body.textContent).not.toContain('doctype');
  });
});
