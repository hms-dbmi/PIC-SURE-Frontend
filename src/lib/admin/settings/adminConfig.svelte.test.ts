import { flushSync } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ended = vi.hoisted(() => [] as (() => void)[]);
vi.mock('#lib/auth/session.svelte.ts', () => ({
  session: { onEnd: (listener: () => void) => ended.push(listener) },
}));
vi.mock('#lib/config/resolve.ts', async (importActual) => ({
  ...(await importActual<typeof import('#lib/config/resolve.ts')>()),
  CONFIG_API_KIND: { features: 'FEATURE', settings: 'SETTING', branding: '' },
}));
vi.mock('#lib/api/picsure/configuration.ts', () => ({
  getConfigRows: vi.fn(),
  createConfigRow: vi.fn(),
}));

import * as api from '#lib/api/picsure/configuration.ts';
import { adminConfig } from '#lib/admin/settings/adminConfig.svelte.ts';
import type { ConfigObject } from '#lib/config/resolve.ts';

const getConfigRows = vi.mocked(api.getConfigRows);
const row: ConfigObject = { uuid: 'r-1', name: 'ENABLE_FOO', value: 'true' };
const endSession = () => ended.forEach((listener) => listener());

beforeEach(() => {
  vi.clearAllMocks();
  adminConfig.reset();
});

describe('adminConfig', () => {
  it('loads each kind once until the session ends', async () => {
    getConfigRows.mockResolvedValue([row]);

    await adminConfig.load('features');
    await adminConfig.load('features');
    expect(adminConfig.rows('features')).toEqual([row]);

    endSession();
    expect(adminConfig.rows('features')).toEqual([]);
    await adminConfig.load('features');
    expect(getConfigRows).toHaveBeenCalledTimes(2);
  });

  it('drops rows that arrive after the session ended', async () => {
    let answer: (rows: ConfigObject[]) => void = () => {};
    getConfigRows.mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)));

    const loading = adminConfig.load('features');
    endSession();
    answer([row]);
    await loading;

    expect(adminConfig.rows('features')).toEqual([]);
  });

  it('has no rows and asks for none when a kind has no API', async () => {
    await adminConfig.load('branding');

    expect(adminConfig.rows('branding')).toEqual([]);
    expect(getConfigRows).not.toHaveBeenCalled();
  });

  it('updates readers of the rows after a save', async () => {
    vi.mocked(api.createConfigRow).mockResolvedValue(row);
    let seen: readonly ConfigObject[] = [];
    const stop = $effect.root(() => {
      $effect(() => {
        seen = adminConfig.rows('features');
      });
    });
    flushSync();

    await adminConfig.add('features', 'ENABLE_FOO', 'true');
    flushSync();
    stop();

    expect(seen).toEqual([row]);
  });
});
