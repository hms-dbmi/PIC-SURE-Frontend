// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

import ChatWindow from './ChatWindow.svelte';
import ChatToggleButton from './ChatToggleButton.svelte';
import ChatMessage from './ChatMessage.svelte';
import { ChatSession, type ChatDeps } from '../chat.svelte.ts';
import type { ChatResponse, ScreenState } from '../model/types.ts';

vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: (eventType: string, action?: string) => ({ event_type: eventType, action }),
}));

const emptyScreen = (): ScreenState => ({
  query: { select: [], phenotypicClause: null, genomicFilters: [] },
  facets: [],
  search: '',
});

function session(reply: ChatResponse | Promise<ChatResponse>) {
  let screenState = emptyScreen();
  let id = 0;
  const deps: ChatDeps = {
    readScreen: () => screenState,
    applyScreen: async (parts) => {
      screenState = { ...screenState, ...parts };
    },
    send: vi.fn(async () => reply),
    fetchResult: vi.fn(async () => undefined),
    newId: () => `id-${++id}`,
  };
  return new ChatSession(deps);
}

describe('ChatWindow', () => {
  it('sends on Enter, shows both sides, and clears the box', async () => {
    const chat = session({ response: 'Three **studies** match.' });
    render(ChatWindow, { session: chat });

    const box = screen.getByTestId('explorer-assistant-input') as HTMLTextAreaElement;
    await fireEvent.input(box, { target: { value: 'blood pressure?' } });
    await fireEvent.keyDown(box, { key: 'Enter' });

    await waitFor(() => expect(screen.getByTestId('explorer-assistant-message-text')).toBeTruthy());
    expect(screen.getByTestId('explorer-assistant-message-user').textContent).toContain(
      'blood pressure?',
    );
    expect(screen.getByTestId('explorer-assistant-message-text').innerHTML).toContain(
      '<strong>studies</strong>',
    );
    expect(box.value).toBe('');
  });

  it('keeps Shift+Enter for a new line', async () => {
    const chat = session({ response: 'x' });
    render(ChatWindow, { session: chat });
    const box = screen.getByTestId('explorer-assistant-input');
    await fireEvent.input(box, { target: { value: 'a' } });
    await fireEvent.keyDown(box, { key: 'Enter', shiftKey: true });
    expect(chat.messages).toHaveLength(0);
  });

  it('offers Stop beside a disabled Send while a turn is pending', async () => {
    let finish!: (r: ChatResponse) => void;
    const chat = session(new Promise<ChatResponse>((r) => (finish = r)));
    render(ChatWindow, { session: chat });

    await fireEvent.input(screen.getByTestId('explorer-assistant-input'), {
      target: { value: 'hi' },
    });
    await fireEvent.click(screen.getByTestId('explorer-assistant-send'));
    await waitFor(() => expect(screen.getByTestId('explorer-assistant-stop')).toBeTruthy());
    expect((screen.getByTestId('explorer-assistant-send') as HTMLButtonElement).disabled).toBe(
      true,
    );

    finish({ response: 'done' });
    await waitFor(() => expect(screen.queryByTestId('explorer-assistant-stop')).toBeNull());
  });

  it('shows what a reply changed and undoes it', async () => {
    const chat = session({ response: 'Searching.', search: 'bmi' });
    render(ChatWindow, { session: chat });

    await fireEvent.input(screen.getByTestId('explorer-assistant-input'), {
      target: { value: 'bmi' },
    });
    await fireEvent.click(screen.getByTestId('explorer-assistant-send'));
    await waitFor(() =>
      expect(screen.getByTestId('explorer-assistant-changed').textContent).toBe('Updated search'),
    );

    await fireEvent.click(screen.getByTestId('explorer-assistant-undo'));
    await waitFor(() => expect(screen.getByTestId('explorer-assistant-undone')).toBeTruthy());
    expect(screen.queryByTestId('explorer-assistant-undo')).toBeNull();

    await fireEvent.click(screen.getByTestId('explorer-assistant-redo'));
    await waitFor(() => expect(screen.getByTestId('explorer-assistant-undo')).toBeTruthy());
  });

  it('disables undo with a reason once the screen has changed', async () => {
    const chat = session({ response: 'Searching.', search: 'bmi' });
    render(ChatWindow, { session: chat });
    await chat.send('bmi');
    await waitFor(() => expect(screen.getByTestId('explorer-assistant-undo')).toBeTruthy());

    chat.messages[1].after = { ...chat.messages[1].after!, search: 'something else' };
    await waitFor(() => {
      const undo = screen.getByTestId('explorer-assistant-undo') as HTMLButtonElement;
      expect(undo.disabled).toBe(true);
      expect(undo.title).toBe('Disabled after you changed the screen');
    });
  });

  it('starts a new conversation only after confirmation', async () => {
    const chat = session({ response: 'x' });
    render(ChatWindow, { session: chat });
    expect((screen.getByTestId('explorer-assistant-new') as HTMLButtonElement).disabled).toBe(true);

    await chat.send('hi');
    await waitFor(() =>
      expect((screen.getByTestId('explorer-assistant-new') as HTMLButtonElement).disabled).toBe(
        false,
      ),
    );
    await fireEvent.click(screen.getByTestId('explorer-assistant-new'));
    expect(chat.messages).toHaveLength(2);
    await fireEvent.click(await screen.findByText('Start new'));
    expect(chat.messages).toEqual([]);
  });

  it('toggles the taller transcript in place', async () => {
    const chat = session({ response: 'x' });
    render(ChatWindow, { session: chat });
    const expand = screen.getByTestId('explorer-assistant-expand');
    expect(expand.textContent).toBe('Expand');
    await fireEvent.click(expand);
    expect(chat.tall).toBe(true);
    expect(expand.textContent).toBe('Compact');
    expect(screen.getByTestId('explorer-assistant-thread').className).toContain('max-h-[62vh]');
  });

  it('sends a suggestion when clicked and hides the panel on close', async () => {
    const chat = session({ response: 'x' });
    chat.setOpen(true);
    render(ChatWindow, { session: chat });
    await fireEvent.click(screen.getAllByTestId('explorer-assistant-suggestion')[0]);
    expect(chat.messages[0].role).toBe('user');
    await fireEvent.click(screen.getByTestId('explorer-assistant-close'));
    expect(chat.open).toBe(false);
  });
});

describe('ChatMessage', () => {
  it('renders a failed reply as an error with no copy or undo', () => {
    render(ChatMessage, {
      message: { id: '1', role: 'assistant', text: 'It broke', failed: true },
    });
    expect(screen.getByText('It broke')).toBeTruthy();
    expect(screen.queryByTestId('explorer-assistant-undo')).toBeNull();
    expect(screen.queryByTestId('explorer-assistant-copy')).toBeNull();
    expect(screen.queryByTestId('explorer-assistant-copy-trigger')).toBeNull();
  });

  it('offers no retry control on a failed reply', () => {
    render(ChatMessage, {
      message: { id: '1', role: 'assistant', text: 'It broke', failed: true },
    });
    expect(screen.queryByRole('button', { name: /retry|try again/i })).toBeNull();
  });

  it('says it is still waiting while the stored reply is fetched, then shows it', async () => {
    let found!: (r: ChatResponse) => void;
    const fetchResult = vi.fn(() => new Promise<ChatResponse>((r) => (found = r)));
    const chat = new ChatSession({
      readScreen: emptyScreen,
      applyScreen: async () => {},
      send: vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
      fetchResult,
      newId: () => 'id',
      pollMs: 1,
    });
    render(ChatWindow, { session: chat });

    const sent = chat.send('slow');
    await waitFor(() =>
      expect(screen.getByTestId('explorer-assistant-thinking')).toHaveTextContent(
        'taking longer than usual',
      ),
    );
    expect(screen.queryByRole('button', { name: /retry|try again/i })).toBeNull();

    await waitFor(() => expect(fetchResult).toHaveBeenCalled());
    found({ response: 'Here it is.' });
    await sent;
    await waitFor(() =>
      expect(screen.getByTestId('explorer-assistant-message-text')).toHaveTextContent(
        'Here it is.',
      ),
    );
    expect(screen.queryByTestId('explorer-assistant-thinking')).toBeNull();
  });

  it('says when proposed changes could not be applied', () => {
    render(ChatMessage, {
      message: { id: '1', role: 'assistant', text: 'Here you go', applyFailed: true },
    });
    // Inside the polite log, so it is announced once rather than again as an assertive alert.
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByTestId('explorer-assistant-apply-failed').textContent).toContain(
      'could not be put on your screen',
    );
  });

  it('renders user text as plain text, not markdown or HTML', () => {
    render(ChatMessage, { message: { id: '1', role: 'user', text: '**x** <b>y</b>' } });
    expect(screen.getByTestId('explorer-assistant-message-user').textContent).toContain(
      '**x** <b>y</b>',
    );
  });
});

describe('ChatWindow accessibility', () => {
  it('names every control', () => {
    const chat = session({ response: 'x' });
    render(ChatWindow, { session: chat });
    expect(screen.getByRole('textbox', { name: 'Message the search assistant' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Expand assistant panel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hide the assistant' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New conversation' })).toBeTruthy();
    expect(screen.getByTestId('explorer-assistant-input').getAttribute('aria-describedby')).toBe(
      'explorer-assistant-input-hint',
    );
  });

  it('names Stop while pending and keeps focus in the box after it', async () => {
    const chat = session(new Promise<ChatResponse>(() => {}));
    render(ChatWindow, { session: chat });
    const box = screen.getByTestId('explorer-assistant-input');
    await fireEvent.input(box, { target: { value: 'hi' } });
    await fireEvent.click(screen.getByTestId('explorer-assistant-send'));
    const stop = await screen.findByRole('button', { name: 'Stop' });
    expect(document.activeElement).toBe(box);
    await fireEvent.click(stop);
    expect(document.activeElement).toBe(box);
  });

  it('has a label that follows the Expand control state, without a conflicting pressed state', async () => {
    const chat = session({ response: 'x' });
    render(ChatWindow, { session: chat });
    const expand = screen.getByRole('button', { name: 'Expand assistant panel' });
    expect(expand.hasAttribute('aria-pressed')).toBe(false);
    await fireEvent.click(expand);
    expect(screen.getByRole('button', { name: 'Compact assistant panel' })).toBeTruthy();
  });

  it('submits from the keyboard with Enter and not while composing', async () => {
    const chat = session({ response: 'ok' });
    render(ChatWindow, { session: chat });
    const box = screen.getByTestId('explorer-assistant-input');
    await fireEvent.input(box, { target: { value: 'composing' } });
    await fireEvent.keyDown(box, { key: 'Enter', isComposing: true });
    expect(chat.messages).toHaveLength(0);
    await fireEvent.keyDown(box, { key: 'Enter' });
    expect(chat.messages[0].text).toBe('composing');
  });

  it('keeps the controls as ordinary focusable buttons with a visible focus style', () => {
    const chat = session({ response: 'x' });
    render(ChatWindow, { session: chat });
    for (const id of [
      'explorer-assistant-expand',
      'explorer-assistant-close',
      'explorer-assistant-send',
      'explorer-assistant-input',
    ]) {
      const el = screen.getByTestId(id);
      expect(el.getAttribute('tabindex')).not.toBe('-1');
      expect(el.className).toContain('focus-visible:outline');
    }
  });

  it('announces only the conversation in the log, and the waiting status separately', async () => {
    let finish!: (r: ChatResponse) => void;
    const chat = session(new Promise<ChatResponse>((r) => (finish = r)));
    render(ChatWindow, { session: chat });
    void chat.send('hi');

    const log = screen.getByRole('log', { name: 'Conversation' });
    expect(log.getAttribute('aria-live')).toBe('polite');
    await waitFor(() => expect(screen.getByTestId('explorer-assistant-thinking')).toBeTruthy());
    expect(log.contains(screen.getByTestId('explorer-assistant-thinking'))).toBe(false);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.queryByRole('alert')).toBeNull();

    finish({ response: 'Answer.' });
    await waitFor(() => expect(log.textContent).toContain('Answer.'));
    expect(log.querySelectorAll('[aria-live], [role=alert], [role=status]')).toHaveLength(0);
  });

  it('puts a failed reply in the polite log, not an assertive alert', async () => {
    const chat = session(Promise.reject({ status: 422, body: { message: 'No can do.' } }));
    render(ChatWindow, { session: chat });
    await chat.send('hi');
    const log = screen.getByRole('log');
    await waitFor(() => expect(log.textContent).toContain('No can do.'));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('ChatWindow scrolling', () => {
  // happy-dom does no layout, so give the thread a geometry the scroll maths can read.
  function geometry(el: HTMLElement, g: { scrollHeight: number; clientHeight: number }) {
    Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => g.scrollHeight });
    Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => g.clientHeight });
    const scrollTo = vi.fn((opts: ScrollToOptions) => {
      el.scrollTop = opts.top ?? 0;
    });
    el.scrollTo = scrollTo as unknown as typeof el.scrollTo;
    return scrollTo;
  }

  const settle = () => new Promise((r) => setTimeout(r, 0));

  it('follows new messages at the bottom, yields when scrolled up, resumes at the bottom', async () => {
    let n = 0;
    const chat = new ChatSession({
      readScreen: emptyScreen,
      applyScreen: async () => {},
      send: vi.fn(async () => ({ response: `reply ${++n}` })),
      fetchResult: vi.fn(async () => undefined),
      newId: () => `id-${Math.random()}`,
    });
    render(ChatWindow, { session: chat });
    const thread = screen.getByTestId('explorer-assistant-thread');
    const g = { scrollHeight: 1000, clientHeight: 200 };
    const scrollTo = geometry(thread, g);

    // At the bottom: a reply is followed.
    thread.scrollTop = 800;
    await fireEvent.scroll(thread);
    chat.messages.push({ id: 'a', role: 'assistant', text: 'one' });
    await settle();
    expect(scrollTo).toHaveBeenCalledWith({ top: 1000 });

    // Scrolled up to reread: a new reply does not pull them back.
    scrollTo.mockClear();
    thread.scrollTop = 100;
    await fireEvent.scroll(thread);
    g.scrollHeight = 1200;
    chat.messages.push({ id: 'b', role: 'assistant', text: 'two' });
    await settle();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(thread.scrollTop).toBe(100);

    // Back at the bottom: following resumes.
    thread.scrollTop = 1000;
    await fireEvent.scroll(thread);
    g.scrollHeight = 1400;
    chat.messages.push({ id: 'c', role: 'assistant', text: 'three' });
    await settle();
    expect(scrollTo).toHaveBeenCalledWith({ top: 1400 });
  });

  it('jumps to the bottom when the researcher sends, even from further up', async () => {
    const chat = session({ response: 'ok' });
    render(ChatWindow, { session: chat });
    const thread = screen.getByTestId('explorer-assistant-thread');
    const scrollTo = geometry(thread, { scrollHeight: 1000, clientHeight: 200 });

    thread.scrollTop = 0;
    await fireEvent.scroll(thread);
    await chat.send('hello');
    await settle();
    expect(scrollTo).toHaveBeenCalledWith({ top: 1000 });
  });
});

describe('ChatToggleButton', () => {
  it('is a named toggle operable from the keyboard', async () => {
    const ontoggle = vi.fn();
    render(ChatToggleButton, { open: false, ontoggle });
    const button = screen.getByRole('button', { name: 'Assistant' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.className).toContain('focus-visible:outline');
    button.focus();
    expect(document.activeElement).toBe(button);
    await fireEvent.click(button);
    expect(ontoggle).toHaveBeenCalledTimes(1);
  });

  it('reports the open state', () => {
    render(ChatToggleButton, { open: true, ontoggle: () => {} });
    expect(screen.getByRole('button', { name: 'Assistant' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });
});

describe('ChatWindow conversation', () => {
  it('keeps the same conversation across close, reopen and expand', async () => {
    const send = vi.fn<ChatDeps['send']>(async () => ({ response: 'ok' }));
    let id = 0;
    const chat = new ChatSession({
      readScreen: emptyScreen,
      applyScreen: async () => {},
      send,
      fetchResult: vi.fn(async () => undefined),
      newId: () => `id-${++id}`,
    });
    chat.setOpen(true);
    const view = render(ChatWindow, { session: chat });

    await chat.send('first');
    await fireEvent.click(screen.getByTestId('explorer-assistant-expand'));
    await fireEvent.click(screen.getByTestId('explorer-assistant-close'));
    expect(chat.open).toBe(false);
    await view.rerender({ session: chat });
    chat.setOpen(true);
    await fireEvent.click(screen.getByTestId('explorer-assistant-expand'));
    await chat.send('second');

    await waitFor(() =>
      expect(screen.getAllByTestId('explorer-assistant-message-user')).toHaveLength(2),
    );
    expect(screen.getAllByTestId('explorer-assistant-message-text')).toHaveLength(2);
    const ids = send.mock.calls.map(([request]) => request.conversationId);
    expect(ids[1]).toBe(ids[0]);
  });

  it('stop keeps the message, adds no error, and lets the researcher send again', async () => {
    const send = vi.fn(
      (_request: unknown, signal: AbortSignal) =>
        new Promise<ChatResponse>((_, reject) =>
          signal.addEventListener('abort', () => reject(new Error('aborted'))),
        ),
    );
    const chat = new ChatSession({
      readScreen: emptyScreen,
      applyScreen: async () => {},
      send: send as ChatDeps['send'],
      fetchResult: vi.fn(async () => undefined),
      newId: () => `id-${Math.random()}`,
    });
    render(ChatWindow, { session: chat });

    await fireEvent.input(screen.getByTestId('explorer-assistant-input'), {
      target: { value: 'slow one' },
    });
    await fireEvent.click(screen.getByTestId('explorer-assistant-send'));
    await fireEvent.click(await screen.findByTestId('explorer-assistant-stop'));

    await waitFor(() => expect(screen.queryByTestId('explorer-assistant-stop')).toBeNull());
    expect(screen.getByTestId('explorer-assistant-message-user').textContent).toContain('slow one');
    expect(screen.queryByTestId('explorer-assistant-message-assistant')).toBeNull();
    await fireEvent.input(screen.getByTestId('explorer-assistant-input'), {
      target: { value: 'next' },
    });
    expect((screen.getByTestId('explorer-assistant-send') as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('shows a failure as a plain message with no retry, and a later send still works', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new Error('x'), { status: 500, body: { message: 'Model unavailable.' } }),
      )
      .mockResolvedValueOnce({ response: 'Back now.' });
    const chat = new ChatSession({
      readScreen: emptyScreen,
      applyScreen: async () => {},
      send,
      fetchResult: vi.fn(async () => undefined),
      newId: () => `id-${Math.random()}`,
    });
    render(ChatWindow, { session: chat });

    await fireEvent.input(screen.getByTestId('explorer-assistant-input'), {
      target: { value: 'hello' },
    });
    await fireEvent.click(screen.getByTestId('explorer-assistant-send'));
    await waitFor(() =>
      expect(screen.getByTestId('explorer-assistant-message-text')).toHaveTextContent(
        'Model unavailable.',
      ),
    );
    expect(screen.queryByRole('button', { name: /retry|try again/i })).toBeNull();
    expect(screen.queryByTestId('explorer-assistant-copy-trigger')).toBeNull();

    await fireEvent.input(screen.getByTestId('explorer-assistant-input'), {
      target: { value: 'again' },
    });
    await fireEvent.click(screen.getByTestId('explorer-assistant-send'));
    await waitFor(() =>
      expect(screen.getAllByTestId('explorer-assistant-message-text')).toHaveLength(2),
    );
    expect(screen.getAllByTestId('explorer-assistant-message-text')[1]).toHaveTextContent(
      'Back now.',
    );
  });
});

describe('ChatMessage copy', () => {
  const RAW = '**Three** studies match `age`.';

  it('copies the raw text, not the rendered markdown, and shows Copied! then reverts', async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    render(ChatMessage, { message: { id: '1', role: 'assistant', text: RAW } });
    expect(screen.getByTestId('explorer-assistant-message-text').innerHTML).toContain(
      '<strong>Three</strong>',
    );

    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const button = screen.getByTestId('explorer-assistant-copy-trigger');
      expect(button.innerHTML).toContain('fa-copy');
      await fireEvent.click(button);

      expect(writeText).toHaveBeenCalledExactlyOnceWith(RAW);
      await waitFor(() => expect(button.innerHTML).toContain('fa-square-check'));
      expect(await screen.findByText('Copied!')).toBeTruthy();

      await vi.advanceTimersByTimeAsync(4600);
      await waitFor(() => expect(button.innerHTML).toContain('fa-copy'));
      expect(button.innerHTML).not.toContain('fa-square-check');
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });
});
