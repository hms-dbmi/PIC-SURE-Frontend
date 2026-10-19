// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

import SegmentedControl from './SegmentedControl.svelte';

const options = [
  { value: 'AND', label: 'AND' },
  { value: 'OR', label: 'OR' },
];

describe('SegmentedControl', () => {
  it('reports the option the user picks', async () => {
    const onchange = vi.fn();
    render(SegmentedControl, { name: 'operator', value: 'AND', options, onchange });
    expect(screen.getByRole('radio', { name: 'AND' })).toBeChecked();

    await fireEvent.click(screen.getByRole('radio', { name: 'OR' }));

    await waitFor(() => expect(onchange).toHaveBeenCalledWith('OR'));
  });

  it('keeps focus on the picked option when the new value comes back', async () => {
    const { rerender } = render(SegmentedControl, {
      name: 'operator',
      value: 'AND',
      options,
      onchange: (value: string) => rerender({ value }),
    });
    const or = screen.getByRole('radio', { name: 'OR' });
    or.focus();

    await fireEvent.click(or);

    await waitFor(() => expect(screen.getByRole('radio', { name: 'OR' })).toBeChecked());
    await waitFor(() => expect(screen.getByRole('radio', { name: 'OR' })).toHaveFocus());
  });
});
