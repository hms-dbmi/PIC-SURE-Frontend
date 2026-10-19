import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/api/picsure/datasets.ts', () => ({
  getDatasets: vi.fn(),
  getDataset: vi.fn(),
  updateDataset: vi.fn(),
}));

import * as api from '#lib/api/picsure/datasets.ts';
import type { DataSet } from '#lib/api/picsure/datasets.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { datasets } from '#lib/datasets/datasets.svelte.ts';

const dataset = (uuid: string) => ({ uuid, archived: false, rawStartTime: 0 }) as DataSet;

afterEach(() => {
  session.clear();
  vi.resetAllMocks();
});

describe('the datasets list', () => {
  it('serves a dataset from the loaded list', async () => {
    vi.mocked(api.getDatasets).mockResolvedValue([dataset('a')]);
    await datasets.load();

    await datasets.get('a');

    expect(api.getDataset).not.toHaveBeenCalled();
  });

  it('is emptied when the session ends, so the next user asks for their own', async () => {
    vi.mocked(api.getDatasets).mockResolvedValue([dataset('a')]);
    await datasets.load();

    session.clear();
    await datasets.get('a');

    expect(datasets.active).toEqual([]);
    expect(api.getDataset).toHaveBeenCalledWith('a');
  });

  it('drops a list that arrives after the session ended', async () => {
    let respond: (list: DataSet[]) => void = () => {};
    vi.mocked(api.getDatasets).mockReturnValue(new Promise((resolve) => (respond = resolve)));
    const loading = datasets.load();

    session.clear();
    respond([dataset('a')]);
    await loading;

    expect(datasets.active).toEqual([]);
  });
});
