// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

vi.mock('$lib/toaster', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));
vi.mock('$lib/services/BannerManagement', () => ({ publishBanner: vi.fn() }));

import BannerEditor from '$lib/components/admin/configuration/BannerEditor.svelte';
import { publishBanner } from '$lib/services/BannerManagement';

const published = {
  uuid: '99999999-9999-9999-9999-999999999999',
  htmlContent: '<p>Published content</p>',
  title: 'Published title',
  appearance: 'WARNING' as const,
  icon: 'WARNING' as const,
  dismissible: false,
  audience: 'EVERYONE' as const,
  placement: 'SITE_TOP' as const,
  pageTargets: [{ kind: 'ALL' }],
  priority: 4,
  presentationHash: 'server-hash',
  status: 'PUBLISHED' as const,
  startAt: '2026-08-27T12:00:00Z',
  endAt: null,
  createdAt: '2026-08-27T12:00:00Z',
  createdBy: 'admin-id',
  updatedAt: '2026-08-27T12:00:00Z',
  updatedBy: 'admin-id',
  publishedAt: '2026-08-27T12:00:00Z',
  publishedBy: 'admin-id',
};

beforeEach(() => {
  vi.mocked(publishBanner).mockReset();
});

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
    expect(
      screen.queryByRole('button', { name: 'Dismiss site announcement' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish now' })).toBeInTheDocument();
    expect(container.querySelector('#banner-content-editor')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Banner content' })).toBeInTheDocument();
    });
  });

  it('locks a published occurrence against duplicate submission and resets deliberately', async () => {
    vi.mocked(publishBanner).mockResolvedValue(published);
    render(BannerEditor);
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });
    editor.innerHTML = '<p>Draft content</p>';
    await fireEvent.input(editor);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Publish now' })).toBeEnabled());

    await fireEvent.click(screen.getByRole('button', { name: 'Publish now' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Published title'));
    expect(screen.getByRole('heading', { name: 'Published title', level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Published' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Create another banner' })).toBeEnabled();
    await fireEvent.click(screen.getByRole('button', { name: 'Published' }));
    expect(publishBanner).toHaveBeenCalledOnce();

    await fireEvent.click(screen.getByRole('button', { name: 'Create another banner' }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Primary' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dismissible' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Icon' })).toHaveValue('NONE');
    expect(screen.getByRole('button', { name: 'Publish now' })).toBeDisabled();
    expect(publishBanner).toHaveBeenCalledOnce();
  });

  it('reconciles sanitizer-stripped pasted markup into the editor and preview', async () => {
    const { container } = render(BannerEditor);
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });

    editor.innerHTML =
      '<h1 class="ql-align-center">Visible heading</h1><p>Safe<img src="https://example.org/tracker.png"></p>';
    await fireEvent.input(editor);

    await waitFor(() => {
      expect(editor.querySelector('h1')).not.toBeInTheDocument();
      expect(editor.querySelector('img')).not.toBeInTheDocument();
      expect(editor).toHaveTextContent('Visible headingSafe');
    });
    const preview = screen.getByRole('region', { name: 'Site announcement' });
    expect(preview).toHaveTextContent('Visible headingSafe');
    expect(preview.querySelector('h1')).not.toBeInTheDocument();
    expect(preview.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('.text-center')).not.toBeInTheDocument();
  });
});
