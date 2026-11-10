import { describe, expect, it, vi } from 'vitest';

import * as api from '#lib/api/client.ts';
import { createDatasetName } from '#lib/api/picsure/datasets.ts';

vi.mock('#lib/api/client.ts', () => ({ post: vi.fn() }));

describe('createDatasetName', () => {
  it('rejects a whitespace-only name before calling the API', async () => {
    await expect(createDatasetName('query-1', '   ')).rejects.toBe(
      'Please input a Dataset ID name',
    );
    expect(api.post).not.toHaveBeenCalled();
  });
});
