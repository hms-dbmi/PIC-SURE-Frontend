<script lang="ts">
  import { ProgressRadial, getModalStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();

  let started: boolean = $state(false);
  let skipIntro = $derived($modalStore[0]?.meta?.skipIntro || false);
  let keyboardInstructions = $derived($modalStore[0]?.meta?.keyboardInstructions || true);

  
  interface Props {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    tourConfig: any;
  }

  let { tourConfig }: Props = $props();

  function startTour() {
    started = true;
    $modalStore[0].response && $modalStore[0].response(true);
  }
</script>

{#if $modalStore[0]}
  {#if skipIntro || started}
    <section
      data-testid="modal-loading"
      class="w-full h-full flex flex-col justify-center items-center"
    >
      <ProgressRadial width="w-20" value={undefined} />
    </section>
  {:else}
    <section data-testid="modal" class="card p-4 w-modal shadow-xl space-y-4">
      <header data-testid="modal-wrapper-header" class="text-2xl font-bold">
        <button class="float-right" onclick={modalStore.close}>&times;</button>
      </header>
      <strong>{tourConfig?.title}</strong>
      {#if keyboardInstructions}
        <p>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html tourConfig?.description}
        </p>
      {/if}
      <div class="flex justify-between gap-4">
        <button
          data-testid="close-explorer-tour-btn"
          type="button"
          class="btn btn-sm variant-ghost-error text-lg"
          onclick={modalStore.close}>Cancel</button
        >
        <button
          data-testid="start-explorer-tour-btn"
          type="button"
          class="btn btn-sm variant-filled-primary text-lg"
          onclick={startTour}>Start Tour</button
        >
      </div>
    </section>
  {/if}
{/if}
