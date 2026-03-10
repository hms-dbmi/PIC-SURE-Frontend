<script lang="ts">
  import {
    QueryV3,
    type QueryInterfaceV3,
    type PhenotypicFilterInterface,
    type PhenotypicClause,
    type GenomicFilterInterfacev3,
    Operator,
  } from '$lib/models/query/Query';
  import {
    type Filter,
    type FilterInterface,
    createFilterGroup,
    createGenomicFilter,
    createCategoricalFilter,
    createRequiredFilter,
    createNumericFilter,
    createAnyRecordOfFilter,
  } from '$lib/models/Filter';
  import { LogicTree } from '$lib/models/LogicTree.svelte';
  import type { SearchResult } from '$lib/models/Search';
  import { QueryVersion } from '$lib/models/Dataset';
  import { getConceptDetails } from '$lib/stores/Dictionary';
  import { createGroup } from '$lib/stores/Filter';

  import FiltersSummary from '$lib/components/query/FiltersSummary.svelte';
  import SelectedVariablesSummary from '$lib/components/query/SelectedVariablesSummary.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';

  let { query, uuid }: { query: QueryV3; uuid: string } = $props();

  async function phenotypicFilterToFilter(pf: PhenotypicFilterInterface): Promise<Filter> {
    const dataset = pf.conceptPath.split('\\').filter(Boolean)[0] || pf.conceptPath;
    const raw = await getConceptDetails(pf.conceptPath, dataset).catch((err) => {
      console.error(err);
      return {} as SearchResult;
    });
    const searchResult: SearchResult = {
      conceptPath: pf.conceptPath,
      dataset,
      name: raw?.name || '',
      display: raw?.display || '',
      studyAcronym: raw?.studyAcronym || '',
      description: raw?.description || '',
      allowFiltering: raw?.allowFiltering || false,
      type:
        pf.min !== undefined || pf.max !== undefined
          ? 'Continuous'
          : pf.phenotypicFilterType === 'ANY_RECORD_OF'
            ? 'AnyRecordOf'
            : 'Categorical',
    };

    if (pf.phenotypicFilterType === 'ANY_RECORD_OF') {
      return createAnyRecordOfFilter(searchResult, { ...searchResult, children: [searchResult] });
    }
    if (pf.phenotypicFilterType === 'REQUIRED') {
      return createRequiredFilter(searchResult);
    }
    if (pf.min !== undefined || pf.max !== undefined) {
      return createNumericFilter(searchResult, pf.min?.toString(), pf.max?.toString());
    }
    return createCategoricalFilter(searchResult, pf.values);
  }

  async function clauseToFilterNode(clause: PhenotypicClause): Promise<Filter> {
    if (clause.type === 'PhenotypicSubquery') {
      const children = await Promise.all(clause.phenotypicClauses.map(clauseToFilterNode));
      return createFilterGroup(children, clause.operator);
    }
    if (clause.type === 'PhenotypicFilter') {
      return phenotypicFilterToFilter(clause);
    }
    return Promise.reject('invalid clause type ' + JSON.stringify(clause));
  }

  async function queryToFilterTree(query: QueryInterfaceV3): Promise<LogicTree<FilterInterface>> {
    const tree = new LogicTree<FilterInterface>(createGroup);

    if (!query.phenotypicClause) return tree;

    const clause = query.phenotypicClause;
    if (clause.type === 'PhenotypicFilter') {
      tree.add(await phenotypicFilterToFilter(clause));
    } else {
      const nodes =
        clause.operator === Operator.AND
          ? await Promise.all(clause.phenotypicClauses.map(clauseToFilterNode))
          : [await clauseToFilterNode(clause)];
      tree.add(...nodes);
    }
    return tree;
  }

  function genomicV3ToFilter(gf: GenomicFilterInterfacev3): Filter {
    const geneFilter: {
      Gene_with_variant?: string[];
      Variant_consequence_calculated?: string[];
      Variant_frequency_as_text?: string[];
      min?: string;
      max?: string;
    } = {};

    if (gf.values) {
      if (gf.key === 'Gene_with_variant') geneFilter.Gene_with_variant = gf.values;
      else if (gf.key === 'Variant_consequence_calculated')
        geneFilter.Variant_consequence_calculated = gf.values;
      else if (gf.key === 'Variant_frequency_as_text')
        geneFilter.Variant_frequency_as_text = gf.values;
    }
    if (gf.min !== undefined) geneFilter.min = gf.min.toString();
    if (gf.max !== undefined) geneFilter.max = gf.max.toString();

    return createGenomicFilter(geneFilter);
  }

  let filterTree: LogicTree<FilterInterface> = $state(new LogicTree<FilterInterface>(createGroup));
  let filters: Filter[] = $state([]);
  let genomicFilters: Filter[] = $state([]);

  async function loadFilters() {
    filterTree = await queryToFilterTree(query).catch((err) => {
      console.log(err);
      return filterTree;
    });
    filters = filterTree.leafNodes as Filter[];
    genomicFilters = query.genomicFilters.map(genomicV3ToFilter);
  }
</script>

{#await loadFilters()}
  <Loading />
{:then}
  <section id="detail-filters-container" class="my-4">
    <h2 class="text-left h4 mb-2 mt-6">Filters Applied</h2>
    <FiltersSummary version={QueryVersion.V3} {filterTree} {filters} {genomicFilters} />
  </section>
{:catch}
  <ErrorAlert title="API Error">
    An error occured while retrieving information for a filter in the saved dataset {uuid}.
  </ErrorAlert>
{/await}

<SelectedVariablesSummary paths={query.select} />
