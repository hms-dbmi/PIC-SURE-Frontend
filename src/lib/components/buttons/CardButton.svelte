<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let title: string;
  export let icon: string = '';
  export let href: string = '';
  export let subtitle: string = '';
  export let size: 'sm' | 'md' | 'lg' | 'other' = 'lg';
  export let disabled: boolean = false;
  export let active: boolean = false;

  function onClick(event: MouseEvent) {
    dispatch('click', event);
  }
</script>

{#if href}
  <a
    {href}
    data-testid={$$props['data-testid']}
    aria-disabled={disabled || undefined}
    target={href.startsWith('/') ? undefined : '_blank'}
    class="card-btn {size !== 'other' ? 'card-btn-' + size : ''} {$$props.class ?? ''}"
    class:variant-ghost-primary={active}
    rel={disabled ? 'nofollow' : undefined}
    tabindex="0"
  >
    {#if icon}<i class="icon {icon}" />{/if}
    <div class="title">{title}</div>
    {#if subtitle && !['sm', 'md'].includes(size)}<div class="subtitle">{subtitle}</div>{/if}
  </a>
{:else}
  <button
    data-testid={$$props['data-testid']}
    type="button"
    class="card-btn {size !== 'other' ? 'card-btn-' + size : ''} {$$props.class ?? ''}"
    class:variant-ghost-primary={active}
    on:click={onClick}
    {disabled}
  >
    {#if icon}<i class="icon {icon}" />{/if}
    <div class="title">{title}</div>
    {#if subtitle && !['sm', 'md'].includes(size)}<div class="subtitle">{subtitle}</div>{/if}
  </button>
{/if}
