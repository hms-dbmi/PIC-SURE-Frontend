import { changedParts, partsOf } from './model/screen';
import type { ChatMessage, ChatRequest, ChatResponse, ScreenState } from './model/types';

export type ChatDeps = {
  readScreen: () => ScreenState;
  applyScreen: (parts: Partial<ScreenState>) => Promise<void>;
  send: (request: ChatRequest, signal: AbortSignal) => Promise<ChatResponse>;
  fetchResult: (requestId: string, signal: AbortSignal) => Promise<ChatResponse | undefined>;
  newId: () => string;
  log?: (action: string, details?: Record<string, unknown>) => void;
  /** How long to wait on a turn before asking for its stored reply instead. */
  patienceMs?: number;
  pollMs?: number;
  maxPolls?: number;
};

const FALLBACK_ERROR = 'The assistant could not answer that. Please try again.';

const statusOf = (e: unknown) => (e as { status?: number } | undefined)?.status;

function messageOf(e: unknown): string {
  const body = (e as { body?: { message?: unknown } } | undefined)?.body;
  return typeof body?.message === 'string' && body.message ? body.message : FALLBACK_ERROR;
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
 * Lives in memory only, like the service's copy of it; `reset()` starts a new conversation.
 */
export class ChatSession {
  messages = $state<ChatMessage[]>([]);
  pending = $state(false);
  open = $state(false);
  fullScreen = $state(false);
  /** Called after a reply or an undo has changed the screen, with the parts that were set. */
  onapply: ((parts: Partial<ScreenState>) => void) | undefined;

  #conversationId: string | null = null;
  #controller: AbortController | undefined;
  #stopped = false;
  #deps: ChatDeps;

  constructor(deps: ChatDeps) {
    this.#deps = deps;
  }

  /** Only the latest change can be undone; an older one would also undo what came after it. */
  canUndo(id: string): boolean {
    const latest = this.messages.findLast((m) => m.before);
    return latest?.id === id && latest.role === 'assistant';
  }

  async send(text: string): Promise<void> {
    const message = text.trim();
    if (!message || this.pending) return;

    const requestId = this.#deps.newId();
    this.#conversationId ??= this.#deps.newId();
    const controller = new AbortController();
    this.#controller = controller;
    this.#stopped = false;
    this.messages.push({ id: requestId, role: 'user', text: message });
    this.pending = true;
    this.#deps.log?.('chat.send', { requestId, conversationId: this.#conversationId });

    try {
      const response = await this.#ask(
        { message, conversationId: this.#conversationId, requestId, ...this.#deps.readScreen() },
        controller.signal,
      );
      await this.#accept(requestId, response);
    } catch (e) {
      if (this.#stopped) {
        this.#deps.log?.('chat.stop', { requestId });
      } else {
        this.#deps.log?.('chat.error', { requestId, status: statusOf(e) });
        this.messages.push({ id: requestId, role: 'assistant', text: messageOf(e), failed: true });
      }
    } finally {
      this.pending = false;
      this.#controller = undefined;
    }
  }

  /** Stops waiting for the reply. The service still finishes the turn and keeps its result. */
  stop(): void {
    this.#stopped = true;
    this.#controller?.abort();
  }

  /** Puts the screen back as it was before a reply changed it. */
  async undo(id: string): Promise<void> {
    if (!this.canUndo(id)) return;
    const reply = this.messages.findLast((m) => m.id === id && m.role === 'assistant');
    if (!reply?.before) return;
    await this.#deps.applyScreen(reply.before);
    this.onapply?.(reply.before);
    reply.before = undefined;
    reply.undone = true;
    this.#deps.log?.('chat.undo', { requestId: id });
  }

  reset(): void {
    this.stop();
    this.messages = [];
    this.#conversationId = null;
    this.#deps.log?.('chat.reset');
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
      } catch (e) {
        console.error('Could not apply the assistant’s changes', e);
        reply.applyFailed = true;
      }
    }
    this.messages.push(reply);
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
