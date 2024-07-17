<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let icon: string;
  export let title: string;
  export let href: string = '';
  export let subtitle: string = '';
  export let size: 'sm' | 'md' | 'lg' = 'lg';
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
    class="card-btn card-btn-{size} {$$props.class ?? ''}"
    class:variant-ghost-primary={active}
    rel={disabled ? 'nofollow' : undefined}
    tabindex="0"
  >
    <i class="icon {icon}" />
    <div class="title">{title}</div>
    {#if subtitle && size === 'lg'}<div class="subtitle">{subtitle}</div>{/if}
  </a>
{:else}
  <button
    data-testid={$$props['data-testid']}
    type="button"
    class="card-btn card-btn-{size} {$$props.class ?? ''}"
    class:variant-ghost-primary={active}
    on:click={onClick}
    {disabled}
  >
    <i class="icon {icon}" />
    <div class="title">{title}</div>
    {#if subtitle && size === 'lg'}<div class="subtitle">{subtitle}</div>{/if}
  </button>
{/if}
