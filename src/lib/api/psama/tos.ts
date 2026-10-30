import { request } from '#lib/api/client.ts';
import { Psama } from '#lib/api/paths.ts';

/**
 * The current terms of service, as HTML. PSAMA serves them to anyone; `auth: 'none'` reads them
 * without the user's token.
 */
export function latest({ auth = 'user' }: { auth?: 'user' | 'none' } = {}): Promise<string> {
  return request<string>(`${Psama.TOS}/latest`, { auth });
}

export function accept(): Promise<unknown> {
  return request<unknown>(`${Psama.TOS}/accept`, { method: 'POST', body: {} });
}

export function update(html: string): Promise<unknown> {
  return request<unknown>(`${Psama.TOS}/update`, {
    method: 'POST',
    body: html,
    headers: { 'Content-Type': 'text/html' },
  });
}
