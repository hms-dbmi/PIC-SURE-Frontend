import { changedParts, partsOf, sameScreen } from './model/screen';
import type { ChatMessage, ChatRequest, ChatResponse, SavedChat, ScreenState } from './model/types';

export type ChatStore = {
  /** The saved chat, or null when there is none or it has expired. */
  load: () => SavedChat | null;
  save: (chat: SavedChat) => void;
  clear: () => void;
};

/** Whether the latest change of a reply can be taken back or redone, or the screen has moved on. */
export type UndoState = 'undo' | 'redo' | 'locked';

export type ChatDeps = {
  readScreen: () => ScreenState;
  applyScreen: (parts: Partial<ScreenState>) => Promise<void>;
  send: (request: ChatRequest, signal: AbortSignal) => Promise<ChatResponse>;
  fetchResult: (requestId: string, signal: AbortSignal) => Promise<ChatResponse | undefined>;
  newId: () => string;
  log?: (action: string, details?: Record<string, unknown>) => void;
  store?: ChatStore;
  /** Calls back whenever anything on the researcher's screen may have changed; returns a stop. */
  watch?: (onchange: () => void) => () => void;
  /** How long to wait on a turn before asking for its stored reply instead. */
  patienceMs?: number;
  pollMs?: number;
  maxPolls?: number;
};

const FALLBACK_ERROR = 'The assistant could not answer that. Please try again.';

const statusOf = (e: unknown) => (e as { status?: number } | undefined)?.status;

// api.ts raises an HttpError whose message is the response body as text, and the service's body
// is JSON, so the text to show is one level down.
function messageOf(e: unknown): string {
  let text = (e as { body?: { message?: unknown } } | undefined)?.body?.message;
  if (typeof text === 'string' && text.trimStart().startsWith('{')) {
    try {
      text = (JSON.parse(text) as { message?: unknown }).message;
    } catch {
      // not JSON after all; show it as it is
    }
  }
  return typeof text === 'string' && text ? text : FALLBACK_ERROR;
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });

/**
 * One researcher's chat: the thread, the in-flight turn, and the undo of what a reply changed.
 * The thread is kept in the tab's session storage so a refresh resumes it; `reset()` starts a
 * new conversation.
 */
export class ChatSession {
  messages = $state<ChatMessage[]>([]);
  pending = $state(false);
  open = $state(false);
  /** The compact panel's transcript is short; expanded it takes most of the viewport. */
  tall = $state(false);
  /** Called after a reply or an undo has changed the screen, with the parts that were set. */
  onapply: ((parts: Partial<ScreenState>) => void) | undefined;

  // Bumped when the screen changes, so undo state derived from the live screen re-evaluates.
  #screenVersion = $state(0);
  #conversationId: string | null = null;
  #controller: AbortController | undefined;
  #stopped = false;
  #deps: ChatDeps;

  constructor(deps: ChatDeps) {
    this.#deps = deps;
  }

  /**
   * A reply's change can be undone while the screen is as the reply left it, and redone while it is
   * as the reply found it. Any other edit, by the researcher or a later reply, locks it.
   */
  undoState(id: string): UndoState {
    void this.#screenVersion;
    const reply = this.messages.find((m) => m.id === id && m.role === 'assistant');
    if (!reply?.before || !reply.after) return 'locked';
    const now = this.#deps.readScreen();
    if (reply.undone) return sameScreen(now, reply.before) ? 'redo' : 'locked';
    return sameScreen(now, reply.after) ? 'undo' : 'locked';
  }

  /** Follows the researcher's screen while the panel is showing; returns the stop. */
  watch(): () => void {
    return this.#deps.watch?.(() => this.#screenVersion++) ?? (() => {});
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.#persist();
  }

  /**
   * Brings back the saved thread. Called once the page is up rather than on construction, so the
   * first render matches the server's. A turn that was still being answered is fetched by its
   * requestId, which the service keeps for as long as it keeps the conversation.
   */
  async restore(): Promise<void> {
    if (this.messages.length || this.pending) return;
    const saved = this.#deps.store?.load();
    if (!saved) return;
    this.#conversationId = saved.conversationId;
    this.messages = saved.messages;
    this.open = saved.open;

    const last = this.messages.at(-1);
    if (last?.role === 'user' && !last.stopped) {
      await this.#run(last.id, (signal) => this.#recover(last.id, signal));
    }
  }

  async send(text: string): Promise<void> {
    const message = text.trim();
    if (!message || this.pending) return;

    const requestId = this.#deps.newId();
    this.#conversationId ??= this.#deps.newId();
    const conversationId = this.#conversationId;
    this.messages.push({ id: requestId, role: 'user', text: message });
    this.#persist();
    this.#deps.log?.('chat.send', { requestId, conversationId });

    await this.#run(requestId, (signal) =>
      this.#ask({ message, conversationId, requestId, ...this.#deps.readScreen() }, signal),
    );
  }

  /** Stops waiting for the reply. The service still finishes the turn and keeps its result. */
  stop(): void {
    this.#stopped = true;
    this.#controller?.abort();
  }

  /** Puts the screen back as it was before a reply changed it. */
  async undo(id: string): Promise<void> {
    if (this.undoState(id) !== 'undo') return;
    const reply = this.messages.find((m) => m.id === id && m.role === 'assistant');
    if (!reply?.before) return;
    await this.#deps.applyScreen(reply.before);
    this.onapply?.(reply.before);
    reply.undone = true;
    this.#persist();
    this.#deps.log?.('chat.undo', { requestId: id });
  }

  /** Puts a reply's change back after it was undone. */
  async redo(id: string): Promise<void> {
    if (this.undoState(id) !== 'redo') return;
    const reply = this.messages.find((m) => m.id === id && m.role === 'assistant');
    if (!reply?.after) return;
    await this.#deps.applyScreen(reply.after);
    this.onapply?.(reply.after);
    reply.undone = false;
    this.#persist();
    this.#deps.log?.('chat.redo', { requestId: id });
  }

  reset(): void {
    this.stop();
    this.messages = [];
    this.#conversationId = null;
    this.#persist();
    this.#deps.log?.('chat.reset');
  }

  async #run(
    requestId: string,
    produce: (signal: AbortSignal) => Promise<ChatResponse>,
  ): Promise<void> {
    const controller = new AbortController();
    this.#controller = controller;
    this.#stopped = false;
    this.pending = true;

    try {
      await this.#accept(requestId, await produce(controller.signal));
    } catch (e) {
      if (this.#stopped) {
        const sent = this.messages.findLast((m) => m.id === requestId && m.role === 'user');
        if (sent) sent.stopped = true;
        this.#deps.log?.('chat.stop', { requestId });
      } else {
        this.#deps.log?.('chat.error', { requestId, status: statusOf(e) });
        this.messages.push({ id: requestId, role: 'assistant', text: messageOf(e), failed: true });
      }
    } finally {
      this.pending = false;
      this.#controller = undefined;
      this.#persist();
    }
  }

  async #accept(requestId: string, response: ChatResponse): Promise<void> {
    const current = this.#deps.readScreen();
    const changes = changedParts(response, current);
    const reply: ChatMessage = { id: requestId, role: 'assistant', text: response.response };
    this.#deps.log?.('chat.response', { requestId, changed: partsOf(changes) });

    if (partsOf(changes).length) {
      try {
        await this.#deps.applyScreen(changes);
        this.onapply?.(changes);
        reply.changed = partsOf(changes);
        reply.before = current;
        reply.after = this.#deps.readScreen();
      } catch (e) {
        console.error('Could not apply the assistant’s changes', e);
        reply.applyFailed = true;
      }
    }
    this.messages.push(reply);
  }

  // A closed, empty chat has nothing worth keeping.
  #persist(): void {
    const store = this.#deps.store;
    if (!store) return;
    if (!this.open && !this.messages.length) {
      store.clear();
      return;
    }
    store.save({
      conversationId: this.#conversationId,
      messages: $state.snapshot(this.messages),
      open: this.open,
      savedAt: Date.now(),
    });
  }

  // A slow or dropped request is not a lost one: the service keeps each turn's reply under its
  // requestId, so after the patience window the reply is fetched instead of the turn re-sent.
  async #ask(request: ChatRequest, signal: AbortSignal): Promise<ChatResponse> {
    const { patienceMs = 60_000 } = this.#deps;
    const attempt = new AbortController();
    const relay = () => attempt.abort(signal.reason);
    signal.addEventListener('abort', relay, { once: true });
    const timer = setTimeout(
      () => attempt.abort(new DOMException('patience', 'TimeoutError')),
      patienceMs,
    );
    try {
      return await this.#deps.send(request, attempt.signal);
    } catch (e) {
      const status = statusOf(e);
      const answerable = status === undefined || status === 409;
      if (signal.aborted || !answerable) throw e;
      return await this.#recover(request.requestId, signal);
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', relay);
    }
  }

  async #recover(requestId: string, signal: AbortSignal): Promise<ChatResponse> {
    const { pollMs = 2_000, maxPolls = 30 } = this.#deps;
    for (let i = 0; i < maxPolls; i++) {
      await sleep(pollMs, signal);
      const result = await this.#deps.fetchResult(requestId, signal);
      if (result) return result;
    }
    throw new Error(FALLBACK_ERROR);
  }
}
