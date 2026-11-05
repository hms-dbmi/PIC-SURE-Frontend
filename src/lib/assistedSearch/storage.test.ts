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
});
