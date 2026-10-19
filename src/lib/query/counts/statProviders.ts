import { config } from '#lib/config/config.svelte.ts';
import { searchConcepts, searchFacets } from '#lib/api/picsure/dictionary.ts';

import {
  appendClauses,
  type ExpectedResultType,
  type PhenotypicFilter,
  type Query,
} from '#lib/query/query.ts';
import type { DictionarySearchRequest } from '#lib/api/picsure/dictionary.types.ts';
import type { StatConfig, StatField } from '#lib/config/index.ts';
import type { CountValue } from '#lib/query/counts/format.ts';
import {
  parsePatientCount,
  patientCountRequest,
  type CountProvider,
  type QueryCountProvider,
} from '#lib/query/counts/providers.ts';
import type { QueryDescriptor } from '#lib/query/descriptor.svelte.ts';

import { addConsents } from '#lib/explorer/Dictionary.ts';
import { buildRequest } from '#lib/query/build.ts';
import { useOpenAccess } from '#lib/explorer/mode.ts';

/** A configured stat, for signed-in users (`auth`) or for everyone. */
export interface StatEntry {
  key: string;
  label: string;
  auth: boolean;
  provider: CountProvider;
}

function getStatFields(key: string): StatField[] {
  const statKeys = config.branding.statFields ? Object.keys(config.branding.statFields) : [];
  return statKeys.includes(key) ? config.branding.statFields[key] : [];
}

function dictionaryRequest(isOpenAccess: boolean = false): Promise<DictionarySearchRequest> {
  const request: DictionarySearchRequest = { facets: [], search: '', consents: [] };
  return !isOpenAccess ? addConsents(request) : Promise.resolve(request);
}

function facetCategoryCount(category: string): CountProvider {
  return {
    id: `dict:facets:${category}`,
    async fetch({ isOpenAccess }) {
      const facetCategories = await searchFacets(await dictionaryRequest(isOpenAccess));
      const facetCat = facetCategories.find((facetCat) => facetCat.name === category);
      if (!facetCat) return 0;
      if (isOpenAccess) return facetCat.facets.length;
      return facetCat.facets.filter((facet) => facet.count > 0).length;
    },
  };
}

const conceptCount: CountProvider = {
  id: 'dict:concepts',
  async fetch({ isOpenAccess }) {
    const request = await dictionaryRequest(isOpenAccess);
    const res = await searchConcepts(request, { pageNumber: 1, pageSize: 1 });
    if (res.totalElements === undefined || res.totalElements === null) {
      throw new Error('total not found');
    }
    return res.totalElements;
  },
};

// `edit` runs when the request is built, so a stat whose fields aren't configured fails then.
function queryStat(
  id: string,
  resultType: ExpectedResultType,
  edit?: () => (query: Query) => Query,
): QueryCountProvider {
  return {
    id,
    openEndpoint: ({ isOpenAccess }) => useOpenAccess(isOpenAccess),
    buildRequest: (descriptor) => buildRequest(descriptor, resultType, edit?.()),
    parse: (raw) => raw as CountValue,
  };
}

function crossCounts(key: string, resultType: ExpectedResultType) {
  return queryStat(key, resultType, () => {
    const fields = getStatFields(key).map((f) => f.conceptPath);
    if (fields.length === 0) throw new Error(`${key} feilds were not configured`);
    return (query) => {
      query.select = fields;
      return query;
    };
  });
}

const consentCount = queryStat('query:consent', 'COUNT', () => {
  const fields = getStatFields('query:consent');
  if (fields.length === 0) throw new Error('consent feilds were not configured');

  const categoryMap: Record<string, string[]> = {};
  for (const field of fields) {
    (categoryMap[field.conceptPath] ??= []).push(field.id);
  }
  const clauses = Object.entries(categoryMap).map(
    ([conceptPath, values]): PhenotypicFilter => ({
      type: 'PhenotypicFilter',
      phenotypicFilterType: 'FILTER',
      conceptPath,
      not: false,
      values,
    }),
  );
  return (query) => {
    query.phenotypicClause = appendClauses(query.phenotypicClause, clauses);
    return query;
  };
});

// Unlike the results panel's count, the landing page's open patient count always asks the
// open endpoint, even when explore-without-login sends other open requests to the auth one.
const patientCount: QueryCountProvider = {
  id: 'landing:patientCount',
  openEndpoint: (descriptor: QueryDescriptor) => descriptor.isOpenAccess,
  buildRequest: patientCountRequest,
  parse: parsePatientCount,
};

const providers: Record<string, CountProvider> = {
  'dict:facets:dataset_id': facetCategoryCount('dataset_id'),
  'dict:concepts': conceptCount,
  'query:blank': queryStat('query:blank', 'COUNT'),
  'query:biosample': crossCounts('query:biosample', 'OBSERVATION_CROSS_COUNT'),
  'query:genomic': crossCounts('query:genomic', 'CROSS_COUNT'),
  'query:consent': consentCount,
  'query:patientCount': patientCount,
};

export function statProvider(stat: StatConfig): CountProvider | undefined {
  if (stat.key === 'hardcoded') {
    const value = (stat.value as CountValue) || 0;
    // The value is part of the id, so two hardcoded stats never share a cached result.
    return { id: `hardcoded:${JSON.stringify(value)}`, fetch: async () => value };
  }
  return providers[stat.key];
}

/**
 * The stats to show: each known stat once for signed-in users and once for everyone, unless
 * its `auth` flag picks one. The open entries need open login.
 */
export function statEntries(
  list: StatConfig[],
  { loggedIn, loginOpen }: { loggedIn: boolean; loginOpen: boolean },
): StatEntry[] {
  return list.flatMap((stat) => {
    const provider = statProvider(stat);
    if (!provider) return [];
    const { key, label } = stat;
    const entries: StatEntry[] = [];
    if ((stat.auth ?? true) && loggedIn) entries.push({ key, label, auth: true, provider });
    if (loginOpen && !(stat.auth ?? false)) entries.push({ key, label, auth: false, provider });
    return entries;
  });
}
