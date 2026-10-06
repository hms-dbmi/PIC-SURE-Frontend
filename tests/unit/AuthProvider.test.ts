import { describe, it, expect, vi } from 'vitest';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('$app/env', () => ({ browser: false }));
vi.mock('#lib/api.ts', () => ({ post }));

import Fence from '#lib/auth/FENCE.ts';
import { Psama } from '#lib/paths.ts';

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
    await fence.authenticate(['code=YWJjZA==']);

    expect(post).toHaveBeenCalledWith(`${Psama.Auth}/fence`, { code: 'YWJjZA==' });
  });
});
