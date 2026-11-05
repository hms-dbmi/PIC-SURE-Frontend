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

  it('swaps Send for Stop while a turn is pending', async () => {
    let finish!: (r: ChatResponse) => void;
    const chat = session(new Promise<ChatResponse>((r) => (finish = r)));
    render(ChatWindow, { session: chat });

    await fireEvent.input(screen.getByTestId('chat-input'), { target: { value: 'hi' } });
    await fireEvent.click(screen.getByTestId('chat-send'));
    await waitFor(() => expect(screen.getByTestId('chat-stop')).toBeTruthy());
    expect(screen.queryByTestId('chat-send')).toBeNull();

    finish({ response: 'done' });
    await waitFor(() => expect(screen.getByTestId('chat-send')).toBeTruthy());
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
  });

  it('toggles full screen on the session', async () => {
    const chat = session({ response: 'x' });
    render(ChatWindow, { session: chat });
    await fireEvent.click(screen.getByTestId('chat-expand'));
    expect(chat.fullScreen).toBe(true);
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
