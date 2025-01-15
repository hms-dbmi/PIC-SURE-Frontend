<!-- @migration-task Error while migrating Svelte code: $$props is used together with named props in a way that cannot be automatically migrated. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  let {
    class: className,
    'data-testid': testId,
    title,
    icon = '',
    href = '',
    subtitle = '',
    size = 'lg',
    disabled = false,
    active = false,
  } = $props();

  function onClick(event: MouseEvent) {
    dispatch('click', event);
  }
</script>

{#if href}
  <a
    {href}
    data-testid={testId}
    aria-disabled={disabled || undefined}
    target={href.startsWith('/') ? undefined : '_blank'}
    class:variant-filled-primary={active}
    class:variant-ringed-primary={!active}
    class="card-btn {size !== 'other' ? 'card-btn-' + size : ''} {className ?? ''}"
    rel={disabled ? 'nofollow' : undefined}
    tabindex="0"
  >
    {#if icon}<i class="icon {icon}" />{/if}
    <div class="title">{title}</div>
    {#if subtitle && !['sm', 'md'].includes(size)}<div class="subtitle">{subtitle}</div>{/if}
  </a>
{:else}
  <button
    data-testid={testId}
    type="button"
    class:variant-filled-primary={active}
    class:variant-ringed-primary={!active}
    class="card-btn {size !== 'other' ? 'card-btn-' + size : ''} {className ?? ''}"
    on:click={onClick}
    {disabled}
  >
    {#if icon}<i class="icon {icon}" />{/if}
    <div class="title">{title}</div>
    {#if subtitle && !['sm', 'md'].includes(size)}<div class="subtitle">{subtitle}</div>{/if}
  </button>
{/if}
