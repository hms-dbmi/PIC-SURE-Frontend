<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { isExternalHref } from '#lib/ui/button.ts';

  interface Props {
    title: string;
    id?: string;
    icon?: string;
    /** Resolve internal paths first; external links open in a new tab. */
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
    href,
    subtitle = '',
    size = 'lg',
    active = false,
    class: className = '',
    ...rest
  }: Props = $props();

  const sizes = { sm: 'card-btn-sm', md: 'card-btn-md', lg: 'card-btn-lg', other: '' };
</script>

<Button
  {...rest}
  {href}
  target={href && isExternalHref(href) ? '_blank' : undefined}
  variant={active ? 'filled' : 'none'}
  size="none"
  class="card card-btn {sizes[size]} {className}"
>
  {#if icon}<i class="icon {icon}"></i>{/if}
  <div class="title">{title}</div>
  {#if subtitle && !['sm', 'md'].includes(size)}<div class="subtitle">{subtitle}</div>{/if}
</Button>
