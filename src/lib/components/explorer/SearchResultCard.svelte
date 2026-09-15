<script lang="ts">
  import { resolve } from '$app/paths';

  import type { SearchSection } from '$lib/explorer/searchChrome';
  import { variableDetailHref } from '$lib/explorer/variableUrl';
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
    /**
     * The term the results on screen came from. It rides on the detail URL so a copied link
     * keeps the search and Back to Search Results lands on populated results.
     */
    searchTerm?: string;
  }

  let { result, section, searchTerm = '' }: Props = $props();

  // `display` is the human-readable label and `name` the accession; a concept has at least
  // one of them. Same precedence as the detail page's heading.
  const variableName = $derived(result.display || result.name);

  /**
   * The description, when the dictionary has a usable one.
   *
   * Trimmed before the emptiness test, because a description of only whitespace would
   * otherwise render as a bold nothing followed by the name in parentheses - the exact shape
   * the "no description" case exists to avoid.
   */
  const description = $derived(result.description?.trim() || '');

  const study = $derived(result.studyAcronym || result.dataset);

  // The URL shape belongs to variableUrl.ts, which is the single seam a later ticket swaps
  // for dictionary slugs, and which applies the same rule the route loader applies on
  // arrival. Not assembled here, and `undefined` when that rule refuses this variable's
  // dataset - see the unopenable branch below.
  const detailPath = $derived(variableDetailHref(section, result, searchTerm));

  function onclick() {
    log(
      createLog('ACTION', 'search_result.card_click', {
        variable: variableName,
        conceptPath: result.conceptPath,
        pageContext: getPageContext(),
      }),
    );
  }
</script>

{#snippet content()}
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
{/snippet}

{#if detailPath}
  <a
    href={resolve(detailPath as '/')}
    {onclick}
    data-testid="search-result-card"
    class="result-card card block border bg-white border-surface-200-800 rounded-xl px-5 py-4 shadow-sm"
  >
    {@render content()}
  </a>
{:else}
  <!-- The detail page is the only way into a variable now, and this one has a dataset the
       route will not act on, so there is nothing to link to. Said on the card rather than
       left as a link that opens onto "We could not read that variable link": the result is
       real and worth showing, it just cannot be opened. -->
  <div
    data-testid="search-result-card"
    data-unopenable="true"
    class="card block border bg-white border-surface-200-800 rounded-xl px-5 py-4 shadow-sm"
  >
    {@render content()}
    <span data-testid="search-result-card-unopenable" class="block mt-1 text-sm text-error-500">
      This variable cannot be opened.
    </span>
  </div>
{/if}

<style>
  /* The whole card is the link, so it must not read as body text.

     Same shape as the clickable table rows this replaced (app.css, .table.clickable: a
     background change on hover, and an outline on focus because the rows were focused
     programmatically). Deliberately not the same value: the rows used --color-surface-300,
     these use --color-surface-200, which holds 6.2:1 against body text where the rows held
     4.5:1. Do not "restore" it to match the table. */
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
