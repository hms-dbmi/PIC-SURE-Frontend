// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';

vi.mock('$lib/toaster', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));
vi.mock('$lib/services/BannerManagement', () => ({ publishBanner: vi.fn() }));

import BannerEditor from '$lib/components/admin/configuration/BannerEditor.svelte';

describe('BannerEditor', () => {
  it('shows the approved defaults, accessible appearance names and swatches, and a shared preview', async () => {
    const { container } = render(BannerEditor);

    expect(screen.getByRole('heading', { name: 'Create banner' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Primary' })).toBeChecked();
    expect(screen.getAllByTestId('appearance-swatch')).toHaveLength(7);
    for (const appearance of [
      'Primary',
      'Secondary',
      'Tertiary',
      'Success',
      'Warning',
      'Error',
      'Surface',
    ]) {
      const choice = screen.getByRole('radio', { name: appearance });
      expect(choice).toBeInTheDocument();
      expect(choice.parentElement?.querySelector('[data-testid="appearance-swatch"]')).toHaveClass(
        `bg-${appearance.toLowerCase()}-500`,
      );
    }
    expect(screen.getByRole('radio', { name: 'Dismissible' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Permanent' })).not.toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Icon' })).toHaveValue('NONE');
    expect(screen.getByRole('region', { name: 'Site announcement' })).toHaveClass(
      'preset-tonal-primary',
    );
    expect(screen.getByRole('button', { name: 'Dismiss site announcement' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish now' })).toBeInTheDocument();
    expect(container.querySelector('#banner-content-editor')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Banner content' })).toBeInTheDocument();
    });
  });
});
