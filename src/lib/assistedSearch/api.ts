import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import type { ChatRequest, ChatResponse } from './model/types';

const CHAT = Picsure.Chat;

// api.ts hands a 422 (a reused requestId) back as a body instead of throwing, so check the shape.
function asResponse(body: unknown): ChatResponse {
  if (body && typeof body === 'object' && typeof (body as ChatResponse).response === 'string') {
    return body as ChatResponse;
  }
  throw Object.assign(new Error('Unexpected chat response'), {
    body: body && typeof body === 'object' ? body : undefined,
  });
}

export async function sendChat(request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
  return asResponse(await api.post(CHAT, request, undefined, undefined, { signal }));
}

/** The reply to an earlier turn; undefined while it is still being answered (202). */
export async function fetchChatResult(
  requestId: string,
  signal?: AbortSignal,
): Promise<ChatResponse | undefined> {
  const body = await api.get(`${CHAT}/${encodeURIComponent(requestId)}`, undefined, undefined, {
    signal,
  });
  return body ? asResponse(body) : undefined;
}
