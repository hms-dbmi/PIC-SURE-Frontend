<script lang="ts">
  import { ProgressRadial, getModalStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();

  import { branding } from '$lib/configuration';

  let started: boolean = false;
  $: skipIntro = $modalStore[0]?.meta?.skipIntro || false;
  $: keyboardInstructions = $modalStore[0]?.meta?.keyboardInstructions || true;

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
        <button class="float-right" on:click={modalStore.close}>&times;</button>
      </header>
      <strong>{branding.explorePage.tourSearchIntro}</strong>
      {#if keyboardInstructions}
        <p>
          BioData Catalyst Powered by PIC-SURE allows you to explore variables, apply filters, and prepare data for analysis. When applying filters, participants are selected that meet those criteria.<br><br>
          This tour demonstrates how to search, apply filters, and interpret results using PIC-SURE.<br><br>
          Once the tour starts, you can click anywhere to go to the next step. You can press the escape key to stop the tour at any point. You may also use the arrow keys, enter key, or the spacebar to navigate the tour.
        </p>
      {/if}
      <div class="flex justify-between gap-4">
        <button
          data-testid="close-explorer-tour-btn"
          type="button"
          class="btn btn-sm variant-ghost-error text-lg"
          on:click={modalStore.close}>Cancel</button
        >
        <button
          data-testid="start-explorer-tour-btn"
          type="button"
          class="btn btn-sm variant-filled-primary text-lg"
          on:click={startTour}>Start Tour</button
        >
      </div>
    </section>
  {/if}
{/if}
