<script lang="ts">
  import { getContext, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { Writable } from 'svelte/store';

  import AngleButton from '$lib/components/buttons/AngleButton.svelte';

  interface Props {
    locked?: boolean;
    buttonCompleteLabel?: string;
    state?: Writable<{ current: number; total: number }>;
    onNext?: (locked: boolean) => void;
    onBack?: () => void;
    onComplete?: (stepIndex: number, locked: boolean) => void;
    header?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
    navigation?: import('svelte').Snippet;
  }

  let {
    locked = false,
    buttonCompleteLabel = getContext('buttonCompleteLabel'),
    state = getContext('state'),
    onNext = getContext('onNext'),
    onBack = getContext('onBack'),
    onComplete = getContext('onComplete'),
    header,
    children,
    navigation,
  }: Props = $props();

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
      {@render header?.()}
    </header>
    <div class="step-content space-y-4 px-2">
      {#if children}{@render children()}{:else}(Step {stepIndex + 1} Content){/if}
    </div>
    {#if $state.total > 1}
      <div
        class="step-navigation flex justify-between gap-4"
        in:fade={{ duration: 100 }}
        out:fade={{ duration: 100 }}
      >
        {#if navigation}
          <div class="step-navigation-slot">
            {@render navigation?.()}
          </div>
        {:else if stepIndex !== 0}
          <AngleButton on:click={() => onBack()} disabled={$state.current === 0}>Back</AngleButton>
        {:else}
          <div></div>
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
