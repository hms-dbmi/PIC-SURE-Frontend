<script lang="ts">
  import { getModalStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();
</script>

{#if $modalStore[0]}
  {@const SvelteComponent = $modalStore[0].meta.component}
  <div class="card p-4 {$modalStore[0].meta.width || 'w-modal'} shadow-xl space-y-4">
    <header data-testid="modal-wrapper-header" class="text-2xl font-bold">
      {$modalStore[0].title || ''}
      <button class="float-right" onclick={() => modalStore.close()}>&times;</button>
    </header>
    <SvelteComponent />
  </div>
{/if}
