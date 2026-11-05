import { describe, expect, it } from 'vitest';

import { changedParts, partsOf } from '$lib/assistedSearch/model/screen';
import { resolveFacets } from '$lib/assistedSearch/model/facets';
import type { ScreenState } from '$lib/assistedSearch/model/types';
import type { DictionaryFacetResult } from '$lib/models/api/Dictionary';

const screen = (over: Partial<ScreenState> = {}): ScreenState => ({
  query: {
    select: ['\\ds\\age\\'],
    phenotypicClause: {
      type: 'PhenotypicFilter',
      phenotypicFilterType: 'REQUIRED',
      conceptPath: '\\ds\\sex\\',
      not: false,
    },
    genomicFilters: [],
  },
  facets: [{ category: 'study', name: 'NHANES' }],
  search: 'blood pressure',
  ...over,
});

describe('changedParts', () => {
  it('ignores a part that restates what is on screen', () => {
    // The service sends no `type` discriminator and no `not: false`.
    const response = {
      response: 'ok',
      query: {
        select: ['\\ds\\age\\'],
        phenotypicClause: {
          phenotypicFilterType: 'REQUIRED',
          conceptPath: '\\ds\\sex\\',
        },
        genomicFilters: [],
      },
      facets: [{ name: 'NHANES', category: 'study' }],
      search: ' blood pressure ',
    };
    expect(changedParts(response as never, screen())).toEqual({});
  });

  it('keeps only the parts that differ', () => {
    const changes = changedParts(
      {
        response: 'ok',
        facets: [{ category: 'study', name: 'Synthea' }],
        search: 'blood pressure',
      },
      screen(),
    );
    expect(partsOf(changes)).toEqual(['facets']);
  });

  it('treats an empty search as a change that clears it', () => {
    expect(changedParts({ response: 'ok', search: '' }, screen())).toEqual({ search: '' });
  });

  it('treats facet order as irrelevant', () => {
    const current = screen({
      facets: [
        { category: 'a', name: '1' },
        { category: 'b', name: '2' },
      ],
    });
    const response = {
      response: 'ok',
      facets: [
        { category: 'b', name: '2' },
        { category: 'a', name: '1' },
      ],
    };
    expect(changedParts(response, current)).toEqual({});
  });

  it('detects a changed select', () => {
    const response = { response: 'ok', query: { ...screen().query, select: [] } };
    expect(partsOf(changedParts(response, screen()))).toEqual(['query']);
  });
});

describe('resolveFacets', () => {
  const categories = [
    {
      name: 'study',
      display: 'Study',
      description: '',
      facets: [
        {
          name: 'NHANES',
          display: 'NHANES study',
          description: null,
          count: 12,
          category: 'study',
          children: [
            { name: 'NHANES-1', display: 'Wave 1', description: null, count: 4, category: 'study' },
          ],
        },
      ],
    },
  ] as DictionaryFacetResult[];

  it('uses the facet on screen for display text and count, children included', () => {
    const [top, child] = resolveFacets(
      [
        { category: 'study', name: 'NHANES' },
        { category: 'study', name: 'NHANES-1' },
      ],
      categories,
    );
    expect(top).toMatchObject({ display: 'NHANES study', count: 12 });
    expect(child).toMatchObject({ display: 'Wave 1', count: 4 });
  });

  it('falls back to a bare facet when the list does not hold it', () => {
    expect(resolveFacets([{ category: 'study', name: 'Other' }], categories)).toEqual([
      { category: 'study', name: 'Other', display: 'Other', description: null, count: 0 },
    ]);
  });
});
