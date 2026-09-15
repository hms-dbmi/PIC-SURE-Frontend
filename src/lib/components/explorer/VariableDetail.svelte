<script lang="ts">
  import { page } from '$app/state';

  import { config } from '$lib/configuration.svelte';
  import { searchRoute, searchSectionRoot, withSearchTerm } from '$lib/explorer/searchChrome';
  import type { VariableKey } from '$lib/explorer/variableUrl';
  import { getConceptDetails } from '$lib/stores/Dictionary';
  import { searchTerm } from '$lib/stores/Search';

  import AngleButton from '$lib/components/buttons/AngleButton.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import HierarchyComponent from '$lib/components/explorer/HierarchyComponent.svelte';
  import ResultInfoComponent from '$lib/components/explorer/ResultInfoComponent.svelte';

  // One variable's page, shared by the Explore and Discover routes so both are thin wrappers
  // - which is what keeps the stigmatising-filter `beforeNavigate` guard in
  // `(picsure)/+layout.svelte` matching on pathname as it does for every other route.
  let { variableKey }: { variableKey?: VariableKey } = $props();

  // Back returns to the section the user searched in, carrying the term so the address bar
  // agrees with the results it lands on. Nothing refetches: the search session belongs to the
  // /explorer and /discover layouts, which this page renders inside of.
  const section = $derived(searchRoute(page.url.pathname).section ?? 'explorer');
  const backHref = $derived(withSearchTerm(searchSectionRoot(section), $searchTerm));

  const detailPromise = $derived(
    variableKey ? getConceptDetails(variableKey.conceptPath, variableKey.dataset) : undefined,
  );
</script>

<div data-testid="variable-detail" class="flex flex-col gap-4">
  <div>
    <AngleButton href={backHref} data-testid="variable-detail-back">
      Back to Search Results
    </AngleButton>
  </div>

  {#if !variableKey}
    <ErrorAlert data-testid="variable-detail-error" title="We could not read that variable link">
      <p class="m-0">
        This address is missing the information needed to look a variable up. Go back to the search
        results and open the variable from there.
      </p>
    </ErrorAlert>
  {:else}
    {#await detailPromise}
      <Loading ring size="medium" label="Loading variable" />
    {:then variable}
      <header data-testid="variable-identity" class="flex flex-col gap-1">
        <h1 data-testid="variable-detail-name" class="h4 font-bold m-0">
          {variable?.display || variable?.name}
        </h1>
        <div class="flex flex-wrap items-center gap-3">
          <span data-testid="variable-detail-study">
            {variable?.studyAcronym || variable?.dataset}
          </span>
          {#if variable?.type}
            <span
              data-testid="variable-detail-type"
              class="badge preset-tonal-surface border border-surface-500 font-normal"
            >
              {variable.type}
            </span>
          {/if}
        </div>
      </header>

      <section data-testid="variable-detail-information">
        <ResultInfoComponent data={variable} />
      </section>

      {#if config.features.explorer.enableHierarchy}
        <section data-testid="variable-detail-hierarchy" class="flex flex-col gap-2">
          <h2 class="h5 text-primary-500 m-0">Data Hierarchy</h2>
          <HierarchyComponent data={variable} />
        </section>
      {/if}
    {:catch}
      <!-- A key that decoded cleanly but that the dictionary does not know: a variable that
           has been re-indexed away, a hand-edited URL, or the dictionary being down. -->
      <ErrorAlert data-testid="variable-detail-error" title="We could not find that variable">
        <p class="m-0">
          Nothing in the data dictionary matches this address. It may have changed since the link
          was made. Go back to the search results and try again.
        </p>
      </ErrorAlert>
    {/await}
  {/if}
</div>
