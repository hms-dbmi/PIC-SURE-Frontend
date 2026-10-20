import { describe, it, expect, vi } from 'vitest';
import type { RouteId } from '$app/types';

vi.mock('#lib/auth/guard.ts', () => ({ requireAccess: vi.fn().mockResolvedValue(undefined) }));
vi.mock('$app/state', () => ({ page: {} }));
vi.mock('#lib/auth/User.ts', () => ({}));
vi.mock('#lib/config/config.svelte.ts', () => ({}));

import { routeMode } from '#lib/explorer/mode.ts';
import { load as discoverLoad } from './discover/+layout.ts';
import { load as explorerLoad } from './explorer/+layout.ts';

describe('explore layouts', () => {
  // Discover's mode is what keeps consents off its requests and sends its counts to the open
  // endpoint, so the layout, not the URL, has to say so.
  it.each([
    ['/(picsure)/(public)/discover', discoverLoad, 'discover'],
    ['/(picsure)/(public)/explorer', explorerLoad, 'explorer'],
  ] as const)('%s returns mode %s', async (routeId: RouteId, load, mode) => {
    await expect(load({} as never)).resolves.toEqual({ mode });
    expect(routeMode(routeId)).toBe(mode);
  });
});
