import type { ChatMessage, SavedChat, ScreenState } from './model/types.ts';

const KEY = 'assistedSearchChat';

/** The service forgets an idle conversation after an hour by default, so a saved one is no use past that. */
export const SAVED_CHAT_MAX_AGE_MS = 60 * 60 * 1000;

// Storage can be missing (server render) or refuse access (private windows), and what is in it
// can be stale or hand-edited; none of that should break the page.
function storage(): Storage | undefined {
  try {
    return typeof sessionStorage === 'undefined' ? undefined : sessionStorage;
  } catch {
    return undefined;
  }
}

const isMessage = (m: unknown): m is ChatMessage =>
  !!m &&
  typeof m === 'object' &&
  typeof (m as ChatMessage).id === 'string' &&
  typeof (m as ChatMessage).text === 'string' &&
  ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant');

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const isScreen = (s: unknown): s is ScreenState =>
  isObject(s) &&
  isObject(s.query) &&
  Array.isArray(s.query.select) &&
  Array.isArray(s.query.genomicFilters) &&
  (s.query.phenotypicClause === null || isObject(s.query.phenotypicClause)) &&
  Array.isArray(s.facets) &&
  s.facets.every(
    (f) => isObject(f) && typeof f.category === 'string' && typeof f.name === 'string',
  ) &&
  typeof s.search === 'string';

const UNDO_KEYS = ['changed', 'before', 'after', 'undone'] as const;

// Undo needs both snapshots and its metadata; a message whose undo state is damaged keeps its turn
// (so the reply can still be fetched) but loses the undo.
function withValidUndo(m: ChatMessage): ChatMessage {
  if (UNDO_KEYS.every((k) => m[k] === undefined)) return m;
  const valid =
    isScreen(m.before) &&
    isScreen(m.after) &&
    Array.isArray(m.changed) &&
    (m.undone === undefined || typeof m.undone === 'boolean');
  if (valid) return m;
  const kept = { ...m };
  for (const k of UNDO_KEYS) delete kept[k];
  return kept;
}

export function loadSavedChat(now = Date.now()): SavedChat | null {
  try {
    const raw = storage()?.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedChat;
    const valid =
      Array.isArray(saved.messages) &&
      saved.messages.every(isMessage) &&
      typeof saved.savedAt === 'number' &&
      (saved.conversationId === null || typeof saved.conversationId === 'string');
    if (!valid || now - saved.savedAt > SAVED_CHAT_MAX_AGE_MS) {
      clearSavedChat();
      return null;
    }
    return { ...saved, messages: saved.messages.map(withValidUndo), open: saved.open === true };
  } catch {
    clearSavedChat();
    return null;
  }
}

export function saveChat(chat: SavedChat): void {
  try {
    storage()?.setItem(KEY, JSON.stringify(chat));
  } catch {
    // full or blocked: the chat still works, it just won't survive a refresh
  }
}

export function clearSavedChat(): void {
  try {
    storage()?.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
