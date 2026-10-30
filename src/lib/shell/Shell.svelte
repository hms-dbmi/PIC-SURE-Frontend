<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import { config } from '#lib/config/config.svelte.ts';
  import { ACCESS, requiresLogin } from '#lib/auth/access.ts';
  import { session } from '#lib/auth/session.svelte.ts';

  interface Props {
    header?: Snippet;
    sidebarRight?: Snippet;
    pageFooter?: Snippet;
    children?: Snippet;
  }

  // The session is read untracked: when it ends, the logout navigates to /login, and hiding the
  // shell first would blank the page, leaving nothing to click if another tab signed out.
  let showShell = $derived(
    !requiresLogin(ACCESS.app, config.features) || untrack(() => session.isLoggedIn),
  );

  const { header, sidebarRight, pageFooter, children }: Props = $props();
</script>

{#if showShell}
  <div class="contents">
    <main class="w-full h-full">
      <div
        id="app-shell"
        class="w-full h-full flex flex-col overflow-hidden"
        data-testid="app-shell"
      >
        {@render header?.()}
        <div class="flex-auto w-full h-full flex overflow-hidden">
          <div id="app-page" class="flex-1 overflow-x-hidden flex flex-col">
            <main id="app-page-content" class="flex-auto">
              {@render children?.()}
            </main>
            <footer id="app-page-footer" class="flex-none">
              {@render pageFooter?.()}
            </footer>
          </div>
          {@render sidebarRight?.()}
        </div>
      </div>
    </main>
  </div>
{/if}
