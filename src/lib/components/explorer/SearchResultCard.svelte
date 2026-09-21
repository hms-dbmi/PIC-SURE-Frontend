<script lang="ts">
  import { resolve } from '$app/paths';

  import { filteringBlocked, isOpenAccess } from '$lib/AccessState';
  import { variableDetailHref, type SearchSection } from '$lib/explorer/variableUrl';
  import { log, createLog, getPageContext } from '$lib/logger';
  import type { SearchResult } from '$lib/models/Search';

  interface Props {
    result: SearchResult;
    section: SearchSection;
  }

  let { result, section }: Props = $props();

  const variableName = $derived(result.display || result.name);

  const description = $derived(result.description || '');

  const study = $derived(result.studyAcronym || result.dataset);

  const detailPath = $derived(variableDetailHref(section, result));

  const openAccess = $derived(isOpenAccess());
  const cannotFilter = $derived(filteringBlocked(result));
  const filterable = $derived(openAccess ? (cannotFilter ? 'false' : 'true') : undefined);

  // Kept as `row_click` though a result is no longer a row: the name is the analytics contract.
  function onclick() {
    log(
      createLog('ACTION', 'search_result.row_click', {
        variable: result.conceptPath,
        pageContext: getPageContext(),
      }),
    );
  }
</script>

<!-- tabindex spelled out: Safari does not Tab to bare links by default. -->
<a
  href={resolve(detailPath as '/')}
  tabindex="0"
  {onclick}
  data-testid="search-result-card"
  data-filterable={filterable}
  class="result-card card block border bg-white border-surface-200-800 rounded-xl px-5 py-4 shadow-sm"
>
  <span class="block">
    {#if description}
      <strong data-testid="search-result-card-description">{description}</strong>
      <span data-testid="search-result-card-name">({variableName})</span>
    {:else}
      <strong data-testid="search-result-card-name">{variableName}</strong>
    {/if}
  </span>
  <span class="flex flex-wrap items-center gap-3 mt-1 text-sm">
    <span data-testid="search-result-card-study">{study}</span>
    {#if result.type}
      <span
        data-testid="search-result-card-type"
        class="badge preset-tonal-surface border border-surface-500 font-normal"
      >
        {result.type}
      </span>
    {/if}
    {#if cannotFilter}
      <span
        data-testid="search-result-card-filtering-unavailable"
        class="badge preset-tonal-warning border border-warning-500 font-normal"
      >
        <i class="fa-solid fa-filter-circle-xmark" aria-hidden="true"></i>
        Filtering is not available for this variable
      </span>
    {/if}
  </span>
</a>

<style>
  /* The whole card is the link, so it must not read as body text. */
  .result-card {
    cursor: pointer;
    color: inherit;
    text-decoration: none;
  }

  .result-card:hover {
    background-color: var(--color-surface-200);
  }

  .result-card:focus-visible {
    background-color: var(--color-surface-200);
    outline: 2px solid var(--color-surface-500);
    outline-offset: -2px;
  }
</style>
