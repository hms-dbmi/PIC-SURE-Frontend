import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));
let mockMode: 'explorer' | 'discover' = 'explorer';
vi.mock('$app/state', () => ({
  page: {
    get data() {
      return { mode: mockMode };
    },
  },
}));

const mockState = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { writable } = require('svelte/store') as typeof import('svelte/store');
  return {
    requestSpy: vi.fn(),
    logSpy: vi.fn(),
    consentsSettledSpy: vi.fn().mockResolvedValue(undefined),
    showAccessUnavailableSpy: vi.fn(),
    accessUnavailableStore: writable(false),
    consentedStudiesStore: writable<string[]>([]),
  };
});

vi.mock('#lib/api/client.ts', () => ({ request: mockState.requestSpy }));

vi.mock('#lib/auth/User.ts', () => ({
  ACCESS_UNAVAILABLE_MESSAGE: 'Access unavailable',
  accessUnavailable: mockState.accessUnavailableStore,
  consentedStudies: mockState.consentedStudiesStore,
  consentsSettled: mockState.consentsSettledSpy,
  showAccessUnavailable: mockState.showAccessUnavailableSpy,
}));

vi.mock('#lib/telemetry/logger.ts', () => ({
  log: mockState.logSpy,
  createLog: vi.fn((category: string, event: string, data?: unknown) => ({
    category,
    event,
    data,
  })),
}));

import type { DictionaryFacetResult } from '#lib/api/picsure/dictionary.types.ts';
import { searchFacets, searchDictionary } from '#lib/explorer/Dictionary.ts';

function facetResponse(categoryName: string, zeroCountFacet = 'empty'): DictionaryFacetResult[] {
  return [
    {
      name: categoryName,
      display: categoryName,
      description: '',
      facets: [
        { name: 'live', display: 'live', description: '', count: 5, category: categoryName },
        {
          name: zeroCountFacet,
          display: zeroCountFacet,
          description: '',
          count: 0,
          category: categoryName,
        },
      ],
    },
  ] as unknown as DictionaryFacetResult[];
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
  mockState.requestSpy.mockReset();
  mockState.logSpy.mockClear();
  mockMode = 'explorer';
  mockState.consentsSettledSpy.mockClear();
  mockState.consentedStudiesStore.set(['phs000001']);
});
afterEach(() => {
  vi.mocked(console.log).mockRestore();
  vi.mocked(console.debug).mockRestore();
});

describe('searchFacets', () => {
  it('sends the term and facets and links each facet to its category', async () => {
    const response = facetResponse('demographics');
    mockState.requestSpy.mockResolvedValueOnce(response);

    const result = await searchFacets('age', []);

    expect(mockState.requestSpy).toHaveBeenCalledWith(
      'picsure/dictionary/facets',
      expect.objectContaining({ body: expect.objectContaining({ search: 'age', facets: [] }) }),
    );
    expect(result[0].facets[0].categoryRef).toEqual({
      name: 'demographics',
      display: 'demographics',
      description: '',
    });
  });

  it('forwards the abort signal to the facets request', async () => {
    mockState.requestSpy.mockResolvedValueOnce(facetResponse('demographics'));
    const controller = new AbortController();

    await searchFacets('age', [], { signal: controller.signal });

    expect(mockState.requestSpy).toHaveBeenCalledWith(
      'picsure/dictionary/facets',
      expect.objectContaining({ method: 'POST', auth: 'open', signal: controller.signal }),
    );
  });

  it('rethrows an abort without logging it as a failure', async () => {
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    mockState.requestSpy.mockRejectedValueOnce(abortError);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(searchFacets('age', [])).rejects.toThrow('aborted');
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('still logs a genuine failure', async () => {
    mockState.requestSpy.mockRejectedValueOnce(new Error('boom'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(searchFacets('age', [])).rejects.toThrow('boom');
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});

describe('searchDictionary', () => {
  it('forwards the page and the abort signal to the concepts request', async () => {
    mockState.requestSpy.mockResolvedValueOnce({ content: [], totalElements: 0 });
    const controller = new AbortController();

    await searchDictionary(
      'age',
      [],
      { pageNumber: 0, pageSize: 10 },
      { signal: controller.signal },
    );

    expect(mockState.requestSpy).toHaveBeenCalledWith('picsure/dictionary/concepts', {
      method: 'POST',
      query: { page_number: 0, page_size: 10 },
      body: expect.objectContaining({ search: 'age' }),
      auth: 'open',
      signal: controller.signal,
    });
  });

  it('sends no signal when none is given', async () => {
    mockState.requestSpy.mockResolvedValueOnce({ content: [], totalElements: 0 });

    await searchDictionary('age', [], { pageNumber: 0, pageSize: 10 });

    expect(mockState.requestSpy).toHaveBeenCalledWith(
      'picsure/dictionary/concepts',
      expect.objectContaining({ signal: undefined }),
    );
  });
});

describe('consents follow the explore mode', () => {
  it('sends the consented studies from explorer', async () => {
    mockState.requestSpy
      .mockResolvedValueOnce({ content: [], totalElements: 0 })
      .mockResolvedValueOnce([]);

    await searchDictionary('age', [], { pageNumber: 0, pageSize: 10 });
    await searchFacets('age', []);

    expect(mockState.requestSpy.mock.calls.map(([, opts]) => opts.body.consents)).toEqual([
      ['phs000001'],
      ['phs000001'],
    ]);
  });

  it('never sends consents from discover, even for a signed-in user', async () => {
    mockMode = 'discover';
    mockState.requestSpy
      .mockResolvedValueOnce({ content: [], totalElements: 0 })
      .mockResolvedValueOnce([]);

    await searchDictionary('age', [], { pageNumber: 0, pageSize: 10 });
    await searchFacets('age', []);

    expect(mockState.requestSpy).toHaveBeenCalledTimes(2);
    for (const [, opts] of mockState.requestSpy.mock.calls) {
      expect(opts.body).not.toHaveProperty('consents');
    }
    expect(mockState.consentsSettledSpy).not.toHaveBeenCalled();
  });

  it('fails closed in explorer when access is unavailable instead of sending no consents', async () => {
    mockState.accessUnavailableStore.set(true);
    try {
      await expect(searchFacets('age', [])).rejects.toThrow('Access unavailable');
      expect(mockState.requestSpy).not.toHaveBeenCalled();
    } finally {
      mockState.accessUnavailableStore.set(false);
    }
  });
});
