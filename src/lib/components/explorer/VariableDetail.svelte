<script lang="ts">
  import { isHttpError } from '@sveltejs/kit';

  import { config } from '$lib/configuration.svelte';
  import {
    searchSectionRoot,
    withSearchTerm,
    type SearchSection,
  } from '$lib/explorer/searchChrome';
  import type { VariableKey } from '$lib/explorer/variableUrl';
  import type { SearchResult } from '$lib/models/Search';
  import { getConceptDetails } from '$lib/stores/Dictionary';
  import { searchTerm } from '$lib/stores/Search';

  import AngleButton from '$lib/components/buttons/AngleButton.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import HierarchyComponent from '$lib/components/explorer/HierarchyComponent.svelte';
  import ResultInfoComponent from '$lib/components/explorer/ResultInfoComponent.svelte';

  // One variable's page, shared by the Explore and Discover routes so the page exists once
  // rather than twice.
  //
  // `section` is passed in rather than read off the pathname. Each route knows which section
  // it is, so the invariant is enforced by the type instead of by a cast or a fallback -
  // either of which would have turned a wrong section into a `/undefined` Back link or a
  // Discover user quietly sent to Explore.
  let { section, variableKey }: { section: SearchSection; variableKey?: VariableKey } = $props();

  const SECTION_LABEL: Record<SearchSection, string> = {
    explorer: 'Explorer',
    discover: 'Discover',
  };

  // Back returns to the section the user searched in, carrying the term so the address bar
  // agrees with the results it lands on. Nothing refetches: the search session belongs to the
  // /explorer and /discover layouts, which this page renders inside of.
  const backHref = $derived(withSearchTerm(searchSectionRoot(section), $searchTerm));

  /**
   * Every way this page can end up, resolved in one place.
   *
   * A 200 is not proof of a concept: `handleResponse` returns body text when the body will
   * not parse as JSON, so a proxy or WAF interstitial resolves successfully, and so does
   * `{}`. Rendering either gives an empty heading and hands `ResultInfoComponent` a result
   * with no concept path, whose own `{#await}` has no catch - a card that spins forever.
   * Mapping every outcome to one of these means the template has a branch per outcome and no
   * way to fall through to a blank page.
   */
  type Outcome =
    | { kind: 'variable'; variable: SearchResult }
    | { kind: 'unreadable' }
    | { kind: 'missing' }
    | { kind: 'unavailable' };

  function isConcept(response: unknown): response is SearchResult {
    const concept = response as SearchResult | undefined;
    return Boolean(concept?.conceptPath && concept?.dataset);
  }

  async function loadVariable(key: VariableKey): Promise<Outcome> {
    try {
      const response = await getConceptDetails(key.conceptPath, key.dataset);
      if (isConcept(response)) return { kind: 'variable', variable: response };
      // An object without the key fields is the dictionary saying it holds nothing for this
      // key. Anything that is not an object is not the dictionary answering at all.
      return typeof response === 'object' ? { kind: 'missing' } : { kind: 'unavailable' };
    } catch (error) {
      // Only a 404 means the key is stale. A 500, a gateway timeout and an expired session
      // all land here too, and telling those users their link is broken sends them away
      // retrying instead of reporting an outage.
      return isHttpError(error, 404) ? { kind: 'missing' } : { kind: 'unavailable' };
    }
  }

  // `undefined` is the loading state. Loaded here rather than with `{#await}` so the document
  // title has one home: two `<svelte:head>` blocks would put two `<title>` elements in the
  // head and the browser would take the wrong one.
  let outcome: Outcome | undefined = $state();

  $effect(() => {
    const key = variableKey;
    if (!key) {
      outcome = { kind: 'unreadable' };
      return;
    }
    outcome = undefined;
    // Navigating variable to variable keeps this component mounted, so a slow first load
    // must not overwrite a fast second one.
    let current = true;
    loadVariable(key).then((result) => {
      if (current) outcome = result;
    });
    return () => {
      current = false;
    };
  });

  // The variable's own name, so a shared link, a browser tab and a bookmark all say which
  // variable rather than only which section.
  const documentTitle = $derived.by(() => {
    const name =
      outcome?.kind === 'variable'
        ? outcome.variable.display || outcome.variable.name
        : SECTION_LABEL[section];
    return `${config.branding.applicationName} | ${name}`;
  });
</script>

{#snippet errorAlert(heading: string, body: string)}
  <ErrorAlert data-testid="variable-detail-error" title={heading}>
    <p class="m-0">{body}</p>
  </ErrorAlert>
{/snippet}

<svelte:head>
  <title>{documentTitle}</title>
</svelte:head>

<div data-testid="variable-detail" class="flex flex-col gap-4">
  <div>
    <AngleButton href={backHref} data-testid="variable-detail-back">
      Back to Search Results
    </AngleButton>
  </div>

  {#if !outcome}
    <Loading ring size="medium" label="Loading variable" />
  {:else if outcome.kind === 'variable'}
    {@const variable = outcome.variable}
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
      <!-- h3 to sit level with ResultInfoComponent's own section headings. The jump from h1
           to h3 is that component's, and ticket 14 reshapes it. -->
      <section data-testid="variable-detail-hierarchy" class="flex flex-col gap-2">
        <h3 class="h5 text-primary-500 m-0">Data Hierarchy</h3>
        <HierarchyComponent data={variable} />
      </section>
    {/if}
  {:else if outcome.kind === 'unreadable'}
    {@render errorAlert(
      'We could not read that variable link',
      'This address does not name a variable we can look up. Go back to the search results and open the variable from there.',
    )}
  {:else if outcome.kind === 'missing'}
    {@render errorAlert(
      'We could not find that variable',
      'Nothing in the data dictionary matches this address. The variable may have been renamed or removed since the link was made. Go back to the search results and look for it there.',
    )}
  {:else}
    {@render errorAlert(
      'We could not load that variable',
      'Something went wrong reaching the data dictionary, so this is most likely not a problem with your link. Try again in a moment; if the problem persists, please contact an administrator.',
    )}
  {/if}
</div>
