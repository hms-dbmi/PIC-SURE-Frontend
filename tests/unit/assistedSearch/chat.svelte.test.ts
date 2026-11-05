import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatSession, type ChatDeps } from '$lib/assistedSearch/chat.svelte';
import type { ChatResponse, ScreenState } from '$lib/assistedSearch/model/types';

const emptyScreen = (): ScreenState => ({
  query: { select: [], phenotypicClause: null, genomicFilters: [] },
  facets: [],
  search: '',
});

function setup(over: Partial<ChatDeps> = {}) {
  let screen = emptyScreen();
  let id = 0;
  const deps: ChatDeps = {
    readScreen: vi.fn(() => screen),
    applyScreen: vi.fn(async (parts: Partial<ScreenState>) => {
      screen = { ...screen, ...parts };
    }),
    send: vi.fn(async () => ({ response: 'hello' }) as ChatResponse),
    fetchResult: vi.fn(async () => undefined),
    newId: () => `id-${++id}`,
    pollMs: 1,
    maxPolls: 3,
    ...over,
  };
  return { chat: new ChatSession(deps), deps, screenNow: () => screen };
}

describe('ChatSession', () => {
  beforeEach(() => vi.useRealTimers());
  afterEach(() => vi.restoreAllMocks());

  it('sends the whole screen with a fresh requestId and one conversationId', async () => {
    const { chat, deps } = setup();
    await chat.send('first');
    await chat.send('second');

    const [a, b] = vi.mocked(deps.send).mock.calls.map(([request]) => request);
    expect(a).toMatchObject({ message: 'first', conversationId: 'id-2', requestId: 'id-1' });
    expect(a).toMatchObject({ query: emptyScreen().query, facets: [], search: '' });
    expect(b.conversationId).toBe('id-2');
    expect(b.requestId).not.toBe(a.requestId);
    expect(chat.messages.map((m) => [m.role, m.text])).toEqual([
      ['user', 'first'],
      ['assistant', 'hello'],
      ['user', 'second'],
      ['assistant', 'hello'],
    ]);
  });

  it('ignores blank messages and sends while one is pending', async () => {
    let finish!: (r: ChatResponse) => void;
    const { chat, deps } = setup({
      send: vi.fn(() => new Promise<ChatResponse>((r) => (finish = r))),
    });
    await chat.send('   ');
    const first = chat.send('one');
    await chat.send('two');
    expect(deps.send).toHaveBeenCalledTimes(1);
    finish({ response: 'done' });
    await first;
    expect(chat.pending).toBe(false);
  });

  it('applies only what changed and keeps the prior screen for undo', async () => {
    const { chat, deps, screenNow } = setup({
      send: vi.fn(async () => ({ response: 'ok', search: 'bmi', facets: [] })),
    });
    await chat.send('find bmi');

    expect(deps.applyScreen).toHaveBeenCalledWith({ search: 'bmi' });
    const reply = chat.messages[1];
    expect(reply.changed).toEqual(['search']);
    expect(chat.canUndo(reply.id)).toBe(true);

    await chat.undo(reply.id);
    expect(screenNow().search).toBe('');
    expect(reply.undone).toBe(true);
    expect(chat.canUndo(reply.id)).toBe(false);
  });

  it('reports what it applied, for a reply and for its undo', async () => {
    const { chat } = setup({ send: vi.fn(async () => ({ response: 'ok', search: 'bmi' })) });
    const onapply = vi.fn();
    chat.onapply = onapply;
    await chat.send('find bmi');
    expect(onapply).toHaveBeenLastCalledWith({ search: 'bmi' });

    await chat.undo(chat.messages[1].id);
    expect(onapply).toHaveBeenLastCalledWith(expect.objectContaining({ search: '' }));
  });

  it('does not report a reply that changed nothing or could not be applied', async () => {
    const same = setup({ send: vi.fn(async () => ({ response: 'ok', search: '' })) });
    same.chat.onapply = vi.fn();
    await same.chat.send('hi');
    expect(same.chat.onapply).not.toHaveBeenCalled();

    const failing = setup({
      send: vi.fn(async () => ({ response: 'ok', search: 'bmi' })),
      applyScreen: vi.fn(async () => {
        throw new Error('nope');
      }),
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    failing.chat.onapply = vi.fn();
    await failing.chat.send('hi');
    expect(failing.chat.onapply).not.toHaveBeenCalled();
  });

  it('gives no undo to a reply that changed nothing', async () => {
    const { chat, deps } = setup({ send: vi.fn(async () => ({ response: 'ok', search: '' })) });
    await chat.send('hi');
    expect(deps.applyScreen).not.toHaveBeenCalled();
    expect(chat.canUndo(chat.messages[1].id)).toBe(false);
  });

  it('allows undoing only the latest change', async () => {
    const replies = [
      { response: 'a', search: 'one' },
      { response: 'b', search: 'two' },
    ];
    const { chat } = setup({ send: vi.fn(async () => replies.shift() as ChatResponse) });
    await chat.send('1');
    await chat.send('2');
    const [, first, , second] = chat.messages;
    expect(chat.canUndo(first.id)).toBe(false);
    expect(chat.canUndo(second.id)).toBe(true);
  });

  it('keeps the reply text and flags it when the changes cannot be applied', async () => {
    const { chat } = setup({
      send: vi.fn(async () => ({ response: 'ok', search: 'bmi' })),
      applyScreen: vi.fn(async () => {
        throw new Error('lookup failed');
      }),
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await chat.send('find bmi');
    expect(chat.messages[1]).toMatchObject({ text: 'ok', applyFailed: true });
    expect(chat.canUndo(chat.messages[1].id)).toBe(false);
  });

  it('shows the service’s message when it refuses a turn', async () => {
    const { chat } = setup({
      send: vi.fn(async () => {
        throw { status: 400, body: { message: 'message must not be blank' } };
      }),
    });
    await chat.send('x');
    expect(chat.messages[1]).toMatchObject({ text: 'message must not be blank', failed: true });
  });

  it('fetches the stored reply after a dropped connection instead of re-sending', async () => {
    const fetchResult = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ response: 'recovered' });
    const { chat, deps } = setup({
      send: vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
      fetchResult,
    });
    await chat.send('hello');
    expect(deps.send).toHaveBeenCalledTimes(1);
    expect(fetchResult).toHaveBeenCalledWith(chat.messages[0].id, expect.any(AbortSignal));
    expect(chat.messages[1].text).toBe('recovered');
  });

  it('gives up with an error when the stored reply never appears', async () => {
    const { chat } = setup({
      send: vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    });
    await chat.send('hello');
    expect(chat.messages[1]).toMatchObject({ failed: true });
  });

  it('treats a still-running 409 as recoverable but not a 400', async () => {
    const conflict = setup({
      send: vi.fn(async () => {
        throw { status: 409, body: { message: 'in progress' } };
      }),
      fetchResult: vi.fn(async () => ({ response: 'finished' })),
    });
    await conflict.chat.send('x');
    expect(conflict.chat.messages[1].text).toBe('finished');

    const refused = setup({
      send: vi.fn(async () => {
        throw { status: 422, body: { message: 'reused' } };
      }),
    });
    await refused.chat.send('x');
    expect(refused.deps.fetchResult).not.toHaveBeenCalled();
  });

  it('switches to the stored reply once the patience window passes', async () => {
    vi.useFakeTimers();
    const { chat } = setup({
      patienceMs: 100,
      send: vi.fn((_request, signal: AbortSignal) => {
        return new Promise<ChatResponse>((_, reject) =>
          signal.addEventListener('abort', () => reject(new DOMException('', 'AbortError'))),
        );
      }),
      fetchResult: vi.fn(async () => ({ response: 'late' })),
    });
    const sent = chat.send('slow');
    await vi.advanceTimersByTimeAsync(200);
    await sent;
    expect(chat.messages[1].text).toBe('late');
  });

  it('adds no error message when the researcher stops the turn', async () => {
    const { chat } = setup({
      send: vi.fn((_request, signal: AbortSignal) => {
        return new Promise<ChatResponse>((_, reject) =>
          signal.addEventListener('abort', () => reject(new DOMException('', 'AbortError'))),
        );
      }),
    });
    const sent = chat.send('slow');
    chat.stop();
    await sent;
    expect(chat.messages).toHaveLength(1);
    expect(chat.pending).toBe(false);
  });

  it('reset starts a new conversation', async () => {
    const { chat, deps } = setup();
    await chat.send('one');
    chat.reset();
    expect(chat.messages).toEqual([]);
    await chat.send('two');
    const ids = vi.mocked(deps.send).mock.calls.map(([r]) => r.conversationId);
    expect(ids[0]).not.toBe(ids[1]);
  });
});
