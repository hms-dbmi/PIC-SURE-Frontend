<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade } from 'svelte/transition';
  import { StepperState, setStepper } from '#lib/ui/stepper/stepper.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import { tones } from '#lib/ui/surface.ts';

  type StepMethod = (step: number, name: string, state: StepperState) => void;
  const defaultStep: StepMethod = () => {};

  interface Props {
    buttonCompleteLabel: string;
    class?: string;
    onnext?: StepMethod;
    onback?: StepMethod;
    oncomplete?: StepMethod;
    children?: Snippet;
  }

  const {
    buttonCompleteLabel = '',
    class: className = '',
    onnext = defaultStep,
    onback = defaultStep,
    oncomplete = defaultStep,
    children,
  }: Props = $props();

  const stepperState = new StepperState();

  async function next(locked: boolean) {
    // Allows any forms to submit before the Step is removed from the DOM:
    // https://github.com/skeletonlabs/skeleton/issues/1328
    await new Promise((resolve) => setTimeout(resolve));

    if (locked) return;
    const step = stepperState.current + 1;
    const name = stepperState.stepMap[step];
    log(createLog('EXPORT', 'export.stepper_next', { step, stepName: name }));
    onnext(step, name, stepperState);

    stepperState.current = step;
  }

  function back() {
    const step = stepperState.current === 0 ? 0 : stepperState.current - 1;
    const name = stepperState.stepMap[step];
    log(createLog('EXPORT', 'export.stepper_back', { step, stepName: name }));
    onback(step, name, stepperState);
    stepperState.current = step;
  }

  function complete(stepIndex: number, locked: boolean) {
    if (locked) return;

    oncomplete(stepIndex, stepperState.stepMap[stepIndex], stepperState);
  }

  function isActive(step: number) {
    return step === stepperState.current;
  }

  setStepper({
    state: stepperState,
    get buttonCompleteLabel() {
      return buttonCompleteLabel;
    },
    next,
    back,
    complete,
  });
</script>

<div class="stepper space-y-4 {className}" data-testid="ui-stepper">
  {#if stepperState.total}
    <header
      class="stepper-header flex items-center border-t mt-[15px] mb-7 border-surface-500 gap-4"
      in:fade={{ duration: 100 }}
      out:fade={{ duration: 100 }}
    >
      {#each Array.from(Array(stepperState.total).keys()) as step (step)}
        <div
          class="stepper-header-step -mt-[15px] transition-all duration-300"
          class:flex-1={isActive(step)}
        >
          <span
            data-testid="ui-stepper-step-{stepperState.stepMap[step]}"
            class="badge rounded-2xl text-sm {isActive(step)
              ? tones['filled-primary']
              : tones['filled-surface']}">{isActive(step) ? `Step ${step + 1}` : step + 1}</span
          >
        </div>
      {/each}
    </header>
  {/if}
  <div class="stepper-content">
    {@render children?.()}
  </div>
</div>
