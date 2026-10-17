import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/api/client.ts', () => ({ request: vi.fn() }));

import { request } from '#lib/api/client.ts';
import { getConceptDetail, searchConcepts, searchGenes } from '#lib/api/picsure/dictionary.ts';

const respond = vi.mocked(request);

beforeEach(() => respond.mockReset());

describe('searchGenes', () => {
  it('asks for one page of genes with variants', async () => {
    respond.mockResolvedValue({ results: ['BRCA1', 2], total: 1, page: 3 });

    await expect(searchGenes('BRC', 3, 20)).resolves.toEqual({
      results: ['BRCA1'],
      total: 1,
      page: 3,
    });
    expect(respond).toHaveBeenCalledWith('picsure/hpds/auth/search/values', {
      query: { genomicConceptPath: 'Gene_with_variant', query: 'BRC', page: 3, size: 20 },
      headers: { 'content-type': 'application/json' },
      auth: 'open',
    });
  });

  it('rejects with the error HPDS reports in a successful response', async () => {
    respond.mockResolvedValue({ error: 'search failed' });
    await expect(searchGenes('', 1, 20)).rejects.toBe('search failed');
  });

  it('rejects a response without results', async () => {
    respond.mockResolvedValue({ total: 0 });
    await expect(searchGenes('', 1, 20)).rejects.toThrow('Invalid gene search response');
  });
});

describe('concept responses', () => {
  it('rejects a search page without its content list', async () => {
    respond.mockResolvedValue({ totalElements: 3 });
    await expect(
      searchConcepts({ facets: [], search: '' }, { pageNumber: 0, pageSize: 10 }),
    ).rejects.toThrow('Invalid concept search response');
  });

  it('rejects a concept without a concept path', async () => {
    respond.mockResolvedValue({});
    await expect(getConceptDetail('ds', '\\a\\')).rejects.toThrow(
      'Invalid concept detail response',
    );
  });
});
