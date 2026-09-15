import { describe, expect, it } from 'vitest';

import {
  coversEveryValue,
  filterForRange,
  filterForSelection,
  relatedVariablesOf,
  selectionFromFilter,
} from '$lib/explorer/variableFilter';
import {
  createCategoricalFilter,
  createNumericFilter,
  createRequiredFilter,
  type Filter,
} from '$lib/models/Filter.svelte';
import type { SearchResult } from '$lib/models/Search';

const smoker = {
  conceptPath: '\\this\\is\\a\\smoker\\',
  dataset: 'test_data_set',
  name: 'smoker1',
  display: 'Ever smoked',
  studyAcronym: 'TDS',
  description: 'Ever smoked',
  type: 'Categorical',
  allowFiltering: true,
  values: ['Yes', 'No', "Don't know"],
} as SearchResult;

const age = {
  ...smoker,
  conceptPath: '\\this\\is\\a\\age\\',
  display: 'Age at exam',
  type: 'Continuous',
  values: undefined,
  min: 0,
  max: 99,
} as SearchResult;

describe('selectionFromFilter', () => {
  it('is empty for a variable with no filter', () => {
    expect(selectionFromFilter(smoker.values ?? [])).toEqual([]);
  });

  it('is the filter’s own values', () => {
    const filter = createCategoricalFilter(smoker, ['No']);
    expect(selectionFromFilter(smoker.values ?? [], filter)).toEqual(['No']);
  });

  /*
   * `createRequiredFilter` records "filter to any value" as a Categorical filter with an
   * empty `categoryValues`, so an empty list means every value and not none. Read the other
   * way, re-opening a variable the user had left unconstrained would show nothing selected,
   * and the next press of Filter Participants would turn it into a filter on nothing.
   */
  it('is every value for a filter that restricts to any value', () => {
    const filter = createRequiredFilter(smoker);
    expect(filter.categoryValues).toEqual([]);
    expect(selectionFromFilter(smoker.values ?? [], filter)).toEqual(['Yes', 'No', "Don't know"]);
  });

  // Loosening the user's filter behind their back is worse than showing them a value the
  // dictionary has since dropped.
  it('keeps a value the dictionary no longer lists', () => {
    const filter = createCategoricalFilter(smoker, ['Maybe']);
    expect(selectionFromFilter(smoker.values ?? [], filter)).toEqual(['Maybe']);
  });

  it('is empty for a filter this interface cannot express', () => {
    const numeric = createNumericFilter(age, '18', '65');
    expect(selectionFromFilter(smoker.values ?? [], numeric)).toEqual([]);
  });
});

describe('coversEveryValue', () => {
  it('is true for a selection naming every value, in any order', () => {
    expect(coversEveryValue(['Yes', 'No'], ['No', 'Yes'])).toBe(true);
  });

  it('is false for a selection missing one', () => {
    expect(coversEveryValue(['Yes', 'No'], ['Yes'])).toBe(false);
  });

  // Otherwise a concept the dictionary sent with no values would read as fully selected, and
  // an empty selection would produce a filter restricting nothing.
  it('is false for a variable with no values at all', () => {
    expect(coversEveryValue([], [])).toBe(false);
  });
});

describe('filterForSelection', () => {
  it('is nothing at all for an empty selection', () => {
    expect(filterForSelection(smoker, [])).toBeUndefined();
  });

  it('restricts to the values picked', () => {
    const filter = filterForSelection(smoker, ['Yes', 'No']) as Filter;
    expect(filter.filterType).toBe('Categorical');
    expect(filter).toMatchObject({ displayType: 'restrict', categoryValues: ['Yes', 'No'] });
    expect(filter.id).toBe(smoker.conceptPath);
  });

  // Select All constrains nothing, so it has to be written as "any value" rather than as a
  // list that happens to name them all - which is what the cohort chip reads back.
  it('is any value when the selection covers every value', () => {
    const filter = filterForSelection(smoker, ['Yes', 'No', "Don't know"]) as Filter;
    expect(filter).toMatchObject({ displayType: 'any', categoryValues: [] });
  });
});

describe('filterForRange', () => {
  it('reads both bounds', () => {
    expect(filterForRange(age, '18', '65')).toMatchObject({
      displayType: 'between',
      min: '18',
      max: '65',
    });
  });

  it('reads a zero bound as a bound, not as blank', () => {
    expect(filterForRange(age, '0', '')).toMatchObject({ displayType: 'greaterThan', min: '0' });
  });

  // Deliberate and addable: everyone with a measurement.
  it('is any value when both bounds are blank', () => {
    expect(filterForRange(age, '', '')).toMatchObject({
      displayType: 'any',
      min: undefined,
      max: undefined,
    });
  });
});

describe('relatedVariablesOf', () => {
  const child = (overrides: Partial<SearchResult>) =>
    ({ ...smoker, conceptPath: '\\a\\child\\', ...overrides }) as SearchResult;

  it('is empty for a leaf variable', () => {
    expect(relatedVariablesOf(smoker)).toEqual([]);
    expect(relatedVariablesOf({ ...smoker, children: null })).toEqual([]);
  });

  it('is the categorical children that have values', () => {
    const withValues = child({ display: 'Infection status', values: ['Infected'] });
    const related = relatedVariablesOf({
      ...smoker,
      children: [
        withValues,
        child({ display: 'A category', type: 'AnyRecordOf', values: ['x'] }),
        child({ display: 'No values', values: [] }),
        child({ display: 'Continuous', type: 'Continuous', values: undefined }),
      ],
    });

    expect(related.map((concept) => concept.display)).toEqual(['Infection status']);
  });
});
