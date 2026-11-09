import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

import { QueryV3, toWireQuery, type PhenotypicClause } from '$lib/models/query/Query';
import {
  buildQueryRequestV3FromDescriptor,
  getBlankQueryRequestV3,
  getQueryRequestV3,
} from '$lib/utilities/QueryBuilder';
import {
  buildCrossCountRequest,
  buildSaveDatasetRequest,
  getQueryRequest,
  resetExportStepperState,
  setQueryRequest,
} from '$lib/ExportStepperManager.svelte';
import { resultProviders } from '$lib/services/counts/providers';

/** Request bodies captured from the serializer as it stood before the sample flag existed. */
const BLANK_BODY =
  '{"query":{"select":[],"authorizationFilters":[],"phenotypicClause":null,"genomicFilters":[],"expectedResultType":"COUNT","picsureId":null,"id":null}}';
const BLANK_CROSS_COUNT_BODY = BLANK_BODY.replace('"COUNT"', '"CROSS_COUNT"');
const GENOMIC_CONCEPTS = ['\\genomic\\SAMPLE_ID\\'];
const FILTERED_BODY =
  '{"query":{"select":["\\\\a\\\\","\\\\b\\\\"],"authorizationFilters":[],"phenotypicClause":{"operator":"AND","not":false,"phenotypicClauses":[{"phenotypicFilterType":"FILTER","conceptPath":"\\\\a\\\\","not":false,"values":["x"]},{"phenotypicFilterType":"FILTER","conceptPath":"\\\\b\\\\","not":false,"min":1,"max":2}]},"genomicFilters":[{"key":"Gene_with_variant","values":["BRCA1"]}],"expectedResultType":"DATAFRAME","picsureId":null,"id":null}}';
const FILTERED_INSTANCE_BODY =
  '{"query":{"select":["\\\\a\\\\","\\\\b\\\\"],"authorizationFilters":[],"phenotypicClause":{"type":"PhenotypicSubquery","operator":"AND","not":false,"phenotypicClauses":[{"type":"PhenotypicFilter","phenotypicFilterType":"FILTER","conceptPath":"\\\\a\\\\","not":false,"values":["x"]},{"type":"PhenotypicFilter","phenotypicFilterType":"FILTER","conceptPath":"\\\\b\\\\","not":false,"min":1,"max":2}]},"genomicFilters":[{"key":"Gene_with_variant","values":["BRCA1"]}],"expectedResultType":"DATAFRAME","picsureId":null,"id":null}}';

const SELECT = ['\\a\\', '\\b\\'];

function clause(): PhenotypicClause {
  return {
    type: 'PhenotypicSubquery',
    operator: 'AND',
    not: false,
    phenotypicClauses: [
      {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'FILTER',
        conceptPath: '\\a\\',
        not: false,
        values: ['x'],
      },
      {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'FILTER',
        conceptPath: '\\b\\',
        not: false,
        min: 1,
        max: 2,
      },
    ],
  };
}

function genomicFilters() {
  return [{ key: 'Gene_with_variant', values: ['BRCA1'] }];
}

function filtered(query: QueryV3): QueryV3 {
  query.select = [...SELECT];
  query.phenotypicClause = clause();
  query.genomicFilters = genomicFilters();
  query.expectedResultType = 'DATAFRAME';
  return query;
}

function sampled(query: QueryV3): QueryV3 {
  query.sample = true;
  return query;
}

function withSample(body: string): string {
  return body.replace(/\}\}$/, ',"sample":true}}');
}

/** Serializes the body the save dataset step posts from the export stepper state. */
function saveDatasetBody(): string {
  return JSON.stringify(buildSaveDatasetRequest());
}

/** Serializes the body the review step posts for its cross count of the given concepts. */
function reviewStepBody(conceptPaths: string[]): string {
  return JSON.stringify(buildCrossCountRequest(getQueryRequest(), conceptPaths));
}

/** Gives the cross count body expected for the genomic concepts under a request body's filters. */
function crossCountOf(body: string): string {
  const expected = JSON.parse(body);
  expected.query.select = GENOMIC_CONCEPTS;
  expected.query.expectedResultType = 'CROSS_COUNT';
  return JSON.stringify(expected);
}

describe('sample flag on the wire', () => {
  beforeEach(() => {
    resetExportStepperState();
  });

  describe('query builder requests', () => {
    it('sends no sample key for a default query', () => {
      expect(JSON.stringify(getBlankQueryRequestV3())).toBe(BLANK_BODY);
      expect(JSON.stringify(getQueryRequestV3())).toBe(BLANK_BODY);
      expect(JSON.stringify(getBlankQueryRequestV3('DATAFRAME', filtered))).toBe(FILTERED_BODY);
      expect(getBlankQueryRequestV3().query).not.toHaveProperty('sample');
    });

    it('sends sample true when the query is a sample', () => {
      const body = JSON.stringify(getBlankQueryRequestV3('COUNT', sampled));

      expect(body).toBe(withSample(BLANK_BODY));
      expect(JSON.parse(body).query.sample).toBe(true);
      expect(JSON.stringify(getQueryRequestV3('COUNT', sampled))).toBe(withSample(BLANK_BODY));
    });

    it('sends no sample key for a request built from a descriptor', () => {
      const descriptor = {
        isOpenAccess: true,
        phenotypicClause: clause(),
        genomicFilters: genomicFilters(),
      };
      const select = (query: QueryV3) => {
        query.select = [...SELECT];
        return query;
      };

      const body = JSON.stringify(
        buildQueryRequestV3FromDescriptor(descriptor, 'DATAFRAME', select),
      );
      const sampleBody = JSON.stringify(
        buildQueryRequestV3FromDescriptor(descriptor, 'DATAFRAME', (query) =>
          sampled(select(query)),
        ),
      );

      expect(body).toBe(FILTERED_BODY);
      expect(sampleBody).toBe(withSample(FILTERED_BODY));
    });

    it('sends no sample key from the patient count provider on the open route', () => {
      const provider = resultProviders['query:patientCount'];
      const open = { isOpenAccess: true, phenotypicClause: null, genomicFilters: [] };

      expect(JSON.stringify(provider.buildRequest(open))).toBe(BLANK_CROSS_COUNT_BODY);
      expect(JSON.stringify(provider.buildRequest({ ...open, isOpenAccess: false }))).toBe(
        BLANK_BODY,
      );
    });
  });

  describe('a QueryV3 instance posted directly', () => {
    it('sends no sample key for a default query', () => {
      expect(JSON.stringify({ query: new QueryV3() })).toBe(BLANK_BODY);
      expect(JSON.stringify({ query: filtered(new QueryV3()) })).toBe(FILTERED_INSTANCE_BODY);
    });

    it('sends sample true and keeps the in-memory value a boolean', () => {
      const query = sampled(filtered(new QueryV3()));

      expect(JSON.stringify({ query })).toBe(withSample(FILTERED_INSTANCE_BODY));
      expect(query.sample).toBe(true);
      expect(new QueryV3().sample).toBe(false);
      expect(new QueryV3(new QueryV3().toJSON()).sample).toBe(false);
    });

    it('sends no sample key from the review step cross count', () => {
      expect(reviewStepBody([])).toBe(BLANK_CROSS_COUNT_BODY);

      setQueryRequest(getBlankQueryRequestV3('DATAFRAME', filtered));
      expect(reviewStepBody(GENOMIC_CONCEPTS)).toBe(crossCountOf(FILTERED_BODY));

      setQueryRequest(getBlankQueryRequestV3('DATAFRAME', (query) => sampled(filtered(query))));
      expect(reviewStepBody(GENOMIC_CONCEPTS)).toBe(crossCountOf(withSample(FILTERED_BODY)));
    });

    it('leaves the stepper request untouched when building the cross count', () => {
      setQueryRequest(getBlankQueryRequestV3('DATAFRAME', filtered));

      reviewStepBody(GENOMIC_CONCEPTS);

      expect(JSON.stringify(getQueryRequest())).toBe(FILTERED_BODY);
    });
  });

  describe('the export stepper snapshot posted by the save dataset step', () => {
    it('sends no sample key for the initial and the reset state', () => {
      expect(saveDatasetBody()).toBe(BLANK_BODY);

      setQueryRequest(getBlankQueryRequestV3('DATAFRAME', filtered));
      resetExportStepperState();

      expect(saveDatasetBody()).toBe(BLANK_BODY);
    });

    it('sends no sample key for a built request', () => {
      setQueryRequest(getBlankQueryRequestV3('DATAFRAME', filtered));

      expect(saveDatasetBody()).toBe(FILTERED_BODY);
    });

    it('drops a sample false that was set on the plain state object', () => {
      setQueryRequest(getBlankQueryRequestV3('DATAFRAME', filtered));
      getQueryRequest().query.sample = false;

      expect(saveDatasetBody()).toBe(FILTERED_BODY);
    });

    it('sends sample true when it was set on the plain state object', () => {
      setQueryRequest(getBlankQueryRequestV3('DATAFRAME', filtered));
      getQueryRequest().query.sample = true;

      expect(saveDatasetBody()).toBe(withSample(FILTERED_BODY));
    });

    it('puts the system fields before and the exports after the selected columns', () => {
      setQueryRequest(getBlankQueryRequestV3('DATAFRAME', filtered));
      getQueryRequest().query.sample = false;

      const request = buildSaveDatasetRequest(['\\_consents\\'], ['\\c\\']);

      expect(request.query.select).toEqual(['\\_consents\\', ...SELECT, '\\c\\']);
      expect(request.query).not.toHaveProperty('sample');
      expect(getQueryRequest().query.select).toEqual(SELECT);
    });
  });

  describe('toWireQuery', () => {
    it('keeps sample only when it is the boolean true', () => {
      expect(toWireQuery({ id: 1, sample: false })).toEqual({ id: 1 });
      expect(toWireQuery({ id: 1, sample: 'true' })).toEqual({ id: 1 });
      expect(toWireQuery<{ id: number; sample?: boolean }>({ id: 1 })).toEqual({ id: 1 });
      expect(toWireQuery({ id: 1, sample: true })).toEqual({ id: 1, sample: true });
    });

    it('leaves its argument untouched', () => {
      const query = { id: 1, sample: false };

      toWireQuery(query);

      expect(query).toEqual({ id: 1, sample: false });
    });
  });
});
