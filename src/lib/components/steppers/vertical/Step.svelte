<script lang="ts">
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let step: number;
  export let title: string = '';
  export let collapsed: boolean = false;
  export let show: boolean = true;
  export let inline: boolean = false;
  export let active: boolean = false;
</script>

{#if show}
  <div
    class="v-stepper mb-3 last:mb-0"
    transition:slide={{ duration: 300, easing: quintOut, axis: 'y' }}
  >
    <div
      data-testid={`v-stepper-step-${step}`}
      class="flex gap-2 my-2"
      aria-current={active ? 'step' : false}
    >
      <div class="flex-none pt-1">
        <span
          class={`avatar flex aspect-square justify-center items-center overflow-hidden isolate w-8 rounded-full text-xl ${
            active ? 'variant-ghost-primary' : 'variant-ringed-primary'
          }`}>{step}</span
        >
      </div>
      {#if title}<div class={`flex-${inline ? 'none' : 'auto'}`}><h3>{title}</h3></div>{/if}
      {#if inline}<div class="flex-auto"><slot /></div>{/if}
    </div>
    {#if !inline && !collapsed}
      <div class="border rounded-md border-surface-500-400-token ml-4 p-1">
        <slot />
      </div>
    {/if}
  </div>
{/if}
