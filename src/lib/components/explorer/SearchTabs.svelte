<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';

  import { showsSearchChrome } from '$lib/explorer/searchChrome';
  import { enabledSearchModes } from '$lib/explorer/searchModes';

  // Rendered by the /explorer and /discover layouts, which keep their own body to one tag.
  // Everything this needs comes from the URL, so it decides for itself whether to show.
  const pathname = $derived(page.url.pathname);
  const modes = $derived(enabledSearchModes(pathname));
  const activeIndex = $derived(modes.findIndex((mode) => mode.isActive(pathname)));

  // One mode is nothing to switch between: no bar on Discover, and none on an Explore
  // deployment with genomic search turned off.
  const visible = $derived(showsSearchChrome(pathname) && modes.length > 1);

  // Roving tabindex, per the ARIA tabs pattern. Sibling routes under the layout -
  // /explorer/advanced-filtering, say - match no tab at all, so the first tab holds the tab
  // stop there rather than the whole bar dropping out of the keyboard order.
  const tabStop = $derived(activeIndex === -1 ? 0 : activeIndex);

  let tabs: HTMLAnchorElement[] = $state([]);

  // Arrow keys move focus only. Activating on arrow would navigate on every keypress, which
  // is why the pattern's manual-activation variant is the right one for tabs that are routes.
  function moveFocus(event: KeyboardEvent, index: number) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    tabs[(index + step + modes.length) % modes.length]?.focus();
  }
</script>

{#if visible}
  <div
    id="search-mode-tabs"
    data-testid="search-mode-tabs"
    role="tablist"
    aria-label="Search mode"
    class="flex gap-2 mx-6 mt-8 border-b border-surface-300-700"
  >
    {#each modes as mode, index (mode.id)}
      {@const active = index === activeIndex}
      <!-- An anchor, not a button: these are routes, so middle-click, Copy Link and the
           browser back button all have to work. `as '/'` is the codebase's cast for a
           resolve() argument that is not a literal - resolve() is overloaded per route, so
           it rejects the union of them. -->
      <a
        bind:this={tabs[index]}
        id="search-mode-tab-{mode.id}"
        data-testid="search-mode-tab-{mode.id}"
        role="tab"
        href={resolve(mode.route as '/')}
        aria-selected={active}
        aria-current={active ? 'page' : undefined}
        tabindex={index === tabStop ? 0 : -1}
        class="px-4 py-2 -mb-px border-b-2 {active
          ? 'border-surface-950-50 font-bold'
          : 'border-transparent opacity-60 hover:opacity-100'}"
        onkeydown={(event) => moveFocus(event, index)}
      >
        {mode.label}
      </a>
    {/each}
  </div>
{/if}
