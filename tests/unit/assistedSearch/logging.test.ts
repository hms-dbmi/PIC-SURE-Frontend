// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { writable } = require('svelte/store') as typeof import('svelte/store');
  return { user: writable({}), fetch: vi.fn() };
});

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/stores/User', () => ({
  user: mocks.user,
  isUserLoggedIn: () => true,
}));

import { createLog, log } from '$lib/logger';
import { ChatSession, type ChatDeps } from '$lib/assistedSearch/chat.svelte';
import type { LogEvent } from '$lib/models/Log';
import type { ChatResponse, ScreenState } from '$lib/assistedSearch/model/types';

const USER_TEXT = 'my secret question about diabetes';
const REPLY_TEXT = 'a confidential reply about cohorts';
const ERROR_TEXT = 'the service refused with a private explanation';

const emptyScreen = (): ScreenState => ({
  query: { select: [], phenotypicClause: null, genomicFilters: [] },
  facets: [],
  search: '',
});

// The same wiring session.ts uses, but over the real logger so the whole payload is inspected.
function setup(send: ChatDeps['send']) {
  let screen = emptyScreen();
  let id = 0;
  const chat = new ChatSession({
    readScreen: () => screen,
    applyScreen: async (parts) => {
      screen = { ...screen, ...parts };
    },
    send,
    fetchResult: async () => undefined,
    newId: () => `id-${++id}`,
    log: (action, details) => log(createLog('CHAT', action, details)),
    pollMs: 1,
    maxPolls: 2,
  });
  return chat;
}

const sent = (): LogEvent[] =>
  mocks.fetch.mock.calls.map(([, init]) => JSON.parse(init.body as string) as LogEvent);

describe('chat logging', () => {
  beforeEach(() => {
    mocks.fetch.mockReset();
    mocks.fetch.mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mocks.fetch);
    sessionStorage.clear();
  });

  it('logs every event under the CHAT category, with the actions of the whole lifecycle', async () => {
    const replies: (ChatResponse | Error)[] = [
      { response: REPLY_TEXT, search: 'diabetes' },
      Object.assign(new Error('boom'), { status: 500, body: { message: ERROR_TEXT } }),
    ];
    const chat = setup(async () => {
      const next = replies.shift()!;
      if (next instanceof Error) throw next;
      return next;
    });

    await chat.send(USER_TEXT);
    const reply = chat.messages[1].id;
    await chat.undo(reply);
    await chat.redo(reply);
    await chat.send(USER_TEXT);
    chat.reset();

    // Stopped turn
    const slow = setup(
      (_request, signal) =>
        new Promise<ChatResponse>((_, reject) =>
          signal.addEventListener('abort', () => reject(new Error('aborted'))),
        ),
    );
    const pending = slow.send(USER_TEXT);
    slow.stop();
    await pending;

    const events = sent();
    expect(new Set(events.map((e) => e.event_type))).toEqual(new Set(['CHAT']));
    expect(events.map((e) => e.action)).toEqual([
      'chat.send',
      'chat.response',
      'chat.undo',
      'chat.redo',
      'chat.send',
      'chat.error',
      'chat.reset',
      'chat.send',
      'chat.stop',
    ]);
  });

  it('never puts what the researcher typed, what the assistant said, or the error text in a payload', async () => {
    const replies: (ChatResponse | Error)[] = [
      { response: REPLY_TEXT, search: 'diabetes' },
      Object.assign(new Error(ERROR_TEXT), { status: 500, body: { message: ERROR_TEXT } }),
    ];
    const chat = setup(async () => {
      const next = replies.shift()!;
      if (next instanceof Error) throw next;
      return next;
    });

    await chat.send(USER_TEXT);
    await chat.undo(chat.messages[1].id);
    await chat.send(USER_TEXT);
    chat.reset();

    const bodies = mocks.fetch.mock.calls.map(([, init]) => init.body as string);
    expect(bodies.length).toBeGreaterThanOrEqual(5);
    for (const body of bodies) {
      for (const secret of [USER_TEXT, REPLY_TEXT, ERROR_TEXT, 'diabetes']) {
        expect(body).not.toContain(secret);
      }
    }
  });

  it('records only ids, counts and the names of the parts a reply changed', async () => {
    const chat = setup(async () => ({ response: REPLY_TEXT, search: 'diabetes' }));
    await chat.send(USER_TEXT);

    const [send, response] = sent();
    expect(send.metadata).toEqual({ requestId: 'id-1', conversationId: 'id-2' });
    expect(response.metadata).toEqual({ requestId: 'id-1', changed: ['search'] });
  });
});
