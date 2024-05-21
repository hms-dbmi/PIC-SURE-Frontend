<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let href: string = '';

  export let angle: 'right' | 'left' = 'left';
  export let variant = 'ringed';
  export let color = 'primary';
  export let disabled = false;
  let clazz = '';
  export { clazz as class };

  const dispatch = createEventDispatcher();

  function onClick(event: MouseEvent) {
    dispatch('click', event);
  }

  $: iconStyle = `btn btn-sm variant-${variant}-${color} text-on-${color}-500`;
</script>

{#if href}
  <a class="text-{color}-500 font-bold {clazz}" {href}>
    {#if angle === 'left'}<i class="{iconStyle} fa-solid fa-angles-left mr-1"></i>{/if}
    <slot />
    {#if angle === 'right'}<i class="{iconStyle} fa-solid fa-angles-right ml-1"></i>{/if}
  </a>
{:else}
  <button
    type="button"
    class="btn text-{color}-500 font-bold {clazz}"
    on:click={onClick}
    {disabled}
  >
    {#if angle === 'left'}<i class="{iconStyle} fa-solid fa-angles-left mr-1"></i>{/if}
    <slot />
    {#if angle === 'right'}<i class="{iconStyle} fa-solid fa-angles-right ml-1"></i>{/if}
  </button>
{/if}
