// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

import Actions from '#lib/datasets/components/cells/Actions.svelte';
import { datasets } from '#lib/datasets/datasets.svelte.ts';
import { toaster } from '#lib/ui/toaster.ts';

vi.mock('#lib/telemetry/logger.ts', () => ({ log: vi.fn(), createLog: vi.fn() }));
vi.mock('#lib/ui/toaster.ts', () => ({ toaster: { error: vi.fn() } }));
vi.mock('#lib/datasets/datasets.svelte.ts', () => ({ datasets: { toggleArchived: vi.fn() } }));

const data = { cell: 'ds-1', row: { archived: false } };

describe('dataset row actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps the button disabled until the archive request settles', async () => {
    let finish!: () => void;
    vi.mocked(datasets.toggleArchived).mockReturnValue(
      new Promise((resolve) => (finish = () => resolve(undefined))),
    );
    render(Actions, { data });
    const button = screen.getByTestId('dataset-action-archive-ds-1');

    await fireEvent.click(button);
    expect(button).toBeDisabled();

    finish();
    await waitFor(() => expect(button).toBeEnabled());
  });

  it('shows an error toast when archiving fails', async () => {
    vi.mocked(datasets.toggleArchived).mockRejectedValue(new Error('500'));
    render(Actions, { data });

    await fireEvent.click(screen.getByTestId('dataset-action-archive-ds-1'));

    await waitFor(() => expect(toaster.error).toHaveBeenCalledOnce());
    expect(screen.getByTestId('dataset-action-archive-ds-1')).toBeEnabled();
  });
});
