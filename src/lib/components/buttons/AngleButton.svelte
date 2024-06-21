<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let href: string = '';

  export let angle: 'right' | 'left' = 'left';
  export let variant = 'ringed';
  export let color = 'primary';
  export let disabled = false;
  let clazz = '';
  export { clazz as class };
  export let name: string = '';

  const dispatch = createEventDispatcher();

  function onClick(event: MouseEvent) {
    dispatch('click', event);
  }

  $: iconStyle = `btn btn-sm variant-${variant}-${color} text-on-${color}-500`;
  const testid = name.replaceAll(' ', '-').toLowerCase() + '-btn';
</script>

{#if href}
  <a data-testid={testid} aria-disabled="{disabled}" class="text-{color}-500 &[aria-disabled=“true”]:opacity-75 text-lg {clazz}" rel={disabled ? "nofollow" : ""} {href}>
    {#if angle === 'left'}<i class="{iconStyle} fa-solid fa-angles-left mr-1"></i>{/if}
    <slot />
    {#if angle === 'right'}<i class="{iconStyle} fa-solid fa-angles-right ml-1"></i>{/if}
  </a>
{:else}
  <button
    data-testid={testid}
    type="button"
    class="text-{color}-500 text-lg disabled:opacity-75 {clazz}"
    on:click={onClick}
    {disabled}
  >
    {#if angle === 'left'}<i class="{iconStyle} fa-solid fa-angles-left mr-1"></i>{/if}
    <slot />
    {#if angle === 'right'}<i class="{iconStyle} fa-solid fa-angles-right ml-1"></i>{/if}
  </button>
{/if}
