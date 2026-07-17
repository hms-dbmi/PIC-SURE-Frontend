import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const mockState = vi.hoisted(() => {
  const createWritable = <T>(initial: T) => {
    let value = initial;
    const subscribers = new Set<(value: T) => void>();
    return {
      subscribe: (subscriber: (value: T) => void) => {
        subscriber(value);
        subscribers.add(subscriber);
        return () => subscribers.delete(subscriber);
      },
      set: (next: T) => {
        value = next;
        subscribers.forEach((subscriber) => subscriber(value));
      },
    };
  };

  return {
    nextCount: '0' as string | number,
    filters: createWritable<unknown[]>([]),
    genomicFilters: createWritable<unknown[]>([]),
    searchTerm: createWritable(''),
    selectedFacets: createWritable<{ name: string }[]>([]),
    resourcesLoading: createWritable(Promise.resolve()),
  };
});

vi.mock('$lib/toaster', () => ({
  isToastShowing: vi.fn(() => false),
  toaster: { error: vi.fn() },
}));

vi.mock('$lib/configuration.svelte', () => ({
  config: {
    branding: {
      results: {
        totalStatKey: 'query:patientCount',
        stats: [{ key: 'query:patientCount', label: 'Filtered Participants' }],
      },
    },
    features: {
      explorer: { open: false },
      discover: false,
    },
  },
}));

vi.mock('$lib/utilities/StatBuilder', () => ({
  getResultList: vi.fn(() => [
    {
      key: 'query:patientCount',
      label: 'Filtered Participants',
      result: { hpds: Promise.resolve(mockState.nextCount) },
      auth: true,
    },
  ]),
  StatPromise: {
    list: (stat: { result: Record<string, Promise<unknown>> }) =>
      Object.entries(stat.result).map(([resourceName, promise]) => ({ resourceName, promise })),
    rejected: (result: PromiseSettledResult<unknown>) => result.status === 'rejected',
    fullfiled: (result: PromiseSettledResult<unknown>) => result.status === 'fulfilled',
  },
}));

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  createLog: vi.fn((...args) => args),
}));

vi.mock('$lib/stores/Filter', () => ({
  filters: mockState.filters,
  genomicFilters: mockState.genomicFilters,
}));

vi.mock('$lib/utilities/UUID', () => ({
  objectUUID: vi.fn((value) => JSON.stringify(value)),
}));

vi.mock('$lib/stores/Search', () => ({
  searchTerm: mockState.searchTerm,
  selectedFacets: mockState.selectedFacets,
}));

vi.mock('$lib/stores/Resources', () => ({
  loading: mockState.resourcesLoading,
  loadResources: vi.fn(),
}));

describe('ResultStore', () => {
  beforeEach(() => {
    vi.resetModules();
    mockState.nextCount = '0';
    mockState.filters.set([]);
    mockState.genomicFilters.set([]);
    mockState.searchTerm.set('');
    mockState.selectedFacets.set([]);
    mockState.resourcesLoading.set(Promise.resolve());
  });

  it('restores totalParticipants and hasNonZeroResult when patient counts are served from cache', async () => {
    const { loadPatientCount, totalParticipants, hasNonZeroResult } =
      await import('$lib/stores/ResultStore');

    mockState.filters.set([{ id: 'age', uuid: 'age-filter' }]);
    mockState.nextCount = '9999';
    await loadPatientCount(true);
    await vi.waitFor(() => expect(get(totalParticipants)).toBe(9999));
    expect(get(hasNonZeroResult)).toBe(true);

    mockState.filters.set([
      { id: 'age', uuid: 'age-filter' },
      { id: 'rare', uuid: 'rare-filter' },
    ]);
    mockState.nextCount = '0';
    await loadPatientCount(true);
    await vi.waitFor(() => expect(get(totalParticipants)).toBe(0));
    expect(get(hasNonZeroResult)).toBe(false);

    mockState.filters.set([{ id: 'age', uuid: 'age-filter' }]);
    mockState.nextCount = '1234';
    await loadPatientCount(true);

    await vi.waitFor(() => expect(get(totalParticipants)).toBe(9999));
    expect(get(hasNonZeroResult)).toBe(true);
  });
});
