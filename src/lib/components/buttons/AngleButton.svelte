<!-- @migration-task Error while migrating Svelte code: $$props is used together with named props in a way that cannot be automatically migrated. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  let {
    class: className,
    'data-testid': testId,
    href = '',
    angle = 'left',
    variant = 'filled',
    color = 'primary',
    disabled = false,
    name = '',
  } = $props();

  const dispatch = createEventDispatcher();

  function onClick(event: MouseEvent) {
    dispatch('click', event);
  }

  const btnStyle = $derived(
    `btn btn-sm h-fit variant-${variant}-${color} ${
      variant !== 'filled' ? `hover:variant-filled-${color}` : ''
    } text-lg`,
  );

  const finalTestId = $derived(testId || name.replaceAll(' ', '-').toLowerCase() + '-btn');
</script>

{#if href}
  <a
    data-testid={finalTestId}
    aria-disabled={disabled}
    class="{btnStyle} &[aria-disabled='true']:opacity-75 {className || ''}"
    rel={disabled ? 'nofollow' : ''}
    {href}
  >
    {#if angle === 'left'}<i class="fa-solid fa-arrow-left mr-3"></i>{/if}
    <slot />
    {#if angle === 'right'}<i class="fa-solid fa-arrow-right ml-3"></i>{/if}
  </a>
{:else}
  <button
    data-testid={finalTestId}
    type="button"
    class="{btnStyle} disabled:opacity-75 {className || ''}"
    on:click={onClick}
    {disabled}
  >
    {#if angle === 'left'}<i class="fa-solid fa-arrow-left mr-3"></i>{/if}
    <slot />
    {#if angle === 'right'}<i class="fa-solid fa-arrow-right ml-3"></i>{/if}
  </button>
{/if}
