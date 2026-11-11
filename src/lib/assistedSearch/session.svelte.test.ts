import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ sendChat: vi.fn(), log: vi.fn() }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/explorer') } }));
vi.mock('./api.ts', () => ({
  sendChat: mocks.sendChat,
  fetchChatResult: vi.fn(async () => undefined),
}));
vi.mock('./screen.svelte.ts', () => ({
  readScreen: () => ({
    query: { select: [], phenotypicClause: null, genomicFilters: [] },
    facets: [],
    search: '',
  }),
  applyScreen: vi.fn(async () => {}),
  watchScreen: () => () => {},
}));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: mocks.log,
  createLog: (category: string, event: string, data?: unknown) => ({ category, event, data }),
  getPageContext: () => 'explorer',
  registerSignedInUser: vi.fn(),
}));

import { chat } from './session.ts';
import { loadSavedChat } from './storage.ts';
import { explorerSearch as search } from '#lib/explorer/search.svelte.ts';
import type { ChatResponse } from './model/types.ts';

describe('resetting the search and the assistant', () => {
  beforeEach(() => {
    chat.reset();
    chat.setOpen(false);
    mocks.sendChat.mockReset();
    mocks.log.mockClear();
    sessionStorage.clear();
  });

  it('clears the messages, the conversation, any error and the pending turn', async () => {
    let aborted: AbortSignal | undefined;
    mocks.sendChat
      .mockRejectedValueOnce({ status: 400, body: { message: 'refused' } })
      .mockImplementation(
        (_request, signal: AbortSignal) =>
          new Promise<ChatResponse>((_, reject) => {
            signal.addEventListener('abort', () => {
              aborted = signal;
              reject(new DOMException('', 'AbortError'));
            });
          }),
      );
    chat.setOpen(true);
    await chat.send('first');
    expect(chat.messages.at(-1)).toMatchObject({ failed: true });
    const pending = chat.send('second');
    expect(chat.pending).toBe(true);
    search.setTerm('age');

    search.reset();

    expect(search.term).toBe('');
    expect(aborted?.aborted).toBe(true);
    expect(chat.messages).toEqual([]);
    expect(chat.pending).toBe(false);
    expect(chat.recovering).toBe(false);
    // Reset starts the search over; whether the panel is showing is the researcher's call.
    expect(chat.open).toBe(true);
    expect(loadSavedChat()).toMatchObject({ messages: [], conversationId: null });
    expect(mocks.log).toHaveBeenCalledWith(expect.objectContaining({ event: 'chat.reset' }));

    await pending;
    expect(chat.messages).toEqual([]);

    const [first] = mocks.sendChat.mock.calls.map(([request]) => request.conversationId);
    const next = chat.send('third');
    chat.stop();
    await next;
    expect(mocks.sendChat.mock.calls.at(-1)![0].conversationId).not.toBe(first);
  });

  it('leaves an empty, closed chat as it was', () => {
    search.reset();
    expect(chat.messages).toEqual([]);
    expect(chat.open).toBe(false);
    expect(loadSavedChat()).toBeNull();
  });
});
