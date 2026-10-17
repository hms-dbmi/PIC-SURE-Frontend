<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade } from 'svelte/transition';
  import { StepperState, setStepper } from '#lib/ui/stepper/stepper.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

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

  const stepper = new StepperState();

  async function next(locked: boolean) {
    // Allows any forms to submit before the Step is removed from the DOM:
    // https://github.com/skeletonlabs/skeleton/issues/1328
    await new Promise((resolve) => setTimeout(resolve));

    if (locked) return;
    const step = stepper.current + 1;
    const name = stepper.stepMap[step];
    log(createLog('EXPORT', 'export.stepper_next', { step, stepName: name }));
    onnext(step, name, stepper);

    stepper.current = step;
  }

  function back() {
    const step = stepper.current === 0 ? 0 : stepper.current - 1;
    const name = stepper.stepMap[step];
    log(createLog('EXPORT', 'export.stepper_back', { step, stepName: name }));
    onback(step, name, stepper);
    stepper.current = step;
  }

  function complete(stepIndex: number, locked: boolean) {
    if (locked) return;

    oncomplete(stepIndex, stepper.stepMap[stepIndex], stepper);
  }

  function isActive(step: number) {
    return step === stepper.current;
  }

  setStepper({
    state: stepper,
    get buttonCompleteLabel() {
      return buttonCompleteLabel;
    },
    next,
    back,
    complete,
  });
</script>

<div class="stepper space-y-4 {className}" data-testid="ui-stepper">
  {#if stepper.total}
    <header
      class="stepper-header flex items-center border-t mt-[15px] mb-7 border-surface-500 gap-4"
      in:fade={{ duration: 100 }}
      out:fade={{ duration: 100 }}
    >
      {#each Array.from(Array(stepper.total).keys()) as step (step)}
        <div
          class="stepper-header-step -mt-[15px] transition-all duration-300"
          class:flex-1={isActive(step)}
        >
          <span
            data-testid="ui-stepper-step-{stepper.stepMap[step]}"
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
