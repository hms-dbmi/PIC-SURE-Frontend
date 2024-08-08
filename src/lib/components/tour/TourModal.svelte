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
      {branding.explorePage.tourSearchIntro}
      {#if keyboardInstructions}
        <p>
          Once the tour starts you can click anywhere or press the escape key to stop the tour at
          any point. You may also use the right key to move to the next step during the tour or
          navigate within the tour with tab, spacebar, and enter keys.
        </p>
      {/if}
      <div class="flex justify-between gap-4">
        <button
          data-testid="close-explorer-tour-btn"
          type="button"
          class="btn btn-sm variant-filled-surface text-lg"
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
