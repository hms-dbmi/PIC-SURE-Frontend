<script module lang="ts">
  import { Toaster, createToaster } from '@skeletonlabs/skeleton-svelte';
  import type { Toasts } from '#lib/ui/toaster.ts';

  const store = createToaster({ placement: 'top' });

  export const toaster: Toasts = store;

  export function isToastShowing(id: string): boolean {
    return store.getVisibleToasts().find((toast) => toast.id === id) !== undefined;
  }
</script>

<Toaster toaster={store} />
