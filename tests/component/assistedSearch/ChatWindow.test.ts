// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

import ChatWindow from '$lib/assistedSearch/components/ChatWindow.svelte';
import ChatToggleButton from '$lib/assistedSearch/components/ChatToggleButton.svelte';
import ChatMessage from '$lib/assistedSearch/components/ChatMessage.svelte';
import { ChatSession, type ChatDeps } from '$lib/assistedSearch/chat.svelte';
import type { ChatResponse, ScreenState } from '$lib/assistedSearch/model/types';

vi.mock('$lib/logger', () => ({
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

    const box = screen.getByTestId('chat-input') as HTMLTextAreaElement;
    await fireEvent.input(box, { target: { value: 'blood pressure?' } });
    await fireEvent.keyDown(box, { key: 'Enter' });

    await waitFor(() => expect(screen.getByTestId('chat-message-text')).toBeTruthy());
    expect(screen.getByTestId('chat-message-user').textContent).toContain('blood pressure?');
    expect(screen.getByTestId('chat-message-text').innerHTML).toContain('<strong>studies</strong>');
    expect(box.value).toBe('');
  });

  it('keeps Shift+Enter for a new line', async () => {
    const chat = session({ response: 'x' });
    render(ChatWindow, { session: chat });
    const box = screen.getByTestId('chat-input');
    await fireEvent.input(box, { target: { value: 'a' } });
    await fireEvent.keyDown(box, { key: 'Enter', shiftKey: true });
    expect(chat.messages).toHaveLength(0);
  });

  it('offers Stop beside a disabled Send while a turn is pending', async () => {
    let finish!: (r: ChatResponse) => void;
    const chat = session(new Promise<ChatResponse>((r) => (finish = r)));
    render(ChatWindow, { session: chat });

    await fireEvent.input(screen.getByTestId('chat-input'), { target: { value: 'hi' } });
    await fireEvent.click(screen.getByTestId('chat-send'));
    await waitFor(() => expect(screen.getByTestId('chat-stop')).toBeTruthy());
    expect((screen.getByTestId('chat-send') as HTMLButtonElement).disabled).toBe(true);

    finish({ response: 'done' });
    await waitFor(() => expect(screen.queryByTestId('chat-stop')).toBeNull());
  });

  it('shows what a reply changed and undoes it', async () => {
    const chat = session({ response: 'Searching.', search: 'bmi' });
    render(ChatWindow, { session: chat });

    await fireEvent.input(screen.getByTestId('chat-input'), { target: { value: 'bmi' } });
    await fireEvent.click(screen.getByTestId('chat-send'));
    await waitFor(() =>
      expect(screen.getByTestId('chat-changed').textContent).toBe('Updated search'),
    );

    await fireEvent.click(screen.getByTestId('chat-undo'));
    await waitFor(() => expect(screen.getByTestId('chat-undone')).toBeTruthy());
    expect(screen.queryByTestId('chat-undo')).toBeNull();

    await fireEvent.click(screen.getByTestId('chat-redo'));
    await waitFor(() => expect(screen.getByTestId('chat-undo')).toBeTruthy());
  });

  it('disables undo with a reason once the screen has changed', async () => {
    const chat = session({ response: 'Searching.', search: 'bmi' });
    render(ChatWindow, { session: chat });
    await chat.send('bmi');
    await waitFor(() => expect(screen.getByTestId('chat-undo')).toBeTruthy());

    chat.messages[1].after = { ...chat.messages[1].after!, search: 'something else' };
    await waitFor(() => {
      const undo = screen.getByTestId('chat-undo') as HTMLButtonElement;
      expect(undo.disabled).toBe(true);
      expect(undo.title).toBe('Disabled after you changed the screen');
    });
  });

  it('starts a new conversation only after confirmation', async () => {
    const chat = session({ response: 'x' });
    render(ChatWindow, { session: chat });
    expect((screen.getByTestId('chat-new') as HTMLButtonElement).disabled).toBe(true);

    await chat.send('hi');
    await waitFor(() =>
      expect((screen.getByTestId('chat-new') as HTMLButtonElement).disabled).toBe(false),
    );
    await fireEvent.click(screen.getByTestId('chat-new'));
    expect(chat.messages).toHaveLength(2);
    await fireEvent.click(await screen.findByText('Start new'));
    expect(chat.messages).toEqual([]);
  });

  it('toggles the taller transcript in place', async () => {
    const chat = session({ response: 'x' });
    render(ChatWindow, { session: chat });
    const expand = screen.getByTestId('chat-expand');
    expect(expand.textContent).toBe('Expand');
    await fireEvent.click(expand);
    expect(chat.tall).toBe(true);
    expect(expand.textContent).toBe('Compact');
    expect(screen.getByTestId('chat-thread').className).toContain('max-h-[62vh]');
  });

  it('sends a suggestion when clicked and hides the panel on close', async () => {
    const chat = session({ response: 'x' });
    chat.setOpen(true);
    render(ChatWindow, { session: chat });
    await fireEvent.click(screen.getAllByTestId('chat-suggestion')[0]);
    expect(chat.messages[0].role).toBe('user');
    await fireEvent.click(screen.getByTestId('chat-close'));
    expect(chat.open).toBe(false);
  });
});

describe('ChatMessage', () => {
  it('renders a failed reply as an error with no copy or undo', () => {
    render(ChatMessage, {
      message: { id: '1', role: 'assistant', text: 'It broke', failed: true },
    });
    expect(screen.getByText('It broke')).toBeTruthy();
    expect(screen.queryByTestId('chat-undo')).toBeNull();
    expect(screen.queryByTestId('chat-copy')).toBeNull();
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
      expect(screen.getByTestId('chat-thinking')).toHaveTextContent('taking longer than usual'),
    );
    expect(screen.queryByRole('button', { name: /retry|try again/i })).toBeNull();

    await waitFor(() => expect(fetchResult).toHaveBeenCalled());
    found({ response: 'Here it is.' });
    await sent;
    await waitFor(() =>
      expect(screen.getByTestId('chat-message-text')).toHaveTextContent('Here it is.'),
    );
    expect(screen.queryByTestId('chat-thinking')).toBeNull();
  });

  it('says when proposed changes could not be applied', () => {
    render(ChatMessage, {
      message: { id: '1', role: 'assistant', text: 'Here you go', applyFailed: true },
    });
    // Inside the polite log, so it is announced once rather than again as an assertive alert.
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByTestId('chat-apply-failed').textContent).toContain(
      'could not be put on your screen',
    );
  });

  it('renders user text as plain text, not markdown or HTML', () => {
    render(ChatMessage, { message: { id: '1', role: 'user', text: '**x** <b>y</b>' } });
    expect(screen.getByTestId('chat-message-user').textContent).toContain('**x** <b>y</b>');
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
    expect(screen.getByTestId('chat-input').getAttribute('aria-describedby')).toBe(
      'chat-input-hint',
    );
  });

  it('names Stop while pending and keeps focus in the box after it', async () => {
    const chat = session(new Promise<ChatResponse>(() => {}));
    render(ChatWindow, { session: chat });
    const box = screen.getByTestId('chat-input');
    await fireEvent.input(box, { target: { value: 'hi' } });
    await fireEvent.click(screen.getByTestId('chat-send'));
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
    const box = screen.getByTestId('chat-input');
    await fireEvent.input(box, { target: { value: 'composing' } });
    await fireEvent.keyDown(box, { key: 'Enter', isComposing: true });
    expect(chat.messages).toHaveLength(0);
    await fireEvent.keyDown(box, { key: 'Enter' });
    expect(chat.messages[0].text).toBe('composing');
  });

  it('keeps the controls as ordinary focusable buttons with a visible focus style', () => {
    const chat = session({ response: 'x' });
    render(ChatWindow, { session: chat });
    for (const id of ['chat-expand', 'chat-close', 'chat-send', 'chat-input']) {
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
    await waitFor(() => expect(screen.getByTestId('chat-thinking')).toBeTruthy());
    expect(log.contains(screen.getByTestId('chat-thinking'))).toBe(false);
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
    const thread = screen.getByTestId('chat-thread');
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
    const thread = screen.getByTestId('chat-thread');
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
