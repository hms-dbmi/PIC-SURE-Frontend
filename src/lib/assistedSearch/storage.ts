import type { ChatMessage, SavedChat } from './model/types';

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
    return { ...saved, open: saved.open === true };
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
