<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    header?: Snippet;
    sidebarRight?: Snippet;
    pageFooter?: Snippet;
    children?: Snippet;
  }

  const { header, sidebarRight, pageFooter, children }: Props = $props();
</script>

<div style="display: contents">
  <main class="w-full h-full">
    <div id="appShell" class="w-full h-full flex flex-col overflow-hidden" data-testid="app-shell">
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
