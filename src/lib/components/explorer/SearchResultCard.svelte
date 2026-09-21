<script lang="ts">
  import { resolve } from '$app/paths';

  import { variableDetailHref, type SearchSection } from '$lib/explorer/variableUrl';
  import { log, createLog, getPageContext } from '$lib/logger';
  import type { SearchResult } from '$lib/models/Search';

  /**
   * One search result, as a single click target that opens the variable's detail page.
   *
   * An anchor rather than a clickable row: it is focusable, Enter-activatable, middle- and
   * modifier-clickable and offers Copy Link Address, all without this component implementing
   * any of it. The result carries no action buttons - Info, Filter, Hierarchy and Add for
   * Analysis all live on the detail page - so there is nothing inside the card competing for
   * the click.
   */
  interface Props {
    result: SearchResult;
    section: SearchSection;
  }

  let { result, section }: Props = $props();

  // `display` is the human-readable label and `name` the accession; a concept has at least
  // one of them. Same precedence as the detail page's heading.
  const variableName = $derived(result.display || result.name);

  const description = $derived(result.description || '');

  const study = $derived(result.studyAcronym || result.dataset);

  // The URL shape belongs to variableUrl.ts, which is the single seam a later ticket swaps
  // for dictionary slugs. Not assembled here.
  const detailPath = $derived(variableDetailHref(section, result));

  // The event the results row logged on a click, with the same `variable` it carried.
  function onclick() {
    log(
      createLog('ACTION', 'search_result.row_click', {
        variable: result.conceptPath,
        pageContext: getPageContext(),
      }),
    );
  }
</script>

<a
  href={resolve(detailPath as '/')}
  {onclick}
  data-testid="search-result-card"
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
  </span>
</a>

<style>
  /* The whole card is the link, so it must not read as body text. The hover and focus
     treatment is the one the clickable table rows used (app.css, .table.clickable), so a
     result still highlights the same way it did as a row. */
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
