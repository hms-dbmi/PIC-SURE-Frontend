// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

import Switch from './Switch.svelte';

describe('Switch', () => {
  it('reports the new state when toggled', async () => {
    const onchange = vi.fn();
    render(Switch, { name: 'Active', label: 'Status', checked: false, onchange });

    await fireEvent.click(screen.getByRole('checkbox'));

    await waitFor(() => expect(onchange).toHaveBeenCalledWith(true));
  });
});
