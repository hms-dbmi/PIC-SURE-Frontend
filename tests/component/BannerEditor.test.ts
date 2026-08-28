// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

const navigation = vi.hoisted(() => ({ beforeNavigate: vi.fn(), goto: vi.fn() }));

vi.mock('$app/navigation', () => navigation);
vi.mock('$lib/toaster', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));
vi.mock('$lib/services/BannerManagement', () => ({
  publishBanner: vi.fn(),
  publishSavedBanner: vi.fn(),
  saveBanner: vi.fn(),
  updatePublishedBanner: vi.fn(),
  updateSavedBanner: vi.fn(),
}));

import BannerEditor from '$lib/components/admin/configuration/BannerEditor.svelte';
import { publishBanner, updatePublishedBanner } from '$lib/services/BannerManagement';
import { toaster } from '$lib/toaster';

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

const saved = {
  ...published,
  status: 'SAVED' as const,
  lifecycle: 'SAVED' as const,
  startAt: null,
  endAt: null,
  priority: null,
  publishedAt: null,
  publishedBy: null,
};

beforeEach(() => {
  vi.mocked(publishBanner).mockReset();
  navigation.beforeNavigate.mockReset();
  navigation.goto.mockReset();
  vi.mocked(updatePublishedBanner).mockReset();
  vi.mocked(toaster.success).mockReset();
  vi.mocked(toaster.error).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BannerEditor', () => {
  it('shows the approved defaults, accessible appearance names and swatches, and a shared preview', async () => {
    const { container } = render(BannerEditor);

    expect(screen.getByRole('heading', { name: 'Create banner' })).toBeInTheDocument();
    expect(
      screen.getByText('Save this announcement for later or publish it across PIC-SURE.'),
    ).toBeInTheDocument();
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

  it('shows resolved UTC and schedules a future local minute with the selected end', async () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      locale: 'en-US',
      calendar: 'gregory',
      numberingSystem: 'latn',
      timeZone: 'America/New_York',
    });
    vi.mocked(publishBanner).mockResolvedValue({
      ...published,
      lifecycle: 'SCHEDULED',
      startAt: '2026-08-28T13:15:00Z',
      endAt: '2026-08-28T14:45:00Z',
    });
    render(BannerEditor);
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });
    editor.innerHTML = '<p>Scheduled content</p>';
    await fireEvent.input(editor);

    await fireEvent.input(screen.getByLabelText('Start'), {
      target: { value: '2026-08-28T09:15' },
    });
    await fireEvent.input(screen.getByLabelText('End'), {
      target: { value: '2026-08-28T10:45' },
    });

    expect(screen.getByText('Resolved UTC: 2026-08-28 13:15 UTC')).toBeInTheDocument();
    expect(screen.getByText('Resolved UTC: 2026-08-28 14:45 UTC')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Schedule banner' }));

    await waitFor(() =>
      expect(publishBanner).toHaveBeenCalledWith(
        expect.objectContaining({
          startAt: '2026-08-28T13:15:00.000Z',
          endAt: '2026-08-28T14:45:00.000Z',
        }),
      ),
    );
  });

  it('rejects a nonexistent spring-forward minute before submission', async () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      locale: 'en-US',
      calendar: 'gregory',
      numberingSystem: 'latn',
      timeZone: 'America/New_York',
    });
    render(BannerEditor);
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });
    editor.innerHTML = '<p>Gap content</p>';
    await fireEvent.input(editor);

    await fireEvent.input(screen.getByLabelText('Start'), {
      target: { value: '2026-03-08T02:30' },
    });

    expect(
      screen.getByText('This local time does not exist because the clock moves forward.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule banner' })).toBeDisabled();
  });

  it('requires an explicit offset for an ambiguous fall-back minute', async () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      locale: 'en-US',
      calendar: 'gregory',
      numberingSystem: 'latn',
      timeZone: 'America/New_York',
    });
    render(BannerEditor);
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });
    editor.innerHTML = '<p>Fold content</p>';
    await fireEvent.input(editor);

    await fireEvent.input(screen.getByLabelText('Start'), {
      target: { value: '2026-11-01T01:30' },
    });

    const offset = screen.getByRole('combobox', { name: 'Start UTC offset' });
    expect(offset).toHaveTextContent('UTC-04:00');
    expect(offset).toHaveTextContent('UTC-05:00');
    expect(screen.getByRole('button', { name: 'Schedule banner' })).toBeDisabled();
    await fireEvent.change(offset, { target: { value: '2026-11-01T06:30:00.000Z' } });
    expect(offset).toHaveValue('2026-11-01T06:30:00.000Z');
    await waitFor(() => {
      expect(screen.getByText('Resolved UTC: 2026-11-01 06:30 UTC')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Schedule banner' })).toBeEnabled();
    });
  });

  it.each([
    ['ambiguous fall-back', '2026-11-01T01:30'],
    ['nonexistent spring-forward', '2026-03-08T02:30'],
    ['invalid sub-minute', '2026-08-28T09:15:30'],
  ])(
    'treats an unresolved %s schedule edit as dirty while keeping it unsavable',
    async (_case, localStart) => {
      vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
        locale: 'en-US',
        calendar: 'gregory',
        numberingSystem: 'latn',
        timeZone: 'America/New_York',
      });
      const oncancel = vi.fn();
      render(BannerEditor, { props: { banner: saved, oncancel } });

      const start = screen.getByLabelText('Start');
      await fireEvent.input(start, { target: { value: localStart } });

      expect(start).toHaveValue(localStart);
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Schedule banner' })).toBeDisabled();
      await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.getByRole('heading', { name: 'Unsaved Changes' })).toBeInTheDocument();
      expect(oncancel).not.toHaveBeenCalled();
    },
  );

  it('updates a published row with its exact historical start without exposing history controls', async () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      locale: 'en-US',
      calendar: 'gregory',
      numberingSystem: 'latn',
      timeZone: 'America/New_York',
    });
    const corrected = {
      ...published,
      htmlContent: '<p>Corrected content</p>',
      presentationHash: 'corrected-hash',
    };
    vi.mocked(updatePublishedBanner).mockResolvedValue(corrected);
    const onsuccess = vi.fn();
    render(BannerEditor, { props: { banner: published, onsuccess } });
    expect(
      screen.getByText(
        'Correct the published announcement. Saved changes take effect immediately.',
      ),
    ).toBeInTheDocument();
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });
    editor.innerHTML = '<p>Corrected content</p>';
    expect(screen.queryByText(/version history/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /version|history|revisions?|restore|revert|rollback/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', {
        name: /version|history|revisions?|restore|revert|rollback/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Start')).toHaveValue('2026-08-27T08:00');
    expect(screen.getByText('Resolved UTC: 2026-08-27 12:00 UTC')).toBeInTheDocument();
    await fireEvent.input(editor);

    expect(screen.queryByText(/version history/i)).not.toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onsuccess).toHaveBeenCalledWith(corrected));
    expect(updatePublishedBanner).toHaveBeenCalledWith(
      published.uuid,
      expect.objectContaining({
        htmlContent: '<p>Corrected content</p>',
        startAt: published.startAt,
        endAt: null,
      }),
    );
  });

  it('reschedules a published occurrence and returns the authoritative derived state', async () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      locale: 'en-US',
      calendar: 'gregory',
      numberingSystem: 'latn',
      timeZone: 'America/New_York',
    });
    const scheduled = {
      ...published,
      lifecycle: 'SCHEDULED' as const,
      startAt: '2026-08-28T13:15:00Z',
      updatedAt: '2026-08-27T13:00:00Z',
    };
    vi.mocked(updatePublishedBanner).mockResolvedValue(scheduled);
    const onsuccess = vi.fn();
    render(BannerEditor, { props: { banner: published, onsuccess } });

    await fireEvent.input(screen.getByLabelText('Start'), {
      target: { value: '2026-08-28T09:15' },
    });

    expect(screen.getByText('Resolved UTC: 2026-08-28 13:15 UTC')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onsuccess).toHaveBeenCalledWith(scheduled));
    expect(updatePublishedBanner).toHaveBeenCalledWith(
      published.uuid,
      expect.objectContaining({ startAt: '2026-08-28T13:15:00.000Z', endAt: null }),
    );
  });

  it('does not round an untouched server-now start when saving another published change', async () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      locale: 'en-US',
      calendar: 'gregory',
      numberingSystem: 'latn',
      timeZone: 'America/New_York',
    });
    const exactPublished = { ...published, startAt: '2026-08-27T12:00:37.421Z' };
    vi.mocked(updatePublishedBanner).mockResolvedValue({
      ...exactPublished,
      htmlContent: '<p>Corrected content</p>',
    });
    render(BannerEditor, { props: { banner: exactPublished } });
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });
    editor.innerHTML = '<p>Corrected content</p>';
    await fireEvent.input(editor);

    await fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(updatePublishedBanner).toHaveBeenCalledOnce());
    expect(updatePublishedBanner).toHaveBeenCalledWith(
      exactPublished.uuid,
      expect.objectContaining({ startAt: exactPublished.startAt }),
    );
  });

  it('clears a published end and treats a schedule-only edit as guarded dirty state', async () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      locale: 'en-US',
      calendar: 'gregory',
      numberingSystem: 'latn',
      timeZone: 'America/New_York',
    });
    const ending = { ...published, endAt: '2026-08-27T14:00:00Z' };
    const permanent = {
      ...ending,
      endAt: null,
      updatedAt: '2026-08-27T13:00:00Z',
    };
    vi.mocked(updatePublishedBanner).mockResolvedValue(permanent);
    const oncancel = vi.fn();
    render(BannerEditor, { props: { banner: ending, oncancel } });

    expect(screen.getByLabelText('End')).toHaveValue('2026-08-27T10:00');
    await fireEvent.input(screen.getByLabelText('End'), { target: { value: '' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('heading', { name: 'Unsaved Changes' })).toBeInTheDocument();
    expect(oncancel).not.toHaveBeenCalled();
    await fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(updatePublishedBanner).toHaveBeenCalledOnce());
    expect(updatePublishedBanner).toHaveBeenCalledWith(
      ending.uuid,
      expect.objectContaining({ startAt: ending.startAt, endAt: null }),
    );
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

  it('discards a pending navigation through the captured destination', async () => {
    let guard: ((navigation: Record<string, unknown>) => void) | undefined;
    navigation.beforeNavigate.mockImplementation((callback) => {
      guard = callback;
    });
    render(BannerEditor);
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });
    editor.innerHTML = '<p>Unsaved content</p>';
    await fireEvent.input(editor);
    const cancel = vi.fn();

    guard?.({
      to: { url: new URL('http://localhost/help?from=banner#guide') },
      willUnload: false,
      cancel,
    });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));

    expect(cancel).toHaveBeenCalledOnce();
    expect(navigation.goto).toHaveBeenCalledWith('/help?from=banner#guide');
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

  it('keeps a failed published correction in the editor', async () => {
    vi.mocked(updatePublishedBanner).mockRejectedValue(new Error('private server detail'));
    render(BannerEditor, { props: { banner: published } });
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });
    editor.innerHTML = '<p>Keep this correction</p>';
    await fireEvent.input(editor);
    await fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(updatePublishedBanner).toHaveBeenCalledOnce());
    expect(editor).toHaveTextContent('Keep this correction');
    expect(toaster.error).toHaveBeenCalledWith({
      title: 'Banner could not be updated',
      description: 'The changes were not saved. Check your connection and try again.',
    });
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
