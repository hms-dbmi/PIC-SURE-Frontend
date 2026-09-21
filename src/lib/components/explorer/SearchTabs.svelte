<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';

  import { showsSearchChrome } from '$lib/explorer/searchChrome';
  import { enabledSearchModes } from '$lib/explorer/searchModes';

  const pathname = $derived(page.url.pathname);
  const modes = $derived(enabledSearchModes(pathname));
  const visible = $derived(showsSearchChrome(pathname) && modes.length > 1);
</script>

{#if visible}
  <!-- A navigation landmark, not a tab widget: these are routes, and there is no tabpanel
       for role="tab" to control. Named because the main navigation is another nav landmark
       on the same page. -->
  <nav
    id="search-mode-tabs"
    data-testid="search-mode-tabs"
    aria-label="Search modes"
    class="flex gap-2 mx-6 mt-8 border-b border-surface-300-700"
  >
    {#each modes as mode (mode.id)}
      {@const active = mode.isActive(pathname)}
      <a
        id="search-mode-tab-{mode.id}"
        data-testid="search-mode-tab-{mode.id}"
        href={resolve(mode.route as '/')}
        aria-current={active ? 'page' : undefined}
        class="px-4 py-2 -mb-px border-b-2 {active
          ? 'border-surface-950-50 font-bold'
          : 'border-transparent opacity-60 hover:opacity-100'}"
      >
        {mode.label}
      </a>
    {/each}
  </nav>
{/if}
