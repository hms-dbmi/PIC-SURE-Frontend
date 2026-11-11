// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

import ChatWindow from '$lib/assistedSearch/components/ChatWindow.svelte';
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
    expect(screen.getByRole('alert').textContent).toContain('could not be put on your screen');
  });

  it('renders user text as plain text, not markdown or HTML', () => {
    render(ChatMessage, { message: { id: '1', role: 'user', text: '**x** <b>y</b>' } });
    expect(screen.getByTestId('chat-message-user').textContent).toContain('**x** <b>y</b>');
  });
});
