import { describe, expect, it } from 'vitest';

import { buildFilter } from '#lib/explorer/filterBuilder.ts';
import type { SearchResult } from '#lib/api/picsure/dictionary.types.ts';

const categorical = {
  conceptPath: '\\demo\\sex\\',
  dataset: 'ds',
  name: 'sex',
  display: 'Sex',
  type: 'Categorical',
  allowFiltering: true,
  values: ['female', 'male', 'other'],
} as SearchResult;

const numeric = {
  ...categorical,
  conceptPath: '\\demo\\age\\',
  type: 'Continuous',
} as SearchResult;

const form = { values: [], min: '', max: '' };

describe('buildFilter', () => {
  it('builds nothing for a categorical concept with no values chosen', () => {
    expect(buildFilter(categorical, form)).toBeUndefined();
  });

  it('restricts a categorical concept to some of its values', () => {
    expect(buildFilter(categorical, { ...form, values: ['male'] })).toMatchObject({
      filterType: 'Categorical',
      displayType: 'restrict',
      categoryValues: ['male'],
      id: categorical.conceptPath,
    });
  });

  it('turns every value chosen into a "has any value" filter', () => {
    const filter = buildFilter(categorical, { ...form, values: ['female', 'male', 'other'] });
    expect(filter).toMatchObject({ displayType: 'any', categoryValues: [] });
  });

  it.each([
    ['', '', 'any', undefined, undefined],
    ['18', '', 'greaterThan', '18', undefined],
    ['', '65', 'lessThan', undefined, '65'],
    ['18', '65', 'between', '18', '65'],
  ])('bounds a numeric concept by min %j and max %j', (min, max, displayType, fMin, fMax) => {
    expect(buildFilter(numeric, { values: [], min, max })).toMatchObject({
      filterType: 'numeric',
      displayType,
      min: fMin,
      max: fMax,
    });
  });
});
