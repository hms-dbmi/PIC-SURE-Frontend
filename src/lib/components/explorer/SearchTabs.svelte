<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';

  import { showsSearchChrome } from '$lib/explorer/searchChrome';
  import { enabledSearchModes, searchModeHref } from '$lib/explorer/searchModes';
  import { searchTerm } from '$lib/stores/Search';
  import { log, createLog } from '$lib/logger';

  // Rendered by the /explorer and /discover layouts. Everything it needs comes from the URL,
  // so it decides for itself whether to show rather than making each layout ask.
  const pathname = $derived(page.url.pathname);
  const modes = $derived(enabledSearchModes(pathname));

  // One mode is nothing to switch between: no bar on Discover, and none on an Explore
  // deployment with genomic search turned off.
  const visible = $derived(showsSearchChrome(pathname) && modes.length > 1);
</script>

{#if visible}
  <!-- A navigation landmark, not a tab widget: these are routes, and there is no tabpanel
       for role="tab" to control. It needs an accessible name because the main navigation is
       another nav landmark on the same page. -->
  <nav
    id="search-mode-tabs"
    data-testid="search-mode-tabs"
    aria-label="Search modes"
    class="flex gap-2 mx-6 mt-8 border-b border-surface-300-700"
  >
    {#each modes as mode (mode.id)}
      {@const active = mode.isActive(pathname)}
      <!-- An anchor, not a button: these are routes, so middle-click, Copy Link and the
           browser back button all have to work. -->
      <a
        id="search-mode-tab-{mode.id}"
        data-testid="search-mode-tab-{mode.id}"
        href={resolve(searchModeHref(mode, $searchTerm) as '/')}
        aria-current={active ? 'page' : undefined}
        class="px-4 py-2 -mb-px border-b-2 {active
          ? 'border-surface-950-50 font-bold'
          : 'border-transparent opacity-60 hover:opacity-100'}"
        onclick={() =>
          log(createLog('NAVIGATION', 'explorer.search_mode_click', { mode: mode.id }))}
      >
        {mode.label}
      </a>
    {/each}
  </nav>
{/if}
