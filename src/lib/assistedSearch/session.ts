import { createLog, log } from '$lib/logger';
import { genericUUID } from '$lib/utilities/UUID';

import { fetchChatResult, sendChat } from './api';
import { ChatSession } from './chat.svelte';
import { applyScreen, readScreen } from './screen';

/** The one conversation for this browser tab; cleared with the rest of the search state. */
export const chat = new ChatSession({
  readScreen,
  applyScreen,
  send: sendChat,
  fetchResult: fetchChatResult,
  newId: genericUUID,
  log: (action, details) => log(createLog('CHAT', action, details)),
});
