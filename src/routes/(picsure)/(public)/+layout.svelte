<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { hasInvalidFilter, hasGenomicFilter, hasUnallowedFilter } from '$lib/stores/Filter.ts';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import FilterWarning from '$lib/components/FilterWarning.svelte';

  const modalStore = getModalStore();

  beforeNavigate((nav) => {
    console.log(nav);
    if ($hasInvalidFilter && nav?.to?.url.pathname.includes('/explorer')) {
      modalStore.trigger({
        type: 'component',
        component: 'modalWrapper',
        meta: { component: FilterWarning, width: 'w-3/4' },
      });
    } else if (($hasGenomicFilter || $hasUnallowedFilter) && nav?.to?.url.pathname.includes('/discover')) {
      modalStore.trigger({
          type: 'component',
          component: 'modalWrapper',
          meta: { component: FilterWarning, width: 'w-3/4' },
        });
      }
  });
</script>