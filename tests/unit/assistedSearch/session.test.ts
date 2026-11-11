// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const mocks = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { writable } = require('svelte/store') as typeof import('svelte/store');
  return {
    user: writable({}),
    facetsPromise: writable(Promise.resolve([])),
    sendChat: vi.fn(),
    log: vi.fn(),
  };
});

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/explorer') } }));
vi.mock('$lib/stores/User', () => ({ user: mocks.user }));
vi.mock('$lib/assistedSearch/api', () => ({
  sendChat: mocks.sendChat,
  fetchChatResult: vi.fn(async () => undefined),
}));
vi.mock('$lib/assistedSearch/screen', () => ({
  readScreen: () => ({
    query: { select: [], phenotypicClause: null, genomicFilters: [] },
    facets: [],
    search: '',
  }),
  applyScreen: vi.fn(async () => {}),
  watchScreen: () => () => {},
}));
vi.mock('$lib/stores/Dictionary', () => ({
  searchDictionary: vi.fn(),
  updateFacetsFromSearch: vi.fn(() => Promise.resolve([])),
  facetsPromise: mocks.facetsPromise,
  resetFacetState: vi.fn(),
}));
vi.mock('$lib/components/datatable/stores', () => ({ getDefaultRows: () => 10 }));
vi.mock('$lib/logger', () => ({
  log: mocks.log,
  createLog: (category: string, event: string, data?: unknown) => ({ category, event, data }),
  getPageContext: () => 'explorer',
}));
vi.mock('$lib/api', () => ({
  isAbortError: (e: unknown) => (e as Error | undefined)?.name === 'AbortError',
}));

import { chat } from '$lib/assistedSearch/session';
import { loadSavedChat } from '$lib/assistedSearch/storage';
import { resetSearch, searchTerm } from '$lib/stores/Search';
import type { ChatResponse } from '$lib/assistedSearch/model/types';

describe('resetSearch and the assistant', () => {
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
    searchTerm.set('age');

    resetSearch();

    expect(get(searchTerm)).toBe('');
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
    resetSearch();
    expect(chat.messages).toEqual([]);
    expect(chat.open).toBe(false);
    expect(loadSavedChat()).toBeNull();
  });
});
