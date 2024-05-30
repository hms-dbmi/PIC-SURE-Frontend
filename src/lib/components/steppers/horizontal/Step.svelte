<script lang="ts">
  import { getContext, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { Writable } from 'svelte/store';

  import AngleButton from '$lib/components/buttons/AngleButton.svelte';

  export let title = '';
  export let locked = false;
  export let buttonCompleteLabel: string = getContext('buttonCompleteLabel');

  export let state: Writable<{ current: number; total: number }> = getContext('state');

  export let onNext: (locked: boolean) => void = getContext('onNext');
  export let onBack: () => void = getContext('onBack');
  export let onComplete: (stepIndex: number, locked: boolean) => void = getContext('onComplete');

  // Register step on init (keep these paired)
  const stepIndex = $state.total;
  $state.total++;

  onDestroy(() => {
    $state.total--;
  });
</script>

{#if stepIndex === $state.current}
  <div class="step space-y-4" data-testid="step-{stepIndex + 1}">
    <header class="step-header text-2xl font-bold">
      <slot name="header">{title || 'Step ' + (stepIndex + 1)}</slot>
    </header>
    <div class="step-content space-y-4 px-2">
      <slot>(Step {stepIndex + 1} Content)</slot>
    </div>
    {#if $state.total > 1}
      <div
        class="step-navigation flex justify-between gap-4"
        in:fade={{ duration: 100 }}
        out:fade={{ duration: 100 }}
      >
        {#if stepIndex === 0 && $$slots.navigation}
          <div class="step-navigation-slot">
            <slot name="navigation" />
          </div>
        {:else}
          <AngleButton on:click={() => onBack()} disabled={$state.current === 0}>Back</AngleButton>
        {/if}
        {#if stepIndex < $state.total - 1}
          <AngleButton
            name="next"
            angle="right"
            variant="filled"
            disabled={locked}
            on:click={() => onNext(locked)}>Next</AngleButton
          >
        {:else}
          <AngleButton
            name={buttonCompleteLabel || 'complete'}
            angle="right"
            variant="filled"
            disabled={locked}
            on:click={() => onComplete(stepIndex, locked)}
            >{buttonCompleteLabel || 'Complete'}</AngleButton
          >
        {/if}
      </div>
    {/if}
  </div>
{/if}
