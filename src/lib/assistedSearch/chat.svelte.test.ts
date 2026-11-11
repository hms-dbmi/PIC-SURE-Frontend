import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatSession, FALLBACK_ERROR, TIMEOUT_ERROR, type ChatDeps } from './chat.svelte.ts';
import type { ChatResponse, SavedChat, ScreenState } from './model/types.ts';

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
    expect(chat.undoState(reply.id)).toBe('undo');

    await chat.undo(reply.id);
    expect(screenNow().search).toBe('');
    expect(reply.undone).toBe(true);
    expect(chat.undoState(reply.id)).toBe('redo');

    await chat.redo(reply.id);
    expect(screenNow().search).toBe('bmi');
    expect(reply.undone).toBe(false);
    expect(chat.undoState(reply.id)).toBe('undo');
  });

  it('locks undo and redo once the screen is changed by anyone else', async () => {
    let screen = emptyScreen();
    const { chat } = setup({
      readScreen: () => screen,
      applyScreen: async (parts) => {
        screen = { ...screen, ...parts };
      },
      send: vi.fn(async () => ({ response: 'ok', search: 'bmi' })),
    });
    await chat.send('find bmi');
    const reply = chat.messages[1];

    screen = { ...screen, search: 'bmi age' };
    expect(chat.undoState(reply.id)).toBe('locked');
    await chat.undo(reply.id);
    expect(screen.search).toBe('bmi age');
    expect(reply.undone).toBeUndefined();

    screen = { ...screen, search: 'bmi' };
    await chat.undo(reply.id);
    screen = { ...screen, search: 'other' };
    expect(chat.undoState(reply.id)).toBe('locked');
  });

  it('re-reads undo state when the watched screen changes', async () => {
    let notify = () => {};
    const stop = vi.fn();
    const { chat } = setup({
      watch: (onchange) => {
        notify = onchange;
        return stop;
      },
    });
    expect(chat.watch()).toBe(stop);
    notify();
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
    expect(chat.undoState(chat.messages[1].id)).toBe('locked');
  });

  it('allows undoing only the latest change, since a later one moves the screen on', async () => {
    const replies = [
      { response: 'a', search: 'one' },
      { response: 'b', search: 'two' },
    ];
    const { chat } = setup({ send: vi.fn(async () => replies.shift() as ChatResponse) });
    await chat.send('1');
    await chat.send('2');
    const [, first, , second] = chat.messages;
    expect(chat.undoState(first.id)).toBe('locked');
    expect(chat.undoState(second.id)).toBe('undo');
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
    expect(chat.undoState(chat.messages[1].id)).toBe('locked');
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
    expect(chat.messages[1]).toMatchObject({ text: TIMEOUT_ERROR, failed: true });
    expect(chat.pending).toBe(false);
    expect(chat.recovering).toBe(false);
  });

  it('says plainly that it could not answer when a failure carries no message', async () => {
    const { chat } = setup({
      send: vi.fn(async () => {
        throw { status: 500 };
      }),
    });
    await chat.send('hello');
    expect(chat.messages[1]).toMatchObject({ text: FALLBACK_ERROR, failed: true });
    expect(chat.pending).toBe(false);
  });

  it('error messages point to sending again, not to a retry control', () => {
    for (const text of [FALLBACK_ERROR, TIMEOUT_ERROR]) {
      expect(text).toMatch(/send your message again/);
      expect(text).not.toMatch(/retry|try again|click|button/i);
    }
  });

  it('marks the turn as recovering only while the stored reply is fetched', async () => {
    let seen: boolean | undefined;
    const { chat } = setup({
      send: vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
      fetchResult: vi.fn(async () => {
        seen = chat.recovering;
        return { response: 'recovered' };
      }),
    });
    expect(chat.recovering).toBe(false);
    await chat.send('hello');
    expect(seen).toBe(true);
    expect(chat.recovering).toBe(false);
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

  it('reset clears the thread, any error and the pending turn, and stops that turn', async () => {
    let aborted = false;
    let calls = 0;
    const { chat, deps } = setup({
      send: vi.fn((_request, signal: AbortSignal) => {
        if (++calls === 1) return Promise.reject({ status: 400, body: { message: 'refused' } });
        return new Promise<ChatResponse>((_, reject) =>
          signal.addEventListener('abort', () => {
            aborted = true;
            reject(new DOMException('', 'AbortError'));
          }),
        );
      }),
    });
    chat.setOpen(true);
    await chat.send('first');
    expect(chat.messages[1]).toMatchObject({ failed: true });
    const pending = chat.send('second');
    expect(chat.pending).toBe(true);

    chat.reset();
    expect(aborted).toBe(true);
    expect(chat.messages).toEqual([]);
    expect(chat.pending).toBe(false);
    expect(chat.recovering).toBe(false);
    expect(chat.open).toBe(true);

    await pending;
    // The stopped turn leaves nothing behind in the new conversation.
    expect(chat.messages).toEqual([]);
    expect(chat.pending).toBe(false);
    const third = chat.send('third');
    chat.stop();
    await third;
    const ids = vi.mocked(deps.send).mock.calls.map(([r]) => r.conversationId);
    expect(ids[2]).not.toBe(ids[0]);
  });

  it('closing or collapsing the panel keeps the conversation', async () => {
    const { chat, deps } = setup();
    chat.setOpen(true);
    await chat.send('one');
    chat.tall = true;
    chat.tall = false;
    chat.setOpen(false);
    expect(chat.messages).toHaveLength(2);
    chat.setOpen(true);
    await chat.send('two');
    expect(chat.messages).toHaveLength(4);
    const ids = vi.mocked(deps.send).mock.calls.map(([r]) => r.conversationId);
    expect(ids[1]).toBe(ids[0]);
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

    const second = setup({ store, readScreen: () => ({ ...emptyScreen(), search: 'bmi' }) });
    await second.chat.restore();
    expect(second.chat.undoState(second.chat.messages[1].id)).toBe('undo');
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

describe('ChatSession recovery never runs a turn twice', () => {
  beforeEach(() => vi.useRealTimers());
  afterEach(() => vi.useRealTimers());

  const dropped = () =>
    vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });

  it('keeps polling one requestId while the turn runs (GET 202) and sends it once', async () => {
    const fetchResult = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ response: 'done', search: 'bmi' });
    const { chat, deps } = setup({ send: dropped(), fetchResult, maxPolls: 5 });
    await chat.send('hello');

    expect(deps.send).toHaveBeenCalledTimes(1);
    expect(fetchResult).toHaveBeenCalledTimes(3);
    const ids = new Set(fetchResult.mock.calls.map(([id]) => id));
    expect([...ids]).toEqual([vi.mocked(deps.send).mock.calls[0][0].requestId]);
    expect(deps.applyScreen).toHaveBeenCalledTimes(1);
    expect(chat.messages.filter((m) => m.role === 'assistant')).toHaveLength(1);
  });

  it('after a 409 on the POST, only polls for the stored reply', async () => {
    const { chat, deps } = setup({
      send: vi.fn(async () => {
        throw { status: 409, body: { message: 'in progress' } };
      }),
      fetchResult: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValue({ response: 'ok' }),
    });
    await chat.send('x');
    expect(deps.send).toHaveBeenCalledTimes(1);
    expect(chat.messages.map((m) => m.role)).toEqual(['user', 'assistant']);
  });

  it('does not re-send after the polling budget runs out', async () => {
    const { chat, deps } = setup({ send: dropped(), maxPolls: 3 });
    await chat.send('x');
    expect(deps.send).toHaveBeenCalledTimes(1);
    expect(deps.fetchResult).toHaveBeenCalledTimes(3);
    expect(chat.messages[1]).toMatchObject({ failed: true, text: TIMEOUT_ERROR });
  });

  it('keeps polling through transient poll failures and stops on a final one', async () => {
    const transient = setup({
      send: dropped(),
      fetchResult: vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce({ status: 503 })
        .mockResolvedValueOnce({ response: 'found' }),
    });
    await transient.chat.send('x');
    expect(transient.chat.messages[1].text).toBe('found');
    expect(transient.deps.send).toHaveBeenCalledTimes(1);

    const final = setup({
      send: dropped(),
      fetchResult: vi.fn().mockRejectedValue({ status: 404, body: { message: 'gone' } }),
    });
    await final.chat.send('x');
    expect(final.deps.fetchResult).toHaveBeenCalledTimes(1);
    expect(final.chat.messages[1]).toMatchObject({ failed: true, text: 'gone' });
  });

  it('ignores a new message while the stored reply is awaited', async () => {
    let found!: (r: ChatResponse) => void;
    const { chat, deps } = setup({
      send: dropped(),
      fetchResult: vi.fn(() => new Promise<ChatResponse>((r) => (found = r))),
    });
    const first = chat.send('one');
    await vi.waitFor(() => expect(chat.recovering).toBe(true));
    await vi.waitFor(() => expect(deps.fetchResult).toHaveBeenCalled());
    await chat.send('two');
    expect(chat.messages).toHaveLength(1);
    expect(deps.send).toHaveBeenCalledTimes(1);

    found({ response: 'answer' });
    await first;
    expect(chat.messages.map((m) => m.text)).toEqual(['one', 'answer']);
  });

  it('does not double up when the patience window passes and the late POST also fails', async () => {
    vi.useFakeTimers();
    const { chat, deps } = setup({
      patienceMs: 100,
      send: vi.fn(
        (_request, signal: AbortSignal) =>
          new Promise<ChatResponse>((_, reject) =>
            signal.addEventListener('abort', () => reject(new DOMException('', 'AbortError'))),
          ),
      ),
      fetchResult: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValue({ response: 'late' }),
    });
    const sent = chat.send('slow');
    await vi.advanceTimersByTimeAsync(1000);
    await sent;
    expect(deps.send).toHaveBeenCalledTimes(1);
    expect(chat.messages.map((m) => m.text)).toEqual(['slow', 'late']);
  });

  describe('after a refresh', () => {
    const stored = (): SavedChat => ({
      conversationId: 'c',
      open: true,
      savedAt: Date.now(),
      messages: [{ id: 'r1', role: 'user', text: 'q' }],
    });
    const store = () => {
      let saved: SavedChat | null = stored();
      return {
        load: vi.fn(() => saved),
        save: vi.fn((c: SavedChat) => (saved = c)),
        clear: vi.fn(() => (saved = null)),
      };
    };

    it('recovers a running turn once even if restore is called twice', async () => {
      let found!: (r: ChatResponse) => void;
      const { chat, deps } = setup({
        store: store(),
        fetchResult: vi.fn(() => new Promise<ChatResponse>((r) => (found = r))),
      });
      const a = chat.restore();
      const b = chat.restore();
      await vi.waitFor(() => expect(deps.fetchResult).toHaveBeenCalledTimes(1));
      found({ response: 'ok' });
      await Promise.all([a, b]);

      expect(deps.send).not.toHaveBeenCalled();
      expect(deps.fetchResult).toHaveBeenCalledTimes(1);
      expect(chat.messages.map((m) => m.role)).toEqual(['user', 'assistant']);
    });

    it('does not recover again once the reply is in, and never re-sends', async () => {
      const s = store();
      const first = setup({ store: s, fetchResult: vi.fn(async () => ({ response: 'ok' })) });
      await first.chat.restore();

      const second = setup({ store: s });
      await second.chat.restore();
      expect(second.deps.fetchResult).not.toHaveBeenCalled();
      expect(second.deps.send).not.toHaveBeenCalled();
      expect(second.chat.messages).toHaveLength(2);
    });

    it('does not recover a failed turn after a timeout', async () => {
      const s = store();
      const first = setup({ store: s, maxPolls: 1 });
      await first.chat.restore();
      expect(first.chat.messages[1]).toMatchObject({ failed: true });

      const second = setup({ store: s });
      await second.chat.restore();
      expect(second.deps.fetchResult).not.toHaveBeenCalled();
    });
  });
});
