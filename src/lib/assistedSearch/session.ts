import { createLog, log } from '$lib/logger';
import { genericUUID } from '$lib/utilities/UUID';

import { fetchChatResult, sendChat } from './api';
import { ChatSession } from './chat.svelte';
import { applyScreen, readScreen } from './screen';
import { onSearchReset } from '$lib/stores/Search';
import { clearSavedChat, loadSavedChat, saveChat } from './storage';

/** The one conversation for this browser tab; cleared with the rest of the search state. */
export const chat = new ChatSession({
  readScreen,
  applyScreen,
  send: sendChat,
  fetchResult: fetchChatResult,
  newId: genericUUID,
  log: (action, details) => log(createLog('CHAT', action, details)),
  store: { load: loadSavedChat, save: saveChat, clear: clearSavedChat },
});

// The conversation lives and dies with the search state it was built on.
onSearchReset(() => chat.reset());
