import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatSession, type ChatDeps } from '$lib/assistedSearch/chat.svelte';
import type { ChatResponse, SavedChat, ScreenState } from '$lib/assistedSearch/model/types';

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
  it('shows the service’s message, not its JSON body, when the model is unavailable', async () => {
    const body = JSON.stringify({
      errorType: 'model_unavailable',
      message: 'The AI model is currently unavailable. Please try again.',
      requestId: 'abc',
    });
    const { chat } = setup({
      send: vi.fn(async () => {
        throw { status: 503, body: { message: body } };
      }),
    });
    await chat.send('x');
    expect(chat.messages[1]).toMatchObject({
      text: 'The AI model is currently unavailable. Please try again.',
      failed: true,
    });
  });
});

describe('ChatSession persistence', () => {
  const fakeStore = (initial: SavedChat | null = null) => {
    let saved = initial;
    return {
      load: vi.fn(() => saved),
      save: vi.fn((chat: SavedChat) => {
        saved = chat;
      }),
      clear: vi.fn(() => {
        saved = null;
      }),
      current: () => saved,
    };
  };

  it('saves the thread and conversation id after each turn', async () => {
    const store = fakeStore();
    const { chat } = setup({ store });
    await chat.send('hello');
    expect(store.current()).toMatchObject({
      conversationId: 'id-2',
      open: false,
      messages: [
        { role: 'user', text: 'hello' },
        { role: 'assistant', text: 'hello' },
      ],
    });
  });

  it('saves the user message before the reply arrives', async () => {
    const store = fakeStore();
    const { chat } = setup({ store, send: vi.fn(() => new Promise<ChatResponse>(() => {})) });
    void chat.send('slow');
    expect(store.current()?.messages).toMatchObject([{ role: 'user', text: 'slow' }]);
  });

  it('restores the thread, the open state and the same conversation after a refresh', async () => {
    const store = fakeStore();
    const first = setup({ store });
    first.chat.setOpen(true);
    await first.chat.send('one');

    const second = setup({ store });
    await second.chat.restore();
    expect(second.chat.open).toBe(true);
    expect(second.chat.messages.map((m) => m.text)).toEqual(['one', 'hello']);

    await second.chat.send('two');
    const sent = vi.mocked(second.deps.send).mock.calls[0][0];
    expect(sent.conversationId).toBe('id-2');
  });

  it('keeps undo available across a refresh', async () => {
    const store = fakeStore();
    const first = setup({ store, send: vi.fn(async () => ({ response: 'ok', search: 'bmi' })) });
    await first.chat.send('bmi');

    const second = setup({ store });
    await second.chat.restore();
    expect(second.chat.canUndo(second.chat.messages[1].id)).toBe(true);
  });

  it('fetches the reply to a turn that was still running at the refresh', async () => {
    const store = fakeStore({
      conversationId: 'c',
      open: true,
      savedAt: Date.now(),
      messages: [{ id: 'r1', role: 'user', text: 'pending question' }],
    });
    const { chat, deps } = setup({
      store,
      fetchResult: vi.fn(async () => ({ response: 'finished while away' })),
    });
    await chat.restore();
    expect(deps.fetchResult).toHaveBeenCalledWith('r1', expect.any(AbortSignal));
    expect(deps.send).not.toHaveBeenCalled();
    expect(chat.messages.at(-1)).toMatchObject({ role: 'assistant', text: 'finished while away' });
  });

  it('says so when the stored reply is gone', async () => {
    const store = fakeStore({
      conversationId: 'c',
      open: true,
      savedAt: Date.now(),
      messages: [{ id: 'r1', role: 'user', text: 'q' }],
    });
    const { chat } = setup({
      store,
      fetchResult: vi.fn(async () => {
        throw {
          status: 404,
          body: { message: '{"message":"No reply is stored for this message. Send it again."}' },
        };
      }),
    });
    await chat.restore();
    expect(chat.messages.at(-1)).toMatchObject({
      failed: true,
      text: 'No reply is stored for this message. Send it again.',
    });
  });

  it('does not bring back a turn the researcher stopped', async () => {
    const store = fakeStore();
    const first = setup({
      store,
      send: vi.fn((_request, signal: AbortSignal) => {
        return new Promise<ChatResponse>((_, reject) =>
          signal.addEventListener('abort', () => reject(new DOMException('', 'AbortError'))),
        );
      }),
    });
    const sent = first.chat.send('slow');
    first.chat.stop();
    await sent;

    const second = setup({ store });
    await second.chat.restore();
    expect(second.deps.fetchResult).not.toHaveBeenCalled();
    expect(second.chat.messages).toHaveLength(1);
  });

  it('reset clears the saved thread but keeps the chat open', async () => {
    const store = fakeStore();
    const { chat } = setup({ store });
    chat.setOpen(true);
    await chat.send('one');
    chat.reset();
    expect(store.current()).toMatchObject({ open: true, messages: [], conversationId: null });
  });

  it('forgets everything once the chat is closed and empty', async () => {
    const store = fakeStore();
    const { chat } = setup({ store });
    chat.setOpen(true);
    chat.setOpen(false);
    expect(store.clear).toHaveBeenCalled();
    expect(store.current()).toBeNull();
  });

  it('does nothing when nothing was saved', async () => {
    const { chat } = setup({ store: fakeStore() });
    await chat.restore();
    expect(chat.messages).toEqual([]);
  });
});
