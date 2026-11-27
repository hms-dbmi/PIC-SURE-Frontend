import { createLog, log } from '#lib/telemetry/logger.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { explorerSearch } from '#lib/explorer/search.svelte.ts';
import { genericUUID } from '#lib/utils/uuid.ts';

import { fetchChatResult, sendChat } from './api.ts';
import { ChatSession } from './chat.svelte.ts';
import { applyScreen, readScreen, watchScreen } from './screen.svelte.ts';
import { clearSavedChat, loadSavedChat, saveChat } from './storage.ts';

/** The one conversation for this browser tab. */
export const chat = new ChatSession({
  readScreen,
  applyScreen,
  send: sendChat,
  fetchResult: fetchChatResult,
  newId: genericUUID,
  log: (action, details) => log(createLog('CHAT', action, details)),
  watch: watchScreen,
  store: { load: loadSavedChat, save: saveChat, clear: clearSavedChat },
});

// Reset starts a new search, and the conversation was about the old one. It stops any turn still
// being answered; whether the panel is open is left as it is.
explorerSearch.onReset(() => chat.reset());

// A session that ends (logout, timeout, or another user's sign-in) takes the thread with it, from
// memory as well as storage, or the next persist writes it back for whoever signs in next.
session.onEnd(() => {
  chat.reset();
  chat.setOpen(false);
  clearSavedChat();
});
