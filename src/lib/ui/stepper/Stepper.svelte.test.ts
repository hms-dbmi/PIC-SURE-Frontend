// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor, within } from '@testing-library/svelte';

vi.mock('#lib/telemetry/logger.ts', () => ({ log: vi.fn(), createLog: vi.fn() }));

import TwoSteppers from '../../../../tests/support/fixtures/TwoSteppers.svelte';

describe('Stepper', () => {
  it('keeps each stepper on its own step', async () => {
    const { getByRole } = render(TwoSteppers);
    const first = within(getByRole('region', { name: 'first stepper' }));
    const second = within(getByRole('region', { name: 'second stepper' }));

    expect(first.getAllByText('Step 1')).toHaveLength(1);
    expect(first.getByText('2')).toBeTruthy();

    await fireEvent.click(first.getByRole('button', { name: /Next/ }));

    await waitFor(() => expect(first.getByText('first step two')).toBeTruthy());
    expect(first.getByRole('button', { name: /Finish first/ })).toBeTruthy();
    expect(second.getByText('second step one')).toBeTruthy();
    expect(second.queryByText('second step two')).toBeNull();
    expect(second.getByText('2')).toBeTruthy();
  });
});
