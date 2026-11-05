import { createLog, log } from '$lib/logger';
import { user } from '$lib/stores/User';
import { genericUUID } from '$lib/utilities/UUID';

import { fetchChatResult, sendChat } from './api';
import { ChatSession } from './chat.svelte';
import { applyScreen, readScreen, watchScreen } from './screen';
import { clearSavedChat, loadSavedChat, saveChat } from './storage';

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

// When the session is cleared on logout the thread must go too, from memory as well as storage,
// or the next persist writes it back for whoever logs in next.
let signedIn = false;
user.subscribe((current) => {
  const now = Object.keys(current).length > 0;
  if (signedIn && !now) {
    chat.reset();
    chat.setOpen(false);
  }
  signedIn = now;
});
