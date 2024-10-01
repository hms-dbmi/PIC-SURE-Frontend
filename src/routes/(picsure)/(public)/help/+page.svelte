<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import CardButton from '$lib/components/buttons/CardButton.svelte';
  import { branding } from '$lib/configuration';
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

<svelte:head>
  <title>{branding.applicationName} | Help</title>
</svelte:head>
<Content title="Knowledge Hub">
  <section id="info-cards" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
    {#each branding?.help?.links as link}
      <CardButton
        data-testid="variant-explorer-btn"
        class="variant-ringed-primary"
        href={link.url}
        title={link.title}
        subtitle={link.description}
        icon="{link.icon} text-primary-500-400-token"
      />
    {/each}
  </section>
</Content>
