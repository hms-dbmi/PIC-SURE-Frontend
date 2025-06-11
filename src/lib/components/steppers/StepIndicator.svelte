<script lang="ts">
  import type { Step } from '$lib/types';

  const {
    steps = [],
    currentStep = 0,
    width = 'w-full',
    onStepClick,
  } = $props<{
    steps?: Step[];
    currentStep?: number;
    width?: string;
    onStepClick?: (step: Step, index: number) => void;
  }>();
</script>

<div
  class="flex flex-col items-center {width}"
  data-testid={`step-indicator-${steps[currentStep]?.label || 'container'}`}
>
  <div class="flex flex-start w-full" style="min-height:3.5rem;">
    {#each steps as step, i}
      <div class="flex {i < steps.length - 1 ? 'w-full' : ''}">
        <div class="w-24">
          <button
            type="button"
            aria-label={step.label}
            class="flex items-center justify-center bg-transparent border-none p-0 mx-auto my-2 focus:outline-none"
            onclick={() => onStepClick?.(step, i)}
          >
            <span
              class="flex items-center justify-center w-10 h-10 rounded-full border-2
              {i === currentStep
                ? 'bg-primary-500 border-primary-500 text-white cursor-default'
                : 'bg-surface-100 border-surface-300 text-surface-500'}"
            >
              <i class={`fa ${step.icon} text-xl`}></i>
            </span>
          </button>
          <div class="flex flex-col items-center w-full">
            <span
              class="text-sm font-semibold text-center break-words
              {i === currentStep ? 'text-primary-700' : 'text-surface-500'}"
            >
              {step.label}
            </span>
            {#if step.description}
              <span class="text-xs text-surface-400">{step.description}</span>
            {/if}
          </div>
        </div>
        {#if i < steps.length - 1}
          <div class="flex-1 h-0.5 mt-6 bg-surface-300"></div>
        {/if}
      </div>
    {/each}
  </div>
</div>
