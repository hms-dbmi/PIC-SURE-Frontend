<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let href: string = '';

  export let angle: 'right' | 'left' = 'left';
  export let variant = 'filled';
  export let color = 'primary';
  export let disabled = false;
  export let name: string = '';

  const dispatch = createEventDispatcher();

  function onClick(event: MouseEvent) {
    dispatch('click', event);
  }

  $: btnStyle = `btn btn-sm variant-${variant}-${color} text-lg`;
  const testid = $$props['data-testid'] || name.replaceAll(' ', '-').toLowerCase() + '-btn';
</script>

{#if href}
  <a
    data-testid={testid}
    aria-disabled={disabled}
    class="{btnStyle} &[aria-disabled=“true”]:opacity-75 {$$props.class || ''}"
    rel={disabled ? 'nofollow' : ''}
    {href}
  >
    {#if angle === 'left'}<i class="fa-solid fa-arrow-left mr-3"></i>{/if}
    <slot />
    {#if angle === 'right'}<i class="fa-solid fa-arrow-right ml-3"></i>{/if}
  </a>
{:else}
  <button
    data-testid={testid}
    type="button"
    class="{btnStyle} disabled:opacity-75 {$$props.class || ''}"
    on:click={onClick}
    {disabled}
  >
    {#if angle === 'left'}<i class="fa-solid fa-arrow-left mr-3"></i>{/if}
    <slot />
    {#if angle === 'right'}<i class="fa-solid fa-arrow-right ml-3"></i>{/if}
  </button>
{/if}
