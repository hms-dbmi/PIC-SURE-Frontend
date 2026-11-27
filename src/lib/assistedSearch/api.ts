import { request } from '#lib/api/client.ts';
import { ApiError } from '#lib/api/errors.ts';
import { Picsure } from '#lib/api/paths.ts';
import type { ChatRequest, ChatResponse } from './model/types.ts';

const CHAT = Picsure.Chat;

const isOptional = (value: unknown, ok: (v: unknown) => boolean) =>
  value === undefined || value === null || ok(value);

function isResponse(body: unknown): body is ChatResponse {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.response === 'string' &&
    isOptional(r.search, (v) => typeof v === 'string') &&
    isOptional(r.notice, (v) => typeof v === 'string') &&
    isOptional(
      r.facets,
      (v) =>
        Array.isArray(v) &&
        v.every(
          (f) =>
            f &&
            typeof f === 'object' &&
            typeof f.category === 'string' &&
            typeof f.name === 'string',
        ),
    ) &&
    isOptional(r.query, (v) => typeof v === 'object' && !Array.isArray(v))
  );
}

// The client rejects a 422 (a reused requestId) with its body on the error, so unwrap it here:
// the service answers that turn with the reply the first request earned.
function asResponse(body: unknown, status?: number): ChatResponse {
  if (isResponse(body)) return body;
  throw Object.assign(new Error('Unexpected chat response'), {
    status,
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
    if (e instanceof ApiError && e.status === 422) return asResponse(e.body, e.status);
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
    if (e instanceof ApiError && e.status === 422) return asResponse(e.body, e.status);
    throw e;
  }
}
