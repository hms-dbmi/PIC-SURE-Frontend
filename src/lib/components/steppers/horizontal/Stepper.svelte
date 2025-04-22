<!-- @migration-task Error while migrating Svelte code: $$props is used together with named props in a way that cannot be automatically migrated. -->
<script lang="ts">
  import { createEventDispatcher, setContext } from 'svelte';
  import { fade } from 'svelte/transition';
  import { state } from '$lib/stores/Stepper';
  import type { StepperEvent } from '$lib/models/Stepper';

  export let buttonCompleteLabel = '';
  setContext('buttonCompleteLabel', buttonCompleteLabel);

  setContext('state', state);

  const dispatch = createEventDispatcher<StepperEvent>();
  async function onNext(locked: boolean) {
    // Allows any forms to submit before the Step is removed from the DOM:
    // https://github.com/skeletonlabs/skeleton/issues/1328
    await new Promise((resolve) => setTimeout(resolve));

    if (locked) return;
    const step = $state.current + 1;
    const name = $state.stepMap[step];
    dispatch('next', { step, name, state: $state });
    $state.current = step;
  }
  function onBack() {
    const step = $state.current === 0 ? 0 : $state.current - 1;
    const name = $state.stepMap[step];
    dispatch('back', { step, name, state: $state });
    $state.current = step;
  }
  function onComplete(stepIndex: number, locked: boolean) {
    if (locked) return;

    dispatch('complete', { step: stepIndex, name: $state.stepMap[stepIndex], state: $state });
  }
  setContext('onBack', onBack);
  setContext('onNext', onNext);
  setContext('onComplete', onComplete);

  $: isActive = (step: number) => step === $state.current;
</script>

<div class="stepper space-y-4 {$$props.class ?? ''}" data-testid="stepper">
  {#if $state.total}
    <header
      class="stepper-header flex items-center border-t mt-[15px] mb-7 border-surface-400-500-token gap-4"
      in:fade={{ duration: 100 }}
      out:fade={{ duration: 100 }}
    >
      {#each Array.from(Array($state.total).keys()) as step}
        <div
          class="stepper-header-step -mt-[15px] transition-all duration-300"
          class:flex-1={isActive(step)}
        >
          <span
            data-testid="step-{$state.stepMap[step]}"
            class="badge text-sm {isActive(step)
              ? 'variant-filled-primary'
              : 'variant-filled-surface'}">{isActive(step) ? `Step ${step + 1}` : step + 1}</span
          >
        </div>
      {/each}
    </header>
  {/if}
  <div class="stepper-content">
    <slot />
  </div>
</div>
