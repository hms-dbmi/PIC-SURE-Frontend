<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from '#lib/ui/Button.svelte';

  interface Props {
    /** Resolve internal paths first. */
    href?: string;
    angle?: 'right' | 'left';
    variant?: 'tonal' | 'filled';
    disabled?: boolean;
    'data-testid'?: string;
    class?: string;
    onclick?: () => void;
    children?: Snippet;
  }

  const {
    angle = 'left',
    variant = 'tonal',
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  const variants = { tonal: 'soft', filled: 'filled' } as const;
</script>

<Button
  {...rest}
  variant={variants[variant]}
  size="sm"
  class="h-fit border disabled:opacity-75 {className}"
>
  {#if angle === 'left'}<i class="fa-solid fa-arrow-left mr-3"></i>{/if}
  {@render children?.()}
  {#if angle === 'right'}<i class="fa-solid fa-arrow-right ml-3"></i>{/if}
</Button>
