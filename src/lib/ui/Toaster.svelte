<script lang="ts">
  import { Toaster } from '@skeletonlabs/skeleton-svelte';
  import { toastStore } from '#lib/ui/toaster.ts';
</script>

<!-- Renders the toasts raised through `toaster` from #lib/ui/toaster.ts. -->
<Toaster toaster={toastStore} />
