// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import SearchInput from '#lib/ui/SearchInput.svelte';

describe('SearchInput', () => {
  it('is a searchbox named by its label', () => {
    render(SearchInput, { label: 'Search fields', 'data-testid': 'admin-config-search' });

    expect(screen.getByRole('searchbox', { name: 'Search fields' })).toHaveAttribute(
      'data-testid',
      'admin-config-search',
    );
  });

  it('reports typing through oninput', async () => {
    const oninput = vi.fn();
    render(SearchInput, { oninput });

    await fireEvent.input(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'heart' },
    });

    expect(oninput).toHaveBeenCalledOnce();
  });
});
