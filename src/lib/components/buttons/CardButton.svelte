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
    'aria-label'?: string;
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
    'aria-label': ariaLabel = '',
  }: Props = $props();

  const cardClasses = `card card-btn ${size !== 'other' ? 'card-btn-' + size : ''} ${className} hover:scale-110 hover:shadow-lg`;
</script>

{#if href}
  <a
    {href}
    data-testid={testid}
    aria-disabled={disabled || undefined}
    aria-label={ariaLabel || undefined}
    target={href.startsWith('/') ? undefined : '_blank'}
    class={cardClasses}
    class:preset-filled-primary-500={active}
    class:preset-outlined-primary-500={!active}
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
    class={cardClasses}
    class:preset-filled-primary-500={active}
    class:preset-outlined-primary-500={!active}
    {onclick}
    {disabled}
    aria-label={ariaLabel || undefined}
  >
    {#if icon}<i class="icon {icon}"></i>{/if}
    <div class="title">{title}</div>
    {#if subtitle && !['sm', 'md'].includes(size)}<div class="subtitle">{subtitle}</div>{/if}
  </button>
{/if}
