import { changedParts, partsOf, pickParts, sameParts } from './model/screen.ts';
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  SavedChat,
  ScreenPart,
  ScreenState,
} from './model/types.ts';

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
  /** `stillWanted` is asked just before the first write; when it says no, nothing is written. */
  applyScreen: (parts: Partial<ScreenState>, stillWanted?: () => boolean) => Promise<void>;
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

// Recovery is automatic (the stored reply is fetched by requestId), so there is no retry button;
// what is left to the researcher is sending the message again.
export const FALLBACK_ERROR =
  'Sorry, the assistant could not answer that. You can send your message again, or put it another way.';
export const TIMEOUT_ERROR =
  'Sorry, the assistant took too long to answer. You can send your message again, or come back to it later.';

export const REPLY_UNAVAILABLE =
  'This reply is no longer available. The service only keeps a conversation for a short while.';
export const REPLY_NOT_LOADED = 'This reply could not be loaded. Refresh the page to try again.';

// The only prose that may be saved: ours, never the model's or the service's.
const SAVED_ERRORS = new Set([FALLBACK_ERROR, TIMEOUT_ERROR, REPLY_UNAVAILABLE]);

// A reply is saved as booleans, numbers and the validated query and facets only; its text and
// notice come back from the service. A failed turn keeps its message only when it is one of ours.
const forStorage = (m: ChatMessage): ChatMessage => {
  if (m.role !== 'assistant') return m;
  const saved = { ...m, text: '' };
  delete saved.notice;
  delete saved.unloaded;
  delete saved.loading;
  if (m.failed) {
    saved.text = SAVED_ERRORS.has(m.text) ? m.text : FALLBACK_ERROR;
    for (const key of ['changed', 'before', 'after', 'undone', 'applyFailed'] as const) {
      delete saved[key];
    }
  }
  return saved;
};

/** Raised when the stored reply never turned up within the polling budget. */
class TurnTimedOut extends Error {
  constructor() {
    super(TIMEOUT_ERROR);
  }
}

const statusOf = (e: unknown) => (e as { status?: number } | undefined)?.status;

// A dropped connection, a conflict, or a gateway giving up on a slow turn says nothing about the
// turn itself, which the service may still finish and keep under its requestId. A 5xx that carries
// the service's own message is its answer, not the gateway's, and is final.
const isTransient = (e: unknown) => {
  const status = statusOf(e);
  if (status === undefined || status === 408 || status === 409) return true;
  const answered = Boolean((e as { body?: { message?: unknown } } | undefined)?.body?.message);
  return [502, 503, 504].includes(status) && !answered;
};

// An ApiError carries the parsed response as `body`, but its `message` may itself be the service's
// JSON error as text, so the text to show can be one level down.
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
    if (signal.aborted) return reject(signal.reason);
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
 * new conversation. The assistant's prose (reply text, notice, error text) is never stored: a
 * refresh fetches each reply back from the service by its requestId. Only the validated query and
 * facets of a reply and its flags are kept.
 */
export class ChatSession {
  messages = $state<ChatMessage[]>([]);
  pending = $state(false);
  /** The turn's own request gave up and the stored reply is being fetched by its requestId. */
  recovering = $state(false);
  open = $state(false);
  /** The compact panel's transcript is short; expanded it takes most of the viewport. */
  tall = $state(false);
  /** Called after a reply or an undo has changed the screen, with the parts that were set. */
  onapply: ((parts: Partial<ScreenState>) => void) | undefined;

  // Bumped when the screen changes, so undo state derived from the live screen re-evaluates.
  #screenVersion = $state(0);
  #conversationId: string | null = null;
  // Bumped by reset(), so a turn from the old conversation can tell it must not touch the new one.
  #epoch = 0;
  /** When the thread last had contact with the service; the save's age counts from here. */
  #savedAt = 0;
  #controller: AbortController | undefined;
  #deps: ChatDeps;

  constructor(deps: ChatDeps) {
    this.#deps = deps;
  }

  /**
   * A reply's change can be undone while the parts it changed are as the reply left them, and redone
   * while they are as the reply found them. Any other edit to those parts, by the researcher or a
   * later reply, locks it; edits to the rest of the screen are the researcher's own.
   */
  undoState(id: string): UndoState {
    void this.#screenVersion;
    const reply = this.messages.find((m) => m.id === id && m.role === 'assistant');
    if (!reply?.before || !reply.after || !reply.changed) return 'locked';
    const now = this.#deps.readScreen();
    if (reply.undone) return sameParts(now, reply.before, reply.changed) ? 'redo' : 'locked';
    return sameParts(now, reply.after, reply.changed) ? 'undo' : 'locked';
  }

  /** Follows the researcher's screen while the panel is showing; returns the stop. */
  watch(): () => void {
    return this.#deps.watch?.(() => this.#screenVersion++) ?? (() => {});
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.#persist(false);
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
    // Through the same filter as a save, so what an older save kept is not shown or saved again.
    this.messages = saved.messages.map(forStorage);
    this.open = saved.open;
    this.#savedAt = saved.savedAt;
    for (const m of this.messages) if (m.role === 'assistant' && !m.failed) m.loading = true;

    const epoch = this.#epoch;
    const refilled = await this.#refill();
    if (epoch !== this.#epoch) return;

    const last = this.messages.at(-1);
    if (!refilled && last?.role === 'user') last.stopped = true;
    // Rewrites an older save without what it kept; a refresh keeps the save's age.
    this.#persist(false);
    if (last?.role === 'user' && !last.stopped) {
      await this.#run(last.id, (signal) => this.#recover(last.id, signal));
    }
  }

  // Replies are saved without their text or notice; this fetches them back, and the chat waits (as
  // for any turn) until they are all in. Only a 404 marks a reply unavailable for good. A reply that
  // could not be fetched (offline, stopped) is not saved as failed, so the next refresh tries it
  // again. False when stopped.
  async #refill(): Promise<boolean> {
    const replies = this.messages.filter((m) => m.role === 'assistant' && !m.failed);
    if (!replies.length) return true;
    const controller = new AbortController();
    this.#controller = controller;
    this.pending = true;
    try {
      await Promise.all(
        replies.map(async (reply) => {
          try {
            const result = await this.#fetchReply(reply.id, controller.signal);
            if (result) {
              reply.text = result.response;
              if (result.notice) reply.notice = result.notice;
              else delete reply.notice;
            } else {
              reply.text = REPLY_NOT_LOADED;
              reply.unloaded = true;
            }
          } catch (e) {
            if (statusOf(e) === 404 && !controller.signal.aborted) {
              reply.text = REPLY_UNAVAILABLE;
              reply.failed = true;
              for (const key of [
                'notice',
                'changed',
                'before',
                'after',
                'undone',
                'applyFailed',
              ] as const) {
                delete reply[key];
              }
            } else {
              reply.text = REPLY_NOT_LOADED;
              reply.unloaded = true;
            }
          } finally {
            delete reply.loading;
          }
        }),
      );
      return !controller.signal.aborted;
    } finally {
      if (this.#controller === controller) {
        this.pending = false;
        this.#controller = undefined;
      }
    }
  }

  // One fetch of a saved reply, with the patience a turn gets and one more try after a transient
  // failure, so a blip does not turn a whole thread into errors and a hung request cannot hold it.
  async #fetchReply(requestId: string, signal: AbortSignal): Promise<ChatResponse | undefined> {
    const { patienceMs = 60_000, pollMs = 2_000 } = this.#deps;
    for (let attempt = 0; ; attempt++) {
      signal.throwIfAborted();
      try {
        return await this.#fetchWithin(requestId, signal, patienceMs);
      } catch (e) {
        if (signal.aborted || attempt >= 1 || !isTransient(e)) throw e;
      }
      await sleep(pollMs, signal);
    }
  }

  // One fetch that is given up on after `ms` (as a transient failure) or when `signal` aborts.
  async #fetchWithin(
    requestId: string,
    signal: AbortSignal,
    ms: number,
  ): Promise<ChatResponse | undefined> {
    const bound = new AbortController();
    const relay = () => bound.abort(signal.reason);
    signal.addEventListener('abort', relay, { once: true });
    const timer = setTimeout(() => bound.abort(new DOMException('patience', 'TimeoutError')), ms);
    try {
      return await this.#deps.fetchResult(requestId, bound.signal);
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', relay);
    }
  }

  async send(text: string): Promise<void> {
    const message = text.trim();
    if (!message || this.pending) return;

    const requestId = this.#deps.newId();
    this.#conversationId ??= this.#deps.newId();
    const conversationId = this.#conversationId;
    this.messages.push({ id: requestId, role: 'user', text: message });
    // Saved so a refresh can recover the turn, but nothing has reached the service yet.
    this.#persist(false);
    this.#deps.log?.('chat.send', { requestId, conversationId });

    await this.#run(requestId, (signal) =>
      this.#ask({ message, conversationId, requestId, ...this.#deps.readScreen() }, signal),
    );
  }

  /** Stops waiting for the reply. The service still finishes the turn and keeps its result. */
  stop(): void {
    this.#controller?.abort();
  }

  /** Puts the screen back as it was before a reply changed it. */
  async undo(id: string): Promise<void> {
    if (this.undoState(id) !== 'undo') return;
    const reply = this.messages.find((m) => m.id === id && m.role === 'assistant');
    if (!reply?.before || !reply.changed) return;
    const parts = pickParts(reply.before, reply.changed);
    if (!(await this.#reapply(reply, parts, 'undo', 'chat.undo.error'))) return;
    reply.undone = true;
    this.#persist(false);
    this.#deps.log?.('chat.undo', { requestId: id });
  }

  /** Puts a reply's change back after it was undone. */
  async redo(id: string): Promise<void> {
    if (this.undoState(id) !== 'redo') return;
    const reply = this.messages.find((m) => m.id === id && m.role === 'assistant');
    if (!reply?.after || !reply.changed) return;
    const parts = pickParts(reply.after, reply.changed);
    if (!(await this.#reapply(reply, parts, 'redo', 'chat.redo.error'))) return;
    reply.undone = false;
    this.#persist(false);
    this.#deps.log?.('chat.redo', { requestId: id });
  }

  // Puts back only the parts the reply changed, so the researcher's other edits stay. The concept
  // lookup takes a moment; if the screen moved on or the chat was reset meanwhile (the reply is no
  // longer in the state it was asked in), nothing is written and the reply is left as it was.
  // False when nothing was set, or when the screen could not be set (a concept that was selected
  // can no longer be found, say); the reply then says so.
  async #reapply(
    reply: ChatMessage,
    parts: Partial<ScreenState>,
    expected: UndoState,
    errorAction: string,
  ): Promise<boolean> {
    let declined = false;
    const stillWanted = () => !(declined = this.undoState(reply.id) !== expected);
    try {
      await this.#deps.applyScreen(parts, stillWanted);
      if (declined) return false;
    } catch (e) {
      console.error('Could not put the screen back', e);
      this.#deps.log?.(errorAction, { requestId: reply.id });
      reply.applyFailed = true;
      return false;
    }
    reply.applyFailed = false;
    this.onapply?.(parts);
    return true;
  }

  reset(): void {
    const hadConversation = this.messages.length > 0;
    this.#epoch++;
    this.stop();
    // The aborted turn's cleanup runs later; don't make the next message wait for it.
    this.pending = false;
    this.recovering = false;
    this.messages = [];
    this.#conversationId = null;
    this.#persist();
    // On logout the token is already gone, so a log request for an empty chat would only fail.
    if (hadConversation) this.#deps.log?.('chat.reset');
  }

  async #run(
    requestId: string,
    produce: (signal: AbortSignal) => Promise<ChatResponse>,
  ): Promise<void> {
    const controller = new AbortController();
    const epoch = this.#epoch;
    this.#controller = controller;
    this.pending = true;
    // Whether the service answered, even with an error: only then does its conversation live on.
    let contacted = false;

    try {
      const response = await produce(controller.signal);
      contacted = true;
      // Stop wins over a reply that arrived in the same moment. Once the changes are being applied
      // it is too late: the screen is set, so the reply is shown with its undo.
      controller.signal.throwIfAborted();
      await this.#accept(requestId, response, epoch);
    } catch (e) {
      if (epoch !== this.#epoch) return;
      if (controller.signal.aborted) {
        const sent = this.messages.findLast((m) => m.id === requestId && m.role === 'user');
        if (sent) sent.stopped = true;
        this.#deps.log?.('chat.stop', { requestId });
      } else {
        contacted = statusOf(e) !== undefined;
        const timedOut = e instanceof TurnTimedOut;
        this.#deps.log?.('chat.error', { requestId, status: statusOf(e), timedOut });
        const text = timedOut ? TIMEOUT_ERROR : messageOf(e);
        this.messages.push({ id: requestId, role: 'assistant', text, failed: true });
      }
    } finally {
      // After a reset a newer turn may own these.
      if (this.#controller === controller) {
        this.pending = false;
        this.recovering = false;
        this.#controller = undefined;
      }
      this.#persist(contacted && epoch === this.#epoch);
    }
  }

  async #accept(requestId: string, response: ChatResponse, epoch: number): Promise<void> {
    if (epoch !== this.#epoch) return;
    const current = this.#deps.readScreen();
    const changes = changedParts(response, current);
    const reply: ChatMessage = { id: requestId, role: 'assistant', text: response.response };
    if (response.notice) reply.notice = response.notice;
    this.#deps.log?.('chat.response', { requestId, changed: partsOf(changes) });

    if (partsOf(changes).length) {
      // The concept lookup is slow enough for a reset to land first; the new conversation's screen
      // is then not the one these changes were made for, so nothing is written.
      const stillWanted = () => epoch === this.#epoch;
      try {
        await this.#deps.applyScreen(changes, stillWanted);
        if (!stillWanted()) return;
        this.onapply?.(changes);
        reply.changed = partsOf(changes);
        reply.before = current;
        reply.after = this.#deps.readScreen();
      } catch (e) {
        console.error('Could not apply the assistant’s changes', e);
        if (!stillWanted()) return;
        reply.applyFailed = true;
        // Only the parts that were set before the failure can be taken back; none when it failed
        // while preparing, whatever the researcher has changed meanwhile.
        const committed = (e as { committed?: ScreenPart[] }).committed ?? [];
        if (committed.length) {
          reply.changed = committed;
          reply.before = current;
          reply.after = this.#deps.readScreen();
        }
      }
    }
    this.messages.push(reply);
  }

  // A closed, empty chat has nothing worth keeping.
  // Only contact with the service moves the save's age: opening the panel or a refresh does not
  // keep a thread alive past the conversation the service holds for it.
  #persist(touch = true): void {
    if (touch || !this.#savedAt) this.#savedAt = Date.now();
    const store = this.#deps.store;
    if (!store) return;
    if (!this.open && !this.messages.length) {
      store.clear();
      return;
    }
    store.save({
      conversationId: this.#conversationId,
      messages: $state.snapshot(this.messages).map(forStorage),
      open: this.open,
      savedAt: this.#savedAt,
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
      if (signal.aborted || !isTransient(e)) throw e;
      return await this.#recover(request.requestId, signal);
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', relay);
    }
  }

  async #recover(requestId: string, signal: AbortSignal): Promise<ChatResponse> {
    // About 5 minutes in all with the patience window: a turn can include authorized counts, which the
    // service waits up to 130s for each, and the stored reply is kept far longer than this.
    const { patienceMs = 60_000, pollMs = 2_000, maxPolls = 120 } = this.#deps;
    // The polls are bounded in time as well as in number: a GET that never returns is cut off at
    // the deadline, so the turn ends in a timeout rather than holding the composer until Stop.
    const deadline = Date.now() + pollMs * maxPolls + patienceMs;
    this.recovering = true;
    for (let i = 0; i < maxPolls; i++) {
      await sleep(pollMs, signal);
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      try {
        const result = await this.#fetchWithin(requestId, signal, Math.min(patienceMs, remaining));
        if (result) return result;
      } catch (e) {
        // One bad poll is not a lost reply; the next may find it.
        if (signal.aborted || !isTransient(e)) throw e;
      }
    }
    throw new TurnTimedOut();
  }
}
