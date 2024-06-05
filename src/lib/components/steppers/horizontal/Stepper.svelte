<script lang="ts">
  import { createEventDispatcher, setContext } from 'svelte';
  import { fade } from 'svelte/transition';
  import { type Writable, writable } from 'svelte/store';

  export let startStep: number = 0;
  export let buttonCompleteLabel = '';
  setContext('buttonCompleteLabel', buttonCompleteLabel);

  interface StepperState {
    current: number;
    total: number;
  }
  const state: Writable<StepperState> = writable({ current: startStep, total: 0 });
  setContext('state', state);

  type StepperEvent = {
    cancel: { state: StepperState };
    complete: { step: number; state: StepperState };
  };
  const dispatch = createEventDispatcher<StepperEvent>();
  async function onNext(locked: boolean) {
    // Allows any forms to submit before the Step is removed from the DOM:
    // https://github.com/skeletonlabs/skeleton/issues/1328
    await new Promise((resolve) => setTimeout(resolve));

    if (locked) return;
    $state.current++;
  }
  function onBack() {
    $state.current = $state.current === 1 ? 0 : $state.current - 1;
  }
  function onComplete(stepIndex: number, locked: boolean) {
    if (locked) return;

    dispatch('complete', { step: stepIndex, state: $state });
  }
  setContext('onBack', onBack);
  setContext('onNext', onNext);
  setContext('onComplete', onComplete);

  $: isActive = (step: number) => step === $state.current;
</script>

<div class="stepper space-y-4 {$$props.class ?? ''}" data-testid="stepper">
  {#if $state.total}
    <header
      class="stepper-header flex items-center border-t mt-[15px] border-surface-400-500-token gap-4"
      in:fade={{ duration: 100 }}
      out:fade={{ duration: 100 }}
    >
      {#each Array.from(Array($state.total).keys()) as step}
        <div
          class="stepper-header-step -mt-[15px] transition-all duration-300"
          class:flex-1={isActive(step)}
        >
          <span class="badge {isActive(step) ? 'variant-filled-primary' : 'variant-filled-surface'}"
            >{isActive(step) ? `Step ${step + 1}` : step + 1}</span
          >
        </div>
      {/each}
    </header>
  {/if}
  <div class="stepper-content">
    <slot />
  </div>
</div>
