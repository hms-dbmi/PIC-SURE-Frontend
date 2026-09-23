<script lang="ts">
  import { untrack } from 'svelte';
  import { access, ensureAccess } from '$lib/state/access.svelte';
  import { isToastShowing, toaster } from '$lib/toaster';

  $effect(() => {
    const state = access.state;
    untrack(() => {
      if (state.status === 'error') {
        if (!isToastShowing('access-unavailable')) {
          toaster.error({
            id: 'access-unavailable',
            title: state.error.message,
            closable: true,
          });
        }
      } else {
        toaster.dismiss('access-unavailable');
      }
    });
  });
</script>

{#if access.state.status === 'error'}
  <div class="flex items-center justify-center gap-3 p-3">
    <span>Study access could not be loaded.</span>
    <button
      class="btn preset-outlined-primary-500"
      onclick={() => void ensureAccess({ retry: true }).catch(() => {})}
    >
      Retry access
    </button>
  </div>
{/if}
