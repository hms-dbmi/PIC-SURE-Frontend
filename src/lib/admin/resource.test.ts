import { describe, it, expect, vi } from 'vitest';

const ended = vi.hoisted(() => [] as (() => void)[]);
vi.mock('#lib/auth/session.svelte.ts', () => ({
  session: { onEnd: (listener: () => void) => ended.push(listener) },
}));

import { createResource } from '#lib/admin/resource.svelte.ts';

const endSession = () => ended.forEach((listener) => listener());

describe('createResource', () => {
  it('drops the list when the session ends, so the next load fetches again', async () => {
    const list = vi
      .fn<() => Promise<{ uuid: string; name: string }[]>>()
      .mockResolvedValueOnce([{ uuid: 'a', name: 'First admin' }])
      .mockResolvedValueOnce([{ uuid: 'b', name: 'Second admin' }]);
    const resource = createResource({ name: 'Thing', list, label: (t) => t.name });

    await resource.load();
    endSession();
    expect(resource.items).toEqual([]);

    await resource.load();
    expect(list).toHaveBeenCalledTimes(2);
    expect(resource.options).toEqual([['Second admin', 'b']]);
  });

  it('refuses operations its config does not define', async () => {
    const resource = createResource<{ uuid?: string }>({ name: 'Thing', list: async () => [] });
    await expect(resource.add({})).rejects.toThrow('Thing does not support add.');
  });
});
