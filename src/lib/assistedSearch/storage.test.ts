// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest';

import { SAVED_CHAT_MAX_AGE_MS, clearSavedChat, loadSavedChat, saveChat } from './storage.ts';
import type { SavedChat } from './model/types.ts';

const chat = (over: Partial<SavedChat> = {}): SavedChat => ({
  conversationId: 'c1',
  open: true,
  savedAt: 1_000,
  messages: [{ id: 'r1', role: 'user', text: 'hi' }],
  ...over,
});

beforeEach(() => sessionStorage.clear());

describe('saved chat storage', () => {
  it('round-trips a chat', () => {
    saveChat(chat());
    expect(loadSavedChat(2_000)).toEqual(chat());
  });

  it('drops a chat older than the service keeps conversations', () => {
    saveChat(chat());
    expect(loadSavedChat(1_000 + SAVED_CHAT_MAX_AGE_MS + 1)).toBeNull();
    expect(sessionStorage.getItem('assistedSearchChat')).toBeNull();
  });

  it('keeps a chat right up to the limit', () => {
    saveChat(chat());
    expect(loadSavedChat(1_000 + SAVED_CHAT_MAX_AGE_MS)).not.toBeNull();
  });

  it.each([
    ['not JSON', '{nope'],
    ['no messages array', JSON.stringify({ savedAt: 1_000, conversationId: null })],
    ['a malformed message', JSON.stringify(chat({ messages: [{ id: 1 } as never] }))],
    ['a bad timestamp', JSON.stringify({ ...chat(), savedAt: 'yesterday' })],
  ])('ignores and removes a saved chat that is %s', (_name, raw) => {
    sessionStorage.setItem('assistedSearchChat', raw);
    expect(loadSavedChat(2_000)).toBeNull();
    expect(sessionStorage.getItem('assistedSearchChat')).toBeNull();
  });

  it('clears', () => {
    saveChat(chat());
    clearSavedChat();
    expect(loadSavedChat(2_000)).toBeNull();
  });

  it('drops a reply’s damaged undo state but keeps the reply, so it can still be fetched', () => {
    const reply = {
      id: 'r1',
      role: 'assistant' as const,
      text: '',
      changed: ['search' as const],
      before: {
        query: { select: [], phenotypicClause: null, genomicFilters: [] },
        facets: {},
        search: '',
      },
      after: {
        query: { select: [], phenotypicClause: null, genomicFilters: [] },
        facets: [],
        search: 'a',
      },
      undone: false,
    };
    saveChat(chat({ messages: [reply as never] }));
    const [loaded] = loadSavedChat(2_000)!.messages;
    expect(loaded).toEqual({ id: 'r1', role: 'assistant', text: '' });
  });

  it('keeps a reply’s undo state when it is intact', () => {
    const screen = {
      query: { select: [], phenotypicClause: null, genomicFilters: [] },
      facets: [],
      search: '',
    };
    const reply = {
      id: 'r1',
      role: 'assistant' as const,
      text: '',
      changed: ['search' as const],
      before: screen,
      after: { ...screen, search: 'a' },
      undone: true,
    };
    saveChat(chat({ messages: [reply] }));
    expect(loadSavedChat(2_000)!.messages[0]).toEqual(reply);
  });
});
