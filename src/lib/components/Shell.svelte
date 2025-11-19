<script lang="ts">
  import type { Snippet } from 'svelte';
  import { config } from '$lib/configuration.svelte';
  import { isUserLoggedIn } from '$lib/stores/User';

  interface Props {
    header?: Snippet;
    sidebarRight?: Snippet;
    pageFooter?: Snippet;
    children?: Snippet;
  }

  let showShell = $derived(
    config.features.login.open || (!config.features.login.open && isUserLoggedIn()),
  );

  const { header, sidebarRight, pageFooter, children }: Props = $props();
</script>

{#if showShell}
  <div style="display: contents">
    <main class="w-full h-full">
      <div
        id="appShell"
        class="w-full h-full flex flex-col overflow-hidden"
        data-testid="app-shell"
      >
        {@render header?.()}
        <div class="flex-auto w-full h-full flex overflow-hidden">
          <div id="page" class="flex-1 overflow-x-hidden flex flex-col">
            <main id="page-content" class="flex-auto">
              {@render children?.()}
            </main>
            <footer id="page-footer" class="flex-none">
              {@render pageFooter?.()}
            </footer>
          </div>
          {@render sidebarRight?.()}
        </div>
      </div>
    </main>
  </div>
{/if}
