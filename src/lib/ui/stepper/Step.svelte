<script lang="ts">
  import { onDestroy, untrack, type Snippet } from 'svelte';
  import { fade } from 'svelte/transition';

  import { getStepper } from '#lib/ui/stepper/stepper.svelte.ts';
  import AngleButton from '#lib/ui/AngleButton.svelte';

  interface Props {
    name: string;
    locked?: boolean;
    header?: Snippet;
    children?: Snippet;
    navigation?: Snippet;
  }

  const { name, locked = false, header, children, navigation }: Props = $props();

  const stepper = getStepper();
  const stepperState = stepper.state;

  // A step keeps the name and index it registered with; renaming a mounted step isn't supported.
  const stepName = untrack(() => name);
  const stepIndex = stepperState.register(stepName);
  onDestroy(() => stepperState.unregister(stepName));
</script>

{#if stepIndex === stepperState.current}
  <div class="step space-y-4" data-testid="ui-stepper-step-{stepIndex + 1}">
    {#if header}<header class="step-header text-2xl font-bold">{@render header()}</header>{/if}
    <div class="step-content space-y-4 px-2">
      {#if children}{@render children()}{:else}(Step {stepIndex + 1} Content){/if}
    </div>
    {#if stepperState.total > 1}
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
          <AngleButton
            data-testid="ui-stepper-back"
            onclick={stepper.back}
            disabled={stepperState.current === 0}>Back</AngleButton
          >
        {:else}
          <div></div>
        {/if}
        {#if stepIndex < stepperState.total - 1}
          <AngleButton
            data-testid="ui-stepper-next"
            angle="right"
            variant="filled"
            disabled={locked}
            onclick={() => stepper.next(locked)}>Next</AngleButton
          >
        {:else}
          <AngleButton
            data-testid="ui-stepper-complete"
            angle="right"
            variant="filled"
            disabled={locked}
            onclick={() => stepper.complete(stepIndex, locked)}
            >{stepper.buttonCompleteLabel || 'Complete'}</AngleButton
          >
        {/if}
      </div>
    {/if}
  </div>
{/if}
