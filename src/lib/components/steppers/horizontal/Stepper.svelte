<script lang="ts">
  import { setContext } from 'svelte';
  import { fade } from 'svelte/transition';
  import { stepperState } from '$lib/stores/Stepper';
  import type { StepperState } from '$lib/models/Stepper';

  type StepMethod = (step: number, name: string, state: StepperState) => void;
  const defaultStep: StepMethod = () => {};

  interface Props {
    buttonCompleteLabel: string;
    class?: string;
    onnext?: StepMethod;
    onback?: StepMethod;
    oncomplete?: StepMethod;
    children?: import('svelte').Snippet;
  }

  const {
    buttonCompleteLabel = '',
    class: className = '',
    onnext = defaultStep,
    onback = defaultStep,
    oncomplete = defaultStep,
    children,
  }: Props = $props();

  async function _onNext(locked: boolean) {
    // Allows any forms to submit before the Step is removed from the DOM:
    // https://github.com/skeletonlabs/skeleton/issues/1328
    await new Promise((resolve) => setTimeout(resolve));

    if (locked) return;
    const step = $stepperState.current + 1;
    const name = $stepperState.stepMap[step];
    onnext(step, name, $stepperState);

    $stepperState.current = step;
  }

  function _onBack() {
    const step = $stepperState.current === 0 ? 0 : $stepperState.current - 1;
    const name = $stepperState.stepMap[step];
    onback(step, name, $stepperState);
    $stepperState.current = step;
  }

  function _onComplete(stepIndex: number, locked: boolean) {
    if (locked) return;

    oncomplete(stepIndex, $stepperState.stepMap[stepIndex], $stepperState);
  }

  function isActive(step: number) {
    return step === $stepperState.current;
  }

  setContext('buttonCompleteLabel', buttonCompleteLabel);
  setContext('StepperState', stepperState);
  setContext('onBack', _onBack);
  setContext('onNext', _onNext);
  setContext('onComplete', _onComplete);
</script>

<div class="stepper space-y-4 {className}" data-testid="stepper">
  {#if $stepperState.total}
    <header
      class="stepper-header flex items-center border-t mt-[15px] mb-7 border-surface-500 gap-4"
      in:fade={{ duration: 100 }}
      out:fade={{ duration: 100 }}
    >
      {#each Array.from(Array($stepperState.total).keys()) as step}
        <div
          class="stepper-header-step -mt-[15px] transition-all duration-300"
          class:flex-1={isActive(step)}
        >
          <span
            data-testid="step-{$stepperState.stepMap[step]}"
            class="badge rounded-2xl text-sm {isActive(step)
              ? 'preset-filled-primary-500'
              : 'preset-filled-surface-500'}">{isActive(step) ? `Step ${step + 1}` : step + 1}</span
          >
        </div>
      {/each}
    </header>
  {/if}
  <div class="stepper-content">
    {@render children?.()}
  </div>
</div>
