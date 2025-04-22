<script lang="ts">
  interface Props {
    title: string;
    icon?: string;
    href?: string;
    subtitle?: string;
    size?: 'sm' | 'md' | 'lg' | 'other';
    disabled?: boolean;
    active?: boolean;
    'data-testid'?: string;
    class?: string;
    onclick?: () => void;
  }

  const {
    title,
    icon = '',
    href = '',
    subtitle = '',
    size = 'lg',
    disabled = false,
    active = false,
    'data-testid': testid = '',
    class: className = '',
    onclick = () => {},
  }: Props = $props();
</script>

{#if href}
  <a
    {href}
    data-testid={testid}
    aria-disabled={disabled || undefined}
    target={href.startsWith('/') ? undefined : '_blank'}
    class:variant-filled-primary={active}
    class:variant-ringed-primary={!active}
    class="card-btn {size !== 'other' ? 'card-btn-' + size : ''} {className}"
    rel={disabled ? 'nofollow' : undefined}
    tabindex="0"
  >
    {#if icon}<i class="icon {icon}"></i>{/if}
    <div class="title">{title}</div>
    {#if subtitle && !['sm', 'md'].includes(size)}<div class="subtitle">{subtitle}</div>{/if}
  </a>
{:else}
  <button
    data-testid={testid}
    type="button"
    class:variant-filled-primary={active}
    class:variant-ringed-primary={!active}
    class="card-btn {size !== 'other' ? 'card-btn-' + size : ''} {className}"
    {onclick}
    {disabled}
  >
    {#if icon}<i class="icon {icon}"></i>{/if}
    <div class="title">{title}</div>
    {#if subtitle && !['sm', 'md'].includes(size)}<div class="subtitle">{subtitle}</div>{/if}
  </button>
{/if}
