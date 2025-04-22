<script lang="ts">
  import { getContext, onDestroy, type Snippet } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { Writable } from 'svelte/store';

  import type { StepperState } from '$lib/models/Stepper';
  import AngleButton from '$lib/components/buttons/AngleButton.svelte';

  interface Props {
    name: string;
    locked?: boolean;
    header?: Snippet;
    children?: Snippet;
    navigation?: Snippet;
  }

  const { name, locked = false, header, children, navigation }: Props = $props();

  const buttonCompleteLabel: string = getContext('buttonCompleteLabel');
  const stepperState: Writable<StepperState> = getContext('StepperState');
  const onNext: (locked: boolean) => void = getContext('onNext');
  const onBack: () => void = getContext('onBack');
  const onComplete: (stepIndex: number, locked: boolean) => void = getContext('onComplete');

  // Register step on init (keep these paired)
  const stepIndex = $stepperState.total;
  $stepperState.stepMap = [...$stepperState.stepMap, name];
  $stepperState.total++;

  onDestroy(() => {
    $stepperState.total--;
    $stepperState.stepMap = $stepperState.stepMap.filter((item) => item !== name);
  });
</script>

{#if stepIndex === $stepperState.current}
  <div class="step space-y-4" data-testid="step-{stepIndex + 1}">
    {#if header}<header class="step-header text-2xl font-bold">{@render header()}</header>{/if}
    <div class="step-content space-y-4 px-2">
      {#if children}{@render children()}{:else}(Step {stepIndex + 1} Content){/if}
    </div>
    {#if $stepperState.total > 1}
      <div
        class="step-navigation flex justify-between gap-4"
        in:fade={{ duration: 100 }}
        out:fade={{ duration: 100 }}
      >
        {#if navigation}
          <div class="step-navigation-slot">
            {@render navigation()}
          </div>
        {:else if stepIndex !== 0}
          <AngleButton onclick={onBack} disabled={$stepperState.current === 0}>Back</AngleButton>
        {:else}
          <div></div>
        {/if}
        {#if stepIndex < $stepperState.total - 1}
          <AngleButton
            name="next"
            angle="right"
            variant="filled"
            disabled={locked}
            onclick={() => onNext(locked)}>Next</AngleButton
          >
        {:else}
          <AngleButton
            name={buttonCompleteLabel || 'complete'}
            angle="right"
            variant="filled"
            disabled={locked}
            onclick={() => onComplete(stepIndex, locked)}
            >{buttonCompleteLabel || 'Complete'}</AngleButton
          >
        {/if}
      </div>
    {/if}
  </div>
{/if}
