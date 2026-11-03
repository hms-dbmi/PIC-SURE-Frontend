// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('$app/env', () => ({ browser: false }));
vi.mock('#lib/api/client.ts', () => ({ request }));

import Fence from '#lib/auth/providers/FENCE.ts';
import { newLoginState } from '#lib/auth/loginState.ts';
import { Psama } from '#lib/api/paths.ts';

const fence = new Fence({
  name: 'fence',
  description: 'Fence',
  type: 'FENCE',
  enabled: true,
  alt: false,
  uri: 'https://fence.example.org',
  clientid: 'client',
  idp: 'idp',
});

describe('callback values', () => {
  it('keeps everything after the first = so padded values are not truncated', async () => {
    await fence.authenticate(['code=YWJjZA==', `state=${newLoginState()}`]);

    expect(request).toHaveBeenCalledWith(`${Psama.Auth}/fence`, {
      method: 'POST',
      body: { code: 'YWJjZA==' },
    });
  });
});
