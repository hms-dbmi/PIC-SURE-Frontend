import { describe, expect, it } from 'vitest';

import { parseQueryV2, queryV2ToV3 } from '$lib/compat/QueryV2';

function makeQueryV2(overrides: Record<string, unknown> = {}) {
  return {
    categoryFilters: {},
    numericFilters: {},
    requiredFields: [],
    anyRecordOf: [],
    anyRecordOfMulti: [],
    fields: [],
    crossCountFields: [],
    variantInfoFilters: [],
    expectedResultType: 'COUNT',
    ...overrides,
  };
}

describe('parseQueryV2', () => {
  it('accepts null categoryFilters from historical rows as an empty map', () => {
    const query = parseQueryV2(makeQueryV2({ categoryFilters: null }));

    expect(query?.categoryFilters).toEqual({});
  });

  it('requires the categoryFilters marker that identifies a V2 query', () => {
    expect(parseQueryV2({ fields: [] })).toBeNull();
  });

  it('rejects non-array and mixed category filter values', () => {
    expect(
      parseQueryV2(makeQueryV2({ categoryFilters: { '\\dataset\\sex\\': 'Male' } })),
    ).toBeNull();
    expect(
      parseQueryV2(makeQueryV2({ categoryFilters: { '\\dataset\\sex\\': ['Male', 1] } })),
    ).toBeNull();
  });

  it('normalizes finite numeric strings and omits blank bounds', () => {
    const query = parseQueryV2(
      makeQueryV2({
        numericFilters: {
          '\\dataset\\age\\': { min: '18', max: '' },
        },
      }),
    );

    expect(query?.numericFilters).toEqual({
      '\\dataset\\age\\': { min: 18, max: undefined },
    });
  });

  it('rejects numeric filters with no bounds', () => {
    expect(
      parseQueryV2(makeQueryV2({ numericFilters: { '\\dataset\\age\\': { min: null, max: '' } } })),
    ).toBeNull();
  });

  it('rejects non-finite numeric bounds', () => {
    expect(
      parseQueryV2(makeQueryV2({ numericFilters: { '\\dataset\\age\\': { min: 'invalid' } } })),
    ).toBeNull();
    expect(
      parseQueryV2(makeQueryV2({ numericFilters: { '\\dataset\\age\\': { min: Infinity } } })),
    ).toBeNull();
  });

  it('rejects malformed filter arrays instead of silently widening the restored query', () => {
    expect(parseQueryV2(makeQueryV2({ requiredFields: ['\\dataset\\age\\', 1] }))).toBeNull();
    expect(parseQueryV2(makeQueryV2({ anyRecordOfMulti: [['\\dataset\\age\\'], [1]] }))).toBeNull();
  });

  it('rejects historical genomic constraints that cannot be converted faithfully', () => {
    expect(
      parseQueryV2(
        makeQueryV2({
          variantInfoFilters: [
            {
              categoryVariantInfoFilters: {},
              numericVariantInfoFilters: { Variant_frequency_as_number: [0.01, 0.1] },
            },
          ],
        }),
      ),
    ).toBeNull();
    expect(
      parseQueryV2(
        makeQueryV2({
          variantInfoFilters: [
            { categoryVariantInfoFilters: { deployment_specific_filter: ['value'] } },
          ],
        }),
      ),
    ).toBeNull();
    expect(
      parseQueryV2(
        makeQueryV2({
          variantInfoFilters: [
            {
              categoryVariantInfoFilters: {},
              deploymentSpecificFilters: { custom_filter: ['value'] },
            },
          ],
        }),
      ),
    ).toBeNull();
  });

  it('rejects unsupported expected result types', () => {
    expect(parseQueryV2(makeQueryV2({ expectedResultType: 'UNSUPPORTED' }))).toBeNull();
    expect(parseQueryV2(makeQueryV2({ expectedResultType: ['COUNT', 'UNSUPPORTED'] }))).toBeNull();
  });
});

describe('queryV2ToV3', () => {
  it('maps and deduplicates selected fields', () => {
    const query = parseQueryV2(
      makeQueryV2({
        fields: ['\\dataset\\age\\', '\\dataset\\sex\\'],
        crossCountFields: ['\\dataset\\sex\\', '\\dataset\\height\\'],
      }),
    );
    if (!query) throw new Error('Invalid test query');

    expect(queryV2ToV3(query).select).toEqual([
      '\\dataset\\age\\',
      '\\dataset\\sex\\',
      '\\dataset\\height\\',
    ]);
  });

  it('maps categorical, numeric, and required filters into an AND query', () => {
    const query = parseQueryV2(
      makeQueryV2({
        categoryFilters: { '\\dataset\\sex\\': ['Female'] },
        numericFilters: { '\\dataset\\age\\': { min: 18, max: 65 } },
        requiredFields: ['\\dataset\\height\\'],
      }),
    );
    if (!query) throw new Error('Invalid test query');

    expect(queryV2ToV3(query).phenotypicClause).toMatchObject({
      type: 'PhenotypicSubquery',
      operator: 'AND',
      phenotypicClauses: [
        {
          phenotypicFilterType: 'FILTER',
          conceptPath: '\\dataset\\sex\\',
          values: ['Female'],
        },
        {
          phenotypicFilterType: 'FILTER',
          conceptPath: '\\dataset\\age\\',
          min: 18,
          max: 65,
        },
        {
          phenotypicFilterType: 'REQUIRED',
          conceptPath: '\\dataset\\height\\',
        },
      ],
    });
  });

  it('maps supported categorical genomic filters', () => {
    const query = parseQueryV2(
      makeQueryV2({
        variantInfoFilters: [
          {
            categoryVariantInfoFilters: {
              Gene_with_variant: ['BRCA1'],
              Variant_consequence_calculated: ['missense_variant'],
              Variant_frequency_as_text: ['Common'],
            },
            numericVariantInfoFilters: {},
          },
        ],
      }),
    );
    if (!query) throw new Error('Invalid test query');

    expect(queryV2ToV3(query).genomicFilters).toEqual([
      { key: 'Gene_with_variant', values: ['BRCA1'] },
      { key: 'Variant_consequence_calculated', values: ['missense_variant'] },
      { key: 'Variant_frequency_as_text', values: ['Common'] },
    ]);
  });

  it('uses the first historical expected result type', () => {
    const query = parseQueryV2(makeQueryV2({ expectedResultType: ['DATAFRAME', 'COUNT'] }));
    if (!query) throw new Error('Invalid test query');

    expect(queryV2ToV3(query).expectedResultType).toBe('DATAFRAME');
  });

  it('preserves OR within any-record groups and AND between groups', () => {
    const query = parseQueryV2(
      makeQueryV2({
        anyRecordOf: ['\\dataset\\a\\', '\\dataset\\b\\'],
        anyRecordOfMulti: [['\\dataset\\c\\', '\\dataset\\d\\'], ['\\dataset\\e\\']],
      }),
    );
    if (!query) throw new Error('Invalid test query');

    const converted = queryV2ToV3(query);

    expect(converted.phenotypicClause).toMatchObject({
      type: 'PhenotypicSubquery',
      operator: 'AND',
      phenotypicClauses: [
        { type: 'PhenotypicSubquery', operator: 'OR' },
        { type: 'PhenotypicSubquery', operator: 'OR' },
        {
          type: 'PhenotypicFilter',
          phenotypicFilterType: 'REQUIRED',
          conceptPath: '\\dataset\\e\\',
        },
      ],
    });
  });

  it('does not mutate the normalized saved query', () => {
    const query = parseQueryV2(
      makeQueryV2({
        categoryFilters: { '\\_consents\\': ['phs001'] },
        fields: ['\\dataset\\age\\', '\\_consents\\'],
      }),
    );
    if (!query) throw new Error('Invalid test query');
    const before = structuredClone(query);

    const converted = queryV2ToV3(query, ['\\_consents\\']);

    expect(query).toEqual(before);
    expect(converted.select).toEqual(['\\dataset\\age\\']);
    expect(converted.phenotypicClause).toBeNull();
  });
});
