// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/api', () => ({ get, consentDeniedMessage: () => null }));
vi.mock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn() }));
vi.mock('$lib/configuration.svelte', () => ({
  config: {
    features: { explorer: { allowDownload: false } },
    branding: {
      explorePage: {
        pfbExportUrls: [
          { title: 'Terra', url: 'https://terra.example/import?url=' },
          { title: 'Seven Bridges', url: 'https://sb.example/import?url=' },
        ],
      },
    },
  },
  resetConfig: () => {},
}));

import PfbExport from '$lib/components/explorer/export/PfbExport.svelte';

const platforms = [
  { clicked: 'Terra', other: 'Seven Bridges' },
  { clicked: 'Seven Bridges', other: 'Terra' },
];

describe('PfbExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'open').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(platforms)(
    'shows the loading state only on the clicked $clicked button',
    async ({ clicked, other }) => {
      get.mockReturnValue(new Promise(() => {}));
      render(PfbExport);

      await fireEvent.click(screen.getByRole('button', { name: `Export to ${clicked}` }));

      const busy = screen.getByRole('button', { name: `Exporting to ${clicked}` });
      expect(busy).toHaveAttribute('aria-busy', 'true');
      expect(busy).toHaveTextContent('Exporting…');
      expect(busy).toBeDisabled();

      const idle = screen.getByRole('button', { name: `Export to ${other}` });
      expect(idle).not.toHaveAttribute('aria-busy');
      expect(idle).not.toHaveTextContent('Exporting');
      expect(idle).toBeDisabled();
    },
  );

  it('restores both buttons once the export finishes', async () => {
    let resolveSignedUrl: (value: { signedUrl: string }) => void = () => {};
    get.mockReturnValue(new Promise((resolve) => (resolveSignedUrl = resolve)));
    render(PfbExport);

    await fireEvent.click(screen.getByRole('button', { name: 'Export to Terra' }));
    expect(screen.getByRole('button', { name: 'Exporting to Terra' })).toBeDisabled();
    resolveSignedUrl({ signedUrl: 'https://signed.example/file.avro' });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Export to Terra' })).toBeEnabled(),
    );
    expect(screen.getByRole('button', { name: 'Export to Seven Bridges' })).toBeEnabled();
    expect(screen.queryByText('Exporting…')).not.toBeInTheDocument();
  });
});
