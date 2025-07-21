<script lang="ts">
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  interface Props {
    step: number;
    title?: string;
    collapsed?: boolean;
    show?: boolean;
    active?: boolean;
    showLine?: boolean;
    isFinal?: boolean;
    complete?: boolean;
    children?: import('svelte').Snippet;
  }

  let {
    step,
    title = '',
    collapsed = false,
    show = true,
    active = false,
    showLine = true,
    isFinal = false,
    complete = false,
    children,
  }: Props = $props();
</script>

{#if show}
  <div
    class="v-stepper mb-3 last:mb-0"
    transition:slide={{ duration: 300, easing: quintOut, axis: 'y' }}
  >
    <div
      data-testid={`v-stepper-step-${step}`}
      class="flex flex-row gap-2 my-2"
      aria-current={active ? 'step' : false}
    >
      <div class="flex flex-col gap-2 items-center">
        <button
          onclick={() => {
            collapsed = !collapsed;
          }}
        >
          <span class="badge rounded-2xl text-sm preset-filled-primary-500 h-fit mb-2"
            >Step {step}</span
          >
        </button>
        {#if showLine && !collapsed}
          <div class="border border-surface-200 h-[72%]"></div>
        {/if}
        {#if showLine && isFinal}
          <span
            class="badge rounded-2xl text-sm preset-filled-{complete
              ? 'primary'
              : 'surface'}-500 h-fit mb-2">Done</span
          >
        {/if}
      </div>
      <div class="flex-auto">
        {#if title}<h3 style="line-height: normal">{title}</h3>{/if}
        {#if !collapsed}
          <div class="h-full" transition:slide={{ duration: 300, easing: quintOut, axis: 'y' }}>
            {@render children?.()}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
