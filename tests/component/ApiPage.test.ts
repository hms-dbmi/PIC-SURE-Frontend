// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';

const { log, goto, mockPage } = vi.hoisted(() => ({
  log: vi.fn(),
  goto: vi.fn(),
  mockPage: { url: new URL('https://example.org/api') },
}));

vi.mock('$app/navigation', () => ({ goto, afterNavigate: vi.fn() }));
vi.mock('$app/state', () => ({ page: mockPage }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$lib/logger', () => ({
  log,
  createLog: (eventType: string, action?: string, metadata?: Record<string, unknown>) => ({
    event_type: eventType,
    action,
    metadata,
  }),
}));
vi.mock('$lib/stores/User', async () => {
  const { writable } = await import('svelte/store');
  return { tokenStatus: writable(false) };
});
vi.mock('$lib/stores/Resources', () => ({
  getApiConnectionResource: () => ({ requiresAuth: false, usesDistinctOpenResource: true }),
}));
vi.mock('$lib/api', () => ({ post: vi.fn() }));
vi.mock('$lib/components/ApiDocumentation.svelte', async () => ({
  default: (await import('./fixtures/StubComponent.svelte')).default,
}));

import ApiPage from '../../src/routes/(picsure)/(public)/api/+page.svelte';

function actions(name: string) {
  return log.mock.calls.map(([event]) => event).filter((event) => event.action === name);
}

function workflowHeader(id: string) {
  return within(screen.getByTestId(`workflow-${id}`)).getAllByRole('button')[0];
}

describe('API page logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';
    goto.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn() },
      configurable: true,
    });
    // happy-dom has no Web Animations API; the copy Popover's fade transition needs it
    Element.prototype.animate = vi.fn().mockReturnValue({
      cancel: vi.fn(),
      finish: vi.fn(),
      finished: Promise.resolve(),
    });
  });

  it('logs the workflow a deep link opens', async () => {
    window.location.hash = '#workflow-r';
    render(ApiPage);
    await tick();

    expect(actions('api.workflow_toggle')).toEqual([
      {
        event_type: 'ACTION',
        action: 'api.workflow_toggle',
        metadata: { open: 'r', source: 'deep_link' },
      },
    ]);
  });

  it('logs user toggles as clicks', async () => {
    render(ApiPage);
    await tick();

    // zag's accordion only handles trigger clicks once the trigger has focus, as a real click gives it
    workflowHeader('python').focus();
    await tick();
    await fireEvent.click(workflowHeader('python'));
    await fireEvent.click(workflowHeader('python'));

    expect(actions('api.workflow_toggle').map((event) => event.metadata)).toEqual([
      { open: 'python', source: 'click' },
      { open: null, source: 'click' },
    ]);
  });

  it('logs code copies, docs links, and login links with their context', async () => {
    window.location.hash = '#workflow-http';
    render(ApiPage);
    await tick();
    const http = screen.getByTestId('workflow-http');

    await fireEvent.click(within(http).getByTestId('code-block-copy-btn'));
    await fireEvent.click(within(http).getByRole('link', { name: 'API reference' }));
    await fireEvent.click(screen.getByTestId('api-login-link'));
    await fireEvent.click(
      within(screen.getByTestId('api-public-notice')).getByRole('link', { name: 'log in' }),
    );

    expect(actions('api.code_copy').map((event) => event.metadata)).toEqual([{ workflow: 'http' }]);
    expect(actions('api.workflow_docs_click').map((event) => event.metadata)).toEqual([
      { workflow: 'http', target: 'api-access' },
    ]);
    expect(goto).toHaveBeenCalledWith('/api#api-access', { noScroll: true, keepFocus: true });
    expect(actions('api.login_click').map((event) => event.metadata)).toEqual([
      { location: 'capabilities' },
      { location: 'public_notice' },
    ]);
  });

  it('logs external docs links with their URL', async () => {
    window.location.hash = '#workflow-python';
    render(ApiPage);
    await tick();
    const python = screen.getByTestId('workflow-python');

    await fireEvent.click(
      within(python).getByRole('link', { name: 'Python client documentation' }),
    );
    await fireEvent.click(within(python).getByRole('link', { name: 'public GitHub repository' }));

    expect(actions('api.workflow_docs_click').map((event) => event.metadata)).toEqual([
      { workflow: 'python', target: 'https://github.com/hms-dbmi/pic-sure-python-adapter-hpds' },
      {
        workflow: 'python',
        target: 'https://github.com/hms-dbmi/Access-to-Data-using-PIC-SURE-API',
      },
    ]);
  });
});
