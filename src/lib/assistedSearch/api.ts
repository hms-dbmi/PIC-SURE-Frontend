import { request } from '#lib/api/client.ts';
import { ApiError } from '#lib/api/errors.ts';
import { Picsure } from '#lib/api/paths.ts';
import type { ChatRequest, ChatResponse } from './model/types.ts';

const CHAT = Picsure.Chat;

// The client rejects a 422 (a reused requestId) with its body on the error, so unwrap it here:
// the service answers that turn with the reply the first request earned.
function asResponse(body: unknown): ChatResponse {
  if (body && typeof body === 'object' && typeof (body as ChatResponse).response === 'string') {
    return body as ChatResponse;
  }
  throw Object.assign(new Error('Unexpected chat response'), {
    body: body && typeof body === 'object' ? body : undefined,
  });
}

export async function sendChat(
  chatRequest: ChatRequest,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  try {
    return asResponse(
      await request(CHAT, { method: 'POST', body: chatRequest, auth: 'open', signal }),
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return asResponse(e.body);
    throw e;
  }
}

/** The reply to an earlier turn; undefined while it is still being answered (202). */
export async function fetchChatResult(
  requestId: string,
  signal?: AbortSignal,
): Promise<ChatResponse | undefined> {
  try {
    const body = await request(`${CHAT}/${encodeURIComponent(requestId)}`, {
      auth: 'open',
      signal,
    });
    return body ? asResponse(body) : undefined;
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return asResponse(e.body);
    throw e;
  }
}
