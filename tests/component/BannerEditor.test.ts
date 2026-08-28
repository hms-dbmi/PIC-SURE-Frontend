// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

const navigation = vi.hoisted(() => ({ beforeNavigate: vi.fn(), goto: vi.fn() }));

vi.mock('$app/navigation', () => navigation);
vi.mock('$lib/toaster', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));
vi.mock('$lib/services/BannerManagement', () => ({
  publishBanner: vi.fn(),
  publishSavedBanner: vi.fn(),
  saveBanner: vi.fn(),
  updateSavedBanner: vi.fn(),
}));

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
  lifecycle: 'ACTIVE' as const,
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
  navigation.beforeNavigate.mockReset();
  navigation.goto.mockReset();
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
    expect(screen.getByRole('button', { name: 'Save for later' })).toBeDisabled();
    expect(container.querySelector('#banner-content-editor')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Banner content' })).toHaveAttribute(
        'aria-describedby',
        'banner-content-help',
      );
    });
    const contentHelp = container.querySelector('#banner-content-help');
    expect(contentHelp).toHaveTextContent('0/5,000 sanitized HTML characters');
    expect(contentHelp).not.toHaveAttribute('aria-live');
  });

  it('returns the authoritative published occurrence to the management view', async () => {
    vi.mocked(publishBanner).mockResolvedValue(published);
    const onsuccess = vi.fn();
    render(BannerEditor, { props: { onsuccess } });
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });
    editor.innerHTML = '<p>Draft content</p>';
    await fireEvent.input(editor);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Publish now' })).toBeEnabled());

    await fireEvent.click(screen.getByRole('button', { name: 'Publish now' }));

    await waitFor(() => expect(onsuccess).toHaveBeenCalledWith(published));
    expect(publishBanner).toHaveBeenCalledOnce();
  });

  it('asks before discarding a dirty editor through its cancel action', async () => {
    const oncancel = vi.fn();
    render(BannerEditor, { props: { oncancel } });
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });
    editor.innerHTML = '<p>Unsaved content</p>';
    await fireEvent.input(editor);

    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('heading', { name: 'Unsaved Changes' })).toBeInTheDocument();
    expect(oncancel).not.toHaveBeenCalled();
    await fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(oncancel).toHaveBeenCalledOnce();
  });

  it('merges a dirty tab change into the open editor confirmation', async () => {
    const ontabchangerequestresolve = vi.fn();
    const view = render(BannerEditor, { props: { ontabchangerequestresolve } });
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });
    editor.innerHTML = '<p>Unsaved content</p>';
    await fireEvent.input(editor);
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await view.rerender({ tabchangerequest: 'Branding', ontabchangerequestresolve });

    expect(screen.getAllByRole('heading', { name: 'Unsaved Changes' })).toHaveLength(1);
    expect(screen.getByRole('dialog')).toHaveTextContent('Discard them to open Branding');
    expect(screen.queryByTestId('modal-close-button')).not.toBeInTheDocument();
    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toHaveTextContent('Discard them to open Branding');
    await fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(ontabchangerequestresolve).toHaveBeenCalledOnce();
    expect(ontabchangerequestresolve).toHaveBeenCalledWith(null);

    await view.rerender({ tabchangerequest: null, ontabchangerequestresolve });
    await view.rerender({ tabchangerequest: 'Branding', ontabchangerequestresolve });
    expect(screen.getByRole('dialog')).toHaveTextContent('Discard them to open Branding');
    expect(screen.getAllByRole('heading', { name: 'Unsaved Changes' })).toHaveLength(1);
  });

  it('leaves external unloads to the native prompt without disabling later navigation guards', async () => {
    let guard: ((navigation: Record<string, unknown>) => void) | undefined;
    navigation.beforeNavigate.mockImplementation((callback) => {
      guard = callback;
    });
    render(BannerEditor);
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });
    editor.innerHTML = '<p>Unsaved content</p>';
    await fireEvent.input(editor);
    const cancelExternal = vi.fn();

    guard?.({ to: null, willUnload: true, cancel: cancelExternal });

    expect(cancelExternal).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Unsaved Changes' })).not.toBeInTheDocument();

    const cancelInternal = vi.fn();
    guard?.({
      to: { url: new URL('http://localhost/help') },
      willUnload: false,
      cancel: cancelInternal,
    });

    expect(cancelInternal).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Unsaved Changes' })).toBeInTheDocument(),
    );
  });

  it('keeps allowed whitespace and blank paragraphs without rebuilding the editor', async () => {
    render(BannerEditor);
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });

    editor.innerHTML = '<p>First&nbsp;sentence with  two spaces<br></p><p><br></p>';
    await fireEvent.input(editor);

    await waitFor(() => expect(editor.querySelectorAll('p')).toHaveLength(2));
    expect(editor.querySelector('p')?.textContent?.replaceAll('\u00a0', ' ')).toBe(
      'First sentence with  two spaces',
    );
    const preview = screen.getByRole('region', { name: 'Site announcement' });
    expect(preview.querySelectorAll('p')).toHaveLength(2);
    expect(preview.querySelector('p')?.textContent).toBe('First sentence with  two spaces');
  });

  it('reconciles sanitizer-stripped pasted markup into the editor and preview', async () => {
    render(BannerEditor);
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });

    editor.innerHTML =
      '<h1 class="ql-align-center">Visible heading</h1><p>Safe ql-align-center<img src="https://example.org/tracker.png"></p>';
    await fireEvent.input(editor);

    await waitFor(() => {
      expect(editor.querySelector('h1')).not.toBeInTheDocument();
      expect(editor.querySelector('img')).not.toBeInTheDocument();
      expect(editor).toHaveTextContent('Visible headingSafe ql-align-center');
    });
    const preview = screen.getByRole('region', { name: 'Site announcement' });
    expect(preview).toHaveTextContent('Visible headingSafe ql-align-center');
    expect(preview).not.toHaveTextContent('text-center');
    expect(preview.querySelector('h1')).not.toBeInTheDocument();
    expect(preview.querySelector('img')).not.toBeInTheDocument();
  });

  it('associates a non-live over-limit explanation with the editor', async () => {
    const { container } = render(BannerEditor);
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });

    editor.innerHTML = `<p>${'x'.repeat(5_001)}</p>`;
    await fireEvent.input(editor);

    const contentHelp = container.querySelector('#banner-content-help');
    await waitFor(() => {
      expect(contentHelp).toHaveTextContent(
        'Content exceeds the 5,000-character limit. Shorten it before publishing.',
      );
    });
    const overLimitExplanation = screen.getByText(
      'Content exceeds the 5,000-character limit. Shorten it before publishing.',
    );
    expect(editor).toHaveAttribute('aria-describedby', 'banner-content-help');
    expect(contentHelp).not.toHaveAttribute('aria-live');
    expect(overLimitExplanation).not.toHaveAttribute('aria-live');
    expect(screen.getByRole('button', { name: 'Publish now' })).toBeDisabled();
  });
});
