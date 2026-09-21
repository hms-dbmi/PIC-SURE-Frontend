<script lang="ts">
  import { config } from '$lib/configuration.svelte';
  import type { SearchSection, VariableKey } from '$lib/explorer/variableUrl';
  import type { SearchResult } from '$lib/models/Search';
  import { getConceptDetails } from '$lib/stores/Dictionary';

  import AngleButton from '$lib/components/buttons/AngleButton.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import HierarchyComponent from '$lib/components/explorer/HierarchyComponent.svelte';
  import ResultInfoComponent from '$lib/components/explorer/ResultInfoComponent.svelte';

  // One variable's page, shared by the Explore and Discover routes so both are thin wrappers
  // - which is what keeps the stigmatising-filter `beforeNavigate` guard in
  // `(picsure)/+layout.svelte` matching on pathname as it does for every other route. Each
  // route knows which section it is, so it says so rather than the page reading it back off
  // the pathname.
  let { section, variableKey }: { section: SearchSection; variableKey?: VariableKey } = $props();

  // Back returns to the section the user searched in. Nothing refetches: the search session
  // belongs to the /explorer and /discover layouts, which this page renders inside of.
  const backHref = $derived(`/${section}`);

  // A 200 is not proof of a concept: `handleResponse` returns body text when the body will
  // not parse as JSON, and `{}` parses fine. Either would render an empty heading over an
  // information card that cannot load, so both count as the lookup failing.
  function isConcept(response: unknown): response is SearchResult {
    const concept = response as SearchResult | undefined;
    return Boolean(concept?.conceptPath && concept?.dataset);
  }

  // `undefined` while loading. Held here rather than in an `{#await}` so the rest of the page
  // can derive from the loaded concept.
  let variable: SearchResult | undefined = $state();
  let failed = $state(false);

  $effect(() => {
    const key = variableKey;
    variable = undefined;
    failed = false;
    if (!key) return;
    // Navigating variable to variable keeps this component mounted, so a slow first load must
    // not overwrite a fast second one.
    let current = true;
    getConceptDetails(key.conceptPath, key.dataset).then(
      (response) => {
        if (!current) return;
        if (isConcept(response)) variable = response;
        else failed = true;
      },
      () => {
        if (current) failed = true;
      },
    );
    return () => {
      current = false;
    };
  });
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
  {:else if failed}
    <!-- A key that decoded cleanly but that the dictionary does not know: a variable that
         has been re-indexed away, a hand-edited URL, or the dictionary being down. -->
    <ErrorAlert data-testid="variable-detail-error" title="We could not find that variable">
      <p class="m-0">
        Nothing in the data dictionary matches this address. It may have changed since the link was
        made. Go back to the search results and try again.
      </p>
    </ErrorAlert>
  {:else if !variable}
    <Loading ring size="medium" label="Loading variable" />
  {:else}
    <header data-testid="variable-identity" class="flex flex-col gap-1">
      <h1 data-testid="variable-detail-name" class="h4 font-bold m-0">
        {variable.display || variable.name}
      </h1>
      <div class="flex flex-wrap items-center gap-3">
        <span data-testid="variable-detail-study">
          {variable.studyAcronym || variable.dataset}
        </span>
        {#if variable.type}
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
  {/if}
</div>
